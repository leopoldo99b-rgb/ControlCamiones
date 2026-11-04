package com.proyecto.camiones.services;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.camiones.model.Pieza;
import com.proyecto.camiones.repository.PiezaRepository;

import dto.InventarioResumen;

@Service
public class InventarioResumenService {

    private final PiezaRepository piezaRepository;

    public InventarioResumenService(PiezaRepository piezaRepository) {
        this.piezaRepository = piezaRepository;
    }

    @Transactional(readOnly = true)
    public InventarioResumen resumen() {
        int disponibles = 0, bajos = 0, agotados = 0;
        long unidades = 0;
        BigDecimal valor = BigDecimal.ZERO;

        for (Pieza p : piezaRepository.listarActivas()) {
            int stock = p.getStockActual();

            if (stock <= 0) {
                agotados++;
            } else if (stock <= p.getStockMinimo()) {
                bajos++;
            } else {
                disponibles++;
            }

            unidades += stock;
            valor = valor.add(p.getCostoPromedio().multiply(BigDecimal.valueOf(stock)));
        }

        return new InventarioResumen(disponibles, bajos, agotados, unidades,
                valor.setScale(2, RoundingMode.HALF_UP));
    }
}