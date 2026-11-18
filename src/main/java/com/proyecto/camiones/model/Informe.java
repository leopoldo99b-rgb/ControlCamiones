package com.proyecto.camiones.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "informes")
public class Informe {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	@Column(nullable = false, length = 120)
	private String titulo;
	@Column(nullable = false, length = 30)
	private String categoria;
	@Column(length = 200)
	private String descripcion;
	@Column(nullable = false, length = 600)
	private String enlace;
	@Column(nullable = false, length = 120)
	private String driveId;
	@Column(nullable = false)
	private LocalDate fecha;

	public Long getId() {
		return id;
	}

	public String getTitulo() {
		return titulo;
	}

	public void setTitulo(String v) {
		titulo = v;
	}

	public String getCategoria() {
		return categoria;
	}

	public void setCategoria(String v) {
		categoria = v;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public void setDescripcion(String v) {
		descripcion = v;
	}

	public String getEnlace() {
		return enlace;
	}

	public void setEnlace(String v) {
		enlace = v;
	}

	public String getDriveId() {
		return driveId;
	}

	public void setDriveId(String v) {
		driveId = v;
	}

	public LocalDate getFecha() {
		return fecha;
	}

	public void setFecha(LocalDate v) {
		fecha = v;
	}
}