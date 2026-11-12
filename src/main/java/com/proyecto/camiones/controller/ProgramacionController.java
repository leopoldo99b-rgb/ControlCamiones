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

    public ProgramacionController(ProgramacionService programacionService) {
        this.programacionService = programacionService;
    }

    // GET /programaciones  -> página
    @GetMapping
    public String mostrarProgramaciones(Model model) {
        model.addAttribute("programaciones", programacionService.listarTodas());
        return "reporteDiario";
    }

    // GET /programaciones/lista  -> JSON
    @GetMapping("/lista")
    @ResponseBody
    public ResponseEntity<List<Programacion>> listarProgramaciones() {
        try {
            List<Programacion> lista = programacionService.listarTodas();
            return ResponseEntity.ok(lista == null ? List.of() : lista);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    // GET /programaciones/{id}
    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Programacion> obtenerPorId(@PathVariable Integer id) {
        try {
            Optional<Programacion> p = programacionService.buscarPorId(id);
            return p.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(p.get());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // POST /programaciones/guardar
    // CAMBIO: ahora devuelve el mensaje de error real (antes devolvía cuerpo vacío)
    @PostMapping("/guardar")
    @ResponseBody
    public ResponseEntity<?> guardar(@RequestBody Programacion programacion) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(programacionService.guardar(programacion));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("No se pudo guardar el viaje: " + causaRaiz(e));
        }
    }

    // PUT /programaciones/editar/{id}
    @PutMapping("/editar/{id}")
    @ResponseBody
    public ResponseEntity<?> editar(@PathVariable Integer id, @RequestBody Programacion programacion) {
        try {
            if (!programacionService.existe(id)) {
                return ResponseEntity.notFound().build();
            }
            programacion.setId(id);
            return ResponseEntity.ok(programacionService.actualizar(programacion));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("No se pudo actualizar el viaje: " + causaRaiz(e));
        }
    }

    // DELETE /programaciones/eliminar/{id}
    @DeleteMapping("/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        try {
            if (!programacionService.existe(id)) {
                return ResponseEntity.notFound().build();
            }
            programacionService.eliminar(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String causaRaiz(Throwable e) {
        Throwable t = e;
        while (t.getCause() != null) {
            t = t.getCause();
        }
        return t.getMessage() == null ? "error desconocido" : t.getMessage();
    }
}