package com.proyecto.camiones.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.proyecto.camiones.model.viajes;
import com.proyecto.camiones.repository.ViajeRepository;

@Service
public class ViajeService {

    @Autowired
    private ViajeRepository viajeRepository;

    public viajes guardar(viajes viaje){

        viaje.setCreatedAt(LocalDateTime.now());

        return viajeRepository.save(viaje);

    }

    public List<viajes> listar(){

        return viajeRepository.findAll();

    }

    public void eliminar(Long id){

        viajeRepository.deleteById(id);

    }
    
    public viajes actualizar(Long id, viajes datos) {

        viajes viaje = viajeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        viaje.setNotas(datos.getNotas());

        return viajeRepository.save(viaje);
    }
    
    public void eliminarNota(Long id) {

        viajes viaje = viajeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        viaje.setNotas(null);

        viajeRepository.save(viaje);
    }

}