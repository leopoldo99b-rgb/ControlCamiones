package com.proyecto.camiones.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "empleados",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_empleados_identidad",
            columnNames = "identidad"
        )
    }
)
public class Empleado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "identidad", nullable = false, length = 20)
    private String identidad;

    @Column(name = "nombre_completo", nullable = false, length = 150)
    private String nombreCompleto;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "fecha_contratacion", nullable = false)
    private LocalDate fechaContratacion;

    @Column(name = "cargo", nullable = false, length = 100)
    private String cargo;

    @Column(name = "tipo_salario", nullable = false, length = 20)
    private String tipoSalario = "MENSUAL";

    @Column(name = "salario", nullable = false, precision = 12, scale = 2)
    private BigDecimal salario = BigDecimal.ZERO;

    @Column(name = "banco", nullable = false, length = 100)
    private String banco;

    @Column(name = "numero_cuenta", nullable = false, length = 40)
    private String numeroCuenta;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "ACTIVO";

    @Column(name = "fecha_cambio_estado")
    private LocalDate fechaCambioEstado;

    @Column(name = "observacion_estado", length = 500)
    private String observacionEstado;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @PrePersist
    protected void onCreate() {
        LocalDateTime ahora = LocalDateTime.now();

        fechaCreacion = ahora;
        fechaActualizacion = ahora;

        if (estado == null || estado.isBlank()) {
            estado = "ACTIVO";
        }

        if (tipoSalario == null || tipoSalario.isBlank()) {
            tipoSalario = "MENSUAL";
        }

        if (salario == null) {
            salario = BigDecimal.ZERO;
        }

        if (fechaCambioEstado == null) {
            fechaCambioEstado = fechaContratacion;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    // GETTERS Y SETTERS

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIdentidad() {
        return identidad;
    }

    public void setIdentidad(String identidad) {
        this.identidad = identidad;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public LocalDate getFechaContratacion() {
        return fechaContratacion;
    }

    public void setFechaContratacion(LocalDate fechaContratacion) {
        this.fechaContratacion = fechaContratacion;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public String getTipoSalario() {
        return tipoSalario;
    }

    public void setTipoSalario(String tipoSalario) {
        this.tipoSalario = tipoSalario;
    }

    public BigDecimal getSalario() {
        return salario;
    }

    public void setSalario(BigDecimal salario) {
        this.salario = salario;
    }

    public String getBanco() {
        return banco;
    }

    public void setBanco(String banco) {
        this.banco = banco;
    }

    public String getNumeroCuenta() {
        return numeroCuenta;
    }

    public void setNumeroCuenta(String numeroCuenta) {
        this.numeroCuenta = numeroCuenta;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDate getFechaCambioEstado() {
        return fechaCambioEstado;
    }

    public void setFechaCambioEstado(LocalDate fechaCambioEstado) {
        this.fechaCambioEstado = fechaCambioEstado;
    }

    public String getObservacionEstado() {
        return observacionEstado;
    }

    public void setObservacionEstado(String observacionEstado) {
        this.observacionEstado = observacionEstado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }
}