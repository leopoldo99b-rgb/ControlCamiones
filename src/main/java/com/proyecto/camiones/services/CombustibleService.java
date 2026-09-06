package com.proyecto.camiones.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.camiones.exception.ResourceNotFoundException;
import com.proyecto.camiones.model.Combustible;
import com.proyecto.camiones.repository.CombustibleRepository;

import dto.CombustibleRequest;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class CombustibleService {

    private final CombustibleRepository repository;

    public CombustibleService(CombustibleRepository repository) {
        this.repository = repository;
    }

    // ============================================================
    // OBTENER TODOS
    // ============================================================

    @Transactional(readOnly = true)
    public List<Combustible> obtenerTodos() {
        return repository.findAll();
    }

    // ============================================================
    // OBTENER SOLO ACTIVOS
    // ============================================================

    @Transactional(readOnly = true)
    public List<Combustible> obtenerActivos() {
        return repository.findByActivoTrueOrderByNombreAsc();
    }

    // ============================================================
    // OBTENER POR ID
    // ============================================================

    @Transactional(readOnly = true)
    public Combustible obtenerPorId(Long id) {

        return repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "No existe el combustible con ID: " + id
                        )
                );
    }

    // ============================================================
    // CREAR COMBUSTIBLE
    // ============================================================

    public Combustible crear(CombustibleRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Los datos del combustible son obligatorios."
            );
        }

        if (request.getNombre() == null ||
                request.getNombre().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "El nombre del combustible es obligatorio."
            );
        }

        if (request.getPrecioGalon() == null) {

            throw new IllegalArgumentException(
                    "El precio del galón es obligatorio."
            );
        }

        if (request.getPrecioGalon().compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "El precio del galón debe ser mayor que cero."
            );
        }

        String nombre = request.getNombre().trim();

        if (repository.existsByNombreIgnoreCase(nombre)) {

            throw new IllegalArgumentException(
                    "Ya existe un combustible con el nombre: "
                            + nombre
            );
        }

        Combustible combustible = new Combustible();

        combustible.setNombre(nombre);

        combustible.setPrecioGalon(
                request.getPrecioGalon()
        );

        combustible.setActivo(
                request.getActivo() == null
                        ? true
                        : request.getActivo()
        );

        return repository.save(combustible);
    }

    // ============================================================
    // ACTUALIZAR COMBUSTIBLE
    // ============================================================

    public Combustible actualizar(
            Long id,
            CombustibleRequest request
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "Los datos del combustible son obligatorios."
            );
        }

        if (request.getNombre() == null ||
                request.getNombre().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "El nombre del combustible es obligatorio."
            );
        }

        if (request.getPrecioGalon() == null) {

            throw new IllegalArgumentException(
                    "El precio del galón es obligatorio."
            );
        }

        if (request.getPrecioGalon().compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "El precio del galón debe ser mayor que cero."
            );
        }

        Combustible combustible = obtenerPorId(id);

        String nuevoNombre = request.getNombre().trim();

        // ========================================================
        // VALIDAR NOMBRE DUPLICADO
        // ========================================================

        if (!combustible.getNombre()
                .equalsIgnoreCase(nuevoNombre)) {

            if (repository.existsByNombreIgnoreCase(nuevoNombre)) {

                throw new IllegalArgumentException(
                        "Ya existe un combustible con ese nombre"
                );
            }
        }

        // ========================================================
        // ACTUALIZAR DATOS
        // ========================================================

        combustible.setNombre(nuevoNombre);

        combustible.setPrecioGalon(
                request.getPrecioGalon()
        );

        if (request.getActivo() != null) {

            combustible.setActivo(
                    request.getActivo()
            );
        }

        return repository.save(combustible);
    }

    // ============================================================
    // ACTUALIZAR SOLAMENTE EL PRECIO
    // ============================================================

    public Combustible actualizarPrecio(
            Long id,
            BigDecimal nuevoPrecio
    ) {

        // --------------------------------------------------------
        // VALIDAR PRECIO
        // --------------------------------------------------------

        if (nuevoPrecio == null) {

            throw new IllegalArgumentException(
                    "El precio del galón es obligatorio."
            );
        }

        if (nuevoPrecio.compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "El precio del galón debe ser mayor que cero."
            );
        }

        // --------------------------------------------------------
        // BUSCAR COMBUSTIBLE
        // --------------------------------------------------------

        Combustible combustible = obtenerPorId(id);

        // --------------------------------------------------------
        // ACTUALIZAR PRECIO
        // --------------------------------------------------------

        combustible.setPrecioGalon(nuevoPrecio);

        // --------------------------------------------------------
        // GUARDAR
        // --------------------------------------------------------

        return repository.save(combustible);
    }

    // ============================================================
    // ELIMINAR / DESACTIVAR COMBUSTIBLE
    // ============================================================

    public void eliminar(Long id) {

        Combustible combustible = obtenerPorId(id);

        // No eliminamos físicamente.
        // Se desactiva para proteger el historial.

        combustible.setActivo(false);

        repository.save(combustible);
    }
}