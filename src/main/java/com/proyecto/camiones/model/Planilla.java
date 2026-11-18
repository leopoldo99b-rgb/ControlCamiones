package com.proyecto.camiones.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "planillas")
public class Planilla {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false)
    private String frecuencia;
    @Column(nullable = false)
    private LocalDate fechaInicio;
    @Column(nullable = false)
    private LocalDate fechaFin;
    private String descripcion;
    @Column(nullable = false)
    private String estado = "BORRADOR";
    private BigDecimal totalIngresos = BigDecimal.ZERO;
    private BigDecimal totalDeducciones = BigDecimal.ZERO;
    private BigDecimal totalNeto = BigDecimal.ZERO;
    @Column(insertable = false, updatable = false)
    private LocalDateTime creado;
    private LocalDateTime fechaAprobacion;
    private LocalDateTime fechaPago;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getFrecuencia() { return frecuencia; }
    public void setFrecuencia(String frecuencia) { this.frecuencia = frecuencia; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public BigDecimal getTotalIngresos() { return totalIngresos; }
    public void setTotalIngresos(BigDecimal totalIngresos) { this.totalIngresos = totalIngresos; }

    public BigDecimal getTotalDeducciones() { return totalDeducciones; }
    public void setTotalDeducciones(BigDecimal totalDeducciones) { this.totalDeducciones = totalDeducciones; }

    public BigDecimal getTotalNeto() { return totalNeto; }
    public void setTotalNeto(BigDecimal totalNeto) { this.totalNeto = totalNeto; }

    public LocalDateTime getCreado() { return creado; }
    public void setCreado(LocalDateTime creado) { this.creado = creado; }

    public LocalDateTime getFechaAprobacion() { return fechaAprobacion; }
    public void setFechaAprobacion(LocalDateTime fechaAprobacion) { this.fechaAprobacion = fechaAprobacion; }

    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }
}
