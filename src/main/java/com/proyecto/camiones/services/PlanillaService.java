package com.proyecto.camiones.services;

import com.proyecto.camiones.exception.NegocioException;
import com.proyecto.camiones.model.*;
import com.proyecto.camiones.repository.*;
import dto.PlanillaDtos.DetalleResponse;
import dto.PlanillaDtos.GenerarPlanillaRequest;
import dto.PlanillaDtos.PlanillaResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/** Pago = sueldo del período - adelantos - vales - préstamos. */
@Service
public class PlanillaService {
    private final PlanillaRepository planillaRepo;
    private final PlanillaDetalleRepository detalleRepo;
    private final EmpleadoRepository empleadoRepo;
    private final AdelantoRepository adelantoRepo;

    public PlanillaService(PlanillaRepository planillaRepo, PlanillaDetalleRepository detalleRepo,
                           EmpleadoRepository empleadoRepo, AdelantoRepository adelantoRepo) {
        this.planillaRepo = planillaRepo;
        this.detalleRepo = detalleRepo;
        this.empleadoRepo = empleadoRepo;
        this.adelantoRepo = adelantoRepo;
    }

    @Transactional(readOnly = true)
    public List<PlanillaResponse> listar() {
        return planillaRepo.findAllByOrderByFechaFinDescIdDesc().stream()
                .map(p -> PlanillaResponse.de(p, (int) detalleRepo.countByPlanillaId(p.getId()), null)).toList();
    }

    @Transactional(readOnly = true)
    public PlanillaResponse obtener(Integer id) {
        Planilla p = planillaRepo.findById(id).orElseThrow();
        List<DetalleResponse> det = detalleRepo.findByPlanillaIdOrderByEmpleadoNombreAsc(id).stream().map(DetalleResponse::de).toList();
        return PlanillaResponse.de(p, det.size(), det);
    }

    @Transactional
    public PlanillaResponse generar(GenerarPlanillaRequest r) {
        if (r.fechaInicio() == null || r.fechaFin() == null) throw new NegocioException("Indica las fechas del período.");
        if (r.fechaFin().isBefore(r.fechaInicio())) throw new NegocioException("La fecha final es anterior a la inicial.");
        BigDecimal factor = factor(r.frecuencia());
        if (planillaRepo.existsByFrecuenciaAndFechaInicioAndFechaFin(r.frecuencia(), r.fechaInicio(), r.fechaFin()))
            throw new NegocioException("Ya existe una planilla " + r.frecuencia().toLowerCase() + " para esas fechas.");

        Planilla p = new Planilla();
        p.setFrecuencia(r.frecuencia());
        p.setFechaInicio(r.fechaInicio());
        p.setFechaFin(r.fechaFin());
        p.setDescripcion(r.descripcion());
        planillaRepo.save(p);

        List<PlanillaDetalle> detalles = new ArrayList<>();
        for (Empleado e : empleadoRepo.findByActivoTrueAndFrecuenciaPagoAndFechaIngresoLessThanEqual(r.frecuencia(), r.fechaFin())) {
            BigDecimal base = r2(e.getSalarioMensual().multiply(factor));
            if (e.getFechaIngreso().isAfter(r.fechaInicio())) { // ingresó dentro del período: prorrateo por días
                long total = ChronoUnit.DAYS.between(r.fechaInicio(), r.fechaFin()) + 1;
                long trab = ChronoUnit.DAYS.between(e.getFechaIngreso(), r.fechaFin()) + 1;
                base = base.multiply(BigDecimal.valueOf(trab)).divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
            }
            List<Adelanto> pend = adelantoRepo.findByEmpleadoIdAndEstadoOrderByFechaAscIdAsc(e.getId(), "PENDIENTE");
            BigDecimal restante = base; // el neto nunca queda negativo
            BigDecimal adel = base.min(suma(pend, "ADELANTO", r.fechaFin()));  restante = restante.subtract(adel);
            BigDecimal vales = restante.min(suma(pend, "VALE", r.fechaFin())); restante = restante.subtract(vales);
            BigDecimal prest = restante.min(suma(pend, "PRESTAMO", r.fechaFin()));

            PlanillaDetalle d = new PlanillaDetalle();
            d.setPlanilla(p);
            d.setEmpleado(e);
            d.setSalarioBase(base);
            d.setAdelantos(adel);
            d.setVales(vales);
            d.setPrestamos(prest);
            BigDecimal ded = adel.add(vales).add(prest);
            d.setTotalDeducciones(ded);
            d.setNeto(base.subtract(ded));
            detalles.add(d);
        }
        detalleRepo.saveAll(detalles);
        p.setTotalIngresos(detalles.stream().map(PlanillaDetalle::getSalarioBase).reduce(BigDecimal.ZERO, BigDecimal::add));
        p.setTotalDeducciones(detalles.stream().map(PlanillaDetalle::getTotalDeducciones).reduce(BigDecimal.ZERO, BigDecimal::add));
        p.setTotalNeto(detalles.stream().map(PlanillaDetalle::getNeto).reduce(BigDecimal.ZERO, BigDecimal::add));
        planillaRepo.save(p);
        return PlanillaResponse.de(p, detalles.size(), null);
    }

