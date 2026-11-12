package com.proyecto.camiones.services;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.camiones.model.Abastecimiento;
import com.proyecto.camiones.model.Combustible;
import com.proyecto.camiones.model.Destino;                       // <-- AJUSTAR si tu entidad tiene otro nombre/paquete
import com.proyecto.camiones.model.Programacion;
import com.proyecto.camiones.repository.AbastecimientoRepository;
import com.proyecto.camiones.repository.CombustibleRepository;
import com.proyecto.camiones.repository.DestinoRepository;      // <-- AJUSTAR
import com.proyecto.camiones.repository.ProgramacionRepository;

import dto.AbastecimientoRequest;

@Service
@Transactional
public class ProgramacionService {

    private final ProgramacionRepository programacionRepository;
    private final AbastecimientoService abastecimientoService;
    private final AbastecimientoRepository abastecimientoRepository;
    private final CombustibleRepository combustibleRepository;
    private final DestinoRepository destinoRepository;

    public ProgramacionService(
            ProgramacionRepository programacionRepository,
            AbastecimientoService abastecimientoService,
            AbastecimientoRepository abastecimientoRepository,
            CombustibleRepository combustibleRepository,
            DestinoRepository destinoRepository) {

        this.programacionRepository = programacionRepository;
        this.abastecimientoService = abastecimientoService;
        this.abastecimientoRepository = abastecimientoRepository;
        this.combustibleRepository = combustibleRepository;
        this.destinoRepository = destinoRepository;
    }

    // =========================================================
    // CONSULTAS
    // =========================================================

