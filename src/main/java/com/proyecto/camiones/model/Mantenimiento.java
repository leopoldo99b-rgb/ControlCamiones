package com.proyecto.camiones.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "mantenimientos")
public class Mantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mantenimiento")
    private Integer idMantenimiento;

    @Column(name = "fecha_mantenimiento", nullable = false)
    private LocalDate fechaMantenimiento;

    @Column(name = "medicion_valor")
    private Integer medicionValor;

    @Column(name = "medicion_tipo", length = 10)
    private String medicionTipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "unidad_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_mantenimientos_unidad")
    )
    private Unidad unidad;

    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo;

    @Column(name = "descripcion", nullable = false, length = 1000)
    private String descripcion;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;

    public Mantenimiento() {
    }

    // =========================
    // ID
    // =========================

    public Integer getIdMantenimiento() {
        return idMantenimiento;
    }

    public void setIdMantenimiento(Integer idMantenimiento) {
        this.idMantenimiento = idMantenimiento;
    }

    /**
     * Número formateado para mostrar en la interfaz.
     * Ejemplo: 128 -> #0128
     */
    @Transient
    public String getNumeroMantenimiento() {
        if (idMantenimiento == null) {
            return "";
        }

        return String.format("#%04d", idMantenimiento);
    }

    // =========================
    // FECHA MANTENIMIENTO
    // =========================

    public LocalDate getFechaMantenimiento() {
        return fechaMantenimiento;
    }

    public void setFechaMantenimiento(LocalDate fechaMantenimiento) {
        this.fechaMantenimiento = fechaMantenimiento;
    }

    // =========================
    // MEDICIÓN
    // =========================

    public Integer getMedicionValor() {
        return medicionValor;
    }

    public void setMedicionValor(Integer medicionValor) {
        this.medicionValor = medicionValor;
    }

    public String getMedicionTipo() {
        return medicionTipo;
    }

    public void setMedicionTipo(String medicionTipo) {
        this.medicionTipo = medicionTipo;
    }

    // =========================
    // UNIDAD
    // =========================

    public Unidad getUnidad() {
        return unidad;
    }

    public void setUnidad(Unidad unidad) {
        this.unidad = unidad;
    }

    // =========================
    // TIPO
    // =========================

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    // =========================
    // DESCRIPCIÓN
    // =========================

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    // =========================
    // FECHA DE CREACIÓN
    // =========================

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    // =========================
    // FECHA DE MODIFICACIÓN
    // =========================

    public LocalDateTime getFechaModificacion() {
        return fechaModificacion;
    }

    public void setFechaModificacion(LocalDateTime fechaModificacion) {
        this.fechaModificacion = fechaModificacion;
    }
}