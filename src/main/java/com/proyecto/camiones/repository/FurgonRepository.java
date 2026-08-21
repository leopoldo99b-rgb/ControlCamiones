package com.proyecto.camiones.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.camiones.model.Furgon;

public interface FurgonRepository extends JpaRepository<Furgon, Long> {

    List<Furgon> findAllByOrderByFurgonAsc();

    Optional<Furgon> findByFurgon(String furgon);
}