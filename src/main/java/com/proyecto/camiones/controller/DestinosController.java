package com.proyecto.camiones.controller;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.proyecto.camiones.model.Camion;
import com.proyecto.camiones.model.Conductor;
import com.proyecto.camiones.model.Furgon;
import com.proyecto.camiones.model.Recorrido;
import com.proyecto.camiones.repository.ConductorRepository;
import com.proyecto.camiones.services.CamionService;
import com.proyecto.camiones.services.FurgonService;
import com.proyecto.camiones.services.RecorridoService;

@Controller
public class DestinosController {

    // =====================================================
    // SERVICIOS / REPOSITORIES
    // =====================================================

    @Autowired
    private CamionService camionService;

    @Autowired
    private ConductorRepository conductorRepository;

    @Autowired
    private RecorridoService recorridoService;

    @Autowired
    private FurgonService furgonService;


    // =====================================================
    // ABRIR PÁGINA DESTINOS
    //
    // GET /viajes2
    // =====================================================

    @GetMapping("/viajes2")
    public String mostrarDestinos() {

        return "Destinos";
    }


    // =====================================================
    // CONDUCTORES ACTIVOS
    //
    // GET /viajes2/conductores
    // =====================================================

    @GetMapping("/viajes2/conductores")
    @ResponseBody
    public List<Conductor> listarConductores() {

        try {

            return conductorRepository
                    .findAll()
                    .stream()
                    .filter(c ->
                        c.getEstado() != null &&
                        "ACTIVO".equalsIgnoreCase(
                            c.getEstado().trim()
                        )
                    )
                    .toList();

        } catch (Exception e) {

            e.printStackTrace();

            return new ArrayList<>();
        }
    }


    // =====================================================
    // CAMIONES DISPONIBLES
    //
    // GET /viajes2/camiones
    // =====================================================

    @GetMapping("/viajes2/camiones")
    @ResponseBody
    public List<Camion> listarCamiones() {

        try {

            return camionService
                    .listarTodos()
                    .stream()
                    .filter(c ->
                        c.getEstado() != null &&
                        "DISPONIBLE".equalsIgnoreCase(
                            c.getEstado().trim()
                        )
                    )
                    .toList();

        } catch (Exception e) {

            e.printStackTrace();

            return new ArrayList<>();
        }
    }


    // =====================================================
    // LISTAR RECORRIDOS
    //
    // GET /api/recorridos
    // =====================================================

    @GetMapping("/api/recorridos")
    @ResponseBody
    public ResponseEntity<List<Recorrido>> listarRecorridos() {

        try {

            List<Recorrido> recorridos =
                    recorridoService.listarTodos();

            return ResponseEntity.ok(recorridos);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(new ArrayList<>());
        }
    }


    // =====================================================
    // BUSCAR RECORRIDO POR ID
    //
    // GET /api/recorridos/{id}
    // =====================================================

