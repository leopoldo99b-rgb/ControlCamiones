package com.proyecto.camiones.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "adelantos")
public class Adelanto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "empleado_id")
    private Empleado empleado;
    @Column(nullable = false)
    private String tipo = "ADELANTO";   // ADELANTO, VALE, PRESTAMO
    private LocalDate fecha = LocalDate.now();
    private BigDecimal monto;
    private BigDecimal saldo;
    private BigDecimal cuotaPorPlanilla; // null = se descuenta completo
    private String motivo;
    private String estado = "PENDIENTE";

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Empleado getEmpleado() { return empleado; }
    public void setEmpleado(Empleado empleado) { this.empleado = empleado; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public BigDecimal getSaldo() { return saldo; }
    public void setSaldo(BigDecimal saldo) { this.saldo = saldo; }
    public BigDecimal getCuotaPorPlanilla() { return cuotaPorPlanilla; }
    public void setCuotaPorPlanilla(BigDecimal c) { this.cuotaPorPlanilla = c; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}