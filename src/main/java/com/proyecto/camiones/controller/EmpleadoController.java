package com.proyecto.camiones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class EmpleadoController {

    @GetMapping("/empleados")
    public String mostrarEmpleados(Model model) {

        // Aquí posteriormente cargarás la lista de empleados
        // desde la base de datos.

        return "empleados";
    }
}