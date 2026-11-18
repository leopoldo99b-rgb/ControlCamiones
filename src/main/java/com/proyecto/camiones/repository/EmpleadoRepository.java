package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.Empleado;

import java.time.LocalDate;
import java.util.List;

public interface EmpleadoRepository extends JpaRepository<Empleado, Integer> {
    List<Empleado> findAllByOrderByActivoDescNombreAsc();
    List<Empleado> findByActivoTrue();
    List<Empleado> findByActivoTrueAndFrecuenciaPagoAndFechaIngresoLessThanEqual(String frecuencia, LocalDate hasta);
    long countByActivoTrue();
    boolean existsByCodigo(String codigo);
}
