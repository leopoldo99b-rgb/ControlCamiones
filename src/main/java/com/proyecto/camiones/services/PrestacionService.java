package com.proyecto.camiones.services;

import com.proyecto.camiones.exception.NegocioException;
import com.proyecto.camiones.model.Empleado;
import com.proyecto.camiones.model.Prestacion;
import com.proyecto.camiones.repository.EmpleadoRepository;
import com.proyecto.camiones.repository.PrestacionRepository;
import dto.PlanillaDtos.PrestacionRequest;
import dto.PlanillaDtos.PrestacionResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
public class PrestacionService {
	private final PrestacionRepository repo;
	private final EmpleadoRepository empleadoRepo;

	public PrestacionService(PrestacionRepository repo, EmpleadoRepository empleadoRepo) {
		this.repo = repo;
		this.empleadoRepo = empleadoRepo;
	}

	@Transactional(readOnly = true)
	public List<PrestacionResponse> listar(String tipo, int anio) {
		return repo.findByTipoAndAnioOrderByEmpleadoNombreAsc(tipo, anio).stream().map(PrestacionResponse::de).toList();
	}

	/**
	 * Decimocuarto: 1 jul (año-1) a 30 jun. Aguinaldo: 1 ene a 31 dic. Un salario
	 * mensual por 12 meses.
	 */
	@Transactional
	public Map<String, Integer> generar(PrestacionRequest r) {
		if (r.tipo() == null || r.anio() == null || !List.of("DECIMOCUARTO", "AGUINALDO").contains(r.tipo()))
			throw new NegocioException("Indica el tipo y el año.");
		boolean dec14 = "DECIMOCUARTO".equals(r.tipo());
		LocalDate ini = dec14 ? LocalDate.of(r.anio() - 1, 7, 1) : LocalDate.of(r.anio(), 1, 1);
		LocalDate fin = dec14 ? LocalDate.of(r.anio(), 6, 30) : LocalDate.of(r.anio(), 12, 31);
		int nuevos = 0;
		for (Empleado e : empleadoRepo.findByActivoTrue()) {
			LocalDate desde = e.getFechaIngreso().isAfter(ini) ? e.getFechaIngreso() : ini;
			if (desde.isAfter(fin) || repo.existsByTipoAndAnioAndEmpleadoId(r.tipo(), r.anio(), e.getId()))
				continue;
			BigDecimal meses = BigDecimal.valueOf(ChronoUnit.DAYS.between(desde, fin) + 1)
					.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP).min(BigDecimal.valueOf(12));
			Prestacion p = new Prestacion();
			p.setTipo(r.tipo());
			p.setAnio(r.anio());
			p.setEmpleado(e);
			p.setPeriodoInicio(desde);
			p.setPeriodoFin(fin);
			p.setMeses(meses);
			p.setSalarioBase(e.getSalarioMensual());
			p.setMonto(e.getSalarioMensual().multiply(meses).divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP));
			repo.save(p);
			nuevos++;
		}
		return Map.of("nuevos", nuevos);
	}

	@Transactional
	public void pagar(Integer id) {
		Prestacion p = repo.findById(id).orElseThrow();
		if ("PENDIENTE".equals(p.getEstado())) {
			p.setEstado("PAGADO");
			p.setFechaPago(LocalDateTime.now());
		}
	}
}