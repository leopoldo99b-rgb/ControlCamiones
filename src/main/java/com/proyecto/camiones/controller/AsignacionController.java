package com.proyecto.camiones.controller;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.AsignacionCamion;
import com.proyecto.camiones.repository.CamionRepository;
import com.proyecto.camiones.repository.ConductorRepository;
import com.proyecto.camiones.services.AsignacionService;



@Controller
public class AsignacionController {


    @Autowired
    private AsignacionService service;


    @Autowired
    private ConductorRepository conductorRepository;


    @Autowired
    private CamionRepository camionRepository;





    // ================================
    // VISTA
    // ================================

    @GetMapping("/asignaciones")
    public String asignaciones(Model model){



        model.addAttribute(
                "conductores",
                conductorRepository.findByEstado("ACTIVO")
        );



        model.addAttribute(
                "camiones",
                camionRepository.findAll()
        );



        return "asignaciones";

    }







    // ================================
    // LISTAR
    // ================================

    @GetMapping("/asignaciones/lista")
    @ResponseBody
    public List<AsignacionCamion> listar(){


        return service.listar();


    }






    // ================================
    // GUARDAR
    // ================================


    @PostMapping("/asignaciones/guardar")
    @ResponseBody
    public AsignacionCamion guardar(
            @RequestBody AsignacionCamion asignacion
    ){


        return service.guardar(
                asignacion
        );


    }







    // ================================
    // FINALIZAR
    // ================================

    @PutMapping("/asignaciones/finalizar/{id}")
    @ResponseBody
    public AsignacionCamion finalizar(
            @PathVariable Long id
    ){


        return service.finalizar(id);


    }
    
    
    @DeleteMapping("/asignaciones/eliminar/{id}")
    @ResponseBody
    public void eliminar(@PathVariable Long id){

        service.eliminar(id);

    }


}