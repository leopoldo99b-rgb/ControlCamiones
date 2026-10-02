/* =========================================================
   MOVIMIENTOS DE EMPLEADOS
   FRONTEND CONECTADO A SPRING BOOT
========================================================= */


/* =========================================================
   CONFIGURACIÓN DE ENDPOINTS
========================================================= */

const API = {
    movimientos: "/movimientos/api",
    empleados: "/empleados/api",
    estadisticas: "/movimientos/api/estadisticas"
};


/* =========================================================
   ESTADO
========================================================= */

let empleadosBD = [];
let movimientosBD = [];

let empleadoSeleccionado = null;
let movimientoEditando = null;
let movimientoEliminarId = null;


/* =========================================================
   DOM
========================================================= */

const buscarEmpleadoInput =
    document.getElementById("buscarEmpleadoMovimiento");

const employeeResults =
    document.getElementById("employeeResults");

const selectedEmployee =
    document.getElementById("selectedEmployee");

const empleadoSeleccionadoId =
    document.getElementById("empleadoSeleccionadoId");

const tipoMovimiento =
    document.getElementById("tipoMovimiento");

const montoMovimiento =
    document.getElementById("montoMovimiento");

const fechaMovimiento =
    document.getElementById("fechaMovimiento");

const descripcionMovimiento =
    document.getElementById("descripcionMovimiento");

const descripcionCounter =
    document.getElementById("descripcionCounter");

const movementPreview =
    document.getElementById("movementPreview");

const previewText =
    document.getElementById("previewText");

const previewEmployee =
    document.getElementById("previewEmployee");

const previewIcon =
    document.getElementById("previewIcon");

const filtroEmpleado =
    document.getElementById("filtroEmpleado");

const filtroTipo =
    document.getElementById("filtroTipo");

const buscarMovimiento =
    document.getElementById("buscarMovimiento");

const movimientosTableBody =
    document.getElementById("movimientosTableBody");

const emptyState =
    document.getElementById("emptyState");

const deleteModal =
    document.getElementById("deleteModal");


/* =========================================================
   INICIALIZACIÓN
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    establecerFechaActual();

    configurarEventos();

    await cargarDatosIniciales();

});


/* =========================================================
   CARGAR DATOS INICIALES
========================================================= */

async function cargarDatosIniciales() {

    try {

        /*
         * Los empleados y movimientos son independientes,
         * por lo tanto se cargan simultáneamente.
         */

        await Promise.all([
            cargarEmpleados(),
            cargarMovimientos()
        ]);

        cargarFiltroEmpleados();

        renderizarMovimientos();

        await actualizarEstadisticas();

    } catch (error) {

        console.error(
            "Error cargando datos iniciales:",
            error
        );

        mostrarToast(
            error.message ||
            "No se pudieron cargar los datos.",
            "error"
        );

    }

}


/* =========================================================
   CARGAR EMPLEADOS DESDE SPRING BOOT
========================================================= */

async function cargarEmpleados() {

    const response = await fetch(
        API.empleados,
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        }
    );


    const resultado =
        await obtenerRespuestaJSON(response);


    if (!response.ok) {

        throw new Error(
            obtenerMensajeError(
                resultado
            )
        );

    }


    /*
     * El endpoint debe devolver:
     *
     * [
     *   {
     *      id: 1,
     *      identidad: "...",
     *      nombreCompleto: "..."
     *   }
     * ]
     */

    if (Array.isArray(resultado)) {

        empleadosBD =
            resultado
                .map(normalizarEmpleado)
                .filter(Boolean);

    } else {

        empleadosBD = [];

    }


    console.log(
        "Empleados cargados:",
        empleadosBD
    );

}


/* =========================================================
   CARGAR MOVIMIENTOS DESDE SPRING BOOT
========================================================= */

async function cargarMovimientos() {

    const response = await fetch(
        API.movimientos,
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        }
    );


    const resultado =
        await obtenerRespuestaJSON(response);


    if (!response.ok) {

        throw new Error(
            obtenerMensajeError(
                resultado
            )
        );

    }


    if (Array.isArray(resultado)) {

        movimientosBD =
            resultado
                .map(normalizarMovimiento)
                .filter(Boolean);

    } else {

        movimientosBD = [];

    }


    console.log(
        "Movimientos cargados:",
        movimientosBD
    );

}


/* =========================================================
   NORMALIZAR EMPLEADO
========================================================= */

function normalizarEmpleado(empleado) {

    if (!empleado) {
        return null;
    }


    return {

        id: empleado.id,

        identidad:
            empleado.identidad ||
            "",

        nombre:
            empleado.nombreCompleto ||
            empleado.nombre ||
            "",

        cargo:
            empleado.cargo ||
            "",

        salario:
            Number(
                empleado.salario || 0
            ),

        estado:
            empleado.estado ||
            ""

    };

}


/* =========================================================
   NORMALIZAR MOVIMIENTO
========================================================= */

