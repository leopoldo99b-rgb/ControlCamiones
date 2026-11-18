package com.proyecto.camiones.exception;

/** Error de regla de negocio: se responde 400 con {"error": mensaje}. */
public class NegocioException extends RuntimeException {
    public NegocioException(String mensaje) { super(mensaje); }
}
