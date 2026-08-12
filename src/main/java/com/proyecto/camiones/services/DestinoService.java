package com.proyecto.camiones.services;

import com.proyecto.camiones.model.Destino;
import com.proyecto.camiones.repository.DestinoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DestinoService {

    @Autowired
    private DestinoRepository destinoRepository;


    // =====================================================
    // OBTENER TODOS LOS DESTINOS
    // =====================================================

    public List<Destino> listarTodos() {

        return destinoRepository.findAll();

    }


    // =====================================================
    // BUSCAR POR ID
    // =====================================================

    public Destino buscarPorId(Long id) {

        return destinoRepository.findById(id)
                .orElse(null);

    }


    // =====================================================
    // GUARDAR
    // =====================================================

    public Destino guardar(Destino destino) {

        return destinoRepository.save(destino);

    }


    // =====================================================
    // ELIMINAR
    // =====================================================

    public void eliminar(Long id) {

        destinoRepository.deleteById(id);

    }
}