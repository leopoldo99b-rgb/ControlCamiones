'use strict';

/*
 * ============================================================
 * CONTROL DE MANTENIMIENTOS Y UNIDADES
 * ============================================================
 *
 * MANTENIMIENTOS
 * GET    /api/mantenimientos
 * GET    /api/mantenimientos/{id}
 * POST   /api/mantenimientos
 * PUT    /api/mantenimientos/{id}
 * DELETE /api/mantenimientos/{id}
 *
 * UNIDADES
 * GET    /api/unidades
 * GET    /api/unidades/{id}
 * POST   /api/unidades
 * PUT    /api/unidades/{id}
 * DELETE /api/unidades/{id}
 *
 * PDF
 * - jsPDF
 * - jsPDF-AutoTable
 * - Logo: /imgs/logo.png
 *
 * ============================================================
 */


/* ============================================================
   CONFIGURACIÓN
============================================================ */

const CONFIG = Object.freeze({

    mantenimientosUrl:
        '/api/mantenimientos',

    unidadesUrl:
        '/api/unidades',

    logoPdfUrl:
        '/imgs/logo.png',

    toastDelay:
        3500,

    registrosPorPagina:
        10

});


/* ============================================================
   ESTADO GLOBAL
============================================================ */

const STATE = {

    mantenimientos: [],

    mantenimientosFiltrados: [],

    unidades: [],

    mantenimientoSeleccionado: null,

    unidadSeleccionada: null,

    modoUnidad: 'crear',

    abriendoEdicionUnidad: false,

    paginaActual: 1

};


/* ============================================================
   DOM
============================================================ */

const DOM = {

    /* Formularios */

    formNuevo:
        document.getElementById(
            'formMantenimiento'
        ),

    formEditar:
        document.getElementById(
            'formEditarMantenimiento'
        ),

    formUnidad:
        document.getElementById(
            'formUnidad'
        ),


    /* Modales */

    modalNuevo:
        document.getElementById(
            'nuevoMantenimientoModal'
        ),

    modalVer:
        document.getElementById(
            'verMantenimientoModal'
        ),

    modalEditar:
        document.getElementById(
            'editarMantenimientoModal'
        ),

    modalEliminar:
        document.getElementById(
            'eliminarMantenimientoModal'
        ),

    modalNuevaUnidad:
        document.getElementById(
            'nuevaUnidadModal'
        ),


    /* Botones */

    btnConfirmarEliminar:
        document.getElementById(
            'btnConfirmarEliminar'
        ),

    btnLimpiarFiltros:
        document.getElementById(
            'btnLimpiarFiltros'
        ),

    btnExportar:
        document.getElementById(
            'btnExportar'
        ),

    btnMarcarNotificaciones:
        document.getElementById(
            'marcarNotificacionesLeidas'
        ),


    /* Filtros */

    filtroUnidad:
        document.getElementById(
            'filtroUnidad'
        ),

    filtroTipo:
        document.getElementById(
            'filtroTipo'
        ),

    filtroMedicionTipo:
        document.getElementById(
            'filtroMedicionTipo'
        ),

    filtroDesde:
        document.getElementById(
            'filtroDesde'
        ),

    filtroHasta:
        document.getElementById(
            'filtroHasta'
        ),

    filtroBuscar:
        document.getElementById(
            'filtroBuscar'
        ),


    /* Tablas */

    tablaMantenimientos:
        document.getElementById(
            'maintenanceTableBody'
        ),

    tablaUnidades:
        document.getElementById(
            'unitsTableBody'
        ),


    /* Paginación */

    paginationNav:
        document.getElementById(
            'paginationNav'
        ),

    paginationInfo:
        document.getElementById(
            'paginationInfo'
        ),

    tableCount:
        document.getElementById(
            'tableCount'
        ),


    /* Contadores mantenimiento */

    totalMantenimientos:
        document.getElementById(
            'totalMantenimientos'
        ),

    totalPreventivos:
        document.getElementById(
            'totalPreventivos'
        ),

    totalCorrectivos:
        document.getElementById(
            'totalCorrectivos'
        ),

    totalUnidadesAtendidas:
        document.getElementById(
            'totalUnidadesAtendidas'
        ),


    /* Contador unidades */

    unitsTotalCount:
        document.getElementById(
            'unitsTotalCount'
        ),


    /* Selects unidades */

    unidadMantenimiento:
        document.getElementById(
            'unidadMantenimiento'
        ),

    editarUnidad:
        document.getElementById(
            'editarUnidad'
        ),


    /* Notificaciones */

    notificationDot:
        document.getElementById(
            'notificationBadge'
        ),


    /* Toasts */

    successToast:
        document.getElementById(
            'successToast'
        ),

    errorToast:
        document.getElementById(
            'errorToast'
        ),

    deleteToast:
        document.getElementById(
            'deleteToast'
        )

};


/* ============================================================
   INICIALIZACIÓN
============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    inicializarAplicacion
);


async function inicializarAplicacion() {

    console.log(
        'Inicializando módulo de mantenimientos y unidades...'
    );


    registrarEventosMantenimientos();

    registrarEventosUnidades();

    eliminarBotonImprimirHistorial();


    await cargarUnidades();

    await cargarMantenimientos();


    actualizarContadores();

    inicializarNotificaciones();


    console.log(
        'Aplicación inicializada correctamente.'
    );

}


/* ============================================================
   EVENTOS - MANTENIMIENTOS
============================================================ */

function registrarEventosMantenimientos() {

    if (DOM.formNuevo) {

        DOM.formNuevo.addEventListener(
            'submit',
            manejarFormularioNuevo
        );

    }


    if (DOM.formEditar) {

        DOM.formEditar.addEventListener(
            'submit',
            manejarFormularioEditar
        );

    }


    if (DOM.btnConfirmarEliminar) {

        DOM.btnConfirmarEliminar.addEventListener(
            'click',
            confirmarEliminar
        );

    }


    if (DOM.btnLimpiarFiltros) {

        DOM.btnLimpiarFiltros.addEventListener(
            'click',
            limpiarFiltros
        );

    }


    if (DOM.btnExportar) {

        DOM.btnExportar.addEventListener(
            'click',
            exportarMantenimientos
        );

    }


    if (DOM.btnMarcarNotificaciones) {

        DOM.btnMarcarNotificaciones.addEventListener(
            'click',
            marcarNotificacionesLeidas
        );

    }


    const filtros = [

        DOM.filtroUnidad,

        DOM.filtroTipo,

        DOM.filtroMedicionTipo,

        DOM.filtroDesde,

        DOM.filtroHasta

    ];


    filtros.forEach(elemento => {

        if (elemento) {

            elemento.addEventListener(
                'change',
                aplicarFiltros
            );

        }

    });


    if (DOM.filtroBuscar) {

        DOM.filtroBuscar.addEventListener(
            'input',
            aplicarFiltros
        );

    }


    if (DOM.tablaMantenimientos) {

        DOM.tablaMantenimientos.addEventListener(
            'click',
            manejarAccionesTabla
        );

    }


    /*
     * Cuando el usuario selecciona una unidad
     * para un nuevo mantenimiento, actualizamos
     * automáticamente su placa.
     */

    if (DOM.unidadMantenimiento) {

        DOM.unidadMantenimiento.addEventListener(
            'change',
            manejarCambioUnidadMantenimiento
        );

    }


    /*
     * Cuando el usuario cambia la unidad al editar
     * un mantenimiento, actualizamos automáticamente
     * la placa.
     */

    if (DOM.editarUnidad) {

        DOM.editarUnidad.addEventListener(
            'change',
            manejarCambioUnidadEditar
        );

    }

}


/* ============================================================
   EVENTOS - UNIDADES
============================================================ */

function registrarEventosUnidades() {

    if (DOM.formUnidad) {

        DOM.formUnidad.addEventListener(
            'submit',
            manejarFormularioUnidad
        );

    } else {

        console.warn(
            'No se encontró #formUnidad.'
        );

    }


    if (DOM.tablaUnidades) {

        DOM.tablaUnidades.addEventListener(
            'click',
            manejarAccionesUnidad
        );

    } else {

        console.warn(
            'No se encontró #unitsTableBody.'
        );

    }


    if (DOM.modalNuevaUnidad) {

        DOM.modalNuevaUnidad.addEventListener(
            'show.bs.modal',
            prepararModalNuevaUnidad
        );


        DOM.modalNuevaUnidad.addEventListener(
            'shown.bs.modal',
            colocarModalUnidadAlFrente
        );


        DOM.modalNuevaUnidad.addEventListener(
            'hidden.bs.modal',
            restaurarZIndexModalUnidad
        );

    }

}


/* ============================================================
   ELIMINAR BOTÓN IMPRIMIR DEL HISTORIAL
============================================================ */

function eliminarBotonImprimirHistorial() {

    if (!DOM.tablaMantenimientos) {

        return;

    }


    const contenedor =
        DOM.tablaMantenimientos.closest('.card');


    if (!contenedor) {

        return;

    }


    const botones =
        contenedor.querySelectorAll(
            'button, a'
        );


    botones.forEach(boton => {

        const texto =
            boton.textContent
                .trim()
                .toLowerCase();


        if (

            texto === 'imprimir' ||

            texto.includes('imprimir')

        ) {

            boton.remove();

        }

    });

}


/* ============================================================
   MODAL UNIDAD AL FRENTE
============================================================ */

function colocarModalUnidadAlFrente() {

    if (!DOM.modalNuevaUnidad) {

        return;

    }


    DOM.modalNuevaUnidad.style.zIndex =
        '1065';


    const backdrops =
        document.querySelectorAll(
            '.modal-backdrop'
        );


    if (backdrops.length > 0) {

        const ultimoBackdrop =
            backdrops[
                backdrops.length - 1
            ];


        ultimoBackdrop.style.zIndex =
            '1060';

    }

}


/* ============================================================
   RESTAURAR Z-INDEX MODAL UNIDAD
============================================================ */

function restaurarZIndexModalUnidad() {

    if (!DOM.modalNuevaUnidad) {

        return;

    }


    DOM.modalNuevaUnidad.style.zIndex =
        '';


    const backdrops =
        document.querySelectorAll(
            '.modal-backdrop'
        );


    backdrops.forEach(backdrop => {

        backdrop.style.zIndex = '';

    });


    STATE.modoUnidad =
        'crear';

    STATE.unidadSeleccionada =
        null;

    STATE.abriendoEdicionUnidad =
        false;

}


/* ============================================================
   ACCIONES TABLA UNIDADES
============================================================ */

async function manejarAccionesUnidad(event) {

    const boton =
        event.target.closest(
            '[data-unidad-action]'
        );


    if (!boton) {

        return;

    }


    const accion =
        boton.dataset.unidadAction;


    const id =
        Number(
            boton.dataset.id
        );


    if (

        !Number.isInteger(id) ||

        id <= 0

    ) {

        mostrarError(
            'El ID de la unidad no es válido.'
        );

        return;

    }


    switch (accion) {

        case 'editar':

            await editarUnidad(id);

            break;


        default:

            console.warn(
                'Acción de unidad desconocida:',
                accion
            );

            break;

    }

}


/* ============================================================
   UNIDADES - CARGAR
============================================================ */

async function cargarUnidades() {

    try {

        const respuesta =
            await fetch(
                CONFIG.unidadesUrl
            );


        if (!respuesta.ok) {

            const mensaje =
                await obtenerMensajeError(
                    respuesta
                );

            throw new Error(mensaje);

        }


        const datos =
            await respuesta.json();


        STATE.unidades =
            Array.isArray(datos)
                ? datos
                : [];


        console.log(
            'Unidades cargadas:',
            STATE.unidades
        );


        /*
         * Si ya había mantenimientos cargados,
         * actualizamos sus unidades y placas.
         */

        enriquecerTodosLosMantenimientosConUnidades();


        renderizarTablaUnidades();

        actualizarContadorUnidades();

        llenarSelectUnidades();

        actualizarPlacaMantenimientoSeleccionada();

        actualizarPlacaMantenimientoEditado();


        /*
         * Si los mantenimientos ya estaban cargados,
         * volvemos a aplicar los filtros para actualizar
         * la tabla con las placas actuales.
         */

        if (
            STATE.mantenimientos.length > 0
        ) {

            aplicarFiltros();

        }


    } catch (error) {

        console.error(
            'Error al cargar unidades:',
            error
        );


        STATE.unidades = [];


        renderizarTablaUnidades();

        actualizarContadorUnidades();

        llenarSelectUnidades();


        mostrarError(
            error.message ||
            'No fue posible cargar las unidades.'
        );

    }

}


