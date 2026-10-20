package com.proyecto.camiones.services;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import tools.jackson.databind.JsonNode;

@Service
public class VTrackerAuthService {

    @Value("${vtracker.base-url}")
    private String baseUrl;

    @Value("${vtracker.username}")
    private String username;

    @Value("${vtracker.password}")
    private String password;

    @Value("${vtracker.api-key}")
    private String apiKey;

    /** Minutos que se reutiliza el token antes de pedir uno nuevo. */
    @Value("${vtracker.token-cache-minutes:10}")
    private long tokenCacheMinutos;

    private final RestTemplate restTemplate;

    private String tokenEnCache;
    private Instant tokenExpira = Instant.EPOCH;

    public VTrackerAuthService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /** Devuelve el token guardado o inicia sesión si no hay uno vigente. */
    public synchronized String obtenerToken() {
        if (tokenEnCache != null && Instant.now().isBefore(tokenExpira)) {
            return tokenEnCache;
        }

        tokenEnCache = autenticar();
        tokenExpira = Instant.now().plus(Duration.ofMinutes(tokenCacheMinutos));

        return tokenEnCache;
    }

    /** Descarta el token (por ejemplo, si VTracker responde 401/403). */
    public synchronized void invalidarToken() {
        tokenEnCache = null;
        tokenExpira = Instant.EPOCH;
    }

    /** Inicia sesión en VTracker (siempre hace la petición). */
    public String autenticar() {
        String url = baseUrl + "/login";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(
            MediaType.APPLICATION_FORM_URLENCODED
        );

        MultiValueMap<String, String> datos =
            new LinkedMultiValueMap<>();

        datos.add("u", username);
        datos.add("p", password);
        datos.add("a", apiKey);

        HttpEntity<MultiValueMap<String, String>> request =
            new HttpEntity<>(datos, headers);

        JsonNode respuesta = restTemplate.postForObject(
            url, request, JsonNode.class
        );

        if (respuesta == null ||
            !respuesta.hasNonNull("vaesToken")) {
            throw new IllegalStateException(
                "La respuesta de VTracker no contiene vaesToken."
            );
        }

        String token = respuesta.get("vaesToken").asText();

        if (token.isBlank()) {
            throw new IllegalStateException(
                "VTracker devolvió un token vacío."
            );
        }

        return token;
    }
}
