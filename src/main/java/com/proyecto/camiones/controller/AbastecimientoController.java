package com.proyecto.camiones.controller;

import java.time.LocalDate;
import java.util.List;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.camiones.exception.ResourceNotFoundException;
import com.proyecto.camiones.model.Abastecimiento;
import com.proyecto.camiones.services.AbastecimientoService;

import dto.AbastecimientoRequest;

@RestController
@RequestMapping("/api/abastecimientos")
@CrossOrigin
public class AbastecimientoController {

    private final AbastecimientoService service;

    public AbastecimientoController(
            AbastecimientoService service
    ) {
        this.service = service;
    }

    // =========================================================
    // LISTAR ABASTECIMIENTOS
    // =========================================================

    @GetMapping
    public ResponseEntity<?> obtenerTodos(

            @RequestParam(required = false)
            String desde,

            @RequestParam(required = false)
            String hasta,

            @RequestParam(required = false)
            String placa,

            @RequestParam(required = false)
            Long combustibleId

    ) {

        try {

            LocalDate fechaDesde = null;
            LocalDate fechaHasta = null;

            // =================================================
            // FECHA DESDE
            // =================================================

            if (
                    desde != null &&
                    !desde.trim().isEmpty()
            ) {

                fechaDesde =
                        LocalDate.parse(
                                desde.trim()
                        );
            }

            // =================================================
            // FECHA HASTA
            // =================================================

            if (
                    hasta != null &&
                    !hasta.trim().isEmpty()
            ) {

                fechaHasta =
                        LocalDate.parse(
                                hasta.trim()
                        );
            }

            // =================================================
            // VALIDAR RANGO
            // =================================================

            if (
                    fechaDesde != null &&
                    fechaHasta != null &&
                    fechaDesde.isAfter(fechaHasta)
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "La fecha desde no puede ser posterior a la fecha hasta."
                        );
            }

            // =================================================
            // NORMALIZAR PLACA
            // =================================================

            if (placa != null) {

                placa = placa.trim();

                if (placa.isEmpty()) {
                    placa = null;
                }
            }

            // =================================================
            // BUSCAR
            // =================================================

            List<Abastecimiento> resultado =
                    service.buscarLista(
                            fechaDesde,
                            fechaHasta,
                            placa,
                            combustibleId
                    );

            return ResponseEntity.ok(
                    resultado
            );

        } catch (
                java.time.format.DateTimeParseException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "El formato de fecha no es válido. Use YYYY-MM-DD."
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            "Error al obtener abastecimientos: "
                                    + obtenerMensajeError(e)
                    );
        }
    }

    // =========================================================
    // OBTENER POR ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(
            @PathVariable Long id
    ) {

        try {

            if (id == null || id <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "El ID del abastecimiento no es válido."
                        );
            }

            Abastecimiento abastecimiento =
                    service.obtenerPorId(id);

            return ResponseEntity.ok(
                    abastecimiento
            );

        } catch (ResourceNotFoundException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            e.getMessage()
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            obtenerMensajeError(e)
                    );
        }
    }

    // =========================================================
    // CREAR ABASTECIMIENTO
    // =========================================================

    @PostMapping
    public ResponseEntity<?> crear(
            @RequestBody AbastecimientoRequest request
    ) {

        try {

            ResponseEntity<?> error =
                    validarRequest(request);

            if (error != null) {
                return error;
            }

            Abastecimiento abastecimiento =
                    service.crear(request);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            abastecimiento
                    );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            "Error al crear el abastecimiento: "
                                    + obtenerMensajeError(e)
                    );
        }
    }

    // =========================================================
    // ACTUALIZAR ABASTECIMIENTO
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(

            @PathVariable Long id,

            @RequestBody AbastecimientoRequest request

    ) {

        try {

            if (id == null || id <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "El ID del abastecimiento no es válido."
                        );
            }

            ResponseEntity<?> error =
                    validarRequest(request);

            if (error != null) {
                return error;
            }

            Abastecimiento abastecimiento =
                    service.actualizar(
                            id,
                            request
                    );

            return ResponseEntity.ok(
                    abastecimiento
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );

        } catch (ResourceNotFoundException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            e.getMessage()
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            "Error al actualizar el abastecimiento: "
                                    + obtenerMensajeError(e)
                    );
        }
    }

    // =========================================================
    // ELIMINAR ABASTECIMIENTO
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(
            @PathVariable Long id
    ) {

        try {

            if (id == null || id <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "El ID del abastecimiento no es válido."
                        );
            }

            // IMPORTANTE:
            // Ya no hacemos:
            //
            // service.obtenerPorId(id);
            // service.eliminar(id);
            //
            // El service verifica existencia y ejecuta el
            // DELETE directamente.

            service.eliminar(id);

            return ResponseEntity.ok(
                    "Abastecimiento eliminado correctamente."
            );

        } catch (ResourceNotFoundException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            e.getMessage()
                    );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            "Error al eliminar el abastecimiento: "
                                    + obtenerMensajeError(e)
                    );
        }
    }

    // =========================================================
    // VALIDACIÓN DEL REQUEST
    // =========================================================

    private ResponseEntity<?> validarRequest(
            AbastecimientoRequest request
    ) {

        if (request == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Los datos del abastecimiento son obligatorios."
                    );
        }

        // =====================================================
        // FECHA
        // =====================================================

        if (request.getFecha() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "La fecha del abastecimiento es obligatoria."
                    );
        }

        // =====================================================
        // PLACA
        // =====================================================

        if (
                request.getPlaca() == null ||
                request.getPlaca().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "La placa es obligatoria."
                    );
        }

        // =====================================================
        // MOTORISTA
        // =====================================================

        if (
                request.getMotorista() == null ||
                request.getMotorista().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "El motorista es obligatorio."
                    );
        }

        // =====================================================
        // DESTINO
        // =====================================================

        if (
                request.getDestino() == null ||
                request.getDestino().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "El destino es obligatorio."
                    );
        }

        // =====================================================
        // KM
        // =====================================================

        if (request.getKmRuta() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Los kilómetros de ruta son obligatorios."
                    );
        }

        if (
                request.getKmRuta()
                        .compareTo(
                                java.math.BigDecimal.ZERO
                        ) < 0
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Los kilómetros no pueden ser negativos."
                    );
        }

        // =====================================================
        // GALONES
        // =====================================================

        if (
                request.getGalonesAutorizados() == null
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Los galones autorizados son obligatorios."
                    );
        }

        if (
                request.getGalonesAutorizados()
                        .compareTo(
                                java.math.BigDecimal.ZERO
                        ) <= 0
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Los galones autorizados deben ser mayores que cero."
                    );
        }

        // =====================================================
        // GASOLINERA
        // =====================================================

        if (
                request.getGasolinera() == null ||
                request.getGasolinera().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "La gasolinera es obligatoria."
                    );
        }

        String gasolinera =
                request.getGasolinera().trim();

        if (
                !gasolinera.equals("Shell") &&
                !gasolinera.equals("Texaco") &&
                !gasolinera.equals("Puma") &&
                !gasolinera.equals("UNO") &&
                !gasolinera.equals("Otra")
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "La gasolinera seleccionada no es válida. "
                                    + "Use Shell, Texaco, Puma, UNO u Otra."
                    );
        }

        // =====================================================
        // COMBUSTIBLE
        // =====================================================

        if (request.getCombustibleId() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "El combustible es obligatorio."
                    );
        }

        return null;
    }

    // =========================================================
    // OBTENER MENSAJE REAL DEL ERROR
    // =========================================================

    private String obtenerMensajeError(
            Exception e
    ) {

        Throwable causa = e;

        String mensaje =
                e.getMessage();

        while (causa.getCause() != null) {

            causa = causa.getCause();

            if (
                    causa.getMessage() != null &&
                    !causa.getMessage().isBlank()
            ) {

                mensaje =
                        causa.getMessage();
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