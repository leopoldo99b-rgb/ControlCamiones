package com.proyecto.camiones.services;

import com.proyecto.camiones.model.Unidad;
import com.proyecto.camiones.repository.UnidadRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UnidadService {

    private final UnidadRepository unidadRepository;

    public UnidadService(UnidadRepository unidadRepository) {
        this.unidadRepository = unidadRepository;
    }

    public List<Unidad> listarTodas() {
        return unidadRepository.findAll();
    }

    public List<Unidad> listarActivas() {
        return unidadRepository.findAll()
                .stream()
                .filter(unidad -> Boolean.TRUE.equals(unidad.getActivo()))
                .toList();
    }

    public Optional<Unidad> buscarPorId(Integer id) {
        return unidadRepository.findById(id);
    }

    public Unidad guardar(Unidad unidad) {
        return unidadRepository.save(unidad);
    }

    public void eliminar(Integer id) {
        unidadRepository.deleteById(id);
    }
}