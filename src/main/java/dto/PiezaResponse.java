package dto;
import java.math.BigDecimal;

import com.proyecto.camiones.model.Pieza;

public record PiezaResponse(
        Long id,
        String codigo,
        String nombre,
        String categoria,
        String lugar,
        int minimo,
        int stock,
        BigDecimal costo) {

    public static PiezaResponse de(Pieza p) {
        return new PiezaResponse(
                p.getId(), p.getCodigo(), p.getNombre(),
                p.getCategoria().getNombre(), p.getLugar().getNombre(),
                p.getStockMinimo(), p.getStockActual(), p.getCostoPromedio());
    }
}
