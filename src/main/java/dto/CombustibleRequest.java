package dto;

import java.math.BigDecimal;

public class CombustibleRequest {

    private String nombre;
    private BigDecimal precioGalon;
    private Boolean activo = true;

    public CombustibleRequest() {
    }

    public String getNombre() {
        return nombre;
    }

    public BigDecimal getPrecioGalon() {
        return precioGalon;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setPrecioGalon(BigDecimal precioGalon) {
        this.precioGalon = precioGalon;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}