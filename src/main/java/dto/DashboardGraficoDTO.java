package dto;

import java.math.BigDecimal;

public class DashboardGraficoDTO {

    private Long totalMantenimientos;

    private BigDecimal costoTotal;

    private Long proximos;

    private Long vencidos;

    public DashboardGraficoDTO() {

        this.totalMantenimientos = 0L;
        this.costoTotal = BigDecimal.ZERO;
        this.proximos = 0L;
        this.vencidos = 0L;

    }

    public DashboardGraficoDTO(

            Long totalMantenimientos,

            BigDecimal costoTotal,

            Long proximos,

            Long vencidos

    ) {

        this.totalMantenimientos =
                totalMantenimientos == null ? 0L : totalMantenimientos;

        this.costoTotal =
                costoTotal == null ? BigDecimal.ZERO : costoTotal;

        this.proximos =
                proximos == null ? 0L : proximos;

        this.vencidos =
                vencidos == null ? 0L : vencidos;

    }

    public Long getTotalMantenimientos() {

        return totalMantenimientos;

    }

    public void setTotalMantenimientos(Long totalMantenimientos) {

        this.totalMantenimientos = totalMantenimientos;

    }

    public BigDecimal getCostoTotal() {

        return costoTotal;

    }

    public void setCostoTotal(BigDecimal costoTotal) {

        this.costoTotal = costoTotal;

    }

    public Long getProximos() {

        return proximos;

    }

    public void setProximos(Long proximos) {

        this.proximos = proximos;

    }

    public Long getVencidos() {

        return vencidos;

    }

    public void setVencidos(Long vencidos) {

        this.vencidos = vencidos;

    }

}