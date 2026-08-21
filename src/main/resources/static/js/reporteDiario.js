document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    /* =========================================================
       VARIABLES
    ========================================================= */

    let viajeEditando = null;
    let destinoEditando = null;
    let rutaEditando = null;

    let viajeEliminar = null;
    let destinoEliminar = null;
    let rutaEliminar = null;

    let viajesBD = [];
    let destinosBD = [];
    let rutasBD = [];


    /* =========================================================
       UTILIDADES
    ========================================================= */

    function escaparHTML(valor) {

        if (valor === null || valor === undefined) {
            return "";
        }

        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function normalizarTexto(valor) {

        return String(valor || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }


    async function procesarRespuesta(response) {

        const texto = await response.text();

        if (!texto || !texto.trim()) {
            return null;
        }

        try {
            return JSON.parse(texto);
        } catch (error) {
            return texto.trim();
        }
    }


    function obtenerMensajeHTTP(response, datos) {

        if (datos) {

            if (typeof datos === "string") {
                return datos;
            }

            if (datos.message) {
                return datos.message;
            }

            if (datos.mensaje) {
                return datos.mensaje;
            }

            if (datos.error) {
                return datos.error;
            }

            if (datos.detail) {
                return datos.detail;
            }
        }

        switch (response.status) {

            case 400:
                return "Error 400: Los datos enviados no son válidos para el servidor. Verifique los campos obligatorios.";

            case 401:
                return "No tienes autorización para realizar esta operación.";

            case 403:
                return "No tienes permisos para realizar esta operación.";

            case 404:
                return "El registro no existe.";

            case 409:
                return "No se puede realizar la operación porque existe un conflicto.";

            case 500:
                return "Ocurrió un error interno en el servidor.";

            default:
                return "Error del servidor. Código: " + response.status;
        }
    }


    /* =========================================================
       NOTIFICACIONES
    ========================================================= */

    function mostrarMensaje(mensaje, tipo = "success") {

        const alerta = document.createElement("div");

        alerta.className =
            "notificacion-sistema " +
            (
                tipo === "success"
                    ? "notificacion-exito"
                    : "notificacion-error"
            );

        alerta.setAttribute("role", "alert");

        alerta.innerHTML = `

            <div class="notificacion-contenido">

                <div class="notificacion-icono">

                    <i class="fa-solid ${
                        tipo === "success"
                            ? "fa-circle-check"
                            : "fa-circle-exclamation"
                    }"></i>

                </div>

                <div class="notificacion-texto">

                    <strong>
                        ${
                            tipo === "success"
                                ? "Correcto"
                                : "Error"
                        }
                    </strong>

                    <span>
                        ${escaparHTML(mensaje)}
                    </span>

                </div>

            </div>

            <button
                type="button"
                class="notificacion-cerrar"
                aria-label="Cerrar">

                <i class="fa-solid fa-xmark"></i>

            </button>
        `;

        alerta.style.position = "fixed";
        alerta.style.top = "20px";
        alerta.style.right = "20px";
        alerta.style.zIndex = "999999";
        alerta.style.width =
            "min(500px, calc(100vw - 40px))";
        alerta.style.minHeight = "70px";
        alerta.style.padding = "16px 45px 16px 18px";
        alerta.style.borderRadius = "12px";
        alerta.style.boxSizing = "border-box";
        alerta.style.display = "flex";
        alerta.style.alignItems = "center";
        alerta.style.boxShadow =
            "0 10px 30px rgba(0,0,0,0.18)";
        alerta.style.fontFamily = "inherit";

        if (tipo === "success") {

            alerta.style.backgroundColor = "#d1e7dd";
            alerta.style.color = "#0f5132";

        } else {

            alerta.style.backgroundColor = "#f8d7da";
            alerta.style.color = "#842029";
        }

        const cerrar =
            alerta.querySelector(".notificacion-cerrar");

        if (cerrar) {

            cerrar.style.position = "absolute";
            cerrar.style.top = "10px";
            cerrar.style.right = "10px";
            cerrar.style.border = "none";
            cerrar.style.background = "transparent";
            cerrar.style.color = "inherit";
            cerrar.style.cursor = "pointer";
            cerrar.style.fontSize = "16px";

            cerrar.addEventListener("click", function () {
                alerta.remove();
            });
        }

        document.body.appendChild(alerta);

        setTimeout(function () {

            if (alerta && alerta.parentNode) {
                alerta.remove();
            }

        }, 4000);
    }


    /* =========================================================
       BOOTSTRAP
    ========================================================= */

    function obtenerModal(id) {

        const elemento = document.getElementById(id);

        if (!elemento) {
            console.error("No existe el modal:", id);
            return null;
        }

        if (
            typeof bootstrap === "undefined" ||
            !bootstrap.Modal
        ) {
            console.error("Bootstrap no está cargado.");
            return null;
        }

        return bootstrap.Modal.getOrCreateInstance(elemento);
    }


    function abrirModal(id) {

        const modal = obtenerModal(id);

        if (modal) {
            modal.show();
        }
    }


    function cerrarModal(id) {

        const modal = obtenerModal(id);

        if (modal) {
            modal.hide();
        }
    }


    /* =========================================================
       REPARAR MODALES
    ========================================================= */

    function repararModales() {

        const ids = [
            "modalViaje",
            "modalDestino",
            "modalRuta",
            "modalEliminarViaje",
            "modalEliminarDestino",
            "modalEliminarRuta"
        ];

        ids.forEach(function (id) {

            const modal = document.getElementById(id);

            if (!modal) {
                return;
            }

            if (modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }
        });
    }

    repararModales();


    /* =========================================================
       TÍTULO DE MODALES
    ========================================================= */

    function cambiarTituloModal(modal, titulo) {

        if (!modal) {
            return;
        }

        const elemento =
            modal.querySelector(".modal-title");

        if (elemento) {
            elemento.textContent = titulo;
        }
    }


    /* =========================================================
       REFERENCIAS HTML
    ========================================================= */

    const modalViaje =
        document.getElementById("modalViaje");

    const modalDestino =
        document.getElementById("modalDestino");

    const modalRuta =
        document.getElementById("modalRuta");

    const modalEliminarViaje =
        document.getElementById("modalEliminarViaje");

    const modalEliminarDestino =
        document.getElementById("modalEliminarDestino");

    const modalEliminarRuta =
        document.getElementById("modalEliminarRuta");


    const formViaje =
        document.getElementById("formViaje");

    const formDestino =
        document.getElementById("formDestino");

    const formRuta =
        document.getElementById("formRuta");


    /* =========================================================
       FECHAS
    ========================================================= */

    function convertirFechaInput(fecha) {

        if (!fecha) {
            return "";
        }

        const texto = String(fecha);

        if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {

            return texto.substring(0, 10);
        }

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {

            const partes = texto.split("/");

            return (
                partes[2] +
                "-" +
                partes[1] +
                "-" +
                partes[0]
            );
        }

        return "";
    }


    function formatearFecha(fecha) {

        const fechaInput =
            convertirFechaInput(fecha);

        if (!fechaInput) {
            return "";
        }

        const partes =
            fechaInput.split("-");

        return (
            partes[2] +
            "/" +
            partes[1] +
            "/" +
            partes[0]
        );
    }


	/* =========================================================
	   
	   VIAJES / PROGRAMACIONES
	   
	   ========================================================= */


	/* =========================================================
	   
	   VARIABLES PARA CONDUCTORES
	   
	   ========================================================= */

	let conductoresBD = [];


	/* =========================================================
	   
	   VARIABLES PARA ASIGNACIONES
	   
	   ========================================================= */

	let asignacionesBD = [];


	/* =========================================================
	   
	   FUNCIÓN SEGURA PARA SELECCIONAR POR TEXTO
	   
	   ========================================================= */

	function seleccionarPorTexto(select, texto) {

	    if (!select) {
	        return false;
	    }

	    if (
	        texto === undefined ||
	        texto === null ||
	        texto === ""
	    ) {
	        return false;
	    }

	    const textoBuscado =
	        normalizarTexto(String(texto));

	    /*
	     * Si es un SELECT buscamos entre sus opciones.
	     */
	    if (
	        select.tagName &&
	        select.tagName.toUpperCase() === "SELECT"
	    ) {

	        /*
	         * Protección importante:
	         * select.options puede no existir en algún
	         * elemento extraño.
	         */
	        if (
	            !select.options ||
	            typeof select.options.length !== "number"
	        ) {
	            return false;
	        }

	        for (
	            let i = 0;
	            i < select.options.length;
	            i++
	        ) {

	            const option =
	                select.options[i];

	            if (!option) {
	                continue;
	            }

	            const valor =
	                normalizarTexto(
	                    String(
	                        option.value || ""
	                    )
	                );

	            const textoOption =
	                normalizarTexto(
	                    String(
	                        option.textContent || ""
	                    )
	                );

	            if (
	                valor === textoBuscado ||
	                textoOption === textoBuscado
	            ) {

	                select.selectedIndex =
	                    i;

	                /*
	                 * Disparamos change únicamente si
	                 * realmente se seleccionó.
	                 */
	                try {

	                    select.dispatchEvent(
	                        new Event(
	                            "change",
	                            {
	                                bubbles: true
	                            }
	                        )
	                    );

	                }
	                catch (error) {

	                    console.warn(
	                        "No fue posible disparar change:",
	                        error
	                    );

	                }

	                return true;
	            }
	        }

	        return false;
	    }


	    /*
	     * Si NO es SELECT, puede ser input,
	     * textarea u otro campo de texto.
	     */
	    if (
	        "value" in select
	    ) {

	        select.value =
	            String(texto);

	        return true;
	    }


	    return false;
	}


	/* =========================================================
	   
	   FUNCIÓN SEGURA PARA OBTENER VALOR DE CAMPO
	   
	   ========================================================= */

	function obtenerValorCampo(formulario, nombre) {

	    if (!formulario) {
	        return "";
	    }

	    const campo =
	        formulario.querySelector(
	            '[name="' + nombre + '"]'
	        );

	    if (!campo) {
	        return "";
	    }

	    return campo.value || "";
	}


	/* =========================================================
	   
	   CARGAR CONDUCTORES ACTIVOS
	   
	   ========================================================= */

	async function cargarConductoresParaViajes() {

	    const motoristaSelect =
	        formViaje
	            ? formViaje.querySelector(
	                '[name="motorista"]'
	            )
	            : null;

	    if (!motoristaSelect) {

	        console.warn(
	            "No se encontró el combo [name='motorista']."
	        );

	        return;
	    }

	    try {

	        const response =
	            await fetch(
	                "/conductores/api",
	                {
	                    method: "GET",
	                    headers: {
	                        "Accept": "application/json"
	                    },
	                    cache: "no-store"
	                }
	            );


	        if (!response.ok) {

	            throw new Error(
	                "No se pudieron cargar los conductores. Código HTTP: " +
	                response.status
	            );

	        }


	        const datos =
	            await response.json();


	        if (!Array.isArray(datos)) {

	            throw new Error(
	                "El servidor no devolvió una lista válida de conductores."
	            );

	        }


	        conductoresBD =
	            datos;


	        const valorActual =
	            motoristaSelect.value || "";


	        /*
	         * Si es SELECT cargamos opciones.
	         */
	        if (
	            motoristaSelect.tagName &&
	            motoristaSelect.tagName.toUpperCase() ===
	            "SELECT"
	        ) {

	            motoristaSelect.innerHTML = `
	                <option value="">
	                    Seleccione un motorista
	                </option>
	            `;


	            conductoresBD.forEach(
	                function (conductor) {

	                    const nombreCompleto =
	                        (
	                            (conductor.nombre || "") +
	                            " " +
	                            (conductor.apellido || "")
	                        ).trim();


	                    if (!nombreCompleto) {
	                        return;
	                    }


	                    const option =
	                        document.createElement(
	                            "option"
	                        );


	                    option.value =
	                        nombreCompleto;


	                    option.textContent =
	                        nombreCompleto;


	                    if (
	                        conductor.id !== undefined &&
	                        conductor.id !== null
	                    ) {

	                        option.dataset.id =
	                            conductor.id;

	                    }


	                    option.dataset.telefono =
	                        conductor.telefono ||
	                        conductor.celular ||
	                        "";


	                    motoristaSelect.appendChild(
	                        option
	                    );

	                }
	            );


	            if (valorActual) {

	                seleccionarPorTexto(
	                    motoristaSelect,
	                    valorActual
	                );

	            }

	        }


	        console.log(
	            "Conductores cargados:",
	            conductoresBD
	        );

	    }

	    catch (error) {

	        console.error(
	            "Error cargando conductores:",
	            error
	        );


	        if (
	            motoristaSelect.tagName &&
	            motoristaSelect.tagName.toUpperCase() ===
	            "SELECT"
	        ) {

	            motoristaSelect.innerHTML = `
	                <option value="">
	                    No se pudieron cargar los conductores
	                </option>
	            `;

	        }

	    }

	}


	/* =========================================================
	   
	   OBTENER CONDUCTOR POR ID
	   
	   ========================================================= */

	function obtenerConductorPorId(id) {

	    if (
	        id === undefined ||
	        id === null ||
	        id === ""
	    ) {
	        return null;
	    }


	    if (!Array.isArray(conductoresBD)) {
	        return null;
	    }


	    return conductoresBD.find(
	        function (conductor) {

	            return (
	                String(conductor.id) ===
	                String(id)
	            );

	        }
	    ) || null;

	}


	/* =========================================================
	   
	   OBTENER CONDUCTOR SELECCIONADO
	   
	   ========================================================= */

	function obtenerConductorSeleccionado() {

	    const motoristaSelect =
	        formViaje
	            ? formViaje.querySelector(
	                '[name="motorista"]'
	            )
	            : null;


	    if (!motoristaSelect) {
	        return null;
	    }


	    /*
	     * SELECT
	     */
	    if (
	        motoristaSelect.tagName &&
	        motoristaSelect.tagName.toUpperCase() ===
	        "SELECT"
	    ) {

	        if (
	            !motoristaSelect.options ||
	            motoristaSelect.selectedIndex < 0
	        ) {
	            return null;
	        }


	        const option =
	            motoristaSelect.options[
	                motoristaSelect.selectedIndex
	            ];


	        if (!option) {
	            return null;
	        }


	        const id =
	            option.dataset
	                ? option.dataset.id
	                : null;


	        if (
	            id !== undefined &&
	            id !== null &&
	            id !== ""
	        ) {

	            return obtenerConductorPorId(id);

	        }

	    }


	    const nombre =
	        motoristaSelect.value || "";


	    if (!nombre) {
	        return null;
	    }


	    if (!Array.isArray(conductoresBD)) {
	        return null;
	    }


	    return conductoresBD.find(
	        function (conductor) {

	            const nombreCompleto =
	                (
	                    (conductor.nombre || "") +
	                    " " +
	                    (conductor.apellido || "")
	                ).trim();


	            return (
	                normalizarTexto(
	                    nombreCompleto
	                ) ===
	                normalizarTexto(
	                    nombre
	                )
	            );

	        }
	    ) || null;

	}


	/* =========================================================
	   
	   CARGAR ASIGNACIONES DESDE BD
	   
	   ========================================================= */

	async function cargarAsignacionesParaViajes() {

	    try {

	        const response =
	            await fetch(
	                "/asignaciones/lista",
	                {
	                    method: "GET",
	                    headers: {
	                        "Accept": "application/json"
	                    },
	                    cache: "no-store"
	                }
	            );


	        if (!response.ok) {

	            throw new Error(
	                "No se pudieron cargar las asignaciones de camiones. Código HTTP: " +
	                response.status
	            );

	        }


	        const datos =
	            await response.json();


	        if (!Array.isArray(datos)) {

	            throw new Error(
	                "El servidor no devolvió una lista válida de asignaciones."
	            );

	        }


	        asignacionesBD =
	            datos;


	        console.log(
	            "Asignaciones cargadas:",
	            asignacionesBD
	        );

	    }

	    catch (error) {

	        console.error(
	            "Error cargando asignaciones:",
	            error
	        );


	        asignacionesBD = [];

	    }

	}


	/* =========================================================
	   
	   OBTENER ID DEL CONDUCTOR DE UNA ASIGNACIÓN
	   
	   ========================================================= */

	function obtenerIdConductorDeAsignacion(asignacion) {

	    if (!asignacion) {
	        return null;
	    }


	    if (
	        asignacion.conductor &&
	        asignacion.conductor.id !== undefined &&
	        asignacion.conductor.id !== null
	    ) {

	        return asignacion.conductor.id;

	    }


	    if (
	        asignacion.conductorId !== undefined &&
	        asignacion.conductorId !== null
	    ) {

	        return asignacion.conductorId;

	    }


	    if (
	        asignacion.idConductor !== undefined &&
	        asignacion.idConductor !== null
	    ) {

	        return asignacion.idConductor;

	    }


	    if (
	        asignacion.id_conductor !== undefined &&
	        asignacion.id_conductor !== null
	    ) {

	        return asignacion.id_conductor;

	    }


	    return null;

	}


	/* =========================================================
	   
	   OBTENER ESTADO DE ASIGNACIÓN
	   
	   ========================================================= */

	function obtenerEstadoAsignacion(asignacion) {

	    if (!asignacion) {
	        return "";
	    }


	    return String(
	        asignacion.estado ||
	        asignacion.estadoAsignacion ||
	        asignacion.status ||
	        ""
	    )
	        .trim()
	        .toUpperCase();

	}


	/* =========================================================
	   
	   SABER SI UNA ASIGNACIÓN ESTÁ ACTIVA
	   
	   ========================================================= */

	function asignacionEstaActiva(asignacion) {

	    if (!asignacion) {
	        return false;
	    }


	    const estado =
	        obtenerEstadoAsignacion(
	            asignacion
	        );


	    if (!estado) { SweetAlert
	        return true;
	    }


	    return (
	        estado === "ACTIVA" ||
	        estado === "ACTIVO" ||
	        estado === "VIGENTE" ||
	        estado === "ASIGNADO" ||
	        estado === "EN_USO"
	    );

	}


	/* =========================================================
	   
	   OBTENER CAMIÓN DE UNA ASIGNACIÓN
	   
	   ========================================================= */

	function obtenerCamionDeAsignacion(asignacion) {

	    if (!asignacion) {
	        return null;
	    }


	    if (asignacion.camion) {
	        return asignacion.camion;
	    }


	    if (asignacion.camionAsignado) {
	        return asignacion.camionAsignado;
	    }


	    if (asignacion.vehiculo) {
	        return asignacion.vehiculo;
	    }


	    return null;

	}


	/* =========================================================
	   
	   OBTENER PLACA DE UNA ASIGNACIÓN
	   
	   ========================================================= */

	function obtenerPlacaDeAsignacion(asignacion) {

	    if (!asignacion) {
	        return "";
	    }


	    if (asignacion.placa) {

	        return String(
	            asignacion.placa
	        ).trim();

	    }


	    if (
	        asignacion.camion &&
	        asignacion.camion.placa
	    ) {

	        return String(
	            asignacion.camion.placa
	        ).trim();

	    }


	    if (
	        asignacion.camionAsignado &&
	        asignacion.camionAsignado.placa
	    ) {

	        return String(
	            asignacion.camionAsignado.placa
	        ).trim();

	    }


	    if (
	        asignacion.vehiculo &&
	        asignacion.vehiculo.placa
	    ) {

	        return String(
	            asignacion.vehiculo.placa
	        ).trim();

	    }


	    if (asignacion.placaCamion) {

	        return String(
	            asignacion.placaCamion
	        ).trim();

	    }


	    if (asignacion.placaVehiculo) {

	        return String(
	            asignacion.placaVehiculo
	        ).trim();

	    }


	    return "";

	}


	/* =========================================================
	   
	   BUSCAR ASIGNACIÓN ACTIVA DEL CONDUCTOR
	   
	   ========================================================= */

	function buscarAsignacionActivaDelConductor(conductorId) {

	    if (
	        conductorId === undefined ||
	        conductorId === null ||
	        conductorId === "" ||
	        !Array.isArray(asignacionesBD)
	    ) {

	        return null;

	    }


	    const asignacionActiva =
	        asignacionesBD.find(
	            function (asignacion) {

	                const idConductor =
	                    obtenerIdConductorDeAsignacion(
	                        asignacion
	                    );


	                return (
	                    String(idConductor) ===
	                    String(conductorId)
	                ) &&
	                asignacionEstaActiva(
	                    asignacion
	                );

	            }
	        );


	    if (asignacionActiva) {
	        return asignacionActiva;
	    }


	    return asignacionesBD.find(
	        function (asignacion) {

	            const idConductor =
	                obtenerIdConductorDeAsignacion(
	                    asignacion
	                );


	            return (
	                String(idConductor) ===
	                String(conductorId)
	            );

	        }
	    ) || null;

	}


	/* =========================================================
	   
	   OBTENER PLACA DEL CONDUCTOR
	   
	   ========================================================= */

	function obtenerPlacaDelConductor(conductorId) {

	    if (
	        conductorId === undefined ||
	        conductorId === null ||
	        conductorId === ""
	    ) {

	        return "";

	    }


	    const asignacion =
	        buscarAsignacionActivaDelConductor(
	            conductorId
	        );


	    if (!asignacion) {

	        console.warn(
	            "No se encontró asignación para el conductor:",
	            conductorId
	        );

	        return "";

	    }


	    return obtenerPlacaDeAsignacion(
	        asignacion
	    );

	}


	/* =========================================================
	   
	   SELECCIONAR PLACA EN SELECT
	   
	   ========================================================= */

	function seleccionarPlaca(select, placa) {

	    if (
	        !select ||
	        placa === undefined ||
	        placa === null ||
	        placa === ""
	    ) {

	        return false;

	    }


	    const buscada =
	        normalizarTexto(
	            String(placa)
	        );


	    /*
	     * Si es SELECT.
	     */
	    if (
	        select.tagName &&
	        select.tagName.toUpperCase() ===
	        "SELECT"
	    ) {

	        if (
	            !select.options ||
	            typeof select.options.length !== "number"
	        ) {

	            return false;

	        }


	        for (
	            let i = 0;
	            i < select.options.length;
	            i++
	        ) {

	            const option =
	                select.options[i];


	            if (!option) {
	                continue;
	            }


	            const valor =
	                normalizarTexto(
	                    String(
	                        option.value || ""
	                    )
	                );


	            const texto =
	                normalizarTexto(
	                    String(
	                        option.textContent || ""
	                    )
	                );


	            if (
	                valor === buscada ||
	                texto === buscada
	            ) {

	                select.selectedIndex =
	                    i;


	                try {

	                    select.dispatchEvent(
	                        new Event(
	                            "change",
	                            {
	                                bubbles: true
	                            }
	                        )
	                    );

	                }
	                catch (error) {

	                    console.warn(
	                        "No se pudo disparar change de placa:",
	                        error
	                    );

	                }


	                return true;

	            }

	        }


	        /*
	         * Si la placa del viaje ya existe en BD pero
	         * ya no aparece en las opciones actuales,
	         * la agregamos para poder editarla.
	         */
	        const option =
	            document.createElement(
	                "option"
	            );


	        option.value =
	            String(placa);


	        option.textContent =
	            String(placa);


	        option.selected =
	            true;


	        select.appendChild(
	            option
	        );


	        return true;

	    }


	    /*
	     * Si placa es INPUT.
	     */
	    if (
	        "value" in select
	    ) {

	        select.value =
	            String(placa);

	        return true;

	    }


	    return false;

	}


	/* =========================================================
	   
	   RUTAS
	   
	   ========================================================= */


	/* =========================================================
	   
	   CARGAR RUTAS DESDE BD
	   
	   ========================================================= */

	async function cargarRutasDesdeBD() {

	    try {

	        const response =
	            await fetch(
	                "/api/rutas",
	                {
	                    method: "GET",
	                    headers: {
	                        "Accept": "application/json"
	                    },
	                    cache: "no-store"
	                }
	            );


	        const datos =
	            await procesarRespuesta(
	                response
	            );


	        if (!response.ok) {

	            throw new Error(
	                obtenerMensajeHTTP(
	                    response,
                    datos
	                )
	            );

	        }


	        if (!Array.isArray(datos)) {

	            throw new Error(
	                "El servidor no devolvió una lista válida de rutas."
	            );

	        }


	        rutasBD =
	            datos;


	        console.log(
	            "Rutas cargadas desde BD:",
	            rutasBD
	        );


	        pintarTablaRutas(
	            rutasBD
	        );


	        cargarRutasEnDestinoFinal();


	        actualizarContadores();

	    }

	    catch (error) {

	        console.error(
	            "Error cargando rutas:",
	            error
	        );


	        mostrarMensaje(
	            "No fue posible cargar las rutas. " +
	            error.message,
	            "danger"
	        );

	    }

	}


	/* =========================================================
	   
	   CARGAR RUTAS EN COMBO DESTINO FINAL
	   
	   ========================================================= */

	function cargarRutasEnDestinoFinal(valorForzado = null) {

	    const destinoFinal =
	        formViaje
	            ? formViaje.querySelector(
	                '[name="destinoFinal"]'
	            )
	            : document.querySelector(
	                '[name="destinoFinal"]'
	            );


	    if (!destinoFinal) {

	        console.warn(
	            "No se encontró el combo [name='destinoFinal']."
	        );

	        return;

	    }


	    if (
	        !destinoFinal.tagName ||
	        destinoFinal.tagName.toUpperCase() !==
	        "SELECT"
	    ) {

	        console.warn(
	            "El campo destinoFinal no es un <select>."
	        );

	        return;

	    }


	    /*
	     * IMPORTANTE:
	     * Si nos pasan un valor forzado, lo usamos.
	     * De lo contrario usamos el valor actual.
	     */
	    const valorActual =
	        valorForzado !== null &&
	        valorForzado !== undefined
	            ? String(valorForzado)
	            : String(
	                destinoFinal.value || ""
	            );


	    destinoFinal.innerHTML = `
	        <option value="">
	            Seleccione destino final
	        </option>
	    `;


	    if (
	        !Array.isArray(rutasBD) ||
	        rutasBD.length === 0
	    ) {

	        const option =
	            document.createElement(
	                "option"
	            );


	        option.value = "";

	        option.textContent =
	            "No hay rutas registradas";

	        option.disabled =
	            true;


	        destinoFinal.appendChild(
	            option
	        );


	        /*
	         * Si tenemos un valor guardado,
	         * todavía lo agregamos.
	         */
	        if (valorActual) {

	            const guardado =
	                document.createElement(
	                    "option"
	                );


	            guardado.value =
	                valorActual;


	            guardado.textContent =
	                valorActual;


	            guardado.selected =
	                true;


	            destinoFinal.appendChild(
	                guardado
	            );

	        }


	        return;

	    }


	    rutasBD.forEach(
	        function (ruta) {

	            if (!ruta) {
	                return;
	            }


	            const estado =
	                String(
	                    ruta.estado ||
	                    "ACTIVA"
	                )
	                    .trim()
	                    .toUpperCase();


	            if (
	                estado !== "ACTIVA" &&
	                estado !== "ACTIVO" &&
	                estado !== "VIGENTE"
	            ) {

	                return;

	            }


	            const nombreRuta =
	                ruta.destino ||
	                ruta.nombreRuta ||
	                ruta.nombre ||
	                ruta.ruta ||
	                "";


	            if (!nombreRuta) {
	                return;
	            }


	            const option =
	                document.createElement(
	                    "option"
	                );


	            option.value =
	                String(nombreRuta);


	            option.textContent =
	                String(nombreRuta);


	            if (
	                ruta.id !== undefined &&
	                ruta.id !== null
	            ) {

	                option.dataset.id =
	                    ruta.id;

	            }


	            if (ruta.odt) {

	                option.dataset.odt =
	                    ruta.odt;

	            }


	            destinoFinal.appendChild(
	                option
	            );

	        }
	    );


	    /*
	     * Restaurar valor anterior.
	     */
	    if (valorActual) {

	        const seleccionado =
	            seleccionarPorTexto(
	                destinoFinal,
	                valorActual
	            );


	        /*
	         * Si la ruta ya no existe en la BD,
	         * la agregamos para poder editar el viaje.
	         */
	        if (!seleccionado) {

	            const option =
	                document.createElement(
	                    "option"
	                );


	            option.value =
	                valorActual;


	            option.textContent =
	                valorActual;


	            option.selected =
	                true;


	            destinoFinal.appendChild(
	                option
	            );

	        }

	    }


	    console.log(
	        "Combo destino final cargado con rutas:",
	        destinoFinal.options
	            ? destinoFinal.options.length - 1
	            : 0
	    );

	}


	/* =========================================================
	   
	   PINTAR TABLA RUTAS
	   
	   ========================================================= */

	function pintarTablaRutas(rutas) {

	    const tbody =
	        document.querySelector(
	            "#tab-rutas .tabla-rutas tbody"
	        );


	    if (!tbody) {

	        console.warn(
	            "No se encontró #tab-rutas tbody."
	        );

	        return;

	    }


	    tbody.innerHTML = "";


	    if (
	        !Array.isArray(rutas) ||
	        rutas.length === 0
	    ) {

	        tbody.innerHTML = `
	            <tr>
	                <td colspan="4" class="text-center">
	                    No hay rutas registradas.
	                </td>
	            </tr>
	        `;


	        return;

	    }


	    rutas.forEach(
	        function (ruta) {

	            const estado =
	                String(
	                    ruta.estado ||
	                    "ACTIVA"
	                ).toUpperCase();


	            const nombreRuta =
	                ruta.destino ||
	                ruta.nombreRuta ||
	                ruta.nombre ||
	                ruta.ruta ||
	                "";


	            const tiempo =
	                ruta.odt ||
	                ruta.tiempo ||
	                ruta.tiempoPromedio ||
	                "";


	            const clase =
	                estado === "ACTIVA"
	                    ? "activo"
	                    : "inactivo";


	            const textoEstado =
	                estado === "ACTIVA"
	                    ? "Activa"
	                    : "Inactiva";


	            const fila =
	                document.createElement(
	                    "tr"
	                );


	            fila.innerHTML = `
	                <td>
	                    <div class="dato-principal">
	                        <div class="dato-icon ruta-icon">
	                            <i class="fa-solid fa-route"></i>
	                        </div>

	                        <strong>
	                            ${escaparHTML(
	                                nombreRuta
	                            )}
	                        </strong>
	                    </div>
	                </td>

	                <td>
	                    <span class="hora">
	                        <i class="fa-regular fa-clock"></i>
	                        ${escaparHTML(
	                            tiempo
	                        )}
	                    </span>
	                </td>

	                <td>
	                    <span class="estado ${clase}">
	                        <span class="estado-punto"></span>
	                        ${textoEstado}
	                    </span>
	                </td>

	                <td>
	                    <div class="acciones-tabla">

	                        <button
	                            type="button"
	                            class="btn-accion editar"
	                            data-id="${escaparHTML(
	                                String(
	                                    ruta.id
                                )
                            )}"
                            title="Editar ruta"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            type="button"
                            class="btn-accion eliminar"
                            data-id="${escaparHTML(
                                String(
                                    ruta.id
                                )
                            )}"
                            title="Eliminar ruta"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                </td>
            `;


            tbody.appendChild(
                fila
            );

        }
    );

    const smallLabel = document.querySelector("#tab-rutas .cantidad-registros strong");
    if (smallLabel) smallLabel.textContent = rutas.length;

}


/* =========================================================
   
   CARGAR TELÉFONO Y PLACA DEL MOTORISTA
   
   ========================================================= */

async function cargarDatosMotorista() {

    const motoristaSelect =
        formViaje
            ? formViaje.querySelector(
                '[name="motorista"]'
            )
            : null;


    const telefonoInput =
        formViaje
            ? formViaje.querySelector(
                '[name="telefono"]'
            )
            : null;


    const placaSelect =
        formViaje
            ? formViaje.querySelector(
                '[name="placa"]'
            )
            : null;


    if (!motoristaSelect) {
        return;
    }


    if (telefonoInput) {

        telefonoInput.value =
            "";

    }


    if (placaSelect) {

        if (
            placaSelect.tagName &&
            placaSelect.tagName.toUpperCase() ===
            "SELECT"
        ) {

            if (
                placaSelect.options &&
                placaSelect.options.length > 0
            ) {

                placaSelect.selectedIndex =
                    0;

            }

        }

        else if (
            "value" in placaSelect
        ) {

            placaSelect.value =
                "";

        }

    }


    const conductor =
        obtenerConductorSeleccionado();


    if (!conductor) {
        return;
    }


    if (telefonoInput) {

        telefonoInput.value =
            conductor.telefono ||
            conductor.celular ||
            "";

    }


    if (placaSelect) {

        if (
            !Array.isArray(asignacionesBD) ||
            asignacionesBD.length === 0
        ) {

            await cargarAsignacionesParaViajes();

        }


        const placa =
            obtenerPlacaDelConductor(
                conductor.id
            );


        if (placa) {

            seleccionarPlaca(
                placaSelect,
                placa
            );

        }

    }

}


/* =========================================================
   
   NORMALIZAR VIAJE
   
   ========================================================= */

function normalizarViaje(viaje) {

    if (!viaje) {
        return null;
    }


    /*
     * Algunos backends pueden devolver conductor
     * como objeto en lugar de texto.
     */
    let motorista = "";


    if (
        typeof viaje.motorista === "string"
    ) {

        motorista =
            viaje.motorista;

    }

    else if (
        viaje.motorista &&
        typeof viaje.motorista === "object"
    ) {

        motorista =
            (
                (viaje.motorista.nombre || "") +
                " " +
                (viaje.motorista.apellido || "")
            ).trim();

    }

    else if (
        typeof viaje.conductor === "string"
    ) {

        motorista =
            viaje.conductor;

    }

    else if (
        viaje.conductor &&
        typeof viaje.conductor === "object"
    ) {

        motorista =
            (
                (viaje.conductor.nombre || "") +
                " " +
                (viaje.conductor.apellido || "")
            ).trim();

    }


    return {

        id:
            viaje.id,

        fecha:
            viaje.fecha ||
            viaje.fechaProgramacion ||
            "",

        destinoInicial:
            viaje.destinoInicial ||
            "",

        destinoFinal:
            viaje.destinoFinal ||
            "",

        placa:
            viaje.placa ||
            viaje.placaCamion ||
            "",

        motorista:
            motorista,

        telefono:
            viaje.telefono ||
            viaje.celular ||
            "",

        estado:
            String(
                viaje.estado ||
                "PROGRAMADO"
            ).toUpperCase()

    };

}


/* =========================================================
   
   CARGAR VIAJES DESDE BD
   
   ========================================================= */

async function cargarViajesDesdeBD() {

    try {

        const response =
            await fetch(
                "/programaciones/lista",
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            let mensaje =
                "No se pudieron cargar las programaciones.";


            try {

                const texto =
                    await response.text();


                if (texto) {

                    mensaje +=
                        " Respuesta del servidor: " +
                        texto;

                }

            }

            catch (e) {

                console.warn(
                    "No fue posible leer el error del servidor.",
                    e
                );

            }


            throw new Error(
                mensaje +
                " Código HTTP: " +
                response.status
            );

        }


        const datos =
            await response.json();


        if (!Array.isArray(datos)) {

            throw new Error(
                "El servidor no devolvió una lista válida de programaciones."
            );

        }


        viajesBD =
            datos
                .map(
                    normalizarViaje
                )
                .filter(Boolean);


        console.log(
            "Viajes cargados desde BD:",
            viajesBD
        );


        pintarTablaViajes(
            viajesBD
        );


        actualizarResumenViajes();
        actualizarContadores();

    }

    catch (error) {

        console.error(
            "Error cargando viajes:",
            error
        );


        if (
            !Array.isArray(viajesBD) ||
            viajesBD.length === 0
        ) {

            pintarTablaViajes([]);

            actualizarResumenViajes();

        }


        mostrarMensaje(
            error.message ||
            "No se pudieron cargar los viajes.",
            "error"
        );

    }

}


/* =========================================================
   
   PINTAR TABLA VIAJES
   
   ========================================================= */

function pintarTablaViajes(lista) {

    let tbody =
        document.querySelector(
            "#tab-viajes .tabla-viajes tbody"
        );


    if (!tbody) {

        tbody =
            document.querySelector(
                "#tab-viajes tbody"
            );

    }


    if (!tbody) {

        tbody =
            document.querySelector(
                "#tab-viajes table tbody"
            );

    }


    if (!tbody) {

        console.error(
            "No se encontró ningún <tbody> dentro de #tab-viajes."
        );

        return;

    }


    tbody.innerHTML = "";


    if (
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="
                        text-align:center;
                        padding:40px;
                        color:#64748b;
                    "
                >
                    <i
                        class="fa-solid fa-inbox"
                        style="
                            font-size:30px;
                            margin-bottom:10px;
                            display:block;
                        "
                    ></i>

                    No hay viajes registrados.

                </td>
            </tr>
        `;


        actualizarResumenViajes();

        return;

    }


    lista.forEach(
        function (viaje) {

            const estado =
                String(
                    viaje.estado ||
                    "PROGRAMADO"
                ).toUpperCase();


            let claseEstado =
                "programado";


            let textoEstado =
                "Programado";


            if (
                estado === "EN_CURSO"
            ) {

                claseEstado =
                    "en-curso";

                textoEstado =
                    "En curso";

            }

            else if (
                estado === "FINALIZADO"
            ) {

                claseEstado =
                    "finalizado";

                textoEstado =
                    "Finalizado";

            }

            else if (
                estado === "CANCELADO"
            ) {

                claseEstado =
                    "cancelado";

                textoEstado =
                    "Cancelado";

            }


            const motorista =
                viaje.motorista || "";


            const iniciales =
                String(
                    motorista
                )
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(
                        function (nombre) {

                            return nombre
                                .charAt(0);

                        }
                    )
                    .join("")
                    .toUpperCase();


            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `
                <td>
                    <span class="fecha">
                        ${escaparHTML(
                            formatearFecha(
                                viaje.fecha
                            )
                        )}
                    </span>
                </td>

                <td>
                    <span class="ruta">
                        ${escaparHTML(
                            viaje.destinoInicial
                        )}
                    </span>
                </td>

                <td>
                    <span class="ruta">
                        ${escaparHTML(
                            viaje.destinoFinal
                        )}
                    </span>
                </td>

                <td>
                    <span class="placa">
                        ${escaparHTML(
                            viaje.placa
                        )}
                    </span>
                </td>

                <td>
                    <div class="motorista">

                        <div class="avatar">
                            ${escaparHTML(
                                iniciales || "M"
                            )}
                        </div>

                        <div class="motorista-info">

                            <strong>
                                ${escaparHTML(
                                    motorista
                                )}
                            </strong>

                        </div>

                    </div>
                </td>

                <td>
                    <span class="telefono">

                        <i
                            class="fa-solid fa-phone"
                        ></i>

                        ${escaparHTML(
                            viaje.telefono
                        )}

                    </span>
                </td>

                <td>
                    <span
                        class="estado ${claseEstado}"
                    >

                        <span
                            class="estado-punto"
                        ></span>

                        ${escaparHTML(
                            textoEstado
                        )}

                    </span>
                </td>

                <td>
                    <div class="acciones-tabla">

                        <button
                            class="btn-accion editar"
                            type="button"
                            data-id="${escaparHTML(
                                String(
                                    viaje.id
                                )
                            )}"
                            title="Editar viaje"
                        >

                            <i
                                class="fa-solid fa-pen"
                            ></i>

                        </button>


                        <button
                            class="btn-accion eliminar"
                            type="button"
                            data-id="${escaparHTML(
                                String(
                                    viaje.id
                                )
                            )}"
                            title="Eliminar viaje"
                        >

                            <i
                                class="fa-solid fa-trash"
                            ></i>

                        </button>

                    </div>
                </td>
            `;


            tbody.appendChild(
                fila
            );

        }
    );


    actualizarResumenViajes();

    const smallLabel = document.querySelector("#tab-viajes .cantidad-registros strong");
    if (smallLabel) smallLabel.textContent = lista.length;

}


/* =========================================================
   
   ABRIR NUEVO VIAJE
   
   ========================================================= */

async function abrirNuevoViaje() {

    viajeEditando =
        null;


    if (formViaje) {

        formViaje.reset();


        const id =
            formViaje.querySelector(
                '[name="id"]'
            );


        if (id) {

            id.value =
                "";

        }

    }


    cambiarTituloModal(
        modalViaje,
        "Registrar viaje"
    );


    const botonGuardar =
        formViaje
            ? formViaje.querySelector(
                'button[type="submit"]'
            )
            : null;


    if (botonGuardar) {

        botonGuardar.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Guardar viaje
        `;

    }


    if (
        !Array.isArray(rutasBD) ||
        rutasBD.length === 0
    ) {

        await cargarRutasDesdeBD();

    }

    else {

        cargarRutasEnDestinoFinal();

    }


    await cargarConductoresParaViajes();


    await cargarAsignacionesParaViajes();


    abrirModal(
        "modalViaje"
    );

}


