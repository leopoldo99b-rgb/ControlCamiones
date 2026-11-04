package com.proyecto.camiones.model;

import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TipoMovimiento {
    ENTRADA, SALIDA;

    /** Permite recibir "entrada", "Entrada" o "ENTRADA" desde la vista. */
    @JsonCreator
    public static TipoMovimiento desde(String valor) {
        if (valor == null) {
            return null;
        }
        return TipoMovimiento.valueOf(valor.trim().toUpperCase(Locale.ROOT));
    }
}