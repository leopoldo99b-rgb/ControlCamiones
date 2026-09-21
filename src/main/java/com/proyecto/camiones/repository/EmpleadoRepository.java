package com.proyecto.camiones.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.proyecto.camiones.model.Empleado;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {

    Optional<Empleado> findByIdentidad(String identidad);

    boolean existsByIdentidad(String identidad);

    List<Empleado> findByEstado(String estado);

    List<Empleado> findByCargo(String cargo);

    List<Empleado> findByTipoSalario(String tipoSalario);

    List<Empleado> findByNombreCompletoContainingIgnoreCase(
            String nombre
    );
}