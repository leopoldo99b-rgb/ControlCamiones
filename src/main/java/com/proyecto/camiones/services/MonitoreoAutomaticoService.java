package com.proyecto.camiones.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

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
 * Un viaje = ida + retorno. Cada ciclo consulta VTracker y avanza el viaje:
 *
 *  PROGRAMADO  -> la unidad sale del radio del origen            -> EN CURSO (ida)
 *  EN CURSO    -> la unidad llega y se detiene en el destino     -> EN DESTINO
 *  EN DESTINO  -> la unidad sale del radio del destino           -> EN RETORNO
 *  EN RETORNO  -> la unidad llega y se detiene en el origen      -> FINALIZADO
 *
 * HORAS: todas las horas son las que reporta el GPS (Tracker_Datetime), convertidas
 *        a hora de Honduras. Solo si el GPS no trae hora se usa el reloj del servidor.
 *        La zona en la que VTracker envía su hora se configura con vtracker.zona-horaria.
 *
 * Recorrido: se guarda en la ida y en el retorno (no mientras está en destino),
 *            cada punto con su fase (IDA / RETORNO) para dibujar dos líneas distintas.
 * Paradas:   se controlan en la ida y en el retorno (inicio, fin, duración y fase).
 *            No cuentan las detenciones dentro del radio del origen o del destino,
 *            ni las menores a monitoreo.parada-minima-minutos.
 */
@Service
public class MonitoreoAutomaticoService {

    private static final Logger log =
            LoggerFactory.getLogger(MonitoreoAutomaticoService.class);

    public static final String PROGRAMADO = "Programado";
    public static final String EN_CURSO = "En curso";       // ida
    public static final String EN_DESTINO = "En destino";
    public static final String EN_RETORNO = "En retorno";
    public static final String FINALIZADO = "Finalizado";

    public static final String FASE_IDA = "IDA";
    public static final String FASE_RETORNO = "RETORNO";

    private static final List<String> ACTIVOS =
            List.of(PROGRAMADO, EN_CURSO, EN_DESTINO, EN_RETORNO);

    private static final String PARADA_ABIERTA = "En curso";
    private static final String PARADA_CERRADA = "Cerrada";

    /** Campos donde VTracker puede traer la hora del último reporte del GPS. */
    private static final String[] CAMPOS_HORA = {
            "Tracker_Datetime", "Tracker_DateTime", "Tracker_Date_Time",
            "datetime", "date", "timestamp"
    };

    /** Velocidad máxima creíble entre dos puntos guardados (km/h); más es un salto de GPS. */
    private static final double VELOCIDAD_MAX_CREIBLE_KMH = 160;

    /** Cuántos descartes seguidos se toleran antes de aceptar el punto (por si el primero fue el erróneo). */
    private static final int DESCARTES_MAX = 3;

    @Value("${monitoreo.velocidad-parada-kmh:3}")
    private double velocidadParada;

    @Value("${monitoreo.parada-minima-minutos:3}")
    private long paradaMinimaMinutos;

    /** Radio de respaldo para los puntos que no tienen uno propio. */
    @Value("${monitoreo.radio-punto-metros:200}")
    private double radioPuntoMetros;

    @Value("${monitoreo.distancia-minima-recorrido-metros:25}")
    private double distanciaMinimaRecorrido;

    /** Distancia máxima del origen para detectar la salida cuando no se vio a la unidad dentro. */
    @Value("${monitoreo.distancia-max-salida-metros:3000}")
    private double distanciaMaxSalida;

    /** Datos del GPS más viejos que esto (minutos) se ignoran: la unidad está sin señal. */
    @Value("${monitoreo.dato-maximo-minutos:30}")
    private long datoMaximoMinutos;

    /**
     * Zona horaria en la que VTracker escribe Tracker_Datetime cuando NO trae
     * zona explícita. Si la hora del GPS sale desfasada, cambia este valor
     * (UTC o America/Tegucigalpa).
     */
    @Value("${vtracker.zona-horaria:America/Tegucigalpa}")
    private String zonaVtracker;

    /** Viajes programados cuya unidad ya fue vista dentro del radio del origen (en memoria). */
    private final Map<Integer, Boolean> dentroOrigen = new ConcurrentHashMap<>();

    /** Última distancia al origen de cada viaje programado (para saber si se aleja). */
    private final Map<Integer, Double> distAnteriorOrigen = new ConcurrentHashMap<>();

    /** Hora (GPS) de la última lectura procesada de cada viaje: evita procesar dos veces el mismo reporte. */
    private final Map<Integer, Instant> ultimaLectura = new ConcurrentHashMap<>();

