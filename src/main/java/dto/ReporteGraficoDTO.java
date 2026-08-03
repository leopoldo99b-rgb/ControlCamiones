package dto;

import java.util.List;

public class ReporteGraficoDTO {

    private String titulo;
    private String dataset;
    private String inicio;
    private String fin;

    private DashboardGraficoDTO dashboard;

    private List<GraficoDTO> datos;

    public ReporteGraficoDTO() {
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDataset() {
        return dataset;
    }

    public void setDataset(String dataset) {
        this.dataset = dataset;
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

    public DashboardGraficoDTO getDashboard() {
        return dashboard;
    }

    public void setDashboard(DashboardGraficoDTO dashboard) {
        this.dashboard = dashboard;
    }

    public List<GraficoDTO> getDatos() {
        return datos;
    }

    public void setDatos(List<GraficoDTO> datos) {
        this.datos = datos;
    }
}