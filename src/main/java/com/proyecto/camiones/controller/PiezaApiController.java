package com.proyecto.camiones.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.camiones.services.PiezaService;

import dto.EliminarResponse;
import dto.PiezaRequest;
import dto.PiezaResponse;

@RestController
@RequestMapping("/api/piezas")
public class PiezaApiController {

    private final PiezaService piezaService;

    public PiezaApiController(PiezaService piezaService) {
        this.piezaService = piezaService;
    }

    @GetMapping
    public List<PiezaResponse> listar() {
        return piezaService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PiezaResponse crear(@RequestBody PiezaRequest request) {
        return piezaService.crear(request);
    }

    @DeleteMapping("/{id}")
    public EliminarResponse eliminar(@PathVariable Long id) {
        return piezaService.eliminar(id);
    }
}