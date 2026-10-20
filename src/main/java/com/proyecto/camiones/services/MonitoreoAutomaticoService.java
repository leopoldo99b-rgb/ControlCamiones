package com.proyecto.camiones.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.proyecto.camiones.model.MonitoreoParada;
import com.proyecto.camiones.model.MonitoreoRecorrido;
import com.proyecto.camiones.model.MonitoreoViaje;
import com.proyecto.camiones.model.PuntoPlanta;
import com.proyecto.camiones.repository.MonitoreoParadaRepository;
import com.proyecto.camiones.repository.MonitoreoRecorridoRepository;
import com.proyecto.camiones.repository.MonitoreoViajeRepository;

import tools.jackson.databind.JsonNode;

/**
 * Cada minuto consulta VTracker y, para cada viaje "En curso":
 *  1) guarda el recorrido (puntos GPS),
 *  2) abre una parada cuando la unidad se detiene,
 *  3) cierra la parada cuando vuelve a moverse,
 *  4) finaliza el viaje cuando se detiene dentro del radio del destino.
 */
@Service
public class MonitoreoAutomaticoService {

    private static final Logger log =
            LoggerFactory.getLogger(MonitoreoAutomaticoService.class);

    private static final String EN_CURSO = "En curso";
    private static final String FINALIZADO = "Finalizado";
    private static final String PARADA_ABIERTA = "En curso";
    private static final String PARADA_CERRADA = "Cerrada";

    @Value("${monitoreo.velocidad-parada-kmh:3}")
    private double velocidadParada;

    @Value("${monitoreo.parada-minima-minutos:3}")
    private long paradaMinimaMinutos;

    @Value("${monitoreo.radio-punto-metros:200}")
    private double radioPuntoMetros;

    @Value("${monitoreo.distancia-minima-recorrido-metros:25}")
    private double distanciaMinimaRecorrido;

    private final VTrackerFleetService flota;
    private final MonitoreoViajeRepository viajeRepo;
    private final MonitoreoParadaRepository paradaRepo;
    private final MonitoreoRecorridoRepository recorridoRepo;
    private final TransactionTemplate tx;

    public MonitoreoAutomaticoService(
            VTrackerFleetService flota,
            MonitoreoViajeRepository viajeRepo,
            MonitoreoParadaRepository paradaRepo,
            MonitoreoRecorridoRepository recorridoRepo,
            TransactionTemplate tx) {
        this.flota = flota;
        this.viajeRepo = viajeRepo;
        this.paradaRepo = paradaRepo;
        this.recorridoRepo = recorridoRepo;
        this.tx = tx;
    }

    @Scheduled(
            fixedDelayString = "${monitoreo.intervalo-ms:60000}",
            initialDelay = 15_000)
    public void ejecutar() {
        List<MonitoreoViaje> activos = viajeRepo.findByEstado(EN_CURSO);

        if (activos.isEmpty()) {
            return;
        }

        Map<String, JsonNode> porVehiculo = new HashMap<>();

        try {
            for (JsonNode tracker : flota.consultarVehiculos().path("trackers")) {
                String id = GpsUtil.texto(tracker, "Vehicle_ID");
                if (id != null) {
                    porVehiculo.put(id, tracker);
                }
            }
        } catch (Exception e) {
            log.warn("No se pudo consultar VTracker: {}", e.getMessage());
            return;
        }

        for (MonitoreoViaje viaje : activos) {
            JsonNode tracker = porVehiculo.get(viaje.getIdVehiculoGps());

            if (tracker == null) {
                continue;
            }

            try {
                // Una transacción por viaje: si uno falla, los demás siguen.
                tx.executeWithoutResult(
                        status -> procesar(viaje.getIdViaje(), tracker));
            } catch (Exception e) {
                log.error("Error monitoreando el viaje {}", viaje.getIdViaje(), e);
            }
        }
    }

