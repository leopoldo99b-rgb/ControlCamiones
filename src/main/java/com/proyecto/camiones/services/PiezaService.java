package com.proyecto.camiones.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.camiones.exception.NegocioException;
import com.proyecto.camiones.exception.NoEncontradoException;
import com.proyecto.camiones.model.Categoria;
import com.proyecto.camiones.model.Lugar;
import com.proyecto.camiones.model.Pieza;
import com.proyecto.camiones.model.TipoMovimiento;
import com.proyecto.camiones.repository.CategoriaRepository;
import com.proyecto.camiones.repository.LugarRepository;
import com.proyecto.camiones.repository.MovimientoRepository;
import com.proyecto.camiones.repository.PiezaRepository;

import dto.EliminarResponse;
import dto.PiezaRequest;
import dto.PiezaResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class PiezaService {

    private final PiezaRepository piezaRepository;
    private final CategoriaRepository categoriaRepository;
    private final LugarRepository lugarRepository;
    private final MovimientoRepository movimientoRepository;
    private final MovimientoService movimientoService;

    public PiezaService(PiezaRepository piezaRepository,
                        CategoriaRepository categoriaRepository,
                        LugarRepository lugarRepository,
                        MovimientoRepository movimientoRepository,
                        MovimientoService movimientoService) {
        this.piezaRepository = piezaRepository;
        this.categoriaRepository = categoriaRepository;
        this.lugarRepository = lugarRepository;
        this.movimientoRepository = movimientoRepository;
        this.movimientoService = movimientoService;
    }

    @Transactional(readOnly = true)
    public List<PiezaResponse> listar() {
        return piezaRepository.listarActivas().stream().map(PiezaResponse::de).toList();
    }

    @Transactional
    public PiezaResponse crear(PiezaRequest req) {
        String codigo = req.codigo().trim().toUpperCase(Locale.ROOT);
        if (piezaRepository.existsByCodigo(codigo)) {
            throw new NegocioException("El código " + codigo + " ya existe (puede pertenecer a una pieza archivada).");
        }

        String nombreCategoria = req.categoria().trim();
        Categoria categoria = categoriaRepository.findByNombreIgnoreCase(nombreCategoria)
                .orElseGet(() -> categoriaRepository.save(new Categoria(nombreCategoria)));

        String nombreLugar = req.lugar().trim();
        Lugar lugar = lugarRepository.findByNombreIgnoreCase(nombreLugar)
                .orElseGet(() -> lugarRepository.save(new Lugar(nombreLugar)));

        Pieza pieza = new Pieza();
        pieza.setCodigo(codigo);
        pieza.setNombre(req.nombre().trim());
        pieza.setCategoria(categoria);
        pieza.setLugar(lugar);
        pieza.setStockMinimo(req.minimo());
        piezaRepository.save(pieza);   // nace con stock 0 y costo 0

        // La existencia inicial entra como un movimiento más: así queda en el historial
        // y el trigger calcula el stock y el costo promedio.
        if (req.stock() > 0) {
            movimientoService.aplicar(pieza, TipoMovimiento.ENTRADA, LocalDate.now(),
                    req.stock(), req.costo(), "Existencia inicial", null);
        }
        return PiezaResponse.de(pieza);
    }

    /**
     * Quita la pieza del inventario.
     *  - Sin movimientos: se borra por completo de la base de datos.
     *  - Con movimientos: se archiva (activo = false). Desaparece del inventario y de los totales,
     *    pero su historial se conserva, porque los movimientos son inmutables y la base no
     *    permite borrarlos.
     */
    @Transactional
    public EliminarResponse eliminar(Long id) {
        Pieza pieza = piezaRepository.findById(id)
                .filter(Pieza::isActivo)
                .orElseThrow(() -> new NoEncontradoException("La pieza no existe o ya fue eliminada."));

        if (movimientoRepository.existsByPiezaId(id)) {
            pieza.setActivo(false);
            return new EliminarResponse("archivada",
                    "Pieza quitada del inventario. Su historial de movimientos se conserva.");
        }
        piezaRepository.delete(pieza);
        return new EliminarResponse("eliminada", "Pieza eliminada por completo.");
    }
}
