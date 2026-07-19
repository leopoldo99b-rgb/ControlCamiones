package dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class MantenimientoDTO {

    private Long id;

    private String placa;

    private LocalDate fecha;

    private String tipo;

    private String taller;

    private Integer kilometraje;

    private BigDecimal costo;

    private String estado;

    private Integer proximoMantenimiento;

    private LocalDate proximaFecha;


    public MantenimientoDTO() {
    }


    public MantenimientoDTO(
            Long id,
            String placa,
            LocalDate fecha,
            String tipo,
            String taller,
            Integer kilometraje,
            BigDecimal costo,
            String estado,
            Integer proximoMantenimiento,
            LocalDate proximaFecha
    ){

        this.id = id;
        this.placa = placa;
        this.fecha = fecha;
        this.tipo = tipo;
        this.taller = taller;
        this.kilometraje = kilometraje;
        this.costo = costo;
        this.estado = estado;
        this.proximoMantenimiento = proximoMantenimiento;
        this.proximaFecha = proximaFecha;

    }


    public Long getId(){
        return id;
    }


    public String getPlaca(){
        return placa;
    }


    public LocalDate getFecha(){
        return fecha;
    }


    public String getTipo(){
        return tipo;
    }


    public String getTaller(){
        return taller;
    }


    public Integer getKilometraje(){
        return kilometraje;
    }


    public BigDecimal getCosto(){
        return costo;
    }


    public String getEstado(){
        return estado;
    }


    public Integer getProximoMantenimiento(){
        return proximoMantenimiento;
    }


    public LocalDate getProximaFecha(){
        return proximaFecha;
    }

}