    private void procesar(Integer idViaje, JsonNode tracker) {
        MonitoreoViaje viaje = viajeRepo.findById(idViaje).orElse(null);

        if (viaje == null || !EN_CURSO.equals(viaje.getEstado())) {
            return;
        }

        Double lat = GpsUtil.numero(tracker, "Tracker_Latitude", "latitude", "lat");
        Double lng = GpsUtil.numero(tracker, "Tracker_Longitude", "longitude", "lng", "lon");
        Double velocidad = GpsUtil.numero(tracker, "Tracker_Speed", "speed");

        if (!GpsUtil.coordenadasValidas(lat, lng)) {
            return;
        }

        LocalDateTime ahora = LocalDateTime.now();

        guardarRecorrido(viaje, lat, lng, velocidad, ahora);

        if (velocidad == null) {
            return; // Sin velocidad no se puede decidir si está detenido.
        }

        boolean detenido = velocidad < velocidadParada;

        Optional<MonitoreoParada> abierta = paradaRepo
                .findFirstByViaje_IdViajeAndFechaHoraFinIsNullOrderByNumeroParadaDesc(
                        idViaje);

        if (!detenido) {
            abierta.ifPresent(p -> cerrarParada(p, ahora));
            return;
        }

        if (cerca(viaje.getPuntoDestino(), lat, lng)) {
            abierta.ifPresent(p -> cerrarParada(p, ahora));
            viaje.setEstado(FINALIZADO);
            viaje.setFechaFin(ahora);
            viajeRepo.save(viaje);
            log.info("Viaje {} finalizado: llegó al destino.", idViaje);
            return;
        }

        // Detenido en el origen (cargando): no es una parada del recorrido.
        if (cerca(viaje.getPuntoOrigen(), lat, lng)) {
            return;
        }

        if (abierta.isEmpty()) {
            abrirParada(viaje, lat, lng, ahora);
        }
    }

    private void guardarRecorrido(
            MonitoreoViaje viaje, double lat, double lng,
            Double velocidad, LocalDateTime ahora) {

        Optional<MonitoreoRecorrido> ultimo = recorridoRepo
                .findFirstByViaje_IdViajeOrderByFechaHoraDesc(viaje.getIdViaje());

        boolean guardar = ultimo.isEmpty()
                || GpsUtil.distanciaMetros(
                        ultimo.get().getLatitud(), ultimo.get().getLongitud(),
                        lat, lng) >= distanciaMinimaRecorrido;

        if (!guardar) {
            return;
        }

        MonitoreoRecorrido punto = new MonitoreoRecorrido();
        punto.setViaje(viaje);
        punto.setFechaHora(ahora);
        punto.setLatitud(lat);
        punto.setLongitud(lng);
        punto.setVelocidad(velocidad);
        recorridoRepo.save(punto);
    }

    private void abrirParada(
            MonitoreoViaje viaje, double lat, double lng, LocalDateTime ahora) {

        MonitoreoParada parada = new MonitoreoParada();
        parada.setViaje(viaje);
        parada.setNumeroParada(
                (int) paradaRepo.countByViaje_IdViaje(viaje.getIdViaje()) + 1);
        parada.setFechaHoraInicio(ahora);
        parada.setLatitud(BigDecimal.valueOf(lat).setScale(7, RoundingMode.HALF_UP));
        parada.setLongitud(BigDecimal.valueOf(lng).setScale(7, RoundingMode.HALF_UP));
        parada.setEstado(PARADA_ABIERTA);
        // motivo = null: lo escribe el usuario después.
        paradaRepo.save(parada);
    }

    private void cerrarParada(MonitoreoParada parada, LocalDateTime ahora) {
        long minutos = Duration.between(parada.getFechaHoraInicio(), ahora).toMinutes();

        // Semáforos, tráfico, etc.: no cuentan como parada.
        if (minutos < paradaMinimaMinutos) {
            paradaRepo.delete(parada);
            return;
        }

        parada.setFechaHoraFin(ahora);
        parada.setEstado(PARADA_CERRADA);
        paradaRepo.save(parada);
    }

    private boolean cerca(PuntoPlanta punto, double lat, double lng) {
        return punto != null
                && GpsUtil.distanciaMetros(
                        punto.getLatitud(), punto.getLongitud(), lat, lng)
                        <= radioPuntoMetros;
    }
}
