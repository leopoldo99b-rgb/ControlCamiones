package com.proyecto.camiones.controller;

import com.proyecto.camiones.model.Unidad;
import com.proyecto.camiones.services.UnidadService;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class UnidadController {

    private final UnidadService unidadService;

    public UnidadController(UnidadService unidadService) {
        this.unidadService = unidadService;
    }

    // =========================
    // LISTAR TODAS LAS UNIDADES
    // =========================
    @GetMapping("/api/unidades")
    @ResponseBody
    public List<Unidad> listarUnidades() {
        return unidadService.listarTodas();
    }

    // =========================
    // BUSCAR UNA UNIDAD
    // =========================
    @GetMapping("/api/unidades/{id}")
    @ResponseBody
    public ResponseEntity<Unidad> buscarUnidad(@PathVariable Integer id) {

        return unidadService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================
    // CREAR UNIDAD
    // =========================
    @PostMapping("/api/unidades")
    @ResponseBody
    public ResponseEntity<Unidad> crearUnidad(
            @RequestBody Unidad unidad) {

        Unidad nuevaUnidad = unidadService.guardar(unidad);

        return ResponseEntity.ok(nuevaUnidad);
    }

    // =========================
    // EDITAR UNIDAD
    // =========================
    @PutMapping("/api/unidades/{id}")
    @ResponseBody
    public ResponseEntity<Unidad> editarUnidad(
            @PathVariable Integer id,
            @RequestBody Unidad datos) {

        return unidadService.buscarPorId(id)
                .map(unidad -> {

                    unidad.setCodigoUnidad(datos.getCodigoUnidad());
                    unidad.setPlaca(datos.getPlaca());
                    unidad.setDescripcion(datos.getDescripcion());
                    unidad.setActivo(datos.getActivo());

                    Unidad actualizada = unidadService.guardar(unidad);

                    return ResponseEntity.ok(actualizada);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================
    // ELIMINAR UNIDAD
    // =========================
    @DeleteMapping("/api/unidades/{id}")
    @ResponseBody
    public ResponseEntity<Void> eliminarUnidad(
            @PathVariable Integer id) {

        if (unidadService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        unidadService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}