/* ============================================================
   TABLA UNIDADES
============================================================ */

function renderizarTablaUnidades() {

    if (!DOM.tablaUnidades) {

        return;

    }


    DOM.tablaUnidades.innerHTML = '';


    if (STATE.unidades.length === 0) {

        DOM.tablaUnidades.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center py-4 text-muted"
                >

                    <i
                        class="bi bi-truck fs-2 d-block mb-2"
                    ></i>

                    <p
                        class="mb-1 fw-semibold text-dark"
                    >
                        No hay unidades registradas
                    </p>

                    <small>
                        Registra una unidad para comenzar.
                    </small>

                </td>

            </tr>

        `;

        return;

    }


    STATE.unidades.forEach(unidad => {

        const fila =
            crearFilaUnidad(unidad);


        DOM.tablaUnidades.appendChild(
            fila
        );

    });

}


/* ============================================================
   CREAR FILA UNIDAD
============================================================ */

function crearFilaUnidad(unidad) {

    const fila =
        document.createElement('tr');


    const id =
        unidad.idUnidad ?? '';


    const codigo =
        unidad.codigoUnidad || '—';


    const placa =
        unidad.placa || '—';


    const descripcion =
        unidad.descripcion || '—';


    const activo =
        unidadEstaActiva(unidad);


    const estadoClase =
        activo
            ? 'text-bg-success'
            : 'text-bg-secondary';


    const estadoTexto =
        activo
            ? 'Activa'
            : 'Inactiva';


    fila.innerHTML = `

        <td>

            <strong>
                ${escaparHtml(id)}
            </strong>

        </td>

        <td>

            <span class="fw-semibold">
                ${escaparHtml(codigo)}
            </span>

        </td>

        <td>
            ${escaparHtml(placa)}
        </td>

        <td>
            ${escaparHtml(descripcion)}
        </td>

        <td>

            <span class="badge ${estadoClase}">
                ${estadoTexto}
            </span>

        </td>

        <td class="text-end">

            <div
                class="btn-group"
                role="group"
            >

                <button
                    type="button"
                    class="btn btn-sm btn-light"
                    title="Editar unidad"
                    data-unidad-action="editar"
                    data-id="${escaparHtml(id)}"
                >

                    <i class="bi bi-pencil"></i>

                </button>

            </div>

        </td>

    `;


    return fila;

}


/* ============================================================
   EDITAR UNIDAD
============================================================ */

async function editarUnidad(id) {

    try {

        console.log(
            'Editando unidad:',
            id
        );


        let unidad =
            STATE.unidades.find(
                item =>
                    Number(item.idUnidad) === id
            );


        if (!unidad) {

            const respuesta =
                await fetch(
                    `${CONFIG.unidadesUrl}/${id}`
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta
                    );

                throw new Error(mensaje);

            }


            unidad =
                await respuesta.json();

        }


        if (!unidad) {

            throw new Error(
                'No se encontró la unidad.'
            );

        }


        STATE.unidadSeleccionada =
            id;


        STATE.modoUnidad =
            'editar';


        STATE.abriendoEdicionUnidad =
            true;


        const idInput =
            document.getElementById(
                'idUnidad'
            );


        const codigoInput =
            document.getElementById(
                'codigoUnidad'
            );


        const placaInput =
            document.getElementById(
                'placaUnidad'
            );


        const activoInput =
            document.getElementById(
                'activoUnidad'
            );


        const descripcionInput =
            document.getElementById(
                'descripcionUnidad'
            );


        if (idInput) {

            idInput.value =
                unidad.idUnidad ?? '';

            idInput.readOnly =
                true;

        }


        if (codigoInput) {

            codigoInput.value =
                unidad.codigoUnidad ?? '';

        }


        if (placaInput) {

            placaInput.value =
                unidad.placa ?? '';

        }


        if (activoInput) {

            activoInput.value =
                unidadEstaActiva(unidad)
                    ? 'true'
                    : 'false';

        }


        if (descripcionInput) {

            descripcionInput.value =
                unidad.descripcion ?? '';

        }


        cambiarTextoModalUnidad(
            'Editar unidad'
        );


        cambiarBotonGuardarUnidad(
            'Actualizar unidad'
        );


        abrirModal(
            DOM.modalNuevaUnidad
        );


    } catch (error) {

        STATE.abriendoEdicionUnidad =
            false;


        console.error(
            'Error al editar unidad:',
            error
        );


        mostrarError(
            error.message ||
            'No fue posible cargar la unidad para editar.'
        );

    }

}


/* ============================================================
   PREPARAR MODAL NUEVA UNIDAD
============================================================ */

function prepararModalNuevaUnidad() {

    if (STATE.abriendoEdicionUnidad) {

        STATE.abriendoEdicionUnidad =
            false;

        return;

    }


    STATE.modoUnidad =
        'crear';


    STATE.unidadSeleccionada =
        null;


    if (DOM.formUnidad) {

        DOM.formUnidad.reset();

    }


    const idInput =
        document.getElementById(
            'idUnidad'
        );


    if (idInput) {

        idInput.value = '';

        idInput.readOnly = false;

    }


    const codigoInput =
        document.getElementById(
            'codigoUnidad'
        );


    const placaInput =
        document.getElementById(
            'placaUnidad'
        );


    const activoInput =
        document.getElementById(
            'activoUnidad'
        );


    const descripcionInput =
        document.getElementById(
            'descripcionUnidad'
        );


    if (codigoInput) {

        codigoInput.value = '';

    }


    if (placaInput) {

        placaInput.value = '';

    }


    if (activoInput) {

        activoInput.value = 'true';

    }


    if (descripcionInput) {

        descripcionInput.value = '';

    }


    cambiarTextoModalUnidad(
        'Nueva unidad'
    );


    cambiarBotonGuardarUnidad(
        'Guardar unidad'
    );

}


/* ============================================================
   GUARDAR / ACTUALIZAR UNIDAD
============================================================ */

async function manejarFormularioUnidad(event) {

    event.preventDefault();


    const formulario =
        event.currentTarget;


    if (!formulario.checkValidity()) {

        formulario.reportValidity();

        return;

    }


    const idTexto =
        document.getElementById(
            'idUnidad'
        )?.value;


    const codigo =
        document.getElementById(
            'codigoUnidad'
        )?.value.trim();


    const placa =
        document.getElementById(
            'placaUnidad'
        )?.value.trim();


    const activoValor =
        document.getElementById(
            'activoUnidad'
        )?.value;


    const descripcion =
        document.getElementById(
            'descripcionUnidad'
        )?.value.trim();


    const idUnidad =
        Number(idTexto);


    if (

        !Number.isInteger(idUnidad) ||

        idUnidad <= 0

    ) {

        mostrarError(
            'El ID de la unidad debe ser un número entero válido.'
        );

        return;

    }


    if (!codigo) {

        mostrarError(
            'Debes ingresar el código de la unidad.'
        );

        return;

    }


    const unidad = {

        idUnidad,

        codigoUnidad:
            codigo,

        placa:
            placa || null,

        activo:
            activoValor === 'true',

        descripcion:
            descripcion || null

    };


    const modoOperacion =
        STATE.modoUnidad;


    try {

        let respuesta;


        if (
            modoOperacion === 'crear'
        ) {

            respuesta =
                await fetch(
                    CONFIG.unidadesUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body:
                            JSON.stringify(unidad)
                    }
                );

        } else {

            respuesta =
                await fetch(
                    `${CONFIG.unidadesUrl}/${idUnidad}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body:
                            JSON.stringify(unidad)
                    }
                );

        }


        if (!respuesta.ok) {

            const mensaje =
                await obtenerMensajeError(
                    respuesta
                );

            throw new Error(mensaje);

        }


        let unidadGuardada =
            unidad;


        if (respuesta.status !== 204) {

            const texto =
                await respuesta.text();


            if (texto) {

                try {

                    unidadGuardada =
                        JSON.parse(texto);

                } catch {

                    unidadGuardada =
                        unidad;

                }

            }

        }


        cerrarModal(
            DOM.modalNuevaUnidad
        );


        formulario.reset();


        STATE.modoUnidad =
            'crear';


        STATE.unidadSeleccionada =
            null;


        STATE.abriendoEdicionUnidad =
            false;


        const idInput =
            document.getElementById(
                'idUnidad'
            );


        if (idInput) {

            idInput.value = '';

            idInput.readOnly = false;

        }


        cambiarTextoModalUnidad(
            'Nueva unidad'
        );


        cambiarBotonGuardarUnidad(
            'Guardar unidad'
        );


        await cargarUnidades();


        /*
         * Actualizamos mantenimientos localmente
         * con la nueva placa de la unidad.
         */

        enriquecerTodosLosMantenimientosConUnidades();

        aplicarFiltros();


        if (
            modoOperacion === 'editar'
        ) {

            mostrarExito(
                `Unidad ${
                    unidadGuardada.codigoUnidad ||
                    unidad.codigoUnidad
                } actualizada correctamente.`
            );

        } else {

            mostrarExito(
                `Unidad ${
                    unidadGuardada.codigoUnidad ||
                    unidad.codigoUnidad
                } guardada correctamente.`
            );

        }


    } catch (error) {

        console.error(
            'Error al guardar/actualizar unidad:',
            error
        );


        mostrarError(
            error.message ||
            'No fue posible guardar la unidad.'
        );

    }

}


/* ============================================================
   CAMBIAR TÍTULO MODAL UNIDAD
============================================================ */

function cambiarTextoModalUnidad(texto) {

    if (!DOM.modalNuevaUnidad) {

        return;

    }


    const titulo =
        DOM.modalNuevaUnidad.querySelector(
            '.modal-title'
        );


    if (titulo) {

        titulo.textContent =
            texto;

    }

}


/* ============================================================
   CAMBIAR BOTÓN GUARDAR UNIDAD
============================================================ */

function cambiarBotonGuardarUnidad(texto) {

    if (!DOM.formUnidad) {

        return;

    }


    const boton =
        DOM.formUnidad.querySelector(
            'button[type="submit"]'
        );


    if (!boton) {

        return;

    }


    const icono =
        boton.querySelector('i');


    if (icono) {

        boton.innerHTML = '';

        boton.appendChild(icono);

        boton.appendChild(
            document.createTextNode(
                ` ${texto}`
            )
        );

    } else {

        boton.textContent =
            texto;

    }

}


/* ============================================================
   ELIMINAR UNIDAD
============================================================ */

async function eliminarUnidad(id) {

    const unidad =
        STATE.unidades.find(
            item =>
                Number(item.idUnidad) === id
        );


    if (!unidad) {

        mostrarError(
            'No se encontró la unidad.'
        );

        return;

    }


    const nombre =
        unidad.codigoUnidad ||
        `Unidad ${id}`;


    const confirmar =
        window.confirm(
            `¿Deseas eliminar la unidad "${nombre}"?\n\n` +
            'Esta acción no se puede deshacer.'
        );


    if (!confirmar) {

        return;

    }


    try {

        const respuesta =
            await fetch(
                `${CONFIG.unidadesUrl}/${id}`,
                {
                    method: 'DELETE'
                }
            );


        if (!respuesta.ok) {

            const mensaje =
                await obtenerMensajeError(
                    respuesta
                );

            throw new Error(mensaje);

        }


        await cargarUnidades();

        await cargarMantenimientos();

        actualizarContadores();


        mostrarExito(
            `Unidad ${nombre} eliminada correctamente.`
        );


    } catch (error) {

        console.error(
            'Error al eliminar unidad:',
            error
        );


        mostrarError(
            error.message ||
            'No fue posible eliminar la unidad.'
        );

    }

}


/* ============================================================
   CONTADOR UNIDADES
============================================================ */

function actualizarContadorUnidades() {

    if (!DOM.unitsTotalCount) {

        return;

    }


    const total =
        STATE.unidades.length;


    DOM.unitsTotalCount.textContent =
        `${total} ${
            total === 1
                ? 'unidad'
                : 'unidades'
        }`;

}


/* ============================================================
   SELECTS UNIDADES
============================================================ */

