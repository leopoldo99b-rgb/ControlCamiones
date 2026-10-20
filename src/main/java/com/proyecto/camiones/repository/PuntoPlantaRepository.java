package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.PuntoPlanta;
import com.proyecto.camiones.model.TipoPunto;

import java.util.List;
import java.util.Optional;

public interface PuntoPlantaRepository
        extends JpaRepository<PuntoPlanta, Long> {

    List<PuntoPlanta> findByActivoTrueOrderByNombreAsc();

    List<PuntoPlanta> findByTipoAndActivoTrueOrderByNombreAsc(
            TipoPunto tipo
    );

    Optional<PuntoPlanta> findByIdAndActivoTrue(Long id);
}
