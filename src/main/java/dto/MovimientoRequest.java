package dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.proyecto.camiones.model.TipoMovimiento;

/** Sin anotaciones de validación: las reglas se revisan en MovimientoService. */
public record MovimientoRequest(
        Long productoId,
        TipoMovimiento tipo,
        LocalDate fecha,
        Integer cantidad,
        BigDecimal costo,
        String ref,
        String notas) {
}