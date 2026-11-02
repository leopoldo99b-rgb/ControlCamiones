package com.proyecto.camiones.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.MonitoreoViaje;

public interface MonitoreoViajeRepository extends JpaRepository<MonitoreoViaje, Integer> {

    /** Viajes por estado (lo usa el monitoreo automático: "En curso"). */
    List<MonitoreoViaje> findByEstado(String estado);

    /** ¿La unidad ya tiene un viaje en ese estado? */
    boolean existsByIdVehiculoGpsAndEstado(String idVehiculoGps, String estado);

    /** Reporte: viajes cuya fecha de inicio está en [desde, hastaExclusivo). */
    List<MonitoreoViaje> findByFechaInicioGreaterThanEqualAndFechaInicioLessThanOrderByFechaInicioAsc(
            LocalDateTime desde, LocalDateTime hastaExclusivo);
}