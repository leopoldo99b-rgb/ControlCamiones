package com.proyecto.camiones.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "planilla_detalle")
public class PlanillaDetalle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "planilla_id")
    private Planilla planilla;
    @ManyToOne(optional = false)
    @JoinColumn(name = "empleado_id")
    private Empleado empleado;
    private BigDecimal salarioBase = BigDecimal.ZERO;
    private BigDecimal adelantos = BigDecimal.ZERO;
    private BigDecimal vales = BigDecimal.ZERO;
    private BigDecimal prestamos = BigDecimal.ZERO;
    private BigDecimal totalDeducciones = BigDecimal.ZERO;
    private BigDecimal neto = BigDecimal.ZERO;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Planilla getPlanilla() { return planilla; }
    public void setPlanilla(Planilla planilla) { this.planilla = planilla; }
    public Empleado getEmpleado() { return empleado; }
    public void setEmpleado(Empleado empleado) { this.empleado = empleado; }
    public BigDecimal getSalarioBase() { return salarioBase; }
    public void setSalarioBase(BigDecimal v) { this.salarioBase = v; }
    public BigDecimal getAdelantos() { return adelantos; }
    public void setAdelantos(BigDecimal v) { this.adelantos = v; }
    public BigDecimal getVales() { return vales; }
    public void setVales(BigDecimal v) { this.vales = v; }
    public BigDecimal getPrestamos() { return prestamos; }
    public void setPrestamos(BigDecimal v) { this.prestamos = v; }
    public BigDecimal getTotalDeducciones() { return totalDeducciones; }
    public void setTotalDeducciones(BigDecimal v) { this.totalDeducciones = v; }
    public BigDecimal getNeto() { return neto; }
    public void setNeto(BigDecimal v) { this.neto = v; }
}