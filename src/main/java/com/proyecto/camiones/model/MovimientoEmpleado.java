package com.proyecto.camiones.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_empleados", indexes = {
		@Index(name = "idx_movimientos_empleado", columnList = "empleado_id"),
		@Index(name = "idx_movimientos_tipo", columnList = "tipo"),
		@Index(name = "idx_movimientos_fecha", columnList = "fecha") })
public class MovimientoEmpleado {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/**
	 * Empleado al que pertenece el movimiento.
	 */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "empleado_id", nullable = false, foreignKey = @ForeignKey(name = "fk_movimiento_empleado"))
	private Empleado empleado;

	/**
	 * BONO, DEDUCCION o ANTICIPO
	 */
	@Column(name = "tipo", nullable = false, length = 20)
	private String tipo;

	/**
	 * Monto del movimiento en lempiras.
	 */
	@Column(name = "monto", nullable = false, precision = 12, scale = 2)
	private BigDecimal monto;

	/**
	 * Fecha en que se aplica el movimiento.
	 */
	@Column(name = "fecha", nullable = false)
	private LocalDate fecha;

	/**
	 * Motivo o descripción del movimiento.
	 */
	@Column(name = "descripcion", length = 500)
	private String descripcion;

	@Column(name = "fecha_creacion", nullable = false, updatable = false)
	private LocalDateTime fechaCreacion;

	@Column(name = "fecha_actualizacion", nullable = false)
	private LocalDateTime fechaActualizacion;

	// =========================================================
	// CICLO DE VIDA
	// =========================================================

	@PrePersist
	protected void onCreate() {

		LocalDateTime ahora = LocalDateTime.now();

		fechaCreacion = ahora;
		fechaActualizacion = ahora;

		if (monto == null) {
			monto = BigDecimal.ZERO;
		}
	}

	@PreUpdate
	protected void onUpdate() {

		fechaActualizacion = LocalDateTime.now();
	}

	// =========================================================
	// GETTERS Y SETTERS
	// =========================================================

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Empleado getEmpleado() {
		return empleado;
	}

	public void setEmpleado(Empleado empleado) {
		this.empleado = empleado;
	}

	public String getTipo() {
		return tipo;
	}

	public void setTipo(String tipo) {
		this.tipo = tipo;
	}

	public BigDecimal getMonto() {
		return monto;
	}

	public void setMonto(BigDecimal monto) {
		this.monto = monto;
	}

	public LocalDate getFecha() {
		return fecha;
	}

	public void setFecha(LocalDate fecha) {
		this.fecha = fecha;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}

	public LocalDateTime getFechaCreacion() {
		return fechaCreacion;
	}

	public LocalDateTime getFechaActualizacion() {
		return fechaActualizacion;
	}
}