function llenarSelectUnidades() {

    const selects = [

        DOM.filtroUnidad,

        DOM.unidadMantenimiento,

        DOM.editarUnidad

    ];


    selects.forEach(select => {

        if (!select) {

            return;

        }


        const valorActual =
            select.value;


        const primeraOpcion =
            select.options.length > 0
                ? select.options[0]
                : null;


        select.innerHTML = '';


        if (primeraOpcion) {

            select.appendChild(
                primeraOpcion
            );

        }


        const unidadesParaSelect =
            select === DOM.unidadMantenimiento
                ? STATE.unidades.filter(
                    unidad =>
                        unidadEstaActiva(unidad)
                )
                : STATE.unidades;


        unidadesParaSelect.forEach(unidad => {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                unidad.idUnidad;


            option.textContent =
                obtenerNombreUnidad(unidad);


            select.appendChild(option);

        });


        const existe =
            [...select.options].some(
                option =>
                    option.value ===
                    valorActual
            );


        if (existe) {

            select.value =
                valorActual;

        } else if (
            select === DOM.unidadMantenimiento
        ) {

            select.value = '';

        }

    });


    actualizarPlacaMantenimientoSeleccionada();

    actualizarPlacaMantenimientoEditado();

}


/* ============================================================
   ESTADO DE UNIDAD
============================================================ */

function unidadEstaActiva(unidad) {

    if (!unidad) {

        return false;

    }


    const valor =
        unidad.activo;


    if (

        valor === true ||

        valor === 1 ||

        valor === '1' ||

        valor === 'true' ||

        valor === 'TRUE' ||

        valor === 'True'

    ) {

        return true;

    }


    return false;

}


/* ============================================================
   NOMBRE UNIDAD
============================================================ */

function obtenerNombreUnidad(unidad) {

    if (!unidad) {

        return 'Sin unidad';

    }


    if (unidad.codigoUnidad) {

        return unidad.codigoUnidad;

    }


    if (

        unidad.idUnidad !== null &&

        unidad.idUnidad !== undefined

    ) {

        return `Unidad ${unidad.idUnidad}`;

    }


    return 'Sin unidad';

}


/* ============================================================
   OBTENER PLACA DE LA UNIDAD
============================================================ */

function obtenerPlacaUnidad(unidad) {

    if (!unidad) {

        return '—';

    }


    if (

        unidad.placa !== null &&

        unidad.placa !== undefined &&

        String(unidad.placa).trim() !== ''

    ) {

        return String(
            unidad.placa
        ).trim();

    }


    const idUnidad =
        unidad.idUnidad;


    if (

        idUnidad !== null &&

        idUnidad !== undefined

    ) {

        const unidadCompleta =
            STATE.unidades.find(
                item =>
                    Number(item.idUnidad) ===
                    Number(idUnidad)
            );


        if (

            unidadCompleta &&

            unidadCompleta.placa !== null &&

            unidadCompleta.placa !== undefined &&

            String(
                unidadCompleta.placa
            ).trim() !== ''

        ) {

            return String(
                unidadCompleta.placa
            ).trim();

        }

    }


    return '—';

}


/* ============================================================
   OBTENER UNIDAD COMPLETA
============================================================ */

function obtenerUnidadCompleta(unidad) {

    if (!unidad) {

        return null;

    }


    const idUnidad =
        unidad.idUnidad;


    const unidadRegistrada =
        STATE.unidades.find(
            item =>
                Number(item.idUnidad) ===
                Number(idUnidad)
        );


    if (!unidadRegistrada) {

        return {
            ...unidad
        };

    }


    return {

        ...unidadRegistrada,

        ...unidad,

        idUnidad:
            unidad.idUnidad ??
            unidadRegistrada.idUnidad,

        codigoUnidad:
            unidad.codigoUnidad ??
            unidadRegistrada.codigoUnidad,

        placa:
            unidad.placa !== undefined &&
            unidad.placa !== null &&
            String(unidad.placa).trim() !== ''
                ? unidad.placa
                : unidadRegistrada.placa,

        activo:
            unidad.activo !== undefined
                ? unidad.activo
                : unidadRegistrada.activo,

        descripcion:
            unidad.descripcion ??
            unidadRegistrada.descripcion

    };

}


/* ============================================================
   ENRIQUECER MANTENIMIENTO CON UNIDAD
============================================================ */

function enriquecerMantenimientoConUnidad(
    mantenimiento
) {

    if (!mantenimiento) {

        return mantenimiento;

    }


    return {

        ...mantenimiento,

        unidad:
            obtenerUnidadCompleta(
                mantenimiento.unidad
            )

    };

}


/* ============================================================
   ENRIQUECER TODOS LOS MANTENIMIENTOS
============================================================ */

function enriquecerTodosLosMantenimientosConUnidades() {

    if (
        !Array.isArray(
            STATE.mantenimientos
        )
    ) {

        return;

    }


    STATE.mantenimientos =
        STATE.mantenimientos.map(
            enriquecerMantenimientoConUnidad
        );


    if (
        Array.isArray(
            STATE.mantenimientosFiltrados
        )
    ) {

        STATE.mantenimientosFiltrados =
            STATE.mantenimientosFiltrados.map(
                enriquecerMantenimientoConUnidad
            );

    }

}


/* ============================================================
   OBTENER ELEMENTO POR VARIOS IDS
============================================================ */

function obtenerElementoPorIds(ids) {

    for (const id of ids) {

        const elemento =
            document.getElementById(id);


        if (elemento) {

            return elemento;

        }

    }


    return null;

}


/* ============================================================
   ESTABLECER VALOR DE PLACA EN ELEMENTO
============================================================ */

function establecerValorPlacaElemento(
    elemento,
    placa
) {

    if (!elemento) {

        return;

    }


    const valor =
        placa && placa !== '—'
            ? placa
            : '';


    const tag =
        elemento.tagName?.toLowerCase();


    if (

        tag === 'input' ||

        tag === 'textarea' ||

        tag === 'select'

    ) {

        elemento.value =
            valor;


        /*
         * La placa pertenece a la unidad.
         * No debe editarse directamente desde
         * el mantenimiento.
         */

        if (
            tag === 'input' ||
            tag === 'textarea'
        ) {

            elemento.readOnly = true;

        }


    } else {

        elemento.textContent =
            placa || '—';

    }

}


/* ============================================================
   OBTENER UNIDAD POR SELECT
============================================================ */

function obtenerUnidadPorSelect(select) {

    if (!select) {

        return null;

    }


    const id =
        Number(select.value);


    if (!id) {

        return null;

    }


    return STATE.unidades.find(
        unidad =>
            Number(unidad.idUnidad) === id
    ) || null;

}


/* ============================================================
   ACTUALIZAR PLACA NUEVO MANTENIMIENTO
============================================================ */

function actualizarPlacaMantenimientoSeleccionada() {

    const unidad =
        obtenerUnidadPorSelect(
            DOM.unidadMantenimiento
        );


    const placa =
        obtenerPlacaUnidad(unidad);


    const elemento =
        obtenerElementoPorIds([

            'placaMantenimiento',

            'placaUnidadMantenimiento',

            'mantenimientoPlaca',

            'placaSeleccionadaMantenimiento'

        ]);


    establecerValorPlacaElemento(
        elemento,
        placa
    );

}


/* ============================================================
   ACTUALIZAR PLACA EDICIÓN MANTENIMIENTO
============================================================ */

function actualizarPlacaMantenimientoEditado() {

    const unidad =
        obtenerUnidadPorSelect(
            DOM.editarUnidad
        );


    const placa =
        obtenerPlacaUnidad(unidad);


    const elemento =
        obtenerElementoPorIds([

            'editarPlaca',

            'editarPlacaMantenimiento',

            'placaEditarMantenimiento'

        ]);


    establecerValorPlacaElemento(
        elemento,
        placa
    );

}


/* ============================================================
   CAMBIO DE UNIDAD - NUEVO MANTENIMIENTO
============================================================ */

function manejarCambioUnidadMantenimiento() {

    actualizarPlacaMantenimientoSeleccionada();

}


/* ============================================================
   CAMBIO DE UNIDAD - EDITAR MANTENIMIENTO
============================================================ */

function manejarCambioUnidadEditar() {

    actualizarPlacaMantenimientoEditado();

}


/* ============================================================
   MANTENIMIENTOS - CARGAR
============================================================ */

async function cargarMantenimientos() {

    mostrarCargandoTabla();


    try {

        const respuesta =
            await fetch(
                CONFIG.mantenimientosUrl
            );


        if (!respuesta.ok) {

            const mensaje =
                await obtenerMensajeError(
                    respuesta
                );

            throw new Error(mensaje);

        }


        const datos =
            await respuesta.json();


        STATE.mantenimientos =
            Array.isArray(datos)
                ? datos.map(
                    enriquecerMantenimientoConUnidad
                )
                : [];


        STATE.mantenimientos.sort(
            compararMantenimientosPorFecha
        );


        STATE.paginaActual = 1;


        aplicarFiltros();


        actualizarContadores();


    } catch (error) {

        console.error(
            'Error al cargar mantenimientos:',
            error
        );


        STATE.mantenimientos = [];

        STATE.mantenimientosFiltrados = [];

        STATE.paginaActual = 1;


        renderizarTabla();


        mostrarError(
            error.message ||
            'No fue posible cargar los mantenimientos.'
        );

    }

}


/* ============================================================
   COMPARAR MANTENIMIENTOS POR FECHA
============================================================ */

function compararMantenimientosPorFecha(a, b) {

    const fechaA =
        obtenerTimestampFecha(
            a?.fechaMantenimiento
        );


    const fechaB =
        obtenerTimestampFecha(
            b?.fechaMantenimiento
        );


    if (fechaA !== fechaB) {

        return fechaB - fechaA;

    }


    const idA =
        Number(
            a?.idMantenimiento
        ) || 0;


    const idB =
        Number(
            b?.idMantenimiento
        ) || 0;


    return idB - idA;

}


/* ============================================================
   OBTENER TIMESTAMP DE FECHA
============================================================ */

function obtenerTimestampFecha(fecha) {

    if (!fecha) {

        return 0;

    }


    const texto =
        String(fecha);


    const coincidencia =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );


    if (coincidencia) {

        const anio =
            Number(coincidencia[1]);


        const mes =
            Number(coincidencia[2]);


        const dia =
            Number(coincidencia[3]);


        return Date.UTC(
            anio,
            mes - 1,
            dia
        );

    }


    const timestamp =
        Date.parse(texto);


    if (!Number.isNaN(timestamp)) {

        return timestamp;

    }


    return 0;

}


/* ============================================================
   TABLA MANTENIMIENTOS
============================================================ */

