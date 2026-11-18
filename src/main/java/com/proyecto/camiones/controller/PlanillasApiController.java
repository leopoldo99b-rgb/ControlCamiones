package com.proyecto.camiones.controller;

import com.proyecto.camiones.services.*;
import dto.PlanillaDtos.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/planillas/api")
public class PlanillasApiController {
	private static final Map<String, Boolean> OK = Map.of("ok", true);
	private final EmpleadoService empleados;
	private final PlanillaService planillas;
	private final AdelantoService adelantos;
	private final PrestacionService prestaciones;

	public PlanillasApiController(EmpleadoService empleados, PlanillaService planillas, AdelantoService adelantos,
			PrestacionService prestaciones) {
		this.empleados = empleados;
		this.planillas = planillas;
		this.adelantos = adelantos;
		this.prestaciones = prestaciones;
	}

	/* Empleados */
	@GetMapping("/empleados")
	public List<EmpleadoResponse> empleados() {
		return empleados.listar();
	}

	@PostMapping("/empleados")
	public EmpleadoResponse crearEmpleado(@RequestBody EmpleadoRequest r) {
		return empleados.crear(r);
	}

	@PutMapping("/empleados/{id}")
	public EmpleadoResponse editarEmpleado(@PathVariable Integer id, @RequestBody EmpleadoRequest r) {
		return empleados.editar(id, r);
	}

	/* Planillas */
	@GetMapping("/periodos")
	public List<PlanillaResponse> periodos() {
		return planillas.listar();
	}

	@GetMapping("/periodos/{id}")
	public PlanillaResponse periodo(@PathVariable Integer id) {
		return planillas.obtener(id);
	}

	@PostMapping("/periodos")
	public PlanillaResponse generar(@RequestBody GenerarPlanillaRequest r) {
		return planillas.generar(r);
	}

	@PostMapping("/periodos/{id}/pagar")
	public Map<String, Boolean> pagar(@PathVariable Integer id) {
		planillas.pagar(id);
		return OK;
	}

	@DeleteMapping("/periodos/{id}")
	public Map<String, Boolean> eliminar(@PathVariable Integer id) {
		planillas.eliminar(id);
		return OK;
	}

	/* Adelantos, vales y préstamos */
	@GetMapping("/adelantos")
	public List<AdelantoResponse> adelantos() {
		return adelantos.listar();
	}

	@PostMapping("/adelantos")
	public AdelantoResponse crearAdelanto(@RequestBody AdelantoRequest r) {
		return adelantos.crear(r);
	}

	/* 14.º y aguinaldo */
	@GetMapping("/prestaciones")
	public List<PrestacionResponse> prestaciones(@RequestParam String tipo, @RequestParam int anio) {
		return prestaciones.listar(tipo, anio);
	}

	@PostMapping("/prestaciones/generar")
	public Map<String, Integer> generarPrestaciones(@RequestBody PrestacionRequest r) {
		return prestaciones.generar(r);
	}

	@PostMapping("/prestaciones/{id}/pagar")
	public Map<String, Boolean> pagarPrestacion(@PathVariable Integer id) {
		prestaciones.pagar(id);
		return OK;
	}
}