package dto;

import java.time.LocalDateTime;
import java.util.List;

public final class MonitoreoDtos {

    private MonitoreoDtos() {}

    /** idViaje lo ingresa el usuario en el formulario. */
    public record ViajeRequest(
            Integer idViaje,
            String idVehiculoGps,
            Long origenId,
            Long destinoId,
            LocalDateTime fechaSalida) {}

    public record MotivoRequest(String motivo) {}

    public record ViajeResponse(
            Integer idViaje,
            String idVehiculoGps,
            String conductorUnidad,
            String origen,
            String destino,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            String estado,
            long totalParadas) {}

    public record ParadaResponse(
            Integer idParada,
            Integer numeroParada,
            LocalDateTime inicio,
            LocalDateTime fin,
            Double latitud,
            Double longitud,
            String motivo,
            String observaciones,
            String estado,
            long duracionMinutos) {}

    public record PuntoRecorridoResponse(
            LocalDateTime fechaHora,
            double latitud,
            double longitud,
            Double velocidad) {}

    /** Un viaje con sus paradas (para el reporte por rango de fechas). */
    public record ReporteViajeResponse(
            ViajeResponse viaje,
            List<ParadaResponse> paradas) {}

    public record RutaResponse(
            ViajeResponse viaje,
            List<PuntoRecorridoResponse> recorrido,
            List<ParadaResponse> paradas) {}
}