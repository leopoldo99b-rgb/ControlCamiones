package com.proyecto.camiones.services;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.proyecto.camiones.model.MonitoreoParada;
import com.proyecto.camiones.model.MonitoreoViaje;
import com.proyecto.camiones.model.PuntoPlanta;
import com.proyecto.camiones.model.TipoPunto;
import com.proyecto.camiones.repository.MonitoreoParadaRepository;
import com.proyecto.camiones.repository.MonitoreoRecorridoRepository;
import com.proyecto.camiones.repository.MonitoreoViajeRepository;
import com.proyecto.camiones.repository.PuntoPlantaRepository;

import dto.MonitoreoDtos.ParadaResponse;
import dto.MonitoreoDtos.PuntoRecorridoResponse;
import dto.MonitoreoDtos.ReporteViajeResponse;
import dto.MonitoreoDtos.RutaResponse;
import dto.MonitoreoDtos.ViajeRequest;
import dto.MonitoreoDtos.ViajeResponse;
import tools.jackson.databind.JsonNode;

@Service
public class MonitoreoViajeService {

    private static final Logger log =
            LoggerFactory.getLogger(MonitoreoViajeService.class);

    private static final String EN_CURSO = "En curso";
    private static final String FINALIZADO = "Finalizado";
    private static final int MAX_VIAJES_REPORTE = 500;

    private final MonitoreoViajeRepository viajeRepo;
    private final MonitoreoParadaRepository paradaRepo;
    private final MonitoreoRecorridoRepository recorridoRepo;
    private final PuntoPlantaRepository puntoRepo;
    private final VTrackerFleetService flota;

    public MonitoreoViajeService(
            MonitoreoViajeRepository viajeRepo,
            MonitoreoParadaRepository paradaRepo,
            MonitoreoRecorridoRepository recorridoRepo,
            PuntoPlantaRepository puntoRepo,
            VTrackerFleetService flota) {
        this.viajeRepo = viajeRepo;
        this.paradaRepo = paradaRepo;
        this.recorridoRepo = recorridoRepo;
        this.puntoRepo = puntoRepo;
        this.flota = flota;
    }

    // Sin @Transactional a propósito: consulta HTTP a VTracker + save().
    public ViajeResponse iniciar(ViajeRequest r) {
        if (r == null) {
            throw new IllegalArgumentException("El cuerpo de la solicitud es obligatorio.");
        }

        // --- ID del viaje ingresado por el usuario ---------------------
        if (r.idViaje() == null || r.idViaje() <= 0) {
            throw new IllegalArgumentException(
                    "El ID del viaje es obligatorio y debe ser un número mayor que cero.");
        }

        // Importante: con un ID asignado a mano, save() ACTUALIZARÍA el viaje
        // si el ID ya existe. Por eso se valida antes de guardar.
        if (viajeRepo.existsById(r.idViaje())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un viaje con el ID " + r.idViaje() + ".");
        }
        // ----------------------------------------------------------------

        if (r.idVehiculoGps() == null || r.idVehiculoGps().isBlank()) {
            throw new IllegalArgumentException("Debes seleccionar una unidad GPS.");
        }
        if (r.origenId() == null || r.destinoId() == null) {
            throw new IllegalArgumentException("Debes seleccionar origen y destino.");
        }

        PuntoPlanta origen = puntoRepo.findByIdAndActivoTrue(r.origenId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "El origen seleccionado no existe o está inactivo."));

