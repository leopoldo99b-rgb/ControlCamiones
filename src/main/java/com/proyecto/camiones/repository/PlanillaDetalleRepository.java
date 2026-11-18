package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.proyecto.camiones.model.PlanillaDetalle;

import java.math.BigDecimal;
import java.util.List;

public interface PlanillaDetalleRepository extends JpaRepository<PlanillaDetalle, Integer> {

	interface PagadoEmpleado {
		String getCodigo();

		String getNombre();

		BigDecimal getPagado();

		Long getPlanillas();
	}

	List<PlanillaDetalle> findByPlanillaIdOrderByEmpleadoNombreAsc(Integer planillaId);

	long countByPlanillaId(Integer planillaId);

	@Query(value = """
			SELECT e.codigo AS codigo, e.nombre AS nombre, COALESCE(sum(d.neto),0) AS pagado, count(d.id) AS planillas
			FROM empleados e
			LEFT JOIN planilla_detalle d ON d.empleado_id=e.id
			     AND d.planilla_id IN (SELECT id FROM planillas WHERE estado='PAGADA')
			GROUP BY e.id, e.codigo, e.nombre ORDER BY pagado DESC""", nativeQuery = true)
	List<PagadoEmpleado> pagadoPorEmpleado();
}