function normalizarMovimiento(movimiento) {

    if (!movimiento) {
        return null;
    }


    let empleadoId =
        movimiento.empleadoId;


    /*
     * Si Spring Boot/JPA devuelve:
     *
     * empleado: {
     *     id: 1
     * }
     *
     * obtenemos el ID desde ahí.
     */

    if (
        (
            empleadoId === null ||
            empleadoId === undefined
        ) &&
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
            movimiento.tipo ||
            "",

        monto:
            Number(
                movimiento.monto || 0
            ),

        fecha:
            movimiento.fecha ||
            "",

        descripcion:
            movimiento.descripcion ||
            ""

    };

}


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventos() {


    /* =====================================================
       BUSCAR EMPLEADO
    ===================================================== */

    if (buscarEmpleadoInput) {

        buscarEmpleadoInput.addEventListener(
            "input",
            () => {

                /*
                 * Si ya hay un empleado seleccionado,
                 * no lo quitamos mientras el usuario escribe.
                 */

                if (empleadoSeleccionado) {
                    return;
                }


                const texto =
                    buscarEmpleadoInput.value
                        .trim()
                        .toLowerCase();


                if (!texto) {

                    if (employeeResults) {

                        employeeResults.classList.add(
                            "hidden"
                        );

                    }

                    return;

                }


                const resultados =
                    empleadosBD.filter(
                        empleado => {

                            return (

                                String(
                                    empleado.nombre
                                )
                                    .toLowerCase()
                                    .includes(texto)

                                ||

                                String(
                                    empleado.identidad
                                )
                                    .toLowerCase()
                                    .includes(texto)

                                ||

                                String(
                                    empleado.id
                                )
                                    .includes(texto)

                                ||

                                String(
                                    empleado.cargo
                                )
                                    .toLowerCase()
                                    .includes(texto)

                            );

                        }
                    );


                mostrarResultadosEmpleados(
                    resultados
                );

            }
        );

    }


    /* =====================================================
       TIPO
    ===================================================== */

    if (tipoMovimiento) {

        tipoMovimiento.addEventListener(
            "change",
            actualizarPreview
        );

    }


    /* =====================================================
       MONTO
    ===================================================== */

    if (montoMovimiento) {

        montoMovimiento.addEventListener(
            "input",
            actualizarPreview
        );

    }


    /* =====================================================
       DESCRIPCIÓN
    ===================================================== */

    if (descripcionMovimiento) {

        descripcionMovimiento.addEventListener(
            "input",
            () => {

                if (descripcionCounter) {

                    descripcionCounter.textContent =
                        descripcionMovimiento.value.length;

                }

            }
        );

    }


    /* =====================================================
       BUSCAR MOVIMIENTO
    ===================================================== */

    if (buscarMovimiento) {

        buscarMovimiento.addEventListener(
            "input",
            renderizarMovimientos
        );

    }


    /* =====================================================
       FILTRO EMPLEADO
    ===================================================== */

    if (filtroEmpleado) {

        filtroEmpleado.addEventListener(
            "change",
            renderizarMovimientos
        );

    }


    /* =====================================================
       FILTRO TIPO
    ===================================================== */

    if (filtroTipo) {

        filtroTipo.addEventListener(
            "change",
            renderizarMovimientos
        );

    }


    /* =====================================================
       CERRAR RESULTADOS EMPLEADOS
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(
                    ".employee-search-wrapper"
                )
            ) {

                if (employeeResults) {

                    employeeResults.classList.add(
                        "hidden"
                    );

                }

            }

        }
    );


    /* =====================================================
       MODAL DETALLE
    ===================================================== */

    const viewModal =
        document.getElementById(
            "viewMovementModal"
        );


    if (viewModal) {

        viewModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    viewModal
                ) {

                    cerrarViewMovementModal();

                }

            }
        );

    }


    /* =====================================================
       MODAL ELIMINAR
    ===================================================== */

    if (deleteModal) {

        deleteModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    deleteModal
                ) {

                    cerrarDeleteModal();

                }

            }
        );

    }

}


/* =========================================================
   FECHA ACTUAL
========================================================= */

function establecerFechaActual() {

    if (!fechaMovimiento) {
        return;
    }


    const hoy = new Date();


    const fecha =
        hoy.getFullYear() +
        "-" +
        String(
            hoy.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            hoy.getDate()
        ).padStart(2, "0");


    fechaMovimiento.value =
        fecha;

}


/* =========================================================
   MOSTRAR RESULTADOS DE EMPLEADOS
========================================================= */

function mostrarResultadosEmpleados(
    resultados
) {

    if (!employeeResults) {
        return;
    }


    employeeResults.innerHTML = "";


    if (resultados.length === 0) {

        employeeResults.innerHTML = `

            <div class="no-results">

                <i class="fa-solid fa-user-slash"></i>

                No se encontraron empleados.

            </div>

        `;


        employeeResults.classList.remove(
            "hidden"
        );

        return;

    }


    resultados.forEach(
        empleado => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "employee-result";


            div.innerHTML = `

                <div class="result-avatar">

                    ${obtenerIniciales(
                        empleado.nombre
                    )}

                </div>

                <div class="result-info">

                    <strong>

                        ${escaparHTML(
                            empleado.nombre
                        )}

                    </strong>

                    <span>

                        ${escaparHTML(
                            empleado.cargo ||
                            "Sin cargo"
                        )}

                        ·

                        ${escaparHTML(
                            empleado.identidad
                        )}

                    </span>

                </div>

            `;


            div.addEventListener(
                "click",
                () => {

                    seleccionarEmpleado(
                        empleado
                    );

                }
            );


            employeeResults.appendChild(
                div
            );

        }
    );


    employeeResults.classList.remove(
        "hidden"
    );

}


/* =========================================================
   SELECCIONAR EMPLEADO
========================================================= */

