package com.proyecto.camiones.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.proyecto.camiones.interceptor.UsuarioActividadInterceptor;



@Configuration
public class WebConfig implements WebMvcConfigurer {



    private final UsuarioActividadInterceptor usuarioActividadInterceptor;



    public WebConfig(
            UsuarioActividadInterceptor usuarioActividadInterceptor
    ){

        this.usuarioActividadInterceptor =
                usuarioActividadInterceptor;

    }






    @Override
    public void addInterceptors(
            InterceptorRegistry registry
    ){



        registry.addInterceptor(
                usuarioActividadInterceptor
        )

        .addPathPatterns(
                "/dashboard/**",
                "/usuarios/**",
                "/camiones/**",
                "/conductores/**"
        )

        .excludePathPatterns(

                "/",
                "/login",

                "/css/**",
                "/js/**",
                "/imgs/**",

                "/error"

        );


    }



}