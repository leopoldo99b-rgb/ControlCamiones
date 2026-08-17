package com.proyecto.camiones.controller;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.ui.Model;

import com.proyecto.camiones.model.AsignacionCamion;
import com.proyecto.camiones.model.Camion;
import com.proyecto.camiones.model.Conductor;
import com.proyecto.camiones.model.viajes;
import com.proyecto.camiones.repository.AsignacionRepository;
import com.proyecto.camiones.repository.ConductorRepository;
import com.proyecto.camiones.services.CamionService;
import com.proyecto.camiones.services.ViajeService;

@Component
public class DashboardController {

    @Autowired
    private CamionService camionService;

    @Autowired
    private ConductorRepository conductorRepository;

    @Autowired
    private AsignacionRepository asignacionRepository;

    @Autowired
    private ViajeService viajeService;


    // =====================================================
    // CARGAR DATOS DEL DASHBOARD
    // =====================================================

    public void cargarDatosDashboard(Model model) {


        // =================================================
        // VIAJES
        // =================================================

        long totalViajes = 0;

        List<?> listaViajes = List.of();

        try {

            listaViajes = viajeService.listar();

            if (listaViajes != null) {
                totalViajes = listaViajes.size();
            }

        } catch (Exception e) {

            System.err.println(
                "Error cargando viajes: "
                + e.getMessage()
            );
        }


        // =================================================
        // DATOS PARA LA GRÁFICA
        // ÚLTIMOS 7 DÍAS
        // =================================================

        Map<String, Long> viajesPorDia =
                new LinkedHashMap<>();

        DateTimeFormatter formatoFecha =
                DateTimeFormatter.ofPattern("dd/MM");


        for (int i = 6; i >= 0; i--) {

            LocalDate fecha =
                    LocalDate.now().minusDays(i);

            long cantidad = 0;


            for (Object obj : listaViajes) {

                if (obj instanceof viajes viaje) {

                    if (viaje.getFecha() != null &&
                        viaje.getFecha().equals(fecha)) {

                        cantidad++;
                    }
                }
            }


            viajesPorDia.put(
                fecha.format(formatoFecha),
                cantidad
            );
        }


        // =================================================
        // CAMIONES
        // =================================================

        List<Camion> camiones;

        try {

            camiones = camionService.listarTodos();

            if (camiones == null) {
                camiones = List.of();
            }

        } catch (Exception e) {

            System.err.println(
                "Error cargando camiones: "
                + e.getMessage()
            );

            camiones = List.of();
        }


        long totalCamiones =
                camiones.size();


        long camionesDisponibles =
                camiones.stream()
                    .filter(c ->
                        c != null &&
                        c.getEstado() != null &&
                        "DISPONIBLE".equalsIgnoreCase(
                            c.getEstado().trim()
                        )
                    )
                    .count();


        long camionesActivos =
                camiones.stream()
                    .filter(c ->
                        c != null &&
                        c.getEstado() != null &&
                        (
                            "ACTIVO".equalsIgnoreCase(
                                c.getEstado().trim()
                            )
                            ||
                            "DISPONIBLE".equalsIgnoreCase(
                                c.getEstado().trim()
                            )
                        )
                    )
                    .count();


        long camionesEnOperacion =
                Math.max(
                    0,
                    camionesActivos
                    - camionesDisponibles
                );


        long camionesInactivos =
                Math.max(
                    0,
                    totalCamiones
                    - camionesActivos
                );


        long porcentajeDisponibilidad = 0;

        if (totalCamiones > 0) {

            porcentajeDisponibilidad =
                Math.round(
                    (
                        (double) camionesDisponibles
                        / totalCamiones
                    ) * 100
                );
        }


        // =================================================
        // CONDUCTORES
        // =================================================

        long totalConductores =
                conductorRepository.count();


        List<Conductor> conductoresActivos;

        try {

            conductoresActivos =
                conductorRepository.findByEstado(
                    "ACTIVO"
                );

            if (conductoresActivos == null) {
                conductoresActivos = List.of();
            }

        } catch (Exception e) {

            System.err.println(
                "Error cargando conductores: "
                + e.getMessage()
            );

            conductoresActivos = List.of();
        }


        long totalConductoresActivos =
                conductoresActivos.size();


        long totalConductoresInactivos =
                Math.max(
                    0,
                    totalConductores
                    - totalConductoresActivos
                );


        long porcentajeConductoresActivos = 0;

        if (totalConductores > 0) {

            porcentajeConductoresActivos =
                Math.round(
                    (
                        (double)
                        totalConductoresActivos
                        / totalConductores
                    ) * 100
                );
        }


        // =================================================
        // ASIGNACIONES
        // =================================================

        List<AsignacionCamion> asignacionesActivas;

        try {

            asignacionesActivas =
                asignacionRepository.findByEstado(
                    "ACTIVA"
                );

            if (asignacionesActivas == null) {
                asignacionesActivas = List.of();
            }

        } catch (Exception e) {

            System.err.println(
                "Error cargando asignaciones: "
                + e.getMessage()
            );

            asignacionesActivas = List.of();
        }


        long totalAsignacionesActivas =
                asignacionesActivas.size();


        // =================================================
        // DATOS PARA THYMELEAF
        // =================================================

        model.addAttribute(
            "totalViajes",
            totalViajes
        );

        model.addAttribute(
            "viajesLabels",
            viajesPorDia.keySet()
        );

        model.addAttribute(
            "viajesData",
            viajesPorDia.values()
        );


        model.addAttribute(
            "totalCamiones",
            totalCamiones
        );

        model.addAttribute(
            "camionesActivos",
            camionesActivos
        );

        model.addAttribute(
            "camionesDisponibles",
            camionesDisponibles
        );

        model.addAttribute(
            "camionesEnOperacion",
            camionesEnOperacion
        );

        model.addAttribute(
            "camionesInactivos",
            camionesInactivos
        );

        model.addAttribute(
            "porcentajeDisponibilidad",
            porcentajeDisponibilidad
        );


        model.addAttribute(
            "totalConductores",
            totalConductores
        );

        model.addAttribute(
            "totalConductoresActivos",
            totalConductoresActivos
        );

        model.addAttribute(
            "totalConductoresInactivos",
            totalConductoresInactivos
        );

        model.addAttribute(
            "porcentajeConductoresActivos",
            porcentajeConductoresActivos
        );


        model.addAttribute(
            "totalAsignacionesActivas",
            totalAsignacionesActivas
        );
    }
}