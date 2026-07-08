package com.proyecto.camiones.interceptor;


import java.time.LocalDateTime;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.proyecto.camiones.model.Usuario;
import com.proyecto.camiones.repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;



@Component
public class UsuarioActividadInterceptor 
        implements HandlerInterceptor {



    private final UsuarioRepository usuarioRepository;



    public UsuarioActividadInterceptor(
            UsuarioRepository usuarioRepository
    ){

        this.usuarioRepository = usuarioRepository;

    }





    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler

    ) throws Exception {



        HttpSession session =
                request.getSession(false);




        /*
         * Si no existe sesión
         */

        if(session == null){


            response.sendRedirect("/");


            return false;

        }





        Usuario usuarioSesion =

                (Usuario) session.getAttribute(
                        "usuarioLogueado"
                );





        /*
         * Si no hay usuario logueado
         */

        if(usuarioSesion == null){


            response.sendRedirect("/");


            return false;

        }







        Usuario usuarioBD =

                usuarioRepository
                .findById(
                        usuarioSesion.getId()
                )
                .orElse(null);






        if(usuarioBD == null){


            session.invalidate();


            response.sendRedirect("/");


            return false;


        }








        /*
         * Actualizar última actividad
         */


        LocalDateTime ahora =
                LocalDateTime.now();



        usuarioBD.setUltimaActividad(
                ahora
        );



        usuarioRepository.save(
                usuarioBD
        );







        /*
         * Mantener sesión actualizada
         */


        usuarioSesion.setUltimaActividad(
                ahora
        );



        session.setAttribute(
                "usuarioLogueado",
                usuarioSesion
        );







        return true;


    }


}