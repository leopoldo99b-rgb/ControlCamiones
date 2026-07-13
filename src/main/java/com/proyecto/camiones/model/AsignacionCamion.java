package com.proyecto.camiones.model;


import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;



@Entity
@Table(name="asignaciones_camiones")
public class AsignacionCamion {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



    // ==============================
    // RELACION CONDUCTOR
    // ==============================

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="conductor_id", nullable=false)
    @JsonIgnoreProperties("asignaciones")
    private Conductor conductor;



    // ==============================
    // RELACION CAMION
    // ==============================

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="camion_id", nullable=false)
    private Camion camion;



    @Column(name="fecha_asignacion")
    private LocalDate fechaAsignacion;



    @Column(name="fecha_finalizacion")
    private LocalDate fechaFinalizacion;



    private String estado;



    private String observacion;




    // ==============================
    // GETTERS Y SETTERS
    // ==============================


    public Long getId() {
        return id;
    }



    public void setId(Long id) {
        this.id = id;
    }




    public Conductor getConductor() {
        return conductor;
    }



    public void setConductor(Conductor conductor) {
        this.conductor = conductor;
    }





    public Camion getCamion() {
        return camion;
    }



    public void setCamion(Camion camion) {
        this.camion = camion;
    }





    public LocalDate getFechaAsignacion() {
        return fechaAsignacion;
    }



    public void setFechaAsignacion(LocalDate fechaAsignacion) {
        this.fechaAsignacion = fechaAsignacion;
    }





    public LocalDate getFechaFinalizacion() {
        return fechaFinalizacion;
    }



    public void setFechaFinalizacion(LocalDate fechaFinalizacion) {
        this.fechaFinalizacion = fechaFinalizacion;
    }





    public String getEstado() {
        return estado;
    }



    public void setEstado(String estado) {
        this.estado = estado;
    }





    public String getObservacion() {
        return observacion;
    }



    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

}