function seleccionarEmpleado(
    empleado
) {

    if (!empleado) {
        return;
    }


    empleadoSeleccionado =
        empleado;


    if (empleadoSeleccionadoId) {

        empleadoSeleccionadoId.value =
            empleado.id;

    }


    const avatar =
        document.getElementById(
            "selectedEmployeeAvatar"
        );


    const nombre =
        document.getElementById(
            "selectedEmployeeName"
        );


    const detalles =
        document.getElementById(
            "selectedEmployeeDetails"
        );


    if (avatar) {

        avatar.textContent =
            obtenerIniciales(
                empleado.nombre
            );

    }


    if (nombre) {

        nombre.textContent =
            empleado.nombre;

    }


    if (detalles) {

        detalles.textContent =
            `${empleado.cargo || "Sin cargo"} · ${empleado.identidad}`;

    }


    if (selectedEmployee) {

        selectedEmployee.classList.remove(
            "hidden"
        );

    }


    if (buscarEmpleadoInput) {

        buscarEmpleadoInput.value =
            "";

        buscarEmpleadoInput.disabled =
            true;

    }


    if (employeeResults) {

        employeeResults.classList.add(
            "hidden"
        );

    }


    actualizarPreview();

}


/* =========================================================
   QUITAR EMPLEADO
========================================================= */

