package com.proyecto.camiones.controller;

import com.proyecto.camiones.model.Mantenimiento;
import com.proyecto.camiones.model.Unidad;
import com.proyecto.camiones.services.MantenimientoService;
import com.proyecto.camiones.services.UnidadService;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class MantenimientosController {

    private final MantenimientoService mantenimientoService;
    private final UnidadService unidadService;

    public MantenimientosController(
            MantenimientoService mantenimientoService,
            UnidadService unidadService) {

        this.mantenimientoService = mantenimientoService;
        this.unidadService = unidadService;
    }

    // =========================================================
    // VISTA PRINCIPAL
    // =========================================================

    @GetMapping("/mantenimiento")
    public String mantenimientos(Model model) {

        List<Unidad> unidades = unidadService.listarActivas();

        model.addAttribute("unidades", unidades);

        return "mantenimiento";
    }

    // =========================================================
    // LISTAR TODOS LOS MANTENIMIENTOS
    // =========================================================

    @GetMapping("/api/mantenimientos")
    @ResponseBody
    public List<Mantenimiento> listarMantenimientos() {

        return mantenimientoService.listarTodos();
    }

    // =========================================================
    // BUSCAR MANTENIMIENTO POR ID
    // =========================================================

    @GetMapping("/api/mantenimientos/{id}")
    @ResponseBody
    public ResponseEntity<Mantenimiento> buscarMantenimiento(
            @PathVariable Integer id) {

        return mantenimientoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================
    // CREAR MANTENIMIENTO
    // =========================================================

    @PostMapping("/api/mantenimientos")
    @ResponseBody
    public ResponseEntity<Mantenimiento> crearMantenimiento(
            @RequestBody Mantenimiento mantenimiento) {

        /*
         * IMPORTANTE:
         *
         * No asignamos idMantenimiento aquí.
         *
         * La base de datos genera automáticamente
         * el ID mediante la columna IDENTITY.
         */

        mantenimiento.setIdMantenimiento(null);

        Mantenimiento nuevo =
                mantenimientoService.guardar(mantenimiento);

        return ResponseEntity.ok(nuevo);
    }

    // =========================================================
    // EDITAR MANTENIMIENTO
    // =========================================================

    @PutMapping("/api/mantenimientos/{id}")
    @ResponseBody
    public ResponseEntity<Mantenimiento> editarMantenimiento(
            @PathVariable Integer id,
            @RequestBody Mantenimiento datos) {

        return mantenimientoService.buscarPorId(id)
                .map(mantenimiento -> {

                    mantenimiento.setFechaMantenimiento(
                            datos.getFechaMantenimiento()
                    );

                    mantenimiento.setMedicionValor(
                            datos.getMedicionValor()
                    );

                    mantenimiento.setMedicionTipo(
                            datos.getMedicionTipo()
                    );

                    mantenimiento.setUnidad(
                            datos.getUnidad()
                    );

                    mantenimiento.setTipo(
                            datos.getTipo()
                    );

                    mantenimiento.setDescripcion(
                            datos.getDescripcion()
                    );

                    /*
                     * No modificamos el ID.
                     *
                     * El registro mantiene su
                     * id_mantenimiento original.
                     */

                    Mantenimiento actualizado =
                            mantenimientoService.guardar(mantenimiento);

                    return ResponseEntity.ok(actualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================
    // ELIMINAR MANTENIMIENTO
    // =========================================================

    @DeleteMapping("/api/mantenimientos/{id}")
    @ResponseBody
    public ResponseEntity<Void> eliminarMantenimiento(
            @PathVariable Integer id) {

        if (mantenimientoService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        mantenimientoService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}