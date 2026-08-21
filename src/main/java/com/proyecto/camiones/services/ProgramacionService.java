package com.proyecto.camiones.services;

import org.springframework.stereotype.Service;

import com.proyecto.camiones.model.Programacion;
import com.proyecto.camiones.repository.ProgramacionRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ProgramacionService {

    private final ProgramacionRepository programacionRepository;


    public ProgramacionService(ProgramacionRepository programacionRepository) {
        this.programacionRepository = programacionRepository;
    }


    // =========================================================
    // LISTAR TODAS LAS PROGRAMACIONES
    // =========================================================

    public List<Programacion> listarTodas() {
        return programacionRepository.findAll();
    }


    // =========================================================
    // BUSCAR POR ID
    // =========================================================

    public Optional<Programacion> buscarPorId(Integer id) {
        return programacionRepository.findById(id);
    }


    // =========================================================
    // GUARDAR
    // =========================================================

    public Programacion guardar(Programacion programacion) {
        return programacionRepository.save(programacion);
    }


    // =========================================================
    // ACTUALIZAR
    // =========================================================

    public Programacion actualizar(Programacion programacion) {
        return programacionRepository.save(programacion);
    }


    // =========================================================
    // ELIMINAR
    // =========================================================

    public void eliminar(Integer id) {
        programacionRepository.deleteById(id);
    }


    // =========================================================
    // EXISTE
    // =========================================================

    public boolean existe(Integer id) {
        return programacionRepository.existsById(id);
    }


    // =========================================================
    // CONTAR REGISTROS
    // =========================================================

    public long contar() {
        return programacionRepository.count();
    }
}