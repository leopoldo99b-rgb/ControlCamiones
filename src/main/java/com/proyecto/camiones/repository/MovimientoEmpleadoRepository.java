package com.proyecto.camiones.repository;

import com.proyecto.camiones.model.MovimientoEmpleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface MovimientoEmpleadoRepository extends JpaRepository<MovimientoEmpleado, Long> {

	// =========================================================
	// LISTADOS
	// =========================================================

	/**
	 * Todos los movimientos ordenados del más reciente al más antiguo.
	 */
	List<MovimientoEmpleado> findAllByOrderByFechaDescIdDesc();

	/**
	 * Movimientos de un empleado.
	 */
	List<MovimientoEmpleado> findByEmpleadoIdOrderByFechaDescIdDesc(Long empleadoId);

	/**
	 * Filtrar por tipo.
	 */
	List<MovimientoEmpleado> findByTipoOrderByFechaDescIdDesc(String tipo);

	/**
	 * Filtrar por empleado y tipo.
	 */
	List<MovimientoEmpleado> findByEmpleadoIdAndTipoOrderByFechaDescIdDesc(Long empleadoId, String tipo);

	// =========================================================
	// TOTALES
	// =========================================================

	/**
	 * Total de bonos.
	 */
	@Query("""
			    SELECT COALESCE(SUM(m.monto), 0)
			    FROM MovimientoEmpleado m
			    WHERE m.tipo = 'BONO'
			""")
	BigDecimal totalBonos();

	/**
	 * Total de deducciones.
	 */
	@Query("""
			    SELECT COALESCE(SUM(m.monto), 0)
			    FROM MovimientoEmpleado m
			    WHERE m.tipo = 'DEDUCCION'
			""")
	BigDecimal totalDeducciones();

	/**
	 * Total de anticipos.
	 */
	@Query("""
			    SELECT COALESCE(SUM(m.monto), 0)
			    FROM MovimientoEmpleado m
			    WHERE m.tipo = 'ANTICIPO'
			""")
	BigDecimal totalAnticipos();

	/**
	 * Cantidad total de movimientos.
	 */
	long count();

	// =========================================================
	// TOTALES POR EMPLEADO
	// =========================================================

	@Query("""
			    SELECT COALESCE(SUM(m.monto), 0)
			    FROM MovimientoEmpleado m
			    WHERE m.empleado.id = :empleadoId
			    AND m.tipo = 'BONO'
			""")
	BigDecimal totalBonosPorEmpleado(@Param("empleadoId") Long empleadoId);

	@Query("""
			    SELECT COALESCE(SUM(m.monto), 0)
			    FROM MovimientoEmpleado m
			    WHERE m.empleado.id = :empleadoId
			    AND m.tipo = 'DEDUCCION'
			""")
	BigDecimal totalDeduccionesPorEmpleado(@Param("empleadoId") Long empleadoId);

	@Query("""
			    SELECT COALESCE(SUM(m.monto), 0)
			    FROM MovimientoEmpleado m
			    WHERE m.empleado.id = :empleadoId
			    AND m.tipo = 'ANTICIPO'
			""")
	BigDecimal totalAnticiposPorEmpleado(@Param("empleadoId") Long empleadoId);
}