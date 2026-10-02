package com.proyecto.camiones.services;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import com.proyecto.camiones.model.EstadoPago;
import com.proyecto.camiones.model.EstadoPlanilla;
import com.proyecto.camiones.model.HistorialPlanilla;
import com.proyecto.camiones.model.Planilla;
import com.proyecto.camiones.repository.PlanillaRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PlanillaService {

    private final PlanillaRepository planillaRepository;

    public PlanillaService(PlanillaRepository planillaRepository) {
        this.planillaRepository = planillaRepository;
    }

    // =========================================================
    // CREAR / GUARDAR PLANILLA
    // =========================================================

    @Transactional
    public Planilla guardar(Planilla planilla) {

        validarPlanilla(planilla);

        // Estado inicial
        if (planilla.getEstado() == null) {
            planilla.setEstado(EstadoPlanilla.PENDIENTE);
        }

        LocalDateTime ahora = LocalDateTime.now();

        // Fecha de creación
        if (planilla.getFechaCreacion() == null) {
            planilla.setFechaCreacion(ahora);
        }

        // Fecha de actualización
        planilla.setFechaActualizacion(ahora);

        // Preparar los registros del historial
        prepararHistorial(planilla);

        // Calcular totales
        calcularTotales(planilla);

        return planillaRepository.save(planilla);
    }

    // =========================================================
    // BUSCAR POR ID
    // =========================================================

    @Transactional
    public Planilla buscarPorId(Long id) {

        return planillaRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "No se encontró la planilla con ID: " + id
                        )
                );
    }

    // =========================================================
    // BUSCAR POR NÚMERO
    // =========================================================

    @Transactional
    public Planilla buscarPorNumero(String numeroPlanilla) {

        return planillaRepository
                .findByNumeroPlanilla(numeroPlanilla)
                .orElseThrow(() ->
                        new RuntimeException(
                                "No se encontró la planilla: "
                                        + numeroPlanilla
                        )
                );
    }

    // =========================================================
    // LISTAR TODAS LAS PLANILLAS
    // =========================================================

    @Transactional
    public List<Planilla> listarTodas() {

        return planillaRepository
                .findAllByOrderByFechaPagoDesc();
    }

    // =========================================================
    // LISTAR PLANILLAS POR ESTADO
    // =========================================================

    @Transactional
    public List<Planilla> listarPorEstado(
            EstadoPlanilla estado) {

        return planillaRepository
                .findByEstadoOrderByFechaPagoDesc(estado);
    }

    // =========================================================
    // LISTAR PLANILLAS POR RANGO DE FECHA DE PAGO
    // =========================================================

    @Transactional
    public List<Planilla> listarPorFecha(
            LocalDate desde,
            LocalDate hasta) {

        if (desde == null || hasta == null) {
            throw new IllegalArgumentException(
                    "Las fechas desde y hasta son obligatorias."
            );
        }

        if (hasta.isBefore(desde)) {
            throw new IllegalArgumentException(
                    "La fecha hasta no puede ser anterior a la fecha desde."
            );
        }

        return planillaRepository
                .findByFechaPagoBetweenOrderByFechaPagoDesc(
                        desde,
                        hasta
                );
    }

    // =========================================================
    // ACTUALIZAR ESTADO DE PLANILLA
    // =========================================================

    @Transactional
    public Planilla actualizarEstado(
            Long id,
            EstadoPlanilla nuevoEstado) {

        if (nuevoEstado == null) {
            throw new IllegalArgumentException(
                    "El nuevo estado es obligatorio."
            );
        }

        Planilla planilla = buscarPorId(id);

        planilla.setEstado(nuevoEstado);
        planilla.setFechaActualizacion(
                LocalDateTime.now()
        );

        return planillaRepository.save(planilla);
    }

    // =========================================================
    // MARCAR EMPLEADO COMO PAGADO
    // =========================================================

    @Transactional
    public HistorialPlanilla marcarEmpleadoPagado(
            Long planillaId,
            Long historialId) {

        Planilla planilla = buscarPorId(planillaId);

        if (planilla.getEmpleados() == null
                || planilla.getEmpleados().isEmpty()) {

            throw new RuntimeException(
                    "La planilla no tiene empleados registrados."
            );
        }

        HistorialPlanilla historial = planilla
                .getEmpleados()
                .stream()
                .filter(item ->
                        item.getId() != null
                                && item.getId().equals(historialId)
                )
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "No se encontró el empleado dentro de la planilla."
                        )
                );

        // Marcar el registro individual como pagado
        historial.setEstadoPago(EstadoPago.PAGADO);

        // Registrar fecha de pago
        historial.setFechaPago(
                LocalDateTime.now()
        );

        // Actualizar estado general de la planilla
        actualizarEstadoGeneral(planilla);

        // Actualizar fecha de modificación
        planilla.setFechaActualizacion(
                LocalDateTime.now()
        );

        // Guardar cambios
        planillaRepository.save(planilla);

        return historial;
    }

    // =========================================================
    // PREPARAR HISTORIAL
    // =========================================================

    private void prepararHistorial(Planilla planilla) {

        if (planilla.getEmpleados() == null
                || planilla.getEmpleados().isEmpty()) {

            return;
        }

        LocalDateTime ahora = LocalDateTime.now();

        for (HistorialPlanilla historial :
                planilla.getEmpleados()) {

            // Relación con la planilla
            historial.setPlanilla(planilla);

            // Valores por defecto
            if (historial.getSalario() == null) {
                historial.setSalario(BigDecimal.ZERO);
            }

            if (historial.getBonos() == null) {
                historial.setBonos(BigDecimal.ZERO);
            }

            if (historial.getAnticipos() == null) {
                historial.setAnticipos(BigDecimal.ZERO);
            }

            if (historial.getDeducciones() == null) {
                historial.setDeducciones(BigDecimal.ZERO);
            }

            if (historial.getNeto() == null) {
                historial.setNeto(BigDecimal.ZERO);
            }

            // Estado inicial de pago
            if (historial.getEstadoPago() == null) {
                historial.setEstadoPago(
                        EstadoPago.PENDIENTE
                );
            }

            // Fecha de registro
            if (historial.getFechaRegistro() == null) {
                historial.setFechaRegistro(ahora);
            }
        }
    }

    // =========================================================
    // CALCULAR TOTALES
    // =========================================================

    private void calcularTotales(Planilla planilla) {

        BigDecimal salarios = BigDecimal.ZERO;
        BigDecimal bonos = BigDecimal.ZERO;
        BigDecimal anticipos = BigDecimal.ZERO;
        BigDecimal deducciones = BigDecimal.ZERO;
        BigDecimal neto = BigDecimal.ZERO;

        int cantidadEmpleados = 0;

        if (planilla.getEmpleados() != null) {

            cantidadEmpleados =
                    planilla.getEmpleados().size();

            for (HistorialPlanilla historial :
                    planilla.getEmpleados()) {

                BigDecimal salario =
                        valor(historial.getSalario());

                BigDecimal bono =
                        valor(historial.getBonos());

                BigDecimal anticipo =
                        valor(historial.getAnticipos());

                BigDecimal deduccion =
                        valor(historial.getDeducciones());

                // Acumular salarios
                salarios = salarios.add(salario);

                // Acumular bonos
                bonos = bonos.add(bono);

                // Acumular anticipos
                anticipos = anticipos.add(anticipo);

                // Acumular deducciones
                deducciones = deducciones.add(deduccion);

                // Calcular SIEMPRE el neto en el servidor
                BigDecimal netoEmpleado = salario
                        .add(bono)
                        .subtract(anticipo)
                        .subtract(deduccion);

                historial.setNeto(netoEmpleado);

                neto = neto.add(netoEmpleado);
            }
        }

        // Guardar totales de la planilla
        planilla.setTotalEmpleados(
                cantidadEmpleados
        );

        planilla.setTotalSalarios(
                salarios
        );

        planilla.setTotalBonos(
                bonos
        );

        planilla.setTotalAnticipos(
                anticipos
        );

        planilla.setTotalDeducciones(
                deducciones
        );

        planilla.setTotalNeto(
                neto
        );
    }

    // =========================================================
    // ACTUALIZAR ESTADO GENERAL
    // =========================================================

    private void actualizarEstadoGeneral(
            Planilla planilla) {

        if (planilla.getEmpleados() == null
                || planilla.getEmpleados().isEmpty()) {

            planilla.setEstado(
                    EstadoPlanilla.PENDIENTE
            );

            return;
        }

        boolean todosPagados = planilla
                .getEmpleados()
                .stream()
                .allMatch(item ->
                        item.getEstadoPago()
                                == EstadoPago.PAGADO
                );

        if (todosPagados) {

            planilla.setEstado(
                    EstadoPlanilla.PAGADA
            );

        } else {

            planilla.setEstado(
                    EstadoPlanilla.PENDIENTE
            );
        }
    }

    // =========================================================
    // VALIDACIONES
    // =========================================================

    private void validarPlanilla(Planilla planilla) {

        if (planilla == null) {
            throw new IllegalArgumentException(
                    "La planilla no puede ser null."
            );
        }

        // Número de planilla
        if (planilla.getNumeroPlanilla() == null
                || planilla.getNumeroPlanilla().isBlank()) {

            throw new IllegalArgumentException(
                    "El número de planilla es obligatorio."
            );
        }

        // Fecha inicio
        if (planilla.getFechaInicio() == null) {

            throw new IllegalArgumentException(
                    "La fecha de inicio es obligatoria."
            );
        }

        // Fecha fin
        if (planilla.getFechaFin() == null) {

            throw new IllegalArgumentException(
                    "La fecha de fin es obligatoria."
            );
        }

        // Fecha pago
        if (planilla.getFechaPago() == null) {

            throw new IllegalArgumentException(
                    "La fecha de pago es obligatoria."
            );
        }

        // Validar período
        if (planilla.getFechaFin()
                .isBefore(planilla.getFechaInicio())) {

            throw new IllegalArgumentException(
                    "La fecha de fin no puede ser anterior "
                            + "a la fecha de inicio."
            );
        }

        // Validar empleados
        if (planilla.getEmpleados() == null
                || planilla.getEmpleados().isEmpty()) {

            throw new IllegalArgumentException(
                    "La planilla debe tener al menos un empleado."
            );
        }

        // Validar número duplicado solamente al crear
        if (planilla.getId() == null
                && planillaRepository
                        .existsByNumeroPlanilla(
                                planilla.getNumeroPlanilla()
                        )) {

            throw new IllegalArgumentException(
                    "Ya existe una planilla con el número: "
                            + planilla.getNumeroPlanilla()
            );
        }
    }

    // =========================================================
    // UTILIDAD PARA BIGDECIMAL
    // =========================================================

    private BigDecimal valor(BigDecimal valor) {

        return valor != null
                ? valor
                : BigDecimal.ZERO;
    }
}