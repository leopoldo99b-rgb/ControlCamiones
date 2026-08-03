package dto;

public class ReporteGraficoRequestDTO {

    private String dataset;

    private String tipoGrafico;

    private String inicio;

    private String fin;

    private String imagenGrafico;

    public ReporteGraficoRequestDTO() {
    }

    public String getDataset() {
        return dataset;
    }

    public void setDataset(String dataset) {
        this.dataset = dataset;
    }

    public String getTipoGrafico() {
        return tipoGrafico;
    }

    public void setTipoGrafico(String tipoGrafico) {
        this.tipoGrafico = tipoGrafico;
    }

    public String getInicio() {
        return inicio;
    }

    public void setInicio(String inicio) {
        this.inicio = inicio;
    }

    public String getFin() {
        return fin;
    }

    public void setFin(String fin) {
        this.fin = fin;
    }

    public String getImagenGrafico() {
        return imagenGrafico;
    }

    public void setImagenGrafico(String imagenGrafico) {
        this.imagenGrafico = imagenGrafico;
    }

}