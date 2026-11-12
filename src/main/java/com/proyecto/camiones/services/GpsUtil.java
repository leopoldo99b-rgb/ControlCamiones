package com.proyecto.camiones.services;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

import tools.jackson.databind.JsonNode;

public final class GpsUtil {

    private GpsUtil() {}

    public static String texto(JsonNode nodo, String... claves) {
        if (nodo == null) return null;

        for (String clave : claves) {
            if (nodo.hasNonNull(clave)) {
                String valor = nodo.get(clave).asText().trim();
                if (!valor.isEmpty() && !"null".equalsIgnoreCase(valor)) {
                    return valor;
                }
            }
        }
        return null;
    }

    public static Double numero(JsonNode nodo, String... claves) {
        String valor = texto(nodo, claves);
        if (valor == null) return null;

        try {
            double n = Double.parseDouble(valor);
            return Double.isFinite(n) ? n : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Lee la hora que reporta el GPS y la devuelve como instante exacto.
     * Acepta "2026-11-11 17:01:02" (sin zona: se interpreta en zonaSinOffset),
     * formato ISO con zona ("...Z", "...-06:00") y epoch en segundos o milisegundos.
     * Devuelve null si el campo no existe o no se puede leer.
     */
    public static Instant instante(JsonNode nodo, ZoneId zonaSinOffset, String... claves) {
        String v = texto(nodo, claves);
        if (v == null) return null;
        v = v.trim();

        try {
            if (v.matches("\\d{9,13}")) {
                long n = Long.parseLong(v);
                return v.length() > 10 ? Instant.ofEpochMilli(n) : Instant.ofEpochSecond(n);
            }

            String iso = v.replace(' ', 'T');

            if (iso.matches(".*(Z|[+-]\\d{2}:\\d{2})$")) {
                return OffsetDateTime.parse(iso).toInstant();
            }

            return LocalDateTime.parse(iso).atZone(zonaSinOffset).toInstant();
        } catch (Exception e) {
            return null;
        }
    }

    public static boolean coordenadasValidas(Double lat, Double lng) {
        return lat != null && lng != null
                && lat >= -90 && lat <= 90
                && lng >= -180 && lng <= 180
                && !(lat == 0 && lng == 0);
    }

    /** Distancia en metros (fórmula de Haversine). */
    public static double distanciaMetros(
            double lat1, double lon1, double lat2, double lon2) {
        final double radioTierra = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return 2 * radioTierra * Math.asin(Math.sqrt(a));
    }
}