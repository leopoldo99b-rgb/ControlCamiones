
/* =========================================================
 * DESTINOS.JS
 *
 * FUNCIONES:
 *
 *  1. Cargar motoristas
 *  2. Cargar camiones
 *  3. Cargar destinos
 *  4. Cargar KM según ruta
 *  5. Cargar cantidad de peajes
 *  6. Calcular subtotal
 *  7. Calcular ISV
 *  8. Calcular tarifa
 *  9. Calcular valor de peaje según ejes
 * 10. Calcular total de peajes
 * 11. Actualizar resumen
 * 12. Actualizar totales de tabla
 * 13. Buscar recorridos
 * 14. Paginar recorridos
 * 15. Validar formulario
 * 16. Cancelar / limpiar formulario
 * 17. Guardar recorrido
 * 18. Editar recorrido
 * 19. Eliminar recorrido
 * 20. Cargar recorridos desde BD
 * 21. Modales Bootstrap
 *
 * ========================================================= */


/* =========================================================
 * CONFIGURACIÓN
 * ========================================================= */

const URL_CONDUCTORES = "/viajes2/conductores";
const URL_CAMIONES = "/viajes2/camiones";
const URL_DESTINOS = "/api/destinos";
const URL_RECORRIDOS = "/api/recorridos";


/* =========================================================
 * CONSTANTES
 * ========================================================= */

const ISV_PORCENTAJE = 0.15;

const PEAJE_2_EJES = 224.00;
const PEAJE_3_EJES = 269.00;


/* =========================================================
 * PAGINACIÓN
 * ========================================================= */

const REGISTROS_POR_PAGINA = 10;

let paginaActual = 1;


/* =========================================================
 * RECORRIDOS CARGADOS DESDE BD
 * ========================================================= */

let recorridosBD = [];


/* =========================================================
 * ID DEL RECORRIDO QUE SE ESTÁ EDITANDO
 *
 * null = nuevo recorrido
 * número = edición
 * ========================================================= */

let recorridoEditandoId = null;


/* =========================================================
 * ID DEL RECORRIDO PENDIENTE DE ELIMINAR
 * ========================================================= */

let recorridoEliminarId = null;


/* =========================================================
 * ELEMENTOS DEL FORMULARIO
 * ========================================================= */

let formViaje;
let comboMotorista;
let comboUnidad;
let comboRuta;
let comboEjes;
let inputFecha;
let inputKm;
let inputRemision;
let inputBanda;
let inputCantidadPeajes;
let inputValorPeaje;
let inputTotalPeajes;
let inputSubtotal;
let inputIsv;
let inputTarifa;


/* =========================================================
 * INICIALIZACIÓN
 * ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("=================================");
    console.log("DESTINOS.JS INICIADO");
    console.log("=================================");

    obtenerElementos();

    establecerFechaActual();

    inicializarEventos();

    cargarMotoristas();
    cargarUnidades();
    cargarDestinos();
    cargarRecorridos();

    calcularTodo();

});


/* =========================================================
 * OBTENER ELEMENTOS DEL DOM
 * ========================================================= */

function obtenerElementos() {

    formViaje =
        document.getElementById("formViaje");

    comboMotorista =
        document.getElementById("motorista");

    comboUnidad =
        document.getElementById("unidad");

    comboRuta =
        document.getElementById("ruta");

    comboEjes =
        document.getElementById("ejesCamion");

    inputFecha =
        document.getElementById("fecha");

    inputKm =
        document.getElementById("kmRecorridos");

    inputRemision =
        document.getElementById("remision");

    inputBanda =
        document.getElementById("bandaPorKm");

    inputCantidadPeajes =
        document.getElementById("cantidadPeajes");

    inputValorPeaje =
        document.getElementById("valorPeaje");

    inputTotalPeajes =
        document.getElementById("totalPeajes");

    inputSubtotal =
        document.getElementById("subtotal");

    inputIsv =
        document.getElementById("isv");

    inputTarifa =
        document.getElementById("tarifa");
}


/* =========================================================
 * FECHA ACTUAL
 * ========================================================= */

function establecerFechaActual() {

    if (!inputFecha) {
        return;
    }

    if (!inputFecha.value) {

        const hoy = new Date();

        const year =
            hoy.getFullYear();

        const month =
            String(hoy.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(hoy.getDate())
                .padStart(2, "0");

        inputFecha.value =
            `${year}-${month}-${day}`;
    }
}


/* =========================================================
 * INICIALIZAR EVENTOS
 * ========================================================= */

function inicializarEventos() {

    /* =====================================================
     * CAMBIO DE RUTA
     * ===================================================== */

    if (comboRuta) {

        comboRuta.addEventListener(
            "change",
            cambiarRuta
        );
    }


    /* =====================================================
     * CAMBIO DE EJES
     * ===================================================== */

    if (comboEjes) {

        comboEjes.addEventListener(
            "change",
            calcularPeajes
        );
    }


    /* =====================================================
     * CAMBIO DE BANDA
     * ===================================================== */

    if (inputBanda) {

        inputBanda.addEventListener(
            "input",
            calcularTarifa
        );
    }


    /* =====================================================
     * CAMBIO DE KM
     * ===================================================== */

    if (inputKm) {

        inputKm.addEventListener(
            "input",
            calcularTarifa
        );
    }


    /* =====================================================
     * CAMBIO DE CANTIDAD DE PEAJES
     * ===================================================== */

    if (inputCantidadPeajes) {

        inputCantidadPeajes.addEventListener(
            "input",
            calcularPeajes
        );
    }


    /* =====================================================
     * CAMBIO DE UNIDAD
     * ===================================================== */

    if (comboUnidad) {

        comboUnidad.addEventListener(
            "change",
            cambiarUnidad
        );
    }


    /* =====================================================
     * BUSCADOR
     * ===================================================== */

    const buscador =
        document.getElementById(
            "buscadorViajes"
        );

    if (buscador) {

        buscador.addEventListener(
            "input",
            () => {

                paginaActual = 1;

                actualizarTabla();

            }
        );
    }


    /* =====================================================
     * BOTÓN FILTROS
     * ===================================================== */

    const btnFiltros =
        document.getElementById(
            "btnFiltros"
        );

    if (btnFiltros) {

        btnFiltros.addEventListener(
            "click",
            () => {

                mostrarModalError(
                    "Los filtros avanzados pueden agregarse posteriormente."
                );

            }
        );
    }


    /* =====================================================
     * BOTÓN CANCELAR
     * ===================================================== */

    const btnCancelar =
        document.getElementById(
            "btnCancelar"
        );

    if (btnCancelar) {

        btnCancelar.addEventListener(
            "click",
            limpiarFormulario
        );
    }


    /* =====================================================
     * FORMULARIO
     * ===================================================== */

    if (formViaje) {

        formViaje.addEventListener(
            "submit",
            validarFormulario
        );
    }


    /* =====================================================
     * TARJETAS DE PEAJES
     * ===================================================== */

    document
        .querySelectorAll(".toll-option")
        .forEach(opcion => {

            opcion.addEventListener(
                "click",
                () => {

                    const ejes =
                        opcion.dataset.ejes;

                    if (comboEjes) {

                        comboEjes.value =
                            ejes;
                    }

                    calcularPeajes();
                }
            );
        });


    /* =====================================================
     * BOTÓN CONFIRMAR EDITAR
     * ===================================================== */

    const btnConfirmarEditar =
        document.getElementById(
            "btnConfirmarEditar"
        );

    if (btnConfirmarEditar) {

        btnConfirmarEditar.addEventListener(
            "click",
            async () => {

                await actualizarRecorrido();

            }
        );
    }


    /* =====================================================
     * BOTÓN CONFIRMAR ELIMINAR
     * ===================================================== */

    const btnConfirmarEliminar =
        document.getElementById(
            "btnConfirmarEliminar"
        );

    if (btnConfirmarEliminar) {

        btnConfirmarEliminar.addEventListener(
            "click",
            async () => {

                await ejecutarEliminarRecorrido();

            }
        );
    }
}


/* =========================================================
 * MODAL GENÉRICO
 * ========================================================= */

function obtenerModal(id) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {

        console.warn(
            `No existe el modal #${id}`
        );

        return null;
    }

    if (
        typeof bootstrap === "undefined" ||
        !bootstrap.Modal
    ) {

        console.error(
            "Bootstrap JS no está cargado."
        );

        return null;
    }

    return bootstrap.Modal.getOrCreateInstance(
        elemento
    );
}


/* =========================================================
 * MOSTRAR MODAL DE ÉXITO
 * ========================================================= */

function mostrarModalExito(mensaje) {

    const mensajeElemento =
        document.getElementById(
            "mensajeExito"
        );

    if (mensajeElemento) {

        mensajeElemento.textContent =
            mensaje ||
            "La operación se realizó correctamente.";
    }

    const modal =
        obtenerModal("modalExito");

    if (modal) {

        modal.show();

    } else {

        console.log(
            mensaje
        );
    }
}


/* =========================================================
 * MOSTRAR MODAL DE ERROR
 * ========================================================= */

function mostrarModalError(mensaje) {

    const mensajeElemento =
        document.getElementById(
            "mensajeError"
        );

    if (mensajeElemento) {

        mensajeElemento.textContent =
            mensaje ||
            "No se pudo completar la operación.";
    }

    const modal =
        obtenerModal("modalError");

    if (modal) {

        modal.show();

    } else {

        console.error(
            mensaje
        );
    }
}


/* =========================================================
 * CERRAR MODAL
 * ========================================================= */

function cerrarModal(id) {

    const modal =
        obtenerModal(id);

    if (modal) {

        modal.hide();

    }
}


/* =========================================================
 * CARGAR MOTORISTAS
 * ========================================================= */