function renderizarTabla() {

    if (!DOM.tablaMantenimientos) {

        return;

    }


    DOM.tablaMantenimientos.innerHTML = '';


    const totalRegistros =
        STATE.mantenimientosFiltrados.length;


    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                totalRegistros /
                CONFIG.registrosPorPagina
            )
        );


    if (
        STATE.paginaActual < 1
    ) {

        STATE.paginaActual = 1;

    }


    if (
        STATE.paginaActual > totalPaginas
    ) {

        STATE.paginaActual =
            totalPaginas;

    }


    if (totalRegistros === 0) {

        DOM.tablaMantenimientos.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="text-center py-5 text-muted"
                >

                    <i
                        class="bi bi-clipboard-x fs-2
                        d-block mb-2 text-secondary"
                    ></i>

                    <p
                        class="mb-1 fw-semibold text-dark"
                    >
                        No hay mantenimientos registrados
                    </p>

                    <small class="text-muted">
                        No se encontraron registros
                        con los filtros seleccionados.
                    </small>

                </td>

            </tr>

        `;


        actualizarInformacionTabla();

        renderizarPaginacion();

        return;

    }


    const inicio =
        (
            STATE.paginaActual - 1
        ) *
        CONFIG.registrosPorPagina;


    const fin =
        inicio +
        CONFIG.registrosPorPagina;


    const registrosPagina =
        STATE.mantenimientosFiltrados.slice(
            inicio,
            fin
        );


    registrosPagina.forEach(
        mantenimiento => {

            const fila =
                crearFilaMantenimiento(
                    mantenimiento
                );


            DOM.tablaMantenimientos.appendChild(
                fila
            );

        }
    );


    actualizarInformacionTabla();

    renderizarPaginacion();

}


/* ============================================================
   CREAR FILA MANTENIMIENTO
============================================================ */

function crearFilaMantenimiento(
    mantenimiento
) {

    const fila =
        document.createElement('tr');


    const id =
        mantenimiento.idMantenimiento;


    const numero =
        formatearNumeroMantenimiento(id);


    const unidad =
        obtenerUnidadCompleta(
            mantenimiento.unidad
        );


    const nombreUnidad =
        obtenerNombreUnidad(unidad);


    const placa =
        obtenerPlacaUnidad(unidad);


    const medicion =
        formatearMedicion(
            mantenimiento
        );


    const tipo =
        mantenimiento.tipo || '—';


    const tipoTexto =
        formatearTipo(tipo);


    const fecha =
        formatearFecha(
            mantenimiento.fechaMantenimiento
        );


    fila.innerHTML = `

        <td>

            <strong>
                ${escaparHtml(numero)}
            </strong>

        </td>

        <td>
            ${escaparHtml(fecha)}
        </td>

        <td>
            ${escaparHtml(medicion)}
        </td>

        <td>

            <span class="fw-semibold">

                <i
                    class="bi bi-truck me-1"
                    aria-hidden="true"
                ></i>

                ${escaparHtml(nombreUnidad)}

            </span>

        </td>

        <td>

            <span class="fw-semibold">

                ${escaparHtml(placa)}

            </span>

        </td>

        <td>

            <span
                class="type-badge
                ${obtenerClaseTipo(tipo)}"
            >

                ${escaparHtml(tipoTexto)}

            </span>

        </td>

        <td>

            <span
                title="${escaparHtml(
                    mantenimiento.descripcion || ''
                )}"
            >

                ${escaparHtml(
                    resumirTexto(
                        mantenimiento.descripcion,
                        70
                    )
                )}

            </span>

        </td>

        <td class="text-end">

            <div
                class="btn-group"
                role="group"
            >

                <button
                    type="button"
                    class="btn btn-sm btn-light"
                    data-action="ver"
                    data-id="${id}"
                    title="Ver"
                >

                    <i class="bi bi-eye"></i>

                </button>

                <button
                    type="button"
                    class="btn btn-sm btn-light"
                    data-action="editar"
                    data-id="${id}"
                    title="Editar"
                >

                    <i class="bi bi-pencil"></i>

                </button>

                <button
                    type="button"
                    class="btn btn-sm btn-light text-danger"
                    data-action="eliminar"
                    data-id="${id}"
                    title="Eliminar"
                >

                    <i class="bi bi-trash"></i>

                </button>

            </div>

        </td>

    `;


    return fila;

}


/* ============================================================
   ACCIONES TABLA MANTENIMIENTOS
============================================================ */

async function manejarAccionesTabla(event) {

    const boton =
        event.target.closest(
            '[data-action]'
        );


    if (!boton) {

        return;

    }


    const id =
        Number(
            boton.dataset.id
        );


    if (!id) {

        return;

    }


    const accion =
        boton.dataset.action;


    switch (accion) {

        case 'ver':

            await abrirDetalle(id);

            break;


        case 'editar':

            await abrirEditar(id);

            break;


        case 'eliminar':

            abrirEliminar(id);

            break;

    }

}


/* ============================================================
   VER MANTENIMIENTO
============================================================ */

async function abrirDetalle(id) {

    try {

        const mantenimiento =
            await obtenerMantenimiento(id);


        const unidad =
            obtenerUnidadCompleta(
                mantenimiento.unidad
            );


        const elementoId =
            document.getElementById(
                'verDetalleId'
            );


        if (elementoId) {

            elementoId.textContent =
                formatearNumeroMantenimiento(
                    mantenimiento.idMantenimiento
                );

        }


        const elementoFecha =
            document.getElementById(
                'verDetalleFecha'
            );


        if (elementoFecha) {

            elementoFecha.textContent =
                formatearFecha(
                    mantenimiento.fechaMantenimiento
                );

        }


        const elementoUnidad =
            document.getElementById(
                'verDetalleUnidad'
            );


        if (elementoUnidad) {

            elementoUnidad.textContent =
                obtenerNombreUnidad(
                    unidad
                );

        }


        const elementoPlaca =
            obtenerElementoPorIds([

                'verDetallePlaca'

            ]);


        if (elementoPlaca) {

            establecerValorPlacaElemento(
                elementoPlaca,
                obtenerPlacaUnidad(unidad)
            );

        }


        const elementoMedicion =
            document.getElementById(
                'verDetalleMedicion'
            );


        if (elementoMedicion) {

            elementoMedicion.textContent =
                formatearMedicion(
                    mantenimiento
                );

        }


        const tipoElemento =
            document.getElementById(
                'verDetalleTipo'
            );


        if (tipoElemento) {

            tipoElemento.textContent =
                formatearTipo(
                    mantenimiento.tipo
                );


            tipoElemento.className =
                `type-badge ${
                    obtenerClaseTipo(
                        mantenimiento.tipo
                    )
                }`;

        }


        const descripcionElemento =
            document.getElementById(
                'verDetalleDescripcion'
            );


        if (descripcionElemento) {

            descripcionElemento.textContent =
                mantenimiento.descripcion ||
                '—';

        }


        abrirModal(
            DOM.modalVer
        );


    } catch (error) {

        console.error(error);


        mostrarError(
            error.message ||
            'No fue posible cargar el detalle.'
        );

    }

}


/* ============================================================
   NUEVO MANTENIMIENTO
============================================================ */

async function manejarFormularioNuevo(event) {

    event.preventDefault();


    const formulario =
        event.currentTarget;


    if (!formulario.checkValidity()) {

        formulario.reportValidity();

        return;

    }


    const datos =
        construirDatosFormularioNuevo(
            formulario
        );


    if (!datos.unidad) {

        mostrarError(
            'Debes seleccionar una unidad.'
        );

        return;

    }


    const unidadSeleccionada =
        STATE.unidades.find(
            unidad =>
                Number(unidad.idUnidad) ===
                Number(datos.unidad.idUnidad)
        );


    if (

        !unidadSeleccionada ||

        !unidadEstaActiva(
            unidadSeleccionada
        )

    ) {

        mostrarError(
            'La unidad seleccionada está inactiva. Selecciona una unidad activa.'
        );


        llenarSelectUnidades();

        return;

    }


    try {

        const respuesta =
            await fetch(
                CONFIG.mantenimientosUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body:
                        JSON.stringify(datos)
                }
            );


        if (!respuesta.ok) {

            const mensaje =
                await obtenerMensajeError(
                    respuesta
                );

            throw new Error(mensaje);

        }


        let nuevo = null;


        if (respuesta.status !== 204) {

            const texto =
                await respuesta.text();


            if (texto) {

                try {

                    nuevo =
                        JSON.parse(texto);

                } catch {

                    nuevo = null;

                }

            }

        }


        cerrarModal(
            DOM.modalNuevo
        );


        formulario.reset();


        actualizarPlacaMantenimientoSeleccionada();


        await cargarMantenimientos();


        actualizarContadores();


        mostrarExito(
            nuevo?.idMantenimiento
                ? `Mantenimiento ${
                    formatearNumeroMantenimiento(
                        nuevo.idMantenimiento
                    )
                } guardado correctamente.`
                : 'Mantenimiento guardado correctamente.'
        );


    } catch (error) {

        console.error(
            'Error al crear mantenimiento:',
            error
        );


        mostrarError(
            error.message ||
            'No fue posible guardar el mantenimiento.'
        );

    }

}


/* ============================================================
   CONSTRUIR MANTENIMIENTO
============================================================ */

function construirDatosFormularioNuevo(
    formulario
) {

    const unidadId =
        Number(
            document.getElementById(
                'unidadMantenimiento'
            )?.value
        );


    const medicionValorTexto =
        document.getElementById(
            'medicionValor'
        )?.value;


    return {

        fechaMantenimiento:
            document.getElementById(
                'fechaMantenimiento'
            )?.value || null,


        medicionValor:
            medicionValorTexto === ''
                ? null
                : Number(
                    medicionValorTexto
                ),


        medicionTipo:
            document.getElementById(
                'medicionTipo'
            )?.value || null,


        unidad:
            unidadId
                ? {
                    idUnidad:
                        unidadId
                }
                : null,


        tipo:
            document.getElementById(
                'tipoMantenimiento'
            )?.value || null,


        descripcion:
            document.getElementById(
                'descripcionMantenimiento'
            )?.value.trim() || null

    };

}


/* ============================================================
   EDITAR MANTENIMIENTO
============================================================ */

async function abrirEditar(id) {

    try {

        const mantenimiento =
            await obtenerMantenimiento(id);


        STATE.mantenimientoSeleccionado =
            id;


        const editarId =
            document.getElementById(
                'editarId'
            );


        if (editarId) {

            editarId.value =
                id;

        }


        const badge =
            document.getElementById(
                'editarRegistroIdBadge'
            );


        if (badge) {

            badge.textContent =
                formatearNumeroMantenimiento(id);

        }


        const fecha =
            document.getElementById(
                'editarFecha'
            );


        if (fecha) {

            fecha.value =
                mantenimiento.fechaMantenimiento ||
                '';

        }


        const medicion =
            document.getElementById(
                'editarMedicion'
            );


        if (medicion) {

            medicion.value =
                mantenimiento.medicionValor ??
                '';

        }


        const medicionTipo =
            document.getElementById(
                'editarMedicionTipo'
            );


        if (medicionTipo) {

            medicionTipo.value =
                mantenimiento.medicionTipo ||
                'KM';

        }


        const tipo =
            document.getElementById(
                'editarTipo'
            );


        if (tipo) {

            tipo.value =
                mantenimiento.tipo ||
                '';

        }


        const descripcion =
            document.getElementById(
                'editarDescripcion'
            );


        if (descripcion) {

            descripcion.value =
                mantenimiento.descripcion ||
                '';

        }


        const unidad =
            document.getElementById(
                'editarUnidad'
            );


        if (unidad) {

            unidad.value =
                mantenimiento.unidad?.idUnidad ||
                '';

        }


        actualizarPlacaMantenimientoEditado();


        abrirModal(
            DOM.modalEditar
        );


    } catch (error) {

        console.error(error);


        mostrarError(
            error.message ||
            'No fue posible cargar el mantenimiento.'
        );

    }

}


/* ============================================================
   GUARDAR EDICIÓN MANTENIMIENTO
============================================================ */

async function manejarFormularioEditar(event) {

    event.preventDefault();


    const formulario =
        event.currentTarget;


    if (!formulario.checkValidity()) {

        formulario.reportValidity();

        return;

    }


    const id =
        Number(
            document.getElementById(
                'editarId'
            )?.value
        );


    if (!id) {

        mostrarError(
            'No se encontró el mantenimiento a editar.'
        );

        return;

    }


    const unidadId =
        Number(
            document.getElementById(
                'editarUnidad'
            )?.value
        );


    if (!unidadId) {

        mostrarError(
            'Debes seleccionar una unidad.'
        );

        return;

    }


    const unidadSeleccionada =
        STATE.unidades.find(
            unidad =>
                Number(unidad.idUnidad) ===
                unidadId
        );


    if (!unidadSeleccionada) {

        mostrarError(
            'No se encontró la unidad seleccionada.'
        );

        return;

    }


    const medicionValorTexto =
        document.getElementById(
            'editarMedicion'
        )?.value;


    const datos = {

        fechaMantenimiento:
            document.getElementById(
                'editarFecha'
            )?.value || null,


        medicionValor:
            medicionValorTexto === ''
                ? null
                : Number(
                    medicionValorTexto
                ),


        medicionTipo:
            document.getElementById(
                'editarMedicionTipo'
            )?.value || null,


        unidad: {

            idUnidad:
                unidadId

        },


        tipo:
            document.getElementById(
                'editarTipo'
            )?.value || null,


        descripcion:
            document.getElementById(
                'editarDescripcion'
            )?.value.trim() || null

    };


    try {

        const respuesta =
            await fetch(
                `${CONFIG.mantenimientosUrl}/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body:
                        JSON.stringify(datos)
                }
            );


        if (!respuesta.ok) {

            const mensaje =
                await obtenerMensajeError(
                    respuesta
                );

            throw new Error(mensaje);

        }


        cerrarModal(
            DOM.modalEditar
        );


        await cargarMantenimientos();


        actualizarContadores();


        mostrarExito(
            `Mantenimiento ${
                formatearNumeroMantenimiento(id)
            } actualizado correctamente.`
        );


    } catch (error) {

        console.error(
            'Error al editar mantenimiento:',
            error
        );


        mostrarError(
            error.message ||
            'No fue posible actualizar el mantenimiento.'
        );

    }

}


