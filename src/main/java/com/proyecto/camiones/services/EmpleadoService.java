package com.proyecto.camiones.services;

import com.proyecto.camiones.exception.NegocioException;
import com.proyecto.camiones.model.Empleado;
import com.proyecto.camiones.repository.EmpleadoRepository;
import dto.PlanillaDtos.EmpleadoRequest;
import dto.PlanillaDtos.EmpleadoResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
public class EmpleadoService {
    static final Set<String> FRECUENCIAS = Set.of("SEMANAL", "QUINCENAL", "MENSUAL");
    private final EmpleadoRepository repo;

    public EmpleadoService(EmpleadoRepository repo) { this.repo = repo; }

    @Transactional(readOnly = true)
    public List<EmpleadoResponse> listar() {
        return repo.findAllByOrderByActivoDescNombreAsc().stream().map(EmpleadoResponse::de).toList();
    }

    @Transactional
    public EmpleadoResponse crear(EmpleadoRequest r) {
        if (r.codigo() == null || r.codigo().isBlank()) throw new NegocioException("El código es obligatorio.");
        if (repo.existsByCodigo(r.codigo().trim())) throw new NegocioException("Ya existe un empleado con ese código.");
        Empleado e = new Empleado();
        e.setCodigo(r.codigo().trim());
        aplicar(e, r);
        return EmpleadoResponse.de(repo.save(e));
    }

    @Transactional
    public EmpleadoResponse editar(Integer id, EmpleadoRequest r) {
        Empleado e = repo.findById(id).orElseThrow();
        aplicar(e, r);
        return EmpleadoResponse.de(e);
    }

    private void aplicar(Empleado e, EmpleadoRequest r) {
        if (r.nombre() == null || r.nombre().isBlank()) throw new NegocioException("El nombre es obligatorio.");
        if (r.frecuenciaPago() == null || !FRECUENCIAS.contains(r.frecuenciaPago())) throw new NegocioException("Frecuencia de pago inválida.");
        if (r.salarioMensual() == null || r.salarioMensual().compareTo(BigDecimal.ZERO) < 0) throw new NegocioException("El salario mensual es obligatorio.");
        if (r.fechaIngreso() == null) throw new NegocioException("La fecha de ingreso es obligatoria.");
        e.setNombre(r.nombre().trim());
        e.setIdentidad(r.identidad());
        e.setCargo(r.cargo());
        e.setFrecuenciaPago(r.frecuenciaPago());
        e.setSalarioMensual(r.salarioMensual());
        e.setFechaIngreso(r.fechaIngreso());
        e.setActivo(!Boolean.FALSE.equals(r.activo()));
    }
}