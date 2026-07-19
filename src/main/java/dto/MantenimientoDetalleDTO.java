package dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class MantenimientoDetalleDTO {


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

    private String descripcion;

    private String observaciones;


    private List<RepuestoDetalleDTO> repuestos;



    public MantenimientoDetalleDTO(){}



    public MantenimientoDetalleDTO(
            Long id,
            String placa,
            LocalDate fecha,
            String tipo,
            String taller,
            Integer kilometraje,
            BigDecimal costo,
            String estado,
            Integer proximoMantenimiento,
            LocalDate proximaFecha,
            String descripcion,
            String observaciones,
            List<RepuestoDetalleDTO> repuestos
    ){

        this.id=id;
        this.placa=placa;
        this.fecha=fecha;
        this.tipo=tipo;
        this.taller=taller;
        this.kilometraje=kilometraje;
        this.costo=costo;
        this.estado=estado;
        this.proximoMantenimiento=proximoMantenimiento;
        this.proximaFecha=proximaFecha;
        this.descripcion=descripcion;
        this.observaciones=observaciones;
        this.repuestos=repuestos;

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


    public String getDescripcion(){
        return descripcion;
    }


    public String getObservaciones(){
        return observaciones;
    }


    public List<RepuestoDetalleDTO> getRepuestos(){
        return repuestos;
    }

}