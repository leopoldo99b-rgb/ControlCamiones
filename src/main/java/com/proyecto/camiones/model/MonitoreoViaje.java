package com.proyecto.camiones.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;

@Entity
@Table(name = "monitoreoviaje")
public class MonitoreoViaje {

    /**
     * ID del viaje ingresado por el usuario (no se autogenera).
     * Sin @GeneratedValue, Hibernate incluye este valor en el INSERT.
     */
    @Id
    @Column(name = "idviaje")
    private Integer idViaje;

    /** Texto "Unidad | Placa | Conductor" tomado del GPS al crear el viaje. */
    @Column(name = "conductorunidad", nullable = false, length = 250)
    private String conductorUnidad;

    /** Identificador del vehículo en VTracker (Vehicle_ID). */
    @Column(name = "idvehiculogps", length = 50)
    private String idVehiculoGps;

    /** Nombre del origen (copia histórica del nombre del punto). */
    @Column(name = "origen", length = 150)
    private String origen;

    /** Nombre del destino (copia histórica del nombre del punto). */
    @Column(name = "destino", length = 150)
    private String destino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idorigen")
    private PuntoPlanta puntoOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "iddestino")
    private PuntoPlanta puntoDestino;

    @Column(name = "fechainicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fechafin")
    private LocalDateTime fechaFin;

    @Column(name = "estado", length = 30)
    private String estado;

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @OneToMany(mappedBy = "viaje", fetch = FetchType.LAZY)
    @OrderBy("numeroParada ASC")
    private List<MonitoreoParada> paradas = new ArrayList<>();

    public MonitoreoViaje() {
    }

    public Integer getIdViaje() {
        return idViaje;
    }

    public void setIdViaje(Integer idViaje) {
        this.idViaje = idViaje;
    }

    public String getConductorUnidad() {
        return conductorUnidad;
    }

    public void setConductorUnidad(String conductorUnidad) {
        this.conductorUnidad = conductorUnidad;
    }

    public String getIdVehiculoGps() {
        return idVehiculoGps;
    }

    public void setIdVehiculoGps(String idVehiculoGps) {
        this.idVehiculoGps = idVehiculoGps;
    }

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public String getDestino() {
        return destino;
    }

    public void setDestino(String destino) {
        this.destino = destino;
    }

    public PuntoPlanta getPuntoOrigen() {
        return puntoOrigen;
    }

    public void setPuntoOrigen(PuntoPlanta puntoOrigen) {
        this.puntoOrigen = puntoOrigen;
    }

    public PuntoPlanta getPuntoDestino() {
        return puntoDestino;
    }

    public void setPuntoDestino(PuntoPlanta puntoDestino) {
        this.puntoDestino = puntoDestino;
    }

    public LocalDateTime getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDateTime fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDateTime getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDateTime fechaFin) {
        this.fechaFin = fechaFin;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public List<MonitoreoParada> getParadas() {
        return paradas;
    }

    public void setParadas(List<MonitoreoParada> paradas) {
        this.paradas = paradas;
    }
}