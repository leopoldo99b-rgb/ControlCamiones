package com.proyecto.camiones.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.camiones.model.Combustible;
import com.proyecto.camiones.services.CombustibleService;

import dto.CombustibleRequest;

@RestController
@RequestMapping("/api/combustibles")
@CrossOrigin
public class combustibleController {

    private final CombustibleService service;

    public combustibleController(CombustibleService service) {
        this.service = service;
    }

    // =========================================================
    // OBTENER TODOS LOS COMBUSTIBLES
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Combustible>> obtenerTodos() {

        return ResponseEntity.ok(
                service.obtenerTodos()
        );
    }

    // =========================================================
    // OBTENER SOLO COMBUSTIBLES ACTIVOS
    // =========================================================

    @GetMapping("/activos")
    public ResponseEntity<List<Combustible>> obtenerActivos() {

        return ResponseEntity.ok(
                service.obtenerActivos()
        );
    }

    // =========================================================
    // OBTENER COMBUSTIBLE POR ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<Combustible> obtenerPorId(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                service.obtenerPorId(id)
        );
    }

    // =========================================================
    // CREAR COMBUSTIBLE
    // =========================================================

    @PostMapping
    public ResponseEntity<Combustible> crear(
            @RequestBody CombustibleRequest request
    ) {

        Combustible combustible = service.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(combustible);
    }

    // =========================================================
    // ACTUALIZAR COMBUSTIBLE
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<Combustible> actualizar(
            @PathVariable Long id,
            @RequestBody CombustibleRequest request
    ) {

        return ResponseEntity.ok(
                service.actualizar(id, request)
        );
    }

    // =========================================================
    // ACTUALIZAR PRECIO
    // =========================================================

    @PutMapping("/{id}/precio")
    public ResponseEntity<?> actualizarPrecio(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> request
    ) {

        try {

            if (request == null || !request.containsKey("precioGalon")) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "El campo 'precioGalon' es obligatorio."
                        ));
            }

            BigDecimal precio = request.get("precioGalon");

            if (precio == null) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "El precio del galón es obligatorio."
                        ));
            }

            if (precio.compareTo(BigDecimal.ZERO) <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "El precio debe ser mayor que cero."
                        ));
            }

            Combustible actualizado =
                    service.actualizarPrecio(id, precio);

            return ResponseEntity.ok(actualizado);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "message",
                            e.getMessage() != null
                                    ? e.getMessage()
                                    : "No fue posible actualizar el precio."
                    ));

        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Error interno al actualizar el precio."
                    ));
        }
    }

    // =========================================================
    // ELIMINAR / DESACTIVAR COMBUSTIBLE
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id
    ) {

        service.eliminar(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}