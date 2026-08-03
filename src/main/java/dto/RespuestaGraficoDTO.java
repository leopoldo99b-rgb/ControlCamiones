package dto;

import java.util.List;

public class RespuestaGraficoDTO {

    private List<GraficoDTO> grafico;

    private DashboardGraficoDTO dashboard;

    public RespuestaGraficoDTO() {
    }

    public RespuestaGraficoDTO(
            List<GraficoDTO> grafico,
            DashboardGraficoDTO dashboard
    ) {
        this.grafico = grafico;
        this.dashboard = dashboard;
    }

    public List<GraficoDTO> getGrafico() {
        return grafico;
    }

    public void setGrafico(List<GraficoDTO> grafico) {
        this.grafico = grafico;
    }

    public DashboardGraficoDTO getDashboard() {
        return dashboard;
    }

    public void setDashboard(DashboardGraficoDTO dashboard) {
        this.dashboard = dashboard;
    }

}