package com.proyecto.camiones.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.EstadoPago;
import com.proyecto.camiones.model.HistorialPlanilla;

import java.util.List;

public interface HistorialPlanillaRepository
        extends JpaRepository<HistorialPlanilla, Long> {

    List<HistorialPlanilla> findByPlanillaId(Long planillaId);

    List<HistorialPlanilla> findByPlanillaIdOrderByIdAsc(Long planillaId);

    List<HistorialPlanilla> findByEmpleadoId(Long empleadoId);

    List<HistorialPlanilla> findByPlanillaIdAndEstadoPago(
            Long planillaId,
            EstadoPago estadoPago
    );

    long countByPlanillaId(Long planillaId);

    long countByPlanillaIdAndEstadoPago(
            Long planillaId,
            EstadoPago estadoPago
    );

    boolean existsByPlanillaIdAndEmpleadoId(
            Long planillaId,
            Long empleadoId
    );
}