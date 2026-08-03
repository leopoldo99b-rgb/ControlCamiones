package dto;

import java.util.List;

public class GraficoResponseDTO {

    private List<String> etiquetas;
    private List<GraficoSerieDTO> datasets;

    public GraficoResponseDTO() {
    }

    public GraficoResponseDTO(
            List<String> etiquetas,
            List<GraficoSerieDTO> datasets) {

        this.etiquetas = etiquetas;
        this.datasets = datasets;
    }

    public List<String> getEtiquetas() {
        return etiquetas;
    }

    public void setEtiquetas(List<String> etiquetas) {
        this.etiquetas = etiquetas;
    }

    public List<GraficoSerieDTO> getDatasets() {
        return datasets;
    }

    public void setDatasets(List<GraficoSerieDTO> datasets) {
        this.datasets = datasets;
    }

}