    /** Descartes seguidos de puntos con salto imposible, por viaje. */
    private final Map<Integer, Integer> descartes = new ConcurrentHashMap<>();

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
        List<MonitoreoViaje> activos = viajeRepo.findByEstadoIn(ACTIVOS);

        if (activos.isEmpty()) {
            return;
        }

        Map<String, JsonNode> porVehiculo = new HashMap<>();
        Instant referencia;

        try {
            JsonNode respuesta = flota.consultarVehiculos();
            referencia = referencia(respuesta);

            for (JsonNode tracker : respuesta.path("trackers")) {
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
                        status -> procesar(viaje.getIdViaje(), tracker, referencia));
            } catch (Exception e) {
                log.error("Error monitoreando el viaje {}", viaje.getIdViaje(), e);
            }
        }
    }

    /** Hora de VTracker al responder (querytime, epoch). Sirve para saber si un dato es viejo. */
    private Instant referencia(JsonNode respuesta) {
        String q = GpsUtil.texto(respuesta, "querytime");

        if (q != null) {
            try {
                long n = Long.parseLong(q.trim());
                return n > 100_000_000_000L
                        ? Instant.ofEpochMilli(n) : Instant.ofEpochSecond(n);
            } catch (NumberFormatException ignorado) {
                // se usa el reloj local
            }
        }
        return Instant.now();
    }

    private void procesar(Integer idViaje, JsonNode tracker, Instant referencia) {
        MonitoreoViaje viaje = viajeRepo.findById(idViaje).orElse(null);

        if (viaje == null || !ACTIVOS.contains(viaje.getEstado())) {
            return;
        }

        Double lat = GpsUtil.numero(tracker, "Tracker_Latitude", "latitude", "lat");
        Double lng = GpsUtil.numero(tracker, "Tracker_Longitude", "longitude", "lng", "lon");
        Double velocidad = GpsUtil.numero(tracker, "Tracker_Speed", "speed");

        if (!GpsUtil.coordenadasValidas(lat, lng)) {
            return;
        }

        // ---- Hora: la del GPS, en hora de Honduras ----
        LocalDateTime ahora;
        Instant horaGps = GpsUtil.instante(
                tracker, ZoneId.of(zonaVtracker), CAMPOS_HORA);

        if (horaGps != null) {
            long antiguedadMin = Duration.between(horaGps, referencia).toMinutes();

            if (antiguedadMin < -5) {
                log.warn("Viaje {}: la hora del GPS ({}) está en el futuro respecto a VTracker ({}). "
                        + "Revisa vtracker.zona-horaria.", idViaje, horaGps, referencia);
                return;
            }

            if (antiguedadMin > datoMaximoMinutos) {
                log.debug("Viaje {}: dato del GPS de hace {} min, sin señal; se ignora.",
                        idViaje, antiguedadMin);
                return;
            }

            Instant anterior = ultimaLectura.get(idViaje);
            if (anterior != null && !horaGps.isAfter(anterior)) {
                return; // mismo reporte que ya se procesó
            }
            ultimaLectura.put(idViaje, horaGps);

            ahora = LocalDateTime.ofInstant(horaGps, ZonaHoraria.HONDURAS);
        } else {
            log.warn("Viaje {}: el GPS no trae hora; se usa el reloj del servidor.", idViaje);
            ahora = ZonaHoraria.ahora();
        }

        switch (viaje.getEstado()) {
            case PROGRAMADO -> esperarSalida(viaje, lat, lng, velocidad, ahora);
            case EN_CURSO -> procesarIda(viaje, tracker, lat, lng, velocidad, ahora);
            case EN_DESTINO -> esperarSalidaDestino(viaje, lat, lng, velocidad, ahora);
            case EN_RETORNO -> procesarRetorno(viaje, tracker, lat, lng, velocidad, ahora);
            default -> { }
        }
    }

    /**
     * PROGRAMADO: arranca cuando la unidad, vista antes dentro del radio del
     * origen, ya está fuera de él. Respaldo: si nunca se vio dentro (reinicio,
     * cruzó entre dos consultas) pero está en movimiento, cerca del origen y
     * alejándose, también arranca. La hora real de salida reemplaza a la hora
     * que se escribió al programar.
     */
    private void esperarSalida(
            MonitoreoViaje viaje, double lat, double lng,
            Double velocidad, LocalDateTime ahora) {

        Integer id = viaje.getIdViaje();
        PuntoPlanta origen = viaje.getPuntoOrigen();

        if (origen == null) {
            return;
        }

        double distancia = GpsUtil.distanciaMetros(
                origen.getLatitud(), origen.getLongitud(), lat, lng);

        if (distancia <= radioDe(origen)) {
            dentroOrigen.put(id, true);
            distAnteriorOrigen.remove(id);
            return;
        }

        Double anterior = distAnteriorOrigen.put(id, distancia);
        boolean vistaDentro = Boolean.TRUE.equals(dentroOrigen.get(id));

        // Respaldo: no se vio dentro, pero ya está en movimiento, cerca del
        // origen y ALEJÁNDOSE de él (no llegando).
        boolean seAleja = anterior != null
                && distancia > anterior + 50
                && distancia <= distanciaMaxSalida
                && velocidad != null && velocidad >= velocidadParada;

        if (!vistaDentro && !seAleja) {
            return;
        }

        dentroOrigen.remove(id);
        distAnteriorOrigen.remove(id);
        viaje.setEstado(EN_CURSO);
        viaje.setFechaInicio(ahora);
        viajeRepo.save(viaje);
        guardarRecorrido(viaje, lat, lng, velocidad, ahora, FASE_IDA);
        log.info("Viaje {} iniciado: la unidad salió del origen.", id);
    }

    /** EN CURSO (ida): guarda el recorrido, controla paradas y detecta la llegada al destino. */
    private void procesarIda(
            MonitoreoViaje viaje, JsonNode tracker, double lat, double lng,
            Double velocidad, LocalDateTime ahora) {

        guardarRecorrido(viaje, lat, lng, velocidad, ahora, FASE_IDA);

        boolean detenido = velocidad != null && velocidad < velocidadParada;

        if (detenido && cerca(viaje.getPuntoDestino(), lat, lng)) {
            paradaRepo
                    .findFirstByViaje_IdViajeAndFechaHoraFinIsNullOrderByNumeroParadaDesc(
                            viaje.getIdViaje())
                    .ifPresent(p -> cerrarParada(p, ahora));

            viaje.setEstado(EN_DESTINO);
            viaje.setFechaLlegadaDestino(ahora);
            viajeRepo.save(viaje);
            log.info("Viaje {}: la unidad llegó al destino.", viaje.getIdViaje());
            return;
        }

        controlarParadas(viaje, tracker, lat, lng, velocidad, ahora, FASE_IDA);
    }

    /** EN DESTINO: la unidad está estacionada. Cuando sale del radio empieza el retorno. */
    private void esperarSalidaDestino(
            MonitoreoViaje viaje, double lat, double lng,
            Double velocidad, LocalDateTime ahora) {

        if (cerca(viaje.getPuntoDestino(), lat, lng)) {
            return;
        }

        viaje.setEstado(EN_RETORNO);
        viaje.setFechaSalidaDestino(ahora);
        viajeRepo.save(viaje);
        guardarRecorrido(viaje, lat, lng, velocidad, ahora, FASE_RETORNO);
        log.info("Viaje {}: la unidad salió del destino, inicia el retorno.",
                viaje.getIdViaje());
    }

    /** EN RETORNO: guarda recorrido, controla paradas y finaliza al llegar al origen. */
    private void procesarRetorno(
            MonitoreoViaje viaje, JsonNode tracker, double lat, double lng,
            Double velocidad, LocalDateTime ahora) {

        guardarRecorrido(viaje, lat, lng, velocidad, ahora, FASE_RETORNO);

        boolean detenido = velocidad != null && velocidad < velocidadParada;

        if (detenido && cerca(viaje.getPuntoOrigen(), lat, lng)) {
            paradaRepo
                    .findFirstByViaje_IdViajeAndFechaHoraFinIsNullOrderByNumeroParadaDesc(
                            viaje.getIdViaje())
                    .ifPresent(p -> cerrarParada(p, ahora));

            viaje.setEstado(FINALIZADO);
            viaje.setFechaFin(ahora);
            viajeRepo.save(viaje);
            limpiarMemoria(viaje.getIdViaje());
            log.info("Viaje {} finalizado: la unidad regresó al origen.",
                    viaje.getIdViaje());
            return;
        }

        controlarParadas(viaje, tracker, lat, lng, velocidad, ahora, FASE_RETORNO);
    }

    /**
     * Abre o cierra paradas (ida y retorno). Una detención dentro del radio del
     * origen o del destino (carga, descarga, estacionamiento) no es una parada.
     */
    private void controlarParadas(
            MonitoreoViaje viaje, JsonNode tracker, double lat, double lng,
            Double velocidad, LocalDateTime ahora, String fase) {

        if (velocidad == null) {
            return; // Sin velocidad no se puede decidir si está detenido.
        }

        Optional<MonitoreoParada> abierta = paradaRepo
                .findFirstByViaje_IdViajeAndFechaHoraFinIsNullOrderByNumeroParadaDesc(
                        viaje.getIdViaje());

        if (velocidad >= velocidadParada) {
            abierta.ifPresent(p -> cerrarParada(p, ahora));
            return;
        }

        if (abierta.isPresent()) {
            return; // sigue la misma parada
        }

        if (cerca(viaje.getPuntoOrigen(), lat, lng)
                || cerca(viaje.getPuntoDestino(), lat, lng)) {
            return;
        }

        abrirParada(viaje, lat, lng, lugar(tracker, lat, lng), ahora, fase);
    }

    private void guardarRecorrido(
            MonitoreoViaje viaje, double lat, double lng,
            Double velocidad, LocalDateTime ahora, String fase) {

        Integer id = viaje.getIdViaje();

        Optional<MonitoreoRecorrido> ultimo = recorridoRepo
                .findFirstByViaje_IdViajeOrderByFechaHoraDesc(id);

        if (ultimo.isPresent()) {
            MonitoreoRecorrido u = ultimo.get();

            double distancia = GpsUtil.distanciaMetros(
                    u.getLatitud(), u.getLongitud(), lat, lng);

            // Poco movimiento: no se guarda.
            if (distancia < distanciaMinimaRecorrido) {
                return;
            }

            // Deriva del GPS con la unidad estacionada: no se guarda.
            if (velocidad != null && velocidad < velocidadParada && distancia < 60) {
                return;
            }

            // Salto imposible (GPS erróneo): se descarta, salvo que se repita.
            double segundos = Math.max(1,
                    Duration.between(u.getFechaHora(), ahora).getSeconds());
            double kmh = distancia / segundos * 3.6;

            if (kmh > VELOCIDAD_MAX_CREIBLE_KMH) {
                int n = descartes.merge(id, 1, Integer::sum);
                if (n < DESCARTES_MAX) {
                    return;
                }
            }
            descartes.remove(id);
        }

        MonitoreoRecorrido punto = new MonitoreoRecorrido();
        punto.setViaje(viaje);
        punto.setFechaHora(ahora);
        punto.setLatitud(lat);
        punto.setLongitud(lng);
        punto.setVelocidad(velocidad);
        punto.setFase(fase);
        recorridoRepo.save(punto);
    }

    private void abrirParada(
            MonitoreoViaje viaje, double lat, double lng,
            String lugar, LocalDateTime ahora, String fase) {

        MonitoreoParada parada = new MonitoreoParada();
        parada.setViaje(viaje);
        parada.setNumeroParada(
                (int) paradaRepo.countByViaje_IdViaje(viaje.getIdViaje()) + 1);
        parada.setFechaHoraInicio(ahora);
        parada.setLatitud(BigDecimal.valueOf(lat).setScale(7, RoundingMode.HALF_UP));
        parada.setLongitud(BigDecimal.valueOf(lng).setScale(7, RoundingMode.HALF_UP));
        parada.setEstado(PARADA_ABIERTA);
        parada.setFase(fase);
        parada.setObservaciones(lugar); // dónde se detuvo
        // motivo = null: lo escribe el usuario después.
        paradaRepo.save(parada);
    }

    /** Dirección que reporta VTracker o, si no viene, las coordenadas. */
    private String lugar(JsonNode tracker, double lat, double lng) {
        String direccion = GpsUtil.texto(
                tracker, "Tracker_Location", "address", "location");

        String texto = direccion != null
                ? direccion
                : String.format(Locale.US, "Lat %.6f, Lng %.6f", lat, lng);

        return texto.length() > 500 ? texto.substring(0, 500) : texto;
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

    private void limpiarMemoria(Integer idViaje) {
        dentroOrigen.remove(idViaje);
        distAnteriorOrigen.remove(idViaje);
        ultimaLectura.remove(idViaje);
        descartes.remove(idViaje);
    }

    /** Radio del punto; si no tiene uno propio, el general de application.properties. */
    private double radioDe(PuntoPlanta punto) {
        Double r = punto.getRadioMetros();
        return (r != null && r > 0) ? r : radioPuntoMetros;
    }

    private boolean cerca(PuntoPlanta punto, double lat, double lng) {
        return punto != null
                && GpsUtil.distanciaMetros(
                        punto.getLatitud(), punto.getLongitud(), lat, lng)
                        <= radioDe(punto);
    }
}