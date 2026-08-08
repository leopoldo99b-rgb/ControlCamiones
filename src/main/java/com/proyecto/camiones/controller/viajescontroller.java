package com.proyecto.camiones.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.viajes;
import com.proyecto.camiones.services.ViajeService;

@Controller
public class viajescontroller {

    @Autowired
    private ViajeService viajeService;

    @GetMapping("/viajes")
    public String viajes(){

        return "viajes";

    }

    @PostMapping("/viajes/guardar")
    @ResponseBody
    public viajes guardar(@RequestBody viajes viaje){

        return viajeService.guardar(viaje);

    }

    @GetMapping("/viajes/lista")
    @ResponseBody
    public List<viajes> listar(){

        return viajeService.listar();

    }

    @DeleteMapping("/viajes/eliminar/{id}")
    @ResponseBody
    public String eliminar(@PathVariable Long id){

        viajeService.eliminar(id);

        return "ok";

    }

}