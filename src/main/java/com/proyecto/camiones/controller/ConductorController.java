package com.proyecto.camiones.controller;


import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;


import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import com.cloudinary.Cloudinary;
import com.proyecto.camiones.model.Conductor;
import com.proyecto.camiones.repository.ConductorRepository;



@Controller
@RequestMapping("/conductores")
public class ConductorController {



    private final ConductorRepository conductorRepository;


    private final Cloudinary cloudinary;



    private static final int MAX_CONDUCTORES = 30;






    public ConductorController(
            ConductorRepository conductorRepository,
            Cloudinary cloudinary
    ){

        this.conductorRepository = conductorRepository;

        this.cloudinary = cloudinary;

    }









    /*
     * ============================
     * LISTAR CONDUCTORES
     * ============================
     */


    @GetMapping
    public String listar(Model model){



        long totalConductores = conductorRepository.count();



        model.addAttribute(
                "conductores",
                conductorRepository.findAll()
        );



        model.addAttribute(
                "totalConductores",
                totalConductores
        );



        model.addAttribute(
                "maxConductores",
                MAX_CONDUCTORES
        );



        model.addAttribute(
                "puedeRegistrar",
                totalConductores < MAX_CONDUCTORES
        );



        return "conductores";

    }









    /*
     * ============================
     * GUARDAR CONDUCTOR
     * ============================
     */


    @PostMapping("/guardar")
    public String guardar(

            @ModelAttribute Conductor conductor,

            @RequestParam("imagen") MultipartFile imagen

    ){



        try {



            // VALIDAR LIMITE DE REGISTROS


            if(conductorRepository.count() >= MAX_CONDUCTORES){


                return "redirect:/conductores";


            }






            /*
             * SUBIR FOTO A CLOUDINARY
             */


            if(imagen != null && !imagen.isEmpty()){



                Map resultado = cloudinary
                        .uploader()
                        .upload(

                            imagen.getBytes(),

                            Map.of(

                                "folder",
                                "conductores"

                            )

                        );





                String urlFoto =
                        resultado
                        .get("secure_url")
                        .toString();





                conductor.setFoto(urlFoto);



            }






            /*
             * FECHA CREACION
             */


            conductor.setCreatedAt(
                    LocalDateTime.now()
            );






            /*
             * GUARDAR EN NEONSQL
             */


            conductorRepository.save(conductor);






        } catch(IOException e){



            e.printStackTrace();



        }





        return "redirect:/conductores";


    }




    @PostMapping("/actualizar/{id}")
    public String actualizar(

            @PathVariable Long id,

            @ModelAttribute Conductor datos,

            @RequestParam(value = "imagen", required = false)
            MultipartFile imagen

    ){

        try{

            Conductor conductor =
                    conductorRepository.findById(id)
                    .orElseThrow();

            conductor.setNombre(datos.getNombre());
            conductor.setApellido(datos.getApellido());
            conductor.setIdentidad(datos.getIdentidad());
            conductor.setTelefono(datos.getTelefono());
            conductor.setCorreo(datos.getCorreo());
            conductor.setDireccion(datos.getDireccion());
            conductor.setLicencia(datos.getLicencia());
            conductor.setTipoLicencia(datos.getTipoLicencia());
            if(datos.getFechaNacimiento()!=null){
                conductor.setFechaNacimiento(datos.getFechaNacimiento());
            }


            if(datos.getFechaVencimientoLicencia()!=null){
                conductor.setFechaVencimientoLicencia(
                    datos.getFechaVencimientoLicencia()
                );
            }


            if(datos.getFechaIngreso()!=null){
                conductor.setFechaIngreso(
                    datos.getFechaIngreso()
                );
            }
            conductor.setEstado(datos.getEstado());
            conductor.setObservaciones(datos.getObservaciones());



            if(imagen != null && !imagen.isEmpty()){

                Map resultado = cloudinary
                        .uploader()
                        .upload(
                                imagen.getBytes(),
                                Map.of("folder","conductores")
                        );

                conductor.setFoto(
                        resultado.get("secure_url").toString()
                );
            }

            conductorRepository.save(conductor);

        }
        catch(Exception e){

            e.printStackTrace();

        }

        return "redirect:/conductores";
    }



    @PostMapping("/{id}/observacion")
    @ResponseBody
    public String guardarObservacion(

            @PathVariable Long id,

            @RequestParam String observacion

    ){

        Conductor conductor =
                conductorRepository.findById(id)
                .orElseThrow();

        String actual =
                conductor.getObservaciones() == null
                ? ""
                : conductor.getObservaciones();

        LocalDateTime ahora = LocalDateTime.now();

        DateTimeFormatter fecha =
                DateTimeFormatter.ofPattern("dd/MM/yyyy");

        DateTimeFormatter hora =
                DateTimeFormatter.ofPattern("HH:mm:ss");

        String nuevaObservacion =

                "Fecha: "
                + ahora.format(fecha)

                + "          "

                + "Hora de Registro de Observación: "
                + ahora.format(hora)

                + "\n\n"

                + "Detalle de la Observación:"

                + "\n"

                + observacion.trim()

                + "\n\n"

                + "------------------------------------------------------------------------------------------------";

        if(!actual.isBlank()){

            actual += "\n\n";

        }

        conductor.setObservaciones(actual + nuevaObservacion);

        conductorRepository.save(conductor);

        return "ok";
    }
    
    
    
    @DeleteMapping("/eliminar/{id}")
    @ResponseBody
    public String eliminarConductor(
            @PathVariable Long id
    ){


        Conductor conductor =
                conductorRepository.findById(id)
                .orElseThrow();



        /*
           BORRAR FOTO CLOUDINARY
        */

        if(conductor.getFoto()!=null){


            try{


                String publicId =
                conductor.getFoto()
                .substring(
                  conductor.getFoto()
                  .lastIndexOf("/") + 1
                )
                .split("\\.")[0];



                cloudinary
                .uploader()
                .destroy(
                    "conductores/"+publicId,
                    Map.of()
                );



            }
            catch(Exception e){

                e.printStackTrace();

            }

        }




        conductorRepository.delete(conductor);



        return "ok";

    }
    
    
    @DeleteMapping("/{id}/eliminar-observacion/{numero}")
    @ResponseBody
    public String eliminarObservacion(

            @PathVariable Long id,

            @PathVariable int numero

    ){


        Conductor conductor =
                conductorRepository.findById(id)
                .orElseThrow();



        String observaciones =
                conductor.getObservaciones();



        String[] lista =
                observaciones.split(
                "------------------------------------------------------------------------------------------------"
                );



        StringBuilder nuevas =
                new StringBuilder();



        int contador=1;



        for(String obs:lista){


            if(!obs.trim().isEmpty()){


                if(contador!=numero){


                    nuevas.append(obs)
                    .append("\n")
                    .append(
                    "------------------------------------------------------------------------------------------------"
                    );


                }


                contador++;


            }


        }



        conductor.setObservaciones(
            nuevas.toString()
        );



        conductorRepository.save(conductor);



        return "ok";

    }
}