package com.proyecto.camiones.repository;

import com.proyecto.camiones.model.MonitoreoParada;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonitoreoParadaRepository
        extends JpaRepository<MonitoreoParada, Integer> {

    List<MonitoreoParada>
        findByViaje_IdViajeOrderByNumeroParadaAsc(Integer idViaje);

    Optional<MonitoreoParada>
        findFirstByViaje_IdViajeAndFechaHoraFinIsNullOrderByNumeroParadaDesc(
            Integer idViaje
        );

    long countByViaje_IdViaje(Integer idViaje);
}