    /** Marca como pagada y rebaja los saldos de adelantos, vales y préstamos. */
    @Transactional
    public void pagar(Integer id) {
        Planilla p = planillaRepo.findById(id).orElseThrow();
        if (!"BORRADOR".equals(p.getEstado())) throw new NegocioException("Esta planilla ya fue pagada.");
        p.setEstado("PAGADA");
        p.setFechaPago(LocalDateTime.now());
        for (PlanillaDetalle d : detalleRepo.findByPlanillaIdOrderByEmpleadoNombreAsc(id)) {
            Integer emp = d.getEmpleado().getId();
            aplicar(emp, "ADELANTO", d.getAdelantos(), p.getFechaFin());
            aplicar(emp, "VALE", d.getVales(), p.getFechaFin());
            aplicar(emp, "PRESTAMO", d.getPrestamos(), p.getFechaFin());
        }
    }

    @Transactional
    public void eliminar(Integer id) {
        Planilla p = planillaRepo.findById(id).orElseThrow();
        if (!"BORRADOR".equals(p.getEstado())) throw new NegocioException("Solo se eliminan planillas en borrador.");
        planillaRepo.delete(p); // planilla_detalle se borra por ON DELETE CASCADE
    }

    /* ---------- Auxiliares ---------- */
    private static BigDecimal montoACobrar(Adelanto a) {
        return a.getCuotaPorPlanilla() == null ? a.getSaldo() : a.getSaldo().min(a.getCuotaPorPlanilla());
    }

    private static BigDecimal suma(List<Adelanto> pend, String tipo, LocalDate hasta) {
        return pend.stream().filter(a -> tipo.equals(a.getTipo()) && !a.getFecha().isAfter(hasta))
                .map(PlanillaService::montoACobrar).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void aplicar(Integer empleadoId, String tipo, BigDecimal monto, LocalDate hasta) {
        BigDecimal restante = monto;
        for (Adelanto a : adelantoRepo.findByEmpleadoIdAndEstadoOrderByFechaAscIdAsc(empleadoId, "PENDIENTE")) {
            if (restante.signum() <= 0) break;
            if (!tipo.equals(a.getTipo()) || a.getFecha().isAfter(hasta)) continue;
            BigDecimal aplica = restante.min(a.getSaldo());
            a.setSaldo(a.getSaldo().subtract(aplica));
            if (a.getSaldo().signum() <= 0) a.setEstado("SALDADO");
            restante = restante.subtract(aplica);
        }
    }

    private BigDecimal factor(String frecuencia) {
        if (frecuencia == null) throw new NegocioException("Indica la frecuencia.");
        return switch (frecuencia) {
            case "SEMANAL" -> BigDecimal.valueOf(12).divide(BigDecimal.valueOf(52), 8, RoundingMode.HALF_UP);
            case "QUINCENAL" -> new BigDecimal("0.5");
            case "MENSUAL" -> BigDecimal.ONE;
            default -> throw new NegocioException("Frecuencia inválida.");
        };
    }

    private static BigDecimal r2(BigDecimal v) { return v.setScale(2, RoundingMode.HALF_UP); }
}