        PuntoPlanta destino = puntoRepo.findByIdAndActivoTrue(r.destinoId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "El destino seleccionado no existe o está inactivo."));

        if (origen.getTipo() != TipoPunto.ORIGEN
                || destino.getTipo() != TipoPunto.DESTINO) {
            throw new IllegalArgumentException(
                    "El origen debe ser de tipo ORIGEN y el destino de tipo DESTINO.");
        }

        String idVehiculo = r.idVehiculoGps().trim();

        if (viajeRepo.existsByIdVehiculoGpsAndEstado(idVehiculo, EN_CURSO)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esa unidad ya tiene un viaje en curso.");
        }

        JsonNode unidad = buscarUnidad(idVehiculo);

        String nombre = GpsUtil.texto(unidad, "Vehicle_Name", "vehicle_name", "name");
        String placa = GpsUtil.texto(unidad, "Vehicle_Plate", "vehicle_plate", "plate");
        String conductor = GpsUtil.texto(unidad,
                "Driver_Name", "DriverName", "driver_name", "Driver", "Conductor");

        String etiqueta = (nombre != null ? nombre : "Unidad " + idVehiculo)
                + " | " + (placa != null ? placa : "Sin placa")
                + " | " + (conductor != null ? conductor : "Sin conductor asignado");

        MonitoreoViaje viaje = new MonitoreoViaje();
        viaje.setIdViaje(r.idViaje());
        viaje.setIdVehiculoGps(idVehiculo);
        viaje.setConductorUnidad(
                etiqueta.length() > 250 ? etiqueta.substring(0, 250) : etiqueta);
        viaje.setPuntoOrigen(origen);
        viaje.setPuntoDestino(destino);
        viaje.setOrigen(origen.getNombre());
        viaje.setDestino(destino.getNombre());
        viaje.setFechaInicio(
                r.fechaSalida() != null ? r.fechaSalida() : LocalDateTime.now());
        viaje.setFechaFin(null);
        viaje.setEstado(EN_CURSO);

        MonitoreoViaje guardado;

        try {
            guardado = viajeRepo.save(viaje);
        } catch (DataIntegrityViolationException e) {
            // Cubre la carrera de dos usuarios guardando el mismo ID a la vez
            // (la clave primaria de la BD lo rechaza).
            log.warn("No se pudo guardar el viaje {}: {}",
                    r.idViaje(), e.getMostSpecificCause().getMessage());
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se pudo guardar el viaje. El ID " + r.idViaje()
                            + " ya existe o hay datos no válidos.");
        }

        return aViaje(guardado);
    }

    @Transactional(readOnly = true)
    public List<ViajeResponse> listar() {
        return viajeRepo.findAll(Sort.by(Sort.Direction.DESC, "fechaInicio"))
                .stream()
                .limit(100)
                .map(this::aViaje)
                .toList();
    }

    @Transactional(readOnly = true)
    public RutaResponse ruta(Integer idViaje) {
        MonitoreoViaje viaje = obtener(idViaje);

        List<PuntoRecorridoResponse> recorrido = recorridoRepo
                .findByViaje_IdViajeOrderByFechaHoraAsc(idViaje).stream()
                .map(p -> new PuntoRecorridoResponse(
                        p.getFechaHora(), p.getLatitud(),
                        p.getLongitud(), p.getVelocidad()))
                .toList();

        List<ParadaResponse> paradas = paradaRepo
                .findByViaje_IdViajeOrderByNumeroParadaAsc(idViaje).stream()
                .map(this::aParada)
                .toList();

        return new RutaResponse(aViaje(viaje), recorrido, paradas);
    }

    /** Viajes cuya fecha de inicio cae en el rango, cada uno con sus paradas. */
    @Transactional(readOnly = true)
    public List<ReporteViajeResponse> reporte(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null) {
            throw new IllegalArgumentException(
                    "Debes indicar la fecha inicial y la final.");
        }
        if (hasta.isBefore(desde)) {
            throw new IllegalArgumentException(
                    "La fecha final no puede ser anterior a la inicial.");
        }

        List<MonitoreoViaje> viajes = viajeRepo
                .findByFechaInicioGreaterThanEqualAndFechaInicioLessThanOrderByFechaInicioAsc(
                        desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay());

        if (viajes.size() > MAX_VIAJES_REPORTE) {
            throw new IllegalArgumentException(
                    "Ese rango tiene " + viajes.size() + " viajes (máximo "
                    + MAX_VIAJES_REPORTE + "). Acorta las fechas.");
        }

        return viajes.stream()
                .map(v -> new ReporteViajeResponse(
                        aViaje(v),
                        paradaRepo.findByViaje_IdViajeOrderByNumeroParadaAsc(v.getIdViaje())
                                .stream()
                                .map(this::aParada)
                                .toList()))
                .toList();
    }

    @Transactional
    public ParadaResponse actualizarMotivo(Integer idParada, String motivo) {
        if (motivo == null || motivo.isBlank() || motivo.trim().length() > 300) {
            throw new IllegalArgumentException(
                    "El motivo es obligatorio y admite hasta 300 caracteres.");
        }

        MonitoreoParada parada = paradaRepo.findById(idParada)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No se encontró la parada " + idParada));

        parada.setMotivo(motivo.trim());
        return aParada(paradaRepo.save(parada));
    }

    @Transactional
    public ViajeResponse finalizar(Integer idViaje) {
        MonitoreoViaje viaje = obtener(idViaje);

        if (FINALIZADO.equals(viaje.getEstado())) {
            return aViaje(viaje);
        }

        LocalDateTime ahora = LocalDateTime.now();

        paradaRepo.findFirstByViaje_IdViajeAndFechaHoraFinIsNullOrderByNumeroParadaDesc(idViaje)
                .ifPresent(p -> {
                    p.setFechaHoraFin(ahora);
                    p.setEstado("Cerrada");
                    paradaRepo.save(p);
                });

        viaje.setEstado(FINALIZADO);
        viaje.setFechaFin(ahora);
        return aViaje(viajeRepo.save(viaje));
    }

    /**
     * Elimina el viaje junto con todo su recorrido y todas sus paradas.
     * Todo ocurre en una sola transacción: o se borra todo o no se borra nada.
     */
    @Transactional
    public void eliminar(Integer idViaje) {
        MonitoreoViaje viaje = obtener(idViaje);

        // Primero los hijos (recorrido y paradas) y al final el viaje.
        recorridoRepo.deleteAll(
                recorridoRepo.findByViaje_IdViajeOrderByFechaHoraAsc(idViaje));
        paradaRepo.deleteAll(
                paradaRepo.findByViaje_IdViajeOrderByNumeroParadaAsc(idViaje));

        try {
            viajeRepo.delete(viaje);
            viajeRepo.flush(); // fuerza el DELETE aquí para poder capturar el error
        } catch (DataIntegrityViolationException e) {
            log.warn("No se pudo eliminar el viaje {}: {}",
                    idViaje, e.getMostSpecificCause().getMessage());
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se pudo eliminar el viaje porque otro registro depende de él "
                    + "o el monitoreo automático lo estaba actualizando. Inténtalo de nuevo.");
        }

        log.info("Viaje {} eliminado con su recorrido y sus paradas.", idViaje);
    }

    // ---------------------------------------------------------

    private MonitoreoViaje obtener(Integer id) {
        return viajeRepo.findById(id).orElseThrow(() ->
                new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No se encontró el viaje " + id));
    }

    private JsonNode buscarUnidad(String idVehiculo) {
        for (JsonNode tracker : flota.consultarVehiculos().path("trackers")) {
            if (idVehiculo.equals(GpsUtil.texto(tracker, "Vehicle_ID", "vehicle_id", "id"))) {
                return tracker;
            }
        }
        throw new IllegalArgumentException(
                "La unidad GPS seleccionada no aparece en VTracker.");
    }

    private ViajeResponse aViaje(MonitoreoViaje v) {
        return new ViajeResponse(
                v.getIdViaje(), v.getIdVehiculoGps(), v.getConductorUnidad(),
                v.getOrigen(), v.getDestino(), v.getFechaInicio(), v.getFechaFin(),
                v.getEstado(), paradaRepo.countByViaje_IdViaje(v.getIdViaje()));
    }

    private ParadaResponse aParada(MonitoreoParada p) {
        LocalDateTime fin = p.getFechaHoraFin() != null
                ? p.getFechaHoraFin() : LocalDateTime.now();

        return new ParadaResponse(
                p.getIdParada(), p.getNumeroParada(),
                p.getFechaHoraInicio(), p.getFechaHoraFin(),
                num(p.getLatitud()), num(p.getLongitud()),
                p.getMotivo(), p.getObservaciones(), p.getEstado(),
                Duration.between(p.getFechaHoraInicio(), fin).toMinutes());
    }

    private static Double num(BigDecimal valor) {
        return valor == null ? null : valor.doubleValue();
    }
}