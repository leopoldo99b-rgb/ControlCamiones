package com.proyecto.camiones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PlanillaViewController {
    @GetMapping("/planillas")
    public String vista() {
        return "planillas"; // templates/planillas.html
    }
}
