
package com.proyecto.camiones.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.proyecto.camiones.model.Recorrido;
import com.proyecto.camiones.repository.RecorridoRepository;

@Service
public class RecorridoService {

    @Autowired
    private RecorridoRepository recorridoRepository;


    // =====================================================
    // CONSTANTES
    // =====================================================

    private static final BigDecimal ISV =
            new BigDecimal("0.15");

    private static final BigDecimal PEAJE_2_EJES =
            new BigDecimal("224.00");

    private static final BigDecimal PEAJE_3_EJES =
            new BigDecimal("269.00");


    // =====================================================
    // LISTAR TODOS
    // =====================================================

    public List<Recorrido> listarTodos() {

        return recorridoRepository
                .findAllByOrderByFechaDescIdDesc();
    }


    // =====================================================
    // BUSCAR POR ID
    // =====================================================

    public Recorrido buscarPorId(Long id) {

        if (id == null) {
            return null;
        }

        return recorridoRepository
                .findById(id)
                .orElse(null);
    }


    // =====================================================
    // GUARDAR NUEVO RECORRIDO
    // =====================================================

    public Recorrido guardar(
            Recorrido recorrido
    ) {

        if (recorrido == null) {

            throw new IllegalArgumentException(
                "El recorrido no puede ser null."
            );
        }


        // =================================================
        // CALCULAR VALORES
        // =================================================

        calcularValores(
            recorrido
        );


        // =================================================
        // GUARDAR
        // =================================================

        return recorridoRepository.save(
            recorrido
        );
    }


    // =====================================================
    // MODIFICAR RECORRIDO
    //
    // IMPORTANTE:
    //
    // NO guardamos directamente "datos".
    //
    // Primero buscamos el registro original y después
    // copiamos solamente los campos editables.
    //
    // De esta manera createdAt NO se pierde.
    // =====================================================

    public Recorrido modificar(
            Long id,
            Recorrido datos
    ) {

        if (id == null) {

            throw new IllegalArgumentException(
                "El ID del recorrido es obligatorio."
            );
        }


        if (datos == null) {

            throw new IllegalArgumentException(
                "Los datos del recorrido son obligatorios."
            );
        }


        // =================================================
        // BUSCAR REGISTRO ORIGINAL
        // =================================================

        Recorrido existente =
                recorridoRepository
                    .findById(id)
                    .orElseThrow(
                        () -> new RuntimeException(
                            "No existe el recorrido con ID: "
                            + id
                        )
                    );


        // =================================================
        // COPIAR CAMPOS EDITABLES
        // =================================================

        existente.setFecha(
            datos.getFecha()
        );


        existente.setMotorista(
            datos.getMotorista()
        );


        existente.setUnidad(
            datos.getUnidad()
        );


        existente.setEjesCamion(
            datos.getEjesCamion()
        );


        existente.setRutaDestino(
            datos.getRutaDestino()
        );


        existente.setKmRecorridos(
            datos.getKmRecorridos()
        );


        existente.setRemision(
            datos.getRemision()
        );


        existente.setBandaPorKm(
            datos.getBandaPorKm()
        );


        existente.setCantidadPeajes(
            datos.getCantidadPeajes()
        );


        // =================================================
        // NO HACER ESTO:
        //
        // existente.setCreatedAt(
        //     datos.getCreatedAt()
        // );
        //
        // Porque el frontend normalmente no manda
        // createdAt y podría sobrescribirse con null.
        //
        // Al utilizar "existente", el createdAt original
        // permanece intacto.
        // =================================================


        // =================================================
        // RECALCULAR VALORES
        // =================================================

        calcularValores(
            existente
        );


        // =================================================
        // GUARDAR EL REGISTRO EXISTENTE
        // =================================================

        return recorridoRepository.save(
            existente
        );
    }


    // =====================================================
    // ELIMINAR
    // =====================================================

    public void eliminar(
            Long id
    ) {

        if (id == null) {

            throw new IllegalArgumentException(
                "El ID del recorrido es obligatorio."
            );
        }


        if (
            recorridoRepository.existsById(id)
        ) {

            recorridoRepository.deleteById(
                id
            );

        }

        else {

            throw new RuntimeException(
                "No existe el recorrido con ID: "
                + id
            );
        }
    }


    // =====================================================
    // CALCULAR TODOS LOS VALORES
    // =====================================================

    private void calcularValores(
            Recorrido recorrido
    ) {

        // =================================================
        // KM
        // =================================================

        BigDecimal km =
                valor(
                    recorrido.getKmRecorridos()
                );


        // =================================================
        // BANDA POR KM
        // =================================================

        BigDecimal banda =
                valor(
                    recorrido.getBandaPorKm()
                );


        // =================================================
        // CANTIDAD DE PEAJES
        // =================================================

        Integer cantidadPeajes =
                recorrido.getCantidadPeajes();


        if (
            cantidadPeajes == null ||
            cantidadPeajes < 0
        ) {

            cantidadPeajes = 0;
        }


        recorrido.setCantidadPeajes(
            cantidadPeajes
        );


        // =================================================
        // SUBTOTAL
        //
        // KM × BANDA
        // =================================================

        BigDecimal subtotal =
                km.multiply(
                    banda
                )
                .setScale(
                    2,
                    RoundingMode.HALF_UP
                );


        recorrido.setSubtotal(
            subtotal
        );


        // =================================================
        // ISV
        //
        // SUBTOTAL × 15%
        // =================================================

        BigDecimal isv =
                subtotal
                    .multiply(
                        ISV
                    )
                    .setScale(
                        2,
                        RoundingMode.HALF_UP
                    );


        recorrido.setIsv(
            isv
        );


        // =================================================
        // TARIFA
        //
        // SUBTOTAL + ISV
        // =================================================

        BigDecimal tarifa =
                subtotal
                    .add(
                        isv
                    )
                    .setScale(
                        2,
                        RoundingMode.HALF_UP
                    );


        recorrido.setTarifa(
            tarifa
        );


        // =================================================
        // VALOR DEL PEAJE
        //
        // 2 EJES = L 224.00
        // 3 EJES = L 269.00
        // =================================================

        BigDecimal valorPeaje =
                BigDecimal.ZERO;


        Integer ejes =
                recorrido.getEjesCamion();


        if (ejes != null) {

            if (ejes == 2) {

                valorPeaje =
                    PEAJE_2_EJES;
            }

            else if (ejes == 3) {

                valorPeaje =
                    PEAJE_3_EJES;
            }
        }


        recorrido.setValorPeaje(
            valorPeaje
        );


        // =================================================
        // TOTAL DE PEAJES
        //
        // CANTIDAD × VALOR
        // =================================================

        BigDecimal totalPeajes =
                valorPeaje
                    .multiply(
                        BigDecimal.valueOf(
                            cantidadPeajes
                        )
                    )
                    .setScale(
                        2,
                        RoundingMode.HALF_UP
                    );


        recorrido.setTotalPeajes(
            totalPeajes
        );
    }


    // =====================================================
    // EVITAR NULL EN BIGDECIMAL
    // =====================================================

    private BigDecimal valor(
            BigDecimal numero
    ) {

        if (numero == null) {

            return BigDecimal.ZERO;
        }


        return numero;
    }
}