function quitarEmpleado() {

    empleadoSeleccionado =
        null;


    if (empleadoSeleccionadoId) {

        empleadoSeleccionadoId.value =
            "";

    }


    if (selectedEmployee) {

        selectedEmployee.classList.add(
            "hidden"
        );

    }


    if (buscarEmpleadoInput) {

        buscarEmpleadoInput.disabled =
            false;

        buscarEmpleadoInput.value =
            "";

    }


    if (movementPreview) {

        movementPreview.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   PREVIEW
========================================================= */

function actualizarPreview() {

    if (
        !empleadoSeleccionado ||
        !tipoMovimiento ||
        !tipoMovimiento.value
    ) {

        if (movementPreview) {

            movementPreview.classList.add(
                "hidden"
            );

        }

        return;

    }


    const tipo =
        tipoMovimiento.value;


    const monto =
        parseFloat(
            montoMovimiento?.value
        ) || 0;


    if (previewText) {

        previewText.textContent =
            `${obtenerNombreTipo(tipo)} · ${formatearMoneda(monto)}`;

    }


    if (previewEmployee) {

        previewEmployee.textContent =
            empleadoSeleccionado.nombre;

    }


    if (previewIcon) {

        previewIcon.className =
            obtenerIconoTipo(tipo);

    }


    if (movementPreview) {

        movementPreview.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   GUARDAR / ACTUALIZAR
========================================================= */

async function guardarMovimiento(event) {

    if (event) {
        event.preventDefault();
    }


    if (!empleadoSeleccionado) {

        mostrarToast(
            "Debes seleccionar un empleado.",
            "error"
        );

        buscarEmpleadoInput?.focus();

        return;

    }


    const tipo =
        tipoMovimiento?.value;


    const monto =
        parseFloat(
            montoMovimiento?.value
        );


    if (!tipo) {

        mostrarToast(
            "Selecciona el tipo de movimiento.",
            "error"
        );

        tipoMovimiento?.focus();

        return;

    }


    if (
        !Number.isFinite(monto) ||
        monto <= 0
    ) {

        mostrarToast(
            "Ingresa un monto válido.",
            "error"
        );

        montoMovimiento?.focus();

        return;

    }


    const fecha =
        fechaMovimiento?.value;


    if (!fecha) {

        mostrarToast(
            "Selecciona una fecha.",
            "error"
        );

        fechaMovimiento?.focus();

        return;

    }


    const descripcion =
        descripcionMovimiento?.value
            ?.trim() || "";


    const datos = {

        empleadoId:
            Number(
                empleadoSeleccionado.id
            ),

        tipo:
            tipo,

        monto:
            monto,

        fecha:
            fecha,

        descripcion:
            descripcion

    };


    try {

        let response;


        const esEdicion =
            movimientoEditando !== null &&
            movimientoEditando !== undefined;


        if (esEdicion) {

            response =
                await fetch(
                    `${API.movimientos}/${movimientoEditando}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                datos
                            )
                    }
                );

        } else {

            response =
                await fetch(
                    API.movimientos,
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
                                datos
                            )
                    }
                );

        }


        const resultado =
            await obtenerRespuestaJSON(
                response
            );


        if (!response.ok) {

            throw new Error(
                obtenerMensajeError(
                    resultado
                )
            );

        }


        mostrarToast(
            esEdicion
                ? "Movimiento actualizado correctamente."
                : "Movimiento registrado correctamente."
        );


        limpiarFormulario();


        /*
         * Volvemos a consultar la base de datos.
         * No agregamos manualmente el movimiento al array.
         */

        await cargarMovimientos();

        renderizarMovimientos();

        await actualizarEstadisticas();


    } catch (error) {

        console.error(
            "Error guardando movimiento:",
            error
        );

        mostrarToast(
            error.message ||
            "No se pudo guardar el movimiento.",
            "error"
        );

    }

}


/* =========================================================
   EDITAR MOVIMIENTO
========================================================= */

async function editarMovimiento(id) {

    try {

        const response =
            await fetch(
                `${API.movimientos}/${id}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const resultado =
            await obtenerRespuestaJSON(
                response
            );


        if (!response.ok) {

            throw new Error(
                obtenerMensajeError(
                    resultado
                )
            );

        }


        const movimiento =
            normalizarMovimiento(
                resultado
            );


        if (!movimiento) {

            throw new Error(
                "El movimiento recibido no es válido."
            );

        }


        const empleado =
            buscarEmpleadoPorId(
                movimiento.empleadoId
            );


        if (!empleado) {

            mostrarToast(
                "No se encontró el empleado asociado al movimiento.",
                "error"
            );

            return;

        }


        movimientoEditando =
            movimiento.id;


        seleccionarEmpleado(
            empleado
        );


        if (tipoMovimiento) {

            tipoMovimiento.value =
                movimiento.tipo;

        }


        if (montoMovimiento) {

            montoMovimiento.value =
                movimiento.monto;

        }


        if (fechaMovimiento) {

            fechaMovimiento.value =
                movimiento.fecha;

        }


        if (descripcionMovimiento) {

            descripcionMovimiento.value =
                movimiento.descripcion || "";

        }


        if (descripcionCounter) {

            descripcionCounter.textContent =
                descripcionMovimiento?.value.length || 0;

        }


        const btnGuardarTexto =
            document.getElementById(
                "btnGuardarTexto"
            );


        if (btnGuardarTexto) {

            btnGuardarTexto.textContent =
                "Actualizar movimiento";

        }


        actualizarPreview();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


    } catch (error) {

        console.error(
            "Error obteniendo movimiento:",
            error
        );

        mostrarToast(
            error.message ||
            "No se pudo cargar el movimiento.",
            "error"
        );

    }

}


/* =========================================================
   ELIMINAR MOVIMIENTO
========================================================= */

async function eliminarMovimiento(id) {

    try {

        const response =
            await fetch(
                `${API.movimientos}/${id}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const resultado =
            await obtenerRespuestaJSON(
                response
            );


        if (!response.ok) {

            throw new Error(
                obtenerMensajeError(
                    resultado
                )
            );

        }


        const movimiento =
            normalizarMovimiento(
                resultado
            );


        const empleado =
            buscarEmpleadoPorId(
                movimiento.empleadoId
            );


        const deleteInfo =
            document.getElementById(
                "deleteMovementInfo"
            );


        if (deleteInfo) {

            deleteInfo.textContent =
                `${empleado
                    ? empleado.nombre
                    : "Empleado desconocido"
                } · ${obtenerNombreTipo(
                    movimiento.tipo
                )} · ${formatearMoneda(
                    movimiento.monto
                )}`;

        }


        movimientoEliminarId =
            id;


        if (deleteModal) {

            deleteModal.classList.remove(
                "hidden"
            );

        }


    } catch (error) {

        console.error(
            "Error consultando movimiento:",
            error
        );

        mostrarToast(
            error.message ||
            "No se pudo consultar el movimiento.",
            "error"
        );

    }

}


/* =========================================================
   CONFIRMAR ELIMINACIÓN
========================================================= */

async function confirmarEliminarMovimiento() {

    if (
        movimientoEliminarId === null ||
        movimientoEliminarId === undefined
    ) {

        return;

    }


    const id =
        movimientoEliminarId;


    try {

        const response =
            await fetch(
                `${API.movimientos}/${id}`,
                {
                    method: "DELETE",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const resultado =
            await obtenerRespuestaJSON(
                response
            );


        if (!response.ok) {

            throw new Error(
                obtenerMensajeError(
                    resultado
                )
            );

        }


        movimientoEliminarId =
            null;


        cerrarDeleteModal();


        await cargarMovimientos();

        renderizarMovimientos();

        await actualizarEstadisticas();


        mostrarToast(
            "Movimiento eliminado correctamente."
        );


    } catch (error) {

        console.error(
            "Error eliminando movimiento:",
            error
        );

        mostrarToast(
            error.message ||
            "No se pudo eliminar el movimiento.",
            "error"
        );

    }

}


/* =========================================================
   CERRAR MODAL ELIMINACIÓN
========================================================= */

function cerrarDeleteModal() {

    if (deleteModal) {

        deleteModal.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   LIMPIAR FORMULARIO
========================================================= */

function limpiarFormulario() {

    movimientoEditando =
        null;


    const formulario =
        document.getElementById(
            "movimientoForm"
        );


    if (formulario) {

        formulario.reset();

    }


    quitarEmpleado();


    establecerFechaActual();


    if (descripcionCounter) {

        descripcionCounter.textContent =
            "0";

    }


    const btnGuardarTexto =
        document.getElementById(
            "btnGuardarTexto"
        );


    if (btnGuardarTexto) {

        btnGuardarTexto.textContent =
            "Registrar movimiento";

    }


    if (movementPreview) {

        movementPreview.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   RENDERIZAR TABLA
========================================================= */

function renderizarMovimientos() {

    if (!movimientosTableBody) {
        return;
    }


    const filtrados =
        obtenerMovimientosFiltrados();


    movimientosTableBody.innerHTML =
        "";


    if (filtrados.length === 0) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    filtrados.forEach(
        movimiento => {

            const empleado =
                buscarEmpleadoPorId(
                    movimiento.empleadoId
                );


            if (!empleado) {
                return;
            }


            const tr =
                document.createElement(
                    "tr"
                );


            const claseTipo =
                String(
                    movimiento.tipo || ""
                ).toLowerCase();


            const descripcion =
                movimiento.descripcion
                    ? escaparHTML(
                        movimiento.descripcion
                    )
                    : `<span class="no-description">
                           Sin descripción
                       </span>`;


            const signo =
                movimiento.tipo === "DEDUCCION"
                    ? "-"
                    : "+";


            tr.innerHTML = `

                <td>

                    <div class="date-cell">

                        <i class="fa-regular fa-calendar"></i>

                        ${formatearFecha(
                            movimiento.fecha
                        )}

                    </div>

                </td>


                <td>

                    <div class="table-employee">

                        <div class="table-avatar">

                            ${obtenerIniciales(
                                empleado.nombre
                            )}

                        </div>

                        <div class="table-employee-info">

                            <strong>

                                ${escaparHTML(
                                    empleado.nombre
                                )}

                            </strong>

                            <span>

                                ${escaparHTML(
                                    empleado.cargo ||
                                    "Sin cargo"
                                )}

                            </span>

                        </div>

                    </div>

                </td>


                <td>

                    <span
                        class="movement-badge ${claseTipo}"
                    >

                        <i class="${obtenerIconoTipo(
                            movimiento.tipo
                        )}"></i>

                        ${obtenerNombreTipo(
                            movimiento.tipo
                        )}

                    </span>

                </td>


                <td>

                    <div class="description-cell">

                        ${descripcion}

                    </div>

                </td>


                <td>

                    <strong
                        class="amount ${claseTipo}"
                    >

                        ${signo}

                        ${formatearMoneda(
                            movimiento.monto
                        )}

                    </strong>

                </td>


                <td>

                    <div class="actions">

                        <button
                            type="button"
                            class="action-btn edit"
                            title="Editar movimiento"
                            onclick="editarMovimiento(${movimiento.id})"
                        >

                            <i class="fa-solid fa-pen"></i>

                        </button>


                        <button
                            type="button"
                            class="action-btn view"
                            title="Ver detalle completo"
                            onclick="verMovimiento(${movimiento.id})"
                        >

                            <i class="fa-solid fa-eye"></i>

                        </button>


                        <button
                            type="button"
                            class="action-btn delete"
                            title="Eliminar movimiento"
                            onclick="eliminarMovimiento(${movimiento.id})"
                        >

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            movimientosTableBody.appendChild(
                tr
            );

        }
    );

}


/* =========================================================
   CARGAR FILTRO DE EMPLEADOS
========================================================= */

function cargarFiltroEmpleados() {

    if (!filtroEmpleado) {
        return;
    }


    filtroEmpleado.innerHTML = `

        <option value="">
            Todos los empleados
        </option>

    `;


    empleadosBD.forEach(
        empleado => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                empleado.id;


            option.textContent =
                empleado.nombre;


            filtroEmpleado.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

async function actualizarEstadisticas() {

    const totalBonos =
        document.getElementById(
            "totalBonos"
        );


    const totalDeducciones =
        document.getElementById(
            "totalDeducciones"
        );


    const totalAnticipos =
        document.getElementById(
            "totalAnticipos"
        );


    const totalMovimientos =
        document.getElementById(
            "totalMovimientos"
        );


    try {

        const response =
            await fetch(
                API.estadisticas,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const estadisticas =
            await obtenerRespuestaJSON(
                response
            );


        if (!response.ok) {

            throw new Error(
                obtenerMensajeError(
                    estadisticas
                )
            );

        }


        if (totalBonos) {

            totalBonos.textContent =
                formatearMoneda(
                    estadisticas.totalBonos
                );

        }


        if (totalDeducciones) {

            totalDeducciones.textContent =
                formatearMoneda(
                    estadisticas.totalDeducciones
                );

        }


        if (totalAnticipos) {

            totalAnticipos.textContent =
                formatearMoneda(
                    estadisticas.totalAnticipos
                );

        }


        if (totalMovimientos) {

            totalMovimientos.textContent =
                Number(
                    estadisticas.totalMovimientos || 0
                );

        }


    } catch (error) {

        console.error(
            "Error obteniendo estadísticas:",
            error
        );


        /*
         * No sustituimos los datos del backend.
         *
         * Si el endpoint falla, mostramos los valores
         * actualmente disponibles como respaldo visual.
         */

        calcularEstadisticasLocalmente();

    }

}


/* =========================================================
   ESTADÍSTICAS LOCALES DE RESPALDO
========================================================= */

function calcularEstadisticasLocalmente() {

    let bonos = 0;
    let deducciones = 0;
    let anticipos = 0;


    movimientosBD.forEach(
        movimiento => {

            const monto =
                Number(
                    movimiento.monto
                ) || 0;


            if (
                movimiento.tipo ===
                "BONO"
            ) {

                bonos += monto;

            }
            else if (
                movimiento.tipo ===
                "DEDUCCION"
            ) {

                deducciones += monto;

            }
            else if (
                movimiento.tipo ===
                "ANTICIPO"
            ) {

                anticipos += monto;

            }

        }
    );


    const totalBonos =
        document.getElementById(
            "totalBonos"
        );


    const totalDeducciones =
        document.getElementById(
            "totalDeducciones"
        );


    const totalAnticipos =
        document.getElementById(
            "totalAnticipos"
        );


    const totalMovimientos =
        document.getElementById(
            "totalMovimientos"
        );


    if (totalBonos) {

        totalBonos.textContent =
            formatearMoneda(
                bonos
            );

    }


    if (totalDeducciones) {

        totalDeducciones.textContent =
            formatearMoneda(
                deducciones
            );

    }


    if (totalAnticipos) {

        totalAnticipos.textContent =
            formatearMoneda(
                anticipos
            );

    }


    if (totalMovimientos) {

        totalMovimientos.textContent =
            movimientosBD.length;

    }

}


/* =========================================================
   VER DETALLE
========================================================= */

async function verMovimiento(id) {

    try {

        const response =
            await fetch(
                `${API.movimientos}/${id}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const resultado =
            await obtenerRespuestaJSON(
                response
            );


        if (!response.ok) {

            throw new Error(
                obtenerMensajeError(
                    resultado
                )
            );

        }


        const movimiento =
            normalizarMovimiento(
                resultado
            );


        const empleado =
            buscarEmpleadoPorId(
                movimiento.empleadoId
            );


        if (!empleado) {

            mostrarToast(
                "No se encontró el empleado asociado.",
                "error"
            );

            return;

        }


        const viewEmployeeName =
            document.getElementById(
                "viewEmployeeName"
            );


        const viewEmployeeDetails =
            document.getElementById(
                "viewEmployeeDetails"
            );


        const viewEmployeeAvatar =
            document.getElementById(
                "viewEmployeeAvatar"
            );


        const viewMovementDate =
            document.getElementById(
                "viewMovementDate"
            );


        const viewMovementType =
            document.getElementById(
                "viewMovementType"
            );


        const viewMovementAmount =
            document.getElementById(
                "viewMovementAmount"
            );


        const viewMovementDescription =
            document.getElementById(
                "viewMovementDescription"
            );


        const viewMovementModal =
            document.getElementById(
                "viewMovementModal"
            );


        if (viewEmployeeName) {

            viewEmployeeName.textContent =
                empleado.nombre;

        }


        if (viewEmployeeDetails) {

            viewEmployeeDetails.textContent =
                `${empleado.cargo || "Sin cargo"} · ${empleado.identidad}`;

        }


        if (viewEmployeeAvatar) {

            viewEmployeeAvatar.textContent =
                obtenerIniciales(
                    empleado.nombre
                );

        }


        if (viewMovementDate) {

            viewMovementDate.textContent =
                formatearFecha(
                    movimiento.fecha
                );

        }


        if (viewMovementType) {

            viewMovementType.textContent =
                obtenerNombreTipo(
                    movimiento.tipo
                );


            viewMovementType.className =
                `movement-badge ${String(
                    movimiento.tipo
                ).toLowerCase()}`;

        }


        if (viewMovementAmount) {

            const prefijo =
                movimiento.tipo ===
                "DEDUCCION"
                    ? "-"
                    : "+";


            viewMovementAmount.textContent =
                `${prefijo} ${formatearMoneda(
                    movimiento.monto
                )}`;


            viewMovementAmount.className =
                `amount ${String(
                    movimiento.tipo
                ).toLowerCase()}`;

        }


        if (viewMovementDescription) {

            viewMovementDescription.textContent =
                movimiento.descripcion?.trim()
                    ? movimiento.descripcion
                    : "Sin descripción registrada.";

        }


        if (viewMovementModal) {

            viewMovementModal.classList.remove(
                "hidden"
            );

        }


    } catch (error) {

        console.error(
            "Error viendo movimiento:",
            error
        );

        mostrarToast(
            error.message ||
            "No se pudo consultar el movimiento.",
            "error"
        );

    }

}


/* =========================================================
   CERRAR DETALLE
========================================================= */

function cerrarViewMovementModal() {

    const modal =
        document.getElementById(
            "viewMovementModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   OBTENER MOVIMIENTOS FILTRADOS
========================================================= */

function obtenerMovimientosFiltrados() {

    const texto =
        buscarMovimiento
            ? buscarMovimiento.value
                .trim()
                .toLowerCase()
            : "";


    const empleadoFiltro =
        filtroEmpleado
            ? filtroEmpleado.value
            : "";


    const tipoFiltro =
        filtroTipo
            ? filtroTipo.value
            : "";


    return movimientosBD

        .filter(
            movimiento => {

                const empleado =
                    buscarEmpleadoPorId(
                        movimiento.empleadoId
                    );


                /*
                 * Si no existe el empleado en la lista,
                 * no podemos mostrar correctamente el movimiento.
                 */

                if (!empleado) {
                    return false;
                }


                const coincideEmpleado =
                    !empleadoFiltro ||
                    String(
                        empleado.id
                    ) ===
                    String(
                        empleadoFiltro
                    );


                const coincideTipo =
                    !tipoFiltro ||
                    movimiento.tipo ===
                    tipoFiltro;


                const textoCompleto = `

                    ${empleado.nombre}

                    ${empleado.identidad}

                    ${empleado.cargo}

                    ${movimiento.descripcion || ""}

                    ${obtenerNombreTipo(
                        movimiento.tipo
                    )}

                `.toLowerCase();


                const coincideTexto =
                    !texto ||
                    textoCompleto.includes(
                        texto
                    );


                return (
                    coincideEmpleado &&
                    coincideTipo &&
                    coincideTexto
                );

            }
        )

        .sort(
            (a, b) => {

                return (
                    new Date(b.fecha) -
                    new Date(a.fecha)
                );

            }
        );

}


/* =========================================================
   BUSCAR EMPLEADO POR ID
========================================================= */

function buscarEmpleadoPorId(id) {

    return empleadosBD.find(
        empleado =>
            String(
                empleado.id
            ) ===
            String(id)
    );

}


/* =========================================================
   IMPRIMIR MOVIMIENTOS
========================================================= */

function imprimirMovimientos() {

    const filtrados =
        obtenerMovimientosFiltrados();


    if (filtrados.length === 0) {

        mostrarToast(
            "No hay movimientos para imprimir.",
            "error"
        );

        return;

    }


    const ventana =
        window.open(
            "",
            "_blank",
            "width=1200,height=800"
        );


    if (!ventana) {

        mostrarToast(
            "El navegador bloqueó la ventana de impresión. Permite ventanas emergentes e inténtalo nuevamente.",
            "error"
        );

        return;

    }


    const fechaImpresion =
        new Date().toLocaleDateString(
            "es-HN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );


    let filas = "";


    filtrados.forEach(
        movimiento => {

            const empleado =
                buscarEmpleadoPorId(
                    movimiento.empleadoId
                );


            if (!empleado) {
                return;
            }


            const signo =
                movimiento.tipo ===
                "DEDUCCION"
                    ? "-"
                    : "+";


            filas += `

                <tr>

                    <td>
                        ${formatearFecha(
                            movimiento.fecha
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            empleado.nombre
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            empleado.cargo ||
                            "Sin cargo"
                        )}
                    </td>

                    <td>
                        ${obtenerNombreTipo(
                            movimiento.tipo
                        )}
                    </td>

                    <td class="description">
                        ${escaparHTML(
                            movimiento.descripcion ||
                            "Sin descripción"
                        )}
                    </td>

                    <td class="amount">

                        ${signo}
                        ${formatearMoneda(
                            movimiento.monto
                        )}

                    </td>

                </tr>

            `;

        }
    );


    const totalBonos =
        filtrados
            .filter(
                m =>
                    m.tipo ===
                    "BONO"
            )
            .reduce(
                (total, m) =>
                    total +
                    Number(
                        m.monto || 0
                    ),
                0
            );


    const totalDeducciones =
        filtrados
            .filter(
                m =>
                    m.tipo ===
                    "DEDUCCION"
            )
            .reduce(
                (total, m) =>
                    total +
                    Number(
                        m.monto || 0
                    ),
                0
            );


    const totalAnticipos =
        filtrados
            .filter(
                m =>
                    m.tipo ===
                    "ANTICIPO"
            )
            .reduce(
                (total, m) =>
                    total +
                    Number(
                        m.monto || 0
                    ),
                0
            );


    ventana.document.write(`

        <!DOCTYPE html>

        <html lang="es">

        <head>

            <meta charset="UTF-8">

            <title>
                Reporte de Movimientos de Empleados
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    margin: 0;

                    padding: 30px;

                    color: #1f2937;

                    background: #ffffff;

                }

                .header {

                    display: flex;

                    justify-content:
                        space-between;

                    align-items:
                        flex-start;

                    border-bottom:
                        2px solid #2563eb;

                    padding-bottom:
                        16px;

                    margin-bottom:
                        20px;

                }

                .title {

                    margin: 0;

                    font-size:
                        24px;

                    font-weight:
                        700;

                    color:
                        #111827;

                }

                .subtitle {

                    margin-top:
                        5px;

                    font-size:
                        13px;

                    color:
                        #6b7280;

                }

                .date {

                    font-size:
                        12px;

                    color:
                        #6b7280;

                    text-align:
                        right;

                }

                .summary {

                    display:
                        grid;

                    grid-template-columns:
                        repeat(3, 1fr);

                    gap:
                        12px;

                    margin-bottom:
                        20px;

                }

                .summary-card {

                    border:
                        1px solid #e5e7eb;

                    border-radius:
                        8px;

                    padding:
                        12px 15px;

                    background:
                        #f8fafc;

                }

                .summary-label {

                    font-size:
                        11px;

                    color:
                        #6b7280;

                    margin-bottom:
                        5px;

                }

                .summary-value {

                    font-size:
                        18px;

                    font-weight:
                        700;

                    color:
                        #111827;

                }

                table {

                    width:
                        100%;

                    border-collapse:
                        collapse;

                    font-size:
                        11px;

                }

                th {

                    background:
                        #f1f5f9;

                    color:
                        #374151;

                    text-align:
                        left;

                    padding:
                        9px;

                    border:
                        1px solid #dbe1e8;

                }

                td {

                    padding:
                        9px;

                    border:
                        1px solid #e5e7eb;

                    vertical-align:
                        top;

                }

                .description {

                    max-width:
                        320px;

                    white-space:
                        normal;

                    word-break:
                        break-word;

                }

                .amount {

                    text-align:
                        right;

                    white-space:
                        nowrap;

                    font-weight:
                        700;

                }

                .footer {

                    margin-top:
                        20px;

                    padding-top:
                        10px;

                    border-top:
                        1px solid #e5e7eb;

                    font-size:
                        10px;

                    color:
                        #6b7280;

                    text-align:
                        center;

                }

                @media print {

                    body {
                        padding:
                            10mm;
                    }

                    .header {

                        break-inside:
                            avoid;

                    }

                    table {

                        page-break-inside:
                            auto;

                    }

                    tr {

                        page-break-inside:
                            avoid;

                        page-break-after:
                            auto;

                    }

                }

            </style>

        </head>

        <body>

            <div class="header">

                <div>

                    <h1 class="title">
                        Movimientos de Empleados
                    </h1>

                    <div class="subtitle">
                        Bonos, deducciones y anticipos
                    </div>

                </div>

                <div class="date">

                    Fecha de impresión:<br>

                    <strong>
                        ${fechaImpresion}
                    </strong>

                </div>

            </div>


            <div class="summary">

                <div class="summary-card">

                    <div class="summary-label">
                        Total bonos
                    </div>

                    <div class="summary-value">

                        ${formatearMoneda(
                            totalBonos
                        )}

                    </div>

                </div>


                <div class="summary-card">

                    <div class="summary-label">
                        Total deducciones
                    </div>

                    <div class="summary-value">

                        ${formatearMoneda(
                            totalDeducciones
                        )}

                    </div>

                </div>


                <div class="summary-card">

                    <div class="summary-label">
                        Total anticipos
                    </div>

                    <div class="summary-value">

                        ${formatearMoneda(
                            totalAnticipos
                        )}

                    </div>

                </div>

            </div>


            <table>

                <thead>

                    <tr>

                        <th>Fecha</th>

                        <th>Empleado</th>

                        <th>Cargo</th>

                        <th>Tipo</th>

                        <th>Descripción</th>

                        <th>Monto</th>

                    </tr>

                </thead>

                <tbody>

                    ${filas}

                </tbody>

            </table>


            <div class="footer">

                Reporte generado desde
                Movimientos de Empleados

            </div>

        </body>

        </html>

    `);


    ventana.document.close();

    ventana.focus();


    setTimeout(
        () => {
            ventana.print();
        },
        500
    );

}


/* =========================================================
   NOMBRE DEL TIPO
========================================================= */

function obtenerNombreTipo(tipo) {

    switch (tipo) {

        case "BONO":
            return "Bono";

        case "DEDUCCION":
            return "Deducción";

        case "ANTICIPO":
            return "Anticipo";

        default:
            return tipo ||
                "Movimiento";

    }

}


/* =========================================================
   ICONO DEL TIPO
========================================================= */

function obtenerIconoTipo(tipo) {

    switch (tipo) {

        case "BONO":
            return "fa-solid fa-circle-plus";

        case "DEDUCCION":
            return "fa-solid fa-circle-minus";

        case "ANTICIPO":
            return "fa-solid fa-hand-holding-dollar";

        default:
            return "fa-solid fa-money-bill";

    }

}


/* =========================================================
   INICIALES
========================================================= */

function obtenerIniciales(nombre) {

    if (!nombre) {
        return "??";
    }


    const partes =
        String(nombre)
            .trim()
            .split(/\s+/);


    if (partes.length === 1) {

        return partes[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        partes[0][0] +
        partes[1][0]
    ).toUpperCase();

}


/* =========================================================
   FORMATEAR MONEDA
========================================================= */

function formatearMoneda(valor) {

    return new Intl.NumberFormat(
        "es-HN",
        {
            style: "currency",
            currency: "HNL",
            minimumFractionDigits: 2
        }
    ).format(
        Number(valor) || 0
    );

}


/* =========================================================
   FORMATEAR FECHA
========================================================= */

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }


    const partes =
        String(fecha).split("-");


    if (partes.length !== 3) {
        return fecha;
    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(texto) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        texto ?? "";


    return div.innerHTML;

}


/* =========================================================
   RESPUESTA JSON
========================================================= */

async function obtenerRespuestaJSON(
    response
) {

    const texto =
        await response.text();


    if (!texto) {
        return {};
    }


    try {

        return JSON.parse(
            texto
        );

    } catch {

        return {
            error:
                texto
        };

    }

}


/* =========================================================
   MENSAJE DE ERROR
========================================================= */

function obtenerMensajeError(
    resultado
) {

    if (!resultado) {

        return "Ocurrió un error.";

    }


    if (
        typeof resultado ===
        "string"
    ) {

        return resultado;

    }


    return (
        resultado.error ||
        resultado.mensaje ||
        resultado.message ||
        "Ocurrió un error al procesar la solicitud."
    );

}


/* =========================================================
   TOAST
========================================================= */

function mostrarToast(
    mensaje,
    tipo = "success"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) {

        console.warn(
            mensaje
        );

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast";


    if (tipo === "error") {

        toast.style.borderLeftColor =
            "#dc2626";

    }


    toast.innerHTML = `

        <i class="${tipo === "error"
            ? "fa-solid fa-circle-exclamation"
            : "fa-solid fa-circle-check"
        }"></i>

        <span>

            ${escaparHTML(
                mensaje
            )}

        </span>

    `;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3500
    );

}


/* =========================================================
   CERRAR MODALES CON ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        cerrarDeleteModal();

        cerrarViewMovementModal();

    }
);


/* =========================================================
   FUNCIONES GLOBALES
   Necesarias porque tu HTML usa onclick=""
========================================================= */

window.guardarMovimiento =
    guardarMovimiento;

window.editarMovimiento =
    editarMovimiento;

window.eliminarMovimiento =
    eliminarMovimiento;

window.confirmarEliminarMovimiento =
    confirmarEliminarMovimiento;

window.verMovimiento =
    verMovimiento;

window.cerrarDeleteModal =
    cerrarDeleteModal;

window.cerrarViewMovementModal =
    cerrarViewMovementModal;

window.imprimirMovimientos =
    imprimirMovimientos;

window.seleccionarEmpleado =
    seleccionarEmpleado;

window.quitarEmpleado =
    quitarEmpleado;