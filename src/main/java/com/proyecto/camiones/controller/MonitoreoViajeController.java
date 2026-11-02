package com.proyecto.camiones.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.services.MonitoreoViajeService;

import dto.MonitoreoDtos.MotivoRequest;
import dto.MonitoreoDtos.ParadaResponse;
import dto.MonitoreoDtos.ReporteViajeResponse;
import dto.MonitoreoDtos.RutaResponse;
import dto.MonitoreoDtos.ViajeRequest;
import dto.MonitoreoDtos.ViajeResponse;

@RestController
@RequestMapping("/api")
public class MonitoreoViajeController {

    private final MonitoreoViajeService service;

    public MonitoreoViajeController(MonitoreoViajeService service) {
        this.service = service;
    }

    @GetMapping("/viajes")
    public List<ViajeResponse> listar() {
        return service.listar();
    }

    @PostMapping("/viajes")
    @ResponseStatus(HttpStatus.CREATED)
    public ViajeResponse iniciar(@RequestBody ViajeRequest request) {
        return service.iniciar(request);
    }

    /**
     * Reporte: viajes con sus paradas entre dos fechas (formato yyyy-MM-dd).
     * Ejemplo: GET /api/viajes/reporte?desde=2026-10-01&hasta=2026-10-31
     */
    @GetMapping("/viajes/reporte")
    public List<ReporteViajeResponse> reporte(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return service.reporte(desde, hasta);
    }

    /** Recorrido + paradas del viaje (para dibujar en el mapa). */
    @GetMapping("/viajes/{id}/ruta")
    public RutaResponse ruta(@PathVariable Integer id) {
        return service.ruta(id);
    }

    @PostMapping("/viajes/{id}/finalizar")
    public ViajeResponse finalizar(@PathVariable Integer id) {
        return service.finalizar(id);
    }

    /** Elimina el viaje con todo su recorrido y sus paradas (irreversible). */
    @DeleteMapping("/viajes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        service.eliminar(id);
    }

    @PutMapping("/paradas/{idParada}/motivo")
    public ParadaResponse actualizarMotivo(
            @PathVariable Integer idParada,
            @RequestBody MotivoRequest request) {
        return service.actualizarMotivo(idParada, request.motivo());
    }
}