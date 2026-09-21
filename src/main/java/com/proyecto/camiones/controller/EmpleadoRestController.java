package com.proyecto.camiones.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.proyecto.camiones.model.Empleado;
import com.proyecto.camiones.services.EmpleadoService;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoRestController {

    private final EmpleadoService empleadoService;

    public EmpleadoRestController(EmpleadoService empleadoService) {
        this.empleadoService = empleadoService;
    }

    // =====================================================
    // OBTENER TODOS LOS EMPLEADOS
    // GET /api/empleados
    // =====================================================

    @GetMapping
    public ResponseEntity<List<Empleado>> listarEmpleados() {

        List<Empleado> empleados =
                empleadoService.listarTodos();

        return ResponseEntity.ok(empleados);
    }

    // =====================================================
    // OBTENER UN EMPLEADO POR ID
    // GET /api/empleados/1
    // =====================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerEmpleado(
            @PathVariable Long id) {

        try {

            Empleado empleado =
                    empleadoService.buscarPorId(id);

            return ResponseEntity.ok(empleado);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(crearError(e.getMessage()));
        }
    }

    // =====================================================
    // CREAR EMPLEADO
    // POST /api/empleados
    // =====================================================

    @PostMapping
    public ResponseEntity<?> crearEmpleado(
            @RequestBody Empleado empleado) {

        try {

            Empleado nuevoEmpleado =
                    empleadoService.guardar(empleado);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(nuevoEmpleado);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(crearError(e.getMessage()));
        }
    }

    // =====================================================
    // ACTUALIZAR EMPLEADO
    // PUT /api/empleados/1
    // =====================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarEmpleado(
            @PathVariable Long id,
            @RequestBody Empleado empleado) {

        try {

            Empleado empleadoActualizado =
                    empleadoService.actualizar(
                            id,
                            empleado
                    );

            return ResponseEntity.ok(
                    empleadoActualizado
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(crearError(e.getMessage()));
        }
    }

    // =====================================================
    // ELIMINAR EMPLEADO
    // DELETE /api/empleados/1
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarEmpleado(
            @PathVariable Long id) {

        try {

            empleadoService.eliminar(id);

            Map<String, Object> respuesta =
                    new HashMap<>();

            respuesta.put(
                    "mensaje",
                    "Empleado eliminado correctamente"
            );

            respuesta.put("id", id);

            return ResponseEntity.ok(respuesta);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(crearError(e.getMessage()));
        }
    }

    // =====================================================
    // BUSCAR POR NOMBRE
    // GET /api/empleados/buscar?nombre=juan
    // =====================================================

    @GetMapping("/buscar")
    public ResponseEntity<List<Empleado>> buscarPorNombre(
            @RequestParam String nombre) {

        return ResponseEntity.ok(
                empleadoService.buscarPorNombre(nombre)
        );
    }

    // =====================================================
    // FILTRAR POR ESTADO
    // GET /api/empleados/estado/ACTIVO
    // =====================================================

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Empleado>> listarPorEstado(
            @PathVariable String estado) {

        return ResponseEntity.ok(
                empleadoService.listarPorEstado(estado)
        );
    }

    // =====================================================
    // BUSCAR POR IDENTIDAD
    // GET /api/empleados/identidad/0801-1990-12345
    // =====================================================

    @GetMapping("/identidad/{identidad}")
    public ResponseEntity<?> buscarPorIdentidad(
            @PathVariable String identidad) {

        try {

            Empleado empleado =
                    empleadoService.buscarPorIdentidad(
                            identidad
                    );

            return ResponseEntity.ok(empleado);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(crearError(e.getMessage()));
        }
    }

    // =====================================================
    // ESTADÍSTICAS
    // GET /api/empleados/estadisticas
    // =====================================================

    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>>
    obtenerEstadisticas() {

        long total =
                empleadoService.contarEmpleados();

        long activos =
                empleadoService.contarActivos();

        BigDecimal nomina =
                empleadoService.calcularNominaMensual();

        Map<String, Object> estadisticas =
                new HashMap<>();

        estadisticas.put("totalEmpleados", total);
        estadisticas.put("empleadosActivos", activos);
        estadisticas.put("nominaMensual", nomina);

        return ResponseEntity.ok(estadisticas);
    }

    // =====================================================
    // MÉTODO PARA RESPUESTAS DE ERROR
    // =====================================================

    private Map<String, Object> crearError(
            String mensaje) {

        Map<String, Object> error =
                new HashMap<>();

        error.put("error", true);
        error.put("mensaje", mensaje);

        return error;
    }
}