package com.proyecto.camiones.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;

/** Un punto GPS del recorrido de un viaje. */
@Entity
@Table(name = "monitoreorecorrido")
public class MonitoreoRecorrido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idrecorrido")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idviaje", nullable = false)
    private MonitoreoViaje viaje;

    @Column(name = "fechahora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "latitud", nullable = false)
    private Double latitud;

    @Column(name = "longitud", nullable = false)
    private Double longitud;

    @Column(name = "velocidad")
    private Double velocidad;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MonitoreoViaje getViaje() {
        return viaje;
    }

    public void setViaje(MonitoreoViaje viaje) {
        this.viaje = viaje;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
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

    public Double getVelocidad() {
        return velocidad;
    }

    public void setVelocidad(Double velocidad) {
        this.velocidad = velocidad;
    }
}
