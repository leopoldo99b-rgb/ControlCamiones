package com.proyecto.camiones.services;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.camiones.exception.NegocioException;
import com.proyecto.camiones.exception.NoEncontradoException;
import com.proyecto.camiones.model.Movimiento;
import com.proyecto.camiones.model.Pieza;
import com.proyecto.camiones.model.TipoMovimiento;
import com.proyecto.camiones.repository.MovimientoRepository;
import com.proyecto.camiones.repository.PiezaRepository;

import dto.MovimientoRequest;
import dto.MovimientoResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class MovimientoService {

    private final MovimientoRepository movimientoRepository;
    private final PiezaRepository piezaRepository;

    @PersistenceContext
    private EntityManager em;

    public MovimientoService(MovimientoRepository movimientoRepository, PiezaRepository piezaRepository) {
        this.movimientoRepository = movimientoRepository;
        this.piezaRepository = piezaRepository;
    }

    @Transactional(readOnly = true)
    public List<MovimientoResponse> listar() {
        return movimientoRepository.listarTodos().stream().map(MovimientoResponse::de).toList();
    }

    @Transactional
    public MovimientoResponse registrar(MovimientoRequest req) {
        Pieza pieza = piezaRepository.findById(req.productoId())
                .filter(Pieza::isActivo)
                .orElseThrow(() -> new NoEncontradoException("La pieza no existe o ya fue eliminada."));

        Movimiento m = aplicar(pieza, req.tipo(), req.fecha(), req.cantidad(), req.costo(), req.ref(), req.notas());
        return MovimientoResponse.de(m);
    }

    /**
     * Inserta el movimiento. El trigger de PostgreSQL actualiza el stock y el costo promedio
     * de la pieza (y en una SALIDA fija el costo unitario); por eso aquí NO se recalcula nada
     * y, después de insertar, se recargan las entidades para ver los valores reales.
     */
    @Transactional
    public Movimiento aplicar(Pieza pieza, TipoMovimiento tipo, LocalDate fecha, int cantidad,
                              BigDecimal costo, String ref, String notas) {
        if (tipo == TipoMovimiento.SALIDA && cantidad > pieza.getStockActual()) {
            throw new NegocioException("Solo hay " + pieza.getStockActual() + " unidades en bodega.");
        }

        Movimiento m = new Movimiento();
        m.setPieza(pieza);
        m.setTipo(tipo);
        m.setFecha(fecha != null ? fecha : LocalDate.now());
        m.setCantidad(cantidad);
        m.setCostoUnitario(costo);
        m.setReferencia(limpiar(ref));
        m.setNotas(limpiar(notas));

        try {
            movimientoRepository.saveAndFlush(m);
        } catch (DataAccessException e) {
            throw traducir(e);
        }

        em.refresh(m);       // trae costo_unitario (salidas) y total generados por la base
        em.refresh(pieza);   // trae el stock y el costo promedio calculados por el trigger
        return m;
    }

    private static String limpiar(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }

    /** Si el trigger rechazó la salida por falta de stock (otro usuario se adelantó), devuelve su mensaje. */
    private static RuntimeException traducir(DataAccessException e) {
        String msg = NestedExceptionUtils.getMostSpecificCause(e).getMessage();
        if (msg != null && msg.contains("Stock insuficiente")) {
            String linea = msg.lines().findFirst().orElse(msg).replaceFirst("^ERROR:\\s*", "");
            return new NegocioException(linea);
        }
        return e;
    }
}
