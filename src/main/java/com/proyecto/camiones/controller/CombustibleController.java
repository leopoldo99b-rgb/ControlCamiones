package com.proyecto.camiones.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.camiones.model.Combustible;
import com.proyecto.camiones.repository.CombustibleRepository;

/**
 * API de combustibles que usa combustible.js:
 *   GET /api/combustibles/activos
 *   PUT /api/combustibles/{id}/precio   body: { "precioGalon": 95.50 }
 *
 * IMPORTANTE: si ya tienes un controlador con @RequestMapping("/api/combustibles"),
 * NO agregues este archivo; añade solo los métodos que falten a ese.
 */
@RestController
@RequestMapping("/api/combustibles")
@CrossOrigin
public class CombustibleController {

    private final CombustibleRepository combustibleRepository;

    public CombustibleController(CombustibleRepository combustibleRepository) {
        this.combustibleRepository = combustibleRepository;
    }

    // =========================================================
    // LISTAR COMBUSTIBLES ACTIVOS
    // =========================================================

    @GetMapping("/activos")
    public ResponseEntity<List<Combustible>> activos() {

        List<Combustible> lista = combustibleRepository.findAll()
                .stream()
                .filter(c -> Boolean.TRUE.equals(c.getActivo()))
                .toList();

        return ResponseEntity.ok(lista);
    }

    // =========================================================
    // ACTUALIZAR PRECIO POR GALÓN
    // (los abastecimientos anteriores conservan su precio)
    // =========================================================

    @PutMapping("/{id}/precio")
    public ResponseEntity<?> actualizarPrecio(
            @PathVariable Long id,
            @RequestBody Map<String, Object> cuerpo) {

        Object valor = cuerpo.get("precioGalon");

        if (valor == null) {
            return ResponseEntity.badRequest().body("El precio por galón es obligatorio.");
        }

        BigDecimal precio;

        try {
            precio = new BigDecimal(String.valueOf(valor));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("El precio por galón no es un número válido.");
        }

        if (precio.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("El precio debe ser mayor que cero.");
        }

        return combustibleRepository.findById(id)
                .<ResponseEntity<?>>map(c -> {
                    c.setPrecioGalon(precio);
                    return ResponseEntity.ok(combustibleRepository.save(c));
                })
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("No existe el combustible con ID: " + id));
    }
}