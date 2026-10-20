package dto;

import java.time.OffsetDateTime;

import com.proyecto.camiones.model.PuntoPlanta;
import com.proyecto.camiones.model.TipoPunto;

public class PuntoPlantaResponse {

    private Long id;
    private String nombre;
    private TipoPunto tipo;
    private Double latitud;
    private Double longitud;
    private Boolean activo;
    private OffsetDateTime creadoEn;
    private OffsetDateTime actualizadoEn;

    public PuntoPlantaResponse() {
    }

    public static PuntoPlantaResponse desde(PuntoPlanta punto) {
        PuntoPlantaResponse dto = new PuntoPlantaResponse();
        dto.setId(punto.getId());
        dto.setNombre(punto.getNombre());
        dto.setTipo(punto.getTipo());
        dto.setLatitud(punto.getLatitud());
        dto.setLongitud(punto.getLongitud());
        dto.setActivo(punto.getActivo());
        dto.setCreadoEn(punto.getCreadoEn());
        dto.setActualizadoEn(punto.getActualizadoEn());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public OffsetDateTime getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(OffsetDateTime creadoEn) {
        this.creadoEn = creadoEn;
    }

    public OffsetDateTime getActualizadoEn() {
        return actualizadoEn;
    }

    public void setActualizadoEn(OffsetDateTime actualizadoEn) {
        this.actualizadoEn = actualizadoEn;
    }
}
