package com.proyecto.camiones.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "destinos")
public class Destino {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "destino", nullable = false, length = 100)
    private String destino;

    @Column(name = "km", precision = 10, scale = 2, nullable = false)
    private BigDecimal km;

    @Column(name = "galones", precision = 10, scale = 2)
    private BigDecimal galones;

    @Column(name = "peajes", nullable = false)
    private Integer peajes;


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public Destino() {
    }


    // =====================================================
    // GETTERS Y SETTERS
    // =====================================================

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


    public BigDecimal getKm() {
        return km;
    }

    public void setKm(BigDecimal km) {
        this.km = km;
    }


    public BigDecimal getGalones() {
        return galones;
    }

    public void setGalones(BigDecimal galones) {
        this.galones = galones;
    }


    public Integer getPeajes() {
        return peajes;
    }

    public void setPeajes(Integer peajes) {
        this.peajes = peajes;
    }
}