    @GetMapping("/api/recorridos/{id}")
    @ResponseBody
    public ResponseEntity<?> buscarRecorrido(
            @PathVariable Long id
    ) {

        try {

            if (id == null || id <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "El ID del recorrido no es válido."
                        );
            }

            Recorrido recorrido =
                    recorridoService.buscarPorId(id);

            if (recorrido == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            return ResponseEntity.ok(recorrido);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                        "Error al buscar recorrido: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // GUARDAR RECORRIDO
    //
    // POST /api/recorridos
    // =====================================================

    @PostMapping("/api/recorridos")
    @ResponseBody
    public ResponseEntity<?> guardarRecorrido(
            @RequestBody Recorrido recorrido
    ) {

        try {

            ResponseEntity<?> error =
                    validarRecorrido(recorrido);

            if (error != null) {

                return error;
            }

            Recorrido guardado =
                    recorridoService.guardar(recorrido);

            return ResponseEntity.ok(guardado);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                        "Error al guardar el recorrido: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // ACTUALIZAR RECORRIDO
    //
    // PUT /api/recorridos/{id}
    // =====================================================

    @PutMapping("/api/recorridos/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarRecorrido(
            @PathVariable Long id,
            @RequestBody Recorrido recorrido
    ) {

        try {

            if (id == null || id <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "El ID del recorrido es obligatorio."
                        );
            }

            Recorrido existente =
                    recorridoService.buscarPorId(id);

            if (existente == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            ResponseEntity<?> error =
                    validarRecorrido(recorrido);

            if (error != null) {

                return error;
            }

            Recorrido actualizado =
                    recorridoService.modificar(
                        id,
                        recorrido
                    );

            return ResponseEntity.ok(actualizado);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                        "Error al actualizar el recorrido: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // ELIMINAR RECORRIDO
    //
    // DELETE /api/recorridos/{id}
    // =====================================================

    @DeleteMapping("/api/recorridos/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarRecorrido(
            @PathVariable Long id
    ) {

        try {

            if (id == null || id <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "El ID del recorrido no es válido."
                        );
            }

            Recorrido existente =
                    recorridoService.buscarPorId(id);

            if (existente == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            recorridoService.eliminar(id);

            return ResponseEntity.ok(
                "Recorrido eliminado correctamente."
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                        "Error al eliminar el recorrido: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // FURGONES
    //
    // GET /api/furgones
    // =====================================================

    @GetMapping("/api/furgones")
    @ResponseBody
    public ResponseEntity<?> listarFurgones() {

        try {

            List<Furgon> furgones =
                    furgonService.listarTodos();

            return ResponseEntity.ok(furgones);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                        "Error al cargar los furgones: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // GUARDAR FURGÓN
    //
    // POST /api/furgones
    // =====================================================

    @PostMapping("/api/furgones")
    @ResponseBody
    public ResponseEntity<?> guardarFurgon(
            @RequestBody Furgon furgon
    ) {

        try {

            // -------------------------------------------------
            // VALIDAR OBJETO
            // -------------------------------------------------

            if (furgon == null) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "Los datos del furgón son obligatorios."
                        );
            }


            // -------------------------------------------------
            // VALIDAR NÚMERO / PLACA
            // -------------------------------------------------

            if (
                furgon.getFurgon() == null ||
                furgon.getFurgon().trim().isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "La placa o código del furgón es obligatorio."
                        );
            }


            // -------------------------------------------------
            // NORMALIZAR
            // -------------------------------------------------

            String numeroFurgon =
                    furgon.getFurgon()
                          .trim()
                          .toUpperCase();

            furgon.setFurgon(numeroFurgon);


            // -------------------------------------------------
            // VALIDAR EJES
            // -------------------------------------------------

            if (furgon.getEjes() == null) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "La cantidad de ejes es obligatoria."
                        );
            }


            if (
                furgon.getEjes() != 2 &&
                furgon.getEjes() != 3
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "Los ejes deben ser 2 o 3."
                        );
            }


            // -------------------------------------------------
            // VERIFICAR DUPLICADO
            // -------------------------------------------------

            Furgon existente =
                    furgonService.buscarPorFurgon(
                        numeroFurgon
                    );

            if (existente != null) {

                return ResponseEntity
                        .badRequest()
                        .body(
                            "El furgón "
                            + numeroFurgon
                            + " ya existe."
                        );
            }


            // -------------------------------------------------
            // GUARDAR
            // -------------------------------------------------

            Furgon guardado =
                    furgonService.guardar(furgon);


            // -------------------------------------------------
            // RESPUESTA
            // -------------------------------------------------

            return ResponseEntity.ok(guardado);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                        "Error al guardar el furgón: "
                        + obtenerMensajeError(e)
                    );
        }
    }


    // =====================================================
    // VALIDAR RECORRIDO
    // =====================================================

    private ResponseEntity<?> validarRecorrido(
            Recorrido recorrido
    ) {

        // -------------------------------------------------
        // OBJETO
        // -------------------------------------------------

        if (recorrido == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los datos del recorrido son obligatorios."
                    );
        }


        // -------------------------------------------------
        // FECHA
        // -------------------------------------------------

        if (recorrido.getFecha() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "La fecha es obligatoria."
                    );
        }


        // -------------------------------------------------
        // MOTORISTA
        // -------------------------------------------------

        if (
            recorrido.getMotorista() == null ||
            recorrido.getMotorista().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "El motorista es obligatorio."
                    );
        }


        // -------------------------------------------------
        // EJES
        // -------------------------------------------------

        if (recorrido.getEjesCamion() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los ejes del camión son obligatorios."
                    );
        }


        if (
            recorrido.getEjesCamion() != 2 &&
            recorrido.getEjesCamion() != 3
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los ejes del camión deben ser 2 o 3."
                    );
        }


        // -------------------------------------------------
        // RUTA / DESTINO
        // -------------------------------------------------

        if (
            recorrido.getRutaDestino() == null ||
            recorrido.getRutaDestino().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "La ruta o destino es obligatorio."
                    );
        }


        // -------------------------------------------------
        // KILÓMETROS
        // -------------------------------------------------

        if (recorrido.getKmRecorridos() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los kilómetros son obligatorios."
                    );
        }


        if (
            recorrido.getKmRecorridos()
                     .compareTo(BigDecimal.ZERO) < 0
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Los kilómetros no pueden ser negativos."
                    );
        }


        // -------------------------------------------------
        // BANDA POR KM
        // -------------------------------------------------

        if (recorrido.getBandaPorKm() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "La banda por KM es obligatoria."
                    );
        }


        if (
            recorrido.getBandaPorKm()
                     .compareTo(BigDecimal.ZERO) <= 0
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "La banda por KM debe ser mayor que 0."
                    );
        }


        // -------------------------------------------------
        // PEAJES
        // -------------------------------------------------

        if (recorrido.getCantidadPeajes() == null) {

            recorrido.setCantidadPeajes(0);
        }


        if (recorrido.getCantidadPeajes() < 0) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "La cantidad de peajes no puede ser negativa."
                    );
        }


        return null;
    }


    // =====================================================
    // OBTENER MENSAJE REAL DEL ERROR
    // =====================================================

    private String obtenerMensajeError(
            Exception e
    ) {

        Throwable causa = e;

        String mensaje = e.getMessage();


        while (causa.getCause() != null) {

            causa = causa.getCause();

            if (
                causa.getMessage() != null &&
                !causa.getMessage().isBlank()
            ) {

                mensaje = causa.getMessage();
            }
        }


        if (
            mensaje == null ||
            mensaje.isBlank()
        ) {

            return "Error desconocido.";
        }


        return mensaje;
    }
}