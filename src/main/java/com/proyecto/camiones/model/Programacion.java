package com.proyecto.camiones.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "programaciones")
public class Programacion {

    // =========================================================
    // ID
    // =========================================================

    @Id
    @GeneratedValue(
        strategy = GenerationType.SEQUENCE,
        generator = "programaciones_seq"
    )
    @SequenceGenerator(
        name = "programaciones_seq",
        sequenceName = "programaciones_id_seq",
        allocationSize = 1
    )
    @Column(name = "ID", nullable = false)
    private Integer id;


    // =========================================================
    // DATOS DEL VIAJE
    // =========================================================

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "destino_inicial", length = 150)
    private String destinoInicial;

    @Column(name = "destino_final", length = 150)
    private String destinoFinal;

    @Column(name = "placa", length = 20)
    private String placa;

    @Column(name = "motorista", length = 100)
    private String motorista;

    @Column(name = "telefono", length = 30)
    private String telefono;

    @Column(name = "estado", length = 30)
    private String estado;


    // =========================================================
    // CONSTRUCTOR VACÍO
    // =========================================================

    public Programacion() {
    }


    // =========================================================
    // CONSTRUCTOR COMPLETO
    // =========================================================

    public Programacion(
            Integer id,
            LocalDate fecha,
            String destinoInicial,
            String destinoFinal,
            String placa,
            String motorista,
            String telefono,
            String estado) {

        this.id = id;
        this.fecha = fecha;
        this.destinoInicial = destinoInicial;
        this.destinoFinal = destinoFinal;
        this.placa = placa;
        this.motorista = motorista;
        this.telefono = telefono;
        this.estado = estado;
    }


    // =========================================================
    // GETTERS Y SETTERS
    // =========================================================

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }


    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }


    public String getDestinoInicial() {
        return destinoInicial;
    }

    public void setDestinoInicial(String destinoInicial) {
        this.destinoInicial = destinoInicial;
    }


    public String getDestinoFinal() {
        return destinoFinal;
    }

    public void setDestinoFinal(String destinoFinal) {
        this.destinoFinal = destinoFinal;
    }


    public String getPlaca() {
        return placa;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }


    public String getMotorista() {
        return motorista;
    }

    public void setMotorista(String motorista) {
        this.motorista = motorista;
    }


    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }


    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}