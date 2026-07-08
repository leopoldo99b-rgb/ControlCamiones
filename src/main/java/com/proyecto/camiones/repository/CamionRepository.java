package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.proyecto.camiones.model.Camion;

@Repository
public interface CamionRepository extends JpaRepository<Camion, Long> {
}