/* ============================================================
   ELIMINAR MANTENIMIENTO
============================================================ */

function abrirEliminar(id) {

    const mantenimiento =
        STATE.mantenimientos.find(
            item =>
                Number(
                    item.idMantenimiento
                ) === id
        );


    if (!mantenimiento) {

        return;

    }


    STATE.mantenimientoSeleccionado =
        id;


    const badge =
        document.getElementById(
            'eliminarBadge'
        );


    if (badge) {

        badge.textContent =
            `Mantenimiento ${
                formatearNumeroMantenimiento(id)
            }`;

    }


    const unidad =
        obtenerUnidadCompleta(
            mantenimiento.unidad
        );


    const unidadDetalle =
        document.getElementById(
            'eliminarUnidadDetalle'
        );


    if (unidadDetalle) {

        unidadDetalle.textContent =
            obtenerNombreUnidad(unidad);

    }


    const placaDetalle =
        obtenerElementoPorIds([

            'eliminarPlacaDetalle'

        ]);


    if (placaDetalle) {

        establecerValorPlacaElemento(
            placaDetalle,
            obtenerPlacaUnidad(unidad)
        );

    }


    abrirModal(
        DOM.modalEliminar
    );

}


/* ============================================================
   CONFIRMAR ELIMINACIÓN MANTENIMIENTO
============================================================ */

async function confirmarEliminar() {

    const id =
        STATE.mantenimientoSeleccionado;


    if (!id) {

        return;

    }


    try {

        const respuesta =
            await fetch(
                `${CONFIG.mantenimientosUrl}/${id}`,
                {
                    method: 'DELETE'
                }
            );


        if (!respuesta.ok) {

            const mensaje =
                await obtenerMensajeError(
                    respuesta
                );

            throw new Error(mensaje);

        }


        cerrarModal(
            DOM.modalEliminar
        );


        STATE.mantenimientoSeleccionado =
            null;


        await cargarMantenimientos();


        actualizarContadores();


        mostrarToast(
            'deleteToast'
        );


    } catch (error) {

        console.error(
            'Error al eliminar mantenimiento:',
            error
        );


        mostrarError(
            error.message ||
            'No fue posible eliminar el mantenimiento.'
        );

    }

}


/* ============================================================
   OBTENER MANTENIMIENTO
============================================================ */

async function obtenerMantenimiento(id) {

    const respuesta =
        await fetch(
            `${CONFIG.mantenimientosUrl}/${id}`
        );


    if (!respuesta.ok) {

        const mensaje =
            await obtenerMensajeError(
                respuesta
            );


        throw new Error(
            mensaje ||
            `No se encontró el mantenimiento ${id}.`
        );

    }


    const datos =
        await respuesta.json();


    return enriquecerMantenimientoConUnidad(
        datos
    );

}


/* ============================================================
   FILTROS
============================================================ */

function aplicarFiltros() {

    const unidad =
        DOM.filtroUnidad?.value || '';


    const tipo =
        DOM.filtroTipo?.value || '';


    const medicionTipo =
        DOM.filtroMedicionTipo?.value || '';


    const desde =
        DOM.filtroDesde?.value || '';


    const hasta =
        DOM.filtroHasta?.value || '';


    const buscar =
        (
            DOM.filtroBuscar?.value ||
            ''
        )
            .trim()
            .toLowerCase();


    STATE.mantenimientosFiltrados =
        STATE.mantenimientos.filter(
            mantenimiento => {

                if (

                    unidad &&

                    String(
                        mantenimiento.unidad?.idUnidad
                    ) !== unidad

                ) {

                    return false;

                }


                if (

                    tipo &&

                    mantenimiento.tipo !== tipo

                ) {

                    return false;

                }


                if (

                    medicionTipo &&

                    mantenimiento.medicionTipo !==
                        medicionTipo

                ) {

                    return false;

                }


                if (

                    desde &&

                    mantenimiento.fechaMantenimiento <
                        desde

                ) {

                    return false;

                }


                if (

                    hasta &&

                    mantenimiento.fechaMantenimiento >
                        hasta

                ) {

                    return false;

                }


                if (buscar) {

                    const unidadTexto =
                        obtenerNombreUnidad(
                            mantenimiento.unidad
                        )
                            .toLowerCase();


                    const codigoUnidad =
                        (
                            mantenimiento.unidad
                                ?.codigoUnidad ||
                            ''
                        )
                            .toLowerCase();


                    const placa =
                        obtenerPlacaUnidad(
                            mantenimiento.unidad
                        )
                            .toLowerCase();


                    const descripcion =
                        (
                            mantenimiento.descripcion ||
                            ''
                        )
                            .toLowerCase();


                    const tipoMantenimiento =
                        formatearTipo(
                            mantenimiento.tipo
                        )
                            .toLowerCase();


                    const id =
                        String(
                            mantenimiento.idMantenimiento
                        );


                    const numero =
                        formatearNumeroMantenimiento(
                            mantenimiento.idMantenimiento
                        )
                            .toLowerCase();


                    const coincide =

                        unidadTexto.includes(
                            buscar
                        ) ||

                        codigoUnidad.includes(
                            buscar
                        ) ||

                        placa.includes(
                            buscar
                        ) ||

                        descripcion.includes(
                            buscar
                        ) ||

                        tipoMantenimiento.includes(
                            buscar
                        ) ||

                        id.includes(
                            buscar
                        ) ||

                        numero.includes(
                            buscar
                        );


                    if (!coincide) {

                        return false;

                    }

                }


                return true;

            }
        );


    STATE.mantenimientosFiltrados.sort(
        compararMantenimientosPorFecha
    );


    STATE.paginaActual =
        1;


    renderizarTabla();

}


/* ============================================================
   LIMPIAR FILTROS
============================================================ */

function limpiarFiltros() {

    if (DOM.filtroUnidad) {

        DOM.filtroUnidad.value = '';

    }


    if (DOM.filtroTipo) {

        DOM.filtroTipo.value = '';

    }


    if (DOM.filtroMedicionTipo) {

        DOM.filtroMedicionTipo.value = '';

    }


    if (DOM.filtroDesde) {

        DOM.filtroDesde.value = '';

    }


    if (DOM.filtroHasta) {

        DOM.filtroHasta.value = '';

    }


    if (DOM.filtroBuscar) {

        DOM.filtroBuscar.value = '';

    }


    aplicarFiltros();

}


/* ============================================================
   CONTADORES
============================================================ */

function actualizarContadores() {

    const registros =
        STATE.mantenimientos;


    if (DOM.totalMantenimientos) {

        DOM.totalMantenimientos.textContent =
            registros.length;

    }


    if (DOM.totalPreventivos) {

        DOM.totalPreventivos.textContent =
            registros.filter(
                item =>
                    item.tipo === 'PREVENTIVO'
            ).length;

    }


    if (DOM.totalCorrectivos) {

        DOM.totalCorrectivos.textContent =
            registros.filter(
                item =>
                    item.tipo === 'CORRECTIVO'
            ).length;

    }


    if (DOM.totalUnidadesAtendidas) {

        const unidades =
            new Set(
                registros
                    .map(
                        item =>
                            item.unidad?.idUnidad
                    )
                    .filter(
                        id =>
                            id !== null &&
                            id !== undefined
                    )
            );


        DOM.totalUnidadesAtendidas.textContent =
            unidades.size;

    }

}


/* ============================================================
   PAGINACIÓN
============================================================ */

function renderizarPaginacion() {

    if (!DOM.paginationNav) {

        return;

    }


    DOM.paginationNav.innerHTML = '';


    const totalRegistros =
        STATE.mantenimientosFiltrados.length;


    const totalPaginas =
        Math.ceil(
            totalRegistros /
            CONFIG.registrosPorPagina
        );


    if (totalPaginas <= 1) {

        return;

    }


    const anterior =
        crearBotonPaginacion(

            '<i class="bi bi-chevron-left"></i>',

            STATE.paginaActual > 1,

            () => {

                if (
                    STATE.paginaActual > 1
                ) {

                    STATE.paginaActual--;

                    renderizarTabla();

                }

            }

        );


    DOM.paginationNav.appendChild(
        anterior
    );


    const paginas =
        obtenerPaginasPaginacion(
            totalPaginas,
            STATE.paginaActual
        );


    paginas.forEach(elemento => {

        if (elemento === '...') {

            DOM.paginationNav.appendChild(
                crearEllipsisPaginacion()
            );

            return;

        }


        const item =
            document.createElement('li');


        item.className =
            `page-item ${
                elemento ===
                STATE.paginaActual
                    ? 'active'
                    : ''
            }`;


        const boton =
            document.createElement(
                'button'
            );


        boton.type =
            'button';


        boton.className =
            'page-link';


        boton.textContent =
            elemento;


        if (
            elemento ===
            STATE.paginaActual
        ) {

            boton.setAttribute(
                'aria-current',
                'page'
            );

        }


        boton.addEventListener(
            'click',
            () => {

                STATE.paginaActual =
                    elemento;

                renderizarTabla();

            }
        );


        item.appendChild(
            boton
        );


        DOM.paginationNav.appendChild(
            item
        );

    });


    const siguiente =
        crearBotonPaginacion(

            '<i class="bi bi-chevron-right"></i>',

            STATE.paginaActual <
                totalPaginas,

            () => {

                if (
                    STATE.paginaActual <
                    totalPaginas
                ) {

                    STATE.paginaActual++;

                    renderizarTabla();

                }

            }

        );


    DOM.paginationNav.appendChild(
        siguiente
    );

}


/* ============================================================
   OBTENER PÁGINAS DE PAGINACIÓN
============================================================ */

function obtenerPaginasPaginacion(
    totalPaginas,
    paginaActual
) {

    if (totalPaginas <= 3) {

        return Array.from(
            {
                length: totalPaginas
            },
            (_, indice) =>
                indice + 1
        );

    }


    if (paginaActual <= 3) {

        return [
            1,
            2,
            3,
            '...',
            totalPaginas
        ];

    }


    if (
        paginaActual >=
        totalPaginas - 2
    ) {

        return [
            1,
            '...',
            totalPaginas - 2,
            totalPaginas - 1,
            totalPaginas
        ];

    }


    return [
        1,
        '...',
        paginaActual,
        '...',
        totalPaginas
    ];

}


/* ============================================================
   CREAR ELLIPSIS
============================================================ */

function crearEllipsisPaginacion() {

    const item =
        document.createElement('li');


    item.className =
        'page-item disabled';


    const span =
        document.createElement('span');


    span.className =
        'page-link';


    span.textContent =
        '...';


    span.setAttribute(
        'aria-hidden',
        'true'
    );


    item.appendChild(
        span
    );


    return item;

}


/* ============================================================
   BOTÓN PAGINACIÓN
============================================================ */

function crearBotonPaginacion(
    contenido,
    habilitado,
    callback
) {

    const item =
        document.createElement('li');


    item.className =
        `page-item ${
            habilitado
                ? ''
                : 'disabled'
        }`;


    const boton =
        document.createElement(
            'button'
        );


    boton.type =
        'button';


    boton.className =
        'page-link';


    boton.innerHTML =
        contenido;


    if (habilitado) {

        boton.addEventListener(
            'click',
            callback
        );

    } else {

        boton.setAttribute(
            'tabindex',
            '-1'
        );

        boton.setAttribute(
            'aria-disabled',
            'true'
        );

    }


    item.appendChild(
        boton
    );


    return item;

}


/* ============================================================
   INFORMACIÓN TABLA
============================================================ */

function actualizarInformacionTabla() {

    const total =
        STATE.mantenimientosFiltrados.length;


    if (DOM.tableCount) {

        DOM.tableCount.textContent =
            `${total} ${
                total === 1
                    ? 'registro'
                    : 'registros'
            }`;

    }


    if (DOM.paginationInfo) {

        if (total === 0) {

            DOM.paginationInfo.innerHTML =
                'Mostrando <strong>0</strong> registros';

            return;

        }


        const inicio =
            (
                (STATE.paginaActual - 1) *
                CONFIG.registrosPorPagina
            ) + 1;


        const fin =
            Math.min(
                STATE.paginaActual *
                    CONFIG.registrosPorPagina,
                total
            );


        DOM.paginationInfo.innerHTML =
            `Mostrando <strong>${inicio}</strong> -
             <strong>${fin}</strong> de
             <strong>${total}</strong> registros`;

    }

}


