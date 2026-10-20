package com.proyecto.camiones.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.TipoPunto;
import com.proyecto.camiones.services.PuntoPlantaService;

import dto.PuntoPlantaRequest;
import dto.PuntoPlantaResponse;

@RestController
@RequestMapping("/api/puntos-planta")
public class PuntoPlantaController {

    private final PuntoPlantaService service;

    public PuntoPlantaController(PuntoPlantaService service) {
        this.service = service;
    }

    @GetMapping
    public List<PuntoPlantaResponse> listar(
            @RequestParam(required = false) TipoPunto tipo) {
        return service.listar(tipo);
    }

    @GetMapping("/{id}")
    public PuntoPlantaResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PuntoPlantaResponse crear(
            @RequestBody PuntoPlantaRequest request) {
        return service.crear(request);
    }

    @PutMapping("/{id}")
    public PuntoPlantaResponse actualizar(
            @PathVariable Long id,
            @RequestBody PuntoPlantaRequest request) {
        return service.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desactivar(@PathVariable Long id) {
        service.desactivar(id);
    }
}
