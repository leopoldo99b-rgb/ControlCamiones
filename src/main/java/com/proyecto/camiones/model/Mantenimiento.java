package com.proyecto.camiones.model;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;



@Entity
@Table(name = "mantenimientos")
public class Mantenimiento {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



    // ==========================================
    // RELACION CON CAMION
    // ==========================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camion_id", nullable = false)
    private Camion camion;




    // ==========================================
    // RELACION CON REPUESTOS
    // ==========================================

    @OneToMany(
            mappedBy = "mantenimiento",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Repuesto> repuestos = new ArrayList<>();





    // ==========================================
    // DATOS DEL MANTENIMIENTO
    // ==========================================


    @Column(name = "fecha")
    private LocalDate fecha;



    @Column(name = "tipo", length = 50)
    private String tipo;



    @Column(columnDefinition = "TEXT")
    private String descripcion;



    @Column(name = "kilometraje")
    private Integer kilometraje;



    @Column(name = "costo", precision = 10, scale = 2)
    private BigDecimal costo;



    @Column(name = "taller", length = 100)
    private String taller;



    @Column(name = "proximo_mantenimiento")
    private Integer proximoMantenimiento;



    @Column(columnDefinition = "TEXT")
    private String observaciones;



    @Column(name = "proxima_fecha")
    private LocalDate proximaFecha;



    @Column(name = "estado", length = 20)
    private String estado;



    @Column(name = "created_at")
    private LocalDateTime createdAt;





    // ==========================================
    // PRE PERSIST
    // ==========================================

    @PrePersist
    public void prePersist() {


        if(createdAt == null){

            createdAt = LocalDateTime.now();

        }



        if(estado == null || estado.isEmpty()){

            estado = "FINALIZADO";

        }


    }





    // ==========================================
    // GETTERS Y SETTERS
    // ==========================================


    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }




    public Camion getCamion() {
        return camion;
    }


    public void setCamion(Camion camion) {
        this.camion = camion;
    }





    public List<Repuesto> getRepuestos() {
        return repuestos;
    }


    public void setRepuestos(List<Repuesto> repuestos) {
        this.repuestos = repuestos;
    }





    public LocalDate getFecha() {
        return fecha;
    }


    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }





    public String getTipo() {
        return tipo;
    }


    public void setTipo(String tipo) {
        this.tipo = tipo;
    }





    public String getDescripcion() {
        return descripcion;
    }


    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }





    public Integer getKilometraje() {
        return kilometraje;
    }


    public void setKilometraje(Integer kilometraje) {
        this.kilometraje = kilometraje;
    }





    public BigDecimal getCosto() {
        return costo;
    }


    public void setCosto(BigDecimal costo) {
        this.costo = costo;
    }





    public String getTaller() {
        return taller;
    }


    public void setTaller(String taller) {
        this.taller = taller;
    }





    public Integer getProximoMantenimiento() {
        return proximoMantenimiento;
    }


    public void setProximoMantenimiento(Integer proximoMantenimiento) {
        this.proximoMantenimiento = proximoMantenimiento;
    }





    public String getObservaciones() {
        return observaciones;
    }


    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }





    public LocalDate getProximaFecha() {
        return proximaFecha;
    }


    public void setProximaFecha(LocalDate proximaFecha) {
        this.proximaFecha = proximaFecha;
    }





    public String getEstado() {
        return estado;
    }


    public void setEstado(String estado) {
        this.estado = estado;
    }





    public LocalDateTime getCreatedAt() {
        return createdAt;
    }


    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

}