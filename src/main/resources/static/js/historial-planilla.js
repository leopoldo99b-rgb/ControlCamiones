document.addEventListener("DOMContentLoaded", () => {

    const API = {
        planillas: "/planillas/api",
        historial: "/historial-planillas/api"
    };

    let planillas = [];
    let planillasFiltradas = [];
    let planillaSeleccionada = null;

    // =========================================================
    // ELEMENTOS PRINCIPALES
    // =========================================================

    const payrollHistoryBody =
        document.getElementById("payrollHistoryBody");

    const emptyHistory =
        document.getElementById("emptyHistory");

    const searchPayroll =
        document.getElementById("searchPayroll");

    const dateFrom =
        document.getElementById("dateFrom");

    const dateTo =
        document.getElementById("dateTo");

    const statusFilter =
        document.getElementById("statusFilter");

    const clearFiltersBtn =
        document.getElementById("clearFiltersBtn");

    // =========================================================
    // INICIALIZACIÓN
    // =========================================================

    async function inicializar() {

        try {

            await cargarPlanillas();

            aplicarFiltros();

        } catch (error) {

            console.error(
                "Error inicializando historial:",
                error
            );

            mostrarError(
                "No se pudo cargar el historial de planillas."
            );
        }

        configurarEventos();

    }

    // =========================================================
    // CARGAR PLANILLAS
    // =========================================================

    async function cargarPlanillas() {

        const response =
            await fetch(API.planillas, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

        const data =
            await leerRespuestaJson(response);

        if (!response.ok) {

            throw new Error(
                obtenerMensajeError(
                    data,
                    `Error HTTP ${response.status}`
                )
            );
        }

        if (!Array.isArray(data)) {

            throw new Error(
                "El servidor no devolvió una lista de planillas."
            );
        }

        planillas =
            data
                .map(normalizarPlanilla)
                .filter(Boolean);

        // Ordenar de la más reciente a la más antigua
        planillas.sort(
            (a, b) => {

                const fechaA =
                    a.fechaPago || "";

                const fechaB =
                    b.fechaPago || "";

                return fechaB.localeCompare(fechaA);
            }
        );

        actualizarResumenGeneral();
    }

    // =========================================================
    // NORMALIZAR PLANILLA
    // =========================================================

    function normalizarPlanilla(planilla) {

        if (!planilla) {
            return null;
        }

        const empleadosRaw =
            Array.isArray(planilla.empleados)
                ? planilla.empleados
                : [];

        const empleados =
            empleadosRaw
                .map(normalizarEmpleadoHistorial)
                .filter(Boolean);

        /*
         * IMPORTANTE:
         *
         * Estos nombres corresponden exactamente
         * a Planilla.java:
         *
         * totalEmpleados
         * totalSalarios
         * totalBonos
         * totalAnticipos
         * totalDeducciones
         * totalNeto
         */

        const totalEmpleados =
            Number(
                planilla.totalEmpleados ??
                empleados.length
            ) || 0;

        const totalSalarios =
            numero(
                planilla.totalSalarios
            );

        const totalBonos =
            numero(
                planilla.totalBonos
            );

        const totalAnticipos =
            numero(
                planilla.totalAnticipos
            );

        const totalDeducciones =
            numero(
                planilla.totalDeducciones
            );

        const totalNeto =
            numero(
                planilla.totalNeto
            );

        const estado =
            calcularEstadoPlanilla(
                planilla.estado,
                empleados
            );

        return {

            id:
                planilla.id,

            numeroPlanilla:
                planilla.numeroPlanilla ??
                "",

            fechaInicio:
                planilla.fechaInicio ??
                "",

            fechaFin:
                planilla.fechaFin ??
                "",

            fechaPago:
                planilla.fechaPago ??
                "",

            estado:

                estado,

            totalEmpleados:

                totalEmpleados,

            totalSalarios:

                totalSalarios,

            totalBonos:

                totalBonos,

            totalAnticipos:

                totalAnticipos,

            totalDeducciones:

                totalDeducciones,

            totalNeto:

                totalNeto,

            fechaCreacion:
                planilla.fechaCreacion ??
                "",

            fechaActualizacion:
                planilla.fechaActualizacion ??
                "",

            empleados:

                empleados
        };
    }

    // =========================================================
    // NORMALIZAR HISTORIAL DEL EMPLEADO
    // =========================================================

    function normalizarEmpleadoHistorial(item) {

        if (!item) {
            return null;
        }

        const empleado =
            item.empleado || {};

        const salario =
            numero(item.salario);

        const bonos =
            numero(item.bonos);

        const anticipos =
            numero(item.anticipos);

        const deducciones =
            numero(item.deducciones);

        /*
         * El neto viene directamente de:
         *
         * HistorialPlanilla.neto
         *
         * Si por alguna razón viene null,
         * lo recalculamos.
         */

        let neto =
            item.neto !== null &&
            item.neto !== undefined
                ? numero(item.neto)
                : (
                    salario +
                    bonos -
                    anticipos -
                    deducciones
                );

        return {

            historialId:
                item.id,

            empleadoId:
                empleado.id ??
                null,

            nombre:
                empleado.nombreCompleto ??
                empleado.nombre ??
                "Sin nombre",

            identidad:
                empleado.identidad ??
                "",

            codigo:
                empleado.codigo ??
                empleado.codigoEmpleado ??
                (
                    empleado.id
                        ? `EMP-${empleado.id}`
                        : ""
                ),

            cargo:
                empleado.cargo ??
                "",

            salario:
                salario,

            bonos:
                bonos,

            anticipos:
                anticipos,

            deducciones:
                deducciones,

            neto:
                neto,

            estadoPago:
                String(
                    item.estadoPago ??
                    "PENDIENTE"
                ).toUpperCase(),

            fechaRegistro:
                item.fechaRegistro ??
                "",

            fechaPago:
                item.fechaPago ??
                ""
        };
    }

    // =========================================================
    // CALCULAR ESTADO GENERAL
    // =========================================================

    function calcularEstadoPlanilla(
        estadoBackend,
        empleados
    ) {

        /*
         * Si el backend ya tiene PAGADA,
         * respetamos ese estado.
         */

        if (
            String(estadoBackend ?? "")
                .toUpperCase() === "PAGADA"
        ) {
            return "PAGADA";
        }

        /*
         * Si todos los empleados están pagados,
         * visualmente la planilla está PAGADA.
         */

        if (
            empleados.length > 0 &&
            empleados.every(
                empleado =>
                    empleado.estadoPago === "PAGADO"
            )
        ) {
            return "PAGADA";
        }

        return "PENDIENTE";
    }

    // =========================================================
    // RENDERIZAR TABLA PRINCIPAL
    // =========================================================

    function renderizarTabla() {

        payrollHistoryBody.innerHTML = "";

        if (!planillasFiltradas.length) {

            emptyHistory.classList.remove(
                "d-none"
            );

            actualizarFooter();

            return;
        }

        emptyHistory.classList.add(
            "d-none"
        );

        planillasFiltradas.forEach(
            planilla => {

                const row =
                    document.createElement("tr");

                row.id =
                    `payroll-row-${planilla.id}`;

                row.dataset.payrollId =
                    planilla.id;

                row.dataset.payroll =
                    planilla.numeroPlanilla;

                row.dataset.payment =
                    planilla.fechaPago;

                row.dataset.status =
                    planilla.estado;

                const semana =
                    obtenerNumeroSemana(
                        planilla.fechaInicio
                    );

                row.innerHTML = `

                    <!-- PLANILLA -->

                    <td>

                        <div class="payroll-number">

                            <span>
                                PLANILLA
                            </span>

                            <strong>
                                ${escapeHtml(
                                    formatearNumeroPlanilla(
                                        planilla.numeroPlanilla
                                    )
                                )}
                            </strong>

                        </div>

                    </td>


                    <!-- PERÍODO -->

                    <td>

                        <div class="period-cell">

                            <strong>
                                ${formatearFecha(
                                    planilla.fechaInicio
                                )}
                                -
                                ${formatearFecha(
                                    planilla.fechaFin
                                )}
                            </strong>

                            <small>
                                Semana ${semana}
                            </small>

                        </div>

                    </td>


                    <!-- FECHA DE PAGO -->

                    <td>
                        ${formatearFecha(
                            planilla.fechaPago
                        )}
                    </td>


                    <!-- EMPLEADOS -->

                    <td>

                        <span class="employee-count">

                            <i class="bi bi-people-fill"></i>

                            ${planilla.totalEmpleados}

                        </span>

                    </td>


                    <!-- SALARIOS -->

                    <td>
                        ${formatMoney(
                            planilla.totalSalarios
                        )}
                    </td>


                    <!-- BONOS -->

                    <td class="income">

                        + ${formatMoney(
                            planilla.totalBonos
                        )}

                    </td>


                    <!-- ANTICIPOS -->

                    <td class="deduction">

                        - ${formatMoney(
                            planilla.totalAnticipos
                        )}

                    </td>


                    <!-- DEDUCCIONES -->

                    <td class="deduction">

                        - ${formatMoney(
                            planilla.totalDeducciones
                        )}

                    </td>


                    <!-- NETO -->

                    <td class="net-pay">

                        ${formatMoney(
                            planilla.totalNeto
                        )}

                    </td>


                    <!-- ESTADO -->

                    <td>

                        ${crearBadgeEstado(
                            planilla.estado,
                            planilla.id
                        )}

                    </td>


                    <!-- ACCIÓN -->

                    <td>

                        <button
                            type="button"
                            class="btn btn-sm btn-detail"
                            data-bs-toggle="modal"
                            data-bs-target="#payrollDetailModal"
                            data-payroll-id="${planilla.id}"
                            title="Ver detalle">

                            <i class="bi bi-eye"></i>

                        </button>

                    </td>

                `;

                payrollHistoryBody.appendChild(
                    row
                );
            }
        );

        actualizarFooter();
    }

    // =========================================================
    // BADGE ESTADO
    // =========================================================

    function crearBadgeEstado(
        estado,
        planillaId
    ) {

        if (estado === "PAGADA") {

            return `

                <span
                    class="history-status paid"
                    id="status-${planillaId}">

                    <i class="bi bi-check-circle-fill"></i>

                    PAGADA

                </span>

            `;
        }

        return `

            <span
                class="history-status pending"
                id="status-${planillaId}">

                <i class="bi bi-clock-fill"></i>

                PENDIENTE

            </span>

        `;
    }

    // =========================================================
    // ABRIR DETALLE
    // =========================================================

    payrollHistoryBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".btn-detail"
                );

            if (!button) {
                return;
            }

            const planillaId =
                Number(
                    button.dataset.payrollId
                );

            abrirDetalle(planillaId);
        }
    );

    async function abrirDetalle(planillaId) {

        /*
         * Primero buscamos la planilla
         * que ya tenemos cargada.
         */

        let planilla =
            planillas.find(
                item =>
                    Number(item.id) ===
                    Number(planillaId)
            );

        if (!planilla) {

            mostrarError(
                "No se encontró la planilla seleccionada."
            );

            return;
        }

        planillaSeleccionada =
            planilla;

        /*
         * Si la lista principal no trae
         * los empleados por alguna razón,
         * hacemos una consulta directa.
         */

        if (
            !planilla.empleados ||
            planilla.empleados.length === 0
        ) {

            try {

                const response =
                    await fetch(
                        `${API.historial}/planilla/${planillaId}`,
                        {
                            method: "GET",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );

                const data =
                    await leerRespuestaJson(
                        response
                    );

                if (!response.ok) {

                    throw new Error(
                        obtenerMensajeError(
                            data,
                            `Error HTTP ${response.status}`
                        )
                    );
                }

                planilla.empleados =
                    Array.isArray(data)
                        ? data
                            .map(
                                normalizarEmpleadoHistorial
                            )
                            .filter(Boolean)
                        : [];

            } catch (error) {

                console.error(
                    "Error cargando empleados de planilla:",
                    error
                );

                mostrarError(
                    "No se pudo cargar el detalle de los empleados."
                );

                return;
            }
        }

        /*
         * Actualizamos los totales con la
         * información real de los empleados
         * si existen.
         */

        recalcularTotalesPlanilla(
            planilla
        );

        cargarDatosModal(
            planilla
        );

        renderizarEmpleadosModal(
            planilla
        );
    }

    // =========================================================
    // RECALCULAR TOTALES DE PLANILLA
    // =========================================================

    function recalcularTotalesPlanilla(
        planilla
    ) {

        if (
            !planilla.empleados ||
            !planilla.empleados.length
        ) {
            return;
        }

        let totalSalarios = 0;
        let totalBonos = 0;
        let totalAnticipos = 0;
        let totalDeducciones = 0;
        let totalNeto = 0;

        planilla.empleados.forEach(
            empleado => {

                totalSalarios +=
                    numero(
                        empleado.salario
                    );

                totalBonos +=
                    numero(
                        empleado.bonos
                    );

                totalAnticipos +=
                    numero(
                        empleado.anticipos
                    );

                totalDeducciones +=
                    numero(
                        empleado.deducciones
                    );

                empleado.neto =
                    numero(
                        empleado.salario
                    )
                    +
                    numero(
                        empleado.bonos
                    )
                    -
                    numero(
                        empleado.anticipos
                    )
                    -
                    numero(
                        empleado.deducciones
                    );

                totalNeto +=
                    empleado.neto;
            }
        );

        /*
         * Usamos los valores calculados desde
         * historial_planillas para asegurar que
         * el modal y la tabla coincidan.
         */

        planilla.totalEmpleados =
            planilla.empleados.length;

        planilla.totalSalarios =
            totalSalarios;

        planilla.totalBonos =
            totalBonos;

        planilla.totalAnticipos =
            totalAnticipos;

        planilla.totalDeducciones =
            totalDeducciones;

        planilla.totalNeto =
            totalNeto;

        planilla.estado =
            calcularEstadoPlanilla(
                planilla.estado,
                planilla.empleados
            );
    }

    // =========================================================
    // CARGAR INFORMACIÓN DEL MODAL
    // =========================================================

    function cargarDatosModal(
        planilla
    ) {

        const modalNumber =
            document.getElementById(
                "modalPayrollNumber"
            );

        const modalPeriod =
            document.getElementById(
                "modalPeriod"
            );

        const modalPaymentDate =
            document.getElementById(
                "modalPaymentDate"
            );

        const modalEmployees =
            document.getElementById(
                "modalEmployees"
            );

        const modalStatus =
            document.getElementById(
                "modalStatus"
            );

        if (modalNumber) {

            modalNumber.textContent =
                `Planilla ${formatearNumeroPlanilla(
                    planilla.numeroPlanilla
                )}`;
        }

        if (modalPeriod) {

            modalPeriod.textContent =
                `${formatearFecha(
                    planilla.fechaInicio
                )} - ${formatearFecha(
                    planilla.fechaFin
                )}`;
        }

        if (modalPaymentDate) {

            modalPaymentDate.textContent =
                formatearFecha(
                    planilla.fechaPago
                );
        }

        if (modalEmployees) {

            modalEmployees.textContent =
                planilla.totalEmpleados;
        }

        if (modalStatus) {

            actualizarEstadoModal(
                modalStatus,
                planilla.estado
            );
        }

        /*
         * IMPORTANTE:
         *
         * Tu HTML original no tiene IDs para
         * los valores financieros del modal.
         *
         * Por eso los localizamos por posición
         * dentro de .financial-grid.
         */

        const financialItems =
            document.querySelectorAll(
                "#payrollDetailModal .financial-grid .financial-item"
            );

        if (
            financialItems.length >= 4
        ) {

            const salario =
                financialItems[0]
                    .querySelector("strong");

            const bono =
                financialItems[1]
                    .querySelector("strong");

            const anticipo =
                financialItems[2]
                    .querySelector("strong");

            const deduccion =
                financialItems[3]
                    .querySelector("strong");

            if (salario) {

                salario.textContent =
                    formatMoney(
                        planilla.totalSalarios
                    );
            }

            if (bono) {

                bono.textContent =
                    "+ " +
                    formatMoney(
                        planilla.totalBonos
                    );
            }

            if (anticipo) {

                anticipo.textContent =
                    "- " +
                    formatMoney(
                        planilla.totalAnticipos
                    );
            }

            if (deduccion) {

                deduccion.textContent =
                    "- " +
                    formatMoney(
                        planilla.totalDeducciones
                    );
            }
        }

        /*
         * TOTAL NETO
         */

        const modalTotal =
            document.querySelector(
                "#payrollDetailModal .modal-total strong"
            );

        if (modalTotal) {

            modalTotal.textContent =
                formatMoney(
                    planilla.totalNeto
                );
        }
    }

    // =========================================================
    // ESTADO DEL MODAL
    // =========================================================

    function actualizarEstadoModal(
        elemento,
        estado
    ) {

        elemento.className =
            "history-status " +
            (
                estado === "PAGADA"
                    ? "paid"
                    : "pending"
            );

        if (estado === "PAGADA") {

            elemento.innerHTML = `
                <i class="bi bi-check-circle-fill"></i>
                PAGADA
            `;

        } else {

            elemento.innerHTML = `
                <i class="bi bi-clock-fill"></i>
                PENDIENTE
            `;
        }
    }

    // =========================================================
    // RENDERIZAR EMPLEADOS DEL MODAL
    // =========================================================

    function renderizarEmpleadosModal(
        planilla
    ) {

        const body =
            document.getElementById(
                "employeeDetailBody"
            );

        if (!body) {
            return;
        }

        body.innerHTML = "";

        const empleados =
            planilla.empleados || [];

        if (!empleados.length) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="text-center text-muted py-4">

                        <i class="bi bi-people"></i>

                        No hay empleados registrados
                        en esta planilla.

                    </td>

                </tr>

            `;

            actualizarResumenPagos(
                planilla
            );

            return;
        }

        empleados.forEach(
            empleado => {

                const row =
                    document.createElement("tr");

                const estado =
                    empleado.estadoPago === "PAGADO"
                        ? "PAGADO"
                        : "PENDIENTE";

                row.dataset.historialId =
                    empleado.historialId;

                row.dataset.employeeId =
                    empleado.empleadoId;

                row.innerHTML = `

                    <!-- EMPLEADO -->

                    <td>

                        <div class="employee">

                            <div class="avatar">

                                ${getInitials(
                                    empleado.nombre
                                )}

                            </div>

                            <div>

                                <strong>

                                    ${escapeHtml(
                                        empleado.nombre
                                    )}

                                </strong>

                                <small>

                                    ${escapeHtml(
                                        empleado.codigo
                                    )}

                                </small>

                            </div>

                        </div>

                    </td>


                    <!-- SALARIO -->

                    <td>

                        ${formatMoney(
                            empleado.salario
                        )}

                    </td>


                    <!-- BONOS -->

                    <td class="income">

                        ${
                            empleado.bonos > 0
                                ? "+ "
                                : ""
                        }

                        ${formatMoney(
                            empleado.bonos
                        )}

                    </td>


                    <!-- ANTICIPOS -->

                    <td class="deduction">

                        ${
                            empleado.anticipos > 0
                                ? "- "
                                : ""
                        }

                        ${formatMoney(
                            empleado.anticipos
                        )}

                    </td>


                    <!-- DEDUCCIONES -->

                    <td class="deduction">

                        ${
                            empleado.deducciones > 0
                                ? "- "
                                : ""
                        }

                        ${formatMoney(
                            empleado.deducciones
                        )}

                    </td>


                    <!-- NETO -->

                    <td class="net-pay">

                        ${formatMoney(
                            empleado.neto
                        )}

                    </td>


                    <!-- ESTADO -->

                    <td>

                        ${crearBadgePago(
                            estado,
                            empleado.historialId
                        )}

                    </td>


                    <!-- ACCIONES -->

                    <td>

                        ${
                            estado === "PAGADO"

                                ? `

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-warning btn-pending"
                                        data-historial-id="${empleado.historialId}"
                                        title="Marcar como pendiente">

                                        <i class="bi bi-arrow-counterclockwise"></i>

                                    </button>

                                  `

                                : `

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-success btn-paid"
                                        data-historial-id="${empleado.historialId}"
                                        title="Marcar como pagado">

                                        <i class="bi bi-check-lg"></i>

                                    </button>

                                  `
                        }

                    </td>

                `;

                body.appendChild(row);
            }
        );

        actualizarResumenPagos(
            planilla
        );
    }

    // =========================================================
    // BADGE PAGO
    // =========================================================

    function crearBadgePago(
        estado,
        historialId
    ) {

        if (estado === "PAGADO") {

            return `

                <span
                    class="history-status paid"
                    id="employee-status-${historialId}">

                    <i class="bi bi-check-circle-fill"></i>

                    PAGADO

                </span>

            `;
        }

        return `

            <span
                class="history-status pending"
                id="employee-status-${historialId}">

                <i class="bi bi-clock-fill"></i>

                PENDIENTE

            </span>

        `;
    }

    // =========================================================
    // BOTONES PAGAR / PENDIENTE
    // =========================================================

    const employeeDetailBody =
        document.getElementById(
            "employeeDetailBody"
        );

    if (employeeDetailBody) {

        employeeDetailBody.addEventListener(
            "click",
            async event => {

                const paidButton =
                    event.target.closest(
                        ".btn-paid"
                    );

                const pendingButton =
                    event.target.closest(
                        ".btn-pending"
                    );

                if (
                    !paidButton &&
                    !pendingButton
                ) {
                    return;
                }

                const button =
                    paidButton ||
                    pendingButton;

                const historialId =
                    Number(
                        button.dataset.historialId
                    );

                if (!planillaSeleccionada) {
                    return;
                }

                if (paidButton) {

                    await marcarEmpleadoPagado(
                        historialId
                    );

                } else {

                    await marcarEmpleadoPendiente(
                        historialId
                    );
                }
            }
        );
    }

    // =========================================================
    // MARCAR EMPLEADO PAGADO
    // =========================================================

    async function marcarEmpleadoPagado(
        historialId
    ) {

        if (!planillaSeleccionada) {
            return;
        }

        const planillaId =
            planillaSeleccionada.id;

        try {

            const response =
                await fetch(
                    `${API.historial}/planilla/${planillaId}/empleado/${historialId}/pagar`,
                    {
                        method: "PATCH",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            const data =
                await leerRespuestaJson(
                    response
                );

            if (!response.ok) {

                throw new Error(
                    obtenerMensajeError(
                        data,
                        `Error HTTP ${response.status}`
                    )
                );
            }

            /*
             * Actualizamos el empleado localmente.
             */

            const empleado =
                planillaSeleccionada.empleados.find(
                    item =>
                        Number(
                            item.historialId
                        ) ===
                        Number(historialId)
                );

            if (empleado) {

                empleado.estadoPago =
                    "PAGADO";

                empleado.fechaPago =
                    data?.fechaPago ??
                    new Date().toISOString();
            }

            /*
             * Actualizar estado general.
             */

            planillaSeleccionada.estado =
                calcularEstadoPlanilla(
                    planillaSeleccionada.estado,
                    planillaSeleccionada.empleados
                );

            /*
             * Redibujar modal.
             */

            renderizarEmpleadosModal(
                planillaSeleccionada
            );

            cargarDatosModal(
                planillaSeleccionada
            );

            /*
             * Actualizar objeto global.
             */

            sincronizarPlanillaGlobal();

            renderizarTabla();

            actualizarResumenGeneral();

            mostrarMensaje(
                "Empleado marcado como PAGADO.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error marcando empleado pagado:",
                error
            );

            mostrarMensaje(
                "No se pudo registrar el pago: " +
                error.message,
                "danger"
            );
        }
    }

    // =========================================================
    // MARCAR EMPLEADO PENDIENTE
    // =========================================================

    async function marcarEmpleadoPendiente(
        historialId
    ) {

        try {

            const response =
                await fetch(
                    `${API.historial}/${historialId}/estado`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                estadoPago:
                                    "PENDIENTE"
                            })
                    }
                );

            const data =
                await leerRespuestaJson(
                    response
                );

            if (!response.ok) {

                throw new Error(
                    obtenerMensajeError(
                        data,
                        `Error HTTP ${response.status}`
                    )
                );
            }

            const empleado =
                planillaSeleccionada?.empleados.find(
                    item =>
                        Number(
                            item.historialId
                        ) ===
                        Number(historialId)
                );

            if (empleado) {

                empleado.estadoPago =
                    "PENDIENTE";

                empleado.fechaPago =
                    null;
            }

            if (planillaSeleccionada) {

                planillaSeleccionada.estado =
                    calcularEstadoPlanilla(
                        planillaSeleccionada.estado,
                        planillaSeleccionada.empleados
                    );
            }

            renderizarEmpleadosModal(
                planillaSeleccionada
            );

            cargarDatosModal(
                planillaSeleccionada
            );

            sincronizarPlanillaGlobal();

            renderizarTabla();

            actualizarResumenGeneral();

            mostrarMensaje(
                "Empleado marcado como PENDIENTE.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error marcando empleado pendiente:",
                error
            );

            mostrarMensaje(
                "No se pudo actualizar el estado: " +
                error.message,
                "danger"
            );
        }
    }

    // =========================================================
    // SINCRONIZAR PLANILLA GLOBAL
    // =========================================================

    function sincronizarPlanillaGlobal() {

        if (!planillaSeleccionada) {
            return;
        }

        const index =
            planillas.findIndex(
                item =>
                    Number(item.id) ===
                    Number(planillaSeleccionada.id)
            );

        if (index !== -1) {

            planillas[index] =
                planillaSeleccionada;
        }
    }

    // =========================================================
    // FILTROS
    // =========================================================

    function configurarEventos() {

        if (searchPayroll) {

            searchPayroll.addEventListener(
                "input",
                aplicarFiltros
            );
        }

        if (dateFrom) {

            dateFrom.addEventListener(
                "change",
                aplicarFiltros
            );
        }

        if (dateTo) {

            dateTo.addEventListener(
                "change",
                aplicarFiltros
            );
        }

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                aplicarFiltros
            );
        }

        if (clearFiltersBtn) {

            clearFiltersBtn.addEventListener(
                "click",
                limpiarFiltros
            );
        }
    }

    function aplicarFiltros() {

        const texto =
            (
                searchPayroll?.value ||
                ""
            )
                .toLowerCase()
                .trim();

        const desde =
            dateFrom?.value ||
            "";

        const hasta =
            dateTo?.value ||
            "";

        const estado =
            statusFilter?.value ||
            "";

        planillasFiltradas =
            planillas.filter(
                planilla => {

                    const numero =
                        String(
                            planilla.numeroPlanilla
                        )
                            .toLowerCase();

                    const coincideTexto =
                        !texto ||
                        numero.includes(texto);

                    const coincideDesde =
                        !desde ||
                        (
                            planilla.fechaPago &&
                            planilla.fechaPago >= desde
                        );

                    const coincideHasta =
                        !hasta ||
                        (
                            planilla.fechaPago &&
                            planilla.fechaPago <= hasta
                        );

                    const coincideEstado =
                        !estado ||
                        planilla.estado === estado;

                    return (
                        coincideTexto &&
                        coincideDesde &&
                        coincideHasta &&
                        coincideEstado
                    );
                }
            );

        renderizarTabla();
    }

    function limpiarFiltros() {

        if (searchPayroll) {
            searchPayroll.value = "";
        }

        if (dateFrom) {
            dateFrom.value = "";
        }

        if (dateTo) {
            dateTo.value = "";
        }

        if (statusFilter) {
            statusFilter.value = "";
        }

        aplicarFiltros();
    }

    // =========================================================
    // RESUMEN SUPERIOR
    // =========================================================

    function actualizarResumenGeneral() {

        const total =
            planillas.length;

        const pagadas =
            planillas.filter(
                planilla =>
                    planilla.estado === "PAGADA"
            ).length;

        const pendientes =
            planillas.filter(
                planilla =>
                    planilla.estado === "PENDIENTE"
            ).length;

        /*
         * "Total pagado" se calcula sobre el
         * total neto de las planillas PAGADAS.
         */

        const totalPagado =
            planillas
                .filter(
                    planilla =>
                        planilla.estado === "PAGADA"
                )
                .reduce(
                    (
                        acumulado,
                        planilla
                    ) =>
                        acumulado +
                        numero(
                            planilla.totalNeto
                        ),
                    0
                );

        actualizarTexto(
            "totalPayrolls",
            total
        );

        actualizarTexto(
            "paidPayrolls",
            pagadas
        );

        actualizarTexto(
            "pendingPayrolls",
            pendientes
        );

        actualizarTexto(
            "totalPaid",
            formatMoney(
                totalPagado
            )
        );

        actualizarTexto(
            "totalPayrollsFooter",
            total
        );
    }

    // =========================================================
    // FOOTER
    // =========================================================

    function actualizarFooter() {

        const visible =
            planillasFiltradas.length;

        const total =
            planillas.length;

        actualizarTexto(
            "visiblePayrolls",
            visible
        );

        actualizarTexto(
            "totalPayrollsFooter",
            total
        );
    }

    // =========================================================
    // RESUMEN DE PAGOS DEL MODAL
    // =========================================================

    function actualizarResumenPagos(
        planilla
    ) {

        const elemento =
            document.getElementById(
                "employeePaymentSummary"
            );

        if (!elemento) {
            return;
        }

        const empleados =
            planilla.empleados || [];

        const pagados =
            empleados.filter(
                empleado =>
                    empleado.estadoPago ===
                    "PAGADO"
            ).length;

        elemento.textContent =
            `${pagados} pagados de ${empleados.length}`;
    }

    // =========================================================
    // UTILIDADES
    // =========================================================

    function numero(valor) {

        const resultado =
            Number(valor);

        return Number.isFinite(
            resultado
        )
            ? resultado
            : 0;
    }

    function formatMoney(value) {

        return "L " +
            numero(value)
                .toLocaleString(
                    "en-US",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );
    }

    function formatearFecha(
        fecha
    ) {

        if (!fecha) {
            return "";
        }

        /*
         * LocalDate del backend llega:
         *
         * YYYY-MM-DD
         */

        const partes =
            String(fecha)
                .substring(0, 10)
                .split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function formatearNumeroPlanilla(
        numeroPlanilla
    ) {

        if (!numeroPlanilla) {
            return "";
        }

        const texto =
            String(numeroPlanilla);

        /*
         * PLAN-2026-39
         * se muestra como:
         * #2026-39
         */

        if (
            texto.startsWith("PLAN-")
        ) {

            return "#" +
                texto.substring(5);
        }

        return texto.startsWith("#")
            ? texto
            : "#" + texto;
    }

    function obtenerNumeroSemana(
        fechaTexto
    ) {

        if (!fechaTexto) {
            return "";
        }

        const fecha =
            new Date(
                `${fechaTexto}T00:00:00`
            );

        if (
            Number.isNaN(
                fecha.getTime()
            )
        ) {
            return "";
        }

        /*
         * ISO week.
         */

        const jueves =
            new Date(fecha);

        jueves.setDate(
            jueves.getDate() +
            3 -
            (
                (
                    jueves.getDay() +
                    6
                ) % 7
            )
        );

        const primerJueves =
            new Date(
                jueves.getFullYear(),
                0,
                4
            );

        const numeroSemana =
            1 +
            Math.round(
                (
                    (
                        jueves -
                        primerJueves
                    ) /
                    86400000 -
                    3 +
                    (
                        (
                            primerJueves.getDay() +
                            6
                        ) % 7
                    )
                ) / 7
            );

        return String(
            numeroSemana
        ).padStart(
            2,
            "0"
        );
    }

    function getInitials(
        nombre
    ) {

        return String(
            nombre || ""
        )
            .trim()
            .split(/\s+/)
            .map(
                parte =>
                    parte.charAt(0)
            )
            .join("")
            .substring(0, 2)
            .toUpperCase();
    }

    function actualizarTexto(
        id,
        valor
    ) {

        const elemento =
            document.getElementById(id);

        if (elemento) {

            elemento.textContent =
                valor;
        }
    }

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    // =========================================================
    // LEER RESPUESTA JSON
    // =========================================================

    async function leerRespuestaJson(
        response
    ) {

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            return await response.json();
        }

        const texto =
            await response.text();

        return texto || null;
    }

    function obtenerMensajeError(
        data,
        mensajeDefault
    ) {

        if (
            data &&
            typeof data === "object"
        ) {

            return (
                data.message ??
                data.error ??
                mensajeDefault
            );
        }

        if (
            typeof data === "string" &&
            data.trim()
        ) {

            return data;
        }

        return mensajeDefault;
    }

    function mostrarMensaje(
        mensaje,
        tipo = "info"
    ) {

        const anterior =
            document.getElementById(
                "historyMessage"
            );

        if (anterior) {
            anterior.remove();
        }

        const alert =
            document.createElement(
                "div"
            );

        alert.id =
            "historyMessage";

        alert.className =
            `alert alert-${tipo} alert-dismissible fade show`;

        alert.setAttribute(
            "role",
            "alert"
        );

        alert.innerHTML = `

            ${escapeHtml(mensaje)}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>

        `;

        const page =
            document.querySelector(
                ".payroll-page"
            );

        if (page) {

            page.prepend(alert);

        } else {

            document.body.prepend(
                alert
            );
        }

        setTimeout(
            () => {

                if (alert) {
                    alert.remove();
                }

            },
            5000
        );
    }

    function mostrarError(
        mensaje
    ) {

        mostrarMensaje(
            mensaje,
            "danger"
        );
    }

    // =========================================================
    // INICIAR
    // =========================================================

    inicializar();

});