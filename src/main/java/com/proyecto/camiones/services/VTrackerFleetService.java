package com.proyecto.camiones.services;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import tools.jackson.databind.JsonNode;

@Service
public class VTrackerFleetService {

    @Value("${vtracker.base-url}")
    private String baseUrl;

    @Value("${vtracker.fleet-id}")
    private String fleetId;

    /**
     * Milisegundos que se reutiliza la última respuesta de la flota.
     * Evita consultar VTracker dos veces cuando el navegador y el
     * monitoreo automático piden los datos casi al mismo tiempo.
     */
    @Value("${vtracker.fleet-cache-ms:20000}")
    private long fleetCacheMs;

    private final RestTemplate restTemplate;
    private final VTrackerAuthService authService;

    private JsonNode ultimaRespuesta;
    private Instant ultimaConsulta = Instant.EPOCH;

    public VTrackerFleetService(
            RestTemplate restTemplate,
            VTrackerAuthService authService) {
        this.restTemplate = restTemplate;
        this.authService = authService;
    }

    public synchronized JsonNode consultarVehiculos() {
        boolean vigente = ultimaRespuesta != null
                && Duration.between(ultimaConsulta, Instant.now()).toMillis()
                        < fleetCacheMs;

        if (vigente) {
            return ultimaRespuesta;
        }

        JsonNode respuesta;

        try {
            respuesta = pedirFlota(authService.obtenerToken());
        } catch (HttpClientErrorException.Unauthorized
                 | HttpClientErrorException.Forbidden e) {
            // El token venció: se descarta y se reintenta una sola vez.
            authService.invalidarToken();
            respuesta = pedirFlota(authService.obtenerToken());
        }

        ultimaRespuesta = respuesta;
        ultimaConsulta = Instant.now();

        return respuesta;
    }

    private JsonNode pedirFlota(String token) {
        String url = UriComponentsBuilder
                .fromUriString(baseUrl + "/fleet_data")
                .queryParam("f", fleetId)
                .queryParam("t", 1)
                .queryParam("v", "all")
                .build()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("VAESTOKEN", token);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        JsonNode cuerpo = restTemplate.exchange(
                url,
                HttpMethod.GET,
                request,
                JsonNode.class
        ).getBody();

        if (cuerpo == null) {
            throw new IllegalStateException(
                    "VTracker devolvió una respuesta vacía.");
        }

        return cuerpo;
    }
}