/* =========================================================
   
   OBTENER VIAJE POR ID
   
   ========================================================= */

async function obtenerViajePorId(id) {

    if (
        id === undefined ||
        id === null ||
        id === ""
    ) {

        throw new Error(
            "El viaje no tiene un ID válido."
        );

    }


    const response =
        await fetch(
            "/programaciones/" +
            encodeURIComponent(id),
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            }
        );


    const datos =
        await procesarRespuesta(
            response
        );


    if (!response.ok) {

        throw new Error(
            obtenerMensajeHTTP(
                response,
                datos
            )
        );

    }


    if (!datos) {

        throw new Error(
            "El servidor no devolvió información del viaje."
        );

    }


    return datos;

}


/* =========================================================
   
   EDITAR VIAJE
   
   ========================================================= */

async function editarViaje(id) {

    if (
        id === undefined ||
        id === null ||
        id === ""
    ) {

        mostrarMensaje(
            "No se encontró el ID del viaje.",
            "error"
        );

        return;

    }


    console.log(
        "Iniciando edición del viaje con ID:",
        id
    );


    try {

        /* =====================================================
           
           OBTENER VIAJE PRIMERO
           
           ===================================================== */

        const respuestaViaje =
            await obtenerViajePorId(id);


        console.log(
            "Viaje recibido para editar:",
            respuestaViaje
        );


        const viaje =
            normalizarViaje(
                respuestaViaje
            );


        if (!viaje) {

            throw new Error(
                "El servidor no devolvió correctamente el viaje."
            );

        }


        if (
            viaje.id === undefined ||
            viaje.id === null ||
            viaje.id === ""
        ) {

            throw new Error(
                "El viaje recibido no contiene un ID."
            );

        }


        /* =====================================================
           
           GUARDAR ID
           
           ===================================================== */

        viajeEditando =
            viaje.id;


        console.log(
            "viajeEditando establecido en:",
            viajeEditando
        );


        if (!formViaje) {

            throw new Error(
                "No se encontró el formulario de viajes."
            );

        }


        /* =====================================================
           
           CARGAR RUTAS
           
           ===================================================== */

        if (
            !Array.isArray(rutasBD) ||
            rutasBD.length === 0
        ) {

            await cargarRutasDesdeBD();

        }


        /* =====================================================
           
           CARGAR CONDUCTORES
           
           ===================================================== */

        if (
            !Array.isArray(conductoresBD) ||
            conductoresBD.length === 0
        ) {

            await cargarConductoresParaViajes();

        }


        /* =====================================================
           
           CARGAR ASIGNACIONES
           
           ===================================================== */

        if (
            !Array.isArray(asignacionesBD) ||
            asignacionesBD.length === 0
        ) {

            await cargarAsignacionesParaViajes();

        }


        /* =====================================================
           
           LIMPIAR FORMULARIO
           
           ===================================================== */

        formViaje.reset();


        /* =====================================================
           
           ID OCULTO
           
           ===================================================== */

        const idInput =
            formViaje.querySelector(
                '[name="id"]'
            );


        if (idInput) {

            idInput.value =
                viaje.id;

        }


        /* =====================================================
           
           CAMPOS
           
           ===================================================== */

        const fecha =
            formViaje.querySelector(
                '[name="fecha"]'
            );


        const destinoInicial =
            formViaje.querySelector(
                '[name="destinoInicial"]'
            );


        const destinoFinal =
            formViaje.querySelector(
                '[name="destinoFinal"]'
            );


        const placa =
            formViaje.querySelector(
                '[name="placa"]'
            );


        const motorista =
            formViaje.querySelector(
                '[name="motorista"]'
            );


        const telefono =
            formViaje.querySelector(
                '[name="telefono"]'
            );


        const estado =
            formViaje.querySelector(
                '[name="estado"]'
            );


        /* =====================================================
           
           FECHA
           
           ===================================================== */

        if (fecha) {

            fecha.value =
                convertirFechaInput(
                    viaje.fecha
                );

        }


        /* =====================================================
           
           DESTINO INICIAL
           
           ===================================================== */

        if (
            destinoInicial &&
            viaje.destinoInicial
        ) {

            const seleccionado =
                seleccionarPorTexto(
                    destinoInicial,
                    viaje.destinoInicial
                );


            /*
             * Si destinoInicial es INPUT,
             * seleccionarPorTexto ya puso el valor.
             *
             * Si es SELECT y no existe la opción,
             * agregamos la opción guardada.
             */
            if (
                !seleccionado &&
                destinoInicial.tagName &&
                destinoInicial.tagName.toUpperCase() ===
                "SELECT"
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    viaje.destinoInicial;


                option.textContent =
                    viaje.destinoInicial;


                option.selected =
                    true;


                destinoInicial.appendChild(
                    option
                );

            }

        }


        /* =====================================================
           
           DESTINO FINAL
           
           ===================================================== */

        if (destinoFinal) {

            /*
             * Cargamos las rutas conservando
             * exactamente el destino que tiene
             * el viaje que estamos editando.
             */
            cargarRutasEnDestinoFinal(
                viaje.destinoFinal
            );


            if (
                viaje.destinoFinal &&
                destinoFinal.tagName &&
                destinoFinal.tagName.toUpperCase() ===
                "SELECT"
            ) {

                const seleccionado =
                    seleccionarPorTexto(
                        destinoFinal,
                        viaje.destinoFinal
                    );


                if (!seleccionado) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        viaje.destinoFinal;


                    option.textContent =
                        viaje.destinoFinal;


                    option.selected =
                        true;


                    destinoFinal.appendChild(
                        option
                    );

                }

            }

        }


        /* =====================================================
           
           MOTORISTA
           
           ===================================================== */

        if (
            motorista &&
            viaje.motorista
        ) {

            const seleccionado =
                seleccionarPorTexto(
                    motorista,
                    viaje.motorista
                );


            /*
             * Si es SELECT y el motorista ya no
             * aparece en conductores actuales,
             * agregamos el valor guardado.
             */
            if (
                !seleccionado &&
                motorista.tagName &&
                motorista.tagName.toUpperCase() ===
                "SELECT"
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    viaje.motorista;


                option.textContent =
                    viaje.motorista;


                option.selected =
                    true;


                motorista.appendChild(
                    option
                );

            }

        }


        /* =====================================================
           
           TELÉFONO
           
           ===================================================== */

        if (telefono) {

            telefono.value =
                viaje.telefono || "";

        }


        /* =====================================================
           
           PLACA
           
           ===================================================== */

        if (
            placa &&
            viaje.placa
        ) {

            seleccionarPlaca(
                placa,
                viaje.placa
            );

        }


        /* =====================================================
           
           ESTADO
           
           ===================================================== */

        if (estado) {

            seleccionarPorTexto(
                estado,
                viaje.estado ||
                "PROGRAMADO"
            );

        }


        /* =====================================================
           
           ACTUALIZAR TELÉFONO / PLACA
           
           ===================================================== */

        if (
            motorista &&
            motorista.value
        ) {

            /*
             * Guardamos los valores reales del viaje
             * antes de cargar los datos automáticos
             * del motorista.
             */
            const telefonoGuardado =
                viaje.telefono || "";


            const placaGuardada =
                viaje.placa || "";


            await cargarDatosMotorista();


            /*
             * MUY IMPORTANTE:
             * en edición respetamos siempre los valores
             * que realmente tenía el viaje.
             */
            if (
                telefono &&
                telefonoGuardado
            ) {

                telefono.value =
                    telefonoGuardado;

            }


            if (
                placa &&
                placaGuardada
            ) {

                seleccionarPlaca(
                    placa,
                    placaGuardada
                );

            }

        }


        /* =====================================================
           
           TÍTULO
           
           ===================================================== */

        cambiarTituloModal(
            modalViaje,
            "Editar viaje"
        );


        /* =====================================================
           
           BOTÓN
           
           ===================================================== */

        const botonGuardar =
            formViaje.querySelector(
                'button[type="submit"]'
            );


        if (botonGuardar) {

            botonGuardar.innerHTML = `
                <i class="fa-solid fa-pen"></i>
                Actualizar viaje
            `;

        }


        /* =====================================================
           
           ABRIR MODAL
           
           ===================================================== */

        abrirModal(
            "modalViaje"
        );


        console.log(
            "Formulario preparado correctamente para editar:",
            viaje
        );

    }

    catch (error) {

        console.error(
            "Error obteniendo viaje para editar:",
            error
        );


        viajeEditando =
            null;


        mostrarMensaje(
            error.message ||
            "No se pudo cargar el viaje.",
            "error"
        );

    }

}


