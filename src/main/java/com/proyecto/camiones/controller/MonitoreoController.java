package com.proyecto.camiones.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MonitoreoController {

    @GetMapping("/monitoreo")
    public String mostrarMonitoreo() {
        return "monitoreo-gps";
    }
}