async function cargarMotoristas() {

    if (!comboMotorista) {

        console.error(
            "No existe #motorista"
        );

        return;
    }

    try {

        const respuesta =
            await fetch(
                URL_CONDUCTORES,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (!respuesta.ok) {

            throw new Error(
                `HTTP ${respuesta.status}`
            );
        }

        const motoristas =
            await respuesta.json();

        console.log(
            "Motoristas recibidos:",
            motoristas
        );

        llenarComboMotoristas(
            motoristas
        );

    } catch (error) {

        console.error(
            "Error cargando motoristas:",
            error
        );

        comboMotorista.innerHTML = `
            <option value="" selected disabled>
                Error al cargar motoristas
            </option>
        `;
    }
}


/* =========================================================
 * LLENAR MOTORISTAS
 * ========================================================= */

function llenarComboMotoristas(motoristas) {

    comboMotorista.innerHTML = `
        <option value="" selected disabled>
            Seleccionar motorista
        </option>
    `;

    if (
        !Array.isArray(motoristas) ||
        motoristas.length === 0
    ) {

        comboMotorista.innerHTML = `
            <option value="" selected disabled>
                No hay motoristas activos
            </option>
        `;

        return;
    }

    motoristas.forEach(motorista => {

        const option =
            document.createElement("option");

        const nombre =
            motorista.nombre
                ? String(motorista.nombre).trim()
                : "";

        const apellido =
            motorista.apellido
                ? String(motorista.apellido).trim()
                : "";

        const nombreCompleto =
            `${nombre} ${apellido}`.trim();

        option.value =
            nombreCompleto;

        option.textContent =
            nombreCompleto ||
            "Sin nombre";

        option.dataset.id =
            motorista.id ?? "";

        option.dataset.nombre =
            nombre;

        option.dataset.apellido =
            apellido;

        comboMotorista.appendChild(
            option
        );
    });

    console.log(
        `Motoristas cargados: ${motoristas.length}`
    );
}


/* =========================================================
 * CARGAR CAMIONES
 * ========================================================= */

async function cargarUnidades() {

    if (!comboUnidad) {

        console.error(
            "No existe #unidad"
        );

        return;
    }

    try {

        const respuesta =
            await fetch(
                URL_CAMIONES,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (!respuesta.ok) {

            throw new Error(
                `HTTP ${respuesta.status}`
            );
        }

        const camiones =
            await respuesta.json();

        console.log(
            "Camiones recibidos:",
            camiones
        );

        llenarComboUnidades(
            camiones
        );

    } catch (error) {

        console.error(
            "Error cargando camiones:",
            error
        );

        comboUnidad.innerHTML = `
            <option value="" selected disabled>
                Error al cargar unidades
            </option>
        `;
    }
}


/* =========================================================
 * LLENAR CAMIONES
 * ========================================================= */

function llenarComboUnidades(camiones) {

    comboUnidad.innerHTML = `
        <option value="" selected disabled>
            Seleccionar
        </option>
    `;

    if (
        !Array.isArray(camiones) ||
        camiones.length === 0
    ) {

        comboUnidad.innerHTML = `
            <option value="" selected disabled>
                No hay unidades disponibles
            </option>
        `;

        return;
    }

    camiones.forEach(camion => {

        const option =
            document.createElement("option");

        const unidad =
            camion.unidad ??
            camion.placa ??
            camion.codigo ??
            camion.numero ??
            camion.id;

        option.value =
            unidad ?? "";

        option.textContent =
            unidad ?? "Sin unidad";

        option.dataset.id =
            camion.id ?? "";

        if (
            camion.ejes !== undefined &&
            camion.ejes !== null
        ) {

            option.dataset.ejes =
                camion.ejes;
        }

        comboUnidad.appendChild(
            option
        );
    });

    console.log(
        `Camiones cargados: ${camiones.length}`
    );
}


/* =========================================================
 * CAMBIAR UNIDAD
 * ========================================================= */

function cambiarUnidad() {

    const opcion =
        comboUnidad?.options[
            comboUnidad.selectedIndex
        ];

    if (!opcion) {
        return;
    }

    const ejes =
        opcion.dataset.ejes;

    if (
        comboEjes &&
        ejes !== undefined &&
        ejes !== null &&
        ejes !== ""
    ) {

        comboEjes.value =
            normalizarEjes(ejes);
    }

    calcularPeajes();

    console.log(
        "Unidad seleccionada:",
        opcion.textContent
    );

    console.log(
        "Ejes:",
        ejes
    );
}


/* =========================================================
 * CARGAR DESTINOS
 * ========================================================= */

async function cargarDestinos() {

    if (!comboRuta) {

        console.error(
            "No existe #ruta"
        );

        return;
    }

    try {

        const respuesta =
            await fetch(
                URL_DESTINOS,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (!respuesta.ok) {

            throw new Error(
                `HTTP ${respuesta.status}`
            );
        }

        const destinos =
            await respuesta.json();

        console.log(
            "Destinos recibidos:",
            destinos
        );

        llenarComboDestinos(
            destinos
        );

    } catch (error) {

        console.error(
            "Error cargando destinos:",
            error
        );

        comboRuta.innerHTML = `
            <option value="" selected disabled>
                Error al cargar destinos
            </option>
        `;
    }
}


/* =========================================================
 * LLENAR DESTINOS
 * ========================================================= */

function llenarComboDestinos(destinos) {

    comboRuta.innerHTML = `
        <option value="" selected disabled>
            Seleccionar ruta
        </option>
    `;

    if (
        !Array.isArray(destinos) ||
        destinos.length === 0
    ) {

        comboRuta.innerHTML = `
            <option value="" selected disabled>
                No hay destinos disponibles
            </option>
        `;

        limpiarDatosDestino();

        return;
    }

    destinos.forEach(destino => {

        const option =
            document.createElement("option");

        const nombreDestino =
            destino.destino ??
            destino.nombre ??
            "";

        option.value =
            nombreDestino;

        option.textContent =
            nombreDestino ||
            "Sin nombre";

        option.dataset.km =
            destino.km ??
            destino.kilometros ??
            destino.kmRecorridos ??
            0;

        option.dataset.peajes =
            destino.peajes ??
            destino.cantidadPeajes ??
            0;

        option.dataset.id =
            destino.id ?? "";

        comboRuta.appendChild(
            option
        );
    });

    console.log(
        `Destinos cargados: ${destinos.length}`
    );
}


/* =========================================================
 * CAMBIAR RUTA
 * ========================================================= */

function cambiarRuta() {

    const opcion =
        comboRuta?.options[
            comboRuta.selectedIndex
        ];

    if (!opcion) {

        limpiarDatosDestino();

        return;
    }

    const km =
        parseFloat(
            opcion.dataset.km
        ) || 0;

    const peajes =
        parseInt(
            opcion.dataset.peajes
        ) || 0;

    if (inputKm) {

        inputKm.value =
            km.toFixed(2);
    }

    if (inputCantidadPeajes) {

        inputCantidadPeajes.value =
            peajes;
    }

    console.log(
        "Ruta seleccionada:",
        opcion.textContent
    );

    console.log(
        "KM:",
        km
    );

    console.log(
        "Peajes:",
        peajes
    );

    calcularTodo();
}


/* =========================================================
 * CALCULAR TODO
 * ========================================================= */

function calcularTodo() {

    /*
     * Primero calculamos tarifa.
     */

    calcularTarifa(false);

    /*
     * Después peajes.
     */

    calcularPeajes(false);

    /*
     * Finalmente resumen.
     */

    actualizarResumen();
}


/* =========================================================
 * CALCULAR TARIFA
 *
 * KM × BANDA = SUBTOTAL
 *
 * SUBTOTAL × 15% = ISV
 *
 * SUBTOTAL + ISV = TARIFA
 * ========================================================= */

function calcularTarifa(actualizar = true) {

    const km =
        parseFloat(
            inputKm?.value
        ) || 0;

    const banda =
        parseFloat(
            inputBanda?.value
        ) || 0;

    const subtotal =
        km * banda;

    const isv =
        subtotal * ISV_PORCENTAJE;

    const tarifa =
        subtotal + isv;


    if (inputSubtotal) {

        inputSubtotal.value =
            subtotal.toFixed(2);
    }

    if (inputIsv) {

        inputIsv.value =
            isv.toFixed(2);
    }

    if (inputTarifa) {

        inputTarifa.value =
            tarifa.toFixed(2);
    }


    const subtotalTexto =
        document.getElementById(
            "subtotalTexto"
        );

    if (subtotalTexto) {

        subtotalTexto.textContent =
            formatoMoneda(subtotal);
    }


    const isvTexto =
        document.getElementById(
            "isvTexto"
        );

    if (isvTexto) {

        isvTexto.textContent =
            formatoMoneda(isv);
    }


    const tarifaTexto =
        document.getElementById(
            "tarifaTexto"
        );

    if (tarifaTexto) {

        tarifaTexto.textContent =
            formatoMoneda(tarifa);
    }


    if (actualizar) {

        actualizarResumen();
    }


    return {
        km,
        banda,
        subtotal,
        isv,
        tarifa
    };
}


/* =========================================================
 * CALCULAR PEAJES
 *
 * 2 EJES = L 224.00
 * 3 EJES = L 269.00
 *
 * TOTAL = CANTIDAD × VALOR
 * ========================================================= */

function calcularPeajes(actualizar = true) {

    const cantidad =
        parseInt(
            inputCantidadPeajes?.value
        ) || 0;

    const ejes =
        normalizarEjes(
            comboEjes?.value || ""
        );

    let valorPeaje = 0;


    if (ejes === "2") {

        valorPeaje =
            PEAJE_2_EJES;

    } else if (ejes === "3") {

        valorPeaje =
            PEAJE_3_EJES;
    }


    const total =
        cantidad * valorPeaje;


    if (inputValorPeaje) {

        inputValorPeaje.value =
            valorPeaje.toFixed(2);
    }


    if (inputTotalPeajes) {

        inputTotalPeajes.value =
            total.toFixed(2);
    }


    const totalPeajesTexto =
        document.getElementById(
            "totalPeajesTexto"
        );

    if (totalPeajesTexto) {

        totalPeajesTexto.textContent =
            formatoMoneda(total);
    }


    document
        .querySelectorAll(".toll-option")
        .forEach(elemento => {

            elemento.classList.remove(
                "active"
            );

            if (
                normalizarEjes(
                    elemento.dataset.ejes
                ) === ejes
            ) {

                elemento.classList.add(
                    "active"
                );
            }
        });


    if (actualizar) {

        actualizarResumen();
    }


    return {
        cantidad,
        ejes,
        valorPeaje,
        total
    };
}


/* =========================================================
 * NORMALIZAR EJES
 * ========================================================= */

function normalizarEjes(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";
    }

    const texto =
        String(valor)
            .trim()
            .toLowerCase();

    if (texto.includes("2")) {

        return "2";
    }

    if (texto.includes("3")) {

        return "3";
    }

    return texto;
}


/* =========================================================
 * ACTUALIZAR RESUMEN SUPERIOR
 * ========================================================= */

function actualizarResumen() {

    const km =
        parseFloat(
            inputKm?.value
        ) || 0;

    const subtotal =
        parseFloat(
            inputSubtotal?.value
        ) || 0;

    const banda =
        parseFloat(
            inputBanda?.value
        ) || 0;

    const totalPeajes =
        parseFloat(
            inputTotalPeajes?.value
        ) || 0;


    const resumenKm =
        document.getElementById(
            "resumenKm"
        );

    const resumenSubtotal =
        document.getElementById(
            "resumenSubtotal"
        );

    const resumenBanda =
        document.getElementById(
            "resumenBanda"
        );

    const resumenPeajes =
        document.getElementById(
            "resumenPeajes"
        );

    const bandaVigenteTexto =
        document.getElementById(
            "bandaVigenteTexto"
        );


    if (resumenKm) {

        resumenKm.textContent =
            `${formatoNumero(km)} km`;
    }


    if (resumenSubtotal) {

        resumenSubtotal.textContent =
            formatoMoneda(subtotal);
    }


    if (resumenBanda) {

        resumenBanda.textContent =
            `L ${formatoNumero(banda)} / km`;
    }


    if (bandaVigenteTexto) {

        bandaVigenteTexto.textContent =
            `L ${formatoNumero(banda)} / km`;
    }


    if (resumenPeajes) {

        resumenPeajes.textContent =
            formatoMoneda(totalPeajes);
    }
}


/* =========================================================
 * LIMPIAR DATOS DEL DESTINO
 * ========================================================= */

function limpiarDatosDestino() {

    if (inputKm) {

        inputKm.value =
            "0.00";
    }

    if (inputCantidadPeajes) {

        inputCantidadPeajes.value =
            "0";
    }

    calcularTodo();
}


/* =========================================================
 * FORMATO NUMÉRICO
 * ========================================================= */

function formatoNumero(valor) {

    const numero =
        parseFloat(valor) || 0;

    return numero.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


/* =========================================================
 * FORMATO MONEDA
 * ========================================================= */

function formatoMoneda(valor) {

    const numero =
        parseFloat(valor) || 0;

    return `L ${numero.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}


/* =========================================================
 * VALIDAR FORMULARIO
 * ========================================================= */

async function validarFormulario(event) {

    event.preventDefault();


    /* =====================================================
     * FECHA
     * ===================================================== */

    if (
        !inputFecha ||
        !inputFecha.value
    ) {

        mostrarModalError(
            "Debe seleccionar una fecha."
        );

        inputFecha?.focus();

        return false;
    }


    /* =====================================================
     * MOTORISTA
     * ===================================================== */

    if (
        !comboMotorista ||
        !comboMotorista.value
    ) {

        mostrarModalError(
            "Debe seleccionar un motorista."
        );

        comboMotorista?.focus();

        return false;
    }


    /* =====================================================
     * UNIDAD
     * ===================================================== */

    if (
        !comboUnidad ||
        !comboUnidad.value
    ) {

        mostrarModalError(
            "Debe seleccionar una unidad."
        );

        comboUnidad?.focus();

        return false;
    }


    /* =====================================================
     * EJES
     * ===================================================== */

    if (
        !comboEjes ||
        !comboEjes.value
    ) {

        mostrarModalError(
            "Debe seleccionar los ejes del camión."
        );

        comboEjes?.focus();

        return false;
    }


    /* =====================================================
     * RUTA
     * ===================================================== */

    if (
        !comboRuta ||
        !comboRuta.value
    ) {

        mostrarModalError(
            "Debe seleccionar una ruta o destino."
        );

        comboRuta?.focus();

        return false;
    }


    /* =====================================================
     * BANDA
     * ===================================================== */

    const banda =
        parseFloat(
            inputBanda?.value
        ) || 0;

    if (banda <= 0) {

        mostrarModalError(
            "Debe ingresar una banda por KM mayor que 0."
        );

        inputBanda?.focus();

        return false;
    }


    /* =====================================================
     * RECALCULAR ANTES DE GUARDAR
     * ===================================================== */

    calcularTodo();


    console.log(
        "Formulario listo:",
        obtenerDatosFormulario()
    );


    /* =====================================================
     * SI ESTAMOS EDITANDO
     *
     * MOSTRAR MODAL DE CONFIRMACIÓN
     * ===================================================== */

    if (
        recorridoEditandoId !== null &&
        recorridoEditandoId !== undefined
    ) {

        const modal =
            obtenerModal("modalEditar");

        if (modal) {

            modal.show();

        } else {

            console.error(
                "No se encontró #modalEditar"
            );
        }

        return false;
    }


    /* =====================================================
     * NUEVO RECORRIDO
     *
     * GUARDAR DIRECTAMENTE
     * ===================================================== */

    await guardarRecorrido();

    return true;
}


/* =========================================================
 * OBTENER DATOS DEL FORMULARIO
 * ========================================================= */

function obtenerDatosFormulario() {

    return {

        fecha:
            inputFecha?.value || null,

        motorista:
            comboMotorista?.value || null,

        unidad:
            comboUnidad?.value || null,

        ejesCamion:
            comboEjes?.value
                ? parseInt(
                    normalizarEjes(
                        comboEjes.value
                    )
                )
                : null,

        rutaDestino:
            comboRuta?.value || null,

        kmRecorridos:
            parseFloat(
                inputKm?.value
            ) || 0,

        remision:
            inputRemision?.value || "",

        bandaPorKm:
            parseFloat(
                inputBanda?.value
            ) || 0,

        cantidadPeajes:
            parseInt(
                inputCantidadPeajes?.value
            ) || 0,

        subtotal:
            parseFloat(
                inputSubtotal?.value
            ) || 0,

        isv:
            parseFloat(
                inputIsv?.value
            ) || 0,

        tarifa:
            parseFloat(
                inputTarifa?.value
            ) || 0,

        valorPeaje:
            parseFloat(
                inputValorPeaje?.value
            ) || 0,

        totalPeajes:
            parseFloat(
                inputTotalPeajes?.value
            ) || 0
    };
}


/* =========================================================
 * GUARDAR RECORRIDO
 *
 * POST /api/recorridos
 * ========================================================= */

async function guardarRecorrido() {

    const btnGuardar =
        document.getElementById(
            "btnGuardar"
        );

    const datos =
        obtenerDatosFormulario();


    if (btnGuardar) {

        btnGuardar.disabled =
            true;

        btnGuardar.dataset.textoOriginal =
            btnGuardar.innerHTML;

        btnGuardar.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    }


    console.log(
        "Enviando recorrido:",
        datos
    );


    try {

        const respuesta =
            await fetch(
                URL_RECORRIDOS,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        if (!respuesta.ok) {

            throw await construirErrorRespuesta(
                respuesta
            );
        }


        let recorridoGuardado = null;

        const texto =
            await respuesta.text();


        if (texto) {

            try {

                recorridoGuardado =
                    JSON.parse(texto);

            } catch (error) {

                console.warn(
                    "Respuesta no JSON:",
                    texto
                );
            }
        }


        console.log(
            "Recorrido guardado:",
            recorridoGuardado
        );


        recorridoEditandoId =
            null;


        cambiarModoFormulario(
            false
        );


        limpiarFormularioSinConfirmar();


        await cargarRecorridos();


        mostrarModalExito(
            "El recorrido se guardó correctamente."
        );


    } catch (error) {

        console.error(
            "Error guardando recorrido:",
            error
        );


        mostrarModalError(
            "No se pudo guardar el recorrido.\n\n" +
            error.message
        );


    } finally {

        if (btnGuardar) {

            btnGuardar.disabled =
                false;

            btnGuardar.innerHTML =
                btnGuardar.dataset.textoOriginal ||
                '<i class="bi bi-save"></i> Guardar';
        }
    }
}


/* =========================================================
 * EDITAR RECORRIDO
 * ========================================================= */

function editarRecorrido(id) {

    if (
        id === null ||
        id === undefined
    ) {

        mostrarModalError(
            "No se encontró el ID del recorrido."
        );

        return;
    }


    const recorrido =
        recorridosBD.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!recorrido) {

        mostrarModalError(
            "No se encontró el recorrido seleccionado."
        );

        return;
    }


    console.log(
        "Editando recorrido:",
        recorrido
    );


    recorridoEditandoId =
        id;


    /* =====================================================
     * FECHA
     * ===================================================== */

    if (inputFecha) {

        inputFecha.value =
            convertirFechaParaInput(
                recorrido.fecha
            );
    }


    /* =====================================================
     * MOTORISTA
     * ===================================================== */

    seleccionarValor(
        comboMotorista,
        recorrido.motorista
    );


    /* =====================================================
     * UNIDAD
     * ===================================================== */

    seleccionarValor(
        comboUnidad,
        recorrido.unidad
    );


    /* =====================================================
     * EJES
     * ===================================================== */

    if (comboEjes) {

        comboEjes.value =
            normalizarEjes(
                recorrido.ejesCamion
            );
    }


    /* =====================================================
     * RUTA
     * ===================================================== */

    seleccionarValor(
        comboRuta,
        recorrido.rutaDestino
    );


    /* =====================================================
     * KM
     * ===================================================== */

    if (inputKm) {

        inputKm.value =
            (
                parseFloat(
                    recorrido.kmRecorridos
                ) || 0
            ).toFixed(2);
    }


    /* =====================================================
     * REMISIÓN
     * ===================================================== */

    if (inputRemision) {

        inputRemision.value =
            recorrido.remision ?? "";
    }


    /* =====================================================
     * BANDA
     * ===================================================== */

    if (inputBanda) {

        inputBanda.value =
            (
                parseFloat(
                    recorrido.bandaPorKm
                ) || 0
            ).toFixed(2);
    }


    /* =====================================================
     * PEAJES
     * ===================================================== */

    if (inputCantidadPeajes) {

        inputCantidadPeajes.value =
            parseInt(
                recorrido.cantidadPeajes
            ) || 0;
    }


    /* =====================================================
     * RECALCULAR
     * ===================================================== */

    calcularTodo();


    cambiarModoFormulario(
        true
    );


    /* =====================================================
     * LLEVAR AL FORMULARIO
     * ===================================================== */

    if (formViaje) {

        formViaje.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


/* =========================================================
 * ACTUALIZAR RECORRIDO
 *
 * PUT /api/recorridos/{id}
 * ========================================================= */

async function actualizarRecorrido() {

    if (
        recorridoEditandoId === null ||
        recorridoEditandoId === undefined
    ) {

        return;
    }


    const btnConfirmarEditar =
        document.getElementById(
            "btnConfirmarEditar"
        );


    const datos =
        obtenerDatosFormulario();


    const url =
        `${URL_RECORRIDOS}/${encodeURIComponent(
            recorridoEditandoId
        )}`;


    console.log(
        "Actualizando recorrido:",
        url,
        datos
    );


    if (btnConfirmarEditar) {

        btnConfirmarEditar.disabled =
            true;

        btnConfirmarEditar.dataset.textoOriginal =
            btnConfirmarEditar.innerHTML;

        btnConfirmarEditar.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    }


    try {

        const respuesta =
            await fetch(
                url,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        if (!respuesta.ok) {

            throw await construirErrorRespuesta(
                respuesta
            );
        }


        let resultado = null;

        const texto =
            await respuesta.text();


        if (texto) {

            try {

                resultado =
                    JSON.parse(texto);

            } catch (error) {

                console.warn(
                    "Respuesta no JSON:",
                    texto
                );
            }
        }


        console.log(
            "Recorrido actualizado:",
            resultado
        );


        /*
         * Cerramos modal de edición.
         */

        cerrarModal(
            "modalEditar"
        );


        /*
         * Limpiamos estado.
         */

        recorridoEditandoId =
            null;


        cambiarModoFormulario(
            false
        );


        limpiarFormularioSinConfirmar();


        /*
         * Recargamos tabla.
         */

        await cargarRecorridos();


        /*
         * Mostramos éxito.
         */

        mostrarModalExito(
            "El recorrido se actualizó correctamente."
        );


    } catch (error) {

        console.error(
            "Error actualizando recorrido:",
            error
        );


        cerrarModal(
            "modalEditar"
        );


        mostrarModalError(
            "No se pudo actualizar el recorrido.\n\n" +
            error.message
        );


    } finally {

        if (btnConfirmarEditar) {

            btnConfirmarEditar.disabled =
                false;

            btnConfirmarEditar.innerHTML =
                btnConfirmarEditar.dataset.textoOriginal ||
                '<i class="bi bi-check2-circle me-2"></i>Guardar cambios';
        }
    }
}


/* =========================================================
 * SOLICITAR ELIMINACIÓN
 *
 * Abre el modal y guarda el ID.
 * ========================================================= */

function eliminarRecorrido(id) {

    if (
        id === null ||
        id === undefined
    ) {

        mostrarModalError(
            "No se encontró el ID del recorrido."
        );

        return;
    }


    const recorrido =
        recorridosBD.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!recorrido) {

        mostrarModalError(
            "No se encontró el recorrido seleccionado."
        );

        return;
    }


    recorridoEliminarId =
        id;


    console.log(
        "Recorrido pendiente de eliminar:",
        recorrido
    );


    const modal =
        obtenerModal(
            "modalEliminar"
        );


    if (modal) {

        modal.show();

    } else {

        mostrarModalError(
            "No se pudo abrir el modal de eliminación."
        );
    }
}


/* =========================================================
 * EJECUTAR ELIMINACIÓN
 *
 * DELETE /api/recorridos/{id}
 * ========================================================= */

async function ejecutarEliminarRecorrido() {

    if (
        recorridoEliminarId === null ||
        recorridoEliminarId === undefined
    ) {

        mostrarModalError(
            "No se encontró el recorrido que deseas eliminar."
        );

        return;
    }


    const id =
        recorridoEliminarId;


    const btnConfirmarEliminar =
        document.getElementById(
            "btnConfirmarEliminar"
        );


    const url =
        `${URL_RECORRIDOS}/${encodeURIComponent(
            id
        )}`;


    console.log(
        "Eliminando recorrido:",
        url
    );


    if (btnConfirmarEliminar) {

        btnConfirmarEliminar.disabled =
            true;

        btnConfirmarEliminar.dataset.textoOriginal =
            btnConfirmarEliminar.innerHTML;

        btnConfirmarEliminar.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2"></span>Eliminando...';
    }


    try {

        const respuesta =
            await fetch(
                url,
                {
                    method: "DELETE",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!respuesta.ok) {

            throw await construirErrorRespuesta(
                respuesta
            );
        }


        console.log(
            "Recorrido eliminado correctamente."
        );


        /*
         * Cerramos modal.
         */

        cerrarModal(
            "modalEliminar"
        );


        /*
         * Si estábamos editando
         * el mismo recorrido.
         */

        if (
            String(recorridoEditandoId) ===
            String(id)
        ) {

            recorridoEditandoId =
                null;

            cambiarModoFormulario(
                false
            );

            limpiarFormularioSinConfirmar();
        }


        /*
         * Limpiar ID pendiente.
         */

        recorridoEliminarId =
            null;


        /*
         * Recargar tabla.
         */

        await cargarRecorridos();


        /*
         * Mostrar éxito.
         */

        mostrarModalExito(
            "El recorrido se eliminó correctamente."
        );


    } catch (error) {

        console.error(
            "Error eliminando recorrido:",
            error
        );


        cerrarModal(
            "modalEliminar"
        );


        mostrarModalError(
            "No se pudo eliminar el recorrido.\n\n" +
            error.message
        );


    } finally {

        if (btnConfirmarEliminar) {

            btnConfirmarEliminar.disabled =
                false;

            btnConfirmarEliminar.innerHTML =
                btnConfirmarEliminar.dataset.textoOriginal ||
                '<i class="bi bi-trash3 me-2"></i>Eliminar recorrido';
        }
    }
}


/* =========================================================
 * CONSTRUIR ERROR DE RESPUESTA
 * ========================================================= */

async function construirErrorRespuesta(
    respuesta
) {

    let mensaje =
        `HTTP ${respuesta.status}`;


    try {

        const texto =
            await respuesta.text();


        if (texto) {

            try {

                const error =
                    JSON.parse(texto);


                mensaje =
                    error.message ??
                    error.error ??
                    error.mensaje ??
                    texto;

            } catch (e) {

                mensaje =
                    texto;
            }
        }

    } catch (e) {

        console.error(
            "No se pudo leer respuesta de error:",
            e
        );
    }


    return new Error(
        mensaje
    );
}


/* =========================================================
 * CAMBIAR MODO DEL FORMULARIO
 * ========================================================= */

function cambiarModoFormulario(
    editando
) {

    const btnGuardar =
        document.getElementById(
            "btnGuardar"
        );

    const btnCancelar =
        document.getElementById(
            "btnCancelar"
        );


    if (btnGuardar) {

        if (editando) {

            btnGuardar.innerHTML =
                '<i class="bi bi-check-circle"></i> Actualizar';

            btnGuardar.classList.remove(
                "btn-success"
            );

            btnGuardar.classList.add(
                "btn-warning"
            );

        } else {

            btnGuardar.innerHTML =
                '<i class="bi bi-save"></i> Guardar';

            btnGuardar.classList.remove(
                "btn-warning"
            );

            btnGuardar.classList.add(
                "btn-success"
            );
        }
    }


    if (btnCancelar) {

        if (editando) {

            btnCancelar.style.display =
                "";

        } else {

            btnCancelar.style.display =
                "";
        }
    }
}


/* =========================================================
 * SELECCIONAR VALOR DE UN SELECT
 * ========================================================= */

function seleccionarValor(
    select,
    valor
) {

    if (!select) {
        return;
    }


    if (
        valor === null ||
        valor === undefined
    ) {

        return;
    }


    const valorTexto =
        String(valor).trim();


    /*
     * Coincidencia exacta por value.
     */

    let encontrado =
        Array.from(
            select.options
        ).find(
            option =>
                String(option.value)
                    .trim()
                    .toLowerCase() ===
                valorTexto.toLowerCase()
        );


    /*
     * Si no existe, buscamos
     * por texto visible.
     */

    if (!encontrado) {

        encontrado =
            Array.from(
                select.options
            ).find(
                option =>
                    String(option.textContent)
                        .trim()
                        .toLowerCase() ===
                    valorTexto.toLowerCase()
            );
    }


    if (encontrado) {

        select.value =
            encontrado.value;
    }
}


/* =========================================================
 * CONVERTIR FECHA PARA INPUT DATE
 * ========================================================= */

function convertirFechaParaInput(
    fecha
) {

    if (!fecha) {

        return "";
    }


    const texto =
        String(fecha);


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            texto
        )
    ) {

        return texto;
    }


    if (
        texto.includes("T")
    ) {

        return texto
            .split("T")[0];
    }


    const partes =
        texto.split("/");


    if (
        partes.length === 3 &&
        partes[0].length === 2
    ) {

        return (
            `${partes[2]}-` +
            `${partes[1]}-` +
            `${partes[0]}`
        );
    }


    return texto;
}


/* =========================================================
 * DESTINOS.JS
 * CONTROL DE RECORRIDOS, FILTROS, TABLA Y PAGINACIÓN
 * ========================================================= */


/* =========================================================
 * VARIABLES DE FILTRO
 * ========================================================= */

let filtrosAplicados = {
    texto: "",
    fechaDesde: "",
    fechaHasta: ""
};


/* =========================================================
 * CARGAR RECORRIDOS DESDE BD
 *
 * GET /api/recorridos
 * ========================================================= */

async function cargarRecorridos() {

    try {

        console.log("Cargando recorridos desde BD...");

        const respuesta = await fetch(
            URL_RECORRIDOS,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!respuesta.ok) {

            throw new Error(
                `HTTP ${respuesta.status}`
            );
        }

        const datos = await respuesta.json();

        if (Array.isArray(datos)) {

            recorridosBD = datos;

        } else {

            recorridosBD = [];
        }

        console.log(
            "Recorridos cargados:",
            recorridosBD
        );

        paginaActual = 1;

        renderizarRecorridos();

    } catch (error) {

        console.error(
            "Error cargando recorridos:",
            error
        );

        recorridosBD = [];

        renderizarRecorridos();
    }
}


/* =========================================================
 * INICIALIZAR FILTROS
 * ========================================================= */

function inicializarFiltrosRecorridos() {

    const buscador =
        document.getElementById(
            "buscadorViajes"
        );

    const fechaDesde =
        document.getElementById(
            "fechaDesde"
        );

    const fechaHasta =
        document.getElementById(
            "fechaHasta"
        );

    const btnAplicar =
        document.getElementById(
            "btnAplicarFiltros"
        );

    const btnLimpiar =
        document.getElementById(
            "btnLimpiarFiltros"
        );


    /* =====================================================
     * BUSCADOR
     *
     * Al escribir se aplica automáticamente.
     * ===================================================== */

    if (buscador) {

        buscador.addEventListener(
            "input",
            function () {

                filtrosAplicados.texto =
                    this.value
                        .trim()
                        .toLowerCase();

                paginaActual = 1;

                renderizarRecorridos();
            }
        );
    }


    /* =====================================================
     * BOTÓN APLICAR
     * ===================================================== */

    if (btnAplicar) {

        btnAplicar.addEventListener(
            "click",
            function () {

                aplicarFiltros();
            }
        );
    }


    /* =====================================================
     * BOTÓN LIMPIAR
     * ===================================================== */

    if (btnLimpiar) {

        btnLimpiar.addEventListener(
            "click",
            function () {

                limpiarFiltros();
            }
        );
    }


    /* =====================================================
     * ENTER EN BUSCADOR
     * ===================================================== */

    if (buscador) {

        buscador.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    aplicarFiltros();
                }
            }
        );
    }
}


/* =========================================================
 * APLICAR FILTROS
 * ========================================================= */

function aplicarFiltros() {

    const buscador =
        document.getElementById(
            "buscadorViajes"
        );

    const fechaDesde =
        document.getElementById(
            "fechaDesde"
        );

    const fechaHasta =
        document.getElementById(
            "fechaHasta"
        );


    const texto =
        buscador
            ? buscador.value
                .trim()
                .toLowerCase()
            : "";


    const desde =
        fechaDesde
            ? fechaDesde.value
            : "";


    const hasta =
        fechaHasta
            ? fechaHasta.value
            : "";


    /* =====================================================
     * VALIDAR RANGO
     * ===================================================== */

    if (
        desde &&
        hasta &&
        desde > hasta
    ) {

        mostrarMensajeError(
            "La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'."
        );

        return;
    }


    filtrosAplicados = {

        texto: texto,

        fechaDesde: desde,

        fechaHasta: hasta
    };


    paginaActual = 1;

    renderizarRecorridos();
}


/* =========================================================
 * LIMPIAR FILTROS
 * ========================================================= */

function limpiarFiltros() {

    const buscador =
        document.getElementById(
            "buscadorViajes"
        );

    const fechaDesde =
        document.getElementById(
            "fechaDesde"
        );

    const fechaHasta =
        document.getElementById(
            "fechaHasta"
        );


    if (buscador) {

        buscador.value = "";
    }


    if (fechaDesde) {

        fechaDesde.value = "";
    }


    if (fechaHasta) {

        fechaHasta.value = "";
    }


    filtrosAplicados = {

        texto: "",

        fechaDesde: "",

        fechaHasta: ""
    };


    paginaActual = 1;

    renderizarRecorridos();
}


/* =========================================================
 * OBTENER RECORRIDOS FILTRADOS
 * ========================================================= */

function obtenerRecorridosFiltrados() {

    if (
        !Array.isArray(recorridosBD)
    ) {

        return [];
    }


    const textoBusqueda =
        filtrosAplicados.texto
            .trim()
            .toLowerCase();


    const fechaDesde =
        filtrosAplicados.fechaDesde;


    const fechaHasta =
        filtrosAplicados.fechaHasta;


    return recorridosBD.filter(
        recorrido => {

            /* =============================================
             * FILTRO DE TEXTO
             * ============================================= */

            if (textoBusqueda) {

                const texto =
                    construirTextoBusqueda(
                        recorrido
                    );

                if (
                    !texto.includes(
                        textoBusqueda
                    )
                ) {

                    return false;
                }
            }


            /* =============================================
             * FECHA DEL RECORRIDO
             * ============================================= */

            const fechaRecorrido =
                obtenerFechaISO(
                    recorrido.fecha
                );


            /* =============================================
             * FECHA DESDE
             * ============================================= */

            if (
                fechaDesde &&
                fechaRecorrido
            ) {

                if (
                    fechaRecorrido <
                    fechaDesde
                ) {

                    return false;
                }
            }


            /* =============================================
             * FECHA HASTA
             * ============================================= */

            if (
                fechaHasta &&
                fechaRecorrido
            ) {

                if (
                    fechaRecorrido >
                    fechaHasta
                ) {

                    return false;
                }
            }


            return true;
        }
    );
}


/* =========================================================
 * NORMALIZAR FECHA A YYYY-MM-DD
 * ========================================================= */

function obtenerFechaISO(
    fecha
) {

    if (!fecha) {

        return "";
    }


    let texto =
        String(fecha)
            .trim();


    /*
     * ISO:
     * 2026-01-25
     */

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            texto
        )
    ) {

        return texto;
    }


    /*
     * ISO con hora:
     * 2026-01-25T00:00:00
     */

    if (
        texto.includes("T")
    ) {

        return texto
            .split("T")[0];
    }


    /*
     * Fecha DD/MM/YYYY
     */

    const formatoLatino =
        texto.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );


    if (formatoLatino) {

        return (
            `${formatoLatino[3]}-` +
            `${formatoLatino[2]}-` +
            `${formatoLatino[1]}`
        );
    }


    return "";
}


/* =========================================================
 * RENDERIZAR RECORRIDOS
 * ========================================================= */

function renderizarRecorridos() {

    const tbody =
        document.getElementById(
            "tablaViajesBody"
        );


    if (!tbody) {

        console.warn(
            "No existe #tablaViajesBody"
        );

        return;
    }


    tbody.innerHTML = "";


    /* =====================================================
     * OBTENER FILTRADOS
     * ===================================================== */

    const recorridosFiltrados =
        obtenerRecorridosFiltrados();


    const totalRegistros =
        recorridosFiltrados.length;


    /* =====================================================
     * SIN RESULTADOS
     * ===================================================== */

    if (
        totalRegistros === 0
    ) {

        const fila =
            document.createElement("tr");


        const celda =
            document.createElement("td");


        celda.colSpan = 13;

        celda.className =
            "text-center py-5";


        celda.innerHTML = `
            <i class="bi bi-inbox fs-2 d-block mb-2"></i>
            No se encontraron recorridos.
        `;


        fila.appendChild(
            celda
        );


        tbody.appendChild(
            fila
        );


        actualizarContadorTabla(
            0,
            0
        );


        actualizarTotalesRecorridos(
            []
        );


        generarPaginacion(
            1
        );


        return;
    }


    /* =====================================================
     * CALCULAR PAGINACIÓN
     * ===================================================== */

    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                totalRegistros /
                REGISTROS_POR_PAGINA
            )
        );


    if (
        paginaActual < 1
    ) {

        paginaActual = 1;
    }


    if (
        paginaActual >
        totalPaginas
    ) {

        paginaActual =
            totalPaginas;
    }


    const inicio =
        (
            paginaActual - 1
        ) *
        REGISTROS_POR_PAGINA;


    const fin =
        inicio +
        REGISTROS_POR_PAGINA;


    const recorridosPagina =
        recorridosFiltrados.slice(
            inicio,
            fin
        );


    /* =====================================================
     * CREAR FILAS
     * ===================================================== */

    recorridosPagina.forEach(
        recorrido => {

            const fila =
                crearFilaRecorrido(
                    recorrido
                );


            tbody.appendChild(
                fila
            );
        }
    );


    /* =====================================================
     * CONTADORES
     * ===================================================== */

    actualizarContadorTabla(
        recorridosPagina.length,
        totalRegistros
    );


    /* =====================================================
     * TOTALES
     *
     * IMPORTANTE:
     * Los totales corresponden a TODOS los registros
     * filtrados, no solamente a la página actual.
     * ===================================================== */

    actualizarTotalesRecorridos(
        recorridosFiltrados
    );


    /* =====================================================
     * PAGINACIÓN
     * ===================================================== */

    generarPaginacion(
        totalPaginas
    );
}


/* =========================================================
 * TEXTO PARA BUSCADOR
 * ========================================================= */

function construirTextoBusqueda(
    recorrido
) {

    return [

        recorrido.id,

        recorrido.fecha,

        recorrido.motorista,

        recorrido.unidad,

        recorrido.rutaDestino,

        recorrido.ruta,

        recorrido.destino,

        recorrido.remision,

        recorrido.kmRecorridos,

        recorrido.kilometros,

        recorrido.bandaPorKm,

        recorrido.banda,

        recorrido.cantidadPeajes,

        recorrido.ejesCamion,

        recorrido.ejes,

        recorrido.subtotal,

        recorrido.isv,

        recorrido.tarifa,

        recorrido.valorPeaje,

        recorrido.totalPeajes

    ]
        .filter(
            valor =>
                valor !== null &&
                valor !== undefined
        )
        .join(" ")
        .toLowerCase();
}


/* =========================================================
 * CREAR FILA DE RECORRIDO
 *
 * COLUMNAS:
 *
 * 0  FECHA
 * 1  MOTORISTA
 * 2  UNIDAD
 * 3  DESTINO
 * 4  REMISION
 * 5  KM
 * 6  SUBTOTAL
 * 7  ISV
 * 8  TARIFA
 * 9  PEAJES
 * 10 VALOR PEAJE
 * 11 TOTAL PEAJES
 * 12 ACCIONES
 * ========================================================= */

function crearFilaRecorrido(
    recorrido
) {

    const fila =
        document.createElement("tr");


    if (
        recorrido.id !== null &&
        recorrido.id !== undefined
    ) {

        fila.id =
            `fila-${recorrido.id}`;
    }


    const fecha =
        formatearFecha(
            recorrido.fecha
        );


    const motorista =
        recorrido.motorista ??
        "";


    const unidad =
        recorrido.unidad ??
        "";


    const destino =
        recorrido.rutaDestino ??
        recorrido.ruta ??
        recorrido.destino ??
        "";


    const remision =
        recorrido.remision ??
        "";


    const km =
        parseFloat(
            recorrido.kmRecorridos ??
            recorrido.kilometros
        ) || 0;


    const subtotal =
        parseFloat(
            recorrido.subtotal
        ) || 0;


    const isv =
        parseFloat(
            recorrido.isv
        ) || 0;


    const tarifa =
        parseFloat(
            recorrido.tarifa
        ) || 0;


    const cantidadPeajes =
        parseInt(
            recorrido.cantidadPeajes
        ) || 0;


    const valorPeaje =
        parseFloat(
            recorrido.valorPeaje
        ) || 0;


    const totalPeajes =
        parseFloat(
            recorrido.totalPeajes
        ) || 0;


    /* =====================================================
     * COLUMNAS
     * ===================================================== */

    agregarCelda(
        fila,
        fecha
    );


    agregarCelda(
        fila,
        motorista
    );


    agregarCelda(
        fila,
        unidad
    );


    agregarCelda(
        fila,
        destino
    );


    agregarCelda(
        fila,
        remision
    );


    agregarCelda(
        fila,
        formatoNumero(km)
    );


    agregarCelda(
        fila,
        formatoMoneda(subtotal)
    );


    agregarCelda(
        fila,
        formatoMoneda(isv)
    );


    agregarCelda(
        fila,
        formatoMoneda(tarifa)
    );


    agregarCelda(
        fila,
        cantidadPeajes
    );


    agregarCelda(
        fila,
        formatoMoneda(valorPeaje)
    );


    agregarCelda(
        fila,
        formatoMoneda(totalPeajes)
    );


    /* =====================================================
     * ACCIONES
     * ===================================================== */

    const tdAcciones =
        document.createElement("td");


    const contenedor =
        document.createElement("div");


    contenedor.className =
        "d-flex gap-2";


    /* =====================================================
     * EDITAR
     * ===================================================== */

    const btnEditar =
        document.createElement("button");


    btnEditar.type =
        "button";


    btnEditar.className =
        "btn btn-sm btn-outline-primary btn-editar-viaje";


    btnEditar.title =
        "Editar";


    btnEditar.innerHTML =
        '<i class="bi bi-pencil"></i>';


    btnEditar.addEventListener(
        "click",
        () => {

            editarRecorrido(
                recorrido.id
            );
        }
    );


    /* =====================================================
     * ELIMINAR
     * ===================================================== */

    const btnEliminar =
        document.createElement("button");


    btnEliminar.type =
        "button";


    btnEliminar.className =
        "btn btn-sm btn-outline-danger btn-eliminar-viaje";


    btnEliminar.title =
        "Eliminar";


    btnEliminar.innerHTML =
        '<i class="bi bi-trash"></i>';


    btnEliminar.addEventListener(
        "click",
        () => {

            eliminarRecorrido(
                recorrido.id
            );
        }
    );


    contenedor.appendChild(
        btnEditar
    );


    contenedor.appendChild(
        btnEliminar
    );


    tdAcciones.appendChild(
        contenedor
    );


    fila.appendChild(
        tdAcciones
    );


    return fila;
}


/* =========================================================
 * AGREGAR CELDA
 * ========================================================= */

function agregarCelda(
    fila,
    valor
) {

    const td =
        document.createElement("td");


    td.textContent =
        valor ?? "";


    fila.appendChild(
        td
    );
}


/* =========================================================
 * FORMATEAR FECHA
 * ========================================================= */

function formatearFecha(
    fecha
) {

    if (!fecha) {

        return "";
    }


    const texto =
        String(fecha);


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            texto
        )
    ) {

        const partes =
            texto.split("-");


        return (
            `${partes[2]}/` +
            `${partes[1]}/` +
            `${partes[0]}`
        );
    }


    if (
        texto.includes("T")
    ) {

        return formatearFecha(
            texto.split("T")[0]
        );
    }


    return texto;
}


/* =========================================================
 * ACTUALIZAR TABLA
 * ========================================================= */

function actualizarTabla() {

    renderizarRecorridos();
}


/* =========================================================
 * ACTUALIZAR CONTADORES
 * ========================================================= */

function actualizarContadorTabla(
    mostrados,
    totales
) {

    const registrosMostrados =
        document.getElementById(
            "registrosMostrados"
        );


    const registrosTotales =
        document.getElementById(
            "registrosTotales"
        );


    if (registrosMostrados) {

        registrosMostrados.textContent =
            mostrados;
    }


    if (registrosTotales) {

        registrosTotales.textContent =
            totales;
    }
}


/* =========================================================
 * ACTUALIZAR TOTALES DESDE OBJETOS BD
 * ========================================================= */

function actualizarTotalesRecorridos(
    recorridos
) {

    let totalKm = 0;

    let totalSubtotal = 0;

    let totalIsv = 0;

    let totalTarifa = 0;

    let totalPeajes = 0;


    if (
        !Array.isArray(recorridos)
    ) {

        recorridos = [];
    }


    recorridos.forEach(
        recorrido => {

            totalKm +=
                parseFloat(
                    recorrido.kmRecorridos ??
                    recorrido.kilometros
                ) || 0;


            totalSubtotal +=
                parseFloat(
                    recorrido.subtotal
                ) || 0;


            totalIsv +=
                parseFloat(
                    recorrido.isv
                ) || 0;


            totalTarifa +=
                parseFloat(
                    recorrido.tarifa
                ) || 0;


            totalPeajes +=
                parseFloat(
                    recorrido.totalPeajes
                ) || 0;
        }
    );


    colocarTotalesTabla(
        totalKm,
        totalSubtotal,
        totalIsv,
        totalTarifa,
        totalPeajes
    );
}


/* =========================================================
 * COLOCAR TOTALES
 * ========================================================= */

function colocarTotalesTabla(
    totalKm,
    totalSubtotal,
    totalIsv,
    totalTarifa,
    totalPeajes
) {

    const totalKmTabla =
        document.getElementById(
            "totalKmTabla"
        );


    const totalSubtotalTabla =
        document.getElementById(
            "totalSubtotalTabla"
        );


    const totalIsvTabla =
        document.getElementById(
            "totalIsvTabla"
        );


    const totalTarifaTabla =
        document.getElementById(
            "totalTarifaTabla"
        );


    const totalPeajesTabla =
        document.getElementById(
            "totalPeajesTabla"
        );


    if (totalKmTabla) {

        totalKmTabla.textContent =
            formatoNumero(totalKm);
    }


    if (totalSubtotalTabla) {

        totalSubtotalTabla.textContent =
            formatoMoneda(
                totalSubtotal
            );
    }


    if (totalIsvTabla) {

        totalIsvTabla.textContent =
            formatoMoneda(
                totalIsv
            );
    }


    if (totalTarifaTabla) {

        totalTarifaTabla.textContent =
            formatoMoneda(
                totalTarifa
            );
    }


    if (totalPeajesTabla) {

        totalPeajesTabla.textContent =
            formatoMoneda(
                totalPeajes
            );
    }


    /* =====================================================
     * RESUMEN SUPERIOR
     * ===================================================== */

    const resumenKm =
        document.getElementById(
            "resumenKm"
        );


    const resumenSubtotal =
        document.getElementById(
            "resumenSubtotal"
        );


    const resumenPeajes =
        document.getElementById(
            "resumenPeajes"
        );


    if (resumenKm) {

        resumenKm.textContent =
            `${formatoNumero(totalKm)} km`;
    }


    if (resumenSubtotal) {

        resumenSubtotal.textContent =
            formatoMoneda(
                totalSubtotal
            );
    }


    if (resumenPeajes) {

        resumenPeajes.textContent =
            formatoMoneda(
                totalPeajes
            );
    }
}


/* =========================================================
 * ACTUALIZAR TOTALES DE FILAS HTML
 * ========================================================= */

function actualizarTotalesTabla(
    filas
) {

    let totalKm = 0;

    let totalSubtotal = 0;

    let totalIsv = 0;

    let totalTarifa = 0;

    let totalPeajes = 0;


    if (!filas) {

        filas = [];
    }


    filas.forEach(
        fila => {

            const celdas =
                fila.querySelectorAll(
                    "td"
                );


            if (
                celdas.length < 12
            ) {

                return;
            }


            totalKm +=
                obtenerNumeroCelda(
                    celdas[5]
                );


            totalSubtotal +=
                obtenerNumeroCelda(
                    celdas[6]
                );


            totalIsv +=
                obtenerNumeroCelda(
                    celdas[7]
                );


            totalTarifa +=
                obtenerNumeroCelda(
                    celdas[8]
                );


            totalPeajes +=
                obtenerNumeroCelda(
                    celdas[11]
                );
        }
    );


    colocarTotalesTabla(
        totalKm,
        totalSubtotal,
        totalIsv,
        totalTarifa,
        totalPeajes
    );
}


/* =========================================================
 * OBTENER NÚMERO DE UNA CELDA
 * ========================================================= */

function obtenerNumeroCelda(
    celda
) {

    if (!celda) {

        return 0;
    }


    let texto =
        celda.textContent
            .trim()
            .replace(/L/g, "")
            .replace(/,/g, "")
            .trim();


    const numero =
        parseFloat(texto);


    return isNaN(numero)
        ? 0
        : numero;
}


/* =========================================================
 * MOSTRAR ERROR
 *
 * Usa el modal de error que ya existe en tu HTML.
 * ========================================================= */

function mostrarMensajeError(
    mensaje
) {

    const elemento =
        document.getElementById(
            "mensajeError"
        );


    if (elemento) {

        elemento.textContent =
            mensaje;
    }


    const modalElemento =
        document.getElementById(
            "modalError"
        );


    if (
        modalElemento &&
        typeof bootstrap !== "undefined"
    ) {

        const modal =
            bootstrap.Modal.getOrCreateInstance(
                modalElemento
            );


        modal.show();

    } else {

        alert(mensaje);
    }
}


/* =========================================================
 * INICIALIZACIÓN
 * ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        inicializarFiltrosRecorridos();

        cargarRecorridos();
    }
);

/* =========================================================
 * GENERAR PAGINACIÓN
 * ========================================================= */

function generarPaginacion(
    totalPaginas
) {

    const paginacion =
        document.getElementById(
            "paginacionViajes"
        );


    if (!paginacion) {

        return;
    }


    paginacion.innerHTML =
        "";


    if (
        totalPaginas <= 1
    ) {

        return;
    }


    /* =====================================================
     * ANTERIOR
     * ===================================================== */

    const liAnterior =
        document.createElement(
            "li"
        );


    liAnterior.className =
        `page-item ${
            paginaActual === 1
                ? "disabled"
                : ""
        }`;


    liAnterior.innerHTML = `
        <button
            type="button"
            class="page-link">
            <i class="bi bi-chevron-left"></i>
        </button>
    `;


    if (
        paginaActual > 1
    ) {

        liAnterior
            .querySelector("button")
            .addEventListener(
                "click",
                () => {

                    paginaActual--;

                    actualizarTabla();

                }
            );
    }


    paginacion.appendChild(
        liAnterior
    );


    /* =====================================================
     * NÚMEROS
     * ===================================================== */

    for (
        let i = 1;
        i <= totalPaginas;
        i++
    ) {

        const li =
            document.createElement(
                "li"
            );


        li.className =
            `page-item ${
                i === paginaActual
                    ? "active"
                    : ""
            }`;


        li.innerHTML = `
            <button
                type="button"
                class="page-link">
                ${i}
            </button>
        `;


        li.querySelector(
            "button"
        ).addEventListener(
            "click",
            () => {

                paginaActual =
                    i;

                actualizarTabla();

            }
        );


        paginacion.appendChild(
            li
        );
    }


    /* =====================================================
     * SIGUIENTE
     * ===================================================== */

    const liSiguiente =
        document.createElement(
            "li"
        );


    liSiguiente.className =
        `page-item ${
            paginaActual === totalPaginas
                ? "disabled"
                : ""
        }`;


    liSiguiente.innerHTML = `
        <button
            type="button"
            class="page-link">
            <i class="bi bi-chevron-right"></i>
        </button>
    `;


    if (
        paginaActual <
        totalPaginas
    ) {

        liSiguiente
            .querySelector("button")
            .addEventListener(
                "click",
                () => {

                    paginaActual++;

                    actualizarTabla();

                }
            );
    }


    paginacion.appendChild(
        liSiguiente
    );
}


/* =========================================================
 * LIMPIAR FORMULARIO SIN CONFIRMACIÓN
 * ========================================================= */

function limpiarFormularioSinConfirmar() {

    if (!formViaje) {

        return;
    }


    formViaje.reset();


    recorridoEditandoId =
        null;


    recorridoEliminarId =
        null;


    if (inputKm) {

        inputKm.value =
            "0.00";
    }


    if (inputCantidadPeajes) {

        inputCantidadPeajes.value =
            "0";
    }


    if (inputValorPeaje) {

        inputValorPeaje.value =
            "0.00";
    }


    if (inputTotalPeajes) {

        inputTotalPeajes.value =
            "0.00";
    }


    if (inputSubtotal) {

        inputSubtotal.value =
            "0.00";
    }


    if (inputIsv) {

        inputIsv.value =
            "0.00";
    }


    if (inputTarifa) {

        inputTarifa.value =
            "0.00";
    }


    const subtotalTexto =
        document.getElementById(
            "subtotalTexto"
        );


    const isvTexto =
        document.getElementById(
            "isvTexto"
        );


    const tarifaTexto =
        document.getElementById(
            "tarifaTexto"
        );


    const totalPeajesTexto =
        document.getElementById(
            "totalPeajesTexto"
        );


    if (subtotalTexto) {

        subtotalTexto.textContent =
            "L 0.00";
    }


    if (isvTexto) {

        isvTexto.textContent =
            "L 0.00";
    }


    if (tarifaTexto) {

        tarifaTexto.textContent =
            "L 0.00";
    }


    if (totalPeajesTexto) {

        totalPeajesTexto.textContent =
            "L 0.00";
    }


    document
        .querySelectorAll(".toll-option")
        .forEach(
            elemento => {

                elemento.classList.remove(
                    "active"
                );
            }
        );


    establecerFechaActual();


    cambiarModoFormulario(
        false
    );


    calcularTodo();
}


/* =========================================================
 * LIMPIAR FORMULARIO
 * ========================================================= */

function limpiarFormulario() {

    if (!formViaje) {

        return;
    }


    /*
     * Si estamos editando,
     * simplemente cancelamos edición.
     */

    if (
        recorridoEditandoId !== null &&
        recorridoEditandoId !== undefined
    ) {

        cerrarModal(
            "modalEditar"
        );

        recorridoEditandoId =
            null;

        limpiarFormularioSinConfirmar();

        return;
    }


    limpiarFormularioSinConfirmar();
}


/* =========================================================
 * FUNCIONES GLOBALES
 * ========================================================= */

window.cargarDestinos =
    cargarDestinos;

window.cargarMotoristas =
    cargarMotoristas;

window.cargarUnidades =
    cargarUnidades;

window.cargarRecorridos =
    cargarRecorridos;

window.guardarRecorrido =
    guardarRecorrido;

window.editarRecorrido =
    editarRecorrido;

window.actualizarRecorrido =
    actualizarRecorrido;

window.eliminarRecorrido =
    eliminarRecorrido;

window.ejecutarEliminarRecorrido =
    ejecutarEliminarRecorrido;

window.calcularTodo =
    calcularTodo;

window.calcularTarifa =
    calcularTarifa;

window.calcularPeajes =
    calcularPeajes;

window.actualizarResumen =
    actualizarResumen;

window.actualizarTabla =
    actualizarTabla;

window.limpiarFormulario =
    limpiarFormulario;

window.mostrarModalExito =
    mostrarModalExito;

window.mostrarModalError =
    mostrarModalError;

	
	
	/* =========================================================
	 * EXPORTAR RECORRIDOS COMPLETOS A PDF
	 *
	 * IMPORTANTE:
	 * Este PDF NO utiliza las filas visibles de la tabla HTML.
	 * Utiliza directamente recorridosBD para evitar el problema
	 * de la paginación.
	 * ========================================================= */

	document.addEventListener("DOMContentLoaded", function () {

	    const btnPDF =
	        document.getElementById("btnExportarPDF");

	    if (!btnPDF) {

	        console.warn(
	            "No se encontró el botón btnExportarPDF"
	        );

	        return;
	    }

	    btnPDF.addEventListener(
	        "click",
	        exportarPDF
	    );

	});


	/* =========================================================
	 * FUNCIÓN PRINCIPAL
	 * ========================================================= */

	function exportarPDF() {

	    /* =====================================================
	     * VALIDAR jsPDF
	     * ===================================================== */

	    if (
	        typeof window.jspdf === "undefined" ||
	        typeof window.jspdf.jsPDF === "undefined"
	    ) {

	        alert(
	            "No se pudo cargar la librería PDF."
	        );

	        return;
	    }


	    if (
	        typeof window.jspdf.jsPDF !== "function"
	    ) {

	        alert(
	            "La librería jsPDF no está disponible correctamente."
	        );

	        return;
	    }


	    const {
	        jsPDF
	    } = window.jspdf;


	    /* =====================================================
	     * VALIDAR autoTable
	     * ===================================================== */

	    if (
	        typeof jsPDF.API.autoTable !== "function"
	    ) {

	        alert(
	            "No se pudo cargar el complemento AutoTable para PDF."
	        );

	        return;
	    }


	    /* =====================================================
	     * VALIDAR DATOS
	     * ===================================================== */

	    if (
	        !Array.isArray(recorridosBD)
	    ) {

	        alert(
	            "No existen recorridos cargados para generar el PDF."
	        );

	        return;
	    }


	    /* =====================================================
	     * OBTENER FILTROS DE FECHA
	     * ===================================================== */

	    const fechaDesdeElement =
	        document.getElementById(
	            "fechaDesde"
	        );

	    const fechaHastaElement =
	        document.getElementById(
	            "fechaHasta"
	        );


	    const fechaDesde =
	        fechaDesdeElement
	            ? fechaDesdeElement.value
	            : "";


	    const fechaHasta =
	        fechaHastaElement
	            ? fechaHastaElement.value
	            : "";


	    /* =====================================================
	     * VALIDAR RANGO
	     * ===================================================== */

	    if (
	        fechaDesde &&
	        fechaHasta &&
	        fechaDesde > fechaHasta
	    ) {

	        alert(
	            "La fecha inicial no puede ser mayor que la fecha final."
	        );

	        return;
	    }


	    /* =====================================================
	     * OBTENER TEXTO DEL BUSCADOR
	     * ===================================================== */

	    const buscador =
	        document.getElementById(
	            "buscadorViajes"
	        );


	    const textoBusqueda =
	        buscador
	            ? buscador.value
	                .trim()
	                .toLowerCase()
	            : "";


	    /* =====================================================
	     * FILTRAR DIRECTAMENTE LOS DATOS DE BD
	     * ===================================================== */

	    const recorridosPDF =
	        recorridosBD.filter(
	            recorrido => {

	                /* =========================================
	                 * FILTRO DE FECHA
	                 * ========================================= */

	                const fecha =
	                    convertirFechaBD(
	                        recorrido.fecha
	                    );


	                if (
	                    fechaDesde &&
	                    fecha < fechaDesde
	                ) {

	                    return false;
	                }


	                if (
	                    fechaHasta &&
	                    fecha > fechaHasta
	                ) {

	                    return false;
	                }


	                /* =========================================
	                 * FILTRO DEL BUSCADOR
	                 * ========================================= */

	                if (
	                    textoBusqueda
	                ) {

	                    const texto =
	                        construirTextoBusqueda(
	                            recorrido
	                        );


	                    if (
	                        !texto.includes(
	                            textoBusqueda
	                        )
	                    ) {

	                        return false;
	                    }
	                }


	                return true;
	            }
	        );


	    /* =====================================================
	     * VALIDAR RESULTADOS
	     * ===================================================== */

	    if (
	        recorridosPDF.length === 0
	    ) {

	        alert(
	            "No existen recorridos que coincidan con los filtros seleccionados."
	        );

	        return;
	    }


	    /* =====================================================
	     * CREAR PDF
	     * ===================================================== */

	    const doc =
	        new jsPDF({

	            orientation: "landscape",

	            unit: "mm",

	            format: "legal"
	        });


	    /* =====================================================
	     * INFORMACIÓN DEL DOCUMENTO
	     * ===================================================== */

	    const anchoPagina =
	        doc.internal.pageSize.getWidth();


	    const altoPagina =
	        doc.internal.pageSize.getHeight();


	    /* =====================================================
	     * ENCABEZADO PROFESIONAL
	     * ===================================================== */

	    doc.setFillColor(
	        31,
	        41,
	        55
	    );


	    doc.rect(
	        0,
	        0,
	        anchoPagina,
	        30,
	        "F"
	    );


	    /* =====================================================
	     * TÍTULO
	     * ===================================================== */

	    doc.setTextColor(
	        255,
	        255,
	        255
	    );


	    doc.setFont(
	        "helvetica",
	        "bold"
	    );


	    doc.setFontSize(
	        18
	    );


	    doc.text(
	        "CONTROL DE RUTAS Y PEAJES",
	        15,
	        13
	    );


	    /* =====================================================
	     * SUBTÍTULO
	     * ===================================================== */

	    doc.setFont(
	        "helvetica",
	        "normal"
	    );


	    doc.setFontSize(
	        9
	    );


	    doc.text(
	        "Reporte detallado de recorridos",
	        15,
	        20
	    );


	    /* =====================================================
	     * CANTIDAD DE REGISTROS
	     * ===================================================== */

	    doc.setFontSize(
	        9
	    );


	    doc.text(
	        `Registros: ${recorridosPDF.length}`,
	        anchoPagina - 65,
	        13
	    );


	    /* =====================================================
	     * RANGO DE FECHAS
	     * ===================================================== */

	    let textoRango =
	        "Todos los registros";


	    if (
	        fechaDesde &&
	        fechaHasta
	    ) {

	        textoRango =
	            `${formatearFechaPDF(fechaDesde)} al ${formatearFechaPDF(fechaHasta)}`;

	    }

	    else if (
	        fechaDesde
	    ) {

	        textoRango =
	            `Desde ${formatearFechaPDF(fechaDesde)}`;

	    }

	    else if (
	        fechaHasta
	    ) {

	        textoRango =
	            `Hasta ${formatearFechaPDF(fechaHasta)}`;
	    }


	    doc.setFontSize(
	        8
	    );


	    doc.text(
	        `Periodo: ${textoRango}`,
	        anchoPagina - 95,
	        20
	    );


	    /* =====================================================
	     * FECHA DE GENERACIÓN
	     * ===================================================== */

	    const ahora =
	        new Date();


	    const fechaGeneracion =
	        ahora.toLocaleDateString(
	            "es-HN"
	        );


	    const horaGeneracion =
	        ahora.toLocaleTimeString(
	            "es-HN",
	            {
	                hour: "2-digit",
	                minute: "2-digit"
	            }
	        );


	    doc.setTextColor(
	        80,
	        80,
	        80
	    );


	    doc.setFontSize(
	        8
	    );


	    doc.text(
	        `Generado: ${fechaGeneracion} ${horaGeneracion}`,
	        15,
	        37
	    );


	    /* =====================================================
	     * CONSTRUIR DATOS PARA TABLA
	     * ===================================================== */

	    const datos =
	        recorridosPDF.map(
	            recorrido => {

	                const fecha =
	                    formatearFecha(
	                        recorrido.fecha
	                    );


	                const motorista =
	                    recorrido.motorista ?? "";


	                const unidad =
	                    recorrido.unidad ?? "";


	                const destino =
	                    recorrido.rutaDestino ?? "";


	                const remision =
	                    recorrido.remision ?? "";


	                const km =
	                    parseFloat(
	                        recorrido.kmRecorridos
	                    ) || 0;


	                const subtotal =
	                    parseFloat(
	                        recorrido.subtotal
	                    ) || 0;


	                const isv =
	                    parseFloat(
	                        recorrido.isv
	                    ) || 0;


	                const tarifa =
	                    parseFloat(
	                        recorrido.tarifa
	                    ) || 0;


	                const cantidadPeajes =
	                    parseInt(
	                        recorrido.cantidadPeajes
	                    ) || 0;


	                const valorPeaje =
	                    parseFloat(
	                        recorrido.valorPeaje
	                    ) || 0;


	                const totalPeajes =
	                    parseFloat(
	                        recorrido.totalPeajes
	                    ) || 0;


	                return [

	                    fecha,

	                    motorista,

	                    unidad,

	                    destino,

	                    remision,

	                    formatoNumeroPDF(km),

	                    formatoMonedaPDF(subtotal),

	                    formatoMonedaPDF(isv),

	                    formatoMonedaPDF(tarifa),

	                    cantidadPeajes,

	                    formatoMonedaPDF(valorPeaje),

	                    formatoMonedaPDF(totalPeajes)
	                ];
	            }
	        );


	    /* =====================================================
	     * CALCULAR TOTALES GENERALES
	     * ===================================================== */

	    let totalKm = 0;

	    let totalSubtotal = 0;

	    let totalIsv = 0;

	    let totalTarifa = 0;

	    let totalPeajes = 0;

	    let totalCantidadPeajes = 0;


	    recorridosPDF.forEach(
	        recorrido => {

	            totalKm +=
	                parseFloat(
	                    recorrido.kmRecorridos
	                ) || 0;


	            totalSubtotal +=
	                parseFloat(
	                    recorrido.subtotal
	                ) || 0;


	            totalIsv +=
	                parseFloat(
	                    recorrido.isv
	                ) || 0;


	            totalTarifa +=
	                parseFloat(
	                    recorrido.tarifa
	                ) || 0;


	            totalPeajes +=
	                parseFloat(
	                    recorrido.totalPeajes
	                ) || 0;


	            totalCantidadPeajes +=
	                parseInt(
	                    recorrido.cantidadPeajes
	                ) || 0;
	        }
	    );


	    /* =====================================================
	     * TOTAL GENERAL
	     *
	     * SUBTOTAL
	     * + TARIFA
	     * + IMPUESTOS
	     * + PEAJES
	     * ===================================================== */

	    const totalGeneral =
	        totalSubtotal +
	        totalTarifa +
	        totalIsv +
	        totalPeajes;


	    /* =====================================================
	     * FILA DE TOTALES
	     * ===================================================== */

	    const filaTotales = [

	        {
	            content: "TOTAL GENERAL",
	            colSpan: 5,
	            styles: {
	                halign: "right",
	                fontStyle: "bold"
	            }
	        },

	        {
	            content:
	                formatoNumeroPDF(
	                    totalKm
	                ),
	            styles: {
	                halign: "right",
	                fontStyle: "bold"
	            }
	        },

	        {
	            content:
	                formatoMonedaPDF(
	                    totalSubtotal
	                ),
	            styles: {
	                halign: "right",
	                fontStyle: "bold"
	            }
	        },

	        {
	            content:
	                formatoMonedaPDF(
	                    totalIsv
	                ),
	            styles: {
	                halign: "right",
	                fontStyle: "bold"
	            }
	        },

	        {
	            content:
	                formatoMonedaPDF(
	                    totalTarifa
	                ),
	            styles: {
	                halign: "right",
	                fontStyle: "bold"
	            }
	        },

	        {
	            content:
	                String(
	                    totalCantidadPeajes
	                ),
	            styles: {
	                halign: "center",
	                fontStyle: "bold"
	            }
	        },

	        {
	            content: "—",
	            styles: {
	                halign: "right",
	                fontStyle: "bold"
	            }
	        },

	        {
	            content:
	                formatoMonedaPDF(
	                    totalPeajes
	                ),
	            styles: {
	                halign: "right",
	                fontStyle: "bold"
	            }
	        }
	    ];


	    /* =====================================================
	     * GENERAR TABLA
	     * ===================================================== */

	    doc.autoTable({

	        startY: 42,

	        head: [[

	            "FECHA",
	            "MOTORISTA",
	            "UNIDAD",
	            "DESTINO",
	            "REMISIÓN",
	            "KM",
	            "SUBTOTAL",
	            "ISV",
	            "TARIFA",
	            "PEAJES",
	            "VALOR PEAJE",
	            "TOTAL PEAJES"

	        ]],

	        body: datos,

	        foot: [
	            filaTotales
	        ],

	        theme: "grid",

	        margin: {

	            top: 42,

	            right: 10,

	            bottom: 15,

	            left: 10
	        },

	        styles: {

	            font: "helvetica",

	            fontSize: 7,

	            cellPadding: 1.8,

	            lineWidth: 0.15,

	            overflow: "linebreak",

	            valign: "middle",

	            textColor: [
	                40,
	                40,
	                40
	            ]
	        },

	        headStyles: {

	            fontSize: 7,

	            fontStyle: "bold",

	            halign: "center",

	            valign: "middle",

	            textColor: [
	                255,
	                255,
	                255
	            ],

	            fillColor: [
	                31,
	                41,
	                55
	            ],

	            lineWidth: 0.2
	        },

	        footStyles: {

	            fontSize: 7,

	            fontStyle: "bold",

	            textColor: [
	                255,
	                255,
	                255
	            ],

	            fillColor: [
	                55,
	                65,
	                81
	            ],

	            lineWidth: 0.25
	        },

	        alternateRowStyles: {

	            fillColor: [
	                248,
	                250,
	                252
	            ]
	        },

	        columnStyles: {

	            0: {
	                cellWidth: 21,
	                halign: "center"
	            },

	            1: {
	                cellWidth: 32
	            },

	            2: {
	                cellWidth: 20
	            },

	            3: {
	                cellWidth: 35
	            },

	            4: {
	                cellWidth: 24
	            },

	            5: {
	                cellWidth: 15,
	                halign: "right"
	            },

	            6: {
	                cellWidth: 25,
	                halign: "right"
	            },

	            7: {
	                cellWidth: 20,
	                halign: "right"
	            },

	            8: {
	                cellWidth: 24,
	                halign: "right"
	            },

	            9: {
	                cellWidth: 16,
	                halign: "center"
	            },

	            10: {
	                cellWidth: 25,
	                halign: "right"
	            },

	            11: {
	                cellWidth: 28,
	                halign: "right"
	            }
	        },


	        /* =================================================
	         * PIE DE PÁGINA
	         * ================================================= */

	        didDrawPage: function () {

	            const pagina =
	                doc.internal.getNumberOfPages();


	            const ancho =
	                doc.internal.pageSize.getWidth();


	            const alto =
	                doc.internal.pageSize.getHeight();


	            doc.setDrawColor(
	                200,
	                200,
	                200
	            );


	            doc.setLineWidth(
	                0.2
	            );


	            doc.line(
	                10,
	                alto - 12,
	                ancho - 10,
	                alto - 12
	            );


	            doc.setFont(
	                "helvetica",
	                "normal"
	            );


	            doc.setFontSize(
	                7
	            );


	            doc.setTextColor(
	                100,
	                100,
	                100
	            );


	            doc.text(
	                "Control de Rutas y Peajes",
	                10,
	                alto - 7
	            );


	            doc.text(
	                `Página ${pagina}`,
	                ancho - 28,
	                alto - 7
	            );
	        }

	    });


	    /* =====================================================
	     * RESUMEN FINANCIERO
	     * FORMATO FACTURA
	     *
	     * ALINEADO A LA IZQUIERDA
	     * ===================================================== */

	    let finalY =
	        doc.lastAutoTable.finalY + 10;


	    /* =====================================================
	     * VERIFICAR ESPACIO
	     * ===================================================== */

	    if (
	        finalY >
	        altoPagina - 75
	    ) {

	        doc.addPage();

	        finalY = 20;
	    }


	    /* =====================================================
	     * DIMENSIONES DEL RESUMEN
	     * ===================================================== */

	    const anchoFactura =
	        95;


	    const altoFila =
	        9;


	    /*
	     * IMPORTANTE:
	     *
	     * El resumen tipo factura queda alineado
	     * completamente a la izquierda de la página.
	     *
	     * Antes estaba calculado así:
	     *
	     * anchoPagina - anchoFactura - 10
	     *
	     * lo cual lo colocaba a la derecha.
	     *
	     * Ahora utilizamos directamente 10 mm.
	     */

	    const xFactura = 10;


	    /* =====================================================
	     * TÍTULO
	     * ===================================================== */

	    doc.setTextColor(
	        31,
	        41,
	        55
	    );


	    doc.setFont(
	        "helvetica",
	        "bold"
	    );


	    doc.setFontSize(
	        11
	    );


	    doc.text(
	        "RESUMEN FINANCIERO",
	        xFactura,
	        finalY
	    );


	    /* =====================================================
	     * ENCABEZADO DE FACTURA
	     * ===================================================== */

	    const yTabla =
	        finalY + 5;


	    doc.setFillColor(
	        31,
	        41,
	        55
	    );


	    doc.setDrawColor(
	        31,
	        41,
	        55
	    );


	    doc.rect(
	        xFactura,
	        yTabla,
	        anchoFactura,
	        altoFila,
	        "FD"
	    );


	    doc.setTextColor(
	        255,
	        255,
	        255
	    );


	    doc.setFont(
	        "helvetica",
	        "bold"
	    );


	    doc.setFontSize(
	        7
	    );


	    doc.text(
	        "CONCEPTO",
	        xFactura + 4,
	        yTabla + 6
	    );


	    doc.text(
	        "VALOR",
	        xFactura + anchoFactura - 4,
	        yTabla + 6,
	        {
	            align: "right"
	        }
	    );


	    /* =====================================================
	     * FILAS DEL RESUMEN
	     * ===================================================== */

	    const filasResumen = [

	        {
	            concepto: "Subtotal",
	            valor: totalSubtotal
	        },

	        {
	            concepto: "Tarifa",
	            valor: totalTarifa
	        },

	        {
	            concepto: "Impuestos",
	            valor: totalIsv
	        },

	        {
	            concepto: "Peajes",
	            valor: totalPeajes
	        }
	    ];


	    let yFila =
	        yTabla + altoFila;


	    filasResumen.forEach(
	        (fila, index) => {

	            /* =============================================
	             * FILA ALTERNADA
	             * ============================================= */

	            if (
	                index % 2 === 0
	            ) {

	                doc.setFillColor(
	                    248,
	                    250,
	                    252
	                );

	            }

	            else {

	                doc.setFillColor(
	                    255,
	                    255,
	                    255
	                );
	            }


	            doc.setDrawColor(
	                210,
	                214,
	                220
	            );


	            doc.rect(
	                xFactura,
	                yFila,
	                anchoFactura,
	                altoFila,
	                "FD"
	            );


	            /* =============================================
	             * CONCEPTO
	             * ============================================= */

	            doc.setTextColor(
	                60,
	                60,
	                60
	            );


	            doc.setFont(
	                "helvetica",
	                "normal"
	            );


	            doc.setFontSize(
	                8
	            );


	            doc.text(
	                fila.concepto,
	                xFactura + 4,
	                yFila + 6
	            );


	            /* =============================================
	             * VALOR
	             * ============================================= */

	            doc.text(
	                formatoMonedaPDF(
	                    fila.valor
	                ),
	                xFactura + anchoFactura - 4,
	                yFila + 6,
	                {
	                    align: "right"
	                }
	            );


	            yFila +=
	                altoFila;
	        }
	    );


	    /* =====================================================
	     * LÍNEA ANTES DEL TOTAL
	     * ===================================================== */

	    doc.setDrawColor(
	        31,
	        41,
	        55
	    );


	    doc.setLineWidth(
	        0.5
	    );


	    doc.line(
	        xFactura,
	        yFila,
	        xFactura + anchoFactura,
	        yFila
	    );


	    /* =====================================================
	     * TOTAL GENERAL
	     * ===================================================== */

	    doc.setFillColor(
	        31,
	        41,
	        55
	    );


	    doc.setDrawColor(
	        31,
	        41,
	        55
	    );


	    doc.rect(
	        xFactura,
	        yFila,
	        anchoFactura,
	        12,
	        "FD"
	    );


	    doc.setTextColor(
	        255,
	        255,
	        255
	    );


	    doc.setFont(
	        "helvetica",
	        "bold"
	    );


	    doc.setFontSize(
	        9
	    );


	    doc.text(
	        "TOTAL",
	        xFactura + 4,
	        yFila + 8
	    );


	    doc.setFontSize(
	        10
	    );


	    doc.text(
	        formatoMonedaPDF(
	            totalGeneral
	        ),
	        xFactura + anchoFactura - 4,
	        yFila + 8,
	        {
	            align: "right"
	        }
	    );


	    /* =====================================================
	     * INFORMACIÓN FINAL
	     * ===================================================== */

	    const finalResumenY =
	        yFila + 20;


	    doc.setTextColor(
	        100,
	        100,
	        100
	    );


	    doc.setFont(
	        "helvetica",
	        "normal"
	    );


	    doc.setFontSize(
	        7
	    );


	    doc.text(
	        `Total de recorridos incluidos: ${recorridosPDF.length}`,
	        xFactura,
	        finalResumenY
	    );


	    /* =====================================================
	     * NOMBRE DEL ARCHIVO
	     * ===================================================== */

	    let nombreArchivo =
	        "reporte_rutas_peajes";


	    if (
	        fechaDesde &&
	        fechaHasta
	    ) {

	        nombreArchivo +=
	            `_${fechaDesde}_a_${fechaHasta}`;

	    }

	    else if (
	        fechaDesde
	    ) {

	        nombreArchivo +=
	            `_desde_${fechaDesde}`;

	    }

	    else if (
	        fechaHasta
	    ) {

	        nombreArchivo +=
	            `_hasta_${fechaHasta}`;

	    }

	    else {

	        nombreArchivo +=
	            "_todos";
	    }


	    if (
	        textoBusqueda
	    ) {

	        nombreArchivo +=
	            "_filtrado";
	    }


	    nombreArchivo +=
	        ".pdf";


	    /* =====================================================
	     * GUARDAR PDF
	     * ===================================================== */

	    doc.save(
	        nombreArchivo
	    );
	}


	/* =========================================================
	 * CONVERTIR FECHA DE BD A YYYY-MM-DD
	 * ========================================================= */

	function convertirFechaBD(
	    fecha
	) {

	    if (!fecha) {

	        return "";
	    }


	    const texto =
	        String(fecha)
	            .trim();


	    /* =====================================================
	     * YYYY-MM-DD
	     * ===================================================== */

	    if (
	        /^\d{4}-\d{2}-\d{2}$/.test(
	            texto
	        )
	    ) {

	        return texto;
	    }


	    /* =====================================================
	     * YYYY-MM-DDTHH:mm:ss
	     * ===================================================== */

	    if (
	        texto.includes("T")
	    ) {

	        return convertirFechaBD(
	            texto.split("T")[0]
	        );
	    }


	    /* =====================================================
	     * DD/MM/YYYY
	     * ===================================================== */

	    if (
	        /^\d{2}\/\d{2}\/\d{4}$/.test(
	            texto
	        )
	    ) {

	        const partes =
	            texto.split("/");


	        return (
	            `${partes[2]}-` +
	            `${partes[1]}-` +
	            `${partes[0]}`
	        );
	    }


	    return texto;
	}


	/* =========================================================
	 * FORMATEAR FECHA
	 * ========================================================= */

	function formatearFecha(
	    fecha
	) {

	    if (!fecha) {

	        return "";
	    }


	    const fechaNormalizada =
	        convertirFechaBD(
	            fecha
	        );


	    if (
	        /^\d{4}-\d{2}-\d{2}$/.test(
	            fechaNormalizada
	        )
	    ) {

	        const partes =
	            fechaNormalizada.split("-");


	        return (
	            `${partes[2]}/` +
	            `${partes[1]}/` +
	            `${partes[0]}`
	        );
	    }


	    return String(fecha);
	}


	/* =========================================================
	 * FORMATEAR FECHA PARA PDF
	 * ========================================================= */

	function formatearFechaPDF(
	    fecha
	) {

	    if (!fecha) {

	        return "";
	    }


	    const partes =
	        String(fecha).split("-");


	    if (
	        partes.length !== 3
	    ) {

	        return fecha;
	    }


	    return (
	        `${partes[2]}/` +
	        `${partes[1]}/` +
	        `${partes[0]}`
	    );
	}


	/* =========================================================
	 * FORMATO NÚMERO
	 * ========================================================= */

	function formatoNumeroPDF(
	    valor
	) {

	    const numero =
	        parseFloat(valor) || 0;


	    return numero.toLocaleString(
	        "es-HN",
	        {
	            minimumFractionDigits: 2,
	            maximumFractionDigits: 2
	        }
	    );
	}


	/* =========================================================
	 * FORMATO MONEDA
	 * ========================================================= */

	function formatoMonedaPDF(
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