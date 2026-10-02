package com.proyecto.camiones.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.EstadoPlanilla;
import com.proyecto.camiones.model.Planilla;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlanillaRepository extends JpaRepository<Planilla, Long> {

    Optional<Planilla> findByNumeroPlanilla(String numeroPlanilla);

    boolean existsByNumeroPlanilla(String numeroPlanilla);

    List<Planilla> findAllByOrderByFechaPagoDesc();

    List<Planilla> findByEstadoOrderByFechaPagoDesc(
            EstadoPlanilla estado
    );

    List<Planilla> findByFechaPagoBetweenOrderByFechaPagoDesc(
            LocalDate fechaDesde,
            LocalDate fechaHasta
    );
}
