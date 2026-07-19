package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.proyecto.camiones.model.TipoMantenimiento;


@Repository
public interface TipoMantenimientoRepository 
        extends JpaRepository<TipoMantenimiento, Long> {


}