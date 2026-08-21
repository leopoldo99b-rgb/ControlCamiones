package com.proyecto.camiones.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.Ruta;
import com.proyecto.camiones.services.RutaService;

@Controller
public class RutasController {

    @Autowired
    private RutaService rutaService;


    // =====================================================
    // LISTAR RUTAS
    // GET /api/rutas
    // =====================================================

    @GetMapping("/api/rutas")
    @ResponseBody
    public ResponseEntity<?> listarRutas() {

        try {

            List<Ruta> rutas = rutaService.listarTodos();

            return ResponseEntity.ok(rutas);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body("Error al cargar las rutas: "
                            + obtenerMensajeError(e));
        }
    }


    // =====================================================
    // BUSCAR RUTA POR ID
    // GET /api/rutas/{id}
    // =====================================================

    @GetMapping("/api/rutas/{id}")
    @ResponseBody
    public ResponseEntity<?> buscarRuta(
            @PathVariable Long id
    ) {

        try {

            Ruta ruta = rutaService.buscarPorId(id);

            if (ruta == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            return ResponseEntity.ok(ruta);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body("Error al buscar la ruta: "
                            + obtenerMensajeError(e));
        }
    }


    // =====================================================
    // GUARDAR RUTA
    // POST /api/rutas
    // =====================================================

    @PostMapping("/api/rutas")
    @ResponseBody
    public ResponseEntity<?> guardarRuta(
            @RequestBody Ruta ruta
    ) {

        try {

            ResponseEntity<?> error = validarRuta(ruta);

            if (error != null) {
                return error;
            }

            Ruta guardada = rutaService.guardar(ruta);

            return ResponseEntity.ok(guardada);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body("Error al guardar la ruta: "
                            + obtenerMensajeError(e));
        }
    }


    // =====================================================
    // ACTUALIZAR RUTA
    // PUT /api/rutas/{id}
    // =====================================================

    @PutMapping("/api/rutas/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarRuta(
            @PathVariable Long id,
            @RequestBody Ruta ruta
    ) {

        try {

            if (id == null) {

                return ResponseEntity
                        .badRequest()
                        .body("El ID de la ruta es obligatorio.");
            }

            Ruta existente = rutaService.buscarPorId(id);

            if (existente == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            ResponseEntity<?> error = validarRuta(ruta);

            if (error != null) {
                return error;
            }

            Ruta actualizada =
                    rutaService.modificar(id, ruta);

            return ResponseEntity.ok(actualizada);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body("Error al actualizar la ruta: "
                            + obtenerMensajeError(e));
        }
    }


    // =====================================================
    // ELIMINAR RUTA
    // DELETE /api/rutas/{id}
    // =====================================================

    @DeleteMapping("/api/rutas/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarRuta(@PathVariable Long id) {

        try {

            Ruta existente = rutaService.buscarPorId(id);

            if (existente == null) {
                return ResponseEntity
                        .notFound()
                        .build();
            }

            rutaService.eliminar(id);

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body("Error al eliminar la ruta: "
                            + obtenerMensajeError(e));
        }
    }


    // =====================================================
    // VALIDAR RUTA
    // =====================================================

    private ResponseEntity<?> validarRuta(Ruta ruta) {

        if (ruta == null) {

            return ResponseEntity
                    .badRequest()
                    .body("Los datos de la ruta son obligatorios.");
        }


        if (
            ruta.getDestino() == null ||
            ruta.getDestino().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("El destino de la ruta es obligatorio.");
        }


        if (ruta.getOdt() == null) {

            return ResponseEntity
                    .badRequest()
                    .body("La hora ODT es obligatoria.");
        }


        if (
            ruta.getEstado() == null ||
            ruta.getEstado().trim().isEmpty()
        ) {

            ruta.setEstado("ACTIVA");

        } else {

            ruta.setEstado(
                    ruta.getEstado()
                         .trim()
                         .toUpperCase()
            );
        }


        ruta.setDestino(
                ruta.getDestino()
                     .trim()
        );


        return null;
    }


    // =====================================================
    // OBTENER MENSAJE REAL DEL ERROR
    // =====================================================

    private String obtenerMensajeError(Exception e) {

        Throwable causa = e;

        String mensaje = e.getMessage();

        while (causa.getCause() != null) {

            causa = causa.getCause();

            if (
                causa.getMessage() != null &&
                !causa.getMessage().isBlank()
            ) {

                mensaje = causa.getMessage();
            }
        }


        if (
            mensaje == null ||
            mensaje.isBlank()
        ) {

            return "Error desconocido.";
        }


        return mensaje;
    }
}