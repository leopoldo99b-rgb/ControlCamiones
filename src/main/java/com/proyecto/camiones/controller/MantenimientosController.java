package com.proyecto.camiones.controller;


import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;


import com.proyecto.camiones.model.Mantenimiento;
import com.proyecto.camiones.repository.MantenimientoRepository;
import com.proyecto.camiones.repository.MantenimientoSpecification;
import com.proyecto.camiones.services.MantenimientoService;


import dto.MantenimientoDTO;
import dto.MantenimientoDetalleDTO;
import dto.RepuestoDetalleDTO;



@Controller
public class MantenimientosController {


    @Autowired
    private MantenimientoService mantenimientoService;


    @Autowired
    private MantenimientoRepository mantenimientoRepository;



    // ==========================================
    // VISTA
    // ==========================================

    @GetMapping("/mantenimiento")
    public String mantenimientos(){

        return "mantenimiento";

    }



 // ==========================================
 // LISTAR
 // ==========================================

 @GetMapping("/mantenimiento/lista")
 @ResponseBody
 public List<MantenimientoDTO> lista(

         @RequestParam(required = false) Long camion,

         @RequestParam(required = false) String tipo,

         @RequestParam(required = false) String estado,

         @RequestParam(required = false) String fechaInicio,

         @RequestParam(required = false) String fechaFin

 ){

     LocalDate inicio = null;

     LocalDate fin = null;

     if(fechaInicio != null && !fechaInicio.isEmpty()){

         inicio =
             LocalDate.parse(fechaInicio);

     }

     if(fechaFin != null && !fechaFin.isEmpty()){

         fin =
             LocalDate.parse(fechaFin);

     }

     return mantenimientoRepository.findAll(

             MantenimientoSpecification.filtrar(
                     camion,
                     tipo,
                     estado,
                     inicio,
                     fin
             )

     )
     .stream()
     .map(m -> new MantenimientoDTO(

             m.getId(),

             m.getCamion().getPlaca(),

             m.getFecha(),

             m.getTipo(),

             m.getTaller(),

             m.getKilometraje(),

             m.getCosto(),

             m.getEstado(),

             m.getProximoMantenimiento(),

             m.getProximaFecha()

     ))
     .toList();

 }


    // ==========================================
    // GUARDAR
    // ==========================================

    @PostMapping("/mantenimiento/guardar")
    @ResponseBody
    public Mantenimiento guardar(
            @RequestBody Mantenimiento mantenimiento
    ){


        return mantenimientoService.guardar(mantenimiento);


    }





    // ==========================================
    // ELIMINAR
    // ==========================================

    @DeleteMapping("/mantenimiento/eliminar/{id}")
    @ResponseBody
    public String eliminar(
            @PathVariable Long id
    ){


        mantenimientoService.eliminar(id);


        return "Mantenimiento eliminado correctamente";


    }

    
 // ================================================
    // CARGAR DETALLES DEL MANTENIMIENTO EN EL OJO
    // =============================================
    
    @GetMapping("/mantenimiento/ver/{id}")
    @ResponseBody
    public MantenimientoDetalleDTO ver(
            @PathVariable Long id
    ){

        Mantenimiento m =
            mantenimientoRepository.findById(id)
            .orElseThrow();


        List<RepuestoDetalleDTO> repuestos =
            m.getRepuestos()
            .stream()
            .map(r ->
                new RepuestoDetalleDTO(
                    r.getNombre(),
                    r.getCantidad(),
                    r.getPrecio(),
                    r.getSubtotal()
                )
            )
            .toList();



        return new MantenimientoDetalleDTO(

            m.getId(),

            m.getCamion().getPlaca(),

            m.getFecha(),

            m.getTipo(),

            m.getTaller(),

            m.getKilometraje(),

            m.getCosto(),

            m.getEstado(),

            m.getProximoMantenimiento(),

            m.getProximaFecha(),

            m.getDescripcion(),

            m.getObservaciones(),

            repuestos

        );

    }
    
    
    
 // ==========================================
 // CAMBIAR ESTADO
 // ==========================================

 @PutMapping("/mantenimiento/estado/{id}")
 @ResponseBody
 public String cambiarEstado(
         @PathVariable Long id,
         @RequestBody Mantenimiento datos
 ){

     Mantenimiento mantenimiento =
             mantenimientoRepository.findById(id)
             .orElseThrow();


     mantenimiento.setEstado(
             datos.getEstado()
     );


     mantenimientoRepository.save(
             mantenimiento
     );


     return "Estado actualizado";

 }

}