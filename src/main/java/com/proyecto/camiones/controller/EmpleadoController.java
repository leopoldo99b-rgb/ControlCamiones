package com.proyecto.camiones.controller;

import com.proyecto.camiones.model.Empleado;
import com.proyecto.camiones.repository.EmpleadoRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
public class EmpleadoController {

    private final EmpleadoRepository empleadoRepository;

    public EmpleadoController(EmpleadoRepository empleadoRepository) {
        this.empleadoRepository = empleadoRepository;
    }

    // =========================================================
    // VISTA DE EMPLEADOS
    // =========================================================

    @GetMapping("/empleados")
    public String mostrarEmpleados(Model model) {
        return "empleados";
    }

    // =========================================================
    // API - LISTAR EMPLEADOS
    // =========================================================

    @GetMapping("/empleados/api")
    @ResponseBody
    public ResponseEntity<List<Empleado>> listarEmpleados() {

        List<Empleado> empleados = empleadoRepository.findAll();

        return ResponseEntity.ok(empleados);
    }
}