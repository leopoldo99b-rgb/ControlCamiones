package com.proyecto.camiones.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.Combustible;

public interface CombustibleRepository
        extends JpaRepository<Combustible, Long> {

    // =========================================================
    // COMBUSTIBLES ACTIVOS
    // =========================================================

    List<Combustible> findByActivoTrueOrderByNombreAsc();


    // =========================================================
    // BUSCAR POR NOMBRE
    // =========================================================

    Optional<Combustible> findByNombreIgnoreCase(
            String nombre
    );


    // =========================================================
    // VALIDAR SI EXISTE NOMBRE
    // =========================================================

    boolean existsByNombreIgnoreCase(
            String nombre
    );
}