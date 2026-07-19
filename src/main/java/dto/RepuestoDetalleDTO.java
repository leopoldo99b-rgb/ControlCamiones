package dto;

import java.math.BigDecimal;

public class RepuestoDetalleDTO {

    private String nombre;
    private Integer cantidad;
    private BigDecimal precio;
    private BigDecimal subtotal;

    public RepuestoDetalleDTO(){}

    public RepuestoDetalleDTO(
            String nombre,
            Integer cantidad,
            BigDecimal precio,
            BigDecimal subtotal
    ){

        this.nombre = nombre;
        this.cantidad = cantidad;
        this.precio = precio;
        this.subtotal = subtotal;

    }

    public String getNombre() {
        return nombre;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

}