/* =========================================================
   
   GUARDAR / EDITAR VIAJE
   
   ========================================================= */

if (formViaje) {

    formViaje.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (
                !formViaje.checkValidity()
            ) {

                formViaje.reportValidity();

                return;

            }


            const fecha =
                formViaje.querySelector(
                    '[name="fecha"]'
                );


            const destinoInicial =
                formViaje.querySelector(
                    '[name="destinoInicial"]'
                );


            const destinoFinal =
                formViaje.querySelector(
                    '[name="destinoFinal"]'
                );


            const placa =
                formViaje.querySelector(
                    '[name="placa"]'
                );


            const motorista =
                formViaje.querySelector(
                    '[name="motorista"]'
                );


            const telefono =
                formViaje.querySelector(
                    '[name="telefono"]'
                );


            const estado =
                formViaje.querySelector(
                    '[name="estado"]'
                );


            const idInput =
                formViaje.querySelector(
                    '[name="id"]'
                );


            /*
             * Solo intentamos obtener datos automáticos
             * si realmente existe un motorista seleccionado.
             */
            if (
                motorista &&
                motorista.value
            ) {

                await cargarDatosMotorista();

            }


            /* =====================================================
               
               DETERMINAR ID
               
               ===================================================== */

            let idParaEditar =
                viajeEditando;


            if (
                idParaEditar === undefined ||
                idParaEditar === null ||
                idParaEditar === ""
            ) {

                if (
                    idInput &&
                    idInput.value !== ""
                ) {

                    idParaEditar =
                        idInput.value;

                }

            }


            /* =====================================================
               
               DATOS
               
               ===================================================== */

            const datos = {

                fecha:
                    fecha
                        ? fecha.value || null
                        : null,

                destinoInicial:
                    destinoInicial
                        ? destinoInicial.value || ""
                        : "",

                destinoFinal:
                    destinoFinal
                        ? destinoFinal.value || ""
                        : "",

                placa:
                    placa
                        ? placa.value || ""
                        : "",

                motorista:
                    motorista
                        ? motorista.value || ""
                        : "",

                telefono:
                    telefono
                        ? telefono.value || ""
                        : "",

                estado:
                    estado
                        ? estado.value || "PROGRAMADO"
                        : "PROGRAMADO"

            };


            console.log(
                "===================================="
            );


            console.log(
                "GUARDANDO VIAJE"
            );


            console.log(
                "ID:",
                idParaEditar
            );


            console.log(
                "Modo:",
                (
                    idParaEditar !== undefined &&
                    idParaEditar !== null &&
                    idParaEditar !== ""
                )
                    ? "EDITAR"
                    : "NUEVO"
            );


            console.log(
                "Datos enviados:",
                datos
            );


            console.log(
                "===================================="
            );


            const boton =
                formViaje.querySelector(
                    'button[type="submit"]'
                );


            try {

                if (boton) {

                    boton.disabled =
                        true;

                }


                let response;


                /* =====================================================
                   
                   EDITAR
                   
                   ===================================================== */

                if (
                    idParaEditar !== undefined &&
                    idParaEditar !== null &&
                    idParaEditar !== ""
                ) {

                    response =
                        await fetch(
                            "/programaciones/editar/" +
                            encodeURIComponent(
                                idParaEditar
                            ),
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

                }


                /* =====================================================
                   
                   NUEVO
                   
                   ===================================================== */

                else {

                    response =
                        await fetch(
                            "/programaciones/guardar",
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


                /* =====================================================
                   
                   RESPUESTA
                   
                   ===================================================== */

                const resultado =
                    await procesarRespuesta(
                        response
                    );


                console.log(
                    "Respuesta del servidor:",
                    resultado
                );


                if (!response.ok) {

                    throw new Error(
                        obtenerMensajeHTTP(
                            response,
                            resultado
                        )
                    );

                }


                const estabaEditando =
                    (
                        idParaEditar !== undefined &&
                        idParaEditar !== null &&
                        idParaEditar !== ""
                    );


                mostrarMensaje(
                    estabaEditando
                        ? "El viaje fue actualizado correctamente."
                        : "El viaje fue guardado correctamente."
                );


                cerrarModal(
                    "modalViaje"
                );


                viajeEditando =
                    null;


                if (formViaje) {

                    formViaje.reset();

                }


                await cargarViajesDesdeBD();

            }

            catch (error) {

                console.error(
                    "Error guardando viaje:",
                    error
                );


                mostrarMensaje(
                    error.message ||
                    "No se pudo guardar el viaje.",
                    "error"
                );

            }

            finally {

                if (boton) {

                    boton.disabled =
                        false;

                }

            }

        }
    );

}


/* =========================================================
   
   ELIMINAR VIAJE
   
   ========================================================= */

async function eliminarViaje(id) {

    if (
        id === undefined ||
        id === null ||
        id === ""
    ) {

        mostrarMensaje(
            "No se encontró el ID del viaje.",
            "error"
        );

        return;

    }


    console.log(
        "Eliminando viaje con ID:",
        id
    );


    try {

        const response =
            await fetch(
                "/programaciones/eliminar/" +
                encodeURIComponent(id),
                {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        const resultado =
            await procesarRespuesta(
                response
            );


        if (!response.ok) {

            throw new Error(
                obtenerMensajeHTTP(
                    response,
                    resultado
                )
            );

        }


        cerrarModal(
            "modalEliminarViaje"
        );


        mostrarMensaje(
            "El viaje fue eliminado correctamente."
        );


        viajeEliminar =
            null;


        await cargarViajesDesdeBD();

    }

    catch (error) {

        console.error(
            "Error eliminando viaje:",
            error
        );


        mostrarMensaje(
            error.message ||
            "No se pudo eliminar el viaje.",
            "error"
        );

    }

}


/* =========================================================
   
   BOTONES DE VIAJES
   
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        /* =====================================================
           
           EDITAR
           
           ===================================================== */

        const editar =
            event.target.closest(
                "#tab-viajes .btn-accion.editar"
            );


        if (editar) {

            event.preventDefault();

            event.stopPropagation();


            const id =
                editar.dataset.id ||
                editar.getAttribute(
                    "data-id"
                );


            console.log(
                "Botón editar presionado. ID:",
                id
            );


            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {

                mostrarMensaje(
                    "El viaje no tiene ID.",
                    "error"
                );

                return;

            }


            editarViaje(
                id
            );


            return;

        }


        /* =====================================================
           
           ELIMINAR
           
           ===================================================== */

        const eliminar =
            event.target.closest(
                "#tab-viajes .btn-accion.eliminar"
            );


        if (eliminar) {

            event.preventDefault();

            event.stopPropagation();


            const id =
                eliminar.dataset.id ||
                eliminar.getAttribute(
                    "data-id"
                );


            console.log(
                "Botón eliminar presionado. ID:",
                id
            );


            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {

                mostrarMensaje(
                    "El viaje no tiene ID.",
                    "error"
                );

                return;

            }


            viajeEliminar =
                id;


            abrirModal(
                "modalEliminarViaje"
            );


            return;

        }

    }
);


/* =========================================================
   
   CONFIRMAR ELIMINACIÓN VIAJE
   
   ========================================================= */

if (modalEliminarViaje) {

    const boton =
        modalEliminarViaje.querySelector(
            ".btn-confirmar-eliminar"
        );


    if (boton) {

        boton.addEventListener(
            "click",
            function () {

                if (
                    viajeEliminar === undefined ||
                    viajeEliminar === null ||
                    viajeEliminar === ""
                ) {

                    mostrarMensaje(
                        "No se encontró el viaje a eliminar.",
                        "error"
                    );

                    return;

                }


                eliminarViaje(
                    viajeEliminar
                );

            }
        );

    }

}


/* =========================================================
   
   CAMBIO DE MOTORISTA
   
   ========================================================= */

const motoristaSelect =
    formViaje
        ? formViaje.querySelector(
            '[name="motorista"]'
        )
        : null;


if (motoristaSelect) {

    motoristaSelect.addEventListener(
        "change",
        async function () {

            await cargarDatosMotorista();

        }
    );

}


/* =========================================================
   
   NUEVO VIAJE
   
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const boton =
            event.target.closest(
                '.btn-crear[data-bs-target="#modalViaje"]'
            );


        if (!boton) {
            return;
        }


        event.preventDefault();


        abrirNuevoViaje();

    }
);


/* =========================================================
   
   CERRAR / LIMPIAR MODAL VIAJE
   
   ========================================================= */

if (modalViaje) {

    modalViaje.addEventListener(
        "hidden.bs.modal",
        function () {

            viajeEditando =
                null;


            if (formViaje) {

                formViaje.reset();


                const id =
                    formViaje.querySelector(
                        '[name="id"]'
                    );


                if (id) {

                    id.value =
                        "";

                }

            }


            cambiarTituloModal(
                modalViaje,
                "Registrar viaje"
            );

        }
    );

}


/* =========================================================
   
   FILTROS DE VIAJES
   
   ========================================================= */

const buscador =
    document.querySelector(
        ".filtro-busqueda input"
    );


const filtroFecha =
    document.querySelector(
        '.panel-filtros input[type="date"]'
    );


const filtroEstado =
    document.querySelector(
        ".panel-filtros select"
    );


function aplicarFiltros() {

    let resultado =
        Array.isArray(viajesBD)
            ? [...viajesBD]
            : [];


    if (buscador) {

        const texto =
            normalizarTexto(
                buscador.value
            );


        if (texto) {

            resultado =
                resultado.filter(
                    function (viaje) {

                        const contenido = [

                            viaje.destinoInicial,

                            viaje.destinoFinal,

                            viaje.placa,

                            viaje.motorista,

                            viaje.telefono

                        ].join(" ");


                        return normalizarTexto(
                            contenido
                        ).includes(
                            texto
                        );

                    }
                );

        }

    }


    if (
        filtroFecha &&
        filtroFecha.value
    ) {

        resultado =
            resultado.filter(
                function (viaje) {

                    return (
                        convertirFechaInput(
                            viaje.fecha
                        ) ===
                        filtroFecha.value
                    );

                }
            );

    }


    if (
        filtroEstado &&
        filtroEstado.value
    ) {

        resultado =
            resultado.filter(
                function (viaje) {

                    return (
                        String(
                            viaje.estado || ""
                        ).toUpperCase() ===
                        String(
                            filtroEstado.value
                        ).toUpperCase()
                    );

                }
            );

    }


    pintarTablaViajes(
        resultado
    );

}


/* =========================================================
   
   EVENTOS DE FILTROS
   
   ========================================================= */

if (buscador) {

    buscador.addEventListener(
        "input",
        aplicarFiltros
    );

}


if (filtroFecha) {

    filtroFecha.addEventListener(
        "change",
        aplicarFiltros
    );

}


if (filtroEstado) {

    filtroEstado.addEventListener(
        "change",
        aplicarFiltros
    );

}


/* =========================================================
   
   LIMPIAR FILTROS
   
   ========================================================= */

const btnLimpiar =
    document.querySelector(
        ".btn-limpiar"
    );


if (btnLimpiar) {

    btnLimpiar.addEventListener(
        "click",
        function () {

            if (buscador) {

                buscador.value =
                    "";

            }


            if (filtroFecha) {

                filtroFecha.value =
                    "";

            }


            if (filtroEstado) {

                filtroEstado.value =
                    "";

            }


            pintarTablaViajes(
                viajesBD
            );

        }
    );

}


/* =========================================================
   
   RESUMEN DE VIAJES
   
   ========================================================= */

function actualizarResumenViajes() {

    const lista =
        Array.isArray(viajesBD)
            ? viajesBD
            : [];


    const programados =
        lista.filter(
            function (viaje) {

                return (
                    String(
                        viaje.estado || ""
                    ).toUpperCase() ===
                    "PROGRAMADO"
                );

            }
        ).length;


    const vehiculos =
        new Set(
            lista
                .map(
                    function (viaje) {

                        return viaje.placa;

                    }
                )
                .filter(Boolean)
        ).size;


    const resumen =
        document.querySelectorAll(
            "#tab-viajes .resumen-card strong"
        );


    if (resumen[0]) {

        resumen[0].textContent =
            programados;

    }


    if (resumen[1]) {

        resumen[1].textContent =
            Array.isArray(rutasBD)
                ? rutasBD.length
                : 0;

    }


    if (resumen[2]) {

        resumen[2].textContent =
            destinosBD.length; // Cuenta destinos de la tabla maestra

    }


    const cantidad =
        document.querySelector(
            "#tab-viajes .cantidad-registros strong"
        );


    if (cantidad) {

        cantidad.textContent =
            lista.length;

    }

}


    /* =========================================================
       =========================================================
       DESTINOS
       =========================================================
       ========================================================= */


    /* =========================================================
       CARGAR DESTINOS
    ========================================================= */

	async function cargarDestinosDesdeBD() {

	    try {

	        const response =
	            await fetch("/api/destinos");

	        if (!response.ok) {

	            throw new Error(
	                "No se pudieron cargar los destinos."
	            );

	        }

	        /* =====================================================
	           GUARDAR DESTINOS DE LA BASE DE DATOS
	        ===================================================== */

	        const datosDestinos =
	            await response.json();

	        destinosBD =
	            Array.isArray(datosDestinos)
	                ? datosDestinos
	                : [];


	        /* =====================================================
	           PINTAR TABLA DE DESTINOS
	        ===================================================== */

	        pintarTablaDestinos(
	            destinosBD
	        );


	        /* =====================================================
	           ACTUALIZAR CONTADORES
	        ===================================================== */

	        actualizarContadores();


	        /* =====================================================
	           ACTUALIZAR CARD DESTINOS ACTIVOS
	           DIRECTAMENTE CON LOS DATOS DE LA BD
	        ===================================================== */

	        const totalDestinosActivos =
	            document.getElementById(
	                "totalDestinosActivos"
	            );

	        if (totalDestinosActivos) {

	            totalDestinosActivos.textContent =
	                destinosBD.length;

	        }


	        console.log(
	            "Destinos cargados desde BD:",
	            destinosBD.length
	        );


	    } catch (error) {

	        console.error(
	            "Error cargando destinos:",
	            error
	        );

	    }

	}



    /* =========================================================
       PINTAR DESTINOS
    ========================================================= */

    function pintarTablaDestinos(lista) {

        const tbody =
            document.querySelector(
                "#tab-destinos .tabla-admin tbody"
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = "";


        if (!lista || lista.length === 0) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="
                            text-align:center;
                            padding:35px;
                        ">

                        No hay destinos registrados.

                    </td>

                </tr>
            `;

            return;
        }


        lista.forEach(function (destino) {

            const fila =
                document.createElement("tr");


            fila.innerHTML = `

                <td>

                    <div class="dato-principal">

                        <div class="dato-icon destino-icon">

                            <i class="fa-solid fa-location-dot"></i>

                        </div>

                        <strong>

                            ${escaparHTML(
                                destino.destino ||
                                destino.nombre ||
                                destino.nombreDestino ||
                                ""
                            )}

                        </strong>

                    </div>

                </td>


                <td>

                    <span class="dato-numero">

                        ${escaparHTML(
                            destino.km || 
                            destino.kilometros ||
                            0
                        )}
                        km

                    </span>

                </td>


                <td>

                    <span class="dato-numero">

                        ${escaparHTML(
                            destino.galones ||
                            0
                        )}
                        gal

                    </span>

                </td>


                <td>

                    ${escaparHTML(
                        destino.peajes || 0
                    )}

                </td>


                <td>

                    <div class="acciones-tabla">

                        <button
                            type="button"
                            class="btn-accion editar"
                            data-id="${escaparHTML(
                                destino.id
                            )}"
                            title="Editar destino">

                            <i class="fa-solid fa-pen"></i>

                        </button>


                        <button
                            type="button"
                            class="btn-accion eliminar"
                            data-id="${escaparHTML(
                                destino.id
                            )}"
                            title="Eliminar destino">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>
            `;


            tbody.appendChild(fila);
        });

        // Actualización de contadores pequeños
        const smallLabel = document.querySelector("#tab-destinos .cantidad-registros strong");
        if (smallLabel) smallLabel.textContent = lista.length;
    }


    /* =========================================================
       EDITAR DESTINO
    ========================================================= */

    async function editarDestino(id) {

        try {

            const response =
                await fetch(
                    "/api/destinos/" + id
                );


            const destino =
                await procesarRespuesta(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    obtenerMensajeHTTP(
                        response,
                        destino
                    )
                );
            }


            destinoEditando =
                destino.id;


            const nombre =
                formDestino.querySelector(
                    '[name="destino"]'
                );

            const kilometros =
                formDestino.querySelector(
                    '[name="kilometros"]'
                );

            const galones =
                formDestino.querySelector(
                    '[name="galones"]'
                );

            const peajes =
                formDestino.querySelector(
                    '[name="peajes"]'
                );


            if (nombre) {

                nombre.value =
                    destino.destino ||
                    destino.nombre ||
                    destino.nombreDestino ||
                    "";
            }


            if (kilometros) {

                kilometros.value =
                    destino.km ||
                    destino.kilometros ||
                    "";
            }


            if (galones) {

                galones.value =
                    destino.galones ||
                    "";
            }


            if (peajes) {

                peajes.value =
                    destino.peajes ||
                    0;
            }


            cambiarTituloModal(
                modalDestino,
                "Editar destino"
            );


            const boton =
                formDestino
                    ? formDestino.querySelector(
                        'button[type="submit"]'
                    )
                    : null;


            if (boton) {

                boton.innerHTML = `

                    <i class="fa-solid fa-pen"></i>

                    Actualizar destino
                `;
            }


            abrirModal(
                "modalDestino"
            );


        } catch (error) {

            console.error(
                "Error obteniendo destino:",
                error
            );


            mostrarMensaje(
                error.message ||
                "No se pudo cargar el destino.",
                "error"
            );
        }
    }


    /* =========================================================
       GUARDAR DESTINO (CONGRUENTE CON JAVA: km)
    ========================================================= */

    if (formDestino) {

        formDestino.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (!formDestino.checkValidity()) {

                    formDestino.reportValidity();

                    return;
                }

                const nombreField = formDestino.querySelector('[name="destino"]');
                const kmField = formDestino.querySelector('[name="kilometros"]');
                const galonesField = formDestino.querySelector('[name="galones"]');
                const peajesField = formDestino.querySelector('[name="peajes"]');

                if (!kmField || kmField.value === "" || isNaN(parseFloat(kmField.value))) {
                    mostrarMensaje("Los kilómetros son obligatorios y deben ser un número.", "error");
                    return;
                }

                const datos = {
                    destino: nombreField ? nombreField.value.trim() : "",
                    km: parseFloat(kmField.value), 
                    galones: (galonesField && galonesField.value !== "") ? parseFloat(galonesField.value) : 0,
                    peajes: (peajesField && peajesField.value !== "") ? parseInt(peajesField.value, 10) : 0
                };

                try {

                    const boton =
                        formDestino.querySelector(
                            'button[type="submit"]'
                        );


                    if (boton) {
                        boton.disabled = true;
                    }


                    let response;


                    if (destinoEditando) {

                        response =
                            await fetch(
                                "/api/destinos/" +
                                destinoEditando,
                                {
                                    method: "PUT",

                                    headers: {
                                        "Content-Type":
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
                                "/api/destinos",
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
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
                        await procesarRespuesta(
                            response
                        );


                    if (!response.ok) {
                        throw new Error(
                            obtenerMensajeHTTP(
                                response,
                                resultado
                            )
                        );
                    }


                    mostrarMensaje(
                        destinoEditando
                            ? "Destino actualizado correctamente."
                            : "Destino guardado correctamente."
                    );


                    cerrarModal(
                        "modalDestino"
                    );


                    destinoEditando = null;


                    formDestino.reset();


                    await cargarDestinosDesdeBD();


                } catch (error) {

                    console.error(
                        "Error guardando destino:",
                        error
                    );


                    mostrarMensaje(
                        error.message ||
                        "No se pudo guardar el destino.",
                        "error"
                    );

                } finally {

                    const boton =
                        formDestino.querySelector(
                            'button[type="submit"]'
                        );

                    if (boton) {
                        boton.disabled = false;
                    }
                }
            }
        );
    }


    /* =========================================================
       ELIMINAR DESTINO
    ========================================================= */

    async function eliminarDestino(id) {

        try {

            const response =
                await fetch(
                    "/api/destinos/" + id,
                    {
                        method: "DELETE"
                    }
                );


            const resultado =
                await procesarRespuesta(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    obtenerMensajeHTTP(
                        response,
                        resultado
                    )
                );
            }


            cerrarModal(
                "modalEliminarDestino"
            );


            mostrarMensaje(
                "Destino eliminado correctamente."
            );


            destinoEliminar = null;


            await cargarDestinosDesdeBD();


        } catch (error) {

            console.error(
                "Error eliminando destino:",
                error
            );


            mostrarMensaje(
                error.message ||
                "No se pudo eliminar the destino.",
                "error"
            );
        }
    }


    /* =========================================================
       BOTONES DESTINOS
    ========================================================= */

    document.addEventListener(
        "click",
        function (event) {

            const editar =
                event.target.closest(
                    "#tab-destinos .btn-accion.editar"
                );


            if (editar) {

                const id =
                    editar.dataset.id;

                editarDestino(id);

                return;
            }


            const eliminar =
                event.target.closest(
                    "#tab-destinos .btn-accion.eliminar"
                );


            if (eliminar) {

                destinoEliminar =
                    eliminar.dataset.id;

                abrirModal(
                    "modalEliminarDestino"
                );
            }
        }
    );


    /* =========================================================
       CONFIRMAR ELIMINAR DESTINO
    ========================================================= */

    if (modalEliminarDestino) {

        const boton =
            modalEliminarDestino.querySelector(
                ".btn-confirmar-eliminar"
            );


        if (boton) {

            boton.addEventListener(
                "click",
                function () {

                    if (!destinoEliminar) {
                        return;
                    }

                    eliminarDestino(
                        destinoEliminar
                    );
                }
            );
        }
    }


    /* =========================================================
       NUEVO DESTINO
    ========================================================= */

    document.addEventListener(
        "click",
        function (event) {

            const boton =
                event.target.closest(
                    '.btn-crear[data-bs-target="#modalDestino"]'
                );


            if (!boton) {
                return;
            }


            destinoEditando = null;


            if (formDestino) {
                formDestino.reset();
            }


            cambiarTituloModal(
                modalDestino,
                "Registrar destino"
            );


            const submit =
                formDestino
                    ? formDestino.querySelector(
                        'button[type="submit"]'
                    )
                    : null;


            if (submit) {

                submit.innerHTML = `

                    <i class="fa-solid fa-floppy-disk"></i>

                    Guardar destino
                `;
            }
        }
    );


    /* =========================================================
       CERRAR DESTINO
    ========================================================= */

    if (modalDestino) {

        modalDestino.addEventListener(
            "hidden.bs.modal",
            function () {

                destinoEditando = null;

                if (formDestino) {
                    formDestino.reset();
                }

                cambiarTituloModal(
                    modalDestino,
                    "Registrar destino"
                );
            }
        );
    }


    /* =========================================================
       =========================================================
       RUTAS (SOLO FUNCIONES DE ACCIÓN)
       =========================================================
       ========================================================= */

    /* =========================================================
       EDITAR RUTA
    ========================================================= */

    async function editarRuta(id) {

        try {

            const response =
                await fetch(
                    "/api/rutas/" + id
                );


            const ruta =
                await procesarRespuesta(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    obtenerMensajeHTTP(
                        response,
                        ruta
                    )
                );
            }


            rutaEditando =
                ruta.id;


            const destino =
                formRuta.querySelector(
                    '[name="destino"]'
                );


            const odt =
                formRuta.querySelector(
                    '[name="odt"]'
                );


            const estado =
                formRuta.querySelector(
                    '[name="estado"]'
                );


            if (destino) {

                destino.value =
                    ruta.destino ||
                    ruta.nombre ||
                    ruta.ruta ||
                    "";
            }


            if (odt) {

                odt.value =
                    convertirHoraParaInput(
                        ruta.odt ||
                        ruta.tiempo ||
                        ruta.tiempoPromedio
                    );
            }


            if (estado) {

                estado.value =
                    ruta.estado ||
                    "ACTIVA";
            }


            cambiarTituloModal(
                modalRuta,
                "Editar ruta"
            );


            const boton =
                formRuta
                    ? formRuta.querySelector(
                        'button[type="submit"]'
                    )
                    : null;


            if (boton) {

                boton.innerHTML = `

                    <i class="fa-solid fa-pen"></i>

                    Actualizar ruta
                `;
            }


            abrirModal(
                "modalRuta"
            );


        } catch (error) {

            console.error(
                "Error obteniendo ruta:",
                error
            );


            mostrarMensaje(
                error.message ||
                "No se pudo cargar la ruta.",
                "error"
            );
        }
    }


    /* =========================================================
       CONVERTIR HORA
    ========================================================= */

    function convertirHoraParaInput(hora) {

        if (
            hora === null ||
            hora === undefined
        ) {
            return "";
        }


        let texto =
            String(hora).trim();


        if (!texto) {
            return "";
        }


        if (
            /^\d{1,2}:\d{2}:\d{2}$/.test(
                texto
            )
        ) {

            return texto.substring(
                0,
                5
            );
        }


        if (
            /^\d{1,2}:\d{2}$/.test(
                texto
            )
        ) {

            const partes =
                texto.split(":");


            return (
                String(
                    parseInt(
                        partes[0],
                        10
                    )
                ).padStart(2, "0") +
                ":" +
                partes[1]
            );
        }


        return "";
    }


    /* =========================================================
       GUARDAR RUTA
    ========================================================= */

    if (formRuta) {

        formRuta.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (!formRuta.checkValidity()) {

                    formRuta.reportValidity();

                    return;
                }


                const destino =
                    formRuta.querySelector(
                        '[name="destino"]'
                    );


                const odt =
                    formRuta.querySelector(
                        '[name="odt"]'
                    );


                const estado =
                    formRuta.querySelector(
                        '[name="estado"]'
                    );


                const datos = {

                    destino:
                        destino
                            ? destino.value.trim()
                            : "",

                    odt:
                        odt
                            ? odt.value
                            : "",

                    estado:
                        estado
                            ? estado.value
                            : "ACTIVA"
                };


                try {

                    const boton =
                        formRuta.querySelector(
                            'button[type="submit"]'
                        );


                    if (boton) {
                        boton.disabled = true;
                    }


                    let response;


                    if (rutaEditando) {

                        response =
                            await fetch(
                                "/api/rutas/" +
                                rutaEditando,
                                {
                                    method: "PUT",

                                    headers: {
                                        "Content-Type":
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
                                "/api/rutas",
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
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
                        await procesarRespuesta(
                            response
                        );


                    if (!response.ok) {

                        throw new Error(
                            obtenerMensajeHTTP(
                                response,
                                resultado
                            )
                        );
                    }


                    mostrarMensaje(
                        rutaEditando
                            ? "Ruta actualizada correctamente."
                            : "Ruta guardada correctamente."
                    );


                    cerrarModal(
                        "modalRuta"
                    );


                    rutaEditando = null;


                    formRuta.reset();


                    await cargarRutasDesdeBD();


                } catch (error) {

                    console.error(
                        "Error guardando ruta:",
                        error
                    );


                    mostrarMensaje(
                        error.message ||
                        "No se pudo guardar la ruta.",
                        "error"
                    );

                } finally {

                    const boton =
                        formRuta.querySelector(
                            'button[type="submit"]'
                        );


                    if (boton) {
                        boton.disabled = false;
                    }
                }
            }
        );
    }


    /* =========================================================
       ELIMINAR RUTA
    ========================================================= */

    async function eliminarRuta(id) {

        try {

            const response =
                await fetch(
                    "/api/rutas/" + id,
                    {
                        method: "DELETE"
                    }
                );


            const resultado =
                await procesarRespuesta(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    obtenerMensajeHTTP(
                        response,
                        resultado
                    )
                );
            }


            cerrarModal(
                "modalEliminarRuta"
            );


            mostrarMensaje(
                "Ruta eliminada correctamente."
            );


            rutaEliminar = null;


            await cargarRutasDesdeBD();


        } catch (error) {

            console.error(
                "Error eliminando ruta:",
                error
            );


            mostrarMensaje(
                error.message ||
                "No se pudo eliminar la ruta.",
                "error"
            );
        }
    }


    /* =========================================================
       BOTONES RUTAS
    ========================================================= */

    document.addEventListener(
        "click",
        function (event) {

            const editar =
                event.target.closest(
                    "#tab-rutas .btn-accion.editar"
                );


            if (editar) {

                const id =
                    editar.dataset.id;

                editarRuta(id);

                return;
            }


            const eliminar =
                event.target.closest(
                    "#tab-rutas .btn-accion.eliminar"
                );


            if (eliminar) {

                rutaEliminar =
                    eliminar.dataset.id;

                abrirModal(
                    "modalEliminarRuta"
                );
            }
        }
    );


    /* =========================================================
       CONFIRMAR ELIMINAR RUTA
    ========================================================= */

    if (modalEliminarRuta) {

        const boton =
            modalEliminarRuta.querySelector(
                ".btn-confirmar-eliminar"
            );


        if (boton) {

            boton.addEventListener(
                "click",
                function () {

                    if (!rutaEliminar) {
                        return;
                    }

                    eliminarRuta(
                        rutaEliminar
                    );
                }
            );
        }
    }


    /* =========================================================
       NUEVA RUTA
    ========================================================= */

    document.addEventListener(
        "click",
        function (event) {

            const boton =
                event.target.closest(
                    '.btn-crear[data-bs-target="#modalRuta"]'
                );


            if (!boton) {
                return;
            }


            rutaEditando = null;


            if (formRuta) {
                formRuta.reset();
            }


            cambiarTituloModal(
                modalRuta,
                "Registrar ruta"
            );


            const submit =
                formRuta
                    ? formRuta.querySelector(
                        'button[type="submit"]'
                    )
                    : null;


            if (submit) {

                submit.innerHTML = `

                    <i class="fa-solid fa-floppy-disk"></i>

                    Guardar ruta
                `;
            }
        }
    );


    /* =========================================================
       CERRAR MODAL RUTA
    ========================================================= */

    if (modalRuta) {

        modalRuta.addEventListener(
            "hidden.bs.modal",
            function () {

                rutaEditando = null;

                if (formRuta) {
                    formRuta.reset();
                }

                cambiarTituloModal(
                    modalRuta,
                    "Registrar ruta"
                );
            }
        );
    }


	/* =========================================================
	   CONTADORES GENERALES (CORREGIDOS)
	========================================================= */

	function actualizarContadores() {

        // 1. Tarjeta: Viajes Programados (Solo estado PROGRAMADO)
	    const totalViajesProgramados =
	        document.getElementById("totalViajesProgramados");

	    if (totalViajesProgramados) {
            const numProgramados = viajesBD.filter(v => v.estado === "PROGRAMADO").length;
	        totalViajesProgramados.textContent = numProgramados;
	    }


        // 2. Tarjeta: Rutas Activas (Total de rutas configuradas)
	    const totalRutasActivas =
	        document.getElementById("totalRutasActivas");

	    if (totalRutasActivas) {
	        totalRutasActivas.textContent =
	            Array.isArray(rutasBD)
	                ? rutasBD.length
	                : 0;
	    }


        // 3. Tarjeta: Destinos Activos (Total de la tabla maestra de destinos)
	    const totalDestinosActivos =
	        document.getElementById("totalDestinosActivos");

	    if (totalDestinosActivos) {
	        totalDestinosActivos.textContent =
	            Array.isArray(destinosBD)
	                ? destinosBD.length
	                : 0;
	    }

	    actualizarResumenViajes();
	}
	
    /* =========================================================
       GENERADOR DE IMAGEN PROFESIONAL (NUEVO MÉTODO)
    ========================================================= */

    async function generarReporteImagen() {
        const filtroFecha = document.querySelector('.panel-filtros input[type="date"]').value;
        const fechaReporte = filtroFecha ? formatearFecha(filtroFecha) : "General";

        // 1. Crear contenedor del reporte (Invisible en el viewport)
        const reporte = document.createElement('div');
        reporte.id = "chc-reporte-virtual";
        
        // Estilos corporativos de Transporte CHC
        Object.assign(reporte.style, {
            position: 'fixed', left: '-10000px', top: '0',
            width: '1200px', backgroundColor: '#ffffff',
            padding: '50px', fontFamily: '"Poppins", sans-serif',
            color: '#1e293b'
        });

        // Cabecera membretada (Logo blanco sobre azul marino corporativo)
        reporte.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; background-color: #1e293b; padding: 40px; border-radius: 15px; margin-bottom: 40px; border-bottom: 5px solid #38bdf8;">
                <div style="display: flex; align-items: center;">
                    <img src="/imgs/logo.png" style="width: 100px; height: auto; margin-right: 30px;" alt="Logo">
                    <div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 38px; font-weight: 700; letter-spacing: 2px;">TRANSPORTE CHC</h1>
                        <p style="margin: 5px 0 0 0; color: #38bdf8; font-size: 16px; font-weight: 500;">Logística Terrestre de Carga Pesada</p>
                    </div>
                </div>
                <div style="text-align: right; color: #ffffff;">
                    <h3 style="margin: 0; font-size: 20px; text-transform: uppercase; color: #ffffff;">Programación Diaria</h3>
                    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600;">Fecha: ${fechaReporte}</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: separate; border-spacing: 0 12px;">
                <thead>
                    <tr style="background-color: #f1f5f9;">
                        <th style="padding: 18px; text-align: left; color: #475569; font-size: 14px; border-radius: 12px 0 0 12px;">FECHA</th>
                        <th style="padding: 18px; text-align: left; color: #475569; font-size: 14px;">RUTA (ORIGEN - DESTINO)</th>
                        <th style="padding: 18px; text-align: left; color: #475569; font-size: 14px;">UNIDAD</th>
                        <th style="padding: 18px; text-align: left; color: #475569; font-size: 14px;">MOTORISTA</th>
                        <th style="padding: 18px; text-align: left; color: #475569; font-size: 14px;">TELÉFONO</th>
                        <th style="padding: 18px; text-align: center; color: #475569; font-size: 14px; border-radius: 0 12px 12px 0;">ESTADO</th>
                    </tr>
                </thead>
                <tbody id="reporte-body"></tbody>
            </table>

            <div style="margin-top: 60px; border-top: 2px solid #f1f5f9; padding-top: 25px; display: flex; justify-content: space-between; font-size: 13px; color: #64748b;">
                <p>© ${new Date().getFullYear()} Transporte CHC - Departamento de Operaciones</p>
                <p>Generado: ${new Date().toLocaleTimeString()} - Pág 1/1</p>
            </div>
        `;

        const reporteBody = reporte.querySelector('#reporte-body');
        const filasVisibles = document.querySelectorAll("#tbodyViajes tr");

        // Validar si hay datos
        if (filasVisibles.length === 0 || (filasVisibles.length === 1 && filasVisibles[0].innerText.includes("No hay"))) {
            mostrarMensaje("No hay información filtrada para generar la imagen.", "error");
            return;
        }

        // Llenar tabla del reporte con datos reales (Ignorando columnas de botones)
        filasVisibles.forEach(fila => {
            const c = fila.cells;
            const tr = document.createElement('tr');
            tr.style.backgroundColor = "#ffffff";
            tr.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)";
            
            tr.innerHTML = `
                <td style="padding: 18px; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; border-left: 1px solid #f1f5f9; border-radius: 12px 0 0 12px; font-weight: 500;">${c[0].innerText}</td>
                <td style="padding: 18px; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-size: 14px; font-weight: 600;">${c[1].innerText} <span style="color:#94a3b8">→</span> ${c[2].innerText}</div>
                </td>
                <td style="padding: 18px; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0369a1; font-family: monospace;">${c[3].innerText}</td>
                <td style="padding: 18px; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">${c[4].innerText}</td>
                <td style="padding: 18px; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">${c[5].innerText}</td>
                <td style="padding: 18px; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-radius: 0 12px 12px 0; text-align: center;">
                    <span style="background: #e0f2fe; color: #0369a1; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; border: 1px solid #bae6fd;">${c[6].innerText}</span>
                </td>
            `;
            reporteBody.appendChild(tr);
        });

        document.body.appendChild(reporte);

        try {
            // Convertir a canvas con html2canvas
            const canvas = await html2canvas(reporte, {
                scale: 2, // Alta definición
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false
            });
            
            // Descargar imagen
            const link = document.createElement('a');
            link.download = `Transporte_CHC_Programacion_${fechaReporte.replace(/\//g, '-')}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            mostrarMensaje("Imagen membretada generada con éxito.");
        } catch (err) {
            console.error(err);
            mostrarMensaje("Error al renderizar la imagen corporativa.", "error");
        } finally {
            reporte.remove();
        }
    }
	
    /* =========================================================
       PESTAÑAS
    ========================================================= */

    const pestanas =
        document.querySelectorAll(
            ".pestana"
        );


    const hojas =
        document.querySelectorAll(
            ".hoja-tab"
        );


    pestanas.forEach(
        function (pestana) {

            pestana.addEventListener(
                "click",
                function () {

                    const tab =
                        pestana.dataset.tab;


                    pestanas.forEach(
                        function (item) {

                            item.classList.remove(
                                "activa"
                            );
                        }
                    );


                    hojas.forEach(
                        function (hoja) {

                            hoja.classList.remove(
                                "activa"
                            );
                        }
                    );


                    pestana.classList.add(
                        "activa"
                    );


                    const hoja =
                        document.getElementById(
                            "tab-" + tab
                        );


                    if (hoja) {

                        hoja.classList.add(
                            "activa"
                        );
                    }
                }
            );
        }
    );


    /* =========================================================
       INICIALIZAR TODO
    ========================================================= */

    async function inicializarModulo() {

        try {

            // 1. Cargar Rutas
            await cargarRutasDesdeBD();

            // 2. Cargar Conductores
            await cargarConductoresParaViajes();

            // 3. Cargar Asignaciones
            await cargarAsignacionesParaViajes();

            // 4. Cargar Viajes
            await cargarViajesDesdeBD();

            // 5. Cargar Destinos
            await cargarDestinosDesdeBD();

            // 6. Asegurar combo de rutas
            cargarRutasEnDestinoFinal();

            console.log("reporteDiario.js cargado correctamente.");

        } catch (error) {

            console.error("Error inicializando sistema:", error);
        }
    }

    inicializarModulo();

    // Evento Delegado para botón Imagen y Motoristas
    document.addEventListener("click", function(e) {
        if (e.target.closest(".btn-imagen")) {
            generarReporteImagen();
        }
    });

    formViaje?.querySelector('[name="motorista"]')?.addEventListener("change", cargarDatosMotorista);

});
