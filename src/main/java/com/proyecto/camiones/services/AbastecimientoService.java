package com.proyecto.camiones.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

        // NORMALIZAR PLACA

        if (placa != null) {

            placa = placa.trim();

            if (placa.isEmpty()) {
                placa = null;
            }
        }

        // CONVERTIR FECHAS

        LocalDateTime fechaDesde = null;

        if (desde != null) {
            fechaDesde = desde.atStartOfDay();
        }

        LocalDateTime fechaHasta = null;

        if (hasta != null) {
            fechaHasta = hasta
                    .plusDays(1)
                    .atStartOfDay();
        }

        // SPECIFICATION

        Specification<Abastecimiento> specification =
                (root, query, cb) -> cb.conjunction();

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

        if (placa != null) {

            String placaFinal =
                    placa.toLowerCase();

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

        if (combustibleId != null) {

            Long combustibleIdFinal =
                    combustibleId;

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

        // BUSCAR

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

        if (id == null || id <= 0) {

            throw new IllegalArgumentException(
                    "El ID del abastecimiento no es válido."
            );
        }

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

        if (request == null) {

            throw new IllegalArgumentException(
                    "Los datos del abastecimiento son obligatorios."
            );
        }

        // VALIDAR GASOLINERA

        String gasolinera =
                request.getGasolinera();

        if (
                gasolinera == null ||
                gasolinera.trim().isEmpty()
        ) {

            throw new IllegalArgumentException(
                    "Debe seleccionar una gasolinera."
            );
        }

        gasolinera = gasolinera.trim();

        validarGasolinera(gasolinera);

        // BUSCAR COMBUSTIBLE

        if (request.getCombustibleId() == null) {

            throw new IllegalArgumentException(
                    "El combustible es obligatorio."
            );
        }

        Combustible combustible =
                combustibleRepository
                        .findById(
                                request.getCombustibleId()
                        )
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "No existe el combustible seleccionado."
                                )
                        );

        if (!Boolean.TRUE.equals(
                combustible.getActivo()
        )) {

            throw new IllegalArgumentException(
                    "El combustible seleccionado está inactivo."
            );
        }

        if (combustible.getPrecioGalon() == null) {

            throw new IllegalArgumentException(
                    "El combustible seleccionado no tiene precio por galón."
            );
        }

        // VALIDAR GALONES

        if (
                request.getGalonesAutorizados() == null ||
                request.getGalonesAutorizados()
                        .compareTo(BigDecimal.ZERO) <= 0
        ) {

            throw new IllegalArgumentException(
                    "Los galones autorizados deben ser mayores que cero."
            );
        }

        // CREAR ENTIDAD

        Abastecimiento abastecimiento =
                new Abastecimiento();

        abastecimiento.setFecha(
                request.getFecha() != null
                        ? request.getFecha()
                        : LocalDateTime.now()
        );

        abastecimiento.setPlaca(
                request.getPlaca().trim()
        );

        abastecimiento.setMotorista(
                request.getMotorista().trim()
        );

        abastecimiento.setDestino(
                request.getDestino().trim()
        );

        abastecimiento.setKmRuta(
                request.getKmRuta()
        );

        abastecimiento.setGalonesAutorizados(
                request.getGalonesAutorizados()
        );

        abastecimiento.setGasolinera(
                gasolinera
        );

        abastecimiento.setCombustible(
                combustible
        );

        // PRECIO HISTORICO (el vigente al momento de registrar)

        abastecimiento.setPrecioGalon(
                combustible.getPrecioGalon()
        );

        // TOTAL: el escrito a mano si viene, si no galones x precio

        BigDecimal total = calcularTotal(
                request,
                abastecimiento.getPrecioGalon()
        );

        abastecimiento.setTotal(
                total
        );

        // GUARDAR

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

        if (request == null) {

            throw new IllegalArgumentException(
                    "Los datos del abastecimiento son obligatorios."
            );
        }

        // BUSCAR ABASTECIMIENTO

        Abastecimiento abastecimiento =
                obtenerPorId(id);

        // VALIDAR GASOLINERA

        String gasolinera =
                request.getGasolinera();

        if (
                gasolinera == null ||
                gasolinera.trim().isEmpty()
        ) {

            throw new IllegalArgumentException(
                    "Debe seleccionar una gasolinera."
            );
        }

        gasolinera = gasolinera.trim();

        validarGasolinera(gasolinera);

        // VALIDAR COMBUSTIBLE

        if (request.getCombustibleId() == null) {

            throw new IllegalArgumentException(
                    "El combustible es obligatorio."
            );
        }

        Combustible combustible =
                combustibleRepository
                        .findById(
                                request.getCombustibleId()
                        )
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "No existe el combustible seleccionado."
                                )
                        );

        if (!Boolean.TRUE.equals(
                combustible.getActivo()
        )) {

            throw new IllegalArgumentException(
                    "El combustible seleccionado está inactivo."
            );
        }

        if (combustible.getPrecioGalon() == null) {

            throw new IllegalArgumentException(
                    "El combustible seleccionado no tiene precio por galón."
            );
        }

        // VALIDAR GALONES

        if (
                request.getGalonesAutorizados() == null ||
                request.getGalonesAutorizados()
                        .compareTo(BigDecimal.ZERO) <= 0
        ) {

            throw new IllegalArgumentException(
                    "Los galones autorizados deben ser mayores que cero."
            );
        }

        // FECHA

        if (request.getFecha() != null) {

            abastecimiento.setFecha(
                    request.getFecha()
            );
        }

        // DATOS GENERALES

        abastecimiento.setPlaca(
                request.getPlaca().trim()
        );

        abastecimiento.setMotorista(
                request.getMotorista().trim()
        );

        abastecimiento.setDestino(
                request.getDestino().trim()
        );

        // DATOS DE RUTA

        abastecimiento.setKmRuta(
                request.getKmRuta()
        );

        abastecimiento.setGalonesAutorizados(
                request.getGalonesAutorizados()
        );

        // GASOLINERA

        abastecimiento.setGasolinera(
                gasolinera
        );

        // PRECIO HISTORICO
        // Se conserva el precio original del registro.
        // Solo se reemplaza si cambia el tipo de combustible.
        // (Esto debe ir ANTES de setCombustible.)

        boolean mismoCombustible =
                abastecimiento.getCombustible() != null &&
                abastecimiento.getCombustible().getId()
                        .equals(combustible.getId());

        if (
                !mismoCombustible ||
                abastecimiento.getPrecioGalon() == null
        ) {

            abastecimiento.setPrecioGalon(
                    combustible.getPrecioGalon()
            );
        }

        // COMBUSTIBLE

        abastecimiento.setCombustible(
                combustible
        );

        // TOTAL: el escrito a mano si viene, si no galones x precio

        BigDecimal total = calcularTotal(
                request,
                abastecimiento.getPrecioGalon()
        );

        abastecimiento.setTotal(
                total
        );

        // GUARDAR

        return abastecimientoRepository.save(
                abastecimiento
        );
    }

    // ============================================================
    // ELIMINAR
    // ============================================================

    public void eliminar(Long id) {

        if (id == null || id <= 0) {

            throw new IllegalArgumentException(
                    "El ID del abastecimiento no es válido."
            );
        }

        // VERIFICAR QUE EXISTA

        if (!abastecimientoRepository.existsById(id)) {

            throw new ResourceNotFoundException(
                    "No existe el abastecimiento con ID: "
                            + id
            );
        }

        // ELIMINAR DIRECTAMENTE
        //
        // No usamos findById() + delete(entidad).
        // El DELETE directo evita que Hibernate tenga que
        // sincronizar una entidad Abastecimiento que pudiera
        // tener gasolinera = null.

        int eliminados =
                abastecimientoRepository.eliminarPorId(id);

        if (eliminados == 0) {

            throw new ResourceNotFoundException(
                    "No se pudo eliminar el abastecimiento con ID: "
                            + id
            );
        }
    }

    // ============================================================
    // CALCULAR TOTAL
    // Si el request trae un total mayor que cero (factura que no
    // coincide), se respeta. Si no, galones x precio.
    // ============================================================

    private BigDecimal calcularTotal(
            AbastecimientoRequest request,
            BigDecimal precioGalon
    ) {

        BigDecimal total;

        if (
                request.getTotal() != null &&
                request.getTotal().compareTo(BigDecimal.ZERO) > 0
        ) {

            total = request.getTotal();

        } else {

            total = request.getGalonesAutorizados()
                    .multiply(precioGalon);
        }

        return total.setScale(2, RoundingMode.HALF_UP);
    }

    // ============================================================
    // VALIDAR GASOLINERA
    // ============================================================

    private void validarGasolinera(
            String gasolinera
    ) {

        if (
                !gasolinera.equals("Shell") &&
                !gasolinera.equals("Texaco") &&
                !gasolinera.equals("Puma") &&
                !gasolinera.equals("UNO") &&
                !gasolinera.equals("Otra")
        ) {

            throw new IllegalArgumentException(
                    "La gasolinera seleccionada no es válida. "
                            + "Use Shell, Texaco, Puma, UNO u Otra."
            );
        }
    }
}