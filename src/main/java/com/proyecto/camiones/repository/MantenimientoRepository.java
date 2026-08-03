package com.proyecto.camiones.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.proyecto.camiones.model.Mantenimiento;

import dto.GraficoDTO;

@Repository
public interface MantenimientoRepository
        extends JpaRepository<Mantenimiento, Long>,
                JpaSpecificationExecutor<Mantenimiento> {

    //=====================================================
    // MANTENIMIENTOS POR TIPO
    //=====================================================

    @Query("""
        SELECT new dto.GraficoDTO(
            m.tipo,
            COUNT(m)
        )
        FROM Mantenimiento m
        GROUP BY m.tipo
        ORDER BY m.tipo
    """)
    List<GraficoDTO> contarPorTipo();


    //=====================================================
    // MANTENIMIENTOS POR ESTADO
    //=====================================================

    @Query("""
        SELECT new dto.GraficoDTO(
            m.estado,
            COUNT(m)
        )
        FROM Mantenimiento m
        GROUP BY m.estado
        ORDER BY m.estado
    """)
    List<GraficoDTO> contarPorEstado();


    //=====================================================
    // COSTO POR CAMIÓN
    //=====================================================

    @Query("""
        SELECT new dto.GraficoDTO(
            m.camion.placa,
            SUM(m.costo)
        )
        FROM Mantenimiento m
        GROUP BY m.camion.placa
        ORDER BY SUM(m.costo) DESC
    """)
    List<GraficoDTO> costosPorCamion();


  //=====================================================
 // COSTO POR MES
 //=====================================================

 @Query(value = """
     SELECT
         CASE EXTRACT(MONTH FROM fecha)
             WHEN 1 THEN 'Enero'
             WHEN 2 THEN 'Febrero'
             WHEN 3 THEN 'Marzo'
             WHEN 4 THEN 'Abril'
             WHEN 5 THEN 'Mayo'
             WHEN 6 THEN 'Junio'
             WHEN 7 THEN 'Julio'
             WHEN 8 THEN 'Agosto'
             WHEN 9 THEN 'Septiembre'
             WHEN 10 THEN 'Octubre'
             WHEN 11 THEN 'Noviembre'
             WHEN 12 THEN 'Diciembre'
         END AS mes,
         SUM(costo) AS total
     FROM mantenimientos
     GROUP BY EXTRACT(MONTH FROM fecha)
     ORDER BY EXTRACT(MONTH FROM fecha)
 """, nativeQuery = true)
 List<Object[]> costosPorMes();


    //=====================================================
    // PRÓXIMOS VS VENCIDOS
    //=====================================================

    @Query("""
        SELECT new dto.GraficoDTO(
            CASE
                WHEN m.proximaFecha >= CURRENT_DATE
                    THEN 'Próximos'
                ELSE 'Vencidos'
            END,
            COUNT(m)
        )
        FROM Mantenimiento m
        WHERE m.proximaFecha IS NOT NULL
        GROUP BY
            CASE
                WHEN m.proximaFecha >= CURRENT_DATE
                    THEN 'Próximos'
                ELSE 'Vencidos'
            END
    """)
    List<GraficoDTO> proximosVsVencidos();


    //=====================================================
    // DASHBOARD (TOTAL MANTENIMIENTOS)
    //=====================================================

    @Query("""
        SELECT new dto.GraficoDTO(
            'Total',
            COUNT(m)
        )
        FROM Mantenimiento m
    """)
    List<GraficoDTO> dashboard();

}