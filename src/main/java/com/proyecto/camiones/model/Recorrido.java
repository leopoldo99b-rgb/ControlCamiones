package com.proyecto.camiones.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "recorridos")
public class Recorrido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "motorista", nullable = false, length = 150)
    private String motorista;

    @Column(name = "unidad", nullable = false, length = 50)
    private String unidad;

    @Column(name = "ejes_camion", nullable = false)
    private Integer ejesCamion;

    @Column(name = "ruta_destino", nullable = false, length = 100)
    private String rutaDestino;

    @Column(name = "km_recorridos", nullable = false, precision = 12, scale = 2)
    private BigDecimal kmRecorridos;

    @Column(name = "remision", length = 50)
    private String remision;

    @Column(name = "banda_por_km", nullable = false, precision = 12, scale = 2)
    private BigDecimal bandaPorKm;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "isv", nullable = false, precision = 12, scale = 2)
    private BigDecimal isv;

    @Column(name = "tarifa", nullable = false, precision = 12, scale = 2)
    private BigDecimal tarifa;

    @Column(name = "cantidad_peajes", nullable = false)
    private Integer cantidadPeajes;

    @Column(name = "valor_peaje", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorPeaje;

    @Column(name = "total_peajes", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPeajes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    @PrePersist
    protected void onCreate() {

        LocalDateTime ahora =
                LocalDateTime.now();

        createdAt = ahora;
        updatedAt = ahora;
    }


    @PreUpdate
    protected void onUpdate() {

        updatedAt =
                LocalDateTime.now();
    }


    // =========================
    // GETTERS Y SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }


    public String getMotorista() {
        return motorista;
    }

    public void setMotorista(String motorista) {
        this.motorista = motorista;
    }


    public String getUnidad() {
        return unidad;
    }

    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }


    public Integer getEjesCamion() {
        return ejesCamion;
    }

    public void setEjesCamion(Integer ejesCamion) {
        this.ejesCamion = ejesCamion;
    }


    public String getRutaDestino() {
        return rutaDestino;
    }

    public void setRutaDestino(String rutaDestino) {
        this.rutaDestino = rutaDestino;
    }


    public BigDecimal getKmRecorridos() {
        return kmRecorridos;
    }

    public void setKmRecorridos(BigDecimal kmRecorridos) {
        this.kmRecorridos = kmRecorridos;
    }


    public String getRemision() {
        return remision;
    }

    public void setRemision(String remision) {
        this.remision = remision;
    }


    public BigDecimal getBandaPorKm() {
        return bandaPorKm;
    }

    public void setBandaPorKm(BigDecimal bandaPorKm) {
        this.bandaPorKm = bandaPorKm;
    }


    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }


    public BigDecimal getIsv() {
        return isv;
    }

    public void setIsv(BigDecimal isv) {
        this.isv = isv;
    }


    public BigDecimal getTarifa() {
        return tarifa;
    }

    public void setTarifa(BigDecimal tarifa) {
        this.tarifa = tarifa;
    }


    public Integer getCantidadPeajes() {
        return cantidadPeajes;
    }

    public void setCantidadPeajes(Integer cantidadPeajes) {
        this.cantidadPeajes = cantidadPeajes;
    }


    public BigDecimal getValorPeaje() {
        return valorPeaje;
    }

    public void setValorPeaje(BigDecimal valorPeaje) {
        this.valorPeaje = valorPeaje;
    }


    public BigDecimal getTotalPeajes() {
        return totalPeajes;
    }

    public void setTotalPeajes(BigDecimal totalPeajes) {
        this.totalPeajes = totalPeajes;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }


    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}