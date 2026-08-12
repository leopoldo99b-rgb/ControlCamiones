package com.proyecto.camiones.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.proyecto.camiones.model.Recorrido;

@Repository
public interface RecorridoRepository
        extends JpaRepository<Recorrido, Long> {

    List<Recorrido> findAllByOrderByFechaDescIdDesc();

}