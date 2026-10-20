package com.proyecto.camiones.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Activa las tareas programadas (@Scheduled) del monitoreo automático.
 * Así no tienes que tocar tu clase principal.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
