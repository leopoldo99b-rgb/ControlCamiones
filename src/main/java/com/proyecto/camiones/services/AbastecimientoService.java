package com.proyecto.camiones.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.camiones.exception.ResourceNotFoundException;
import com.proyecto.camiones.model.Abastecimiento;
import com.proyecto.camiones.model.Combustible;
import com.proyecto.camiones.repository.AbastecimientoRepository;
import com.proyecto.camiones.repository.CombustibleRepository;

import dto.AbastecimientoRequest;

@Service
@Transactional
public class AbastecimientoService {

    private final AbastecimientoRepository abastecimientoRepository;
    private final CombustibleRepository combustibleRepository;

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    public AbastecimientoService(
            AbastecimientoRepository abastecimientoRepository,
            CombustibleRepository combustibleRepository
    ) {
        this.abastecimientoRepository = abastecimientoRepository;
        this.combustibleRepository = combustibleRepository;
    }

    // ============================================================
    // BUSCAR LISTA DE ABASTECIMIENTOS
    // ============================================================

    @Transactional(readOnly = true)
    public List<Abastecimiento> buscarLista(
            LocalDate desde,
            LocalDate hasta,
            String placa,
            Long combustibleId
    ) {

        // ========================================================
        // NORMALIZAR PLACA
        // ========================================================

        if (placa != null) {

            placa = placa.trim();

            if (placa.isEmpty()) {
                placa = null;
            }
        }

        // ========================================================
        // CONVERTIR FECHA DESDE
        // ========================================================

        LocalDateTime fechaDesde = null;

        if (desde != null) {
            fechaDesde = desde.atStartOfDay();
        }

        // ========================================================
        // CONVERTIR FECHA HASTA
        //
        // Se usa el día siguiente a las 00:00.
        //
        // Ejemplo:
        //
        // hasta = 2026-09-06
        //
        // fechaHasta = 2026-09-07 00:00:00
        //
        // Así se incluye todo el día 06.
        // ========================================================

        LocalDateTime fechaHasta = null;

        if (hasta != null) {

            fechaHasta = hasta
                    .plusDays(1)
                    .atStartOfDay();
        }

        // ========================================================
        // SPECIFICATION
        //
        // NO usamos Specification.where(null)
        // porque genera ambigüedad en algunas versiones.
        // ========================================================

        Specification<Abastecimiento> specification =
                (root, query, cb) -> cb.conjunction();

        // ========================================================
        // FILTRO FECHA DESDE
        // ========================================================

        if (fechaDesde != null) {

            LocalDateTime fechaDesdeFinal = fechaDesde;

            specification = specification.and(
                    (root, query, cb) ->
                            cb.greaterThanOrEqualTo(
                                    root.get("fecha"),
                                    fechaDesdeFinal
                            )
            );
        }

        // ========================================================
        // FILTRO FECHA HASTA
        // ========================================================

        if (fechaHasta != null) {

            LocalDateTime fechaHastaFinal = fechaHasta;

            specification = specification.and(
                    (root, query, cb) ->
                            cb.lessThan(
                                    root.get("fecha"),
                                    fechaHastaFinal
                            )
            );
        }

        // ========================================================
        // FILTRO PLACA
        // ========================================================

        if (placa != null) {

            String placaFinal = placa.toLowerCase();

            specification = specification.and(
                    (root, query, cb) ->
                            cb.equal(
                                    cb.lower(
                                            root.get("placa")
                                    ),
                                    placaFinal
                            )
            );
        }

        // ========================================================
        // FILTRO COMBUSTIBLE
        // ========================================================

        if (combustibleId != null) {

            Long combustibleIdFinal = combustibleId;

            specification = specification.and(
                    (root, query, cb) ->
                            cb.equal(
                                    root
                                            .get("combustible")
                                            .get("id"),
                                    combustibleIdFinal
                            )
            );
        }

        // ========================================================
        // BUSCAR
        // ========================================================

        return abastecimientoRepository.findAll(
                specification,
                Sort.by(
                        Sort.Direction.DESC,
                        "fecha"
                )
        );
    }

    // ============================================================
    // OBTENER POR ID
    // ============================================================

