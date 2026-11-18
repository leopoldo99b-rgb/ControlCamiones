package com.proyecto.camiones.services;

import com.proyecto.camiones.exception.NegocioException;
import com.proyecto.camiones.model.Adelanto;
import com.proyecto.camiones.repository.AdelantoRepository;
import com.proyecto.camiones.repository.EmpleadoRepository;
import dto.PlanillaDtos.AdelantoRequest;
import dto.PlanillaDtos.AdelantoResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class AdelantoService {
	private final AdelantoRepository repo;
	private final EmpleadoRepository empleadoRepo;

	public AdelantoService(AdelantoRepository repo, EmpleadoRepository empleadoRepo) {
		this.repo = repo;
		this.empleadoRepo = empleadoRepo;
	}

	@Transactional(readOnly = true)
	public List<AdelantoResponse> listar() {
		return repo.listado().stream().map(AdelantoResponse::de).toList();
	}

	@Transactional
	public AdelantoResponse crear(AdelantoRequest r) {
		if (r.empleadoId() == null)
			throw new NegocioException("Selecciona un empleado.");
		if (r.tipo() == null || !Set.of("ADELANTO", "VALE", "PRESTAMO").contains(r.tipo()))
			throw new NegocioException("Tipo inválido.");
		if (r.monto() == null || r.monto().signum() <= 0)
			throw new NegocioException("El monto debe ser mayor a cero.");
		boolean prestamo = "PRESTAMO".equals(r.tipo());
		if (prestamo && (r.cuota() == null || r.cuota().signum() <= 0))
			throw new NegocioException("Indica la cuota del préstamo.");
		Adelanto a = new Adelanto();
		a.setEmpleado(empleadoRepo.findById(r.empleadoId()).orElseThrow());
		a.setTipo(r.tipo());
		a.setFecha(r.fecha() == null ? LocalDate.now() : r.fecha());
		a.setMonto(r.monto());
		a.setSaldo(r.monto());
		a.setCuotaPorPlanilla(prestamo ? r.cuota().min(r.monto()) : null);
		a.setMotivo(r.motivo());
		return AdelantoResponse.de(repo.save(a));
	}
}