/* ============================================================
   EXPORTAR MANTENIMIENTOS A PDF
   VERSIÓN COMPLETA CORREGIDA
============================================================ */

async function exportarMantenimientos() {

    const registros =
        Array.isArray(STATE.mantenimientosFiltrados)
            ? STATE.mantenimientosFiltrados
            : [];

    if (registros.length === 0) {

        mostrarError(
            'No hay registros para exportar con los filtros seleccionados.'
        );

        return;
    }

    try {

        /* ========================================================
           CARGAR LIBRERÍAS
        ======================================================== */

        await cargarLibreriasPDF();

        if (
            typeof window.jspdf === 'undefined' ||
            typeof window.jspdf.jsPDF === 'undefined'
        ) {
            throw new Error(
                'No fue posible cargar la librería para generar el PDF.'
            );
        }

        if (
            typeof window.jspdf.jsPDF.API.autoTable !== 'function'
        ) {
            throw new Error(
                'No fue posible cargar el módulo de tablas PDF.'
            );
        }

        const { jsPDF } = window.jspdf;


        /* ========================================================
           CREAR DOCUMENTO
        ======================================================== */

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'letter',
            compress: true
        });


        /* ========================================================
           MÁRGENES
        ======================================================== */

        const margenIzquierdo = 12;
        const margenDerecho = 12;
        const margenSuperior = 18;
        const margenInferior = 18;

        const anchoPagina =
            doc.internal.pageSize.getWidth();

        const altoPagina =
            doc.internal.pageSize.getHeight();

        const anchoUtil =
            anchoPagina -
            margenIzquierdo -
            margenDerecho;


        /* ========================================================
           CARGAR LOGO
        ======================================================== */

        let logoBase64 = null;

        try {

            logoBase64 =
                await cargarImagenComoBase64(
                    CONFIG.logoPdfUrl
                );

        } catch (error) {

            console.warn(
                'No fue posible cargar el logo:',
                error
            );
        }


        /* ========================================================
           FECHA Y HORA
        ======================================================== */

        const fechaGeneracion = new Date();

        const fechaTexto =
            fechaGeneracion.toLocaleDateString(
                'es-HN',
                {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }
            );

        const horaTexto =
            fechaGeneracion.toLocaleTimeString(
                'es-HN',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );


        /* ========================================================
           ENCABEZADO PRINCIPAL
        ======================================================== */

        dibujarEncabezadoPDF({
            doc,
            logoBase64,
            anchoPagina,
            margenIzquierdo,
            margenDerecho
        });


        doc.setFont(
            'helvetica',
            'bold'
        );

        doc.setFontSize(18);

        doc.setTextColor(
            35,
            35,
            35
        );

        doc.text(
            'Bitácora de Mantenimientos',
            margenIzquierdo,
            48
        );


        doc.setFont(
            'helvetica',
            'normal'
        );

        doc.setFontSize(8.5);

        doc.setTextColor(
            95,
            95,
            95
        );

        doc.text(
            'Registro histórico de mantenimientos de unidades',
            margenIzquierdo,
            54
        );


        doc.text(
            `Generado: ${fechaTexto} ${horaTexto}`,
            anchoPagina - margenDerecho,
            54,
            {
                align: 'right'
            }
        );


        /* ========================================================
           RESUMEN DE FILTROS
        ======================================================== */

        const resumenFiltros =
            obtenerResumenFiltrosPDF();


        dibujarResumenFiltrosPDF({
            doc,
            resumenFiltros,
            cantidadRegistros: registros.length,
            x: margenIzquierdo,
            y: 61,
            ancho: anchoUtil
        });


        /* ========================================================
           AGRUPAR REGISTROS POR UNIDAD
        ======================================================== */

        const gruposPorUnidad = new Map();


        registros.forEach(
            mantenimiento => {

                const unidad =
                    obtenerUnidadCompleta(
                        mantenimiento.unidad
                    );


                const nombreUnidad =
                    obtenerNombreUnidad(
                        unidad
                    ) ||
                    'Unidad sin identificar';


                const placa =
                    obtenerPlacaUnidad(
                        unidad
                    ) ||
                    '—';


                const clave =
                    `${nombreUnidad}||${placa}`;


                if (
                    !gruposPorUnidad.has(clave)
                ) {

                    gruposPorUnidad.set(
                        clave,
                        {
                            nombre: nombreUnidad,
                            placa: placa,
                            registros: []
                        }
                    );
                }


                gruposPorUnidad
                    .get(clave)
                    .registros
                    .push(
                        mantenimiento
                    );
            }
        );


        const grupos =
            Array.from(
                gruposPorUnidad.values()
            );


        /* ========================================================
           CONFIGURACIÓN DE COLUMNAS

           CARTA LANDSCAPE:
           279.4 mm de ancho
           Márgenes: 12 + 12
           Ancho útil: 255.4 mm

           La suma de estas columnas es exactamente
           el ancho útil disponible.
        ======================================================== */

        const anchoID = 18;
        const anchoFecha = 25;
        const anchoMedicion = 30;
        const anchoUnidad = 38;
        const anchoPlaca = 24;


        const anchoTipoMantenimiento =
            anchoUtil -
            anchoID -
            anchoFecha -
            anchoMedicion -
            anchoUnidad -
            anchoPlaca;


        /* ========================================================
           POSICIÓN INICIAL
        ======================================================== */

        let posicionY = 78;


        /* ========================================================
           RECORRER UNIDADES
        ======================================================== */

        grupos.forEach(
            (
                grupo,
                indiceGrupo
            ) => {


                /* =================================================
                   ALTURAS
                ================================================= */

                const alturaTituloUnidad = 9;

                const alturaSeparacion = 3;

                const alturaEncabezadoTabla = 10;

                const espacioNecesarioMinimo =
                    alturaTituloUnidad +
                    alturaSeparacion +
                    alturaEncabezadoTabla +
                    12;


                /* =================================================
                   COMPROBAR ESPACIO
                ================================================= */

                if (
                    posicionY +
                    espacioNecesarioMinimo >
                    altoPagina -
                    margenInferior -
                    5
                ) {

                    doc.addPage();

                    posicionY = 20;
                }


                /* =================================================
                   FUNCIÓN PARA DIBUJAR TÍTULO DE UNIDAD
                ================================================= */

                const dibujarTituloUnidad =
                    () => {

                        doc.setFont(
                            'helvetica',
                            'bold'
                        );

                        doc.setFontSize(
                            10
                        );

                        doc.setTextColor(
                            45,
                            45,
                            45
                        );


                        doc.text(
                            `UNIDAD: ${grupo.nombre}`,
                            margenIzquierdo,
                            posicionY
                        );


                        doc.setFont(
                            'helvetica',
                            'normal'
                        );

                        doc.setFontSize(
                            8
                        );

                        doc.setTextColor(
                            90,
                            90,
                            90
                        );


                        doc.text(
                            `Placa: ${grupo.placa}`,
                            anchoPagina - margenDerecho,
                            posicionY,
                            {
                                align: 'right'
                            }
                        );


                        posicionY +=
                            alturaTituloUnidad;
                    };


                /* =================================================
                   DIBUJAR TÍTULO
                ================================================= */

                dibujarTituloUnidad();


                /* =================================================
                   CREAR FILAS
                ================================================= */

                const body = [];


                grupo.registros.forEach(
                    mantenimiento => {

                        const unidad =
                            obtenerUnidadCompleta(
                                mantenimiento.unidad
                            );


                        const placa =
                            obtenerPlacaUnidad(
                                unidad
                            ) ||
                            '—';


                        /* =========================================
                           MEDICIÓN
                        ========================================= */

                        const medicionValor =
                            mantenimiento.medicionValor === null ||
                            mantenimiento.medicionValor === undefined
                                ? '—'
                                : Number(
                                    mantenimiento.medicionValor
                                ).toLocaleString(
                                    'es-HN'
                                );


                        const medicionTipo =
                            mantenimiento.medicionTipo ||
                            '';


                        const medicion =
                            medicionTipo &&
                            medicionValor !== '—'
                                ? `${medicionValor} ${medicionTipo}`
                                : medicionValor;


                        /* =========================================
                           TIPO
                        ========================================= */

                        const tipoMantenimiento =
                            formatearTipo(
                                mantenimiento.tipo
                            ) ||
                            '—';


                        /* =========================================
                           DESCRIPCIÓN
                        ========================================= */

                        const descripcion =
                            String(
                                mantenimiento.descripcion ||
                                '—'
                            )
                                .trim();


                        /* =========================================
                           FILA PRINCIPAL
                        ========================================= */

                        body.push({

                            tipoFila:
                                'principal',

                            id:
                                formatearNumeroMantenimiento(
                                    mantenimiento.idMantenimiento
                                ),

                            fecha:
                                formatearFecha(
                                    mantenimiento.fechaMantenimiento
                                ),

                            medicion:
                                medicion,

                            unidad:
                                obtenerNombreUnidad(
                                    unidad
                                ) ||
                                '—',

                            placa:
                                placa,

                            tipoMantenimiento:
                                tipoMantenimiento
                        });


                        /* =========================================
                           FILA DESCRIPCIÓN
                        ========================================= */

                        body.push({

                            tipoFila:
                                'descripcion',

                            descripcion:
                                descripcion
                        });

                    }
                );


                /* =================================================
                   CONVERTIR A AUTOTABLE

                   La descripción ocupa DOS columnas para
                   que "Descripción:" tenga espacio suficiente.

                   Las otras CUATRO columnas se utilizan para
                   el texto de la descripción.
                ================================================= */

                const filasTabla = [];


                body.forEach(
                    fila => {

                        if (
                            fila.tipoFila ===
                            'principal'
                        ) {

                            filasTabla.push([
                                fila.id,
                                fila.fecha,
                                fila.medicion,
                                fila.unidad,
                                fila.placa,
                                fila.tipoMantenimiento
                            ]);

                            return;
                        }


                        filasTabla.push([

                            {
                                content:
                                    'Descripción:',

                                colSpan:
                                    2,

                                styles: {

                                    fontStyle:
                                        'bold',

                                    fontSize:
                                        7,

                                    halign:
                                        'left',

                                    valign:
                                        'top',

                                    fillColor:
                                        [248, 248, 248],

                                    cellPadding: {
                                        top: 3,
                                        right: 3,
                                        bottom: 3,
                                        left: 3
                                    }
                                }
                            },


                            {
                                content:
                                    fila.descripcion,

                                colSpan:
                                    4,

                                styles: {

                                    fontStyle:
                                        'normal',

                                    fontSize:
                                        7.5,

                                    halign:
                                        'left',

                                    valign:
                                        'top',

                                    overflow:
                                        'linebreak',

                                    fillColor:
                                        [248, 248, 248],

                                    cellPadding: {
                                        top: 3,
                                        right: 4,
                                        bottom: 3,
                                        left: 5
                                    }
                                }
                            }

                        ]);

                    }
                );


                /* =================================================
                   CREAR TABLA
                ================================================= */

                doc.autoTable({

                    startY:
                        posicionY + 2,


                    margin: {

                        left:
                            margenIzquierdo,

                        right:
                            margenDerecho,

                        top:
                            margenSuperior,

                        bottom:
                            margenInferior + 3
                    },


                    head: [

                        [
                            'ID',
                            'Fecha',
                            'Medición',
                            'Unidad',
                            'Placa',
                            'Tipo de mantenimiento'
                        ]

                    ],


                    body:
                        filasTabla,


                    /* =================================================
                       SIN GRID AUTOMÁTICO

                       Los bordes se dibujan manualmente una sola vez.
                       Esto evita las dobles líneas.
                    ================================================= */

                    theme:
                        'plain',


                    styles: {

                        font:
                            'helvetica',

                        fontStyle:
                            'normal',

                        fontSize:
                            7.5,

                        textColor:
                            [45, 45, 45],

                        valign:
                            'middle',

                        overflow:
                            'linebreak',

                        cellWidth:
                            'wrap',

                        lineWidth:
                            0,

                        cellPadding: {
                            top: 2.8,
                            right: 3,
                            bottom: 2.8,
                            left: 3
                        }
                    },


                    /* =================================================
                       ENCABEZADO
                    ================================================= */

                    headStyles: {

                        font:
                            'helvetica',

                        fontStyle:
                            'bold',

                        fontSize:
                            7.5,

                        textColor:
                            [255, 255, 255],

                        fillColor:
                            [45, 45, 45],

                        halign:
                            'center',

                        valign:
                            'middle',

                        cellPadding: {
                            top: 3,
                            right: 3,
                            bottom: 3,
                            left: 3
                        },

                        lineWidth:
                            0
                    },


                    /* =================================================
                       COLUMNAS
                    ================================================= */

                    columnStyles: {

                        0: {

                            cellWidth:
                                anchoID,

                            halign:
                                'center'
                        },

                        1: {

                            cellWidth:
                                anchoFecha,

                            halign:
                                'center'
                        },

                        2: {

                            cellWidth:
                                anchoMedicion,

                            halign:
                                'center'
                        },

                        3: {

                            cellWidth:
                                anchoUnidad,

                            halign:
                                'center'
                        },

                        4: {

                            cellWidth:
                                anchoPlaca,

                            halign:
                                'center'
                        },

                        5: {

                            cellWidth:
                                anchoTipoMantenimiento,

                            halign:
                                'left'
                        }
                    },


                    /* =================================================
                       FILAS ALTERNADAS
                    ================================================= */

                    alternateRowStyles: {

                        fillColor:
                            [249, 249, 249]
                    },


                    /* =================================================
                       EVITAR PARTIR FILAS
                    ================================================= */

                    rowPageBreak:
                        'avoid',


                    /* =================================================
                       REPETIR ENCABEZADO
                    ================================================= */

                    showHead:
                        'everyPage',


                    /* =================================================
                       PARSEAR CELDAS
                    ================================================= */

                    didParseCell:
                        function(data) {

                            if (
                                data.section !==
                                'body'
                            ) {
                                return;
                            }


                            const fila =
                                body[
                                    data.row.index
                                ];


                            if (!fila) {
                                return;
                            }


                            /* =====================================
                               FILA PRINCIPAL
                            ===================================== */

                            if (
                                fila.tipoFila ===
                                'principal'
                            ) {

                                data.cell.styles.fontSize =
                                    7.5;

                                data.cell.styles.valign =
                                    'middle';


                                if (
                                    data.column.index ===
                                    5
                                ) {

                                    data.cell.styles.halign =
                                        'left';

                                } else {

                                    data.cell.styles.halign =
                                        'center';
                                }


                                return;
                            }


                            /* =====================================
                               FILA DESCRIPCIÓN
                            ===================================== */

                            if (
                                fila.tipoFila ===
                                'descripcion'
                            ) {

                                data.cell.styles.fontSize =
                                    7.5;

                                data.cell.styles.valign =
                                    'top';

                                data.cell.styles.fillColor =
                                    [248, 248, 248];

                                data.cell.styles.minCellHeight =
                                    8;


                                /* =================================
                                   ETIQUETA DESCRIPCIÓN
                                ================================= */

                                if (
                                    data.column.index ===
                                    0
                                ) {

                                    data.cell.styles.fontSize =
                                        7;

                                    data.cell.styles.fontStyle =
                                        'bold';

                                    data.cell.styles.halign =
                                        'left';

                                    data.cell.styles.overflow =
                                        'visible';

                                    data.cell.styles.cellPadding = {

                                        top: 3,

                                        right: 3,

                                        bottom: 3,

                                        left: 3
                                    };
                                }


                                /* =================================
                                   TEXTO
                                ================================= */

                                if (
                                    data.column.index ===
                                    1
                                ) {

                                    data.cell.styles.fontStyle =
                                        'normal';

                                    data.cell.styles.halign =
                                        'left';

                                    data.cell.styles.overflow =
                                        'linebreak';

                                    data.cell.styles.cellPadding = {

                                        top: 3,

                                        right: 4,

                                        bottom: 3,

                                        left: 5
                                    };
                                }
                            }
                        },


                    /* =================================================
                       DIBUJAR BORDES

                       Un solo borde por cada celda.
                       No usamos theme:grid.
                    ================================================= */

                    didDrawCell:
                        function(data) {

                            if (
                                data.section !== 'body' &&
                                data.section !== 'head'
                            ) {
                                return;
                            }


                            const x =
                                data.cell.x;

                            const y =
                                data.cell.y;

                            const width =
                                data.cell.width;

                            const height =
                                data.cell.height;


                            /* =====================================
                               COLOR
                            ===================================== */

                            if (
                                data.section ===
                                'head'
                            ) {

                                doc.setDrawColor(
                                    45,
                                    45,
                                    45
                                );

                            } else {

                                doc.setDrawColor(
                                    205,
                                    205,
                                    205
                                );
                            }


                            doc.setLineWidth(
                                0.18
                            );


                            /* =====================================
                               IZQUIERDA
                            ===================================== */

                            doc.line(
                                x,
                                y,
                                x,
                                y + height
                            );


                            /* =====================================
                               ARRIBA
                            ===================================== */

                            doc.line(
                                x,
                                y,
                                x + width,
                                y
                            );


                            /* =====================================
                               DERECHA
                            ===================================== */

                            doc.line(
                                x + width,
                                y,
                                x + width,
                                y + height
                            );


                            /* =====================================
                               ABAJO
                            ===================================== */

                            doc.line(
                                x,
                                y + height,
                                x + width,
                                y + height
                            );
                        },


                    /* =================================================
                       DESPUÉS DE CADA PÁGINA

                       Aquí volvemos a colocar el pie.
                    ================================================= */

                    didDrawPage:
                        function(data) {

                            dibujarPiePaginaPDF(
                                doc,
                                anchoPagina,
                                altoPagina,
                                data.pageNumber
                            );
                        }

                });


                /* =================================================
                   ACTUALIZAR POSICIÓN
                ================================================= */

                posicionY =
                    doc.lastAutoTable.finalY +
                    8;


                /* =================================================
                   SEPARADOR ENTRE UNIDADES

                   Solamente si todavía queda espacio.
                ================================================= */

                if (
                    indiceGrupo <
                    grupos.length - 1
                ) {

                    if (
                        posicionY <
                        altoPagina -
                        margenInferior -
                        8
                    ) {

                        doc.setDrawColor(
                            220,
                            220,
                            220
                        );

                        doc.setLineWidth(
                            0.25
                        );

                        doc.line(
                            margenIzquierdo,
                            posicionY - 4,
                            anchoPagina - margenDerecho,
                            posicionY - 4
                        );
                    }
                }

            }
        );


        /* ========================================================
           PIE DE TODAS LAS PÁGINAS

           Se vuelve a dibujar al final para actualizar
           correctamente "Página X de Y".
        ======================================================== */

        const paginas =
            doc.getNumberOfPages();


        for (
            let pagina = 1;
            pagina <= paginas;
            pagina++
        ) {

            doc.setPage(
                pagina
            );


            dibujarPiePaginaPDF(
                doc,
                anchoPagina,
                altoPagina,
                pagina
            );
        }


        /* ========================================================
           GUARDAR PDF
        ======================================================== */

        const fechaArchivo =
            obtenerFechaParaArchivo(
                fechaGeneracion
            );


        const nombreArchivo =
            `Bitacora_de_Mantenimientos_${fechaArchivo}.pdf`;


        doc.save(
            nombreArchivo
        );


        mostrarExito(
            `PDF generado correctamente con ${
                registros.length
            } ${
                registros.length === 1
                    ? 'mantenimiento'
                    : 'mantenimientos'
            }.`
        );


    } catch (error) {

        console.error(
            'Error al generar PDF:',
            error
        );


        mostrarError(
            error.message ||
            'No fue posible generar el PDF.'
        );
    }
}


