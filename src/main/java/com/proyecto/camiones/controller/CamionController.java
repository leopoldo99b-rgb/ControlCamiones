package com.proyecto.camiones.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.proyecto.camiones.model.Camion;
import com.proyecto.camiones.services.CamionService;

@Controller
public class CamionController {

    @Autowired
    private CamionService camionService;

    @GetMapping("/camiones")
    public String camiones() {
        return "camiones";
    }

    @GetMapping("/gestioncamiones")
    public String gestionCamiones() {
        return "gestioncamiones";
    }

    @PostMapping("/camiones/guardar")
    @ResponseBody
    public Camion guardarCamion(

            @RequestParam(value = "foto", required = false) MultipartFile foto,

            @RequestParam(required = false) String placa,
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) String modelo,

            @RequestParam(required = false) String anio,
            @RequestParam(required = false) String color,

            @RequestParam(required = false) String tipo,

            @RequestParam(required = false) String capacidad,
            @RequestParam(required = false) String motor,
            @RequestParam(required = false) String chasis,
            @RequestParam(required = false) String kilometraje,

            @RequestParam(required = false) String estado,

            @RequestParam(required = false) String fechaCompra,

            @RequestParam(required = false) String valorCompra,

            @RequestParam(required = false) String observaciones

    ) throws Exception {

        // =========================
        // CONVERSIONES SEGURAS
        // =========================
        Integer anioInt = (anio == null || anio.isEmpty()) ? null : Integer.parseInt(anio);
        Double capacidadD = (capacidad == null || capacidad.isEmpty()) ? null : Double.parseDouble(capacidad);
        Integer km = (kilometraje == null || kilometraje.isEmpty()) ? null : Integer.parseInt(kilometraje);
        Double valor = (valorCompra == null || valorCompra.isEmpty()) ? null : Double.parseDouble(valorCompra);

        LocalDate fecha = (fechaCompra == null || fechaCompra.isEmpty())
                ? null
                : LocalDate.parse(fechaCompra);

        // =========================
        // VALIDACIÓN CRÍTICA
        // =========================
        if (placa == null || marca == null || modelo == null || tipo == null || estado == null) {
            throw new RuntimeException("❌ Campos obligatorios vienen NULL desde el frontend");
        }

        // =========================
        // GUARDAR
        // =========================
        return camionService.guardar(
                foto,
                placa,
                marca,
                modelo,
                anioInt,
                color,
                tipo,
                capacidadD,
                motor,
                chasis,
                km,
                estado,
                fecha, 
                valor,
                observaciones
        );
    }
    
    @GetMapping("/camiones/lista")
    @ResponseBody
    public List<Camion> listar() {
        try {
            return camionService.listarTodos();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
 // ======================================================
 // ELIMINAR CAMION
 // ======================================================

 @DeleteMapping("/camiones/eliminar/{id}")
 @ResponseBody
 public String eliminarCamion(@PathVariable Long id) {

     try {

         camionService.eliminar(id);

         return "Camión eliminado correctamente";

     } catch (Exception e) {

         e.printStackTrace();

         return "Error al eliminar camión";

     }

 }
}