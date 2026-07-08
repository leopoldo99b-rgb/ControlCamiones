package com.proyecto.camiones.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;


@Entity
@Table(name="conductores")
public class Conductor {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private String nombre;


    private String apellido;


    private String identidad;


    private LocalDate fechaNacimiento;


    private String telefono;


    private String correo;


    private String direccion;


    private String licencia;


    private String tipoLicencia;


    private LocalDate fechaVencimientoLicencia;


    private LocalDate fechaIngreso;


    private String estado;


    private String foto;


    @Column(columnDefinition = "TEXT")
    private String observaciones;


    private LocalDateTime createdAt;



    public Conductor(){

    }




    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }




    public String getNombre() {
        return nombre;
    }


    public void setNombre(String nombre) {
        this.nombre = nombre;
    }




    public String getApellido() {
        return apellido;
    }


    public void setApellido(String apellido) {
        this.apellido = apellido;
    }




    public String getIdentidad() {
        return identidad;
    }


    public void setIdentidad(String identidad) {
        this.identidad = identidad;
    }




    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }


    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }




    public String getTelefono() {
        return telefono;
    }


    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }




    public String getCorreo() {
        return correo;
    }


    public void setCorreo(String correo) {
        this.correo = correo;
    }




    public String getDireccion() {
        return direccion;
    }


    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }




    public String getLicencia() {
        return licencia;
    }


    public void setLicencia(String licencia) {
        this.licencia = licencia;
    }




    public String getTipoLicencia() {
        return tipoLicencia;
    }


    public void setTipoLicencia(String tipoLicencia) {
        this.tipoLicencia = tipoLicencia;
    }




    public LocalDate getFechaVencimientoLicencia() {
        return fechaVencimientoLicencia;
    }


    public void setFechaVencimientoLicencia(LocalDate fechaVencimientoLicencia) {
        this.fechaVencimientoLicencia = fechaVencimientoLicencia;
    }




    public LocalDate getFechaIngreso() {
        return fechaIngreso;
    }


    public void setFechaIngreso(LocalDate fechaIngreso) {
        this.fechaIngreso = fechaIngreso;
    }




    public String getEstado() {
        return estado;
    }


    public void setEstado(String estado) {
        this.estado = estado;
    }




    public String getFoto() {
        return foto;
    }


    public void setFoto(String foto) {
        this.foto = foto;
    }




    public String getObservaciones() {
        return observaciones;
    }


    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }




    public LocalDateTime getCreatedAt() {
        return createdAt;
    }


    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }



}