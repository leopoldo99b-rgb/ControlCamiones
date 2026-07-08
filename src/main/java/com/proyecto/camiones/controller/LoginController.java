package com.proyecto.camiones.controller;


import java.time.LocalDateTime;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.Usuario;
import com.proyecto.camiones.repository.UsuarioRepository;

import jakarta.servlet.http.HttpSession;



@Controller
public class LoginController {



    private final UsuarioRepository usuarioRepository;



    public LoginController(
            UsuarioRepository usuarioRepository
    ){

        this.usuarioRepository = usuarioRepository;

    }





    @GetMapping("/")
    public String login(){

        return "login";

    }







    @GetMapping("/dashboard")
    public String dashboard(
            HttpSession session,
            Model model
    ){


        Usuario usuarioSesion =
                (Usuario) session.getAttribute(
                        "usuarioLogueado"
                );



        if(usuarioSesion == null || usuarioSesion.getId() == null){

            session.invalidate();

            return "redirect:/";

        }





        /*
         * Recuperar usuario actualizado
         * desde BD
         */

        Usuario usuarioActualizado =
                usuarioRepository
                .findById(
                        usuarioSesion.getId()
                )
                .orElse(null);




        if(usuarioActualizado == null){


            session.invalidate();


            return "redirect:/";


        }






        /*
         * Cargar permisos
         * antes de enviarlo a Thymeleaf
         */

        if(usuarioActualizado.getPermisos()!=null){

            usuarioActualizado
            .getPermisos()
            .size();

        }





        /*
         * Actualizar sesión
         */

        session.setAttribute(
                "usuarioLogueado",
                usuarioActualizado
        );






        model.addAttribute(
                "usuario",
                usuarioActualizado
        );






        return "dashboard";


    }









    @PostMapping("/login")
    public String ingresar(


            @RequestParam("usuario")
            String username,


            @RequestParam("password")
            String password,


            HttpSession session,


            Model model


    ){



        Usuario usuario =

                usuarioRepository
                .findByUsuarioAndPassword(
                        username,
                        password
                );








        if(usuario != null){



            /*
             * Registrar inicio de actividad
             */

            usuario.setUltimaActividad(
                    LocalDateTime.now()
            );



            usuarioRepository.save(
                    usuario
            );







            /*
             * Inicializar permisos
             */

            if(usuario.getPermisos()!=null){

                usuario.getPermisos().size();

            }








            /*
             * Guardar usuario en sesión
             */

            session.setAttribute(
                    "usuarioLogueado",
                    usuario
            );







            return "redirect:/dashboard";


        }









        model.addAttribute(
                "error",
                "Usuario o contraseña incorrectos"
        );



        return "login";


    }









    @GetMapping("/logout")
    public String cerrarSesion(
            HttpSession session
    ){



        Usuario usuario =

                (Usuario) session.getAttribute(
                        "usuarioLogueado"
                );





        if(usuario != null){



            /*
             * Guardamos última actividad
             * antes de cerrar
             */

            usuario.setUltimaActividad(
                    LocalDateTime.now()
            );


            usuarioRepository.save(
                    usuario
            );


        }






        session.invalidate();




        return "redirect:/";


    }





}