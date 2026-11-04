package com.proyecto.camiones.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.camiones.services.InventarioResumenService;

import dto.InventarioResumen;

@RestController
@RequestMapping("/api/inventario")
public class InventarioResumenApiController {

    private final InventarioResumenService inventarioResumenService;

    public InventarioResumenApiController(InventarioResumenService inventarioResumenService) {
        this.inventarioResumenService = inventarioResumenService;
    }

    /** Datos frescos del inventario para la dona del dashboard. */
    @GetMapping("/resumen")
    public InventarioResumen resumen() {
        return inventarioResumenService.resumen();
    }
}