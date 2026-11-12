package com.proyecto.camiones.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.proyecto.camiones.model.CamionFoto;

@Repository
public interface CamionFotoRepository extends JpaRepository<CamionFoto, Long> {

    List<CamionFoto> findByCamionIdOrderByIdDesc(Long camionId);
}