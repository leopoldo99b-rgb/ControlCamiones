package com.proyecto.camiones.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.MonitoreoRecorrido;

public interface MonitoreoRecorridoRepository
        extends JpaRepository<MonitoreoRecorrido, Long> {

    List<MonitoreoRecorrido> findByViaje_IdViajeOrderByFechaHoraAsc(Integer idViaje);

    Optional<MonitoreoRecorrido> findFirstByViaje_IdViajeOrderByFechaHoraDesc(Integer idViaje);
}
