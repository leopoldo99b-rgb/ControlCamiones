package com.proyecto.camiones.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.camiones.services.MovimientoService;

import dto.MovimientoRequest;
import dto.MovimientoResponse;


@RestController
@RequestMapping("/api/movimientos")
public class MovimientoApiController {

    private final MovimientoService movimientoService;

    public MovimientoApiController(MovimientoService movimientoService) {
        this.movimientoService = movimientoService;
    }

    @GetMapping
    public List<MovimientoResponse> listar() {
        return movimientoService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovimientoResponse registrar(@RequestBody MovimientoRequest request) {
        return movimientoService.registrar(request);
    }
}