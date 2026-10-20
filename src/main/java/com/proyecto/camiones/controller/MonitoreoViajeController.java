package com.proyecto.camiones.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.services.MonitoreoViajeService;

import dto.MonitoreoDtos.MotivoRequest;
import dto.MonitoreoDtos.ParadaResponse;
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

    /** Recorrido + paradas del viaje (para dibujar en el mapa). */
    @GetMapping("/viajes/{id}/ruta")
    public RutaResponse ruta(@PathVariable Integer id) {
        return service.ruta(id);
    }

    @PostMapping("/viajes/{id}/finalizar")
    public ViajeResponse finalizar(@PathVariable Integer id) {
        return service.finalizar(id);
    }

    @PutMapping("/paradas/{idParada}/motivo")
    public ParadaResponse actualizarMotivo(
            @PathVariable Integer idParada,
            @RequestBody MotivoRequest request) {
        return service.actualizarMotivo(idParada, request.motivo());
    }
}
