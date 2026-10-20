package com.proyecto.camiones.services;

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
