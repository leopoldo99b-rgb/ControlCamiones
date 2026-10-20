package com.proyecto.camiones.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "monitoreoparada")
public class MonitoreoParada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idparada")
    private Integer idParada;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idviaje", nullable = false)
    private MonitoreoViaje viaje;

    @Column(name = "numeroparada", nullable = false)
    private Integer numeroParada;

    @Column(name = "fechahorainicio", nullable = false)
    private LocalDateTime fechaHoraInicio;

    @Column(name = "fechahorafin")
    private LocalDateTime fechaHoraFin;

    @Column(name = "latitud", precision = 10, scale = 7)
    private BigDecimal latitud;

    @Column(name = "longitud", precision = 10, scale = 7)
    private BigDecimal longitud;

    /** Lo escribe el usuario DESPUÉS de que el sistema detecta la parada. */
    @Column(name = "motivo", length = 300)
    private String motivo;

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @Column(name = "estado", length = 20)
    private String estado;

    public MonitoreoParada() {
    }

    public Integer getIdParada() {
        return idParada;
    }

    public void setIdParada(Integer idParada) {
        this.idParada = idParada;
    }

    public MonitoreoViaje getViaje() {
        return viaje;
    }

    public void setViaje(MonitoreoViaje viaje) {
        this.viaje = viaje;
    }

    public Integer getNumeroParada() {
        return numeroParada;
    }

    public void setNumeroParada(Integer numeroParada) {
        this.numeroParada = numeroParada;
    }

    public LocalDateTime getFechaHoraInicio() {
        return fechaHoraInicio;
    }

    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) {
        this.fechaHoraInicio = fechaHoraInicio;
    }

    public LocalDateTime getFechaHoraFin() {
        return fechaHoraFin;
    }

    public void setFechaHoraFin(LocalDateTime fechaHoraFin) {
        this.fechaHoraFin = fechaHoraFin;
    }

    public BigDecimal getLatitud() {
        return latitud;
    }

    public void setLatitud(BigDecimal latitud) {
        this.latitud = latitud;
    }

    public BigDecimal getLongitud() {
        return longitud;
    }

    public void setLongitud(BigDecimal longitud) {
        this.longitud = longitud;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
