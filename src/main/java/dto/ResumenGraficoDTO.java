package dto;

import java.math.BigDecimal;

public class ResumenGraficoDTO {

    private Long totalMantenimientos;

    private BigDecimal gastoTotal;

    private Long proximos;

    private Long vencidos;

    public ResumenGraficoDTO() {
    }

    public ResumenGraficoDTO(
            Long totalMantenimientos,
            BigDecimal gastoTotal,
            Long proximos,
            Long vencidos
    ) {

        this.totalMantenimientos = totalMantenimientos;
        this.gastoTotal = gastoTotal;
        this.proximos = proximos;
        this.vencidos = vencidos;

    }

    public Long getTotalMantenimientos() {
        return totalMantenimientos;
    }

    public BigDecimal getGastoTotal() {
        return gastoTotal;
    }

    public Long getProximos() {
        return proximos;
    }

    public Long getVencidos() {
        return vencidos;
    }

}