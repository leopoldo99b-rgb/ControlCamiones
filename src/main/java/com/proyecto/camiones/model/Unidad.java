package com.proyecto.camiones.model;

import jakarta.persistence.*;

@Entity
@Table(
    name = "unidades",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_unidades_codigo",
            columnNames = "codigo_unidad"
        )
    }
)
public class Unidad {

    @Id
    @Column(name = "id_unidad")
    private Integer idUnidad;

    @Column(name = "codigo_unidad", nullable = false, length = 30)
    private String codigoUnidad;

    @Column(name = "placa", length = 30)
    private String placa;

    @Column(name = "descripcion", length = 100)
    private String descripcion;

    @Column(name = "activo")
    private Boolean activo;

    public Unidad() {
    }

    public Integer getIdUnidad() {
        return idUnidad;
    }

    public void setIdUnidad(Integer idUnidad) {
        this.idUnidad = idUnidad;
    }

    public String getCodigoUnidad() {
        return codigoUnidad;
    }

    public void setCodigoUnidad(String codigoUnidad) {
        this.codigoUnidad = codigoUnidad;
    }

    public String getPlaca() {
        return placa;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}