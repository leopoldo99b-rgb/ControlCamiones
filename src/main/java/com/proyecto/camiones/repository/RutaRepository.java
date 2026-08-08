package com.proyecto.camiones.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.proyecto.camiones.model.Ruta;

public interface RutaRepository extends JpaRepository<Ruta, Long>{

    @Query(value = """
        SELECT *
        FROM rutas
        WHERE estado='ACTIVA'
        ORDER BY
            split_part(destino,' ',1),
            CASE
                WHEN regexp_replace(destino,'[^0-9]','','g')='' THEN 0
                ELSE regexp_replace(destino,'[^0-9]','','g')::int
            END
        """, nativeQuery = true)
    List<Ruta> listarRutas();

}