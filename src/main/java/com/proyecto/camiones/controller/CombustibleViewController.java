package com.proyecto.camiones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CombustibleViewController {

    @GetMapping("/combustible")
    public String mostrarCombustible() {
        return "combustibles";
    }
}