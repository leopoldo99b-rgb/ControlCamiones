package com.proyecto.camiones.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tipos_mantenimiento")
public class TipoMantenimiento {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(nullable = false, unique = true, length = 80)
    private String nombre;



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

}