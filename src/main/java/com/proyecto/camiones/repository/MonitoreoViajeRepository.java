package com.proyecto.camiones.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.proyecto.camiones.model.MonitoreoViaje;

public interface MonitoreoViajeRepository extends JpaRepository<MonitoreoViaje, Integer> {

    /** Viajes por estado (lo usa el monitoreo automático: "En curso"). */
    List<MonitoreoViaje> findByEstado(String estado);
    
    boolean existsByIdVehiculoGpsAndEstadoIn(String idVehiculoGps, java.util.Collection<String> estados);

    /** Viajes en cualquiera de los estados (el monitoreo vigila "Programado" y "En curso"). */
    List<MonitoreoViaje> findByEstadoIn(List<String> estados);

    /** Siguiente ID libre, para viajes sin ID manual y para los retornos automáticos. */
    @Query("select coalesce(max(v.idViaje), 0) + 1 from MonitoreoViaje v")
    Integer siguienteId();

    /** ¿La unidad ya tiene un viaje en ese estado? */
    boolean existsByIdVehiculoGpsAndEstado(String idVehiculoGps, String estado);

    /** Reporte: viajes cuya fecha de inicio está en [desde, hastaExclusivo). */
    List<MonitoreoViaje> findByFechaInicioGreaterThanEqualAndFechaInicioLessThanOrderByFechaInicioAsc(
            LocalDateTime desde, LocalDateTime hastaExclusivo);
}