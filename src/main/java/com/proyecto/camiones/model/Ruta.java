package com.proyecto.camiones.model;

import java.time.LocalTime;

import jakarta.persistence.*;

@Entity
@Table(name = "rutas")
public class Ruta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String destino;

    private LocalTime odt;

    private String estado;

    public Ruta() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDestino() {
        return destino;
    }

    public void setDestino(String destino) {
        this.destino = destino;
    }

    public LocalTime getOdt() {
        return odt;
    }

    public void setOdt(LocalTime odt) {
        this.odt = odt;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}