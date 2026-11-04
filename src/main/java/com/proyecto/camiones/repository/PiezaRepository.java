package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.proyecto.camiones.model.Pieza;

import java.util.List;

public interface PiezaRepository extends JpaRepository<Pieza, Long> {

    @Query("select p from Pieza p join fetch p.categoria join fetch p.lugar "
         + "where p.activo = true order by p.codigo")
    List<Pieza> listarActivas();

    boolean existsByCodigo(String codigo);
}
