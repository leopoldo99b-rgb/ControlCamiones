package dto;

import java.math.BigDecimal;
import java.util.List;

/** Resumen del inventario para el dashboard (se usa solo para mostrar). */
public class InventarioResumen {

    private final int disponibles;
    private final int bajos;
    private final int agotados;
    private final long unidades;
    private final BigDecimal valor;

    public InventarioResumen(int disponibles, int bajos, int agotados, long unidades, BigDecimal valor) {
        this.disponibles = disponibles;
        this.bajos = bajos;
        this.agotados = agotados;
        this.unidades = unidades;
        this.valor = valor;
    }

    public int getDisponibles() { return disponibles; }
    public int getBajos() { return bajos; }
    public int getAgotados() { return agotados; }
    public long getUnidades() { return unidades; }
    public BigDecimal getValor() { return valor; }

    public int getTotal() { return disponibles + bajos + agotados; }

    /** Piezas que necesitan reposición: stock bajo + agotadas. */
    public int getPorReponer() { return bajos + agotados; }

    /** Datos para la dona, en este orden: disponible, stock bajo, agotado. */
    public List<Integer> getDatos() { return List.of(disponibles, bajos, agotados); }
}