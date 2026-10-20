package com.proyecto.camiones.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.MonitoreoParada;
import com.proyecto.camiones.model.MonitoreoViaje;
import com.proyecto.camiones.services.MonitoreoService;

@RestController
@RequestMapping("/api/monitoreo")
public class MonitoreoApiController {

    private final MonitoreoService monitoreoService;

    public MonitoreoApiController(
            MonitoreoService monitoreoService) {
        this.monitoreoService = monitoreoService;
    }

    // Listar todos los viajes
    @GetMapping("/viajes")
    public List<MonitoreoViaje> listarViajes() {
        return monitoreoService.listarViajes();
    }

    // Consultar un viaje por ID
    @GetMapping("/viajes/{id}")
    public MonitoreoViaje obtenerViaje(
            @PathVariable Integer id) {
        return monitoreoService.obtenerViaje(id);
    }

    // Crear un viaje
    @PostMapping("/viajes")
    public ResponseEntity<MonitoreoViaje> crearViaje(
            @RequestBody MonitoreoViaje viaje) {

        MonitoreoViaje creado =
                monitoreoService.crearViaje(viaje);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creado);
    }

    // Actualizar el estado de un viaje
    @PatchMapping("/viajes/{id}/estado")
    public MonitoreoViaje actualizarEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> datos) {

        return monitoreoService.actualizarEstado(
                id, datos.get("estado"));
    }

    // Consultar las paradas de un viaje
    @GetMapping("/viajes/{id}/paradas")
    public List<MonitoreoParada> listarParadas(
            @PathVariable Integer id) {

        monitoreoService.obtenerViaje(id);

        return monitoreoService.listarParadas(id);
    }

    // Registrar una parada en un viaje
    @PostMapping("/viajes/{id}/paradas")
    public ResponseEntity<MonitoreoParada> registrarParada(
            @PathVariable Integer id,
            @RequestBody MonitoreoParada parada) {

        MonitoreoParada creada =
                monitoreoService.registrarParada(id, parada);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creada);
    }

    // Actualizar el motivo de una parada
    @PatchMapping("/paradas/{id}/motivo")
    public MonitoreoParada actualizarMotivo(
            @PathVariable Integer id,
            @RequestBody Map<String, String> datos) {

        return monitoreoService.actualizarMotivo(
                id, datos.get("motivo"));
    }
}
