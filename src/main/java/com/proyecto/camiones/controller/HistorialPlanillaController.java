package com.proyecto.camiones.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.EstadoPago;
import com.proyecto.camiones.model.HistorialPlanilla;
import com.proyecto.camiones.repository.HistorialPlanillaRepository;
import com.proyecto.camiones.services.PlanillaService;

import java.util.List;

@RestController
@RequestMapping("/historial-planillas")
@CrossOrigin(origins = "*")
public class HistorialPlanillaController {

    private final HistorialPlanillaRepository historialRepository;
    private final PlanillaService planillaService;

    public HistorialPlanillaController(
            HistorialPlanillaRepository historialRepository,
            PlanillaService planillaService) {

        this.historialRepository = historialRepository;
        this.planillaService = planillaService;
    }

    // =========================================================
    // LISTAR TODO EL HISTORIAL
    // GET /historial-planillas/api
    // =========================================================

    @GetMapping("/api")
    public ResponseEntity<List<HistorialPlanilla>> listarTodo() {

        return ResponseEntity.ok(
                historialRepository.findAll()
        );
    }

    // =========================================================
    // OBTENER REGISTRO POR ID
    // GET /historial-planillas/api/{id}
    // =========================================================

    @GetMapping("/api/{id}")
    public ResponseEntity<HistorialPlanilla> obtenerPorId(
            @PathVariable Long id) {

        HistorialPlanilla historial =
                historialRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Registro de historial no encontrado"
                                )
                        );

        return ResponseEntity.ok(historial);
    }

    // =========================================================
    // LISTAR EMPLEADOS DE UNA PLANILLA
    //
    // GET /historial-planillas/api/planilla/{planillaId}
    // =========================================================

    @GetMapping("/api/planilla/{planillaId}")
    public ResponseEntity<List<HistorialPlanilla>> listarPorPlanilla(
            @PathVariable Long planillaId) {

        return ResponseEntity.ok(
                historialRepository
                        .findByPlanillaIdOrderByIdAsc(planillaId)
        );
    }

    // =========================================================
    // HISTORIAL DE UN EMPLEADO
    //
    // GET /historial-planillas/api/empleado/{empleadoId}
    // =========================================================

    @GetMapping("/api/empleado/{empleadoId}")
    public ResponseEntity<List<HistorialPlanilla>> listarPorEmpleado(
            @PathVariable Long empleadoId) {

        return ResponseEntity.ok(
                historialRepository.findByEmpleadoId(empleadoId)
        );
    }

    // =========================================================
    // EMPLEADOS PENDIENTES DE PAGO
    //
    // GET /historial-planillas/api/planilla/{planillaId}/pendientes
    // =========================================================

    @GetMapping("/api/planilla/{planillaId}/pendientes")
    public ResponseEntity<List<HistorialPlanilla>> listarPendientes(
            @PathVariable Long planillaId) {

        return ResponseEntity.ok(
                historialRepository
                        .findByPlanillaIdAndEstadoPago(
                                planillaId,
                                EstadoPago.PENDIENTE
                        )
        );
    }

    // =========================================================
    // EMPLEADOS PAGADOS
    //
    // GET /historial-planillas/api/planilla/{planillaId}/pagados
    // =========================================================

    @GetMapping("/api/planilla/{planillaId}/pagados")
    public ResponseEntity<List<HistorialPlanilla>> listarPagados(
            @PathVariable Long planillaId) {

        return ResponseEntity.ok(
                historialRepository
                        .findByPlanillaIdAndEstadoPago(
                                planillaId,
                                EstadoPago.PAGADO
                        )
        );
    }

    // =========================================================
    // MARCAR EMPLEADO COMO PAGADO
    //
    // PATCH /historial-planillas/api/planilla/{planillaId}/empleado/{historialId}/pagar
    // =========================================================

    @PatchMapping(
            "/api/planilla/{planillaId}/empleado/{historialId}/pagar"
    )
    public ResponseEntity<HistorialPlanilla> marcarPagado(
            @PathVariable Long planillaId,
            @PathVariable Long historialId) {

        HistorialPlanilla historial =
                planillaService.marcarEmpleadoPagado(
                        planillaId,
                        historialId
                );

        return ResponseEntity.ok(historial);
    }
}
