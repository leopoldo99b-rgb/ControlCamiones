package com.proyecto.camiones.controller;


import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.proyecto.camiones.model.Permiso;
import com.proyecto.camiones.model.Usuario;
import com.proyecto.camiones.repository.PermisoRepository;
import com.proyecto.camiones.repository.UsuarioRepository;
import com.proyecto.camiones.services.CloudinaryService;

import jakarta.servlet.http.HttpSession;



@Controller
@RequestMapping("/usuarios")
public class UsuarioController {



    private final UsuarioRepository usuarioRepository;

    private final CloudinaryService cloudinaryService;

    private final PermisoRepository permisoRepository;



    private static final int LIMITE_USUARIOS = 30;



    public UsuarioController(
            UsuarioRepository usuarioRepository,
            CloudinaryService cloudinaryService,
            PermisoRepository permisoRepository
    ){

        this.usuarioRepository = usuarioRepository;
        this.cloudinaryService = cloudinaryService;
        this.permisoRepository = permisoRepository;

    }





    // =========================
    // LISTAR USUARIOS
    // =========================


    @GetMapping
    public String usuarios(Model model){


        List<Usuario> usuarios =
                usuarioRepository.findAll();



        long totalUsuarios =
                usuarioRepository.count();



        model.addAttribute(
                "usuarios",
                usuarios
        );


        model.addAttribute(
                "totalUsuarios",
                totalUsuarios
        );


        model.addAttribute(
                "limiteUsuarios",
                LIMITE_USUARIOS
        );



        return "usuarios";

    }









    // =========================
    // GUARDAR / EDITAR USUARIO
    // =========================


    @PostMapping("/guardar")
    public String guardarUsuario(


            @RequestParam(value="id", required=false)
            Long id,


            @RequestParam("nombre")
            String nombre,


            @RequestParam("usuario")
            String username,


            @RequestParam("password")
            String password,


            @RequestParam("correo")
            String correo,


            @RequestParam("telefono")
            String telefono,


            @RequestParam("rol")
            String rol,


            @RequestParam(value="imagen", required=false)
            MultipartFile imagen


    ) throws IOException {



        Usuario usuario;



        // =========================
        // EDITAR USUARIO
        // =========================


        if(id != null){


            usuario =
            usuarioRepository.findById(id)
            .orElseThrow(
                    () -> new RuntimeException(
                            "Usuario no encontrado"
                    )
            );




            if(imagen != null && !imagen.isEmpty()){



                if(usuario.getImagenPerfil()!=null
                        && !usuario.getImagenPerfil().isBlank()){


                    cloudinaryService.eliminarImagen(
                            usuario.getImagenPerfil()
                    );


                }



                String nuevaImagen =
                cloudinaryService.subirImagen(imagen);



                usuario.setImagenPerfil(
                        nuevaImagen
                );

            }



        }



        // =========================
        // CREAR USUARIO
        // =========================


        else{



            long total =
            usuarioRepository.count();



            if(total >= LIMITE_USUARIOS){


                return "redirect:/usuarios";

            }



            usuario = new Usuario();



            /*
             * Usuario nuevo empieza sin permisos.
             * Los permisos se asignan desde el modal
             * de permisos.
             */


            usuario.setPermisos(
                    new HashSet<>()
            );




            if(imagen != null && !imagen.isEmpty()){



                String nuevaImagen =
                cloudinaryService.subirImagen(imagen);



                usuario.setImagenPerfil(
                        nuevaImagen
                );


            }



        }




        // =========================
        // DATOS GENERALES
        // =========================


        usuario.setNombre(
                nombre
        );


        usuario.setUsuario(
                username
        );


        usuario.setPassword(
                password
        );


        usuario.setCorreo(
                correo
        );


        usuario.setTelefono(
                telefono
        );


        usuario.setRol(
                rol
        );





        usuarioRepository.save(
                usuario
        );



        return "redirect:/usuarios";


    }
    
    // =========================
    // ELIMINAR USUARIO
    // =========================


    @PostMapping("/eliminar/{id}")
    public String eliminarUsuario(
            @PathVariable Long id

    ) throws IOException {



        Usuario usuario =
        usuarioRepository.findById(id)
        .orElse(null);



        if(usuario != null){



            // eliminar imagen cloudinary

            if(usuario.getImagenPerfil()!=null
                    && !usuario.getImagenPerfil().isBlank()){



                cloudinaryService.eliminarImagen(
                        usuario.getImagenPerfil()
                );


            }




            /*
             * Limpiar permisos antes de eliminar
             * para evitar problemas con tabla intermedia
             */


            if(usuario.getPermisos()!=null){


                usuario.getPermisos()
                .clear();


                usuarioRepository.save(usuario);


            }





            usuarioRepository.delete(usuario);



        }




        return "redirect:/usuarios";


    }









    // =========================
    // OBTENER PERMISOS USUARIO
    // =========================


    @GetMapping("/permisos/{id}")
    @ResponseBody
    public Set<Permiso> obtenerPermisos(
            @PathVariable Long id

    ){



        Usuario usuario =
        usuarioRepository.findById(id)
        .orElseThrow(
                () -> new RuntimeException(
                        "Usuario no encontrado"
                )
        );





        if(usuario.getPermisos()==null){


            return new HashSet<>();


        }





        return usuario.getPermisos();



    }









    // =========================
    // GUARDAR PERMISOS
    // =========================


    @PostMapping("/permisos/{id}")
    @ResponseBody
    public String guardarPermisos(


            @PathVariable Long id,


            @RequestBody List<Long> permisosIds,


            HttpSession session


    ){



        Usuario usuario =
        usuarioRepository.findById(id)
        .orElseThrow(
                () -> new RuntimeException(
                        "Usuario no encontrado"
                )
        );







        Set<Permiso> permisos =

                new HashSet<>(
                        permisoRepository.findAllById(
                                permisosIds
                        )
                );







        usuario.setPermisos(
                permisos
        );





        usuarioRepository.save(
                usuario
        );







        /*
         * Actualizar sesión si el usuario
         * modificó sus propios permisos
         */



        Usuario usuarioSesion =

        (Usuario) session.getAttribute(
                "usuarioLogueado"
        );





        if(usuarioSesion != null
                && usuarioSesion.getId()
                .equals(id)){





            usuarioSesion.setPermisos(
                    permisos
            );



            session.setAttribute(
                    "usuarioLogueado",
                    usuarioSesion
            );



        }






        return "ok";



    }









    // =========================
    // LISTAR TODOS LOS PERMISOS
    // =========================


    @GetMapping("/permisos")
    @ResponseBody
    public List<Permiso> listarPermisos(){



        return permisoRepository.findAll();



    }



}