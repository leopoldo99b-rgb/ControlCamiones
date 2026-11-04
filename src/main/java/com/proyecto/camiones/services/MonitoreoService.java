package com.proyecto.camiones.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.camiones.model.MonitoreoViaje;
import com.proyecto.camiones.model.MonitoreoParada;
import com.proyecto.camiones.repository.MonitoreoViajeRepository;
import com.proyecto.camiones.repository.MonitoreoParadaRepository;

/**
 * Servicio original de viajes y paradas (operaciones manuales).
 * El flujo automático usa MonitoreoViajeService y MonitoreoAutomaticoService.
 */
@Service
@Transactional
public class MonitoreoService {

    private final MonitoreoViajeRepository viajeRepository;
    private final MonitoreoParadaRepository paradaRepository;

    public MonitoreoService(
            MonitoreoViajeRepository viajeRepository,
            MonitoreoParadaRepository paradaRepository) {
        this.viajeRepository = viajeRepository;
        this.paradaRepository = paradaRepository;
    }

    @Transactional(readOnly = true)
    public List<MonitoreoViaje> listarViajes() {
        return viajeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public MonitoreoViaje obtenerViaje(Integer id) {
        return viajeRepository.findById(id)
                .orElseThrow(() ->
                    new IllegalArgumentException(
                        "No se encontró el viaje " + id));
    }

    public MonitoreoViaje crearViaje(MonitoreoViaje viaje) {
        if (viaje.getConductorUnidad() == null
                || viaje.getConductorUnidad().isBlank()) {
            throw new IllegalArgumentException(
                    "Debes seleccionar un conductor y una unidad.");
        }

        viaje.setEstado("En curso");

        if (viaje.getFechaInicio() == null) {
            viaje.setFechaInicio(ZonaHoraria.ahora());
        }

        viaje.setFechaFin(null);

        return viajeRepository.save(viaje);
    }

    public MonitoreoViaje actualizarEstado(
            Integer id, String nuevoEstado) {

        List<String> estadosValidos = List.of(
                "En curso", "Detenido", "En espera", "Finalizado");

        if (nuevoEstado == null
                || !estadosValidos.contains(nuevoEstado)) {
            throw new IllegalArgumentException(
                    "El estado seleccionado no es válido.");
        }

        MonitoreoViaje viaje = obtenerViaje(id);
        viaje.setEstado(nuevoEstado);

        if ("Finalizado".equals(nuevoEstado)) {
            if (viaje.getFechaFin() == null) {
                viaje.setFechaFin(ZonaHoraria.ahora());
            }
        } else {
            viaje.setFechaFin(null);
        }

        return viajeRepository.save(viaje);
    }

    @Transactional(readOnly = true)
    public List<MonitoreoParada> listarParadas(Integer idViaje) {
        return paradaRepository
                .findByViaje_IdViajeOrderByNumeroParadaAsc(idViaje);
    }

    public MonitoreoParada actualizarMotivo(
            Integer idParada, String motivo) {

        if (motivo == null || motivo.isBlank()
                || motivo.trim().length() > 300) {
            throw new IllegalArgumentException(
                    "El motivo es obligatorio y admite hasta 300 caracteres.");
        }

        MonitoreoParada parada = paradaRepository.findById(idParada)
                .orElseThrow(() ->
                    new IllegalArgumentException(
                        "No se encontró la parada " + idParada));

        parada.setMotivo(motivo.trim());

        return paradaRepository.save(parada);
    }

    /**
     * Registro manual de una parada. El motivo ya NO es obligatorio:
     * se puede completar después con actualizarMotivo().
     */
    public MonitoreoParada registrarParada(
            Integer idViaje, MonitoreoParada parada) {

        MonitoreoViaje viaje = obtenerViaje(idViaje);

        if (parada.getNumeroParada() == null
                || parada.getFechaHoraInicio() == null) {
            throw new IllegalArgumentException(
                    "Número y fecha de inicio son obligatorios.");
        }

        if (parada.getMotivo() != null
                && parada.getMotivo().trim().length() > 300) {
            throw new IllegalArgumentException(
                    "El motivo admite hasta 300 caracteres.");
        }

        parada.setViaje(viaje);

        return paradaRepository.save(parada);
    }
}