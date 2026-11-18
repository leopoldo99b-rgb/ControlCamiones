package com.proyecto.camiones.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "empleados")
public class Empleado {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;
	@Column(nullable = false, unique = true, length = 20)
	private String codigo;
	@Column(nullable = false, length = 120)
	private String nombre;
	private String identidad;
	private String cargo;
	@Column(nullable = false)
	private String frecuenciaPago;
	@Column(nullable = false)
	private BigDecimal salarioMensual;
	@Column(nullable = false)
	private LocalDate fechaIngreso;
	private boolean activo = true;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getCodigo() {
		return codigo;
	}

	public void setCodigo(String codigo) {
		this.codigo = codigo;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public String getIdentidad() {
		return identidad;
	}

	public void setIdentidad(String identidad) {
		this.identidad = identidad;
	}

	public String getCargo() {
		return cargo;
	}

	public void setCargo(String cargo) {
		this.cargo = cargo;
	}

	public String getFrecuenciaPago() {
		return frecuenciaPago;
	}

	public void setFrecuenciaPago(String frecuenciaPago) {
		this.frecuenciaPago = frecuenciaPago;
	}

	public BigDecimal getSalarioMensual() {
		return salarioMensual;
	}

	public void setSalarioMensual(BigDecimal salarioMensual) {
		this.salarioMensual = salarioMensual;
	}

	public LocalDate getFechaIngreso() {
		return fechaIngreso;
	}

	public void setFechaIngreso(LocalDate fechaIngreso) {
		this.fechaIngreso = fechaIngreso;
	}

	public boolean isActivo() {
		return activo;
	}

	public void setActivo(boolean activo) {
		this.activo = activo;
	}
}