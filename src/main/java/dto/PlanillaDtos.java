package dto;

import com.proyecto.camiones.model.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class PlanillaDtos {
	private PlanillaDtos() {
	}

	public record EmpleadoRequest(String codigo, String nombre, String identidad, String cargo, String frecuenciaPago,
			BigDecimal salarioMensual, LocalDate fechaIngreso, Boolean activo) {
	}

	public record EmpleadoResponse(Integer id, String codigo, String nombre, String identidad, String cargo,
			String frecuenciaPago, BigDecimal salarioMensual, LocalDate fechaIngreso, boolean activo) {
		public static EmpleadoResponse de(Empleado e) {
			return new EmpleadoResponse(e.getId(), e.getCodigo(), e.getNombre(), e.getIdentidad(), e.getCargo(),
					e.getFrecuenciaPago(), e.getSalarioMensual(), e.getFechaIngreso(), e.isActivo());
		}
	}

	public record GenerarPlanillaRequest(String frecuencia, LocalDate fechaInicio, LocalDate fechaFin,
			String descripcion) {
	}

	public record DetalleResponse(Integer id, String codigo, String nombre, BigDecimal salarioBase,
			BigDecimal adelantos, BigDecimal vales, BigDecimal prestamos, BigDecimal neto) {
		public static DetalleResponse de(PlanillaDetalle d) {
			Empleado e = d.getEmpleado();
			return new DetalleResponse(d.getId(), e.getCodigo(), e.getNombre(), d.getSalarioBase(), d.getAdelantos(),
					d.getVales(), d.getPrestamos(), d.getNeto());
		}
	}

	public record PlanillaResponse(Integer id, String frecuencia, LocalDate fechaInicio, LocalDate fechaFin,
			String descripcion, String estado, BigDecimal totalIngresos, BigDecimal totalDeducciones,
			BigDecimal totalNeto, int empleados, LocalDateTime fechaPago, List<DetalleResponse> detalle) {
		public static PlanillaResponse de(Planilla p, int empleados, List<DetalleResponse> detalle) {
			return new PlanillaResponse(p.getId(), p.getFrecuencia(), p.getFechaInicio(), p.getFechaFin(),
					p.getDescripcion(), p.getEstado(), p.getTotalIngresos(), p.getTotalDeducciones(), p.getTotalNeto(),
					empleados, p.getFechaPago(), detalle);
		}
	}

	/** tipo: ADELANTO, VALE o PRESTAMO. cuota solo aplica a PRESTAMO. */
	public record AdelantoRequest(Integer empleadoId, String tipo, LocalDate fecha, BigDecimal monto, BigDecimal cuota,
			String motivo) {
	}

	public record AdelantoResponse(Integer id, String codigo, String nombre, String tipo, LocalDate fecha,
			BigDecimal monto, BigDecimal saldo, BigDecimal cuota, String motivo, String estado) {
		public static AdelantoResponse de(Adelanto a) {
			return new AdelantoResponse(a.getId(), a.getEmpleado().getCodigo(), a.getEmpleado().getNombre(),
					a.getTipo(), a.getFecha(), a.getMonto(), a.getSaldo(), a.getCuotaPorPlanilla(), a.getMotivo(),
					a.getEstado());
		}
	}

	public record PrestacionRequest(String tipo, Integer anio) {
	}

	public record PrestacionResponse(Integer id, String codigo, String nombre, String tipo, Integer anio,
			LocalDate periodoInicio, LocalDate periodoFin, BigDecimal meses, BigDecimal salarioBase, BigDecimal monto,
			String estado, LocalDateTime fechaPago) {
		public static PrestacionResponse de(Prestacion p) {
			return new PrestacionResponse(p.getId(), p.getEmpleado().getCodigo(), p.getEmpleado().getNombre(),
					p.getTipo(), p.getAnio(), p.getPeriodoInicio(), p.getPeriodoFin(), p.getMeses(), p.getSalarioBase(),
					p.getMonto(), p.getEstado(), p.getFechaPago());
		}
	}
}