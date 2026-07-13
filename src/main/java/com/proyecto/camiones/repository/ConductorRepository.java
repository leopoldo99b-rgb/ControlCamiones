package com.proyecto.camiones.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.Conductor;



public interface ConductorRepository 
        extends JpaRepository<Conductor, Long> {



    List<Conductor> findByEstado(String estado);



}