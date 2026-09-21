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
           TABLAS POR UNIDAD - DISEÑO DE IMPRESIÓN

           - El encabezado institucional/logo aparece SOLO en la
             primera página.
           - Cada unidad tiene su propia tabla, claramente separada
             y titulada con el nombre de la unidad.
           - Cada registro queda unido: fila de datos + descripción,
             sin espacios que hagan parecer que son tablas distintas.
           - La columna se llama "Medición".
           - Las descripciones largas aumentan la altura del registro
             sin montarse sobre el siguiente.
        ======================================================== */

        const alturaTituloUnidad = 9;
        const alturaEncabezadoTabla = 8;
        const alturaFilaPrincipal = 16;
        const separacionEntreUnidades = 8;
        const radioTabla = 2.4;

        const colorTituloUnidad = [232, 234, 237];
        const colorEncabezado = [72, 74, 77];
        const colorBorde = [185, 188, 192];
        const colorLinea = [215, 217, 220];
        const colorTexto = [35, 35, 35];
        const colorDescripcion = [247, 248, 250];
        const colorTextoDescripcion = [25, 48, 82];

        const anchoID = 62;
        const anchoFecha = 75;
        const anchoMedicion =
            anchoUtil - anchoID - anchoFecha;

        const obtenerColorTipo = tipo => {
            const tipoLower = String(tipo || '').toLowerCase();

            if (tipoLower.includes('correct')) {
                return [220, 105, 12];
            }

            if (tipoLower.includes('revis')) {
                return [55, 110, 180];
            }

            if (tipoLower.includes('prevent')) {
                return [24, 125, 65];
            }

            if (
                tipoLower.includes('repar') ||
                tipoLower.includes('otro')
            ) {
                return [35, 135, 75];
            }

            return [90, 95, 100];
        };

        const medirDescripcion = descripcion => {
            const anchoTexto = anchoUtil - 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);

            const lineas = doc.splitTextToSize(
                descripcion,
                anchoTexto
            );

            const altoLinea = 3.6;
            const alto =
                4.5 +
                Math.max(1, lineas.length) * altoLinea +
                4.5;

            return {
                lineas,
                alto
            };
        };

        const obtenerDatosRegistro = registro => {
            const unidad = obtenerUnidadCompleta(
                registro.unidad
            );

            const placa =
                obtenerPlacaUnidad(unidad) || '—';

            const medicionValor =
                registro.medicionValor === null ||
                registro.medicionValor === undefined
                    ? '—'
                    : Number(
                        registro.medicionValor
                    ).toLocaleString('es-HN');

            const medicionTipo =
                registro.medicionTipo || '';

            const medicion =
                medicionTipo && medicionValor !== '—'
                    ? `${medicionValor} ${medicionTipo}`
                    : medicionValor;

            const id = formatearNumeroMantenimiento(
                registro.idMantenimiento
            );

            const fecha = formatearFecha(
                registro.fechaMantenimiento
            );

            const tipo =
                formatearTipo(registro.tipo) || '—';

            const descripcion = String(
                registro.descripcion || '—'
            ).trim();

            return {
                placa,
                medicion,
                id,
                fecha,
                tipo,
                descripcion,
                descripcionMedida:
                    medirDescripcion(descripcion)
            };
        };

        const alturaRegistro = registro => {
            const datos = obtenerDatosRegistro(registro);

            return (
                alturaFilaPrincipal +
                datos.descripcionMedida.alto
            );
        };

        /*
         * Dibuja el título de una unidad.
         * Ejemplo:
         *   UNIDAD 7118                         PLACA: TRB-8189
         */
        const dibujarTituloUnidad = (
            y,
            grupo
        ) => {
            const x = margenIzquierdo;
            const w = anchoUtil;

            doc.setFillColor(
                colorTituloUnidad[0],
                colorTituloUnidad[1],
                colorTituloUnidad[2]
            );

            doc.setDrawColor(
                colorBorde[0],
                colorBorde[1],
                colorBorde[2]
            );

            doc.setLineWidth(0.25);

            doc.roundedRect(
                x,
                y,
                w,
                alturaTituloUnidad,
                radioTabla,
                radioTabla,
                'FD'
            );

            /* Base recta para que solo las esquinas superiores
               conserven el redondeo y la tabla quede visualmente unida. */
            doc.setFillColor(
                colorTituloUnidad[0],
                colorTituloUnidad[1],
                colorTituloUnidad[2]
            );

            doc.rect(
                x,
                y + 2.2,
                w,
                alturaTituloUnidad - 2.2,
                'F'
            );

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(
                colorTexto[0],
                colorTexto[1],
                colorTexto[2]
            );

            doc.text(
                `UNIDAD ${grupo.nombre}`,
                x + 5,
                y + 6.1
            );

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(85, 88, 92);

            doc.text(
                `Placa: ${grupo.placa || '—'}`,
                x + w - 5,
                y + 6.1,
                { align: 'right' }
            );

            return y + alturaTituloUnidad;
        };

        /*
         * Encabezado de columnas. Se usa al inicio de cada tabla
         * y nuevamente si una misma unidad continúa en otra página.
         */
        const dibujarEncabezadoTabla = y => {
            const x = margenIzquierdo;
            const w = anchoUtil;

            doc.setFillColor(
                colorEncabezado[0],
                colorEncabezado[1],
                colorEncabezado[2]
            );

            doc.rect(
                x,
                y,
                w,
                alturaEncabezadoTabla,
                'F'
            );

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.8);
            doc.setTextColor(255, 255, 255);

            doc.text(
                'ID',
                x + 4,
                y + 5.5
            );

            doc.text(
                'Fecha',
                x + anchoID + anchoFecha / 2,
                y + 5.5,
                { align: 'center' }
            );

            doc.text(
                'Medición',
                x + w - 4,
                y + 5.5,
                { align: 'right' }
            );

            return y + alturaEncabezadoTabla;
        };

        /*
         * Dibuja un registro como un bloque único:
         *
         * ┌──────────────────────────────────────────────┐
         * │ ID                 Fecha              Medición│
         * │ badge  placa                                  │
         * ├──────────────────────────────────────────────┤
         * │ DESCRIPCIÓN                                  │
         * │ texto...                                     │
         * └──────────────────────────────────────────────┘
         *
         * No hay separación vertical entre la fila principal
         * y la descripción.
         */
        const dibujarRegistro = (
            registro,
            y,
            esUltimo
        ) => {
            const x = margenIzquierdo;
            const w = anchoUtil;
            const datos = obtenerDatosRegistro(registro);

            const descripcionY =
                y + alturaFilaPrincipal;

            const altoDescripcion =
                datos.descripcionMedida.alto;

            const altoTotal =
                alturaFilaPrincipal +
                altoDescripcion;

            /* Fondo completo del registro. */
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(
                colorBorde[0],
                colorBorde[1],
                colorBorde[2]
            );
            doc.setLineWidth(0.22);

            doc.rect(
                x,
                y,
                w,
                altoTotal,
                'FD'
            );

            /* Área de descripción. */
            doc.setFillColor(
                colorDescripcion[0],
                colorDescripcion[1],
                colorDescripcion[2]
            );

            doc.rect(
                x + 0.25,
                descripcionY,
                w - 0.5,
                altoDescripcion - 0.25,
                'F'
            );

            /* Línea divisoria entre datos y descripción. */
            doc.setDrawColor(
                colorLinea[0],
                colorLinea[1],
                colorLinea[2]
            );

            doc.setLineWidth(0.2);

            doc.line(
                x,
                descripcionY,
                x + w,
                descripcionY
            );

            /* ID */
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.2);
            doc.setTextColor(
                colorTexto[0],
                colorTexto[1],
                colorTexto[2]
            );

            doc.text(
                datos.id,
                x + 4,
                y + 5.5
            );

            /* Badge de mantenimiento */
            const badgeColor =
                obtenerColorTipo(datos.tipo);

            const badgeH = 5.1;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.3);

            const badgeW = Math.max(
                18,
                doc.getTextWidth(datos.tipo) + 7
            );

            const badgeY = y + 9.0;

            doc.setFillColor(
                badgeColor[0],
                badgeColor[1],
                badgeColor[2]
            );

            doc.roundedRect(
                x + 4,
                badgeY,
                badgeW,
                badgeH,
                2.5,
                2.5,
                'F'
            );

            doc.setTextColor(255, 255, 255);

            doc.text(
                datos.tipo,
                x + 4 + badgeW / 2,
                badgeY + 3.45,
                { align: 'center' }
            );

            /* Placa */
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.2);
            doc.setTextColor(
                colorTexto[0],
                colorTexto[1],
                colorTexto[2]
            );

            doc.text(
                datos.placa,
                x + 4 + badgeW + 4,
                badgeY + 3.45
            );

            /* Fecha */
            doc.setFontSize(7.8);

            doc.text(
                datos.fecha,
                x + anchoID + anchoFecha / 2,
                y + 9.4,
                { align: 'center' }
            );

            /* Medición */
            doc.text(
                datos.medicion,
                x + w - 4,
                y + 9.4,
                { align: 'right' }
            );

            /* Descripción */
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(70, 75, 82);

            doc.text(
                'DESCRIPCIÓN',
                x + 5,
                descripcionY + 4.2
            );

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(
                colorTextoDescripcion[0],
                colorTextoDescripcion[1],
                colorTextoDescripcion[2]
            );

            doc.text(
                datos.descripcionMedida.lineas,
                x + 5,
                descripcionY + 8.0,
                {
                    baseline: 'top',
                    lineHeightFactor: 1.15
                }
            );

            return {
                yFinal: y + altoTotal,
                altoTotal
            };
        };

        /*
         * Dibuja la tabla de una unidad aprovechando el espacio disponible.
         * Una unidad puede continuar en otra página, pero cada registro
         * siempre se mantiene como un bloque unido.
         */
        const dibujarGrupoUnidad = (
            grupo,
            paginaActualEsPrimera
        ) => {
            const registrosGrupo =
                grupo.registros || [];

            if (registrosGrupo.length === 0) {
                return;
            }

            const limiteY =
                altoPagina - margenInferior - 2;

            /*
             * No obligamos a que toda la unidad quepa en una sola página.
             * Primero comprobamos únicamente que haya espacio para el
             * título, el encabezado y AL MENOS un registro.
             *
             * Así, si una unidad anterior deja espacio suficiente, la
             * siguiente unidad comienza en la misma página en lugar de
             * desperdiciar el espacio restante.
             */
            const alturaMinimaUnidad =
                alturaTituloUnidad +
                alturaEncabezadoTabla +
                alturaRegistro(registrosGrupo[0]);

            if (
                posicionY +
                alturaMinimaUnidad >
                limiteY &&
                posicionY > 25
            ) {
                doc.addPage();
                posicionY = 18;
            }

            posicionY =
                dibujarTituloUnidad(
                    posicionY,
                    grupo
                );

            posicionY =
                dibujarEncabezadoTabla(
                    posicionY
                );

            registrosGrupo.forEach(
                (
                    registro,
                    indiceRegistro
                ) => {
                    const altoNecesario =
                        alturaRegistro(registro);

                    /*
                     * Si el registro completo no cabe, pasa entero
                     * a la siguiente página. No se parte la descripción.
                     */
                    if (
                        posicionY +
                        altoNecesario >
                        limiteY
                    ) {
                        doc.addPage();
                        posicionY = 18;

                        /*
                         * En una continuación no repetimos el logo ni
                         * el encabezado institucional. Solo indicamos
                         * que la tabla de la unidad continúa.
                         */
                        posicionY =
                            dibujarTituloUnidad(
                                posicionY,
                                grupo
                            );

                        posicionY =
                            dibujarEncabezadoTabla(
                                posicionY
                            );
                    }

                    const resultado =
                        dibujarRegistro(
                            registro,
                            posicionY,
                            indiceRegistro ===
                                registrosGrupo.length - 1
                        );

                    posicionY =
                        resultado.yFinal;

                    /*
                     * Separador mínimo entre registros, sin crear
                     * "huecos" visuales. El siguiente registro empieza
                     * inmediatamente debajo del anterior.
                     */
                    if (
                        indiceRegistro <
                        registrosGrupo.length - 1
                    ) {
                        doc.setDrawColor(
                            colorLinea[0],
                            colorLinea[1],
                            colorLinea[2]
                        );
                        doc.setLineWidth(0.18);

                        doc.line(
                            margenIzquierdo,
                            posicionY,
                            anchoPagina - margenDerecho,
                            posicionY
                        );
                    }
                }
            );

            /*
             * Borde exterior de la tabla de unidad.
             * Se utiliza como guía visual cuando termina el grupo.
             */
            if (
                posicionY <
                altoPagina - margenInferior - 1
            ) {
                doc.setDrawColor(
                    colorBorde[0],
                    colorBorde[1],
                    colorBorde[2]
                );
                doc.setLineWidth(0.25);

                /*
                 * Línea inferior: mantiene la tabla visualmente cerrada.
                 */
                doc.line(
                    margenIzquierdo,
                    posicionY,
                    anchoPagina - margenDerecho,
                    posicionY
                );
            }

            posicionY += separacionEntreUnidades;
        };

        /* ========================================================
           POSICIÓN INICIAL

           La primera página conserva el encabezado institucional,
           logo, título y resumen. Las páginas siguientes NO vuelven
           a dibujar ese encabezado.
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
                dibujarGrupoUnidad(
                    grupo,
                    indiceGrupo === 0
                );
            }
        );

        /* ========================================================

           PIE DE TODAS LAS PÁGINAS

           Como las tablas se dibujan manualmente, el pie se
           coloca aquí al final para que todas las páginas
           tengan "Página X de Y" correctamente.

        ======================================================== */

        const paginas = doc.getNumberOfPages();

        for (
            let pagina = 1;
            pagina <= paginas;
            pagina++
        ) {
            doc.setPage(pagina);

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



/* ============================================================
   IMPRIMIR UNIDADES - TABLA MEMBRETADA
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const btnImprimirUnidades =
        document.getElementById("btnImprimirUnidades");

    if (btnImprimirUnidades) {
        btnImprimirUnidades.addEventListener(
            "click",
            imprimirUnidadesMembretadas
        );
    }

});


function imprimirUnidadesMembretadas() {

    const tabla = document.querySelector(".units-table");

    if (!tabla) {
        alert("No se encontró la tabla de unidades.");
        return;
    }

    const tbody = tabla.querySelector("tbody");

    if (!tbody) {
        alert("No hay información para imprimir.");
        return;
    }

    /*
     * Clonamos solamente la tabla.
     * Así no modificamos la tabla original del modal.
     */
    const tablaClonada = tabla.cloneNode(true);

    /*
     * Eliminamos la columna ACCIONES.
     */
    tablaClonada
        .querySelectorAll("tr")
        .forEach(fila => {

            if (fila.lastElementChild) {
                fila.lastElementChild.remove();
            }

        });


    /*
     * Eliminamos la fila de "No hay unidades..."
     * si está presente.
     */
    const filaVacia =
        tablaClonada.querySelector("#emptyUnitsRow");

    if (filaVacia) {
        filaVacia.remove();
    }


    /*
     * Fecha y hora de impresión.
     */
    const ahora = new Date();

    const fecha = ahora.toLocaleDateString("es-HN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    const hora = ahora.toLocaleTimeString("es-HN", {
        hour: "2-digit",
        minute: "2-digit"
    });


    /*
     * Total de unidades.
     */
    const filasUnidades =
        tbody.querySelectorAll("tr:not(#emptyUnitsRow)");

    const totalUnidades = filasUnidades.length;


    /*
     * Intentamos obtener el logo de la aplicación.
     *
     * IMPORTANTE:
     * Si tu logo tiene otro selector/ruta, puedes
     * cambiarlo aquí.
     */
    let logoSrc = "";

    const logoExistente =
        document.querySelector(
            ".topbar img, .navbar img, header img, img.logo"
        );

    if (logoExistente) {
        logoSrc = logoExistente.src;
    }


    /*
     * Creamos una ventana exclusivamente para impresión.
     */
    const ventana =
        window.open(
            "",
            "_blank",
            "width=1100,height=800"
        );

    if (!ventana) {
        alert(
            "El navegador bloqueó la ventana de impresión. " +
            "Permite ventanas emergentes para este sitio."
        );

        return;
    }


    ventana.document.open();

    ventana.document.write(`
<!DOCTYPE html>

<html lang="es">

<head>

    <meta charset="UTF-8">

    <title>Unidades de la Flota</title>

    <style>

        @page {
            size: letter landscape;
            margin: 12mm;
        }

        * {
            box-sizing: border-box;
        }

        html,
        body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #1f2937;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
        }

        body {
            padding: 0;
        }

        .documento {
            width: 100%;
        }

        /* =====================================================
           MEMBRETE
           ===================================================== */

        .membrete {
            width: 100%;
            border-bottom: 2px solid #1f4e79;
            padding-bottom: 10px;
            margin-bottom: 16px;
        }

        .membrete-contenido {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }

        .membrete-logo {
            width: 90px;
            max-height: 70px;
            object-fit: contain;
        }

        .membrete-centro {
            flex: 1;
            text-align: center;
        }

        .membrete-institucion {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            text-transform: uppercase;
        }

        .membrete-titulo {
            margin: 4px 0 0;
            font-size: 22px;
            font-weight: 700;
            color: #1f4e79;
            text-transform: uppercase;
        }

        .membrete-subtitulo {
            margin: 4px 0 0;
            font-size: 11px;
            color: #6b7280;
        }

        .membrete-fecha {
            width: 130px;
            text-align: right;
            font-size: 10px;
            color: #6b7280;
            line-height: 1.5;
        }


        /* =====================================================
           RESUMEN
           ===================================================== */

        .resumen {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .resumen-titulo {
            font-size: 14px;
            font-weight: 700;
            color: #1f2937;
        }

        .resumen-total {
            font-size: 11px;
            color: #4b5563;
        }


        /* =====================================================
           TABLA
           ===================================================== */

        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        thead {
            display: table-header-group;
        }

        tr {
            page-break-inside: avoid;
        }

        th {
            background: #1f4e79 !important;
            color: #ffffff !important;
            border: 1px solid #1f4e79;
            padding: 8px 7px;
            font-size: 10px;
            font-weight: 700;
            text-align: left;
            text-transform: uppercase;
        }

        td {
            border: 1px solid #d1d5db;
            padding: 8px 7px;
            font-size: 10px;
            vertical-align: middle;
            color: #1f2937;
            word-wrap: break-word;
            overflow-wrap: anywhere;
        }

        tbody tr:nth-child(even) td {
            background: #f8fafc !important;
        }


        /* ANCHOS */

        th:nth-child(1),
        td:nth-child(1) {
            width: 8%;
            text-align: center;
        }

        th:nth-child(2),
        td:nth-child(2) {
            width: 18%;
        }

        th:nth-child(3),
        td:nth-child(3) {
            width: 17%;
        }

        th:nth-child(4),
        td:nth-child(4) {
            width: 42%;
        }

        th:nth-child(5),
        td:nth-child(5) {
            width: 15%;
            text-align: center;
        }


        /* =====================================================
           ESTADO
           ===================================================== */

        .badge {
            display: inline-block;
            padding: 4px 9px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 700;
            border: 1px solid;
        }

        .badge-activa {
            background: #ecfdf3 !important;
            color: #166534 !important;
            border-color: #86efac !important;
        }

        .badge-inactiva {
            background: #fef2f2 !important;
            color: #991b1b !important;
            border-color: #fca5a5 !important;
        }


        /* =====================================================
           PIE
           ===================================================== */

        .pie {
            margin-top: 16px;
            padding-top: 7px;
            border-top: 1px solid #d1d5db;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #6b7280;
        }


        @media print {

            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .no-print {
                display: none !important;
            }

        }

    </style>

</head>


<body>

    <div class="documento">

        <!-- =================================================
             MEMBRETE
             ================================================= -->

        <div class="membrete">

            <div class="membrete-contenido">

                ${
                    logoSrc
                        ? `
                        <div>
                            <img
                                src="${logoSrc}"
                                class="membrete-logo"
                                alt="Logo institucional">
                        </div>
                        `
                        : `
                        <div style="width:90px;"></div>
                        `
                }

                <div class="membrete-centro">

                    <h1 class="membrete-institucion">
                        CONTROL DE FLOTA
                    </h1>

                    <div class="membrete-titulo">
                        UNIDADES DE LA FLOTA
                    </div>

                    <div class="membrete-subtitulo">
                        Catálogo actual de unidades registradas
                    </div>

                </div>

                <div class="membrete-fecha">

                    <div>
                        Fecha:
                        <strong>${fecha}</strong>
                    </div>

                    <div>
                        Hora:
                        <strong>${hora}</strong>
                    </div>

                </div>

            </div>

        </div>


        <!-- =================================================
             RESUMEN
             ================================================= -->

        <div class="resumen">

            <div class="resumen-titulo">
                Unidades registradas
            </div>

            <div class="resumen-total">
                Total de unidades:
                <strong>${totalUnidades}</strong>
            </div>

        </div>


        <!-- =================================================
             TABLA
             ================================================= -->

        ${tablaClonada.outerHTML}


        <!-- =================================================
             PIE
             ================================================= -->

        <div class="pie">

            <span>
                Documento generado desde el sistema de
                Control de Flota
            </span>

            <span>
                Página impresa
            </span>

        </div>

    </div>


    <script>

        /*
         * Convertir los estados de la tabla original
         * en badges para impresión.
         */
        document
            .querySelectorAll("tbody tr")
            .forEach(function (fila) {

                const celdas = fila.querySelectorAll("td");

                if (celdas.length >= 5) {

                    const celdaEstado = celdas[4];

                    const texto =
                        celdaEstado.textContent
                            .trim()
                            .toLowerCase();

                    if (
                        texto.includes("activa")
                        &&
                        !texto.includes("inactiva")
                    ) {

                        celdaEstado.innerHTML =
                            '<span class="badge badge-activa">' +
                            'ACTIVA' +
                            '</span>';

                    } else if (
                        texto.includes("inactiva")
                    ) {

                        celdaEstado.innerHTML =
                            '<span class="badge badge-inactiva">' +
                            'INACTIVA' +
                            '</span>';

                    }

                }

            });


        /*
         * Esperamos a que cargue el documento y
         * abrimos automáticamente el diálogo de impresión.
         */
        window.onload = function () {

            setTimeout(function () {

                window.print();

            }, 300);

        };


        /*
         * Cerramos la ventana después de imprimir.
         */
        window.onafterprint = function () {

            setTimeout(function () {

                window.close();

            }, 200);

        };

    <\/script>

</body>

</html>
    `);

    ventana.document.close();
}