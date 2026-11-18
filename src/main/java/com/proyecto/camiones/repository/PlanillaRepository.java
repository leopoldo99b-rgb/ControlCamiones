package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.proyecto.camiones.model.Planilla;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PlanillaRepository extends JpaRepository<Planilla, Integer> {

	interface MesNeto {
		String getMes();

		BigDecimal getNeto();
	}

	List<Planilla> findAllByOrderByFechaFinDescIdDesc();

	boolean existsByFrecuenciaAndFechaInicioAndFechaFin(String frecuencia, LocalDate inicio, LocalDate fin);

	long countByEstadoNot(String estado);

	@Query(value = "SELECT COALESCE(sum(total_neto),0) FROM planillas WHERE estado='PAGADA' AND date_trunc('month', fecha_pago)=date_trunc('month', now())", nativeQuery = true)
	BigDecimal netoMes();

	@Query(value = "SELECT COALESCE(sum(total_neto),0) FROM planillas WHERE estado='PAGADA' AND date_part('year', fecha_pago)=date_part('year', now())", nativeQuery = true)
	BigDecimal netoAnio();

	@Query(value = """
			SELECT to_char(date_trunc('month', fecha_pago),'YYYY-MM') AS mes, sum(total_neto) AS neto
			FROM planillas WHERE estado='PAGADA' AND fecha_pago > now() - interval '12 months'
			GROUP BY 1 ORDER BY 1""", nativeQuery = true)
	List<MesNeto> netoPorMes();
}
