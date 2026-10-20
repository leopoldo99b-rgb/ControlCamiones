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

/**
 * ============================================================
 * RECIBOS PROFESIONALES DE PAGO DE PLANILLA
 * TRANSPORTES CHC
 * ============================================================
 *
 * Genera UN RECIBO POR CADA EMPLEADO.
 *
 * El documento:
 * - No genera página de resumen.
 * - Cada empleado ocupa una página.
 * - Está preparado para imprimir o guardar como PDF.
 * - Incluye espacio para firma del trabajador.
 * - Incluye número de planilla y número de recibo.
 * - Incluye referencia de transferencia.
 *
 * Logo:
 * /imgs/logo.png
 */

const CONFIG_DOCUMENTO_PAGO = {

    empresa: {

        nombre: "Transportes CHC",

        rtn: "RTN: ______________________________",

        direccion: "____________________________________________",

        telefono: "Tel.: __________________________",

        correo: "Correo: _________________________",

        ciudad: "San Pedro Sula, Honduras",

        logo: "/imgs/logo.png"

    }

};


/**
 * ============================================================
 * FORMATO DE MONEDA
 * ============================================================
 */

function formatoLempiras(valor) {

    const numero = Number(valor) || 0;

    return numero.toLocaleString("es-HN", {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2

    }) + " L";

}


/**
 * ============================================================
 * ESCAPAR HTML
 * ============================================================
 */

