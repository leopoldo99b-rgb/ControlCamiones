package com.proyecto.camiones.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "furgones")
public class Furgon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "furgon", nullable = false, unique = true)
    private String furgon;

    @Column(name = "ejes", nullable = false)
    private Integer ejes;

    public Furgon() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFurgon() {
        return furgon;
    }

    public void setFurgon(String furgon) {
        this.furgon = furgon;
    }

    public Integer getEjes() {
        return ejes;
    }

    public void setEjes(Integer ejes) {
        this.ejes = ejes;
    }
}