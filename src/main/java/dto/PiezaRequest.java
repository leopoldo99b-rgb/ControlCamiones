package dto;

import java.math.BigDecimal;

/** Sin anotaciones de validación: las reglas se revisan en PiezaService. */
public record PiezaRequest(
        String codigo,
        String nombre,
        String categoria,
        String lugar,
        Integer minimo,
        Integer stock,
        BigDecimal costo) {
}