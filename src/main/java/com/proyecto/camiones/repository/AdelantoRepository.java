package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.proyecto.camiones.model.Adelanto;

import java.math.BigDecimal;
import java.util.List;

public interface AdelantoRepository extends JpaRepository<Adelanto, Integer> {

    List<Adelanto> findByEmpleadoIdAndEstadoOrderByFechaAscIdAsc(Integer empleadoId, String estado);

    @Query("""
            SELECT a FROM Adelanto a JOIN FETCH a.empleado
            ORDER BY CASE WHEN a.estado='PENDIENTE' THEN 0 ELSE 1 END, a.fecha DESC, a.id DESC""")
    List<Adelanto> listado();

    @Query("SELECT COALESCE(SUM(a.saldo),0) FROM Adelanto a WHERE a.estado='PENDIENTE'")
    BigDecimal saldoPendiente();
}
