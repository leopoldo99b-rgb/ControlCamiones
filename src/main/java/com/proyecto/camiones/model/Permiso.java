package com.proyecto.camiones.model;


import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;


@Entity
@Table(name="permisos")
public class Permiso {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(name="nombre", unique=true, nullable=false)
    private String nombre;



    @ManyToMany(mappedBy="permisos")
    @JsonIgnore
    private Set<Usuario> usuarios;



    public Permiso(){

    }



    public Long getId(){

        return id;

    }



    public void setId(Long id){

        this.id = id;

    }



    public String getNombre(){

        return nombre;

    }



    public void setNombre(String nombre){

        this.nombre = nombre;

    }



    public Set<Usuario> getUsuarios(){

        return usuarios;

    }



    public void setUsuarios(Set<Usuario> usuarios){

        this.usuarios = usuarios;

    }


}