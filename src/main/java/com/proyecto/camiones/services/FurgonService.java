package com.proyecto.camiones.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.proyecto.camiones.model.Furgon;
import com.proyecto.camiones.repository.FurgonRepository;

@Service
public class FurgonService {

    @Autowired
    private FurgonRepository furgonRepository;

    public List<Furgon> listarTodos() {
        return furgonRepository.findAllByOrderByFurgonAsc();
    }

    public Furgon buscarPorId(Long id) {
        return furgonRepository.findById(id).orElse(null);
    }

    public Furgon guardar(Furgon furgon) {
        return furgonRepository.save(furgon);
    }

    public Furgon buscarPorFurgon(String furgon) {
        return furgonRepository
                .findByFurgon(furgon)
                .orElse(null);
    }
}