    @Transactional(readOnly = true)
    public List<Programacion> listarTodas() {
        return programacionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Programacion> buscarPorId(Integer id) {
        return programacionRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public boolean existe(Integer id) {
        return programacionRepository.existsById(id);
    }

    @Transactional(readOnly = true)
    public long contar() {
        return programacionRepository.count();
    }

    // =========================================================
    // GUARDAR (viaje nuevo + combustible automático)
    // =========================================================

    public Programacion guardar(Programacion programacion) {

        Long combustibleId = programacion.getCombustibleId();
        String gasolinera = programacion.getGasolinera();

        programacion.setAbastecimientoId(null);

        Programacion guardada = programacionRepository.save(programacion);

        String aviso = sincronizarCombustible(guardada, combustibleId, gasolinera);

        guardada = programacionRepository.save(guardada);
        guardada.setAvisoCombustible(aviso);
        return guardada;
    }

    // =========================================================
    // ACTUALIZAR (mantiene el combustible del viaje al día)
    // =========================================================

    public Programacion actualizar(Programacion programacion) {

        Long combustibleId = programacion.getCombustibleId();
        String gasolinera = programacion.getGasolinera();

        // El vínculo vive en la BD; el formulario no lo envía.
        Optional<Programacion> existente = programacionRepository.findById(programacion.getId());
        existente.ifPresent(e -> programacion.setAbastecimientoId(e.getAbastecimientoId()));

        Programacion guardada = programacionRepository.save(programacion);

        String aviso = sincronizarCombustible(guardada, combustibleId, gasolinera);

        guardada = programacionRepository.save(guardada);
        guardada.setAvisoCombustible(aviso);
        return guardada;
    }

    // =========================================================
    // ELIMINAR (también elimina su abastecimiento)
    // =========================================================

    public void eliminar(Integer id) {

        Optional<Programacion> existente = programacionRepository.findById(id);

        if (existente.isPresent()) {
            eliminarAbastecimientoVinculado(existente.get());
        }

        programacionRepository.deleteById(id);
    }

    // =========================================================
    // LÓGICA DE SINCRONIZACIÓN
    // =========================================================

    /**
     * Crea, actualiza o elimina el abastecimiento del viaje.
     * Nunca lanza excepción por datos faltantes: el viaje siempre
     * se guarda, y el resultado se informa con un mensaje.
     *
     * @return mensaje para mostrar en pantalla (null si todo salió bien)
     */
    private String sincronizarCombustible(
            Programacion viaje,
            Long combustibleIdSolicitado,
            String gasolineraSolicitada) {

        // ---- Viaje cancelado: no debe consumir combustible ----
        if ("CANCELADO".equalsIgnoreCase(viaje.getEstado())) {

            boolean tenia = viaje.getAbastecimientoId() != null;
            eliminarAbastecimientoVinculado(viaje);

            return tenia
                    ? "Viaje cancelado: se eliminó su abastecimiento de combustible."
                    : null;
        }

        // ---- Datos mínimos del viaje ----
        if (vacio(viaje.getPlaca()) || vacio(viaje.getMotorista())) {
            return "No se generó el combustible: falta la placa o el motorista.";
        }

        // ---- Destino con km y galones prescritos ----
        Destino destino = buscarDestino(viaje.getDestinoFinal());

        if (destino == null) {
            return "No se generó el combustible: el destino \""
                    + nz(viaje.getDestinoFinal())
                    + "\" no tiene km ni galones registrados en Destinos.";
        }

        BigDecimal km = aDecimal(destino.getKm());
        BigDecimal galones = aDecimal(destino.getGalones());

        if (galones == null || galones.compareTo(BigDecimal.ZERO) <= 0) {
            return "No se generó el combustible: el destino \""
                    + destino.getDestino() + "\" no tiene galones definidos.";
        }

        if (km == null) {
            km = BigDecimal.ZERO;
        }

        // ---- Abastecimiento actual (si ya existía) ----
        Abastecimiento actual = null;

        if (viaje.getAbastecimientoId() != null) {
            actual = abastecimientoRepository.findById(viaje.getAbastecimientoId()).orElse(null);
            if (actual == null) {
                viaje.setAbastecimientoId(null);   // lo borraron desde Combustible
            }
        }

        // ---- Combustible ----
        Combustible combustible = resolverCombustible(combustibleIdSolicitado, actual);

        if (combustible == null) {
            return "No se generó el combustible: no hay un combustible activo con precio.";
        }

        // ---- Gasolinera ----
        String gasolinera = resolverGasolinera(gasolineraSolicitada, actual);

        // ---- Fecha ----
        LocalDate fecha = viaje.getFecha();
        LocalDateTime fechaHora = fecha != null ? fecha.atStartOfDay() : LocalDateTime.now();

        String nombreDestino = destino.getDestino().trim();

        // =====================================================
        // YA EXISTE: actualizar sin tocar el precio histórico
        // si el combustible y la ruta siguen igual
        // =====================================================
        if (actual != null) {

            boolean mismaRuta =
                    nombreDestino.equalsIgnoreCase(nz(actual.getDestino()).trim())
                    && comparar(km, actual.getKmRuta())
                    && comparar(galones, actual.getGalonesAutorizados());

            boolean mismoCombustible =
                    actual.getCombustible() != null
                    && actual.getCombustible().getId().equals(combustible.getId());

            if (mismaRuta && mismoCombustible) {

                actual.setFecha(fechaHora);
                actual.setPlaca(viaje.getPlaca().trim());
                actual.setMotorista(viaje.getMotorista().trim());
                actual.setGasolinera(gasolinera);
                abastecimientoRepository.save(actual);   // el total se recalcula solo

                return null;
            }

            // La ruta o el combustible cambiaron: se vuelve a calcular
            Abastecimiento actualizado = abastecimientoService.actualizar(
                    actual.getId(),
                    construirRequest(fechaHora, viaje, nombreDestino, km, galones, gasolinera, combustible));

            viaje.setAbastecimientoId(actualizado.getId());

            return "Combustible actualizado con el precio vigente de hoy.";
        }

        // =====================================================
        // NO EXISTE: crear
        // =====================================================
        Abastecimiento nuevo = abastecimientoService.crear(
                construirRequest(fechaHora, viaje, nombreDestino, km, galones, gasolinera, combustible));

        viaje.setAbastecimientoId(nuevo.getId());

        return mensajeCreacion(gasolineraSolicitada);
    }

    private String mensajeCreacion(String gasolineraSolicitada) {
        return vacio(gasolineraSolicitada)
                ? "Combustible registrado automáticamente. La gasolinera quedó como \"Otra\"; "
                  + "puede corregirla en Control de Combustible."
                : null;
    }

    private AbastecimientoRequest construirRequest(
            LocalDateTime fecha, Programacion viaje, String destino,
            BigDecimal km, BigDecimal galones, String gasolinera, Combustible combustible) {

        AbastecimientoRequest r = new AbastecimientoRequest();
        r.setFecha(fecha);
        r.setPlaca(viaje.getPlaca().trim());
        r.setMotorista(viaje.getMotorista().trim());
        r.setDestino(destino);
        r.setKmRuta(km);
        r.setGalonesAutorizados(galones);
        r.setGasolinera(gasolinera);
        r.setCombustibleId(combustible.getId());
        return r;
    }

    private void eliminarAbastecimientoVinculado(Programacion viaje) {

        Long id = viaje.getAbastecimientoId();

        if (id == null) {
            return;
        }

        if (abastecimientoRepository.existsById(id)) {
            abastecimientoService.eliminar(id);
        }

        viaje.setAbastecimientoId(null);
    }

    // =========================================================
    // RESOLUCIÓN DE DATOS
    // =========================================================

    private Combustible resolverCombustible(Long idSolicitado, Abastecimiento actual) {

        Long id = idSolicitado;

        if (id == null && actual != null && actual.getCombustible() != null) {
            id = actual.getCombustible().getId();
        }

        if (id != null) {
            Combustible c = combustibleRepository.findById(id).orElse(null);
            return utilizable(c) ? c : null;
        }

        // Sin selección: Diésel activo (flota de carga pesada)
        return combustibleRepository.findAll().stream()
                .filter(this::utilizable)
                .filter(c -> normalizar(c.getNombre()).contains("diesel"))
                .findFirst()
                .orElse(null);
    }

    private boolean utilizable(Combustible c) {
        return c != null
                && Boolean.TRUE.equals(c.getActivo())
                && c.getPrecioGalon() != null;
    }

    private String resolverGasolinera(String solicitada, Abastecimiento actual) {

        if (!vacio(solicitada)) {
            return solicitada.trim();
        }

        if (actual != null && !vacio(actual.getGasolinera())) {
            return actual.getGasolinera();
        }

        return "Otra";
    }

    /**
     * Une el "Destino final" del viaje (que viene del catálogo de rutas,
     * por ejemplo "San Pedro Sula - Siguatepeque") con el destino que
     * tiene los km y galones (por ejemplo "Siguatepeque").
     */
    private Destino buscarDestino(String nombreViaje) {

        if (vacio(nombreViaje)) {
            return null;
        }

        String buscado = normalizar(nombreViaje);
        List<Destino> destinos = destinoRepository.findAll();

        // 1) Coincidencia exacta
        for (Destino d : destinos) {
            if (normalizar(d.getDestino()).equals(buscado)) {
                return d;
            }
        }

        // 2) Último tramo de la ruta: "A - B" -> "B"
        String[] partes = buscado.split("\\s*[-–→>]\\s*");
        String ultimo = partes[partes.length - 1].trim();

        for (Destino d : destinos) {
            if (normalizar(d.getDestino()).equals(ultimo)) {
                return d;
            }
        }

        // 3) El nombre del destino aparece dentro de la ruta (gana el más largo)
        Destino mejor = null;

        for (Destino d : destinos) {
            String n = normalizar(d.getDestino());
            if (!n.isEmpty() && buscado.contains(n)
                    && (mejor == null || n.length() > normalizar(mejor.getDestino()).length())) {
                mejor = d;
            }
        }

        return mejor;
    }

    // =========================================================
    // UTILIDADES
    // =========================================================

    private boolean vacio(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String nz(String s) {
        return s == null ? "" : s;
    }

    private String normalizar(String s) {
        if (s == null) {
            return "";
        }
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase();
    }

    /** Acepta Double, BigDecimal, Integer... sin importar cómo esté tipada la entidad Destino. */
    private BigDecimal aDecimal(Object valor) {
        if (valor == null) {
            return null;
        }
        try {
            return new BigDecimal(String.valueOf(valor));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean comparar(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) {
            return a == b;
        }
        return a.compareTo(b) == 0;
    }
}