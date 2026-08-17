package com.proyecto.camiones.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.Nota;
import com.proyecto.camiones.repository.NotaRepository;

@Controller
@RequestMapping("/notas")
public class NotasController {

    @Autowired
    private NotaRepository notaRepository;


    // =========================================================
    // MOSTRAR VISTA DE NOTAS
    // =========================================================

    @GetMapping
    public String mostrarNotas(
            @RequestParam(required = false) String fecha,
            Model model) {

        List<Nota> notas;

        LocalDate fechaSeleccionada = null;

        if (fecha != null && !fecha.isBlank()) {

            try {

                fechaSeleccionada =
                        LocalDate.parse(fecha);

                notas =
                        notaRepository
                                .findByFechaOrderByCreatedAtDesc(
                                        fechaSeleccionada
                                );

            } catch (Exception e) {

                notas =
                        notaRepository
                                .findAllByOrderByFechaDescCreatedAtDesc();

                model.addAttribute(
                        "error",
                        "La fecha seleccionada no es válida."
                );
            }

        } else {

            notas =
                    notaRepository
                            .findAllByOrderByFechaDescCreatedAtDesc();
        }


        model.addAttribute(
                "notas",
                notas
        );

        model.addAttribute(
                "nuevaNota",
                new Nota()
        );

        model.addAttribute(
                "hoy",
                LocalDate.now()
        );

        model.addAttribute(
                "fechaSeleccionada",
                fechaSeleccionada
        );

        return "notas";
    }


    // =========================================================
    // API - OBTENER TODAS LAS NOTAS
    // GET /notas/api
    // =========================================================

    @GetMapping("/api")
    @ResponseBody
    public List<Nota> obtenerNotasApi() {

        return notaRepository
                .findAllByOrderByFechaDescCreatedAtDesc();
    }


    // =========================================================
    // API - OBTENER UNA NOTA
    // GET /notas/api/{id}
    // =========================================================

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<Nota> obtenerNotaApi(
            @PathVariable Long id) {

        Optional<Nota> nota =
                notaRepository.findById(id);

        if (nota.isEmpty()) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(
                nota.get()
        );
    }


    // =========================================================
    // API - CREAR NOTA
    // POST /notas/api
    // =========================================================

    @PostMapping("/api")
    @ResponseBody
    public ResponseEntity<?> crearNotaApi(
            @RequestBody Nota nota) {

        // -----------------------------------------------------
        // VALIDAR FECHA
        // -----------------------------------------------------

        if (nota.getFecha() == null) {

            nota.setFecha(
                    LocalDate.now()
            );
        }


        // -----------------------------------------------------
        // VALIDAR TÍTULO
        // -----------------------------------------------------

        if (nota.getTitulo() == null ||
            nota.getTitulo().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "El título es obligatorio."
                    );
        }


        // -----------------------------------------------------
        // VALIDAR CONTENIDO
        // -----------------------------------------------------

