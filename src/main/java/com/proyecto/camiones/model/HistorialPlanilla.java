package com.proyecto.camiones.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "historial_planillas",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_planilla_empleado",
            columnNames = {"planilla_id", "empleado_id"}
        )
    }
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class HistorialPlanilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "planilla_id", nullable = false)
    private Planilla planilla;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;

    @Column(name = "salario", nullable = false, precision = 15, scale = 2)
    private BigDecimal salario = BigDecimal.ZERO;

    @Column(name = "bonos", nullable = false, precision = 15, scale = 2)
    private BigDecimal bonos = BigDecimal.ZERO;

    @Column(name = "anticipos", nullable = false, precision = 15, scale = 2)
    private BigDecimal anticipos = BigDecimal.ZERO;

    @Column(name = "deducciones", nullable = false, precision = 15, scale = 2)
    private BigDecimal deducciones = BigDecimal.ZERO;

    @Column(name = "neto", nullable = false, precision = 15, scale = 2)
    private BigDecimal neto = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_pago", nullable = false, length = 20)
    private EstadoPago estadoPago = EstadoPago.PENDIENTE;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;

    public HistorialPlanilla() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Planilla getPlanilla() {
        return planilla;
    }

    public void setPlanilla(Planilla planilla) {
        this.planilla = planilla;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public BigDecimal getSalario() {
        return salario;
    }

    public void setSalario(BigDecimal salario) {
        this.salario = salario;
    }

    public BigDecimal getBonos() {
        return bonos;
    }

    public void setBonos(BigDecimal bonos) {
        this.bonos = bonos;
    }

    public BigDecimal getAnticipos() {
        return anticipos;
    }

    public void setAnticipos(BigDecimal anticipos) {
        this.anticipos = anticipos;
    }

    public BigDecimal getDeducciones() {
        return deducciones;
    }

    public void setDeducciones(BigDecimal deducciones) {
        this.deducciones = deducciones;
    }

    public BigDecimal getNeto() {
        return neto;
    }

    public void setNeto(BigDecimal neto) {
        this.neto = neto;
    }

    public EstadoPago getEstadoPago() {
        return estadoPago;
    }

    public void setEstadoPago(EstadoPago estadoPago) {
        this.estadoPago = estadoPago;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public LocalDateTime getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }
}
