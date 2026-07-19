package com.proyecto.camiones.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.TipoMantenimiento;
import com.proyecto.camiones.services.TipoMantenimientoService;


@RestController
@RequestMapping("/api/tipos-mantenimiento")
public class TipoMantenimientoController {


    @Autowired
    private TipoMantenimientoService service;



    @GetMapping
    public List<TipoMantenimiento> listar(){

        return service.listarTodos();

    }


}