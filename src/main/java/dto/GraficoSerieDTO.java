package dto;

import java.util.List;

public class GraficoSerieDTO {

    private String nombre;
    private List<Number> valores;

    public GraficoSerieDTO() {
    }

    public GraficoSerieDTO(String nombre, List<Number> valores) {
        this.nombre = nombre;
        this.valores = valores;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public List<Number> getValores() {
        return valores;
    }

    public void setValores(List<Number> valores) {
        this.valores = valores;
    }

}