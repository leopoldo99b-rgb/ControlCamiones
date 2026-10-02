package com.proyecto.camiones.services;

import com.proyecto.camiones.model.Empleado;
import com.proyecto.camiones.model.MovimientoEmpleado;
import com.proyecto.camiones.repository.EmpleadoRepository;
import com.proyecto.camiones.repository.MovimientoEmpleadoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class MovimientoEmpleadoService {

	private final MovimientoEmpleadoRepository movimientoRepository;
	private final EmpleadoRepository empleadoRepository;

	public MovimientoEmpleadoService(MovimientoEmpleadoRepository movimientoRepository,
			EmpleadoRepository empleadoRepository) {

		this.movimientoRepository = movimientoRepository;
		this.empleadoRepository = empleadoRepository;
	}

	// =========================================================
	// LISTAR
	// =========================================================

	@Transactional(readOnly = true)
	public List<MovimientoEmpleado> listarTodos() {

		return movimientoRepository.findAllByOrderByFechaDescIdDesc();
	}

	// =========================================================
	// BUSCAR POR ID
	// =========================================================

	@Transactional(readOnly = true)
	public MovimientoEmpleado buscarPorId(Long id) {

		return movimientoRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Movimiento no encontrado con ID: " + id));
	}

	// =========================================================
	// LISTAR POR EMPLEADO
	// =========================================================

	@Transactional(readOnly = true)
	public List<MovimientoEmpleado> listarPorEmpleado(Long empleadoId) {

		return movimientoRepository.findByEmpleadoIdOrderByFechaDescIdDesc(empleadoId);
	}

	// =========================================================
	// GUARDAR
	// =========================================================

	public MovimientoEmpleado guardar(Long empleadoId, String tipo, BigDecimal monto, LocalDate fecha,
			String descripcion) {

		// -----------------------------------------
		// Validar empleado
		// -----------------------------------------

		Empleado empleado = empleadoRepository.findById(empleadoId)
				.orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + empleadoId));

		// -----------------------------------------
		// Validar tipo
		// -----------------------------------------

		if (tipo == null || tipo.isBlank()) {

			throw new IllegalArgumentException("El tipo de movimiento es obligatorio.");
		}

		tipo = tipo.trim().toUpperCase();

		if (!tipo.equals("BONO") && !tipo.equals("DEDUCCION") && !tipo.equals("ANTICIPO")) {

			throw new IllegalArgumentException("Tipo de movimiento no válido.");
		}

		// -----------------------------------------
		// Validar monto
		// -----------------------------------------

		if (monto == null) {

			throw new IllegalArgumentException("El monto es obligatorio.");
		}

		if (monto.compareTo(BigDecimal.ZERO) <= 0) {

			throw new IllegalArgumentException("El monto debe ser mayor que cero.");
		}

		// -----------------------------------------
		// Validar fecha
		// -----------------------------------------

		if (fecha == null) {

			throw new IllegalArgumentException("La fecha es obligatoria.");
		}

		// -----------------------------------------
		// Crear movimiento
		// -----------------------------------------

		MovimientoEmpleado movimiento = new MovimientoEmpleado();

		movimiento.setEmpleado(empleado);
		movimiento.setTipo(tipo);
		movimiento.setMonto(monto);
		movimiento.setFecha(fecha);

		if (descripcion != null) {

			descripcion = descripcion.trim();

			if (descripcion.length() > 500) {

				throw new IllegalArgumentException("La descripción no puede superar los 500 caracteres.");
			}

			movimiento.setDescripcion(descripcion.isBlank() ? null : descripcion);
		}

		return movimientoRepository.save(movimiento);
	}

	// =========================================================
	// ACTUALIZAR
	// =========================================================

	public MovimientoEmpleado actualizar(Long id, Long empleadoId, String tipo, BigDecimal monto, LocalDate fecha,
			String descripcion) {

		MovimientoEmpleado movimiento = buscarPorId(id);

		Empleado empleado = empleadoRepository.findById(empleadoId)
				.orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + empleadoId));

		if (tipo == null || tipo.isBlank()) {

			throw new IllegalArgumentException("El tipo de movimiento es obligatorio.");
		}

		tipo = tipo.trim().toUpperCase();

		if (!tipo.equals("BONO") && !tipo.equals("DEDUCCION") && !tipo.equals("ANTICIPO")) {

			throw new IllegalArgumentException("Tipo de movimiento no válido.");
		}

		if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {

			throw new IllegalArgumentException("El monto debe ser mayor que cero.");
		}

		if (fecha == null) {

			throw new IllegalArgumentException("La fecha es obligatoria.");
		}

		movimiento.setEmpleado(empleado);
		movimiento.setTipo(tipo);
		movimiento.setMonto(monto);
		movimiento.setFecha(fecha);

		if (descripcion != null) {

			descripcion = descripcion.trim();

			if (descripcion.length() > 500) {

				throw new IllegalArgumentException("La descripción no puede superar los 500 caracteres.");
			}

			movimiento.setDescripcion(descripcion.isBlank() ? null : descripcion);

		} else {

			movimiento.setDescripcion(null);
		}

		return movimientoRepository.save(movimiento);
	}

	// =========================================================
	// ELIMINAR
	// =========================================================

	public void eliminar(Long id) {

		if (!movimientoRepository.existsById(id)) {

			throw new RuntimeException("Movimiento no encontrado con ID: " + id);
		}

		movimientoRepository.deleteById(id);
	}

	// =========================================================
	// ESTADÍSTICAS
	// =========================================================

	@Transactional(readOnly = true)
	public BigDecimal obtenerTotalBonos() {

		return movimientoRepository.totalBonos();
	}

	@Transactional(readOnly = true)
	public BigDecimal obtenerTotalDeducciones() {

		return movimientoRepository.totalDeducciones();
	}

	@Transactional(readOnly = true)
	public BigDecimal obtenerTotalAnticipos() {

		return movimientoRepository.totalAnticipos();
	}

	@Transactional(readOnly = true)
	public long obtenerTotalMovimientos() {

		return movimientoRepository.count();
	}

	// =========================================================
	// ESTADÍSTICAS POR EMPLEADO
	// =========================================================

	@Transactional(readOnly = true)
	public BigDecimal obtenerBonosPorEmpleado(Long empleadoId) {

		return movimientoRepository.totalBonosPorEmpleado(empleadoId);
	}

	@Transactional(readOnly = true)
	public BigDecimal obtenerDeduccionesPorEmpleado(Long empleadoId) {

		return movimientoRepository.totalDeduccionesPorEmpleado(empleadoId);
	}

	@Transactional(readOnly = true)
	public BigDecimal obtenerAnticiposPorEmpleado(Long empleadoId) {

		return movimientoRepository.totalAnticiposPorEmpleado(empleadoId);
	}
}