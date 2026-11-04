package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.proyecto.camiones.model.Movimiento;

import java.util.List;

public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {

    @Query("select m from Movimiento m join fetch m.pieza order by m.fecha desc, m.id desc")
    List<Movimiento> listarTodos();

    boolean existsByPiezaId(Long piezaId);
}
