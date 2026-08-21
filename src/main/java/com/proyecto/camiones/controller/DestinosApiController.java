package com.proyecto.camiones.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.camiones.model.Destino;
import com.proyecto.camiones.services.DestinoService;

@RestController
@RequestMapping("/api/destinos")
public class DestinosApiController {

    // =====================================================
    // SERVICIO
    // =====================================================

    @Autowired
    private DestinoService destinoService;


    // =====================================================
    // LISTAR TODOS LOS DESTINOS
    //
    // GET /api/destinos
    // =====================================================

    @GetMapping
    public ResponseEntity<?> listar() {

        try {

            List<Destino> destinos =
                    destinoService.listarTodos();

            return ResponseEntity.ok(destinos);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                        "Error al cargar los destinos: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // BUSCAR DESTINO POR ID
    //
    // GET /api/destinos/{id}
    // =====================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(
            @PathVariable Long id
    ) {

        try {

            if (id == null || id <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "El ID del destino no es válido."
                        );
            }

            Destino destino =
                    destinoService.buscarPorId(id);

            if (destino == null) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(
                            "El destino solicitado no existe."
                        );
            }

            return ResponseEntity.ok(destino);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                        "Error al buscar el destino: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // GUARDAR DESTINO
    //
    // POST /api/destinos
    // =====================================================

    @PostMapping
    public ResponseEntity<?> guardar(
            @RequestBody Destino destino
    ) {

        try {

            // -------------------------------------------------
            // VALIDAR
            // -------------------------------------------------

            ResponseEntity<?> error =
                    validar(destino);

            if (error != null) {
                return error;
            }


            // -------------------------------------------------
            // GUARDAR
            // -------------------------------------------------

            Destino guardado =
                    destinoService.guardar(destino);


            // -------------------------------------------------
            // RESPUESTA
            // -------------------------------------------------

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(guardado);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                        "Error al guardar el destino: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // EDITAR DESTINO
    //
    // PUT /api/destinos/{id}
    // =====================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(
            @PathVariable Long id,
            @RequestBody Destino destino
    ) {

        try {

            // -------------------------------------------------
            // VALIDAR ID
            // -------------------------------------------------

            if (id == null || id <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "El ID del destino no es válido."
                        );
            }


            // -------------------------------------------------
            // VERIFICAR QUE EXISTA
            // -------------------------------------------------

            Destino existente =
                    destinoService.buscarPorId(id);

            if (existente == null) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(
                            "El destino que intentas editar no existe."
                        );
            }


            // -------------------------------------------------
            // VALIDAR DATOS
            // -------------------------------------------------

            ResponseEntity<?> error =
                    validar(destino);

            if (error != null) {
                return error;
            }


            // -------------------------------------------------
            // MODIFICAR
            // -------------------------------------------------

            Destino actualizado =
                    destinoService.modificar(
                        id,
                        destino
                    );


            // -------------------------------------------------
            // RESPUESTA
            // -------------------------------------------------

            return ResponseEntity.ok(actualizado);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                        "Error al actualizar el destino: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // ELIMINAR DESTINO
    //
    // DELETE /api/destinos/{id}
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(
            @PathVariable Long id
    ) {

        try {

            // -------------------------------------------------
            // VALIDAR ID
            // -------------------------------------------------

            if (id == null || id <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "El ID del destino no es válido."
                        );
            }


            // -------------------------------------------------
            // VERIFICAR QUE EXISTA
            // -------------------------------------------------

            Destino existente =
                    destinoService.buscarPorId(id);

            if (existente == null) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(
                            "El destino que intentas eliminar no existe."
                        );
            }


            // -------------------------------------------------
            // ELIMINAR
            // -------------------------------------------------

            destinoService.eliminar(id);


            // -------------------------------------------------
            // RESPUESTA
            // -------------------------------------------------

            return ResponseEntity.ok(
                "Destino eliminado correctamente."
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                        "Error al eliminar el destino: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // VALIDAR DESTINO
    // =====================================================

    private ResponseEntity<?> validar(
            Destino destino
    ) {

        // -------------------------------------------------
        // OBJETO
        // -------------------------------------------------

        if (destino == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los datos del destino son obligatorios."
                    );
        }


        // -------------------------------------------------
        // NOMBRE
        // -------------------------------------------------

        if (
            destino.getDestino() == null ||
            destino.getDestino().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "El nombre del destino es obligatorio."
                    );
        }


        // -------------------------------------------------
        // NORMALIZAR NOMBRE
        // -------------------------------------------------

        destino.setDestino(
            destino.getDestino().trim()
        );


        // -------------------------------------------------
        // KILÓMETROS
        // -------------------------------------------------

        if (destino.getKm() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los kilómetros son obligatorios."
                    );
        }


        if (
            destino.getKm()
                   .compareTo(BigDecimal.ZERO) < 0
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los kilómetros no pueden ser negativos."
                    );
        }


        // -------------------------------------------------
        // GALONES
        // -------------------------------------------------

        if (
            destino.getGalones() != null &&
            destino.getGalones()
                   .compareTo(BigDecimal.ZERO) < 0
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los galones no pueden ser negativos."
                    );
        }


        // -------------------------------------------------
        // PEAJES
        // -------------------------------------------------

        if (destino.getPeajes() == null) {

            destino.setPeajes(0);
        }


        if (destino.getPeajes() < 0) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los peajes no pueden ser negativos."
                    );
        }


        // -------------------------------------------------
        // TODO CORRECTO
        // -------------------------------------------------

        return null;
    }


    // =====================================================
    // OBTENER MENSAJE REAL DEL ERROR
    // =====================================================

    private String obtenerMensajeError(
            Exception e
    ) {

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