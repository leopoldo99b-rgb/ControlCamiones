package com.proyecto.camiones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class planillaController {

    // Pantalla principal de Planillas
    @GetMapping("/planillas")
    public String mostrarPlanillas() {
        return "planillas";
    }

    // Pantalla para crear una nueva planilla
    @GetMapping("/planillas/nueva")
    public String mostrarNuevaPlanilla() {
        return "nueva-planilla";
    }

    // Pantalla de historial de planillas
    @GetMapping("/planillas/historial")
    public String mostrarHistorialPlanillas() {
        return "historial-planillas";
    }
}