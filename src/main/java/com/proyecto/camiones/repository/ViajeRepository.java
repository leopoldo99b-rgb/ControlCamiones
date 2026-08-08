package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.viajes;

public interface ViajeRepository extends JpaRepository<viajes, Long>{

}