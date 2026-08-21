package com.proyecto.camiones.controller;

import com.proyecto.camiones.model.Programacion;
import com.proyecto.camiones.services.ProgramacionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/programaciones")
public class ProgramacionController {

    private final ProgramacionService programacionService;

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public ProgramacionController(
            ProgramacionService programacionService) {

        this.programacionService = programacionService;
    }


    // =========================================================
    // MOSTRAR PÁGINA DE PROGRAMACIONES
    // =========================================================

    @GetMapping
    public String mostrarProgramaciones(Model model) {

        List<Programacion> programaciones =
                programacionService.listarTodas();

        model.addAttribute(
                "programaciones",
                programaciones
        );

        return "reporteDiario";
    }


    // =========================================================
    // LISTAR PROGRAMACIONES EN JSON
    //
    // ESTE ES EL ENDPOINT QUE NECESITA EL JAVASCRIPT
    //
    // GET:
    // /programaciones/lista
    // =========================================================

    @GetMapping("/lista")
    @ResponseBody
    public ResponseEntity<List<Programacion>> listarProgramaciones() {

        try {

            List<Programacion> programaciones =
                    programacionService.listarTodas();

            if (programaciones == null) {

                return ResponseEntity.ok(
                        List.of()
                );
            }

            return ResponseEntity.ok(
                    programaciones
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of());
        }
    }


    // =========================================================
    // OBTENER PROGRAMACIÓN POR ID
    //
    // GET:
    // /programaciones/{id}
    // =========================================================

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Programacion> obtenerPorId(
            @PathVariable Integer id) {

        try {

            Optional<Programacion> programacion =
                    programacionService.buscarPorId(id);

            if (programacion.isEmpty()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            return ResponseEntity.ok(
                    programacion.get()
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }


    // =========================================================
    // CREAR PROGRAMACIÓN
    //
    // POST:
    // /programaciones/guardar
    // =========================================================

    @PostMapping("/guardar")
    @ResponseBody
    public ResponseEntity<Programacion> guardar(
            @RequestBody Programacion programacion) {

        try {

            Programacion nuevaProgramacion =
                    programacionService.guardar(
                            programacion
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(nuevaProgramacion);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }


    // =========================================================
    // EDITAR PROGRAMACIÓN
    //
    // PUT:
    // /programaciones/editar/{id}
    // =========================================================

    @PutMapping("/editar/{id}")
    @ResponseBody
    public ResponseEntity<Programacion> editar(
            @PathVariable Integer id,
            @RequestBody Programacion programacion) {

        try {

            Optional<Programacion> existente =
                    programacionService.buscarPorId(id);

            if (existente.isEmpty()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }


            // =================================================
            // IMPORTANTE:
            // EL ID VIENE DE LA URL
            // =================================================

            programacion.setId(id);


            Programacion actualizada =
                    programacionService.actualizar(
                            programacion
                    );


            return ResponseEntity.ok(
                    actualizada
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }


    // =========================================================
    // ELIMINAR PROGRAMACIÓN
    //
    // DELETE:
    // /programaciones/eliminar/{id}
    // =========================================================

    @DeleteMapping("/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<Void> eliminar(
            @PathVariable Integer id) {

        try {

            boolean existe =
                    programacionService.existe(id);


            if (!existe) {

                return ResponseEntity
                        .notFound()
                        .build();
            }


            programacionService.eliminar(id);


            return ResponseEntity
                    .noContent()
                    .build();


        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }
}