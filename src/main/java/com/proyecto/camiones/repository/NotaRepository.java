package com.proyecto.camiones.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.proyecto.camiones.model.Nota;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Long> {

    // =========================================================
    // TODAS LAS NOTAS
    // =========================================================

    List<Nota> findAllByOrderByFechaDescCreatedAtDesc();


    // =========================================================
    // NOTAS DE UNA FECHA
    // =========================================================

    List<Nota> findByFechaOrderByCreatedAtDesc(
            LocalDate fecha
    );

}