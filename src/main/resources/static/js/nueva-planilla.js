document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       CONFIGURACIÓN DE APIS
    ========================================================== */

    const API = {
        empleados: "/empleados/api",
        movimientos: "/movimientos/api",
        planillas: "/planillas/api"
    };


    /* =========================================================
       ESTADO DE LA VISTA
    ========================================================== */

    let empleadosBD = [];
    let movimientosBD = [];
    let empleadosPlanilla = [];
    let planillaGenerada = false;
    let guardandoPlanilla = false;


    /* =========================================================
       ELEMENTOS DEL DOM
    ========================================================== */

    const startDate =
        document.getElementById("startDate");

    const endDate =
        document.getElementById("endDate");

    const paymentDate =
        document.getElementById("paymentDate");

    const generatePayrollBtn =
        document.getElementById("generatePayrollBtn");

    const savePayrollBtn =
        document.getElementById("savePayrollBtn");

    const cancelPayrollBtn =
        document.getElementById("cancelPayrollBtn");

    const tableBody =
        document.getElementById("payrollTableBody");

    const emptyPayroll =
        document.getElementById("emptyPayroll");

    const searchEmployee =
        document.getElementById("searchEmployee");

    const employeeList =
        document.getElementById("employeeList");

    const modalSearch =
        document.getElementById("employeeModalSearch");

    const noEmployeesFound =
        document.getElementById("noEmployeesFound");

    const addEmployeeModal =
        document.getElementById("addEmployeeModal");


    /* =========================================================
       VALIDAR ELEMENTOS PRINCIPALES
    ========================================================== */

    if (
        !startDate ||
        !endDate ||
        !paymentDate ||
        !generatePayrollBtn ||
        !savePayrollBtn ||
        !cancelPayrollBtn ||
        !tableBody ||
        !emptyPayroll ||
        !searchEmployee ||
        !employeeList ||
        !modalSearch ||
        !noEmployeesFound ||
        !addEmployeeModal
    ) {

        console.error(
            "No se pudieron encontrar todos los elementos necesarios del HTML."
        );

        return;
    }


    /* =========================================================
       FECHAS INICIALES
    ========================================================== */

    function establecerFechasIniciales() {

        if (!startDate.value) {
            startDate.value =
                obtenerLunesActual();
        }

        if (!endDate.value) {
            endDate.value =
                sumarDias(
                    startDate.value,
                    6
                );
        }

        if (!paymentDate.value) {
            paymentDate.value =
                sumarDias(
                    endDate.value,
                    1
                );
        }
    }


    function obtenerLunesActual() {

        const fecha = new Date();

        const dia =
            fecha.getDay();

        const diferencia =
            dia === 0
                ? -6
                : 1 - dia;

        fecha.setDate(
            fecha.getDate() + diferencia
        );

        return formatearFechaInput(
            fecha
        );
    }


    function sumarDias(
        fechaTexto,
        dias
    ) {

        const fecha =
            new Date(
                fechaTexto + "T00:00:00"
            );

        fecha.setDate(
            fecha.getDate() + dias
        );

        return formatearFechaInput(
            fecha
        );
    }


    function formatearFechaInput(
        fecha
    ) {

        const year =
            fecha.getFullYear();

        const month =
            String(
                fecha.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                fecha.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    /* =========================================================
       GENERAR NÚMERO DE PLANILLA
    ========================================================== */

    function generarNumeroPlanilla() {

        /*
         * Ejemplo:
         *
         * PLAN-2026-39
         *
         * El número se genera utilizando
         * el año y la semana del período.
         */

        const fecha =
            new Date(
                startDate.value + "T00:00:00"
            );

        const jueves =
            new Date(fecha);

        jueves.setDate(
            jueves.getDate() +
            3 -
            ((jueves.getDay() + 6) % 7)
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
                        primerJueves.getDay() + 6
                    ) % 7
                ) / 7
            );

        const semana =
            String(
                numeroSemana
            ).padStart(2, "0");

        return `PLAN-${jueves.getFullYear()}-${semana}`;
    }


    /* =========================================================
       FORMATO DE DINERO
    ========================================================== */

    function formatMoney(value) {

        return "L " +
            Number(
                value || 0
            ).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );
    }


    /* =========================================================
       NORMALIZAR EMPLEADO
    ========================================================== */

    function normalizarEmpleado(
        empleado
    ) {

        if (!empleado) {
            return null;
        }

        const nombre =
            empleado.nombreCompleto ??
            empleado.nombre_completo ??
            empleado.nombre ??
            "Sin nombre";

        const salario =
            empleado.salario ??
            empleado.sueldo ??
            empleado.salarioBase ??
            empleado.salario_base ??
            0;

        const identidad =
            empleado.identidad ??
            "";

        const codigo =
            empleado.codigo ??
            empleado.codigoEmpleado ??
            empleado.codigo_empleado ??
            `EMP-${empleado.id}`;

        return {

            id:
                empleado.id,

            nombre:
                String(nombre),

            identidad:
                String(identidad),

            codigo:
                String(codigo),

            salario:
                Number(salario) || 0,

            cargo:
                empleado.cargo ??
                empleado.puesto ??
                "",

            departamento:
                empleado.departamento ??
                "",

            estado:
                empleado.estado ??
                "ACTIVO"
        };
    }


    /* =========================================================
       NORMALIZAR MOVIMIENTO
    ========================================================== */

    function normalizarMovimiento(
        movimiento
    ) {

        if (!movimiento) {
            return null;
        }

        let empleadoId =
            movimiento.empleadoId;

        /*
         * También soporta:
         *
         * {
         *     empleado: {
         *         id: 1
         *     }
         * }
         */

        if (
            !empleadoId &&
            movimiento.empleado
        ) {

            empleadoId =
                movimiento.empleado.id;
        }

        return {

            id:
                movimiento.id,

            empleadoId:
                empleadoId,

            tipo:
                String(
                    movimiento.tipo ?? ""
                ).toUpperCase(),

            monto:
                Number(
                    movimiento.monto ?? 0
                ) || 0,

            fecha:
                movimiento.fecha ?? "",

            descripcion:
                movimiento.descripcion ??
                ""
        };
    }


    /* =========================================================
       CARGAR EMPLEADOS
    ========================================================== */

    async function cargarEmpleados() {

        try {

            const response =
                await fetch(
                    API.empleados,
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {

                throw new Error(
                    `Error HTTP ${response.status} al cargar empleados.`
                );
            }

            const data =
                await response.json();

            if (!Array.isArray(data)) {

                throw new Error(
                    "La respuesta de empleados no es una lista."
                );
            }

            empleadosBD =
                data
                    .map(
                        normalizarEmpleado
                    )
                    .filter(Boolean);

            const empleadosActivos =
                empleadosBD.filter(
                    empleado => {

                        const estado =
                            String(
                                empleado.estado ?? ""
                            ).toUpperCase();

                        return (
                            estado === "" ||
                            estado === "ACTIVO" ||
                            estado === "ACTIVA"
                        );
                    }
                );

            if (
                empleadosActivos.length > 0
            ) {

                empleadosBD =
                    empleadosActivos;
            }

            renderEmployeeList(
                empleadosBD
            );

        } catch (error) {

            console.error(
                "Error cargando empleados:",
                error
            );

            empleadosBD = [];

            employeeList.innerHTML = "";

            noEmployeesFound.classList.remove(
                "d-none"
            );

            noEmployeesFound.innerHTML = `

                <i
                    class="bi bi-exclamation-triangle"
                    style="font-size:32px;">
                </i>

                <p class="mt-2 mb-0">
                    No se pudieron cargar los empleados.
                </p>

                <small class="text-danger">
                    ${escapeHtml(error.message)}
                </small>

            `;

            mostrarMensaje(
                "No se pudieron cargar los empleados.",
                "danger"
            );
        }
    }


    /* =========================================================
       CARGAR MOVIMIENTOS
    ========================================================== */

    async function cargarMovimientos() {

        try {

            const response =
                await fetch(
                    API.movimientos,
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {

                throw new Error(
                    `Error HTTP ${response.status} al cargar movimientos.`
                );
            }

            const data =
                await response.json();

            if (!Array.isArray(data)) {

                throw new Error(
                    "La respuesta de movimientos no es una lista."
                );
            }

            movimientosBD =
                data
                    .map(
                        normalizarMovimiento
                    )
                    .filter(Boolean);

        } catch (error) {

            console.error(
                "Error cargando movimientos:",
                error
            );

            movimientosBD = [];

            mostrarMensaje(
                "No se pudieron cargar los movimientos.",
                "danger"
            );
        }
    }


    /* =========================================================
       VALIDAR FECHAS
    ========================================================== */

    function validarFechas() {

        const inicio =
            startDate.value;

        const fin =
            endDate.value;

        const pago =
            paymentDate.value;

        if (
            !inicio ||
            !fin ||
            !pago
        ) {

            mostrarMensaje(
                "Completa las fechas del período de pago.",
                "warning"
            );

            return false;
        }

        if (inicio > fin) {

            mostrarMensaje(
                "La fecha inicial no puede ser mayor que la fecha final.",
                "warning"
            );

            return false;
        }

        if (pago < fin) {

            mostrarMensaje(
                "La fecha de pago no puede ser anterior a la fecha final del período.",
                "warning"
            );

            return false;
        }

        return true;
    }


    /* =========================================================
       OBTENER MOVIMIENTOS DEL PERÍODO
    ========================================================== */

    function obtenerMovimientosDelPeriodo(
        empleadoId,
        fechaInicio,
        fechaFin
    ) {

        return movimientosBD.filter(
            movimiento => {

                if (
                    Number(
                        movimiento.empleadoId
                    ) !==
                    Number(empleadoId)
                ) {

                    return false;
                }

                if (!movimiento.fecha) {
                    return false;
                }

                return (
                    movimiento.fecha >= fechaInicio &&
                    movimiento.fecha <= fechaFin
                );
            }
        );
    }


    /* =========================================================
       CALCULAR MOVIMIENTOS DE UN EMPLEADO
    ========================================================== */

    function calcularMovimientosEmpleado(
        empleadoId,
        fechaInicio,
        fechaFin
    ) {

        const movimientos =
            obtenerMovimientosDelPeriodo(
                empleadoId,
                fechaInicio,
                fechaFin
            );

        let bonus = 0;
        let advance = 0;
        let deduction = 0;

        movimientos.forEach(
            movimiento => {

                const monto =
                    Number(
                        movimiento.monto
                    ) || 0;

                switch (
                    movimiento.tipo
                ) {

                    case "BONO":
                        bonus += monto;
                        break;

                    case "ANTICIPO":
                        advance += monto;
                        break;

                    case "DEDUCCION":
                        deduction += monto;
                        break;
                }
            }
        );

        return {
            bonus,
            advance,
            deduction,
            movimientos
        };
    }


    /* =========================================================
       AGREGAR EMPLEADO A LA PLANILLA
    ========================================================== */

    function addEmployeeToPayroll(
        empleado
    ) {

        const existingRow =
            tableBody.querySelector(
                `tr[data-employee-id="${empleado.id}"]`
            );

        if (existingRow) {

            mostrarMensaje(
                `${empleado.nombre} ya está agregado a la planilla.`,
                "warning"
            );

            return false;
        }

        const movimientos =
            calcularMovimientosEmpleado(
                empleado.id,
                startDate.value,
                endDate.value
            );

        const empleadoPlanilla = {

            id:
                empleado.id,

            nombre:
                empleado.nombre,

            identidad:
                empleado.identidad,

            codigo:
                empleado.codigo,

            salario:
                empleado.salario,

            bonus:
                movimientos.bonus,

            advance:
                movimientos.advance,

            deduction:
                movimientos.deduction,

            movimientos:
                movimientos.movimientos
        };

        empleadosPlanilla.push(
            empleadoPlanilla
        );

        renderPayrollTable();

        calculatePayroll();

        return true;
    }


    /* =========================================================
       RENDERIZAR TABLA
    ========================================================== */

    function renderPayrollTable() {

        tableBody.innerHTML = "";

        empleadosPlanilla.forEach(
            empleado => {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.dataset.employeeId =
                    empleado.id;

                row.dataset.name =
                    empleado.nombre;

                row.dataset.identity =
                    empleado.identidad;

                row.dataset.code =
                    empleado.codigo;

                row.dataset.salary =
                    empleado.salario;

                row.dataset.bonus =
                    empleado.bonus;

                row.dataset.advance =
                    empleado.advance;

                row.dataset.deduction =
                    empleado.deduction;

                const net =
                    calcularNetoEmpleado(
                        empleado
                    );

                row.innerHTML = `

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

                    <td class="salary">
                        ${formatMoney(
                            empleado.salario
                        )}
                    </td>

                    <td class="bonus">

                        ${
                            empleado.bonus > 0
                                ? "+ " +
                                  formatMoney(
                                      empleado.bonus
                                  )
                                : formatMoney(0)
                        }

                    </td>

                    <td class="advance">

                        ${
                            empleado.advance > 0
                                ? "- " +
                                  formatMoney(
                                      empleado.advance
                                  )
                                : formatMoney(0)
                        }

                    </td>

                    <td class="other-deduction">

                        ${
                            empleado.deduction > 0
                                ? "- " +
                                  formatMoney(
                                      empleado.deduction
                                  )
                                : formatMoney(0)
                        }

                    </td>

                    <td class="net-pay">
                        ${formatMoney(net)}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn btn-sm btn-delete"
                            title="Eliminar empleado">

                            <i class="bi bi-trash"></i>

                        </button>

                    </td>

                `;

                tableBody.appendChild(
                    row
                );
            }
        );

        actualizarEstadoVacio();
    }


    /* =========================================================
       CALCULAR NETO
    ========================================================== */

    function calcularNetoEmpleado(
        empleado
    ) {

        const salary =
            Number(
                empleado.salario
            ) || 0;

        const bonus =
            Number(
                empleado.bonus
            ) || 0;

        const advance =
            Number(
                empleado.advance
            ) || 0;

        const deduction =
            Number(
                empleado.deduction
            ) || 0;

        return (
            salary +
            bonus -
            advance -
            deduction
        );
    }


    /* =========================================================
       CALCULAR PLANILLA
    ========================================================== */

    function calculatePayroll() {

        let totalSalary = 0;
        let totalBonus = 0;
        let totalAdvance = 0;
        let totalDeduction = 0;
        let totalNet = 0;

        empleadosPlanilla.forEach(
            empleado => {

                totalSalary +=
                    Number(
                        empleado.salario
                    ) || 0;

                totalBonus +=
                    Number(
                        empleado.bonus
                    ) || 0;

                totalAdvance +=
                    Number(
                        empleado.advance
                    ) || 0;

                totalDeduction +=
                    Number(
                        empleado.deduction
                    ) || 0;

                totalNet +=
                    calcularNetoEmpleado(
                        empleado
                    );
            }
        );

        const count =
            empleadosPlanilla.length;


        /* =====================================================
           RESUMEN SUPERIOR
        ====================================================== */

        actualizarTexto(
            "totalEmployees",
            count
        );

        actualizarTexto(
            "totalIncome",
            formatMoney(
                totalSalary +
                totalBonus
            )
        );

        actualizarTexto(
            "totalBonus",
            formatMoney(
                totalBonus
            )
        );

        actualizarTexto(
            "totalAdvances",
            formatMoney(
                totalAdvance
            )
        );

        actualizarTexto(
            "totalDeductions",
            formatMoney(
                totalDeduction
            )
        );

        actualizarTexto(
            "totalNet",
            formatMoney(
                totalNet
            )
        );


        /* =====================================================
           TOTALES INFERIORES
        ====================================================== */

        actualizarTexto(
            "footerTotalEmployees",
            count
        );

        actualizarTexto(
            "footerTotalSalary",
            formatMoney(
                totalSalary
            )
        );

        actualizarTexto(
            "footerTotalBonus",
            formatMoney(
                totalBonus
            )
        );

        actualizarTexto(
            "footerTotalAdvance",
            "- " +
            formatMoney(
                totalAdvance
            )
        );

        actualizarTexto(
            "footerTotalDeduction",
            "- " +
            formatMoney(
                totalDeduction
            )
        );

        actualizarTexto(
            "footerTotalNet",
            formatMoney(
                totalNet
            )
        );

        actualizarEstadoVacio();
    }


    /* =========================================================
       ACTUALIZAR TEXTO DE UN ELEMENTO
    ========================================================== */

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


    /* =========================================================
       ACTUALIZAR ESTADO VACÍO
    ========================================================== */

    function actualizarEstadoVacio() {

        const cantidad =
            empleadosPlanilla.length;

        emptyPayroll.classList.toggle(
            "d-none",
            cantidad > 0
        );
    }


    /* =========================================================
       LISTA DE EMPLEADOS DEL MODAL
    ========================================================== */

    function renderEmployeeList(
        lista
    ) {

        employeeList.innerHTML = "";

        if (!lista.length) {

            noEmployeesFound.classList.remove(
                "d-none"
            );

            return;
        }

        noEmployeesFound.classList.add(
            "d-none"
        );

        lista.forEach(
            empleado => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "employee-option";

                button.innerHTML = `

                    <div class="avatar">

                        ${getInitials(
                            empleado.nombre
                        )}

                    </div>

                    <div class="employee-option-info">

                        <strong>

                            ${escapeHtml(
                                empleado.nombre
                            )}

                        </strong>

                        <small>

                            ${escapeHtml(
                                empleado.codigo
                            )}

                            · Identidad:

                            ${escapeHtml(
                                empleado.identidad
                            )}

                            · Salario:

                            ${formatMoney(
                                empleado.salario
                            )}

                        </small>

                    </div>

                    <i class="bi bi-plus-circle"></i>

                `;

                button.addEventListener(
                    "click",
                    () => {

                        const added =
                            addEmployeeToPayroll(
                                empleado
                            );

                        if (added) {

                            const modal =
                                bootstrap.Modal
                                    .getInstance(
                                        addEmployeeModal
                                    );

                            if (modal) {
                                modal.hide();
                            }
                        }
                    }
                );

                employeeList.appendChild(
                    button
                );
            }
        );
    }


    /* =========================================================
       BUSCAR EMPLEADO EN MODAL
    ========================================================== */

    modalSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .toLowerCase()
                    .trim();

            const results =
                empleadosBD.filter(
                    empleado => {

                        return (

                            empleado.nombre
                                .toLowerCase()
                                .includes(
                                    search
                                )

                            ||

                            empleado.identidad
                                .toLowerCase()
                                .includes(
                                    search
                                )

                            ||

                            empleado.codigo
                                .toLowerCase()
                                .includes(
                                    search
                                )
                        );
                    }
                );

            renderEmployeeList(
                results
            );
        }
    );


    /* =========================================================
       MODAL AL ABRIR
    ========================================================== */

    addEmployeeModal.addEventListener(
        "show.bs.modal",
        () => {

            modalSearch.value = "";

            renderEmployeeList(
                empleadosBD
            );
        }
    );


    /* =========================================================
       BUSCAR EN TABLA
    ========================================================== */

    searchEmployee.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .toLowerCase()
                    .trim();

            tableBody
                .querySelectorAll("tr")
                .forEach(
                    row => {

                        const name =
                            (
                                row.dataset.name ||
                                ""
                            ).toLowerCase();

                        const identity =
                            (
                                row.dataset.identity ||
                                ""
                            ).toLowerCase();

                        const code =
                            (
                                row.dataset.code ||
                                ""
                            ).toLowerCase();

                        const visible =
                            name.includes(
                                search
                            ) ||
                            identity.includes(
                                search
                            ) ||
                            code.includes(
                                search
                            );

                        row.style.display =
                            visible
                                ? ""
                                : "none";
                    }
                );
        }
    );


    /* =========================================================
       ELIMINAR EMPLEADO
    ========================================================== */

    tableBody.addEventListener(
        "click",
        event => {

            const deleteButton =
                event.target.closest(
                    ".btn-delete"
                );

            if (!deleteButton) {
                return;
            }

            const row =
                deleteButton.closest(
                    "tr"
                );

            if (!row) {
                return;
            }

            const employeeId =
                Number(
                    row.dataset.employeeId
                );

            const empleado =
                empleadosPlanilla.find(
                    item =>
                        Number(item.id) ===
                        employeeId
                );

            if (!empleado) {
                return;
            }

            if (
                confirm(
                    `¿Deseas quitar a ${empleado.nombre} de esta planilla?`
                )
            ) {

                empleadosPlanilla =
                    empleadosPlanilla.filter(
                        item =>
                            Number(item.id) !==
                            employeeId
                    );

                renderPayrollTable();

                calculatePayroll();
            }
        }
    );


    /* =========================================================
       GENERAR / RECALCULAR PLANILLA
    ========================================================== */

    generatePayrollBtn.addEventListener(
        "click",
        async () => {

            if (!validarFechas()) {
                return;
            }

            generatePayrollBtn.disabled =
                true;

            generatePayrollBtn.innerHTML = `

                <span
                    class="spinner-border spinner-border-sm"
                    role="status">
                </span>

                Generando...

            `;

            try {

                await cargarMovimientos();

                /*
                 * Si ya existen empleados seleccionados,
                 * recalculamos sus movimientos.
                 */

                empleadosPlanilla =
                    empleadosPlanilla.map(
                        empleado => {

                            const movimientos =
                                calcularMovimientosEmpleado(
                                    empleado.id,
                                    startDate.value,
                                    endDate.value
                                );

                            return {

                                ...empleado,

                                bonus:
                                    movimientos.bonus,

                                advance:
                                    movimientos.advance,

                                deduction:
                                    movimientos.deduction,

                                movimientos:
                                    movimientos.movimientos
                            };
                        }
                    );


                /*
                 * Si no hay empleados seleccionados,
                 * cargamos todos los empleados activos.
                 */

                if (
                    empleadosPlanilla.length === 0
                ) {

                    empleadosPlanilla =
                        empleadosBD.map(
                            empleado => {

                                const movimientos =
                                    calcularMovimientosEmpleado(
                                        empleado.id,
                                        startDate.value,
                                        endDate.value
                                    );

                                return {

                                    id:
                                        empleado.id,

                                    nombre:
                                        empleado.nombre,

                                    identidad:
                                        empleado.identidad,

                                    codigo:
                                        empleado.codigo,

                                    salario:
                                        empleado.salario,

                                    bonus:
                                        movimientos.bonus,

                                    advance:
                                        movimientos.advance,

                                    deduction:
                                        movimientos.deduction,

                                    movimientos:
                                        movimientos.movimientos
                                };
                            }
                        );
                }

                renderPayrollTable();

                calculatePayroll();

                planillaGenerada =
                    true;

                mostrarMensaje(
                    "Planilla generada correctamente.",
                    "success"
                );

            } catch (error) {

                console.error(
                    "Error generando planilla:",
                    error
                );

                mostrarMensaje(
                    "No fue posible generar la planilla.",
                    "danger"
                );

            } finally {

                generatePayrollBtn.disabled =
                    false;

                generatePayrollBtn.innerHTML = `

                    <i class="bi bi-calculator"></i>

                    Generar planilla

                `;
            }
        }
    );


    /* =========================================================
       CAMBIO DE FECHA INICIAL
    ========================================================== */

    startDate.addEventListener(
        "change",
        () => {

            if (
                startDate.value &&
                endDate.value &&
                startDate.value >
                endDate.value
            ) {

                endDate.value =
                    sumarDias(
                        startDate.value,
                        6
                    );
            }

            recalcularEmpleadosSeleccionados();
        }
    );


    /* =========================================================
       CAMBIO DE FECHA FINAL
    ========================================================== */

    endDate.addEventListener(
        "change",
        () => {

            recalcularEmpleadosSeleccionados();
        }
    );


    /* =========================================================
       RECALCULAR EMPLEADOS SELECCIONADOS
    ========================================================== */

    function recalcularEmpleadosSeleccionados() {

        if (
            !startDate.value ||
            !endDate.value
        ) {
            return;
        }

        empleadosPlanilla =
            empleadosPlanilla.map(
                empleado => {

                    const movimientos =
                        calcularMovimientosEmpleado(
                            empleado.id,
                            startDate.value,
                            endDate.value
                        );

                    return {

                        ...empleado,

                        bonus:
                            movimientos.bonus,

                        advance:
                            movimientos.advance,

                        deduction:
                            movimientos.deduction,

                        movimientos:
                            movimientos.movimientos
                    };
                }
            );

        renderPayrollTable();

        calculatePayroll();
    }


    /* =========================================================
       GUARDAR PLANILLA EN SPRING BOOT
    ========================================================== */

    savePayrollBtn.addEventListener(
        "click",
        async () => {

            if (guardandoPlanilla) {
                return;
            }

            if (!validarFechas()) {
                return;
            }

            if (
                empleadosPlanilla.length === 0
            ) {

                mostrarMensaje(
                    "Agrega al menos un empleado antes de guardar la planilla.",
                    "warning"
                );

                return;
            }

            calculatePayroll();

            /*
             * Generamos el número de planilla.
             */

            const numeroPlanilla =
                generarNumeroPlanilla();


            /*
             * Construimos el objeto que Spring Boot
             * recibirá mediante @RequestBody Planilla.
             *
             * IMPORTANTE:
             *
             * HistorialPlanilla tiene:
             *
             * @ManyToOne
             * private Empleado empleado;
             *
             * Por eso enviamos:
             *
             * empleado: {
             *     id: empleado.id
             * }
             */

            const planilla = {

                numeroPlanilla:
                    numeroPlanilla,

                fechaInicio:
                    startDate.value,

                fechaFin:
                    endDate.value,

                fechaPago:
                    paymentDate.value,

                estado:
                    "PENDIENTE",

                empleados:
                    empleadosPlanilla.map(
                        empleado => ({

                            empleado: {
                                id:
                                    empleado.id
                            },

                            salario:
                                Number(
                                    empleado.salario
                                ) || 0,

                            bonos:
                                Number(
                                    empleado.bonus
                                ) || 0,

                            anticipos:
                                Number(
                                    empleado.advance
                                ) || 0,

                            deducciones:
                                Number(
                                    empleado.deduction
                                ) || 0

                        })
                    )
            };


            console.log(
                "Enviando planilla:",
                planilla
            );


            /* =================================================
               CAMBIAR ESTADO DEL BOTÓN
            ================================================== */

            guardandoPlanilla =
                true;

            savePayrollBtn.disabled =
                true;

            const textoOriginal =
                savePayrollBtn.innerHTML;

            savePayrollBtn.innerHTML = `

                <span
                    class="spinner-border spinner-border-sm"
                    role="status">
                </span>

                Guardando...

            `;


            try {

                /* =============================================
                   POST A SPRING BOOT
                ============================================== */

                const response =
                    await fetch(
                        API.planillas,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    planilla
                                )
                        }
                    );


                /* =============================================
                   LEER RESPUESTA
                ============================================== */

                let data = null;

                const contentType =
                    response.headers.get(
                        "content-type"
                    );

                if (
                    contentType &&
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    data =
                        await response.json();

                } else {

                    const texto =
                        await response.text();

                    if (texto) {
                        data = texto;
                    }
                }


                /* =============================================
                   MANEJAR ERROR HTTP
                ============================================== */

                if (!response.ok) {

                    let mensaje =
                        `Error HTTP ${response.status}.`;

                    if (
                        data &&
                        typeof data === "object"
                    ) {

                        mensaje =
                            data.message ??
                            data.error ??
                            mensaje;

                    } else if (
                        typeof data === "string" &&
                        data.trim()
                    ) {

                        mensaje =
                            data;
                    }

                    throw new Error(
                        mensaje
                    );
                }


                /* =============================================
                   GUARDADO CORRECTO
                ============================================== */

                console.log(
                    "Planilla guardada correctamente:",
                    data
                );

                planillaGenerada =
                    true;

                mostrarMensaje(
                    `Planilla ${numeroPlanilla} guardada correctamente.`,
                    "success"
                );


                /*
                 * Evitamos que el usuario vuelva a
                 * guardar exactamente la misma planilla.
                 */

                savePayrollBtn.disabled =
                    true;


                /*
                 * Opcionalmente redirigimos al historial
                 * después de guardar.
                 *
                 * Se deja con un pequeño retraso para que
                 * el usuario pueda ver el mensaje.
                 */

                setTimeout(
                    () => {

                        window.location.href =
                            "/planillas/historial";

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Error guardando planilla:",
                    error
                );

                mostrarMensaje(
                    "No se pudo guardar la planilla: "
                    + error.message,
                    "danger"
                );

            } finally {

                guardandoPlanilla =
                    false;

                /*
                 * Si no se guardó correctamente,
                 * volvemos a habilitar el botón.
                 */

                if (
                    !planillaGenerada ||
                    savePayrollBtn.disabled === false
                ) {

                    savePayrollBtn.disabled =
                        false;
                }

                savePayrollBtn.innerHTML =
                    textoOriginal;
            }
        }
    );


    /* =========================================================
       CANCELAR
    ========================================================== */

    cancelPayrollBtn.addEventListener(
        "click",
        () => {

            if (
                empleadosPlanilla.length === 0 ||
                confirm(
                    "¿Deseas cancelar esta planilla?"
                )
            ) {

                window.history.back();
            }
        }
    );


    /* =========================================================
       MENSAJES
    ========================================================== */

    function mostrarMensaje(
        mensaje,
        tipo = "info"
    ) {

        const anterior =
            document.getElementById(
                "payrollMessage"
            );

        if (anterior) {
            anterior.remove();
        }

        const alert =
            document.createElement(
                "div"
            );

        alert.id =
            "payrollMessage";

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

            page.prepend(
                alert
            );

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


    /* =========================================================
       OBTENER INICIALES
    ========================================================== */

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


    /* =========================================================
       ESCAPAR HTML
    ========================================================== */

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


    /* =========================================================
       INICIALIZACIÓN
    ========================================================== */

    async function inicializar() {

        establecerFechasIniciales();

        /*
         * Cargar empleados y movimientos
         * desde Spring Boot.
         */

        await Promise.all([
            cargarEmpleados(),
            cargarMovimientos()
        ]);

        /*
         * Inicialmente la tabla queda vacía.
         */

        empleadosPlanilla = [];

        renderPayrollTable();

        calculatePayroll();
    }


    /* =========================================================
       INICIAR
    ========================================================== */

    inicializar();

});