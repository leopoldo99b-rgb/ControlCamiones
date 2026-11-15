package com.proyecto.camiones.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "abastecimientos")
public class Abastecimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false, length = 20)
    private String placa;

    @Column(nullable = false, length = 150)
    private String motorista;

    @Column(nullable = false, length = 150)
    private String destino;

    @Column(name = "km_ruta", nullable = false, precision = 10, scale = 2)
    private BigDecimal kmRuta;

    @Column(name = "galones_autorizados", nullable = false, precision = 10, scale = 2)
    private BigDecimal galonesAutorizados;

    /**
     * Gasolinera donde se realizó el abastecimiento.
     *
     * Valores esperados:
     * Shell
     * Texaco
     * Puma
     * UNO
     * Otra
     */
    @Column(nullable = false, length = 150)
    private String gasolinera;

    // El @JsonIgnoreProperties evita el error de serializacion
    // con los proxies LAZY de Hibernate al listar.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combustible_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Combustible combustible;

    /**
     * IMPORTANTE:
     * Este precio es una copia histórica.
     * No debe depender del precio actual de Combustible.
     */
    @Column(name = "precio_galon", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioGalon;

    /**
     * Normalmente galones autorizados × precio por galón.
     * Puede ser un valor distinto si la factura no coincide
     * (total editado manualmente).
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;


    // =========================================================
    // CICLO DE VIDA JPA
    // =========================================================

    @PrePersist
    protected void onCreate() {

        if (fecha == null) {
            fecha = LocalDateTime.now();
        }

        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }

        calcularTotal();
    }


    @PreUpdate
    protected void onUpdate() {
        calcularTotal();
    }


    // =========================================================
    // CÁLCULO DEL TOTAL
    // Solo calcula si el total viene vacío; así se respeta
    // el total que se editó a mano.
    // =========================================================

    private void calcularTotal() {

        if (total == null && galonesAutorizados != null && precioGalon != null) {
            total = galonesAutorizados
                    .multiply(precioGalon)
                    .setScale(2, RoundingMode.HALF_UP);
        }
    }


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public Abastecimiento() {
    }


    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public String getPlaca() {
        return placa;
    }

    public String getMotorista() {
        return motorista;
    }

    public String getDestino() {
        return destino;
    }

    public BigDecimal getKmRuta() {
        return kmRuta;
    }

    public BigDecimal getGalonesAutorizados() {
        return galonesAutorizados;
    }

    public String getGasolinera() {
        return gasolinera;
    }

    public Combustible getCombustible() {
        return combustible;
    }

    public BigDecimal getPrecioGalon() {
        return precioGalon;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }


    // =========================================================
    // SETTERS
    // =========================================================

    public void setId(Long id) {
        this.id = id;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }

    public void setMotorista(String motorista) {
        this.motorista = motorista;
    }

    public void setDestino(String destino) {
        this.destino = destino;
    }

    public void setKmRuta(BigDecimal kmRuta) {
        this.kmRuta = kmRuta;
    }

    public void setGalonesAutorizados(BigDecimal galonesAutorizados) {
        this.galonesAutorizados = galonesAutorizados;
    }

    public void setGasolinera(String gasolinera) {
        this.gasolinera = gasolinera;
    }

    public void setCombustible(Combustible combustible) {
        this.combustible = combustible;
    }

    public void setPrecioGalon(BigDecimal precioGalon) {
        this.precioGalon = precioGalon;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}