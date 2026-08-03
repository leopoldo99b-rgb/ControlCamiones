package dto;

public class GraficoDTO {

    private String etiqueta;
    private Number valor;

    public GraficoDTO() {
    }

    public GraficoDTO(String etiqueta, Number valor) {
        this.etiqueta = etiqueta;
        this.valor = valor;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public void setEtiqueta(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public Number getValor() {
        return valor;
    }

    public void setValor(Number valor) {
        this.valor = valor;
    }

}