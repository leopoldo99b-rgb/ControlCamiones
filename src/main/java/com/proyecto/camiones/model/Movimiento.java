package com.proyecto.camiones.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "movimientos")
public class Movimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pieza_id", nullable = false, updatable = false)
    private Pieza pieza;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10, updatable = false)
    private TipoMovimiento tipo;

    @Column(nullable = false, updatable = false)
    private LocalDate fecha;

    @Column(nullable = false, updatable = false)
    private Integer cantidad;

    // En una SALIDA el trigger reemplaza este valor por el costo promedio vigente.
    @Column(name = "costo_unitario", nullable = false, updatable = false, precision = 12, scale = 4)
    private BigDecimal costoUnitario;

    // Columna generada por PostgreSQL (cantidad * costo_unitario): solo lectura.
    @Column(insertable = false, updatable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @Column(length = 150, updatable = false)
    private String referencia;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String notas;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private OffsetDateTime creadoEn;

    @PrePersist
    void antesDeCrear() {
        creadoEn = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public Pieza getPieza() { return pieza; }
    public void setPieza(Pieza pieza) { this.pieza = pieza; }
    public TipoMovimiento getTipo() { return tipo; }
    public void setTipo(TipoMovimiento tipo) { this.tipo = tipo; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public BigDecimal getCostoUnitario() { return costoUnitario; }
    public void setCostoUnitario(BigDecimal costoUnitario) { this.costoUnitario = costoUnitario; }
    public BigDecimal getTotal() { return total; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
}
