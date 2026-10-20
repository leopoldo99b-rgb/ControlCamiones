package com.proyecto.camiones.controller;

import com.proyecto.camiones.services.VTrackerFleetService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.databind.JsonNode;

@RestController
public class VTrackerController {

    private final VTrackerFleetService fleetService;

    public VTrackerController(VTrackerFleetService fleetService) {
        this.fleetService = fleetService;
    }

    @GetMapping("/gps/vehiculos")
    public JsonNode consultarVehiculos() {
        return fleetService.consultarVehiculos();
    }
}
