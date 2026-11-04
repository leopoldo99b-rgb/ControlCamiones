package com.proyecto.camiones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InventarioController {

    /** Sirve templates/inventario.html (Thymeleaf). */
    @GetMapping("/inventario")
    public String inventario() {
        return "inventario";
    }
}
