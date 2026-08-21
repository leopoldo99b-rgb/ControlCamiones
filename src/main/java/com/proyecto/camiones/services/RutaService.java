package com.proyecto.camiones.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.proyecto.camiones.model.Ruta;
import com.proyecto.camiones.repository.RutaRepository;

@Service
public class RutaService {

    @Autowired
    private RutaRepository rutaRepository;


    // =====================================================
    // LISTAR TODAS
    // =====================================================

    public List<Ruta> listarTodos() {

        return rutaRepository.findAll();
    }


    // =====================================================
    // LISTAR RUTAS ACTIVAS / ORDENADAS
    // =====================================================

    public List<Ruta> listarRutas() {

        return rutaRepository.listarRutas();
    }


    // =====================================================
    // BUSCAR POR ID
    // =====================================================

    public Ruta buscarPorId(Long id) {

        return rutaRepository
                .findById(id)
                .orElse(null);
    }


    // =====================================================
    // GUARDAR
    // =====================================================

    public Ruta guardar(Ruta ruta) {

        return rutaRepository.save(ruta);
    }


    // =====================================================
    // MODIFICAR
    // =====================================================

    public Ruta modificar(Long id, Ruta datos) {

        Ruta existente =
                rutaRepository
                        .findById(id)
                        .orElse(null);

        if (existente == null) {
            return null;
        }

        existente.setDestino(datos.getDestino());
        existente.setOdt(datos.getOdt());
        existente.setEstado(datos.getEstado());

        return rutaRepository.save(existente);
    }


    // =====================================================
    // ELIMINAR
    // =====================================================

    public void eliminar(Long id) {

        rutaRepository.deleteById(id);
    }
}