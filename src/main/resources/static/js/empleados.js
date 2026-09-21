"use strict";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const API_URL = "/api/empleados";

let empleadoEnEdicion = null;
let empleadoAEliminar = null;


/* =========================================================
   INICIALIZACIÓN
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    inicializarPagina();
});


async function inicializarPagina() {

    const buscar = document.getElementById("buscarEmpleado");

    if (buscar) {
        buscar.addEventListener("input", aplicarFiltros);
    }

    const filtroEstado = document.getElementById("filtroEstado");

    if (filtroEstado) {
        filtroEstado.addEventListener("change", aplicarFiltros);
    }

    const filtroSalario = document.getElementById("filtroSalario");

    if (filtroSalario) {
        filtroSalario.addEventListener("change", aplicarFiltros);
    }

    const estado = document.getElementById("estado");

    if (estado) {
        estado.addEventListener(
            "change",
            actualizarEstadoFormulario
        );
    }

    /* ESC para cerrar modales */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            cerrarTodosLosModales();
        }

    });

    /* Click sobre el fondo del modal */

    document
        .querySelectorAll(".modal-overlay")
        .forEach(function (modal) {

            modal.addEventListener("click", function (event) {

                if (event.target === modal) {
                    cerrarModalPorId(modal.id);
                }

            });

        });

    actualizarEstadoFormulario();

    /*
     * IMPORTANTE:
     * Ahora los empleados vienen de PostgreSQL.
     */
    await cargarEmpleadosDesdeBD();

}


/* =========================================================
   API
========================================================= */

/**
 * Maneja las respuestas de fetch.
 */
async function procesarRespuesta(response) {

    const contenido = await response.text();

    let data = null;

    if (contenido) {

        try {
            data = JSON.parse(contenido);
        } catch (error) {
            data = contenido;
        }

    }

    if (!response.ok) {

        let mensaje = "Ocurrió un error en el servidor.";

        if (data && typeof data === "object") {

            mensaje =
                data.mensaje ||
                data.message ||
                data.error ||
                mensaje;

        } else if (typeof data === "string" && data.trim()) {

            mensaje = data;

        }

        throw new Error(mensaje);
    }

    return data;
}


/**
 * Obtener todos los empleados desde PostgreSQL.
 */
async function cargarEmpleadosDesdeBD() {

    const tbody =
        obtenerElemento("empleadosTableBody");

    if (!tbody) {
        return;
    }

    try {

        mostrarCargandoTabla();

        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            credentials: "same-origin"
        });

        const empleados =
            await procesarRespuesta(response);

        renderizarEmpleados(empleados);

        actualizarEstadisticas();
        aplicarFiltros();

    } catch (error) {

        console.error(
            "Error cargando empleados:",
            error
        );

        mostrarErrorTabla(
            "No se pudieron cargar los empleados."
        );

        mostrarToast(
            obtenerMensajeError(error),
            "error"
        );

    }

}


/**
 * Crear empleado en PostgreSQL.
 */
async function crearEmpleadoEnBD(datos) {

    const response = await fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },

        credentials: "same-origin",

        body: JSON.stringify(
            prepararEmpleadoParaAPI(datos)
        )

    });

    return await procesarRespuesta(response);
}


/**
 * Actualizar empleado en PostgreSQL.
 */
async function actualizarEmpleadoEnBD(id, datos) {

    const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {

            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            credentials: "same-origin",

            body: JSON.stringify(
                prepararEmpleadoParaAPI(datos)
            )

        }
    );

    return await procesarRespuesta(response);
}


/**
 * Eliminar empleado de PostgreSQL.
 */
async function eliminarEmpleadoEnBD(id) {

    const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {

            method: "DELETE",

            headers: {
                "Accept": "application/json"
            },

            credentials: "same-origin"

        }
    );

    return await procesarRespuesta(response);
}


/**
 * Convierte los datos del formulario al formato
 * que espera Empleado.java.
 */
function prepararEmpleadoParaAPI(datos) {

    return {

        identidad: datos.identidad,

        nombreCompleto:
            datos.nombreCompleto,

        telefono:
            datos.telefono,

        fechaContratacion:
            datos.fechaContratacion,

        cargo:
            datos.cargo,

        tipoSalario:
            datos.tipoSalario,

        salario:
            Number(datos.salario) || 0,

        banco:
            datos.banco,

        numeroCuenta:
            datos.numeroCuenta,

        estado:
            datos.estado || "ACTIVO",

        fechaCambioEstado:
            datos.fechaCambioEstado || null,

        observacionEstado:
            datos.observacionEstado || null

    };

}


/* =========================================================
   RENDERIZAR EMPLEADOS
========================================================= */

function renderizarEmpleados(empleados) {

    const tbody =
        obtenerElemento("empleadosTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!Array.isArray(empleados) ||
        empleados.length === 0) {

        actualizarFilaVacia(0);

        return;
    }

    empleados.forEach(function (empleado) {

        const datos =
            normalizarEmpleado(empleado);

        const tr =
            document.createElement("tr");

        guardarDatosFila(tr, datos);

        tr.innerHTML =
            construirFilaEmpleado(datos);

        tbody.appendChild(tr);

    });

}


/**
 * Normaliza la respuesta de Spring Boot.
 */
