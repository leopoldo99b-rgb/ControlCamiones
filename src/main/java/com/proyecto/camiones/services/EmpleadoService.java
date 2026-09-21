package com.proyecto.camiones.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.camiones.model.Empleado;
import com.proyecto.camiones.repository.EmpleadoRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;

    public EmpleadoService(EmpleadoRepository empleadoRepository) {
        this.empleadoRepository = empleadoRepository;
    }

    // ==========================================
    // LISTAR TODOS
    // ==========================================

    @Transactional(readOnly = true)
    public List<Empleado> listarTodos() {
        return empleadoRepository.findAll();
    }

    // ==========================================
    // BUSCAR POR ID
    // ==========================================

    @Transactional(readOnly = true)
    public Empleado buscarPorId(Long id) {

        return empleadoRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Empleado no encontrado con ID: " + id
                        )
                );
    }

    // ==========================================
    // BUSCAR POR IDENTIDAD
    // ==========================================

    @Transactional(readOnly = true)
    public Empleado buscarPorIdentidad(String identidad) {

        return empleadoRepository.findByIdentidad(identidad)
                .orElseThrow(() ->
                        new RuntimeException(
                                "No existe un empleado con identidad: "
                                        + identidad
                        )
                );
    }

    // ==========================================
    // GUARDAR
    // ==========================================

    public Empleado guardar(Empleado empleado) {

        validarEmpleado(empleado);

        // Si es nuevo
        if (empleado.getId() == null) {

            if (empleadoRepository.existsByIdentidad(
                    empleado.getIdentidad())) {

                throw new RuntimeException(
                        "Ya existe un empleado con la identidad: "
                                + empleado.getIdentidad()
                );
            }

            if (empleado.getEstado() == null ||
                    empleado.getEstado().isBlank()) {

                empleado.setEstado("ACTIVO");
            }

            if (empleado.getTipoSalario() == null ||
                    empleado.getTipoSalario().isBlank()) {

                empleado.setTipoSalario("MENSUAL");
            }
        }

        return empleadoRepository.save(empleado);
    }

    // ==========================================
    // ACTUALIZAR
    // ==========================================

    public Empleado actualizar(Long id, Empleado datos) {

        Empleado empleado = buscarPorId(id);

        // Verificar que la identidad no pertenezca
        // a otro empleado
        if (!empleado.getIdentidad().equals(datos.getIdentidad())
                && empleadoRepository.existsByIdentidad(
                        datos.getIdentidad())) {

            throw new RuntimeException(
                    "La identidad ya pertenece a otro empleado."
            );
        }

        empleado.setIdentidad(datos.getIdentidad());
        empleado.setNombreCompleto(datos.getNombreCompleto());
        empleado.setTelefono(datos.getTelefono());
        empleado.setFechaContratacion(
                datos.getFechaContratacion()
        );
        empleado.setCargo(datos.getCargo());
        empleado.setTipoSalario(datos.getTipoSalario());
        empleado.setSalario(datos.getSalario());
        empleado.setBanco(datos.getBanco());
        empleado.setNumeroCuenta(datos.getNumeroCuenta());

        // Detectar cambio de estado
        if (!empleado.getEstado().equals(datos.getEstado())) {

            empleado.setEstado(datos.getEstado());

            empleado.setFechaCambioEstado(
                    datos.getFechaCambioEstado() != null
                            ? datos.getFechaCambioEstado()
                            : java.time.LocalDate.now()
            );

            empleado.setObservacionEstado(
                    datos.getObservacionEstado()
            );

        } else {

            empleado.setEstado(datos.getEstado());
            empleado.setFechaCambioEstado(
                    datos.getFechaCambioEstado()
            );
            empleado.setObservacionEstado(
                    datos.getObservacionEstado()
            );
        }

        validarEmpleado(empleado);

        return empleadoRepository.save(empleado);
    }

    // ==========================================
    // ELIMINAR
    // ==========================================

    public void eliminar(Long id) {

        if (!empleadoRepository.existsById(id)) {
            throw new RuntimeException(
                    "No existe el empleado con ID: " + id
            );
        }

        empleadoRepository.deleteById(id);
    }

    // ==========================================
    // FILTRAR POR ESTADO
    // ==========================================

    @Transactional(readOnly = true)
    public List<Empleado> listarPorEstado(String estado) {

        return empleadoRepository.findByEstado(
                estado.toUpperCase()
        );
    }

    // ==========================================
    // BUSCAR POR NOMBRE
    // ==========================================

    @Transactional(readOnly = true)
    public List<Empleado> buscarPorNombre(String nombre) {

        return empleadoRepository
                .findByNombreCompletoContainingIgnoreCase(nombre);
    }

    // ==========================================
    // CONTAR EMPLEADOS
    // ==========================================

    @Transactional(readOnly = true)
    public long contarEmpleados() {

        return empleadoRepository.count();
    }

    // ==========================================
    // CONTAR ACTIVOS
    // ==========================================

    @Transactional(readOnly = true)
    public long contarActivos() {

        return empleadoRepository.findByEstado("ACTIVO")
                .size();
    }

    // ==========================================
    // NÓMINA MENSUAL
    // ==========================================

    @Transactional(readOnly = true)
    public BigDecimal calcularNominaMensual() {

        List<Empleado> empleados =
                empleadoRepository.findByEstado("ACTIVO");

        BigDecimal total = BigDecimal.ZERO;

        for (Empleado empleado : empleados) {

            BigDecimal salario = empleado.getSalario();

            if (salario == null) {
                continue;
            }

            switch (empleado.getTipoSalario().toUpperCase()) {

                case "MENSUAL":
                    total = total.add(salario);
                    break;

                case "QUINCENAL":
                    total = total.add(
                            salario.multiply(
                                    BigDecimal.valueOf(2)
                            )
                    );
                    break;

                case "SEMANAL":
                    total = total.add(
                            salario
                                    .multiply(BigDecimal.valueOf(52))
                                    .divide(
                                            BigDecimal.valueOf(12),
                                            2,
                                            java.math.RoundingMode.HALF_UP
                                    )
                    );
                    break;

                case "DIARIO":
                    total = total.add(
                            salario.multiply(
                                    BigDecimal.valueOf(30)
                            )
                    );
                    break;
            }
        }

        return total;
    }
    
    // ==========================================
    // VALIDACIONES
    // ==========================================

    private void validarEmpleado(Empleado empleado) {

        if (empleado.getIdentidad() == null ||
                empleado.getIdentidad().isBlank()) {

            throw new RuntimeException(
                    "La identidad es obligatoria."
            );
        }

        if (empleado.getNombreCompleto() == null ||
                empleado.getNombreCompleto().isBlank()) {

            throw new RuntimeException(
                    "El nombre completo es obligatorio."
            );
        }

        if (empleado.getFechaContratacion() == null) {

            throw new RuntimeException(
                    "La fecha de contratación es obligatoria."
            );
        }

        if (empleado.getCargo() == null ||
                empleado.getCargo().isBlank()) {

            throw new RuntimeException(
                    "El cargo es obligatorio."
            );
        }

        if (empleado.getSalario() == null ||
                empleado.getSalario().compareTo(
                        BigDecimal.ZERO
                ) < 0) {

            throw new RuntimeException(
                    "El salario no puede ser negativo."
            );
        }

        if (empleado.getBanco() == null ||
                empleado.getBanco().isBlank()) {

            throw new RuntimeException(
                    "El banco es obligatorio."
            );
        }

        if (empleado.getNumeroCuenta() == null ||
                empleado.getNumeroCuenta().isBlank()) {

            throw new RuntimeException(
                    "El número de cuenta es obligatorio."
            );
        }

        if (empleado.getTipoSalario() == null ||
                !esTipoSalarioValido(
                        empleado.getTipoSalario()
                )) {

            throw new RuntimeException(
                    "Tipo de salario inválido."
            );
        }

        if (empleado.getEstado() == null ||
                !esEstadoValido(
                        empleado.getEstado()
                )) {

            throw new RuntimeException(
                    "Estado de empleado inválido."
            );
        }
    }

    private boolean esTipoSalarioValido(String tipo) {

        return tipo.equalsIgnoreCase("MENSUAL")
                || tipo.equalsIgnoreCase("QUINCENAL")
                || tipo.equalsIgnoreCase("SEMANAL")
                || tipo.equalsIgnoreCase("DIARIO");
    }

    private boolean esEstadoValido(String estado) {

        return estado.equalsIgnoreCase("ACTIVO")
                || estado.equalsIgnoreCase("INACTIVO")
                || estado.equalsIgnoreCase("DESPEDIDO")
                || estado.equalsIgnoreCase("RETIRADO");
    }
}