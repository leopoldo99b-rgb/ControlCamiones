package com.proyecto.camiones.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.MonitoreoViaje;

public interface MonitoreoViajeRepository
        extends JpaRepository<MonitoreoViaje, Integer> {

    List<MonitoreoViaje> findByEstado(String estado);

    boolean existsByIdVehiculoGpsAndEstado(String idVehiculoGps, String estado);
}