function normalizarEmpleado(empleado) {

    if (!empleado) {
        return {};
    }

    return {

        id:
            empleado.id ?? "",

        identidad:
            empleado.identidad ?? "",

        nombreCompleto:
            empleado.nombreCompleto ?? "",

        telefono:
            empleado.telefono ?? "",

        fechaContratacion:
            empleado.fechaContratacion ?? "",

        cargo:
            empleado.cargo ?? "",

        tipoSalario:
            String(
                empleado.tipoSalario ??
                "MENSUAL"
            ).toUpperCase(),

        salario:
            Number(
                empleado.salario ?? 0
            ),

        banco:
            empleado.banco ?? "",

        numeroCuenta:
            empleado.numeroCuenta ?? "",

        estado:
            String(
                empleado.estado ??
                "ACTIVO"
            ).toUpperCase(),

        fechaCambioEstado:
            empleado.fechaCambioEstado ?? "",

        observacionEstado:
            empleado.observacionEstado ?? ""

    };

}


/* =========================================================
   CARGANDO TABLA
========================================================= */

function mostrarCargandoTabla() {

    const tbody =
        obtenerElemento("empleadosTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `

        <tr id="loadingRow">

            <td colspan="9">

                <div class="empty-state">

                    <div class="empty-icon">

                        <i class="fa-solid fa-spinner fa-spin"></i>

                    </div>

                    <h3>
                        Cargando empleados...
                    </h3>

                    <p>
                        Consultando la base de datos.
                    </p>

                </div>

            </td>

        </tr>

    `;

}


function mostrarErrorTabla(mensaje) {

    const tbody =
        obtenerElemento("empleadosTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `

        <tr id="emptyRow">

            <td colspan="9">

                <div class="empty-state">

                    <div class="empty-icon">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                    </div>

                    <h3>
                        No se pudieron cargar los empleados
                    </h3>

                    <p>
                        ${escapeHtml(mensaje)}
                    </p>

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   MODALES
========================================================= */

function abrirModalPorId(id) {

    const modal =
        obtenerElemento(id);

    if (!modal) {

        console.error(
            "No existe el modal:",
            id
        );

        return;
    }

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


function cerrarModalPorId(id) {

    const modal =
        obtenerElemento(id);

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    actualizarBloqueoBody();

}


/* Compatibilidad */

function mostrarModal(id) {
    abrirModalPorId(id);
}


function abrirModal(id) {
    abrirModalPorId(id);
}


function cerrarModal(id) {
    cerrarModalPorId(id);
}


function actualizarBloqueoBody() {

    const hayModalAbierto =
        document.querySelector(
            ".modal-overlay.active"
        ) !== null;

    document.body.classList.toggle(
        "modal-open",
        hayModalAbierto
    );

}


/* =========================================================
   CERRAR TODOS LOS MODALES
========================================================= */

function cerrarTodosLosModales() {

    cerrarModalPorId(
        "empleadoModal"
    );

    cerrarModalPorId(
        "detalleModal"
    );

    cerrarModalPorId(
        "eliminarModal"
    );

    empleadoEnEdicion = null;

    empleadoAEliminar = null;

}


/* =========================================================
   NUEVO EMPLEADO
========================================================= */

function abrirModalEmpleado() {

    const form =
        obtenerElemento("empleadoForm");

    if (!form) {

        mostrarToast(
            "No se encontró el formulario.",
            "error"
        );

        return;
    }

    empleadoEnEdicion = null;

    form.reset();

    establecerValorInput(
        "empleadoId",
        ""
    );

    establecerValorInput(
        "estado",
        "ACTIVO"
    );

    establecerFechaActualSiEstaVacia(
        "fechaContratacion"
    );

    establecerFechaActualSiEstaVacia(
        "fechaCambioEstado"
    );

    const titulo =
        obtenerElemento(
            "modalEmpleadoTitulo"
        );

    if (titulo) {

        titulo.textContent =
            "Registrar empleado";

    }

    cambiarTextoBotonGuardar(
        "Guardar empleado"
    );

    actualizarEstadoFormulario();

    abrirModalPorId(
        "empleadoModal"
    );

}


function cerrarModalEmpleado() {

    cerrarModalPorId(
        "empleadoModal"
    );

    empleadoEnEdicion = null;

}


/* =========================================================
   GUARDAR / ACTUALIZAR EMPLEADO
========================================================= */

async function guardarEmpleado(event) {

    if (event) {
        event.preventDefault();
    }

    const form =
        obtenerElemento("empleadoForm");

    if (!form) {

        mostrarToast(
            "No se encontró el formulario.",
            "error"
        );

        return false;
    }

    if (!form.checkValidity()) {

        form.reportValidity();

        return false;
    }

    const datos =
        obtenerDatosFormulario();

    if (!validarDatosEmpleado(datos)) {
        return false;
    }

    const botonGuardar =
        document.querySelector(
            "#empleadoForm button[type='submit']"
        );

    const textoOriginal =
        botonGuardar
            ? botonGuardar.innerHTML
            : "";

    try {

        if (botonGuardar) {

            botonGuardar.disabled = true;

            botonGuardar.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Guardando...
            `;

        }

        /*
         * EDITAR
         */

        if (empleadoEnEdicion) {

            const id =
                datos.id;

            const empleadoActualizado =
                await actualizarEmpleadoEnBD(
                    id,
                    datos
                );

            const datosServidor =
                normalizarEmpleado(
                    empleadoActualizado
                );

            actualizarFilaConDatos(
                empleadoEnEdicion,
                datosServidor
            );

            mostrarToast(
                "Empleado actualizado correctamente.",
                "success"
            );

        }

        /*
         * CREAR
         */

        else {

            const empleadoCreado =
                await crearEmpleadoEnBD(
                    datos
                );

            const datosServidor =
                normalizarEmpleado(
                    empleadoCreado
                );

            agregarEmpleadoATabla(
                datosServidor
            );

            mostrarToast(
                "Empleado registrado correctamente.",
                "success"
            );

        }

        actualizarEstadisticas();

        aplicarFiltros();

        cerrarModalEmpleado();

    } catch (error) {

        console.error(
            "Error guardando empleado:",
            error
        );

        mostrarToast(
            obtenerMensajeError(error),
            "error"
        );

    } finally {

        if (botonGuardar) {

            botonGuardar.disabled = false;

            botonGuardar.innerHTML =
                textoOriginal;

        }

    }

    return false;

}


/* =========================================================
   DATOS DEL FORMULARIO
========================================================= */

function obtenerDatosFormulario() {

    return {

        id:
            obtenerValor("empleadoId"),

        identidad:
            obtenerValor("identidad"),

        nombreCompleto:
            obtenerValor("nombreCompleto"),

        telefono:
            obtenerValor("telefono"),

        fechaContratacion:
            obtenerValor("fechaContratacion"),

        cargo:
            obtenerValor("cargo"),

        tipoSalario:
            obtenerValor("tipoSalario")
                .toUpperCase(),

        salario:
            parseFloat(
                obtenerValor("salario")
            ) || 0,

        banco:
            obtenerValor("banco"),

        numeroCuenta:
            obtenerValor("numeroCuenta"),

        estado:
            obtenerValor("estado")
                .toUpperCase() || "ACTIVO",

        fechaCambioEstado:
            obtenerValor(
                "fechaCambioEstado"
            ),

        observacionEstado:
            obtenerValor(
                "observacionEstado"
            )

    };

}


/* =========================================================
   VALIDAR DATOS
========================================================= */

function validarDatosEmpleado(datos) {

    if (!datos.identidad) {

        mostrarToast(
            "Ingresa el número de identidad.",
            "error"
        );

        return false;
    }

    if (!datos.nombreCompleto) {

        mostrarToast(
            "Ingresa el nombre completo.",
            "error"
        );

        return false;
    }

    if (!datos.telefono) {

        mostrarToast(
            "Ingresa el número de teléfono.",
            "error"
        );

        return false;
    }

    if (!datos.fechaContratacion) {

        mostrarToast(
            "Selecciona la fecha de contratación.",
            "error"
        );

        return false;
    }

    if (!datos.cargo) {

        mostrarToast(
            "Ingresa el cargo.",
            "error"
        );

        return false;
    }

    if (!datos.tipoSalario) {

        mostrarToast(
            "Selecciona el tipo de salario.",
            "error"
        );

        return false;
    }

    if (datos.salario < 0) {

        mostrarToast(
            "El salario no puede ser negativo.",
            "error"
        );

        return false;
    }

    if (!datos.banco) {

        mostrarToast(
            "Selecciona el banco.",
            "error"
        );

        return false;
    }

    if (!datos.numeroCuenta) {

        mostrarToast(
            "Ingresa el número de cuenta.",
            "error"
        );

        return false;
    }

    return true;

}


/* =========================================================
   AGREGAR EMPLEADO A TABLA
========================================================= */

function agregarEmpleadoATabla(datos) {

    const tbody =
        obtenerElemento(
            "empleadosTableBody"
        );

    if (!tbody) {

        mostrarToast(
            "No se encontró la tabla.",
            "error"
        );

        return;
    }

    const emptyRow =
        obtenerElemento("emptyRow");

    if (emptyRow) {
        emptyRow.remove();
    }

    const tr =
        document.createElement("tr");

    guardarDatosFila(
        tr,
        datos
    );

    tr.innerHTML =
        construirFilaEmpleado(datos);

    tbody.appendChild(tr);

}


/* =========================================================
   ACTUALIZAR FILA
========================================================= */

function actualizarFilaConDatos(
    tr,
    datos
) {

    if (!tr) {
        return;
    }

    guardarDatosFila(
        tr,
        datos
    );

    tr.innerHTML =
        construirFilaEmpleado(datos);

}


/* =========================================================
   DATASET DE FILA
========================================================= */

function guardarDatosFila(
    tr,
    datos
) {

    tr.dataset.id =
        datos.id ?? "";

    tr.dataset.telefono =
        datos.telefono ?? "";

    tr.dataset.banco =
        datos.banco ?? "";

    tr.dataset.cuenta =
        datos.numeroCuenta ?? "";

    tr.dataset.identidad =
        datos.identidad ?? "";

    tr.dataset.nombre =
        datos.nombreCompleto ?? "";

    tr.dataset.fechaContratacion =
        datos.fechaContratacion ?? "";

    tr.dataset.cargo =
        datos.cargo ?? "";

    tr.dataset.tipoSalario =
        datos.tipoSalario ?? "MENSUAL";

    tr.dataset.salario =
        String(
            datos.salario ?? 0
        );

    tr.dataset.estado =
        datos.estado ?? "ACTIVO";

    tr.dataset.fechaCambioEstado =
        datos.fechaCambioEstado ?? "";

    tr.dataset.observacionEstado =
        datos.observacionEstado ?? "";

}


/* =========================================================
   CONSTRUIR FILA
========================================================= */

function construirFilaEmpleado(datos) {

    const iniciales =
        obtenerIniciales(
            datos.nombreCompleto
        );

    const estadoTexto =
        convertirEstadoTexto(
            datos.estado
        );

    const tipoSalarioTexto =
        convertirTipoSalarioTexto(
            datos.tipoSalario
        );

    const salarioTexto =
        formatearMoneda(
            datos.salario
        );

    const fechaTexto =
        formatearFecha(
            datos.fechaContratacion
        );

    const fechaEstadoTexto =
        datos.fechaCambioEstado
            ? "Desde " +
              formatearFecha(
                  datos.fechaCambioEstado
              )
            : "";

    const clase =
        claseEstado(
            datos.estado
        );

    return `

        <td>

            <span class="employee-id">

                ${escapeHtml(
                    formatearId(datos.id)
                )}

            </span>

        </td>

        <td>

            <div class="date-cell">

                <i class="fa-regular fa-calendar"></i>

                <span>
                    ${escapeHtml(fechaTexto)}
                </span>

            </div>

        </td>

        <td>

            <span class="identity-number">

                ${escapeHtml(
                    datos.identidad
                )}

            </span>

        </td>

        <td>

            <div class="employee-name">

                <div class="avatar">

                    ${escapeHtml(
                        iniciales
                    )}

                </div>

                <div class="employee-info">

                    <strong>
                        ${escapeHtml(
                            datos.nombreCompleto
                        )}
                    </strong>

                    <span class="employee-status-text ${clase}">

                        <i class="fa-solid fa-circle"></i>

                        ${escapeHtml(
                            estadoTexto
                        )}

                    </span>

                </div>

            </div>

        </td>

        <td>

            <div class="job-cell">

                <i class="fa-solid fa-briefcase"></i>

                <span>
                    ${escapeHtml(
                        datos.cargo
                    )}
                </span>

            </div>

        </td>

        <td>

            <span class="salary-type">

                ${escapeHtml(
                    tipoSalarioTexto
                )}

            </span>

        </td>

        <td>

            <strong class="salary">

                ${escapeHtml(
                    salarioTexto
                )}

            </strong>

        </td>

        <td>

            <div class="status-cell">

                <span class="status-badge ${clase}">

                    <i class="fa-solid fa-circle"></i>

                    ${escapeHtml(
                        estadoTexto
                    )}

                </span>

                <small>

                    ${escapeHtml(
                        fechaEstadoTexto
                    )}

                </small>

            </div>

        </td>

        <td>

            <div class="actions">

                <button
                    type="button"
                    class="action-btn view"
                    title="Ver información"
                    onclick="verEmpleado(this)">

                    <i class="fa-solid fa-eye"></i>

                </button>

                <button
                    type="button"
                    class="action-btn edit"
                    title="Editar empleado"
                    onclick="editarEmpleado(this)">

                    <i class="fa-solid fa-pen"></i>

                </button>

                <button
                    type="button"
                    class="action-btn delete"
                    title="Eliminar empleado"
                    onclick="confirmarEliminar(this)">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        </td>

    `;

}


/* =========================================================
   EDITAR EMPLEADO
========================================================= */

function editarEmpleado(button) {

    const tr =
        obtenerFilaDesdeBoton(button);

    if (!tr) {

        mostrarToast(
            "No se pudo encontrar el empleado.",
            "error"
        );

        return;
    }

    const datos =
        obtenerDatosFila(tr);

    empleadoEnEdicion = tr;

    establecerValorInput(
        "empleadoId",
        datos.id
    );

    establecerValorInput(
        "identidad",
        datos.identidad
    );

    establecerValorInput(
        "nombreCompleto",
        datos.nombreCompleto
    );

    establecerValorInput(
        "telefono",
        datos.telefono
    );

    establecerValorInput(
        "fechaContratacion",
        datos.fechaContratacion
    );

    establecerValorInput(
        "cargo",
        datos.cargo
    );

    establecerValorInput(
        "tipoSalario",
        datos.tipoSalario
    );

    establecerValorInput(
        "salario",
        datos.salario
    );

    establecerValorInput(
        "banco",
        datos.banco
    );

    establecerValorInput(
        "numeroCuenta",
        datos.numeroCuenta
    );

    establecerValorInput(
        "estado",
        datos.estado
    );

    establecerValorInput(
        "fechaCambioEstado",
        datos.fechaCambioEstado
    );

    establecerValorInput(
        "observacionEstado",
        datos.observacionEstado
    );

    const titulo =
        obtenerElemento(
            "modalEmpleadoTitulo"
        );

    if (titulo) {

        titulo.textContent =
            "Editar empleado";

    }

    cambiarTextoBotonGuardar(
        "Guardar cambios"
    );

    actualizarEstadoFormulario();

    abrirModalPorId(
        "empleadoModal"
    );

}


/* =========================================================
   VER EMPLEADO
========================================================= */

function verEmpleado(button) {

    const tr =
        obtenerFilaDesdeBoton(button);

    if (!tr) {

        mostrarToast(
            "No se pudo encontrar el empleado.",
            "error"
        );

        return;
    }

    const datos =
        obtenerDatosFila(tr);

    ponerTexto(
        "detalleId",
        formatearId(datos.id)
    );

    ponerTexto(
        "detalleIdentidad",
        datos.identidad
    );

    ponerTexto(
        "detalleNombre",
        datos.nombreCompleto
    );

    ponerTexto(
        "detalleCargo",
        datos.cargo
    );

    ponerTexto(
        "detalleTelefono",
        datos.telefono ||
        "Sin teléfono"
    );

    ponerTexto(
        "detalleTipo",
        convertirTipoSalarioTexto(
            datos.tipoSalario
        )
    );

    ponerTexto(
        "detalleSalario",
        formatearMoneda(
            datos.salario
        )
    );

    ponerTexto(
        "detalleBanco",
        datos.banco ||
        "Sin banco"
    );

    ponerTexto(
        "detalleCuenta",
        datos.numeroCuenta ||
        "Sin cuenta"
    );

    ponerTexto(
        "detalleFecha",
        formatearFecha(
            datos.fechaContratacion
        )
    );

    ponerTexto(
        "detalleEstado",
        convertirEstadoTexto(
            datos.estado
        )
    );

    ponerTexto(
        "detalleEstadoTexto",
        convertirEstadoTexto(
            datos.estado
        )
    );

    ponerTexto(
        "detalleFechaEstado",
        datos.fechaCambioEstado
            ? "Desde " +
              formatearFecha(
                  datos.fechaCambioEstado
              )
            : "Sin fecha registrada"
    );

    ponerTexto(
        "detalleObservacion",
        datos.observacionEstado ||
        "Sin observaciones."
    );

    const avatar =
        obtenerElemento(
            "detalleAvatar"
        );

    if (avatar) {

        avatar.textContent =
            obtenerIniciales(
                datos.nombreCompleto
            );

    }

    actualizarEstadoDetalle(
        datos.estado
    );

    abrirModalPorId(
        "detalleModal"
    );

}


/* =========================================================
   CERRAR DETALLE
========================================================= */

function cerrarDetalleModal() {

    cerrarModalPorId(
        "detalleModal"
    );

}


function cerrarDetalle() {

    cerrarDetalleModal();

}


/* =========================================================
   ESTADO DEL DETALLE
========================================================= */

function actualizarEstadoDetalle(
    estado
) {

    const card =
        obtenerElemento(
            "detalleEstadoCard"
        );

    if (!card) {
        return;
    }

    card.classList.remove(
        "active",
        "inactive",
        "despedido",
        "retirado",
        "dismissed",
        "retired"
    );

    const clase =
        claseEstado(estado);

    card.classList.add(clase);

    const icono =
        card.querySelector(
            ".detail-status-icon i"
        );

    if (!icono) {
        return;
    }

    icono.className =
        "fa-solid";

    switch (estado) {

        case "ACTIVO":

            icono.classList.add(
                "fa-circle-check"
            );

            break;

        case "INACTIVO":

            icono.classList.add(
                "fa-circle-pause"
            );

            break;

        case "DESPEDIDO":

            icono.classList.add(
                "fa-user-slash"
            );

            break;

        case "RETIRADO":

            icono.classList.add(
                "fa-person-walking-arrow-right"
            );

            break;

    }

}


/* =========================================================
   ELIMINAR
========================================================= */

function confirmarEliminar(button) {

    const tr =
        obtenerFilaDesdeBoton(button);

    if (!tr) {

        mostrarToast(
            "No se pudo encontrar el empleado.",
            "error"
        );

        return;
    }

    empleadoAEliminar = tr;

    const datos =
        obtenerDatosFila(tr);

    const nombre =
        obtenerElemento(
            "empleadoEliminarNombre"
        );

    if (nombre) {

        nombre.textContent =
            datos.nombreCompleto ||
            "este empleado";

    }

    abrirModalPorId(
        "eliminarModal"
    );

}


function cerrarEliminarModal() {

    cerrarModalPorId(
        "eliminarModal"
    );

    empleadoAEliminar = null;

}


/**
 * ELIMINACIÓN REAL DE LA BD
 */
async function eliminarEmpleado() {

    if (!empleadoAEliminar) {

        cerrarEliminarModal();

        return;
    }

    const tr =
        empleadoAEliminar;

    const datos =
        obtenerDatosFila(tr);

    const id =
        datos.id;

    const botones =
        document.querySelectorAll(
            "#eliminarModal button"
        );

    try {

        botones.forEach(function (boton) {
            boton.disabled = true;
        });

        await eliminarEmpleadoEnBD(id);

        tr.remove();

        empleadoAEliminar = null;

        cerrarModalPorId(
            "eliminarModal"
        );

        actualizarEstadisticas();

        aplicarFiltros();

        mostrarToast(
            "Empleado eliminado correctamente.",
            "success"
        );

    } catch (error) {

        console.error(
            "Error eliminando empleado:",
            error
        );

        mostrarToast(
            obtenerMensajeError(error),
            "error"
        );

    } finally {

        botones.forEach(function (boton) {
            boton.disabled = false;
        });

    }

}


/* =========================================================
   OBTENER DATOS DE FILA
========================================================= */

function obtenerDatosFila(tr) {

    if (!tr) {
        return {};
    }

    return {

        id:
            tr.dataset.id ||
            obtenerTextoFila(tr, 0),

        identidad:
            tr.dataset.identidad ||
            obtenerTextoFila(tr, 2),

        nombreCompleto:
            tr.dataset.nombre ||
            obtenerNombreFila(tr),

        telefono:
            tr.dataset.telefono ||
            "",

        fechaContratacion:
            tr.dataset.fechaContratacion ||
            convertirFechaTablaAISO(
                obtenerTextoFila(tr, 1)
            ),

        cargo:
            tr.dataset.cargo ||
            obtenerTextoFila(tr, 4),

        tipoSalario:
            tr.dataset.tipoSalario ||
            convertirTipoSalarioValor(
                obtenerTextoFila(tr, 5)
            ),

        salario:
            tr.dataset.salario !== undefined
                ? parseFloat(
                    tr.dataset.salario
                ) || 0
                : obtenerSalarioFila(tr),

        banco:
            tr.dataset.banco ||
            "",

        numeroCuenta:
            tr.dataset.cuenta ||
            tr.dataset.numeroCuenta ||
            "",

        estado:
            tr.dataset.estado ||
            obtenerEstadoFila(tr),

        fechaCambioEstado:
            tr.dataset.fechaCambioEstado ||
            obtenerFechaEstadoFila(tr),

        observacionEstado:
            tr.dataset.observacionEstado ||
            ""

    };

}


/* =========================================================
   OBTENER FILA
========================================================= */

function obtenerFilaDesdeBoton(button) {

    if (!button) {
        return null;
    }

    return button.closest("tr");

}


/* =========================================================
   FILTROS
========================================================= */

function aplicarFiltros() {

    const tbody =
        obtenerElemento(
            "empleadosTableBody"
        );

    if (!tbody) {
        return;
    }

    const buscar =
        obtenerElemento(
            "buscarEmpleado"
        );

    const filtroEstado =
        obtenerElemento(
            "filtroEstado"
        );

    const filtroSalario =
        obtenerElemento(
            "filtroSalario"
        );

    const textoBusqueda =
        buscar
            ? buscar.value
                .trim()
                .toLowerCase()
            : "";

    const estadoSeleccionado =
        filtroEstado
            ? filtroEstado.value
            : "";

    const salarioSeleccionado =
        filtroSalario
            ? filtroSalario.value
            : "";

    const filas =
        tbody.querySelectorAll(
            "tr:not(#emptyRow):not(#loadingRow)"
        );

    let visibles = 0;

    filas.forEach(function (tr) {

        const datos =
            obtenerDatosFila(tr);

        const textoFila = (

            datos.id + " " +
            datos.identidad + " " +
            datos.nombreCompleto + " " +
            datos.cargo + " " +
            convertirTipoSalarioTexto(
                datos.tipoSalario
            )

        ).toLowerCase();

        const coincideBusqueda =
            !textoBusqueda ||
            textoFila.includes(
                textoBusqueda
            );

        const coincideEstado =
            !estadoSeleccionado ||
            datos.estado ===
            estadoSeleccionado;

        const coincideSalario =
            !salarioSeleccionado ||
            datos.tipoSalario ===
            salarioSeleccionado;

        const mostrar =
            coincideBusqueda &&
            coincideEstado &&
            coincideSalario;

        tr.style.display =
            mostrar
                ? ""
                : "none";

        if (mostrar) {
            visibles++;
        }

    });

    actualizarFilaVacia(
        visibles
    );

}


/* =========================================================
   FILA VACÍA
========================================================= */

function actualizarFilaVacia(
    cantidadVisible
) {

    const tbody =
        obtenerElemento(
            "empleadosTableBody"
        );

    if (!tbody) {
        return;
    }

    let emptyRow =
        obtenerElemento(
            "emptyRow"
        );

    if (cantidadVisible === 0) {

        if (!emptyRow) {

            emptyRow =
                document.createElement("tr");

            emptyRow.id =
                "emptyRow";

            emptyRow.innerHTML = `

                <td colspan="9">

                    <div class="empty-state">

                        <div class="empty-icon">

                            <i class="fa-solid fa-users-slash"></i>

                        </div>

                        <h3>
                            No hay empleados registrados
                        </h3>

                        <p>
                            No se encontraron empleados con los filtros actuales.
                        </p>

                    </div>

                </td>

            `;

            tbody.appendChild(
                emptyRow
            );

        }

        emptyRow.style.display =
            "";

    }

    else {

        if (emptyRow) {

            emptyRow.style.display =
                "none";

        }

    }

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function actualizarEstadisticas() {

    const tbody =
        obtenerElemento("empleadosTableBody");

    if (!tbody) {
        return;
    }

    const filas =
        tbody.querySelectorAll(
            "tr:not(#emptyRow):not(#loadingRow)"
        );

    let total = 0;
    let activos = 0;

    // ACUMULADO DIRECTO DE SALARIOS
    let nomina = 0;

    const puestos =
        new Set();

    filas.forEach(function (tr) {

        const datos =
            obtenerDatosFila(tr);

        if (
            !datos.id &&
            !datos.nombreCompleto
        ) {
            return;
        }

        total++;

        /* ==========================================
           EMPLEADOS ACTIVOS
        ========================================== */

        if (
            String(datos.estado || "")
                .toUpperCase() === "ACTIVO"
        ) {

            activos++;

            /*
             * LA NÓMINA SE CALCULA SUMANDO
             * DIRECTAMENTE EL SALARIO REGISTRADO.
             *
             * NO se convierte:
             * - semanal
             * - quincenal
             * - diario
             * - mensual
             *
             * Simplemente:
             *
             * nómina = salario1 + salario2 + salario3...
             */

            nomina +=
                parseFloat(datos.salario) || 0;
        }

        /* ==========================================
           PUESTOS
        ========================================== */

        if (datos.cargo) {

            puestos.add(
                datos.cargo
                    .trim()
                    .toLowerCase()
            );
        }

    });

    /* ==========================================
       ACTUALIZAR TARJETAS
    ========================================== */

    ponerTexto(
        "totalEmpleados",
        total
    );

    ponerTexto(
        "empleadosActivos",
        activos
    );

    ponerTexto(
        "nominaMensual",
        formatearMoneda(nomina)
    );

    ponerTexto(
        "puestosRegistrados",
        puestos.size
    );
}


function convertirASalarioMensual(
    salario,
    tipo
) {
    const valor =
        parseFloat(salario) || 0;

    switch (
        String(tipo || "")
            .toUpperCase()
    ) {
        case "QUINCENAL":
            return valor * 2;

        case "SEMANAL":
            return valor * 52 / 12;

        case "DIARIO":
            return valor * 30;

        case "MENSUAL":
        default:
            return valor;
    }
}



/* =========================================================
   ESTADO DEL FORMULARIO
========================================================= */

function actualizarEstadoFormulario() {

    const estado =
        obtenerElemento("estado");

    const preview =
        obtenerElemento("estadoPreview");

    if (!estado || !preview) {
        return;
    }

    const valor =
        estado.value ||
        "ACTIVO";

    preview.classList.remove(
        "active",
        "inactive",
        "despedido",
        "retirado"
    );

    preview.classList.add(
        claseEstado(valor)
    );

    const icono =
        preview.querySelector(
            ".status-preview-icon i"
        );

    const titulo =
        preview.querySelector(
            "strong"
        );

    const descripcion =
        preview.querySelector(
            "span"
        );

    if (icono) {

        icono.className =
            "fa-solid";

    }

    switch (valor) {

        case "ACTIVO":

            if (icono) {

                icono.classList.add(
                    "fa-circle-check"
                );

            }

            if (titulo) {

                titulo.textContent =
                    "Empleado activo";

            }

            if (descripcion) {

                descripcion.textContent =
                    "Actualmente puede recibir pagos y beneficios.";

            }

            break;


        case "INACTIVO":

            if (icono) {

                icono.classList.add(
                    "fa-circle-pause"
                );

            }

            if (titulo) {

                titulo.textContent =
                    "Empleado inactivo";

            }

            if (descripcion) {

                descripcion.textContent =
                    "El empleado se encuentra temporalmente inactivo.";

            }

            break;


        case "DESPEDIDO":

            if (icono) {

                icono.classList.add(
                    "fa-user-slash"
                );

            }

            if (titulo) {

                titulo.textContent =
                    "Empleado despedido";

            }

            if (descripcion) {

                descripcion.textContent =
                    "La relación laboral ha finalizado por despido.";

            }

            break;


        case "RETIRADO":

            if (icono) {

                icono.classList.add(
                    "fa-person-walking-arrow-right"
                );

            }

            if (titulo) {

                titulo.textContent =
                    "Empleado retirado";

            }

            if (descripcion) {

                descripcion.textContent =
                    "El empleado se ha retirado de la empresa.";

            }

            break;

    }

}


/* =========================================================
   TOAST
========================================================= */

function mostrarToast(
    mensaje,
    tipo = "success"
) {

    const container =
        obtenerElemento(
            "toastContainer"
        );

    if (!container) {

        console.log(mensaje);

        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        "toast " + tipo;

    let icono =
        "fa-circle-check";

    let titulo =
        "Información";

    if (tipo === "error") {

        icono =
            "fa-circle-exclamation";

        titulo =
            "Error";

    }

    if (tipo === "warning") {

        icono =
            "fa-triangle-exclamation";

        titulo =
            "Advertencia";

    }

    toast.innerHTML = `

        <div class="toast-icon">

            <i class="fa-solid ${icono}"></i>

        </div>

        <div class="toast-content">

            <strong>
                ${titulo}
            </strong>

            <span>
                ${escapeHtml(mensaje)}
            </span>

        </div>

        <button
            type="button"
            class="toast-close"
            aria-label="Cerrar">

            <i class="fa-solid fa-xmark"></i>

        </button>

    `;

    container.appendChild(
        toast
    );

    const cerrar =
        toast.querySelector(
            ".toast-close"
        );

    if (cerrar) {

        cerrar.addEventListener(
            "click",
            function () {

                toast.remove();

            }
        );

    }

    setTimeout(
        function () {

            toast.classList.add(
                "hide"
            );

            setTimeout(
                function () {

                    toast.remove();

                },
                300
            );

        },
        4000
    );

}


/* =========================================================
   HELPERS DE INPUTS
========================================================= */

function obtenerElemento(id) {

    return document.getElementById(id);

}


function obtenerValor(id) {

    const elemento =
        obtenerElemento(id);

    if (!elemento) {
        return "";
    }

    return String(
        elemento.value || ""
    ).trim();

}


function establecerValorInput(
    id,
    valor
) {

    const elemento =
        obtenerElemento(id);

    if (!elemento) {
        return;
    }

    elemento.value =
        valor !== null &&
        valor !== undefined
            ? valor
            : "";

}


function ponerTexto(
    id,
    valor
) {

    const elemento =
        obtenerElemento(id);

    if (!elemento) {
        return;
    }

    elemento.textContent =
        valor !== null &&
        valor !== undefined
            ? valor
            : "";

}


/* =========================================================
   BOTÓN GUARDAR
========================================================= */

function cambiarTextoBotonGuardar(
    texto
) {

    const boton =
        document.querySelector(
            "#empleadoForm button[type='submit']"
        );

    if (!boton) {
        return;
    }

    boton.innerHTML = `

        <i class="fa-solid fa-floppy-disk"></i>

        ${escapeHtml(texto)}

    `;

}


/* =========================================================
   FECHA ACTUAL
========================================================= */

function establecerFechaActualSiEstaVacia(
    id
) {

    const elemento =
        obtenerElemento(id);

    if (
        !elemento ||
        elemento.value
    ) {
        return;
    }

    const hoy =
        new Date();

    const year =
        hoy.getFullYear();

    const month =
        String(
            hoy.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            hoy.getDate()
        ).padStart(2, "0");

    elemento.value =
        `${year}-${month}-${day}`;

}


/* =========================================================
   ID
========================================================= */

function formatearId(id) {

    const numero =
        parseInt(
            id,
            10
        );

    if (isNaN(numero)) {

        return id || "";

    }

    return String(numero)
        .padStart(3, "0");

}


/* =========================================================
   ESTADOS
========================================================= */

function convertirEstadoTexto(
    estado
) {

    switch (
        String(estado || "")
            .toUpperCase()
    ) {

        case "ACTIVO":
            return "Activo";

        case "INACTIVO":
            return "Inactivo";

        case "DESPEDIDO":
            return "Despedido";

        case "RETIRADO":
            return "Retirado";

        default:
            return estado || "";

    }

}


function claseEstado(
    estado
) {

    switch (
        String(estado || "")
            .toUpperCase()
    ) {

        case "ACTIVO":
            return "active";

        case "INACTIVO":
            return "inactive";

        case "DESPEDIDO":
            return "despedido";

        case "RETIRADO":
            return "retirado";

        default:
            return "inactive";

    }

}


/* =========================================================
   TIPO DE SALARIO
========================================================= */

function convertirTipoSalarioTexto(
    tipo
) {

    switch (
        String(tipo || "")
            .toUpperCase()
    ) {

        case "MENSUAL":
            return "Mensual";

        case "QUINCENAL":
            return "Quincenal";

        case "SEMANAL":
            return "Semanal";

        case "DIARIO":
            return "Diario";

        default:
            return tipo || "";

    }

}


function convertirTipoSalarioValor(
    texto
) {

    const valor =
        String(texto || "")
            .trim()
            .toLowerCase();

    switch (valor) {

        case "mensual":
            return "MENSUAL";

        case "quincenal":
            return "QUINCENAL";

        case "semanal":
            return "SEMANAL";

        case "diario":
            return "DIARIO";

        default:
            return texto || "";

    }

}


/* =========================================================
   FECHAS
========================================================= */

function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "";
    }

    const texto =
        String(fecha);

    /*
     * PostgreSQL / Spring:
     * YYYY-MM-DD
     */

    const partes =
        texto.split("-");

    if (partes.length === 3) {

        return (
            partes[2] +
            "/" +
            partes[1] +
            "/" +
            partes[0]
        );

    }

    return texto;

}


function convertirFechaTablaAISO(
    fecha
) {

    if (!fecha) {
        return "";
    }

    const partes =
        String(fecha)
            .trim()
            .split("/");

    if (partes.length === 3) {

        return (

            partes[2] +
            "-" +
            partes[1].padStart(2, "0") +
            "-" +
            partes[0].padStart(2, "0")

        );

    }

    return fecha;

}


function obtenerFechaEstadoFila(
    tr
) {

    const small =
        tr.querySelector(
            ".status-cell small"
        );

    if (!small) {
        return "";
    }

    const texto =
        small.textContent.trim();

    const match =
        texto.match(
            /(\d{2}\/\d{2}\/\d{4})/
        );

    if (!match) {
        return "";
    }

    return convertirFechaTablaAISO(
        match[1]
    );

}


/* =========================================================
   SALARIOS
========================================================= */

function formatearMoneda(
    valor
) {

    const numero =
        parseFloat(valor) || 0;

    return (

        "L " +

        numero.toLocaleString(
            "es-HN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )

    );

}


function obtenerSalarioFila(
    tr
) {

    const texto =
        obtenerTextoFila(
            tr,
            6
        )
        .replace("L", "")
        .replace(/,/g, "")
        .trim();

    const numero =
        parseFloat(texto);

    return isNaN(numero)
        ? 0
        : numero;

}


/* =========================================================
   ESTADO DESDE FILA
========================================================= */

function obtenerEstadoFila(
    tr
) {

    const badge =
        tr.querySelector(
            ".status-badge"
        );

    if (!badge) {
        return "ACTIVO";
    }

    const texto =
        badge.textContent
            .trim()
            .toLowerCase();

    if (
        texto.includes(
            "despedido"
        )
    ) {
        return "DESPEDIDO";
    }

    if (
        texto.includes(
            "retirado"
        )
    ) {
        return "RETIRADO";
    }

    if (
        texto.includes(
            "inactivo"
        )
    ) {
        return "INACTIVO";
    }

    return "ACTIVO";

}


/* =========================================================
   NOMBRE DESDE FILA
========================================================= */

function obtenerNombreFila(
    tr
) {

    const elemento =
        tr.querySelector(
            ".employee-info strong"
        );

    if (elemento) {

        return elemento
            .textContent
            .trim();

    }

    return obtenerTextoFila(
        tr,
        3
    );

}


/* =========================================================
   TEXTO DE CELDA
========================================================= */

function obtenerTextoFila(
    tr,
    indice
) {

    const celda =
        tr.cells[indice];

    if (!celda) {
        return "";
    }

    return celda.textContent.trim();

}


/* =========================================================
   INICIALES
========================================================= */

function obtenerIniciales(
    nombre
) {

    if (!nombre) {
        return "?";
    }

    const palabras =
        nombre
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (palabras.length === 1) {

        return palabras[0]
            .substring(0, 2)
            .toUpperCase();

    }

    return (

        palabras[0].charAt(0) +

        palabras[
            palabras.length - 1
        ].charAt(0)

    ).toUpperCase();

}


/* =========================================================
   MENSAJES DE ERROR
========================================================= */

function obtenerMensajeError(
    error
) {

    if (!error) {
        return "Ocurrió un error inesperado.";
    }

    if (error.message) {
        return error.message;
    }

    return String(error);

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escapeHtml(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }

    return String(valor)

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