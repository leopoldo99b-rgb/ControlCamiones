package com.proyecto.camiones.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.proyecto.camiones.model.Conductor;

public interface ConductorRepository
extends JpaRepository<Conductor, Long> {

    List<Conductor> findByEstado(String estado);

    @Query("""
        SELECT CONCAT(c.nombre,' ',c.apellido)
        FROM Conductor c
        WHERE c.estado='ACTIVO'
        ORDER BY c.nombre,c.apellido
    """)
    List<String> listarConductores();

}