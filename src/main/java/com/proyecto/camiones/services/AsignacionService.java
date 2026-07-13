package com.proyecto.camiones.services;


import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.proyecto.camiones.model.AsignacionCamion;
import com.proyecto.camiones.model.Camion;
import com.proyecto.camiones.model.Conductor;
import com.proyecto.camiones.repository.AsignacionRepository;
import com.proyecto.camiones.repository.CamionRepository;
import com.proyecto.camiones.repository.ConductorRepository;



@Service
public class AsignacionService {



    @Autowired
    private AsignacionRepository repository;


    @Autowired
    private ConductorRepository conductorRepository;


    @Autowired
    private CamionRepository camionRepository;





    // ======================================
    // LISTAR
    // ======================================

    public List<AsignacionCamion> listar(){

        return repository.findAll();

    }







    // ======================================
    // GUARDAR
    // ======================================

    public AsignacionCamion guardar(
            AsignacionCamion asignacion
    ){


        /*
         * BUSCAR CONDUCTOR REAL
         */

        Conductor conductor =
                conductorRepository
                .findById(
                    asignacion.getConductor().getId()
                )
                .orElseThrow();



        /*
         * BUSCAR CAMION REAL
         */

        Camion camion =
                camionRepository
                .findById(
                    asignacion.getCamion().getId()
                )
                .orElseThrow();




        asignacion.setConductor(
                conductor
        );


        asignacion.setCamion(
                camion
        );




        if(asignacion.getFechaAsignacion()==null){

            asignacion.setFechaAsignacion(
                    LocalDate.now()
            );

        }



        asignacion.setEstado(
                "ACTIVA"
        );




        /*
         * CAMBIAR ESTADO DEL CAMION
         */

        camion.setEstado(
                "ASIGNADO"
        );


        camionRepository.save(
                camion
        );





        return repository.save(
                asignacion
        );


    }









    // ======================================
    // BUSCAR
    // ======================================

    public AsignacionCamion buscar(Long id){

        return repository.findById(id)
                .orElse(null);

    }









    // ======================================
    // FINALIZAR
    // ======================================

    public AsignacionCamion finalizar(Long id){


        AsignacionCamion a =
                buscar(id);



        if(a!=null){


            a.setEstado(
                    "FINALIZADA"
            );


            a.setFechaFinalizacion(
                    LocalDate.now()
            );



            /*
             * LIBERAR CAMION
             */

            Camion camion =
                    a.getCamion();


            camion.setEstado(
                    "DISPONIBLE"
            );


            camionRepository.save(
                    camion
            );



            return repository.save(
                    a
            );


        }


        return null;

    }
    
    
    
    
    public void eliminar(Long id){

        AsignacionCamion asignacion =
                repository.findById(id)
                .orElseThrow();


        Camion camion =
                asignacion.getCamion();


        camion.setEstado("DISPONIBLE");


        camionRepository.save(camion);


        repository.delete(asignacion);

    }


}