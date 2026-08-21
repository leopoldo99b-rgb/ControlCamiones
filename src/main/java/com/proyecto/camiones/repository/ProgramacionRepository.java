package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.proyecto.camiones.model.Programacion;

@Repository
public interface ProgramacionRepository extends JpaRepository<Programacion, Integer> {

}