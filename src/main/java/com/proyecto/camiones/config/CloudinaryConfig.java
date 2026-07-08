package com.proyecto.camiones.config;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;



@Configuration
public class CloudinaryConfig {



    @Bean
    public Cloudinary cloudinary(){


        return new Cloudinary(

                ObjectUtils.asMap(

                    "cloud_name",
                    "dhtmtgjzc",

                    "api_key",
                    "674697522842588",

                    "api_secret",
                    "Of-Gwdla5u_A5ivAPyJRotC82K0"

                )

        );


    }


}