        if (nota.getContenido() == null ||
            nota.getContenido().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "El contenido es obligatorio."
                    );
        }


        // -----------------------------------------------------
        // LIMPIAR DATOS
        // -----------------------------------------------------

        nota.setTitulo(
                nota.getTitulo().trim()
        );

        nota.setContenido(
                nota.getContenido().trim()
        );


        // -----------------------------------------------------
        // GUARDAR
        // -----------------------------------------------------

        Nota guardada =
                notaRepository.save(nota);


        return ResponseEntity.ok(
                guardada
        );
    }


    // =========================================================
    // API - ACTUALIZAR NOTA
    // PUT /notas/api/{id}
    // =========================================================

    @PutMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarNotaApi(
            @PathVariable Long id,
            @RequestBody Nota datos) {

        Optional<Nota> resultado =
                notaRepository.findById(id);


        if (resultado.isEmpty()) {

            return ResponseEntity
                    .notFound()
                    .build();
        }


        Nota nota =
                resultado.get();


        // -----------------------------------------------------
        // FECHA
        // -----------------------------------------------------

        if (datos.getFecha() != null) {

            nota.setFecha(
                    datos.getFecha()
            );
        }


        // -----------------------------------------------------
        // TÍTULO
        // -----------------------------------------------------

        if (datos.getTitulo() == null ||
            datos.getTitulo().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "El título es obligatorio."
                    );
        }

        nota.setTitulo(
                datos.getTitulo().trim()
        );


        // -----------------------------------------------------
        // CONTENIDO
        // -----------------------------------------------------

        if (datos.getContenido() == null ||
            datos.getContenido().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "El contenido es obligatorio."
                    );
        }

        nota.setContenido(
                datos.getContenido().trim()
        );


        // -----------------------------------------------------
        // GUARDAR CAMBIOS
        // -----------------------------------------------------

        Nota actualizada =
                notaRepository.save(nota);


        return ResponseEntity.ok(
                actualizada
        );
    }


    // =========================================================
    // API - ELIMINAR NOTA
    // DELETE /notas/api/{id}
    // =========================================================

    @DeleteMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarNotaApi(
            @PathVariable Long id) {

        if (!notaRepository.existsById(id)) {

            return ResponseEntity
                    .notFound()
                    .build();
        }


        notaRepository.deleteById(id);


        return ResponseEntity
                .noContent()
                .build();
    }


    // =========================================================
    // GUARDAR NOTA CON THYMELEAF
    // =========================================================

    @PostMapping("/guardar")
    public String guardarNota(
            @ModelAttribute Nota nota) {

        if (nota.getFecha() == null) {

            nota.setFecha(
                    LocalDate.now()
            );
        }

        if (nota.getTitulo() != null) {

            nota.setTitulo(
                    nota.getTitulo().trim()
            );
        }

        if (nota.getContenido() != null) {

            nota.setContenido(
                    nota.getContenido().trim()
            );
        }

        notaRepository.save(nota);

        return "redirect:/notas";
    }


    // =========================================================
    // EDITAR NOTA CON THYMELEAF
    // =========================================================

    @GetMapping("/editar/{id}")
    public String mostrarEditar(
            @PathVariable Long id,
            Model model) {

        Nota nota =
                notaRepository
                        .findById(id)
                        .orElse(null);


        if (nota == null) {

            return "redirect:/notas";
        }


        List<Nota> notas =
                notaRepository
                        .findAllByOrderByFechaDescCreatedAtDesc();


        model.addAttribute(
                "notas",
                notas
        );

        model.addAttribute(
                "nuevaNota",
                nota
        );

        model.addAttribute(
                "editando",
                true
        );

        model.addAttribute(
                "hoy",
                LocalDate.now()
        );

        model.addAttribute(
                "fechaSeleccionada",
                null
        );


        return "notas";
    }


    // =========================================================
    // ACTUALIZAR NOTA CON THYMELEAF
    // =========================================================

    @PostMapping("/actualizar/{id}")
    public String actualizarNota(
            @PathVariable Long id,
            @ModelAttribute Nota nota) {

        Nota notaExistente =
                notaRepository
                        .findById(id)
                        .orElse(null);


        if (notaExistente != null) {

            if (nota.getFecha() != null) {

                notaExistente.setFecha(
                        nota.getFecha()
                );
            }


            if (nota.getTitulo() != null) {

                notaExistente.setTitulo(
                        nota.getTitulo().trim()
                );
            }


            if (nota.getContenido() != null) {

                notaExistente.setContenido(
                        nota.getContenido().trim()
                );
            }


            notaRepository.save(
                    notaExistente
            );
        }


        return "redirect:/notas";
    }


    // =========================================================
    // ELIMINAR NOTA CON THYMELEAF
    // =========================================================

    @PostMapping("/eliminar/{id}")
    public String eliminarNota(
            @PathVariable Long id) {

        if (notaRepository.existsById(id)) {

            notaRepository.deleteById(id);
        }

        return "redirect:/notas";
    }


    // =========================================================
    // FILTRAR POR FECHA
    // =========================================================

    @GetMapping("/filtrar")
    public String filtrarPorFecha(
            @RequestParam String fecha) {

        if (fecha == null ||
            fecha.isBlank()) {

            return "redirect:/notas";
        }

        return "redirect:/notas?fecha=" + fecha;
    }


    // =========================================================
    // LIMPIAR FILTRO
    // =========================================================

    @GetMapping("/limpiar")
    public String limpiarFiltro() {

        return "redirect:/notas";
    }
}