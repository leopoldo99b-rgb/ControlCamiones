package com.proyecto.camiones.controller;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validarCampos(
            MethodArgumentNotValidException ex
    ) {
        Map<String, String> errores = new LinkedHashMap<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errores.putIfAbsent(
                    error.getField(),
                    error.getDefaultMessage()
            );
        }

        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("mensaje", "Hay campos inválidos");
        cuerpo.put("errores", errores);

        return ResponseEntity.badRequest().body(cuerpo);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> jsonInvalido(
            HttpMessageNotReadableException ex
    ) {
        return ResponseEntity.badRequest().body(Map.of(
                "mensaje",
                "El JSON es inválido o tiene un valor con formato incorrecto "
                        + "(por ejemplo, el tipo debe ser ORIGEN o DESTINO)"
        ));
    }

    /** Errores de validación de negocio (por ejemplo PuntoPlantaRequest.validar()). */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> argumentoInvalido(
            IllegalArgumentException ex
    ) {
        return ResponseEntity.badRequest().body(Map.of(
                "mensaje",
                ex.getMessage() != null
                        ? ex.getMessage()
                        : "La solicitud contiene datos inválidos"
        ));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> errorHttp(
            ResponseStatusException ex
    ) {
        HttpStatus status = HttpStatus.valueOf(
                ex.getStatusCode().value()
        );

        return ResponseEntity.status(status).body(Map.of(
                "mensaje",
                ex.getReason() != null
                        ? ex.getReason()
                        : "La solicitud no pudo completarse"
        ));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> errorBaseDatos(
            DataIntegrityViolationException ex
    ) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "mensaje",
                "La base de datos rechazó los datos enviados"
        ));
    }

    /** Falló la comunicación con VTracker. */
    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<Map<String, Object>> errorGps(
            RestClientException ex
    ) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "mensaje",
                "No se pudo comunicar con el servicio GPS (VTracker)"
        ));
    }

    /** VTracker respondió algo inesperado (sin token, respuesta vacía, etc.). */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> estadoInvalido(
            IllegalStateException ex
    ) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "mensaje",
                ex.getMessage() != null
                        ? ex.getMessage()
                        : "El servicio GPS devolvió una respuesta inválida"
        ));
    }
}
