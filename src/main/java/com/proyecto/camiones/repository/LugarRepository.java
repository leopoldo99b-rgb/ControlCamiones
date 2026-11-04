package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.Lugar;

import java.util.Optional;

public interface LugarRepository extends JpaRepository<Lugar, Long> {
    Optional<Lugar> findByNombreIgnoreCase(String nombre);
}
