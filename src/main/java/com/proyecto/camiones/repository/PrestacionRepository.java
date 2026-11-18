package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.Prestacion;

import java.util.List;

public interface PrestacionRepository extends JpaRepository<Prestacion, Integer> {
	List<Prestacion> findByTipoAndAnioOrderByEmpleadoNombreAsc(String tipo, Integer anio);

	boolean existsByTipoAndAnioAndEmpleadoId(String tipo, Integer anio, Integer empleadoId);
}
