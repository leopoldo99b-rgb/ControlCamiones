package com.proyecto.camiones.model;


import java.math.BigDecimal;

import jakarta.persistence.*;


@Entity
@Table(name="repuestos")
public class Repuesto {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



    // ==========================================
    // RELACION CON MANTENIMIENTO
    // ==========================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="mantenimiento_id", nullable=false)
    private Mantenimiento mantenimiento;



    // ==========================================
    // DATOS DEL REPUESTO
    // ==========================================

    @Column(name="nombre", length=100)
    private String nombre;



    @Column(name="cantidad")
    private Integer cantidad;



    @Column(name="precio", precision=10, scale=2)
    private BigDecimal precio;



    @Column(name="subtotal", precision=10, scale=2)
    private BigDecimal subtotal;



    // ==========================================
    // GETTERS Y SETTERS
    // ==========================================


    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }



    public Mantenimiento getMantenimiento() {
        return mantenimiento;
    }


    public void setMantenimiento(Mantenimiento mantenimiento) {
        this.mantenimiento = mantenimiento;
    }



    public String getNombre() {
        return nombre;
    }


    public void setNombre(String nombre) {
        this.nombre = nombre;
    }



    public Integer getCantidad() {
        return cantidad;
    }


    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }



    public BigDecimal getPrecio() {
        return precio;
    }


    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }



    public BigDecimal getSubtotal() {
        return subtotal;
    }


    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

}