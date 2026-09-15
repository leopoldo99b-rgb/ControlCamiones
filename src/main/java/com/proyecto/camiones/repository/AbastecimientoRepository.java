package com.proyecto.camiones.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.proyecto.camiones.model.Abastecimiento;

public interface AbastecimientoRepository
        extends JpaRepository<Abastecimiento, Long>,
                JpaSpecificationExecutor<Abastecimiento> {

    @Modifying
    @Query("DELETE FROM Abastecimiento a WHERE a.id = :id")
    int eliminarPorId(
            @Param("id") Long id
    );
}