package com.proyecto.camiones.services;

import java.time.LocalDateTime;
import java.time.ZoneId;

public final class ZonaHoraria {

    public static final ZoneId HONDURAS = ZoneId.of("America/Tegucigalpa");

    private ZonaHoraria() {}

    /** Hora actual de Honduras, sin importar la zona del servidor. */
    public static LocalDateTime ahora() {
        return LocalDateTime.now(HONDURAS);
    }
}