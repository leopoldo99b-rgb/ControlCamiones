package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.proyecto.camiones.model.Abastecimiento;

public interface AbastecimientoRepository
        extends JpaRepository<Abastecimiento, Long>,
                JpaSpecificationExecutor<Abastecimiento> {

}