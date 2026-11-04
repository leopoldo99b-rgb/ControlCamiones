package com.proyecto.camiones.exception;

/** Error de regla de negocio (se responde 400 con el mensaje para mostrarlo en la vista). */
public class NegocioException extends RuntimeException {
    public NegocioException(String mensaje) {
        super(mensaje);
    }
}
