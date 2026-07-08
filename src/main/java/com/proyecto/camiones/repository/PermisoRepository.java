package com.proyecto.camiones.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.Permiso;


public interface PermisoRepository 
extends JpaRepository<Permiso, Long>{

}