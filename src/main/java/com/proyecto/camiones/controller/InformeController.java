package com.proyecto.camiones.controller;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.Informe;
import com.proyecto.camiones.repository.InformeRepository;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.*;

@Controller
public class InformeController {

	private static final Set<String> CATS = Set.of("operaciones", "mantenimiento", "combustible", "seguridad",
			"conductores", "finanzas", "otros");
	private static final Pattern ID = Pattern.compile("/d/([\\w-]{10,})");
	private static final Pattern ID_QS = Pattern.compile("[?&]id=([\\w-]{10,})");

	private final InformeRepository repo;

	public InformeController(InformeRepository repo) {
		this.repo = repo;
	}

	public record InformeDto(String titulo, String categoria, String descripcion, String enlace, LocalDate fecha) {
	}

	@GetMapping("/informes")
	public String vista() {
		return "informes";
	}

	@GetMapping("/api/informes")
	@ResponseBody
	public List<Informe> listar() {
		return repo.findAll(Sort.by(Sort.Direction.DESC, "fecha", "id"));
	}

	@PostMapping("/api/informes")
	@ResponseBody
	public ResponseEntity<?> crear(@RequestBody InformeDto d) {
		if (d.titulo() == null || d.titulo().isBlank() || d.fecha() == null || !CATS.contains(d.categoria()))
			return ResponseEntity.badRequest().body("Datos incompletos");
		String id = extraerId(d.enlace());
		if (id == null)
			return ResponseEntity.badRequest().body("Enlace de Drive no válido");
		Informe i = new Informe();
		i.setTitulo(d.titulo().trim());
		i.setCategoria(d.categoria());
		i.setDescripcion(d.descripcion() == null || d.descripcion().isBlank() ? null : d.descripcion().trim());
		i.setEnlace(d.enlace().trim());
		i.setDriveId(id);
		i.setFecha(d.fecha());
		return ResponseEntity.ok(repo.save(i));
	}

	@DeleteMapping("/api/informes/{id}")
	@ResponseBody
	public ResponseEntity<?> eliminar(@PathVariable Long id) {
		if (!repo.existsById(id))
			return ResponseEntity.notFound().build();
		repo.deleteById(id);
		return ResponseEntity.ok().build();
	}

	private String extraerId(String enlace) {
		try {
			URI u = URI.create(enlace.trim());
			if (!"https".equals(u.getScheme()) || !"drive.google.com".equals(u.getHost()))
				return null;
			if (u.getPath() != null && u.getPath().contains("/folders/"))
				return null;
			Matcher m = ID.matcher(u.getPath() == null ? "" : u.getPath());
			if (m.find())
				return m.group(1);
			m = ID_QS.matcher("?" + (u.getQuery() == null ? "" : u.getQuery()));
			return m.find() ? m.group(1) : null;
		} catch (Exception e) {
			return null;
		}
	}
}