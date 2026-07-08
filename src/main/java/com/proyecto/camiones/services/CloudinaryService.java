package com.proyecto.camiones.services;


import java.io.IOException;
import java.util.Map;


import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import com.cloudinary.Cloudinary;



@Service
public class CloudinaryService {


    private final Cloudinary cloudinary;



    public CloudinaryService(Cloudinary cloudinary){

        this.cloudinary = cloudinary;

    }




    public String subirImagen(MultipartFile archivo)
            throws IOException {



        Map resultado =
        cloudinary.uploader()
        .upload(
                archivo.getBytes(),
                null
        );


        return resultado
                .get("secure_url")
                .toString();


    }

    public void eliminarImagen(String url)
            throws IOException {


        String publicId =
                extraerPublicId(url);


        cloudinary.uploader()
        .destroy(
                publicId,
                null
        );


    }


    private String extraerPublicId(String url){


        String[] partes =
                url.split("/");


        String archivo =
                partes[partes.length - 1];


        return archivo.substring(
                0,
                archivo.lastIndexOf(".")
        );

    }
}