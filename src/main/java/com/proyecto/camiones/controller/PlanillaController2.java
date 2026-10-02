package com.proyecto.camiones.controller;

import com.proyecto.camiones.model.EstadoPlanilla;
import com.proyecto.camiones.model.Planilla;
import com.proyecto.camiones.services.PlanillaService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/planillas")
@CrossOrigin(origins = "*")
public class PlanillaController2 {

    private final PlanillaService planillaService;

    public PlanillaController2(PlanillaService planillaService) {
        this.planillaService = planillaService;
    }

    @PostMapping("/api")
    public ResponseEntity<Planilla> crearPlanilla(
            @RequestBody Planilla planilla) {

        Planilla guardada = planillaService.guardar(planilla);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(guardada);
    }

    @GetMapping("/api")
    public ResponseEntity<List<Planilla>> listarPlanillas() {

        return ResponseEntity.ok(
                planillaService.listarTodas()
        );
    }

    @GetMapping("/api/{id}")
    public ResponseEntity<Planilla> obtenerPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                planillaService.buscarPorId(id)
        );
    }

    @GetMapping("/api/numero/{numero}")
    public ResponseEntity<Planilla> obtenerPorNumero(
            @PathVariable String numero) {

        return ResponseEntity.ok(
                planillaService.buscarPorNumero(numero)
        );
    }

    @GetMapping("/api/estado/{estado}")
    public ResponseEntity<List<Planilla>> listarPorEstado(
            @PathVariable EstadoPlanilla estado) {

        return ResponseEntity.ok(
                planillaService.listarPorEstado(estado)
        );
    }

    @GetMapping("/api/fecha")
    public ResponseEntity<List<Planilla>> listarPorFecha(
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta) {

        return ResponseEntity.ok(
                planillaService.listarPorFecha(desde, hasta)
        );
    }

    @PatchMapping("/api/{id}/estado")
    public ResponseEntity<Planilla> actualizarEstado(
            @PathVariable Long id,
            @RequestParam EstadoPlanilla estado) {

        return ResponseEntity.ok(
                planillaService.actualizarEstado(id, estado)
        );
    }
}