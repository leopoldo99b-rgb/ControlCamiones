package com.proyecto.camiones.services;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.proyecto.camiones.model.Mantenimiento;
import com.proyecto.camiones.model.Repuesto;
import com.proyecto.camiones.repository.MantenimientoRepository;



@Service
public class MantenimientoService {


    @Autowired
    private MantenimientoRepository mantenimientoRepository;




    // ==========================================
    // LISTAR TODOS
    // ==========================================

    public List<Mantenimiento> listarTodos(){

        return mantenimientoRepository.findAll();

    }




    // ==========================================
    // GUARDAR MANTENIMIENTO + REPUESTOS
    // ==========================================

    public Mantenimiento guardar(Mantenimiento mantenimiento){


        // Validamos si trae repuestos

        if(mantenimiento.getRepuestos() != null){


            for(Repuesto repuesto : mantenimiento.getRepuestos()){


                repuesto.setMantenimiento(mantenimiento);


            }


        }



        return mantenimientoRepository.save(mantenimiento);


    }





    // ==========================================
    // BUSCAR POR ID
    // ==========================================

    public Mantenimiento buscarPorId(Long id){


        return mantenimientoRepository.findById(id)
                .orElse(null);


    }





    // ==========================================
    // ELIMINAR
    // ==========================================

    public void eliminar(Long id){


        mantenimientoRepository.deleteById(id);


    }



}