    @Transactional(readOnly = true)
    public Abastecimiento obtenerPorId(Long id) {

        return abastecimientoRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "No existe el abastecimiento con ID: "
                                        + id
                        )
                );
    }

    // ============================================================
    // CREAR
    // ============================================================

    public Abastecimiento crear(
            AbastecimientoRequest request
    ) {

        // ========================================================
        // BUSCAR COMBUSTIBLE
        // ========================================================

        Combustible combustible =
                combustibleRepository
                        .findById(
                                request.getCombustibleId()
                        )
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "No existe el combustible seleccionado"
                                )
                        );

        // ========================================================
        // VERIFICAR ACTIVO
        // ========================================================

        if (!Boolean.TRUE.equals(
                combustible.getActivo()
        )) {

            throw new IllegalArgumentException(
                    "El combustible seleccionado está inactivo"
            );
        }

        // ========================================================
        // VERIFICAR PRECIO
        // ========================================================

        if (combustible.getPrecioGalon() == null) {

            throw new IllegalArgumentException(
                    "El combustible seleccionado no tiene precio por galón."
            );
        }

        // ========================================================
        // CREAR ENTIDAD
        // ========================================================

        Abastecimiento abastecimiento =
                new Abastecimiento();

        // ========================================================
        // FECHA
        // ========================================================

        abastecimiento.setFecha(
                request.getFecha() != null
                        ? request.getFecha()
                        : LocalDateTime.now()
        );

        // ========================================================
        // DATOS GENERALES
        // ========================================================

        abastecimiento.setPlaca(
                request.getPlaca().trim()
        );

        abastecimiento.setMotorista(
                request.getMotorista().trim()
        );

        abastecimiento.setDestino(
                request.getDestino().trim()
        );

        // ========================================================
        // DATOS DE RUTA
        // ========================================================

        abastecimiento.setKmRuta(
                request.getKmRuta()
        );

        abastecimiento.setGalonesAutorizados(
                request.getGalonesAutorizados()
        );

        // ========================================================
        // COMBUSTIBLE
        // ========================================================

        abastecimiento.setCombustible(
                combustible
        );

        // ========================================================
        // PRECIO POR GALÓN
        // ========================================================

        abastecimiento.setPrecioGalon(
                combustible.getPrecioGalon()
        );

        // ========================================================
        // TOTAL
        // ========================================================

        BigDecimal total =
                request.getGalonesAutorizados()
                        .multiply(
                                combustible.getPrecioGalon()
                        );

        abastecimiento.setTotal(total);

        // ========================================================
        // GUARDAR
        // ========================================================

        return abastecimientoRepository.save(
                abastecimiento
        );
    }

    // ============================================================
    // ACTUALIZAR
    // ============================================================

    public Abastecimiento actualizar(
            Long id,
            AbastecimientoRequest request
    ) {

        // ========================================================
        // BUSCAR ABASTECIMIENTO
        // ========================================================

        Abastecimiento abastecimiento =
                obtenerPorId(id);

        // ========================================================
        // BUSCAR COMBUSTIBLE
        // ========================================================

        Combustible combustible =
                combustibleRepository
                        .findById(
                                request.getCombustibleId()
                        )
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "No existe el combustible seleccionado"
                                )
                        );

        // ========================================================
        // VERIFICAR ACTIVO
        // ========================================================

        if (!Boolean.TRUE.equals(
                combustible.getActivo()
        )) {

            throw new IllegalArgumentException(
                    "El combustible seleccionado está inactivo"
            );
        }

        // ========================================================
        // VERIFICAR PRECIO
        // ========================================================

        if (combustible.getPrecioGalon() == null) {

            throw new IllegalArgumentException(
                    "El combustible seleccionado no tiene precio por galón."
            );
        }

        // ========================================================
        // FECHA
        // ========================================================

        if (request.getFecha() != null) {

            abastecimiento.setFecha(
                    request.getFecha()
            );
        }

        // ========================================================
        // DATOS GENERALES
        // ========================================================

        abastecimiento.setPlaca(
                request.getPlaca().trim()
        );

        abastecimiento.setMotorista(
                request.getMotorista().trim()
        );

        abastecimiento.setDestino(
                request.getDestino().trim()
        );

        // ========================================================
        // DATOS DE RUTA
        // ========================================================

        abastecimiento.setKmRuta(
                request.getKmRuta()
        );

        abastecimiento.setGalonesAutorizados(
                request.getGalonesAutorizados()
        );

        // ========================================================
        // COMBUSTIBLE
        // ========================================================

        abastecimiento.setCombustible(
                combustible
        );

        // ========================================================
        // PRECIO POR GALÓN
        // ========================================================

        abastecimiento.setPrecioGalon(
                combustible.getPrecioGalon()
        );

        // ========================================================
        // RECALCULAR TOTAL
        // ========================================================

        BigDecimal total =
                request.getGalonesAutorizados()
                        .multiply(
                                combustible.getPrecioGalon()
                        );

        abastecimiento.setTotal(total);

        // ========================================================
        // GUARDAR
        // ========================================================

        return abastecimientoRepository.save(
                abastecimiento
        );
    }

    // ============================================================
    // ELIMINAR
    // ============================================================

    public void eliminar(Long id) {

        Abastecimiento abastecimiento =
                obtenerPorId(id);

        abastecimientoRepository.delete(
                abastecimiento
        );
    }
}