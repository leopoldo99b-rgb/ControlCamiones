package com.proyecto.camiones.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "planillas")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Planilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_planilla", nullable = false, unique = true, length = 30)
    private String numeroPlanilla;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDate fechaPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoPlanilla estado = EstadoPlanilla.PENDIENTE;

    @Column(name = "total_empleados", nullable = false)
    private Integer totalEmpleados = 0;

    @Column(name = "total_salarios", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalSalarios = BigDecimal.ZERO;

    @Column(name = "total_bonos", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalBonos = BigDecimal.ZERO;

    @Column(name = "total_anticipos", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAnticipos = BigDecimal.ZERO;

    @Column(name = "total_deducciones", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalDeducciones = BigDecimal.ZERO;

    @Column(name = "total_neto", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalNeto = BigDecimal.ZERO;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @OneToMany(
        mappedBy = "planilla",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<HistorialPlanilla> empleados = new ArrayList<>();

    public Planilla() {
    }

    public void agregarEmpleado(HistorialPlanilla historial) {
        if (historial == null) {
            return;
        }

        empleados.add(historial);
        historial.setPlanilla(this);
    }

    public void eliminarEmpleado(HistorialPlanilla historial) {
        if (historial == null) {
            return;
        }

        empleados.remove(historial);
        historial.setPlanilla(null);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumeroPlanilla() {
        return numeroPlanilla;
    }

    public void setNumeroPlanilla(String numeroPlanilla) {
        this.numeroPlanilla = numeroPlanilla;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public LocalDate getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDate fechaPago) {
        this.fechaPago = fechaPago;
    }

    public EstadoPlanilla getEstado() {
        return estado;
    }

    public void setEstado(EstadoPlanilla estado) {
        this.estado = estado;
    }

    public Integer getTotalEmpleados() {
        return totalEmpleados;
    }

    public void setTotalEmpleados(Integer totalEmpleados) {
        this.totalEmpleados = totalEmpleados;
    }

    public BigDecimal getTotalSalarios() {
        return totalSalarios;
    }

    public void setTotalSalarios(BigDecimal totalSalarios) {
        this.totalSalarios = totalSalarios;
    }

    public BigDecimal getTotalBonos() {
        return totalBonos;
    }

    public void setTotalBonos(BigDecimal totalBonos) {
        this.totalBonos = totalBonos;
    }

    public BigDecimal getTotalAnticipos() {
        return totalAnticipos;
    }

    public void setTotalAnticipos(BigDecimal totalAnticipos) {
        this.totalAnticipos = totalAnticipos;
    }

    public BigDecimal getTotalDeducciones() {
        return totalDeducciones;
    }

    public void setTotalDeducciones(BigDecimal totalDeducciones) {
        this.totalDeducciones = totalDeducciones;
    }

    public BigDecimal getTotalNeto() {
        return totalNeto;
    }

    public void setTotalNeto(BigDecimal totalNeto) {
        this.totalNeto = totalNeto;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    public List<HistorialPlanilla> getEmpleados() {
        return empleados;
    }

    public void setEmpleados(List<HistorialPlanilla> empleados) {
        this.empleados = empleados;
    }
}
