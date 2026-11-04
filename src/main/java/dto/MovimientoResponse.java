package dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.proyecto.camiones.model.Movimiento;

public record MovimientoResponse(
        Long id,
        LocalDate fecha,
        String tipo,
        Long productoId,
        String productoCodigo,
        String productoNombre,
        int cantidad,
        BigDecimal costo,
        BigDecimal total,
        String ref,
        String notas) {

    public static MovimientoResponse de(Movimiento m) {
        return new MovimientoResponse(
                m.getId(), m.getFecha(), m.getTipo().name().toLowerCase(),
                m.getPieza().getId(), m.getPieza().getCodigo(), m.getPieza().getNombre(),
                m.getCantidad(), m.getCostoUnitario(), m.getTotal(),
                m.getReferencia(), m.getNotas());
    }
}
