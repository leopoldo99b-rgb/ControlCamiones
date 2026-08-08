package com.proyecto.camiones.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;

@Entity
@Table(name = "viajes")
public class viajes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, length = 150)
    private String conductor;

    @Column(nullable = false, length = 20)
    private String placa;

    @Column(nullable = false, length = 100)
    private String furgon;

    @Column(name = "estado_furgon", nullable = false, length = 20)
    private String estadoFurgon;

    @Column(nullable = false, length = 100)
    private String origen;

    @Column(nullable = false, length = 100)
    private String destino;

    @Column(nullable = false)
    private LocalDateTime salida;

    @Column
    private LocalDateTime llegada;

    @Column(nullable = false)
    private LocalTime odt;

    @Column(name = "tiempo_maximo", nullable = false)
    private Integer tiempoMaximo;

    @Column(name = "tiempo_excedido")
    private Integer tiempoExcedido;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public viajes() {
    }

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

    public String getConductor() {
        return conductor;
    }

    public void setConductor(String conductor) {
        this.conductor = conductor;
    }

    public String getPlaca() {
        return placa;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }

    public String getFurgon() {
        return furgon;
    }

    public void setFurgon(String furgon) {
        this.furgon = furgon;
    }

    public String getEstadoFurgon() {
        return estadoFurgon;
    }

    public void setEstadoFurgon(String estadoFurgon) {
        this.estadoFurgon = estadoFurgon;
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

    public LocalDateTime getSalida() {
        return salida;
    }

    public void setSalida(LocalDateTime salida) {
        this.salida = salida;
    }

    public LocalDateTime getLlegada() {
        return llegada;
    }

    public void setLlegada(LocalDateTime llegada) {
        this.llegada = llegada;
    }

    public LocalTime getOdt() {
        return odt;
    }

    public void setOdt(LocalTime odt) {
        this.odt = odt;
    }

    public Integer getTiempoMaximo() {
        return tiempoMaximo;
    }

    public void setTiempoMaximo(Integer tiempoMaximo) {
        this.tiempoMaximo = tiempoMaximo;
    }

    public Integer getTiempoExcedido() {
        return tiempoExcedido;
    }

    public void setTiempoExcedido(Integer tiempoExcedido) {
        this.tiempoExcedido = tiempoExcedido;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

}