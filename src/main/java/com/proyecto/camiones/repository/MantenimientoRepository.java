package com.proyecto.camiones.repository;

import com.proyecto.camiones.model.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MantenimientoRepository extends JpaRepository<Mantenimiento, Integer> {

}