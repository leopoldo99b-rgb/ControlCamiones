package com.proyecto.camiones.services;

import com.proyecto.camiones.model.Mantenimiento;
import com.proyecto.camiones.repository.MantenimientoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MantenimientoService {

    private final MantenimientoRepository mantenimientoRepository;

    public MantenimientoService(MantenimientoRepository mantenimientoRepository) {
        this.mantenimientoRepository = mantenimientoRepository;
    }

    // =========================
    // LISTAR TODOS
    // =========================

    public List<Mantenimiento> listarTodos() {
        return mantenimientoRepository.findAll();
    }

    // =========================
    // BUSCAR POR ID
    // =========================

    public Optional<Mantenimiento> buscarPorId(Integer id) {
        return mantenimientoRepository.findById(id);
    }

    // =========================
    // GUARDAR
    // =========================

    public Mantenimiento guardar(Mantenimiento mantenimiento) {

        LocalDateTime ahora = LocalDateTime.now();

        // Solo se asigna la fecha de creación cuando
        // el mantenimiento es nuevo.
        if (mantenimiento.getIdMantenimiento() == null) {
            mantenimiento.setFechaCreacion(ahora);
        }

        // Se actualiza cada vez que se guarda.
        mantenimiento.setFechaModificacion(ahora);

        // El ID NO se asigna aquí.
        // La base de datos lo genera automáticamente.
        return mantenimientoRepository.save(mantenimiento);
    }

    // =========================
    // ELIMINAR
    // =========================

    public void eliminar(Integer id) {
        mantenimientoRepository.deleteById(id);
    }
}