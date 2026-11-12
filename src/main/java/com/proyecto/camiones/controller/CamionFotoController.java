package com.proyecto.camiones.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.proyecto.camiones.model.CamionFoto;
import com.proyecto.camiones.repository.CamionFotoRepository;
import com.proyecto.camiones.services.CloudinaryService;

@RestController
public class CamionFotoController {

    @Autowired
    private CamionFotoRepository repo;

    @Autowired
    private CloudinaryService cloudinaryService;

    // Listar fotos de una unidad (UNIDAD y REPUESTO)
    @GetMapping("/camiones/{id}/fotos")
    public List<CamionFoto> listar(@PathVariable Long id) {
        return repo.findByCamionIdOrderByIdDesc(id);
    }

    // Subir una o varias fotos. tipo = UNIDAD | REPUESTO
    @PostMapping("/camiones/{id}/fotos")
    public ResponseEntity<?> subir(@PathVariable Long id,
            @RequestParam String tipo,
            @RequestParam("fotos") List<MultipartFile> fotos) throws IOException {

        if (!"UNIDAD".equals(tipo) && !"REPUESTO".equals(tipo)) {
            return ResponseEntity.badRequest().body("Tipo de fotografía inválido");
        }

        for (MultipartFile archivo : fotos) {
            if (archivo.isEmpty()) continue;

            CamionFoto foto = new CamionFoto();
            foto.setCamionId(id);
            foto.setTipo(tipo);
            foto.setUrl(cloudinaryService.subirImagen(archivo));
            repo.save(foto);
        }

        return ResponseEntity.ok(repo.findByCamionIdOrderByIdDesc(id));
    }

    // Eliminar una foto (también de Cloudinary)
    @DeleteMapping("/camiones/fotos/{fotoId}")
    public ResponseEntity<?> eliminar(@PathVariable Long fotoId) throws IOException {

        CamionFoto foto = repo.findById(fotoId).orElse(null);
        if (foto == null) return ResponseEntity.notFound().build();

        cloudinaryService.eliminarImagen(foto.getUrl());
        repo.delete(foto);

        return ResponseEntity.ok().build();
    }
}