/* ============================================================
   CARGAR LIBRERÍAS PDF DINÁMICAMENTE
============================================================ */

async function cargarLibreriasPDF() {

    /* ========================================================
       YA CARGADAS
    ======================================================== */

    if (
        window.jspdf &&
        window.jspdf.jsPDF &&
        window.jspdf.jsPDF.API &&
        typeof window.jspdf.jsPDF.API.autoTable ===
            'function'
    ) {

        return;
    }


    /* ========================================================
       CARGAR JSDPDF
    ======================================================== */

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        await cargarScriptExterno(
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            'jspdf'
        );
    }


    /* ========================================================
       CARGAR AUTOTABLE
    ======================================================== */

    if (
        !window.jspdf?.jsPDF?.API ||
        typeof window.jspdf.jsPDF.API.autoTable !==
            'function'
    ) {

        await cargarScriptExterno(
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
            'jspdf-autotable'
        );
    }


    /* ========================================================
       VERIFICACIÓN
    ======================================================== */

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF ||
        !window.jspdf.jsPDF.API ||
        typeof window.jspdf.jsPDF.API.autoTable !==
            'function'
    ) {

        throw new Error(
            'Las librerías jsPDF y AutoTable no pudieron cargarse correctamente.'
        );
    }
}


/* ============================================================
   CARGAR SCRIPT EXTERNO
============================================================ */

function cargarScriptExterno(
    src,
    id
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            /* ================================================
               COMPROBAR SI YA EXISTE
            ================================================= */

            const existente =
                document.getElementById(
                    id
                );


            if (existente) {

                if (
                    id === 'jspdf' &&
                    window.jspdf &&
                    window.jspdf.jsPDF
                ) {

                    resolve();

                    return;
                }


                if (
                    id === 'jspdf-autotable' &&
                    window.jspdf?.jsPDF?.API &&
                    typeof window.jspdf.jsPDF.API
                        .autoTable ===
                        'function'
                ) {

                    resolve();

                    return;
                }


                existente.addEventListener(
                    'load',
                    () => resolve(),
                    {
                        once: true
                    }
                );


                existente.addEventListener(
                    'error',
                    () =>
                        reject(
                            new Error(
                                `No se pudo cargar la librería PDF: ${src}`
                            )
                        ),
                    {
                        once: true
                    }
                );


                return;
            }


            /* ================================================
               CREAR SCRIPT
            ================================================= */

            const script =
                document.createElement(
                    'script'
                );


            script.id =
                id;


            script.src =
                src;


            script.async =
                true;


            script.onload =
                () => {

                    resolve();
                };


            script.onerror =
                () => {

                    reject(
                        new Error(
                            `No se pudo cargar la librería PDF: ${src}`
                        )
                    );
                };


            document.head.appendChild(
                script
            );
        }
    );
}


/* ============================================================
   CARGAR IMAGEN COMO BASE64
============================================================ */

function cargarImagenComoBase64(
    url
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const imagen =
                new Image();


            imagen.onload =
                () => {

                    try {

                        const canvas =
                            document.createElement(
                                'canvas'
                            );


                        canvas.width =
                            imagen.naturalWidth ||
                            imagen.width;


                        canvas.height =
                            imagen.naturalHeight ||
                            imagen.height;


                        const contexto =
                            canvas.getContext(
                                '2d'
                            );


                        contexto.drawImage(
                            imagen,
                            0,
                            0
                        );


                        const base64 =
                            canvas.toDataURL(
                                'image/png'
                            );


                        resolve(
                            base64
                        );

                    } catch (error) {

                        reject(
                            error
                        );
                    }
                };


            imagen.onerror =
                () => {

                    reject(
                        new Error(
                            `No se pudo cargar la imagen: ${url}`
                        )
                    );
                };


            imagen.src =
                url;
        }
    );
}


/* ============================================================
   ENCABEZADO PDF
============================================================ */

function dibujarEncabezadoPDF({

    doc,
    logoBase64,
    anchoPagina,
    margenIzquierdo,
    margenDerecho

}) {

    /* ========================================================
       FRANJA SUPERIOR
    ======================================================== */

    doc.setFillColor(
        35,
        35,
        35
    );


    doc.rect(
        0,
        0,
        anchoPagina,
        38,
        'F'
    );


    /* ========================================================
       LOGO
    ======================================================== */

    if (
        logoBase64
    ) {

        try {

            doc.addImage(
                logoBase64,
                'PNG',
                margenIzquierdo,
                5,
                35,
                28,
                undefined,
                'FAST'
            );

        } catch (error) {

            console.warn(
                'No se pudo insertar el logo:',
                error
            );
        }
    }


    /* ========================================================
       TEXTO INSTITUCIONAL
    ======================================================== */

    const posicionTexto =
        logoBase64
            ? 53
            : margenIzquierdo;


    doc.setFont(
        'helvetica',
        'bold'
    );


    doc.setFontSize(
        14
    );


    doc.setTextColor(
        255,
        255,
        255
    );


    doc.text(
        'CONTROL DE MANTENIMIENTOS',
        posicionTexto,
        15
    );


    doc.setFont(
        'helvetica',
        'normal'
    );


    doc.setFontSize(
        8
    );


    doc.setTextColor(
        220,
        220,
        220
    );


    doc.text(
        'Registro y seguimiento de mantenimiento de unidades',
        posicionTexto,
        22
    );


    doc.setFontSize(
        7.5
    );


    doc.text(
        'Documento generado desde el sistema de gestión de flota',
        posicionTexto,
        28
    );


    /* ========================================================
       LÍNEA DECORATIVA
    ======================================================== */

    doc.setDrawColor(
        255,
        255,
        255
    );


    doc.setLineWidth(
        0.4
    );


    doc.line(
        posicionTexto,
        31,
        anchoPagina - margenDerecho,
        31
    );
}


