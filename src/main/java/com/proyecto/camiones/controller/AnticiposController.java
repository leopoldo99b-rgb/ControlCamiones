package com.proyecto.camiones.controller;

import com.proyecto.camiones.model.MovimientoEmpleado;
import com.proyecto.camiones.services.MovimientoEmpleadoService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/movimientos")
public class AnticiposController {

    private final MovimientoEmpleadoService movimientoService;

    public AnticiposController(
            MovimientoEmpleadoService movimientoService) {

        this.movimientoService = movimientoService;
    }

    // =========================================================
    // VISTA
    // GET /movimientos
    // =========================================================

    @GetMapping
    public String mostrarMovimientos() {
        return "movimientos";
    }

    // =========================================================
    // LISTAR TODOS LOS MOVIMIENTOS
    // GET /movimientos/api
    // =========================================================

    @GetMapping("/api")
    @ResponseBody
    public ResponseEntity<List<MovimientoEmpleado>> listarMovimientos() {

        return ResponseEntity.ok(
                movimientoService.listarTodos()
        );
    }

    // =========================================================
    // BUSCAR MOVIMIENTO POR ID
    // GET /movimientos/api/{id}
    // =========================================================

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> obtenerMovimiento(
            @PathVariable Long id) {

        try {

            MovimientoEmpleado movimiento =
                    movimientoService.buscarPorId(id);

            return ResponseEntity.ok(movimiento);

        } catch (RuntimeException e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(error);
        }
    }

    // =========================================================
    // MOVIMIENTOS POR EMPLEADO
    // GET /movimientos/api/empleado/{empleadoId}
    // =========================================================

    @GetMapping("/api/empleado/{empleadoId}")
    @ResponseBody
    public ResponseEntity<List<MovimientoEmpleado>>
    listarPorEmpleado(
            @PathVariable Long empleadoId) {

        return ResponseEntity.ok(
                movimientoService.listarPorEmpleado(
                        empleadoId
                )
        );
    }

    // =========================================================
    // CREAR MOVIMIENTO
    // POST /movimientos/api
    // =========================================================

    @PostMapping("/api")
    @ResponseBody
    public ResponseEntity<?> crearMovimiento(
            @RequestBody MovimientoRequest request) {

        try {

            MovimientoEmpleado movimiento =
                    movimientoService.guardar(
                            request.getEmpleadoId(),
                            request.getTipo(),
                            request.getMonto(),
                            request.getFecha(),
                            request.getDescripcion()
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(movimiento);

        } catch (IllegalArgumentException e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error);

        } catch (RuntimeException e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error);
        }
    }

    // =========================================================
    // ACTUALIZAR MOVIMIENTO
    // PUT /movimientos/api/{id}
    // =========================================================

    @PutMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarMovimiento(
            @PathVariable Long id,
            @RequestBody MovimientoRequest request) {

        try {

            MovimientoEmpleado movimiento =
                    movimientoService.actualizar(
                            id,
                            request.getEmpleadoId(),
                            request.getTipo(),
                            request.getMonto(),
                            request.getFecha(),
                            request.getDescripcion()
                    );

            return ResponseEntity.ok(movimiento);

        } catch (IllegalArgumentException e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error);

        } catch (RuntimeException e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(error);
        }
    }

    // =========================================================
    // ELIMINAR MOVIMIENTO
    // DELETE /movimientos/api/{id}
    // =========================================================

    @DeleteMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarMovimiento(
            @PathVariable Long id) {

        try {

            movimientoService.eliminar(id);

            Map<String, String> respuesta =
                    new HashMap<>();

            respuesta.put(
                    "mensaje",
                    "Movimiento eliminado correctamente."
            );

            return ResponseEntity.ok(respuesta);

        } catch (RuntimeException e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(error);
        }
    }

    // =========================================================
    // ESTADÍSTICAS
    // GET /movimientos/api/estadisticas
    // =========================================================

    @GetMapping("/api/estadisticas")
    @ResponseBody
    public ResponseEntity<Map<String, Object>>
    obtenerEstadisticas() {

        Map<String, Object> estadisticas =
                new HashMap<>();

        BigDecimal bonos =
                movimientoService.obtenerTotalBonos();

        BigDecimal deducciones =
                movimientoService.obtenerTotalDeducciones();

        BigDecimal anticipos =
                movimientoService.obtenerTotalAnticipos();

        long movimientos =
                movimientoService.obtenerTotalMovimientos();

        estadisticas.put(
                "totalBonos",
                bonos != null
                        ? bonos
                        : BigDecimal.ZERO
        );

        estadisticas.put(
                "totalDeducciones",
                deducciones != null
                        ? deducciones
                        : BigDecimal.ZERO
        );

        estadisticas.put(
                "totalAnticipos",
                anticipos != null
                        ? anticipos
                        : BigDecimal.ZERO
        );

        estadisticas.put(
                "totalMovimientos",
                movimientos
        );

        return ResponseEntity.ok(
                estadisticas
        );
    }

    // =========================================================
    // DTO PARA RECIBIR DATOS DEL JAVASCRIPT
    // =========================================================

    public static class MovimientoRequest {

        private Long empleadoId;

        private String tipo;

        private BigDecimal monto;

        private LocalDate fecha;

        private String descripcion;

        // =====================================================
        // GETTER Y SETTER - EMPLEADO
        // =====================================================

        public Long getEmpleadoId() {
            return empleadoId;
        }

        public void setEmpleadoId(Long empleadoId) {
            this.empleadoId = empleadoId;
        }

        // =====================================================
        // GETTER Y SETTER - TIPO
        // =====================================================

        public String getTipo() {
            return tipo;
        }

        public void setTipo(String tipo) {
            this.tipo = tipo;
        }

        // =====================================================
        // GETTER Y SETTER - MONTO
        // =====================================================

        public BigDecimal getMonto() {
            return monto;
        }

        public void setMonto(BigDecimal monto) {
            this.monto = monto;
        }

        // =====================================================
        // GETTER Y SETTER - FECHA
        // =====================================================

        public LocalDate getFecha() {
            return fecha;
        }

        public void setFecha(LocalDate fecha) {
            this.fecha = fecha;
        }

        // =====================================================
        // GETTER Y SETTER - DESCRIPCIÓN
        // =====================================================

        public String getDescripcion() {
            return descripcion;
        }

        public void setDescripcion(String descripcion) {
            this.descripcion = descripcion;
        }
    }
}