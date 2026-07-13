package com.proyecto.camiones.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.AsignacionCamion;



public interface AsignacionRepository 
extends JpaRepository<AsignacionCamion, Long>{



    List<AsignacionCamion> findByEstado(String estado);



}