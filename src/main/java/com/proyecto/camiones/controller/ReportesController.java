package com.proyecto.camiones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ReportesController {

    @GetMapping("/reportes")
    public String reportes() {
        return "reportes";
    }

    @GetMapping("/programar-viajes")
    public String programarViajes() {
        return "reporteDiario";
    }
}