package com.proyecto.camiones.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.proyecto.camiones.model.TipoMantenimiento;
import com.proyecto.camiones.repository.TipoMantenimientoRepository;


@Service
public class TipoMantenimientoService {


    @Autowired
    private TipoMantenimientoRepository repository;



    public List<TipoMantenimiento> listarTodos(){

        return repository.findAll();

    }


}