/* ============================================================
   RESUMEN DE FILTROS
============================================================ */

function dibujarResumenFiltrosPDF({

    doc,
    resumenFiltros,
    cantidadRegistros,
    x,
    y,
    ancho

}) {

    const alto =
        11;


    doc.setFillColor(
        246,
        246,
        246
    );


    doc.setDrawColor(
        220,
        220,
        220
    );


    doc.setLineWidth(
        0.25
    );


    doc.roundedRect(
        x,
        y,
        ancho,
        alto,
        2,
        2,
        'FD'
    );


    doc.setFont(
        'helvetica',
        'bold'
    );


    doc.setFontSize(
        7.5
    );


    doc.setTextColor(
        55,
        55,
        55
    );


    doc.text(
        'FILTROS:',
        x + 4,
        y + 7
    );


    doc.setFont(
        'helvetica',
        'normal'
    );


    const textoFiltros =
        resumenFiltros ||
        'Sin filtros aplicados';


    const anchoTexto =
        Math.max(
            50,
            ancho - 65
        );


    const textoAjustado =
        doc.splitTextToSize(
            textoFiltros,
            anchoTexto
        );


    doc.text(
        textoAjustado[0] ||
            '',
        x + 25,
        y + 7
    );


    doc.setFont(
        'helvetica',
        'bold'
    );


    doc.setTextColor(
        35,
        35,
        35
    );


    doc.text(
        `Total: ${cantidadRegistros}`,
        x + ancho - 4,
        y + 7,
        {
            align: 'right'
        }
    );
}


/* ============================================================
   OBTENER RESUMEN DE FILTROS
============================================================ */

function obtenerResumenFiltrosPDF() {

    const filtros = [];


    /* ========================================================
       UNIDAD
    ======================================================== */

    if (
        DOM.filtroUnidad &&
        DOM.filtroUnidad.value
    ) {

        const valor =
            DOM.filtroUnidad.value;


        const unidad =
            STATE.unidades.find(
                item =>
                    String(
                        item.idUnidad
                    ) ===
                    String(
                        valor
                    )
            );


        filtros.push(
            `Unidad: ${
                unidad
                    ? obtenerNombreUnidad(
                        unidad
                    )
                    : valor
            }`
        );
    }


    /* ========================================================
       TIPO DE MANTENIMIENTO
    ======================================================== */

    if (
        DOM.filtroTipo &&
        DOM.filtroTipo.value
    ) {

        filtros.push(
            `Mantenimiento: ${
                formatearTipo(
                    DOM.filtroTipo.value
                )
            }`
        );
    }


    /* ========================================================
       TIPO DE MEDICIÓN
    ======================================================== */

    if (
        DOM.filtroMedicionTipo &&
        DOM.filtroMedicionTipo.value
    ) {

        filtros.push(
            `Medición: ${
                DOM.filtroMedicionTipo.value
            }`
        );
    }


    /* ========================================================
       DESDE
    ======================================================== */

    if (
        DOM.filtroDesde &&
        DOM.filtroDesde.value
    ) {

        filtros.push(
            `Desde: ${
                formatearFecha(
                    DOM.filtroDesde.value
                )
            }`
        );
    }


    /* ========================================================
       HASTA
    ======================================================== */

    if (
        DOM.filtroHasta &&
        DOM.filtroHasta.value
    ) {

        filtros.push(
            `Hasta: ${
                formatearFecha(
                    DOM.filtroHasta.value
                )
            }`
        );
    }


    /* ========================================================
       BÚSQUEDA
    ======================================================== */

    if (
        DOM.filtroBuscar &&
        DOM.filtroBuscar.value.trim()
    ) {

        filtros.push(
            `Búsqueda: "${DOM.filtroBuscar.value.trim()}"`
        );
    }


    if (
        filtros.length === 0
    ) {

        return 'Sin filtros aplicados';
    }


    return filtros.join(
        '  |  '
    );
}


/* ============================================================
   PIE DE PÁGINA PDF
============================================================ */

function dibujarPiePaginaPDF(
    doc,
    anchoPagina,
    altoPagina,
    numeroPagina
) {

    const margen =
        12;


    doc.setDrawColor(
        210,
        210,
        210
    );


    doc.setLineWidth(
        0.25
    );


    doc.line(
        margen,
        altoPagina - 12,
        anchoPagina - margen,
        altoPagina - 12
    );


    doc.setFont(
        'helvetica',
        'normal'
    );


    doc.setFontSize(
        7
    );


    doc.setTextColor(
        110,
        110,
        110
    );


    doc.text(
        'Bitácora de Mantenimientos',
        margen,
        altoPagina - 6
    );


    doc.text(
        `Página ${numeroPagina} de ${doc.getNumberOfPages()}`,
        anchoPagina - margen,
        altoPagina - 6,
        {
            align: 'right'
        }
    );
}


/* ============================================================
   FECHA PARA NOMBRE DE ARCHIVO
============================================================ */

function obtenerFechaParaArchivo(
    fecha
) {

    const anio =
        fecha.getFullYear();


    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            '0'
        );


    const dia =
        String(
            fecha.getDate()
        ).padStart(
            2,
            '0'
        );


    return `${anio}-${mes}-${dia}`;
}


/* ============================================================
   NOTIFICACIONES
============================================================ */

function inicializarNotificaciones() {

    actualizarContadorNotificaciones();

}


function marcarNotificacionesLeidas() {

    document
        .querySelectorAll(
            '.notification-item.unread'
        )
        .forEach(
            notificacion => {

                notificacion.classList.remove(
                    'unread'
                );


                const estado =
                    notificacion.querySelector(
                        '.notification-status'
                    );


                if (estado) {

                    estado.remove();

                }

            }
        );


    actualizarContadorNotificaciones();

}


function actualizarContadorNotificaciones() {

    if (!DOM.notificationDot) {

        return;

    }


    const cantidad =
        document.querySelectorAll(
            '.notification-item.unread'
        ).length;


    if (cantidad === 0) {

        DOM.notificationDot.style.display =
            'none';

        return;

    }


    DOM.notificationDot.style.display =
        'flex';


    DOM.notificationDot.textContent =
        cantidad;

}


/* ============================================================
   TOASTS
============================================================ */

function mostrarToast(toastId) {

    const elemento =
        document.getElementById(
            toastId
        );


    if (!elemento) {

        return;

    }


    if (

        typeof bootstrap === 'undefined' ||

        !bootstrap.Toast

    ) {

        console.warn(
            'Bootstrap Toast no está disponible.'
        );

        return;

    }


    const toast =
        bootstrap.Toast.getOrCreateInstance(
            elemento,
            {
                delay:
                    CONFIG.toastDelay
            }
        );


    toast.show();

}


/* ============================================================
   TOAST ÉXITO
============================================================ */

function mostrarExito(mensaje) {

    const elemento =
        document.getElementById(
            'successToastMessage'
        );


    if (elemento) {

        elemento.textContent =
            mensaje;

    }


    mostrarToast(
        'successToast'
    );

}


/* ============================================================
   TOAST ERROR
============================================================ */

function mostrarError(mensaje) {

    const elemento =
        document.getElementById(
            'errorToastMessage'
        );


    if (elemento) {

        elemento.textContent =
            mensaje;

    }


    mostrarToast(
        'errorToast'
    );

}


/* ============================================================
   MODALES
============================================================ */

function abrirModal(elementoModal) {

    if (!elementoModal) {

        return;

    }


    if (

        typeof bootstrap === 'undefined' ||

        !bootstrap.Modal

    ) {

        console.warn(
            'Bootstrap Modal no está disponible.'
        );

        return;

    }


    bootstrap.Modal
        .getOrCreateInstance(
            elementoModal
        )
        .show();

}


function cerrarModal(elementoModal) {

    if (!elementoModal) {

        return;

    }


    if (

        typeof bootstrap === 'undefined' ||

        !bootstrap.Modal

    ) {

        return;

    }


    const modal =
        bootstrap.Modal.getInstance(
            elementoModal
        );


    if (modal) {

        modal.hide();

    }

}


/* ============================================================
   UTILIDADES
============================================================ */

function formatearNumeroMantenimiento(id) {

    if (

        id === null ||

        id === undefined ||

        id === ''

    ) {

        return '#—';

    }


    return `#${String(id).padStart(4, '0')}`;

}


/* ============================================================
   FORMATEAR FECHA
============================================================ */

function formatearFecha(fecha) {

    if (!fecha) {

        return '—';

    }


    const partes =
        String(fecha).split('-');


    if (partes.length !== 3) {

        if (
            String(fecha).includes('T')
        ) {

            const fechaParte =
                String(fecha).split('T')[0];


            const partesISO =
                fechaParte.split('-');


            if (
                partesISO.length === 3
            ) {

                return `${partesISO[2]}/${partesISO[1]}/${partesISO[0]}`;

            }

        }


        return fecha;

    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


/* ============================================================
   FORMATEAR MEDICIÓN
============================================================ */

function formatearMedicion(
    mantenimiento
) {

    if (

        mantenimiento.medicionValor === null ||

        mantenimiento.medicionValor === undefined

    ) {

        return '—';

    }


    const valor =
        Number(
            mantenimiento.medicionValor
        )
            .toLocaleString('es-HN');


    const tipo =
        mantenimiento.medicionTipo ||
        '';


    if (!tipo) {

        return valor;

    }


    return `${valor} ${tipo}`;

}


/* ============================================================
   FORMATEAR TIPO
============================================================ */

function formatearTipo(tipo) {

    const tipos = {

        PREVENTIVO:
            'Preventivo',

        CORRECTIVO:
            'Correctivo',

        REVISION:
            'Revisión',

        REPARACION:
            'Reparación',

        RESCATE:
            'Rescate',

        OTRO:
            'Otro'

    };


    return tipos[tipo] ||
        tipo ||
        '—';

}


/* ============================================================
   CLASE TIPO
============================================================ */

function obtenerClaseTipo(tipo) {

    const clases = {

        PREVENTIVO:
            'preventive',

        CORRECTIVO:
            'corrective',

        REVISION:
            'review',

        REPARACION:
            'repair',

        RESCATE:
            'rescue',

        OTRO:
            'other'

    };


    return clases[tipo] ||
        '';

}


/* ============================================================
   RESUMIR TEXTO
============================================================ */

function resumirTexto(
    texto,
    maximo
) {

    if (!texto) {

        return '—';

    }


    if (texto.length <= maximo) {

        return texto;

    }


    return `${texto.substring(
        0,
        maximo
    )}...`;

}


/* ============================================================
   ESCAPAR HTML
============================================================ */

function escaparHtml(valor) {

    const div =
        document.createElement(
            'div'
        );


    div.textContent =
        valor ?? '';


    return div.innerHTML;

}


/* ============================================================
   MENSAJE ERROR BACKEND
============================================================ */

async function obtenerMensajeError(
    respuesta
) {

    try {

        const contenido =
            await respuesta.text();


        if (!contenido) {

            return `Error HTTP ${respuesta.status}`;

        }


        try {

            const json =
                JSON.parse(contenido);


            return (

                json.message ||

                json.error ||

                json.detail ||

                `Error HTTP ${respuesta.status}`

            );


        } catch {

            return contenido;

        }


    } catch {

        return `Error HTTP ${respuesta.status}`;

    }

}


/* ============================================================
   CARGANDO TABLA
============================================================ */

function mostrarCargandoTabla() {

    if (!DOM.tablaMantenimientos) {

        return;

    }


    DOM.tablaMantenimientos.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="text-center py-5 text-muted"
            >

                <div
                    class="spinner-border"
                    role="status"
                ></div>

                <p class="mt-3 mb-0">
                    Cargando mantenimientos...
                </p>

            </td>

        </tr>

    `;

}