function escaparHTML(valor) {

    return String(valor ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/**
 * ============================================================
 * LIMPIAR NÚMEROS
 * ============================================================
 */

function limpiarNumero(texto) {

    if (!texto) {

        return 0;

    }

    let valor = String(texto)

        .replace(/[^\d,.-]/g, "");

    /**
     * Manejar formatos como:
     *
     * 8,500.00
     * 8500.00
     * 8.500,00
     *
     */

    if (

        valor.includes(",") &&

        valor.includes(".")

    ) {

        if (valor.lastIndexOf(",") > valor.lastIndexOf(".")) {

            valor = valor

                .replace(/\./g, "")

                .replace(",", ".");

        } else {

            valor = valor.replace(/,/g, "");

        }

    }

    else if (valor.includes(",")) {

        const partes = valor.split(",");

        if (partes[partes.length - 1].length === 2) {

            valor = valor.replace(",", ".");

        } else {

            valor = valor.replace(/,/g, "");

        }

    }

    return parseFloat(valor) || 0;

}


/**
 * ============================================================
 * FORMATO DE FECHA
 * ============================================================
 */

function fechaDocumento(fecha) {

    if (!fecha) {

        return "________________";

    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {

        return fecha;

    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


/**
 * ============================================================
 * NÚMERO DE PLANILLA
 * ============================================================
 */

function generarNumeroPlanilla() {

    const fecha = new Date();

    const anio = fecha.getFullYear();

    const mes = String(fecha.getMonth() + 1)

        .padStart(2, "0");

    const dia = String(fecha.getDate())

        .padStart(2, "0");

    const hora = String(fecha.getHours())

        .padStart(2, "0");

    const minuto = String(fecha.getMinutes())

        .padStart(2, "0");

    const segundo = String(fecha.getSeconds())

        .padStart(2, "0");

    return `PLAN-${anio}${mes}${dia}-${hora}${minuto}${segundo}`;

}


/**
 * ============================================================
 * OBTENER EMPLEADOS DE LA TABLA
 * ============================================================
 */

function obtenerEmpleadosDePlanilla() {

    const tbody = document.getElementById("payrollTableBody");

    if (!tbody) {

        return [];

    }

    const filas = tbody.querySelectorAll("tr");

    const empleados = [];

    filas.forEach((fila, index) => {

        const celdas = fila.querySelectorAll("td");

        if (celdas.length < 6) {

            return;

        }

        const empleado = {

            numero: index + 1,

            id: fila.dataset.empleadoId || "",

            nombre:
                fila.dataset.nombre ||
                celdas[0]?.innerText.trim() ||
                "",

            identidad:
                fila.dataset.identidad ||
                "",

            codigo:
                fila.dataset.codigo ||
                "",

            cargo:
                fila.dataset.cargo ||
                "",

            departamento:
                fila.dataset.departamento ||
                "",

            salario:
                parseFloat(
                    fila.dataset.salario ||
                    limpiarNumero(celdas[1]?.innerText)
                ) || 0,

            bonos:
                parseFloat(
                    fila.dataset.bonos ||
                    limpiarNumero(celdas[2]?.innerText)
                ) || 0,

            anticipos:
                parseFloat(
                    fila.dataset.anticipos ||
                    limpiarNumero(celdas[3]?.innerText)
                ) || 0,

            deducciones:
                parseFloat(
                    fila.dataset.deducciones ||
                    limpiarNumero(celdas[4]?.innerText)
                ) || 0,

            neto:
                parseFloat(
                    fila.dataset.neto ||
                    limpiarNumero(celdas[5]?.innerText)
                ) || 0,

            formaPago:
                fila.dataset.formaPago ||
                "TRANSFERENCIA BANCARIA",

            referenciaPago:
                fila.dataset.referenciaPago ||
                "Pendiente de registrar"

        };

        empleados.push(empleado);

    });

    return empleados;

}


/**
 * ============================================================
 * GENERAR DOCUMENTO
 * ============================================================
 */

function generarDocumentoPlanilla() {

    const empleados = obtenerEmpleadosDePlanilla();

    if (!empleados.length) {

        alert(

            "No hay empleados en la planilla.\n\n" +

            "Agrega al menos un empleado antes de generar los recibos."

        );

        return;

    }


    const startDate =
        document.getElementById("startDate")?.value || "";

    const endDate =
        document.getElementById("endDate")?.value || "";

    const paymentDate =
        document.getElementById("paymentDate")?.value || "";


    if (!startDate || !endDate || !paymentDate) {

        alert(

            "Debes ingresar la fecha inicial, fecha final y fecha de pago."

        );

        return;

    }


    const numeroPlanilla = generarNumeroPlanilla();


    const documento = construirDocumentoPlanilla({

        empleados,

        startDate,

        endDate,

        paymentDate,

        numeroPlanilla

    });


    const ventana = window.open(

        "",

        "_blank",

        "width=1100,height=850"

    );


    if (!ventana) {

        alert(

            "El navegador bloqueó la ventana del documento.\n\n" +

            "Permite ventanas emergentes para este sitio."

        );

        return;

    }


    ventana.document.open();

    ventana.document.write(documento);

    ventana.document.close();

}


/**
 * ============================================================
 * CONSTRUIR DOCUMENTO
 * ============================================================
 */

function construirDocumentoPlanilla(datos) {

    const {

        empleados,

        startDate,

        endDate,

        paymentDate,

        numeroPlanilla

    } = datos;


    const constancias = empleados

        .map((empleado, index) => {

            const numeroRecibo =

                `${numeroPlanilla}-${String(index + 1).padStart(3, "0")}`;


            const totalIngresos =

                Number(empleado.salario || 0) +

                Number(empleado.bonos || 0);


            const totalDescuentos =

                Number(empleado.anticipos || 0) +

                Number(empleado.deducciones || 0);


            const netoCalculado =

                totalIngresos - totalDescuentos;


            /**
             * Preferimos el neto que ya calcula tu sistema.
             *
             * Si por alguna razón viene vacío,
             * usamos el cálculo local.
             */

            const neto =

                Number.isFinite(Number(empleado.neto)) &&

                Number(empleado.neto) !== 0

                    ? Number(empleado.neto)

                    : netoCalculado;


            return `

<section class="receipt-page">


    <!-- ====================================================
         MEMBRETE
         ==================================================== -->

    <header class="letterhead">


        <div class="logo-container">

            <img

                src="${CONFIG_DOCUMENTO_PAGO.empresa.logo}"

                class="company-logo"

                alt="Logo Transportes CHC"

                onerror="this.style.display='none';"

            >

        </div>


        <div class="company-info">

            <div class="company-name">

                ${escaparHTML(

                    CONFIG_DOCUMENTO_PAGO.empresa.nombre

                )}

            </div>


            <div class="company-subtitle">

                SERVICIO DE TRANSPORTE

            </div>


            <div class="company-details">

                ${escaparHTML(

                    CONFIG_DOCUMENTO_PAGO.empresa.rtn

                )}

                &nbsp;&nbsp; | &nbsp;&nbsp;

                ${escaparHTML(

                    CONFIG_DOCUMENTO_PAGO.empresa.direccion

                )}

            </div>


            <div class="company-details">

                ${escaparHTML(

                    CONFIG_DOCUMENTO_PAGO.empresa.telefono

                )}

                &nbsp;&nbsp; | &nbsp;&nbsp;

                ${escaparHTML(

                    CONFIG_DOCUMENTO_PAGO.empresa.correo

                )}

            </div>

        </div>


        <div class="document-status">

            <span>DOCUMENTO</span>

            <strong>PAGO DE PLANILLA</strong>

        </div>


    </header>


    <!-- ====================================================
         CABECERA DEL RECIBO
         ==================================================== -->

    <div class="document-header">


        <div>

            <h1>

                RECIBO DE PAGO

            </h1>


            <p>

                CONSTANCIA INDIVIDUAL DE RECEPCIÓN DE PLANILLA

            </p>

        </div>


        <div class="document-identification">


            <div>

                <span>N.º DE PLANILLA</span>

                <strong>

                    ${numeroPlanilla}

                </strong>

            </div>


            <div>

                <span>N.º DE RECIBO</span>

                <strong>

                    ${numeroRecibo}

                </strong>

            </div>


        </div>


    </div>


    <!-- ====================================================
         DATOS DEL EMPLEADO
         ==================================================== -->

    <div class="block-title">

        DATOS DEL TRABAJADOR

    </div>


    <div class="employee-card">


        <div class="employee-row">


            <div class="employee-field employee-name">

                <span>NOMBRE COMPLETO</span>

                <strong>

                    ${escaparHTML(empleado.nombre)}

                </strong>

            </div>


            <div class="employee-field">

                <span>IDENTIDAD</span>

                <strong>

                    ${escaparHTML(

                        empleado.identidad || "—"

                    )}

                </strong>

            </div>


        </div>


        <div class="employee-row">


            <div class="employee-field">

                <span>CÓDIGO DE EMPLEADO</span>

                <strong>

                    ${escaparHTML(

                        empleado.codigo || "—"

                    )}

                </strong>

            </div>


            <div class="employee-field">

                <span>CARGO</span>

                <strong>

                    ${escaparHTML(

                        empleado.cargo || "—"

                    )}

                </strong>

            </div>


            <div class="employee-field">

                <span>DEPARTAMENTO</span>

                <strong>

                    ${escaparHTML(

                        empleado.departamento || "—"

                    )}

                </strong>

            </div>


        </div>


    </div>


    <!-- ====================================================
         PERÍODO
         ==================================================== -->

    <div class="period-card">


        <div>

            <span>PERÍODO DE PAGO</span>

            <strong>

                ${fechaDocumento(startDate)}

                &nbsp; — &nbsp;

                ${fechaDocumento(endDate)}

            </strong>

        </div>


        <div>

            <span>FECHA DE PAGO</span>

            <strong>

                ${fechaDocumento(paymentDate)}

            </strong>

        </div>


    </div>


    <!-- ====================================================
         DETALLE ECONÓMICO
         ==================================================== -->

    <div class="block-title">

        DETALLE DEL PAGO

    </div>


    <table class="payment-table">


        <thead>

            <tr>

                <th>

                    CONCEPTO

                </th>

                <th class="amount-column">

                    MONTO

                </th>

            </tr>

        </thead>


        <tbody>


            <tr>

                <td>

                    Salario

                </td>

                <td class="amount-column">

                    ${formatoLempiras(

                        empleado.salario

                    )}

                </td>

            </tr>


            <tr>

                <td>

                    Bonos / Ingresos adicionales

                </td>

                <td class="amount-column positive">

                    ${formatoLempiras(

                        empleado.bonos

                    )}

                </td>

            </tr>


            <tr class="subtotal">

                <td>

                    TOTAL INGRESOS

                </td>

                <td class="amount-column">

                    ${formatoLempiras(

                        totalIngresos

                    )}

                </td>

            </tr>


            <tr>

                <td>

                    Anticipos

                </td>

                <td class="amount-column negative">

                    - ${formatoLempiras(

                        empleado.anticipos

                    )}

                </td>

            </tr>


            <tr>

                <td>

                    Deducciones

                </td>

                <td class="amount-column negative">

                    - ${formatoLempiras(

                        empleado.deducciones

                    )}

                </td>

            </tr>


            <tr class="discount-total">

                <td>

                    TOTAL DESCUENTOS

                </td>

                <td class="amount-column">

                    - ${formatoLempiras(

                        totalDescuentos

                    )}

                </td>

            </tr>


        </tbody>


        <tfoot>

            <tr>

                <td>

                    NETO A PAGAR

                </td>

                <td class="amount-column">

                    ${formatoLempiras(neto)}

                </td>

            </tr>

        </tfoot>


    </table>


    <!-- ====================================================
         TOTAL DESTACADO
         ==================================================== -->

    <div class="net-box">


        <div>

            <span>MONTO NETO PAGADO</span>

            <small>

                Correspondiente al período indicado

            </small>

        </div>


        <strong>

            ${formatoLempiras(neto)}

        </strong>


    </div>


    <!-- ====================================================
         INFORMACIÓN DEL PAGO
         ==================================================== -->

    <div class="block-title">

        INFORMACIÓN DE LA OPERACIÓN

    </div>


    <div class="payment-information">


        <div class="payment-field">

            <span>FORMA DE PAGO</span>

            <strong>

                ${escaparHTML(

                    empleado.formaPago

                )}

            </strong>

        </div>


        <div class="payment-field payment-reference">

            <span>

                N.º / REFERENCIA DE TRANSFERENCIA

            </span>

            <strong>

                ${escaparHTML(

                    empleado.referenciaPago

                )}

            </strong>

        </div>


    </div>


    <!-- ====================================================
         CONSTANCIA
         ==================================================== -->

    <div class="acknowledgement">


        <div class="acknowledgement-title">

            CONSTANCIA DE RECEPCIÓN

        </div>


        <p>

            Yo,

            <strong>

                ${escaparHTML(empleado.nombre)}

            </strong>,

            identificado(a) con número de identidad

            <strong>

                ${escaparHTML(

                    empleado.identidad ||

                    "____________________________"

                )}

            </strong>,

            hago constar que he recibido de

            <strong>Transportes CHC</strong>

            el monto neto de

            <strong>

                ${formatoLempiras(neto)}

            </strong>,

            correspondiente al período comprendido entre

            <strong>

                ${fechaDocumento(startDate)}

            </strong>

            y

            <strong>

                ${fechaDocumento(endDate)}

            </strong>,

            conforme al detalle consignado en el presente recibo.

        </p>


        <p>

            La firma del presente documento deja constancia

            de la recepción del monto neto indicado para el

            período señalado y no implica renuncia a derechos

            laborales que correspondan al trabajador conforme

            a la legislación vigente.

        </p>


    </div>


    <!-- ====================================================
         FIRMAS
         ==================================================== -->

    <div class="signature-area">


        <div class="signature-box">


            <div class="signature-space"></div>


            <div class="signature-line"></div>


            <strong>

                FIRMA DEL TRABAJADOR

            </strong>


            <span>

                ${escaparHTML(

                    empleado.nombre

                )}

            </span>


            <span>

                Identidad:

                ${escaparHTML(

                    empleado.identidad ||

                    "____________________________"

                )}

            </span>


            <span>

                Fecha:

                ______________________

            </span>


        </div>


        <div class="signature-box">


            <div class="signature-space"></div>


            <div class="signature-line"></div>


            <strong>

                FIRMA DEL RESPONSABLE DEL PAGO

            </strong>


            <span>

                Nombre:

                ______________________________

            </span>


            <span>

                Identidad:

                ______________________________

            </span>


            <span>

                Fecha:

                ______________________

            </span>


        </div>


    </div>


    <!-- ====================================================
         NOTA FINAL
         ==================================================== -->

    <div class="document-note">

        Documento generado por el sistema de gestión de

        planillas de ${escaparHTML(

            CONFIG_DOCUMENTO_PAGO.empresa.nombre

        )}.

        Conserve este recibo junto con el comprobante

        correspondiente de la operación de pago.

    </div>


    <!-- ====================================================
         PIE
         ==================================================== -->

    <footer class="document-footer">


        <span>

            ${escaparHTML(

                CONFIG_DOCUMENTO_PAGO.empresa.nombre

            )}

        </span>


        <span>

            Planilla: ${numeroPlanilla}

        </span>


        <span>

            Recibo ${index + 1} de ${empleados.length}

        </span>


    </footer>


</section>

            `;

        })

        .join("");


    /**
     * ========================================================
     * DOCUMENTO HTML COMPLETO
     * ========================================================
     */

    return `

<!DOCTYPE html>

<html lang="es">


<head>


<meta charset="UTF-8">


<meta name="viewport"

      content="width=device-width, initial-scale=1.0">


<title>

    Recibos de Pago - ${numeroPlanilla}

</title>


<style>


/* ============================================================
   CONFIGURACIÓN GENERAL
   ============================================================ */


* {

    box-sizing: border-box;

}


html,

body {

    margin: 0;

    padding: 0;

}


body {

    background: #e5e7eb;

    color: #20252b;

    font-family:

        Arial,

        Helvetica,

        sans-serif;

    font-size: 11px;

    line-height: 1.45;

}


/* ============================================================
   PÁGINA
   ============================================================ */


.receipt-page {

    width: 100%;

    min-height: 250mm;

    background: #ffffff;

    margin: 0 auto 20px auto;

    padding: 9mm 10mm 20mm 10mm;

    position: relative;

    page-break-after: always;

}


.receipt-page:last-child {

    page-break-after: auto;

}


/* ============================================================
   MEMBRETE
   ============================================================ */


.letterhead {

    display: flex;

    align-items: center;

    gap: 15px;

    padding-bottom: 10px;

    border-bottom: 3px solid #173b72;

    margin-bottom: 17px;

}


.logo-container {

    width: 105px;

    height: 68px;

    min-width: 105px;

    display: flex;

    align-items: center;

    justify-content: center;

    background: #173b72;

    border-radius: 7px;

    overflow: hidden;

    padding: 7px;

}


.company-logo {

    max-width: 92px;

    max-height: 58px;

    width: auto;

    height: auto;

    object-fit: contain;

}


/*

 * Como el logo original es blanco,

 * el fondo azul hace que sea visible.

 */


.company-info {

    flex: 1;

}


.company-name {

    color: #173b72;

    font-size: 21px;

    font-weight: 800;

    text-transform: uppercase;

    letter-spacing: .7px;

}


.company-subtitle {

    color: #536170;

    font-size: 9px;

    font-weight: 700;

    margin-top: 2px;

    letter-spacing: .5px;

}


.company-details {

    color: #69737d;

    font-size: 8px;

    margin-top: 2px;

}


.document-status {

    text-align: right;

    min-width: 135px;

}


.document-status span {

    display: block;

    color: #7a838d;

    font-size: 7px;

    font-weight: 700;

}


.document-status strong {

    display: block;

    color: #173b72;

    font-size: 9px;

    margin-top: 2px;

}


/* ============================================================
   TÍTULO
   ============================================================ */


.document-header {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 20px;

    margin-bottom: 15px;

}


.document-header h1 {

    margin: 0;

    color: #173b72;

    font-size: 19px;

    letter-spacing: .7px;

}


.document-header p {

    margin: 3px 0 0 0;

    color: #707a84;

    font-size: 8px;

    font-weight: 700;

}


.document-identification {

    min-width: 205px;

    border: 1px solid #ccd5df;

    border-radius: 6px;

    overflow: hidden;

    background: #f8fafc;

}


.document-identification div {

    padding: 6px 9px;

    border-bottom: 1px solid #dce2e8;

}


.document-identification div:last-child {

    border-bottom: 0;

}


.document-identification span {

    display: block;

    color: #7a838c;

    font-size: 7px;

    font-weight: 700;

}


.document-identification strong {

    display: block;

    color: #173b72;

    font-size: 9px;

    margin-top: 1px;

}


/* ============================================================
   TÍTULOS DE BLOQUE
   ============================================================ */


.block-title {

    color: #173b72;

    font-size: 9px;

    font-weight: 800;

    letter-spacing: .5px;

    border-bottom: 2px solid #173b72;

    padding-bottom: 4px;

    margin: 12px 0 7px 0;

}


/* ============================================================
   EMPLEADO
   ============================================================ */


.employee-card {

    border: 1px solid #d5dce4;

    border-radius: 5px;

    overflow: hidden;

}


.employee-row {

    display: flex;

    border-bottom: 1px solid #e2e6eb;

}


.employee-row:last-child {

    border-bottom: 0;

}


.employee-field {

    flex: 1;

    padding: 7px 9px;

    border-right: 1px solid #e2e6eb;

}


.employee-field:last-child {

    border-right: 0;

}


.employee-name {

    flex: 2;

}


.employee-field span {

    display: block;

    color: #737d87;

    font-size: 7px;

    font-weight: 700;

    margin-bottom: 2px;

}


.employee-field strong {

    display: block;

    color: #252b31;

    font-size: 10px;

}


/* ============================================================
   PERÍODO
   ============================================================ */


.period-card {

    display: flex;

    border: 1px solid #d5dce4;

    border-radius: 5px;

    background: #f7f9fb;

    margin-top: 11px;

}


.period-card > div {

    flex: 1;

    padding: 8px 10px;

    border-right: 1px solid #d8dee5;

}


.period-card > div:last-child {

    border-right: 0;

}


.period-card span {

    display: block;

    color: #737d87;

    font-size: 7px;

    font-weight: 700;

}


.period-card strong {

    display: block;

    color: #252b31;

    font-size: 10px;

    margin-top: 2px;

}


/* ============================================================
   TABLA DE PAGO
   ============================================================ */


.payment-table {

    width: 100%;

    border-collapse: collapse;

    margin-bottom: 10px;

}


.payment-table th {

    background: #173b72;

    color: #ffffff;

    padding: 7px 9px;

    text-align: left;

    font-size: 8px;

    letter-spacing: .3px;

}


.payment-table td {

    padding: 6px 9px;

    border-bottom: 1px solid #e0e5ea;

    font-size: 9px;

}


.payment-table .amount-column {

    width: 180px;

    text-align: right;

    white-space: nowrap;

}


.payment-table .positive {

    color: #237044;

}


.payment-table .negative {

    color: #a13a3a;

}


.payment-table .subtotal td {

    border-top: 1px solid #bfc8d2;

    font-weight: 700;

}


.payment-table .discount-total td {

    font-weight: 700;

    color: #7d3434;

}


.payment-table tfoot td {

    background: #173b72;

    color: #ffffff;

    padding: 9px;

    font-size: 12px;

    font-weight: 800;

}


/* ============================================================
   NETO
   ============================================================ */


.net-box {

    display: flex;

    justify-content: space-between;

    align-items: center;

    background: #eef3fa;

    border: 1px solid #bdcce0;

    border-left: 5px solid #173b72;

    border-radius: 5px;

    padding: 10px 13px;

    margin: 12px 0 14px 0;

}


.net-box span {

    display: block;

    color: #173b72;

    font-size: 9px;

    font-weight: 800;

}


.net-box small {

    display: block;

    color: #687481;

    font-size: 7px;

    margin-top: 2px;

}


.net-box strong {

    color: #173b72;

    font-size: 16px;

}


/* ============================================================
   INFORMACIÓN DE PAGO
   ============================================================ */


.payment-information {

    display: flex;

    border: 1px solid #d5dce4;

    border-radius: 5px;

    overflow: hidden;

}


.payment-field {

    flex: 1;

    padding: 8px 10px;

    border-right: 1px solid #d5dce4;

}


.payment-field:last-child {

    border-right: 0;

}


.payment-reference {

    flex: 1.5;

}


.payment-field span {

    display: block;

    color: #737d87;

    font-size: 7px;

    font-weight: 700;

    margin-bottom: 3px;

}


.payment-field strong {

    display: block;

    font-size: 9px;

    color: #252b31;

}


/* ============================================================
   CONSTANCIA
   ============================================================ */


.acknowledgement {

    background: #fafbfc;

    border: 1px solid #d5dce4;

    border-radius: 5px;

    padding: 10px 12px;

    margin-top: 14px;

}


.acknowledgement-title {

    color: #173b72;

    font-size: 9px;

    font-weight: 800;

    margin-bottom: 6px;

    letter-spacing: .4px;

}


.acknowledgement p {

    margin: 5px 0;

    text-align: justify;

    font-size: 8.5px;

}


.acknowledgement strong {

    color: #20252b;

}


.acknowledgement p:last-child {

    border-top: 1px solid #dfe4e9;

    padding-top: 6px;

    margin-top: 7px;

    color: #626d77;

    font-size: 7.5px;

}


/* ============================================================
   FIRMAS
   ============================================================ */


.signature-area {

    display: flex;

    gap: 55px;

    margin-top: 20px;

}


.signature-box {

    flex: 1;

    text-align: center;

}


.signature-space {

    height: 28px;

}


.signature-line {

    height: 1px;

    background: #222;

    margin-bottom: 5px;

}


.signature-box strong {

    display: block;

    font-size: 8px;

}


.signature-box span {

    display: block;

    color: #626b74;

    font-size: 7px;

    margin-top: 2px;

}


/* ============================================================
   NOTA
   ============================================================ */


.document-note {

    margin-top: 15px;

    padding-top: 6px;

    border-top: 1px solid #e0e4e8;

    color: #78818a;

    font-size: 7px;

    text-align: center;

}


/* ============================================================
   FOOTER
   ============================================================ */


.document-footer {

    position: absolute;

    bottom: 7mm;

    left: 10mm;

    right: 10mm;

    display: flex;

    justify-content: space-between;

    border-top: 1px solid #d9dee4;

    padding-top: 5px;

    color: #7b848d;

    font-size: 6.5px;

}


/* ============================================================
   CONTROLES
   ============================================================ */


.print-controls {

    position: fixed;

    top: 15px;

    right: 15px;

    z-index: 99999;

}


.print-button {

    border: 0;

    border-radius: 7px;

    padding: 11px 17px;

    background: #173b72;

    color: #ffffff;

    cursor: pointer;

    font-size: 12px;

    font-weight: 700;

    box-shadow: 0 4px 12px rgba(0,0,0,.18);

}


.print-button:hover {

    background: #102d59;

}


/* ============================================================
   IMPRESIÓN
   ============================================================ */


@page {

    size: Letter;

    margin: 10mm;

}


@media print {


    body {

        background: #ffffff;

    }


    .print-controls {

        display: none !important;

    }


    .receipt-page {

        margin: 0;

        width: 100%;

        min-height: 0;

        height: auto;

        page-break-after: always;

        break-after: page;

    }


    .receipt-page:last-child {

        page-break-after: auto;

        break-after: auto;

    }


    .letterhead,

    .employee-card,

    .period-card,

    .payment-table,

    .net-box,

    .payment-information,

    .acknowledgement,

    .signature-area {

        break-inside: avoid;

        page-break-inside: avoid;

    }


}


/* ============================================================
   PANTALLAS PEQUEÑAS
   ============================================================ */


@media screen and (max-width: 800px) {


    body {

        background: #ffffff;

    }


    .receipt-page {

        padding: 20px;

        margin-bottom: 0;

    }


    .letterhead {

        flex-wrap: wrap;

    }


    .document-status {

        display: none;

    }


    .document-header {

        flex-direction: column;

    }


    .document-identification {

        width: 100%;

    }


    .employee-row,

    .period-card,

    .payment-information,

    .signature-area {

        flex-direction: column;

    }


    .employee-field,

    .payment-field,

    .period-card > div {

        border-right: 0;

        border-bottom: 1px solid #e2e6eb;

    }


    .employee-field:last-child,

    .payment-field:last-child,

    .period-card > div:last-child {

        border-bottom: 0;

    }


    .payment-table {

        font-size: 8px;

    }


    .payment-table .amount-column {

        width: 130px;

    }


}


</style>


</head>


<body>


<div class="print-controls">

    <button

        class="print-button"

        onclick="window.print()">

        🖨 Imprimir / Guardar PDF

    </button>

</div>


<div class="document">


    ${constancias}


</div>


</body>


</html>

`;

}


/**
 * ============================================================
 * CONECTAR BOTÓN
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", () => {

    const botonGenerar =

        document.getElementById("generatePayrollBtn");


    if (!botonGenerar) {

        return;

    }


    botonGenerar.addEventListener(

        "click",

        generarDocumentoPlanilla

    );

});