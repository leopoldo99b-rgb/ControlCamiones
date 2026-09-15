package dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AbastecimientoRequest {

    private LocalDateTime fecha;

    private String placa;

    private String motorista;

    private String destino;

    private BigDecimal kmRuta;

    private BigDecimal galonesAutorizados;

    // ============================================================
    // GASOLINERA
    // ============================================================

    private String gasolinera;

    private Long combustibleId;

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    public AbastecimientoRequest() {
    }

    // ============================================================
    // GETTERS
    // ============================================================

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

    public Long getCombustibleId() {
        return combustibleId;
    }

    // ============================================================
    // SETTERS
    // ============================================================

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

    public void setCombustibleId(Long combustibleId) {
        this.combustibleId = combustibleId;
    }
}