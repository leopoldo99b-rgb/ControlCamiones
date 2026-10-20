package dto;

import com.proyecto.camiones.model.TipoPunto;

public class PuntoPlantaRequest {

    private String nombre;
    private TipoPunto tipo;
    private Double latitud;
    private Double longitud;

    public PuntoPlantaRequest() {
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public TipoPunto getTipo() {
        return tipo;
    }

    public void setTipo(TipoPunto tipo) {
        this.tipo = tipo;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }

    public void validar() {

        if (nombre == null || nombre.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "El nombre es obligatorio"
            );
        }

        nombre = nombre.trim();

        if (nombre.length() > 150) {
            throw new IllegalArgumentException(
                "El nombre no puede superar 150 caracteres"
            );
        }

        if (tipo == null) {
            throw new IllegalArgumentException(
                "El tipo debe ser ORIGEN o DESTINO"
            );
        }

        if (latitud == null
                || !Double.isFinite(latitud)
                || latitud < -90 || latitud > 90) {
            throw new IllegalArgumentException(
                "La latitud debe estar entre -90 y 90"
            );
        }

        if (longitud == null
                || !Double.isFinite(longitud)
                || longitud < -180 || longitud > 180) {
            throw new IllegalArgumentException(
                "La longitud debe estar entre -180 y 180"
            );
        }
    }
}
