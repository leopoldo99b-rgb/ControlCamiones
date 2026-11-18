package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.Informe;

public interface InformeRepository extends JpaRepository<Informe, Long> {}