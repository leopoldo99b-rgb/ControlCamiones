document.addEventListener("DOMContentLoaded", function() {

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
    let viajesFiltrados = [];
    let destinosBD = [];
    let rutasBD = [];
    let conductoresBD = [];
    let asignacionesBD = [];

    /* Paginación de la tabla de viajes */
    const REGISTROS_POR_PAGINA = 12;
    let paginaActual = 1;
    let paginaDestinos = 1;
    let paginaRutas = 1;

    const ESTADOS_ACTIVOS = ["ACTIVA", "ACTIVO", "VIGENTE"];

    /* Librerías para el PDF (se cargan solas la primera vez que se necesitan) */
    const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    const AUTOTABLE_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";

    /* =========================================================
       REFERENCIAS HTML
    ========================================================= */

    const modalViaje = document.getElementById("modalViaje");
    const modalDestino = document.getElementById("modalDestino");
    const modalRuta = document.getElementById("modalRuta");
    const modalEliminarViaje = document.getElementById("modalEliminarViaje");
    const modalEliminarDestino = document.getElementById("modalEliminarDestino");
    const modalEliminarRuta = document.getElementById("modalEliminarRuta");
    const modalRecomendacion = document.getElementById("modalRecomendacion");

    const formViaje = document.getElementById("formViaje");
    const formDestino = document.getElementById("formDestino");
    const formRuta = document.getElementById("formRuta");

    const buscador = document.getElementById("filtroBuscar");
    const filtroDesde = document.getElementById("filtroDesde");
    const filtroHasta = document.getElementById("filtroHasta");
    const filtroConductor = document.getElementById("filtroConductor");
    const filtroEstado = document.getElementById("filtroEstadoViaje");
    const btnLimpiar = document.querySelector(".btn-limpiar");

    const contenedorPaginacion = document.getElementById("paginacionViajes");
    const chipConductor = document.getElementById("chipConductor");
    const contenedorPaginacionDestinos = document.getElementById("paginacionDestinos");
    const contenedorPaginacionRutas = document.getElementById("paginacionRutas");

    /* Recomendación de programación */
    const recFecha = document.getElementById("recFecha");
    const recResumen = document.getElementById("recResumen");
    const recAvisos = document.getElementById("recAvisos");
    const recTbody = document.getElementById("recTbody");
    const recRankingTbody = document.getElementById("recRankingTbody");

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
        return String(valor || "").replace(/\s+/g, " ").trim().toLowerCase();
    }

    /*
     * Clave de comparación tolerante: sin tildes, sin signos y sin
     * espacios repetidos. "San Pedro Sula - Siguatepeque" y
     * "san pedro sula–siguatepeque " dan la misma clave.
     */
    function claveTexto(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    function nombreCompleto(persona) {
        if (!persona) {
            return "";
        }
        return ((persona.nombre || "") + " " + (persona.apellido || "")).trim();
    }

    function esSelect(el) {
        return !!(el && el.tagName && el.tagName.toUpperCase() === "SELECT");
    }

    function campo(form, nombre) {
        return form ? form.querySelector('[name="' + nombre + '"]') : null;
    }

    function esActiva(estado) {
        return ESTADOS_ACTIVOS.includes(String(estado || "ACTIVA").trim().toUpperCase());
    }

    function hayValor(v) {
        return v !== undefined && v !== null && v !== "";
    }

    function formatearNumero(valor) {
        const n = Number(valor);
        if (!isFinite(n)) {
            return "0";
        }
        return n.toLocaleString("es-HN", { maximumFractionDigits: 2 });
    }

    function fechaHoraActual() {
        const d = new Date();
        const p = function(n) { return String(n).padStart(2, "0"); };
        return {
            fecha: p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear(),
            hora: p(d.getHours()) + ":" + p(d.getMinutes())
        };
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

    /*
     * Petición HTTP unificada. Devuelve los datos ya procesados
     * y lanza Error con un mensaje legible si la respuesta no es OK.
     */
    async function api(url, metodo, cuerpo) {

        const headers = { "Accept": "application/json" };
        const opciones = { method: metodo || "GET", headers: headers, cache: "no-store" };

        if (cuerpo !== undefined) {
            headers["Content-Type"] = "application/json";
            opciones.body = JSON.stringify(cuerpo);
        }

        const response = await fetch(url, opciones);
        const datos = await procesarRespuesta(response);

        if (!response.ok) {
            throw new Error(obtenerMensajeHTTP(response, datos));
        }

        return datos;
    }

    /* =========================================================
       NOTIFICACIONES
    ========================================================= */

    function mostrarMensaje(mensaje, tipo = "success") {

        const ok = tipo === "success";
        const alerta = document.createElement("div");

        alerta.className = "notificacion-sistema " + (ok ? "notificacion-exito" : "notificacion-error");
        alerta.setAttribute("role", "alert");

        alerta.innerHTML = `
            <div class="notificacion-contenido" style="display:flex;align-items:center;gap:12px;">
                <i class="fa-solid ${ok ? "fa-circle-check" : "fa-circle-exclamation"}" style="font-size:22px;"></i>
                <div style="display:flex;flex-direction:column;">
                    <strong>${ok ? "Correcto" : "Error"}</strong>
                    <span>${escaparHTML(mensaje)}</span>
                </div>
            </div>
            <button type="button" class="notificacion-cerrar" aria-label="Cerrar">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        Object.assign(alerta.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: "999999",
            width: "min(500px, calc(100vw - 40px))",
            minHeight: "70px",
            padding: "16px 45px 16px 18px",
            borderRadius: "12px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            fontFamily: "inherit",
            backgroundColor: ok ? "#d1e7dd" : "#f8d7da",
            color: ok ? "#0f5132" : "#842029"
        });

        const cerrar = alerta.querySelector(".notificacion-cerrar");

        Object.assign(cerrar.style, {
            position: "absolute",
            top: "10px",
            right: "10px",
            border: "none",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            fontSize: "16px"
        });

        cerrar.addEventListener("click", function() {
            alerta.remove();
        });

        document.body.appendChild(alerta);

        setTimeout(function() {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 4000);
    }

    /* =========================================================
       BOOTSTRAP / MODALES
    ========================================================= */

    function obtenerModal(id) {

        const elemento = document.getElementById(id);

        if (!elemento) {
            console.error("No existe el modal:", id);
            return null;
        }

        if (typeof bootstrap === "undefined" || !bootstrap.Modal) {
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

    /* Mueve los modales al <body> para evitar problemas de z-index */
    [
        "modalViaje", "modalDestino", "modalRuta",
        "modalEliminarViaje", "modalEliminarDestino", "modalEliminarRuta",
        "modalRecomendacion"
    ].forEach(function(id) {
        const modal = document.getElementById(id);
        if (modal && modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }
    });

    function cambiarTituloModal(modal, titulo) {
        const elemento = modal ? modal.querySelector(".modal-title") : null;
        if (elemento) {
            elemento.textContent = titulo;
        }
    }

    function cambiarBotonGuardar(form, icono, texto) {
        const boton = form ? form.querySelector('button[type="submit"]') : null;
        if (boton) {
            boton.innerHTML = '<i class="fa-solid ' + icono + '"></i> ' + texto;
        }
    }

    /* =========================================================
       FECHAS Y HORAS
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
            return partes[2] + "-" + partes[1] + "-" + partes[0];
        }

        return "";
    }

    function formatearFecha(fecha) {
        const fechaInput = convertirFechaInput(fecha);
        if (!fechaInput) {
            return "";
        }
        const partes = fechaInput.split("-");
        return partes[2] + "/" + partes[1] + "/" + partes[0];
    }

    function convertirHoraParaInput(hora) {

        if (hora === null || hora === undefined) {
            return "";
        }

        const texto = String(hora).trim();

        if (/^\d{1,2}:\d{2}:\d{2}$/.test(texto)) {
            const partes = texto.split(":");
            return partes[0].padStart(2, "0") + ":" + partes[1];
        }

        if (/^\d{1,2}:\d{2}$/.test(texto)) {
            const partes = texto.split(":");
            return partes[0].padStart(2, "0") + ":" + partes[1];
        }

        return "";
    }

    /* =========================================================
       SELECTS / CAMPOS
    ========================================================= */

    /* Selecciona la opción cuyo valor o texto coincide. No dispara eventos. */
    function seleccionarPorTexto(select, texto) {

        if (!esSelect(select) || !hayValor(texto)) {
            return false;
        }

        const buscado = normalizarTexto(texto);

        for (let i = 0;i < select.options.length;i++) {

            const option = select.options[i];

            if (
                normalizarTexto(option.value) === buscado ||
                normalizarTexto(option.textContent) === buscado
            ) {
                select.selectedIndex = i;
                return true;
            }
        }

        return false;
    }

    /*
     * Pone un valor en un campo. Si es SELECT y la opción no existe
     * (por ejemplo una ruta o un motorista que ya no está en BD),
     * la agrega para poder editar el registro sin perder el dato.
     */
    function asegurarOpcion(elemento, valor) {

        if (!elemento || !hayValor(valor)) {
            return;
        }

        if (!esSelect(elemento)) {
            elemento.value = String(valor);
            return;
        }

        if (!seleccionarPorTexto(elemento, valor)) {
            const option = document.createElement("option");
            option.value = String(valor);
            option.textContent = String(valor);
            option.selected = true;
            elemento.appendChild(option);
        }
    }

    function filaEstado(columnas, icono, texto) {
        return `
            <tr class="fila-estado">
                <td colspan="${columnas}">
                    <i class="fa-solid ${icono}"></i>
                    ${escaparHTML(texto)}
                </td>
            </tr>
        `;
    }

    /* =========================================================
       CONDUCTORES
    ========================================================= */

    async function cargarConductoresParaViajes() {

        const motoristaSelect = campo(formViaje, "motorista");

        if (!motoristaSelect) {
            console.warn("No se encontró el combo [name='motorista'].");
            return;
        }

        try {

            const datos = await api("/conductores/api");

            if (!Array.isArray(datos)) {
                throw new Error("El servidor no devolvió una lista válida de conductores.");
            }

            conductoresBD = datos;

            if (!esSelect(motoristaSelect)) {
                return;
            }

            const valorActual = motoristaSelect.value || "";
            const fragmento = document.createDocumentFragment();

            const vacio = document.createElement("option");
            vacio.value = "";
            vacio.textContent = "Seleccione un motorista";
            fragmento.appendChild(vacio);

            conductoresBD.forEach(function(conductor) {

                const nombre = nombreCompleto(conductor);

                if (!nombre) {
                    return;
                }

                const option = document.createElement("option");
                option.value = nombre;
                option.textContent = nombre;

                if (hayValor(conductor.id)) {
                    option.dataset.id = conductor.id;
                }

                option.dataset.telefono = conductor.telefono || conductor.celular || "";

                fragmento.appendChild(option);
            });

            motoristaSelect.innerHTML = "";
            motoristaSelect.appendChild(fragmento);

            if (valorActual) {
                seleccionarPorTexto(motoristaSelect, valorActual);
            }

        } catch (error) {

            console.error("Error cargando conductores:", error);

            if (esSelect(motoristaSelect)) {
                motoristaSelect.innerHTML =
                    '<option value="">No se pudieron cargar los conductores</option>';
            }
        }
    }

    function obtenerConductorPorId(id) {

        if (!hayValor(id)) {
            return null;
        }

        return conductoresBD.find(function(conductor) {
            return String(conductor.id) === String(id);
        }) || null;
    }

    function obtenerConductorSeleccionado() {

        const motoristaSelect = campo(formViaje, "motorista");

        if (!motoristaSelect) {
            return null;
        }

        if (esSelect(motoristaSelect) && motoristaSelect.selectedIndex >= 0) {

            const option = motoristaSelect.options[motoristaSelect.selectedIndex];
            const id = option && option.dataset ? option.dataset.id : null;

            if (hayValor(id)) {
                return obtenerConductorPorId(id);
            }
        }

        const nombre = motoristaSelect.value || "";

        if (!nombre) {
            return null;
        }

        return conductoresBD.find(function(conductor) {
            return normalizarTexto(nombreCompleto(conductor)) === normalizarTexto(nombre);
        }) || null;
    }

    /* =========================================================
       ASIGNACIONES (CONDUCTOR -> CAMIÓN)
    ========================================================= */

    async function cargarAsignacionesParaViajes() {

        try {

            const datos = await api("/asignaciones/lista");

            if (!Array.isArray(datos)) {
                throw new Error("El servidor no devolvió una lista válida de asignaciones.");
            }

            asignacionesBD = datos;

        } catch (error) {

            console.error("Error cargando asignaciones:", error);

            asignacionesBD = [];
        }
    }

    function obtenerIdConductorDeAsignacion(a) {

        if (!a) {
            return null;
        }

        if (a.conductor && hayValor(a.conductor.id)) {
            return a.conductor.id;
        }

        if (hayValor(a.conductorId)) {
            return a.conductorId;
        }

        if (hayValor(a.idConductor)) {
            return a.idConductor;
        }

        if (hayValor(a.id_conductor)) {
            return a.id_conductor;
        }

        return null;
    }

    function asignacionEstaActiva(a) {

        if (!a) {
            return false;
        }

        const estado = String(a.estado || a.estadoAsignacion || a.status || "")
            .trim()
            .toUpperCase();

        if (!estado) {
            return true;
        }

        return ["ACTIVA", "ACTIVO", "VIGENTE", "ASIGNADO", "EN_USO"].includes(estado);
    }

    function obtenerPlacaDeAsignacion(a) {

        if (!a) {
            return "";
        }

        const candidatos = [
            a.placa,
            a.camion && a.camion.placa,
            a.camionAsignado && a.camionAsignado.placa,
            a.vehiculo && a.vehiculo.placa,
            a.placaCamion,
            a.placaVehiculo
        ];

        const placa = candidatos.find(Boolean);

        return placa ? String(placa).trim() : "";
    }

    function buscarAsignacionDelConductor(conductorId) {

        if (!hayValor(conductorId)) {
            return null;
        }

        const delConductor = asignacionesBD.filter(function(a) {
            return String(obtenerIdConductorDeAsignacion(a)) === String(conductorId);
        });

        return delConductor.find(asignacionEstaActiva) || delConductor[0] || null;
    }

    async function cargarDatosMotorista() {

        const telefonoInput = campo(formViaje, "telefono");
        const placaCampo = campo(formViaje, "placa");

        if (telefonoInput) {
            telefonoInput.value = "";
        }

        if (placaCampo) {
            if (esSelect(placaCampo)) {
                placaCampo.selectedIndex = 0;
            } else {
                placaCampo.value = "";
            }
        }

        const conductor = obtenerConductorSeleccionado();

        if (!conductor) {
            return;
        }

        if (telefonoInput) {
            telefonoInput.value = conductor.telefono || conductor.celular || "";
        }

        if (placaCampo) {

            if (asignacionesBD.length === 0) {
                await cargarAsignacionesParaViajes();
            }

            const placa = obtenerPlacaDeAsignacion(buscarAsignacionDelConductor(conductor.id));

            if (placa) {
                asegurarOpcion(placaCampo, placa);
            }
        }
    }

    /* =========================================================
       RUTAS
    ========================================================= */

    async function cargarRutasDesdeBD() {

        try {

            const datos = await api("/api/rutas");

            if (!Array.isArray(datos)) {
                throw new Error("El servidor no devolvió una lista válida de rutas.");
            }

            rutasBD = datos;

            pintarTablaRutas(rutasBD);
            cargarRutasEnDestinoFinal();
            actualizarContadores();

        } catch (error) {

            console.error("Error cargando rutas:", error);

            pintarTablaRutas([]);

            mostrarMensaje(
                "No fue posible cargar las rutas. " + error.message,
                "error"
            );
        }
    }

    function nombreDeRuta(ruta) {
        return ruta.destino || ruta.nombreRuta || ruta.nombre || ruta.ruta || "";
    }

    function cargarRutasEnDestinoFinal(valorForzado) {

        const destinoFinal = campo(formViaje, "destinoFinal");

        if (!destinoFinal || !esSelect(destinoFinal)) {
            return;
        }

        const valorActual = hayValor(valorForzado)
            ? String(valorForzado)
            : String(destinoFinal.value || "");

        const fragmento = document.createDocumentFragment();

        const vacio = document.createElement("option");
        vacio.value = "";
        vacio.textContent = "Seleccione destino final";
        fragmento.appendChild(vacio);

        let agregadas = 0;

        rutasBD.forEach(function(ruta) {

            if (!ruta || !esActiva(ruta.estado)) {
                return;
            }

            const nombre = nombreDeRuta(ruta);

            if (!nombre) {
                return;
            }

            const option = document.createElement("option");
            option.value = String(nombre);
            option.textContent = String(nombre);

            if (hayValor(ruta.id)) {
                option.dataset.id = ruta.id;
            }

            if (ruta.odt) {
                option.dataset.odt = ruta.odt;
            }

            fragmento.appendChild(option);
            agregadas++;
        });

        if (agregadas === 0) {
            const sinRutas = document.createElement("option");
            sinRutas.value = "";
            sinRutas.textContent = "No hay rutas registradas";
            sinRutas.disabled = true;
            fragmento.appendChild(sinRutas);
        }

        destinoFinal.innerHTML = "";
        destinoFinal.appendChild(fragmento);

        if (valorActual) {
            asegurarOpcion(destinoFinal, valorActual);
        }
    }

    function pintarTablaRutas(rutas) {

        const tbody = document.querySelector("#tab-rutas .tabla-rutas tbody");

        if (!tbody) {
            return;
        }

        /* Paginación: solo se pintan las rutas de la página actual */
        const listaRutas = Array.isArray(rutas) ? rutas : [];
        const totalRutas = listaRutas.length;
        const totalPaginasRutas = Math.max(1, Math.ceil(totalRutas / REGISTROS_POR_PAGINA));

        if (paginaRutas > totalPaginasRutas) {
            paginaRutas = totalPaginasRutas;
        }

        if (paginaRutas < 1) {
            paginaRutas = 1;
        }

        rutas = listaRutas.slice(
            (paginaRutas - 1) * REGISTROS_POR_PAGINA,
            paginaRutas * REGISTROS_POR_PAGINA
        );

        dibujarPaginacion(contenedorPaginacionRutas, totalRutas, paginaRutas, "rutas");

        if (!Array.isArray(rutas) || rutas.length === 0) {
            tbody.innerHTML = filaEstado(4, "fa-inbox", "No hay rutas registradas.");
        } else {

            const fragmento = document.createDocumentFragment();

            rutas.forEach(function(ruta) {

                const activa = esActiva(ruta.estado);
                const tiempoCrudo = ruta.odt || ruta.tiempo || ruta.tiempoPromedio || "";
                const tiempo = convertirHoraParaInput(tiempoCrudo) || tiempoCrudo;
                const id = escaparHTML(String(ruta.id));

                const fila = document.createElement("tr");

                fila.innerHTML = `
                    <td>
                        <div class="dato-principal">
                            <div class="dato-icon ruta-icon"><i class="fa-solid fa-route"></i></div>
                            <strong>${escaparHTML(nombreDeRuta(ruta))}</strong>
                        </div>
                    </td>
                    <td>
                        <span class="hora"><i class="fa-regular fa-clock"></i> ${escaparHTML(tiempo)}</span>
                    </td>
                    <td>
                        <span class="estado ${activa ? "activo" : "inactivo"}">
                            <span class="estado-punto"></span>
                            ${activa ? "Activa" : "Inactiva"}
                        </span>
                    </td>
                    <td>
                        <div class="acciones-tabla">
                            <button type="button" class="btn-accion editar" data-id="${id}" title="Editar ruta">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button type="button" class="btn-accion eliminar" data-id="${id}" title="Eliminar ruta">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;

                fragmento.appendChild(fila);
            });

            tbody.innerHTML = "";
            tbody.appendChild(fragmento);
        }

        const etiqueta = document.querySelector("#tab-rutas .cantidad-registros strong");

        if (etiqueta) {
            etiqueta.textContent = totalRutas;
        }
    }

    async function editarRuta(id) {

        try {

            const ruta = await api("/api/rutas/" + encodeURIComponent(id));

            if (!ruta) {
                throw new Error("El servidor no devolvió información de la ruta.");
            }

            rutaEditando = ruta.id;

            const destino = campo(formRuta, "destino");
            const odt = campo(formRuta, "odt");
            const estado = campo(formRuta, "estado");

            if (destino) {
                destino.value = nombreDeRuta(ruta);
            }

            if (odt) {
                odt.value = convertirHoraParaInput(ruta.odt || ruta.tiempo || ruta.tiempoPromedio);
            }

            if (estado) {
                estado.value = ruta.estado || "ACTIVA";
            }

            cambiarTituloModal(modalRuta, "Editar ruta");
            cambiarBotonGuardar(formRuta, "fa-pen", "Actualizar ruta");
            abrirModal("modalRuta");

        } catch (error) {

            console.error("Error obteniendo ruta:", error);

            mostrarMensaje(error.message || "No se pudo cargar la ruta.", "error");
        }
    }

    async function eliminarRuta(id) {

        try {

            await api("/api/rutas/" + encodeURIComponent(id), "DELETE");

            cerrarModal("modalEliminarRuta");
            mostrarMensaje("Ruta eliminada correctamente.");

            rutaEliminar = null;

            await cargarRutasDesdeBD();

        } catch (error) {

            console.error("Error eliminando ruta:", error);

            mostrarMensaje(error.message || "No se pudo eliminar la ruta.", "error");
        }
    }

    if (formRuta) {

        formRuta.addEventListener("submit", async function(event) {

            event.preventDefault();

            if (!formRuta.checkValidity()) {
                formRuta.reportValidity();
                return;
            }

            const destino = campo(formRuta, "destino");
            const odt = campo(formRuta, "odt");
            const estado = campo(formRuta, "estado");

            const datos = {
                destino: destino ? destino.value.trim() : "",
                odt: odt ? odt.value : "",
                estado: estado ? estado.value : "ACTIVA"
            };

            const boton = formRuta.querySelector('button[type="submit"]');

            try {

                if (boton) {
                    boton.disabled = true;
                }

                const editando = !!rutaEditando;

                if (editando) {
                    await api("/api/rutas/" + encodeURIComponent(rutaEditando), "PUT", datos);
                } else {
                    await api("/api/rutas", "POST", datos);
                }

                mostrarMensaje(
                    editando
                        ? "Ruta actualizada correctamente."
                        : "Ruta guardada correctamente."
                );

                cerrarModal("modalRuta");

                rutaEditando = null;
                formRuta.reset();

                await cargarRutasDesdeBD();

            } catch (error) {

                console.error("Error guardando ruta:", error);

                mostrarMensaje(error.message || "No se pudo guardar la ruta.", "error");

            } finally {

                if (boton) {
                    boton.disabled = false;
                }
            }
        });
    }

    function prepararNuevaRuta() {

        rutaEditando = null;

        if (formRuta) {
            formRuta.reset();
        }

        cambiarTituloModal(modalRuta, "Registrar ruta");
        cambiarBotonGuardar(formRuta, "fa-floppy-disk", "Guardar ruta");
    }

    if (modalRuta) {
        modalRuta.addEventListener("hidden.bs.modal", function() {
            prepararNuevaRuta();
        });
    }

    /* =========================================================
       VIAJES
    ========================================================= */

    function normalizarViaje(viaje) {

        if (!viaje) {
            return null;
        }

        let motorista = "";

        if (typeof viaje.motorista === "string") {
            motorista = viaje.motorista;
        } else if (viaje.motorista && typeof viaje.motorista === "object") {
            motorista = nombreCompleto(viaje.motorista);
        } else if (typeof viaje.conductor === "string") {
            motorista = viaje.conductor;
        } else if (viaje.conductor && typeof viaje.conductor === "object") {
            motorista = nombreCompleto(viaje.conductor);
        }

        return {
            id: viaje.id,
            fecha: viaje.fecha || viaje.fechaProgramacion || "",
            destinoInicial: viaje.destinoInicial || "",
            destinoFinal: viaje.destinoFinal || "",
            placa: viaje.placa || viaje.placaCamion || "",
            motorista: motorista,
            telefono: viaje.telefono || viaje.celular || "",
            estado: String(viaje.estado || "PROGRAMADO").toUpperCase()
        };
    }

    async function cargarViajesDesdeBD() {

        try {

            const datos = await api("/programaciones/lista");

            if (!Array.isArray(datos)) {
                throw new Error("El servidor no devolvió una lista válida de programaciones.");
            }

            viajesBD = datos.map(normalizarViaje).filter(Boolean);

            llenarFiltroConductores();
            aplicarFiltros(true);
            actualizarContadores();

            /* Los viajes de días anteriores pasan solos a FINALIZADO */
            finalizarViajesVencidos();

        } catch (error) {

            console.error("Error cargando viajes:", error);

            if (viajesBD.length === 0) {
                pintarTablaViajes([]);
            }

            mostrarMensaje(error.message || "No se pudieron cargar los viajes.", "error");
        }
    }

    /* =========================================================
       FINALIZAR VIAJES AUTOMÁTICAMENTE
       Un viaje PROGRAMADO o EN CURSO pasa a FINALIZADO cuando
       llega la fecha siguiente a la del viaje (pasadas 24 horas).
       Los CANCELADOS no se tocan.
    ========================================================= */

    let finalizandoViajes = false;

    function fechaHoyISO() {
        const d = new Date();
        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    async function finalizarViajesVencidos() {

        if (finalizandoViajes) {
            return;
        }

        const hoy = fechaHoyISO();

        const vencidos = viajesBD.filter(function(viaje) {

            const f = convertirFechaInput(viaje.fecha);

            return f && f < hoy &&
                (viaje.estado === "PROGRAMADO" || viaje.estado === "EN_CURSO");
        });

        if (vencidos.length === 0) {
            return;
        }

        finalizandoViajes = true;

        try {

            const resultados = await Promise.allSettled(vencidos.map(function(viaje) {

                return api(
                    "/programaciones/editar/" + encodeURIComponent(viaje.id),
                    "PUT",
                    {
                        fecha: convertirFechaInput(viaje.fecha) || null,
                        destinoInicial: viaje.destinoInicial || "",
                        destinoFinal: viaje.destinoFinal || "",
                        placa: viaje.placa || "",
                        motorista: viaje.motorista || "",
                        telefono: viaje.telefono || "",
                        estado: "FINALIZADO"
                    }
                );
            }));

            let correctos = 0;

            resultados.forEach(function(resultado, i) {

                if (resultado.status === "fulfilled") {
                    vencidos[i].estado = "FINALIZADO";
                    correctos++;
                } else {
                    console.error("No se pudo finalizar el viaje " + vencidos[i].id + ":", resultado.reason);
                }
            });

            if (correctos > 0) {

                aplicarFiltros(true);
                actualizarContadores();

                mostrarMensaje(
                    correctos === 1
                        ? "1 viaje pasó a Finalizado automáticamente."
                        : correctos + " viajes pasaron a Finalizado automáticamente."
                );
            }

        } finally {

            finalizandoViajes = false;
        }
    }

    function pintarTablaViajes(lista) {

        /* Guardamos la lista completa filtrada y ordenada: la imagen usa esta misma lista */
        viajesFiltrados = Array.isArray(lista) ? lista.slice() : [];

        const tbody = document.getElementById("tbodyViajes") ||
            document.querySelector("#tab-viajes tbody");

        if (!tbody) {
            console.error("No se encontró ningún <tbody> dentro de #tab-viajes.");
            return;
        }

        const total = viajesFiltrados.length;
        const etiqueta = document.querySelector("#tab-viajes .cantidad-registros strong");

        if (etiqueta) {
            etiqueta.textContent = total;
        }

        actualizarChipConductor();

        if (total === 0) {
            tbody.innerHTML = filaEstado(8, "fa-inbox", "No hay viajes registrados.");
            renderizarPaginacion(0);
            return;
        }

        /* Paginación: solo se pintan los 12 de la página actual */
        const totalPaginas = Math.ceil(total / REGISTROS_POR_PAGINA);

        if (paginaActual > totalPaginas) {
            paginaActual = totalPaginas;
        }

        if (paginaActual < 1) {
            paginaActual = 1;
        }

        const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
        const paginaViajes = viajesFiltrados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

        const estados = {
            "PROGRAMADO": ["programado", "Programado"],
            "EN_CURSO": ["en-curso", "En curso"],
            "FINALIZADO": ["finalizado", "Finalizado"],
            "CANCELADO": ["cancelado", "Cancelado"]
        };

        const fragmento = document.createDocumentFragment();

        paginaViajes.forEach(function(viaje) {

            const estado = String(viaje.estado || "PROGRAMADO").toUpperCase();
            const par = estados[estado] || estados.PROGRAMADO;
            const motorista = viaje.motorista || "";

            const iniciales = motorista
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(function(n) { return n.charAt(0); })
                .join("")
                .toUpperCase();

            const id = escaparHTML(String(viaje.id));

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td><span class="fecha">${escaparHTML(formatearFecha(viaje.fecha))}</span></td>
                <td><span class="ruta">${escaparHTML(viaje.destinoInicial)}</span></td>
                <td><span class="ruta">${escaparHTML(viaje.destinoFinal)}</span></td>
                <td><span class="placa">${escaparHTML(viaje.placa)}</span></td>
                <td>
                    <div class="motorista">
                        <div class="avatar">${escaparHTML(iniciales || "M")}</div>
                        <div class="motorista-info"><strong>${escaparHTML(motorista)}</strong></div>
                    </div>
                </td>
                <td>
                    <span class="telefono">
                        <i class="fa-solid fa-phone"></i>
                        ${escaparHTML(viaje.telefono)}
                    </span>
                </td>
                <td>
                    <span class="estado ${par[0]}">
                        <span class="estado-punto"></span>
                        ${escaparHTML(par[1])}
                    </span>
                </td>
                <td>
                    <div class="acciones-tabla">
                        <button class="btn-accion editar" type="button" data-id="${id}" title="Editar viaje">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-accion eliminar" type="button" data-id="${id}" title="Eliminar viaje">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            fragmento.appendChild(fila);
        });

        tbody.innerHTML = "";
        tbody.appendChild(fragmento);

        renderizarPaginacion(total);
    }

    /* =========================================================
       PAGINACIÓN (VIAJES, DESTINOS Y RUTAS)
    ========================================================= */

    function dibujarPaginacion(contenedor, total, pagina, palabra) {

        if (!contenedor) {
            return;
        }

        if (total === 0) {
            contenedor.hidden = true;
            contenedor.innerHTML = "";
            return;
        }

        contenedor.hidden = false;

        const totalPaginas = Math.ceil(total / REGISTROS_POR_PAGINA);
        const desde = (pagina - 1) * REGISTROS_POR_PAGINA + 1;
        const hasta = Math.min(pagina * REGISTROS_POR_PAGINA, total);

        /* Números de página; si son muchas se abrevian con "…" */
        const paginas = [];

        for (let i = 1;i <= totalPaginas;i++) {
            if (i === 1 || i === totalPaginas || Math.abs(i - pagina) <= 1) {
                paginas.push(i);
            } else if (paginas[paginas.length - 1] !== "...") {
                paginas.push("...");
            }
        }

        let botones = `
            <button type="button" class="pag-btn" data-pagina="${pagina - 1}" ${pagina === 1 ? "disabled" : ""}>
                <i class="fa-solid fa-chevron-left"></i>
            </button>
        `;

        paginas.forEach(function(p) {
            if (p === "...") {
                botones += '<span class="pag-puntos">…</span>';
            } else {
                botones += `<button type="button" class="pag-btn ${p === pagina ? "activa" : ""}" data-pagina="${p}">${p}</button>`;
            }
        });

        botones += `
            <button type="button" class="pag-btn" data-pagina="${pagina + 1}" ${pagina === totalPaginas ? "disabled" : ""}>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;

        contenedor.innerHTML = `
            <div class="paginacion-info">
                Mostrando <strong>${desde}–${hasta}</strong> de <strong>${total}</strong> ${escaparHTML(palabra)}
            </div>
            <div class="paginacion-botones">${botones}</div>
        `;
    }

    function enlazarPaginacion(contenedor, alCambiar) {

        if (!contenedor) {
            return;
        }

        contenedor.addEventListener("click", function(event) {

            const boton = event.target.closest(".pag-btn");

            if (!boton || boton.disabled || boton.classList.contains("activa")) {
                return;
            }

            const pagina = parseInt(boton.dataset.pagina, 10);

            if (!isFinite(pagina)) {
                return;
            }

            alCambiar(pagina);

            const hoja = contenedor.closest(".hoja-tab");

            if (hoja) {
                hoja.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    }

    function renderizarPaginacion(total) {
        dibujarPaginacion(contenedorPaginacion, total, paginaActual, "viajes");
    }

    enlazarPaginacion(contenedorPaginacion, function(pagina) {
        paginaActual = pagina;
        pintarTablaViajes(viajesFiltrados);
    });

    enlazarPaginacion(contenedorPaginacionDestinos, function(pagina) {
        paginaDestinos = pagina;
        pintarTablaDestinos(destinosBD);
    });

    enlazarPaginacion(contenedorPaginacionRutas, function(pagina) {
        paginaRutas = pagina;
        pintarTablaRutas(rutasBD);
    });

    /* =========================================================
       FILTRO POR CONDUCTOR
    ========================================================= */

    function llenarFiltroConductores() {

        if (!filtroConductor) {
            return;
        }

        const valorActual = filtroConductor.value;
        const nombres = {};

        viajesBD.forEach(function(viaje) {
            const nombre = String(viaje.motorista || "").trim();
            if (nombre) {
                nombres[normalizarTexto(nombre)] = nombre;
            }
        });

        const lista = Object.keys(nombres)
            .map(function(k) { return nombres[k]; })
            .sort(function(a, b) { return a.localeCompare(b, "es"); });

        filtroConductor.innerHTML = '<option value="">Todos</option>';

        lista.forEach(function(nombre) {
            const option = document.createElement("option");
            option.value = nombre;
            option.textContent = nombre;
            filtroConductor.appendChild(option);
        });

        if (valorActual) {
            seleccionarPorTexto(filtroConductor, valorActual);
        }
    }

    /* Muestra cuántos viajes tiene el conductor elegido (respetando fechas y estado) */
    function actualizarChipConductor() {

        if (!chipConductor) {
            return;
        }

        if (!filtroConductor || !filtroConductor.value) {
            chipConductor.hidden = true;
            chipConductor.innerHTML = "";
            return;
        }

        chipConductor.hidden = false;
        chipConductor.innerHTML =
            '<i class="fa-solid fa-user"></i> ' + escaparHTML(filtroConductor.value) +
            ': <strong>' + viajesFiltrados.length + '</strong> viaje(s)';
    }

    async function asegurarDatosDelFormulario() {

        const tareas = [];

        if (rutasBD.length === 0) {
            tareas.push(cargarRutasDesdeBD());
        } else {
            cargarRutasEnDestinoFinal();
        }

        if (conductoresBD.length === 0) {
            tareas.push(cargarConductoresParaViajes());
        }

        if (asignacionesBD.length === 0) {
            tareas.push(cargarAsignacionesParaViajes());
        }

        await Promise.all(tareas);
    }

    async function abrirNuevoViaje() {

        viajeEditando = null;

        if (formViaje) {

            formViaje.reset();

            const id = campo(formViaje, "id");

            if (id) {
                id.value = "";
            }
        }

        cambiarTituloModal(modalViaje, "Registrar viaje");
        cambiarBotonGuardar(formViaje, "fa-floppy-disk", "Guardar viaje");

        await asegurarDatosDelFormulario();

        abrirModal("modalViaje");
    }

    async function editarViaje(id) {

        if (!hayValor(id)) {
            mostrarMensaje("No se encontró el ID del viaje.", "error");
            return;
        }

        try {

            const respuesta = await api("/programaciones/" + encodeURIComponent(id));

            if (!respuesta) {
                throw new Error("El servidor no devolvió información del viaje.");
            }

            const viaje = normalizarViaje(respuesta);

            if (!viaje || !hayValor(viaje.id)) {
                throw new Error("El viaje recibido no contiene un ID.");
            }

            if (!formViaje) {
                throw new Error("No se encontró el formulario de viajes.");
            }

            viajeEditando = viaje.id;

            await asegurarDatosDelFormulario();

            formViaje.reset();

            const idInput = campo(formViaje, "id");
            const fecha = campo(formViaje, "fecha");
            const destinoInicial = campo(formViaje, "destinoInicial");
            const destinoFinal = campo(formViaje, "destinoFinal");
            const placa = campo(formViaje, "placa");
            const motorista = campo(formViaje, "motorista");
            const telefono = campo(formViaje, "telefono");
            const estado = campo(formViaje, "estado");

            if (idInput) {
                idInput.value = viaje.id;
            }

            if (fecha) {
                fecha.value = convertirFechaInput(viaje.fecha);
            }

            asegurarOpcion(destinoInicial, viaje.destinoInicial);

            if (destinoFinal) {
                cargarRutasEnDestinoFinal(viaje.destinoFinal);
            }

            asegurarOpcion(motorista, viaje.motorista);
            asegurarOpcion(estado, viaje.estado || "PROGRAMADO");

            if (telefono) {
                telefono.value = viaje.telefono || "";
            }

            asegurarOpcion(placa, viaje.placa);

            /*
             * Si el viaje guardado no trae teléfono o placa,
             * los completamos con los datos actuales del motorista.
             */
            if (motorista && motorista.value && (!viaje.telefono || !viaje.placa)) {

                await cargarDatosMotorista();

                if (telefono && viaje.telefono) {
                    telefono.value = viaje.telefono;
                }

                if (placa && viaje.placa) {
                    asegurarOpcion(placa, viaje.placa);
                }
            }

            cambiarTituloModal(modalViaje, "Editar viaje");
            cambiarBotonGuardar(formViaje, "fa-pen", "Actualizar viaje");

            abrirModal("modalViaje");

        } catch (error) {

            console.error("Error obteniendo viaje para editar:", error);

            viajeEditando = null;

            mostrarMensaje(error.message || "No se pudo cargar el viaje.", "error");
        }
    }

    if (formViaje) {

        formViaje.addEventListener("submit", async function(event) {

            event.preventDefault();

            if (!formViaje.checkValidity()) {
                formViaje.reportValidity();
                return;
            }

            const fecha = campo(formViaje, "fecha");
            const destinoInicial = campo(formViaje, "destinoInicial");
            const destinoFinal = campo(formViaje, "destinoFinal");
            const placa = campo(formViaje, "placa");
            const motorista = campo(formViaje, "motorista");
            const telefono = campo(formViaje, "telefono");
            const estado = campo(formViaje, "estado");
            const idInput = campo(formViaje, "id");

            const boton = formViaje.querySelector('button[type="submit"]');

            try {

                if (boton) {
                    boton.disabled = true;
                }

                /* Solo autocompletamos si faltan teléfono o placa */
                if (
                    motorista && motorista.value &&
                    ((telefono && !telefono.value) || (placa && !placa.value))
                ) {
                    await cargarDatosMotorista();
                }

                let idParaEditar = viajeEditando;

                if (!hayValor(idParaEditar) && idInput && idInput.value !== "") {
                    idParaEditar = idInput.value;
                }

                const editando = hayValor(idParaEditar);

                const datos = {
                    fecha: fecha ? fecha.value || null : null,
                    destinoInicial: destinoInicial ? destinoInicial.value || "" : "",
                    destinoFinal: destinoFinal ? destinoFinal.value || "" : "",
                    placa: placa ? placa.value || "" : "",
                    motorista: motorista ? motorista.value || "" : "",
                    telefono: telefono ? telefono.value || "" : "",
                    estado: estado ? estado.value || "PROGRAMADO" : "PROGRAMADO"
                };

                if (editando) {
                    await api("/programaciones/editar/" + encodeURIComponent(idParaEditar), "PUT", datos);
                } else {
                    await api("/programaciones/guardar", "POST", datos);
                }

                mostrarMensaje(
                    editando
                        ? "El viaje fue actualizado correctamente."
                        : "El viaje fue guardado correctamente."
                );

                cerrarModal("modalViaje");

                viajeEditando = null;
                formViaje.reset();

                await cargarViajesDesdeBD();

            } catch (error) {

                console.error("Error guardando viaje:", error);

                mostrarMensaje(error.message || "No se pudo guardar el viaje.", "error");

            } finally {

                if (boton) {
                    boton.disabled = false;
                }
            }
        });

        const motoristaSelect = campo(formViaje, "motorista");

        if (motoristaSelect) {
            motoristaSelect.addEventListener("change", cargarDatosMotorista);
        }
    }

    async function eliminarViaje(id) {

        if (!hayValor(id)) {
            mostrarMensaje("No se encontró el ID del viaje.", "error");
            return;
        }

        try {

            await api("/programaciones/eliminar/" + encodeURIComponent(id), "DELETE");

            cerrarModal("modalEliminarViaje");
            mostrarMensaje("El viaje fue eliminado correctamente.");

            viajeEliminar = null;

            await cargarViajesDesdeBD();

        } catch (error) {

            console.error("Error eliminando viaje:", error);

            mostrarMensaje(error.message || "No se pudo eliminar el viaje.", "error");
        }
    }

    if (modalViaje) {

        modalViaje.addEventListener("hidden.bs.modal", function() {

            viajeEditando = null;

            if (formViaje) {

                formViaje.reset();

                const id = campo(formViaje, "id");

                if (id) {
                    id.value = "";
                }
            }

            cambiarTituloModal(modalViaje, "Registrar viaje");
            cambiarBotonGuardar(formViaje, "fa-floppy-disk", "Guardar viaje");
        });
    }

    /* =========================================================
       FILTROS DE VIAJES (texto, rango de fechas, conductor, estado)
       Siempre ordenados de la fecha más reciente a la más antigua.
    ========================================================= */

    function aplicarFiltros(mantenerPagina) {

        let resultado = Array.isArray(viajesBD) ? viajesBD.slice() : [];

        if (buscador) {

            const texto = normalizarTexto(buscador.value);

            if (texto) {

                resultado = resultado.filter(function(viaje) {

                    const contenido = [
                        viaje.destinoInicial,
                        viaje.destinoFinal,
                        viaje.placa,
                        viaje.motorista,
                        viaje.telefono
                    ].join(" ");

                    return normalizarTexto(contenido).includes(texto);
                });
            }
        }

        /* Rango de fechas (desde / hasta, ambos inclusivos) */
        let desde = filtroDesde ? filtroDesde.value : "";
        let hasta = filtroHasta ? filtroHasta.value : "";

        if (desde && hasta && desde > hasta) {
            const tmp = desde;
            desde = hasta;
            hasta = tmp;
        }

        if (desde || hasta) {

            resultado = resultado.filter(function(viaje) {

                const f = convertirFechaInput(viaje.fecha);

                if (!f) {
                    return false;
                }

                if (desde && f < desde) {
                    return false;
                }

                if (hasta && f > hasta) {
                    return false;
                }

                return true;
            });
        }

        /* Por conductor */
        if (filtroConductor && filtroConductor.value) {

            const buscado = normalizarTexto(filtroConductor.value);

            resultado = resultado.filter(function(viaje) {
                return normalizarTexto(viaje.motorista) === buscado;
            });
        }

        /* Por estado */
        if (filtroEstado && filtroEstado.value) {
            resultado = resultado.filter(function(viaje) {
                return String(viaje.estado || "").toUpperCase() ===
                    String(filtroEstado.value).toUpperCase();
            });
        }

        /* Siempre de la fecha más reciente a la más antigua */
        resultado.sort(function(a, b) {

            const fa = convertirFechaInput(a.fecha);
            const fb = convertirFechaInput(b.fecha);

            if (fa !== fb) {
                return fb.localeCompare(fa);
            }

            return Number(b.id) - Number(a.id);
        });

        /* Al cambiar un filtro se vuelve a la página 1 */
        if (mantenerPagina !== true) {
            paginaActual = 1;
        }

        pintarTablaViajes(resultado);
    }

    /* El buscador espera 150 ms tras la última tecla (evita repintar en cada letra) */
    let temporizadorBuscador = null;

    if (buscador) {
        buscador.addEventListener("input", function() {
            clearTimeout(temporizadorBuscador);
            temporizadorBuscador = setTimeout(function() {
                aplicarFiltros();
            }, 150);
        });
    }

    [filtroDesde, filtroHasta, filtroConductor, filtroEstado].forEach(function(el) {
        if (el) {
            el.addEventListener("change", function() {
                aplicarFiltros();
            });
        }
    });

    if (btnLimpiar) {

        btnLimpiar.addEventListener("click", function() {

            clearTimeout(temporizadorBuscador);

            if (buscador) {
                buscador.value = "";
            }

            if (filtroDesde) {
                filtroDesde.value = "";
            }

            if (filtroHasta) {
                filtroHasta.value = "";
            }

            if (filtroConductor) {
                filtroConductor.value = "";
            }

            if (filtroEstado) {
                filtroEstado.value = "";
            }

            aplicarFiltros();
        });
    }

    /* =========================================================
       DESTINOS
    ========================================================= */

    async function cargarDestinosDesdeBD() {

        try {

            const datos = await api("/api/destinos");

            destinosBD = Array.isArray(datos) ? datos : [];

            pintarTablaDestinos(destinosBD);
            actualizarContadores();

        } catch (error) {

            console.error("Error cargando destinos:", error);

            pintarTablaDestinos([]);
        }
    }

    function nombreDeDestino(destino) {
        return destino.destino || destino.nombre || destino.nombreDestino || "";
    }

    function pintarTablaDestinos(lista) {

        const tbody = document.querySelector("#tab-destinos .tabla-admin tbody");

        if (!tbody) {
            return;
        }

        /* Paginación: solo se pintan los destinos de la página actual */
        const listaDestinos = Array.isArray(lista) ? lista : [];
        const totalDestinos = listaDestinos.length;
        const totalPaginasDestinos = Math.max(1, Math.ceil(totalDestinos / REGISTROS_POR_PAGINA));

        if (paginaDestinos > totalPaginasDestinos) {
            paginaDestinos = totalPaginasDestinos;
        }

        if (paginaDestinos < 1) {
            paginaDestinos = 1;
        }

        lista = listaDestinos.slice(
            (paginaDestinos - 1) * REGISTROS_POR_PAGINA,
            paginaDestinos * REGISTROS_POR_PAGINA
        );

        dibujarPaginacion(contenedorPaginacionDestinos, totalDestinos, paginaDestinos, "destinos");

        if (!lista || lista.length === 0) {
            tbody.innerHTML = filaEstado(5, "fa-inbox", "No hay destinos registrados.");
        } else {

            const fragmento = document.createDocumentFragment();

            lista.forEach(function(destino) {

                const id = escaparHTML(String(destino.id));
                const nombre = nombreDeDestino(destino);

                const fila = document.createElement("tr");

                fila.innerHTML = `
                    <td>
                        <div class="dato-principal">
                            <div class="dato-icon destino-icon"><i class="fa-solid fa-location-dot"></i></div>
                            <strong>${escaparHTML(nombre)}</strong>
                        </div>
                    </td>
                    <td><span class="dato-numero">${escaparHTML(destino.km || destino.kilometros || 0)} km</span></td>
                    <td><span class="dato-numero">${escaparHTML(destino.galones || 0)} gal</span></td>
                    <td>${escaparHTML(destino.peajes || 0)}</td>
                    <td>
                        <div class="acciones-tabla">
                            <button type="button" class="btn-accion editar" data-id="${id}" title="Editar destino">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button type="button" class="btn-accion eliminar" data-id="${id}" title="Eliminar destino">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;

                fragmento.appendChild(fila);
            });

            tbody.innerHTML = "";
            tbody.appendChild(fragmento);
        }

        const etiqueta = document.querySelector("#tab-destinos .cantidad-registros strong");

        if (etiqueta) {
            etiqueta.textContent = totalDestinos;
        }
    }

    async function editarDestino(id) {

        try {

            const destino = await api("/api/destinos/" + encodeURIComponent(id));

            if (!destino) {
                throw new Error("El servidor no devolvió información del destino.");
            }

            destinoEditando = destino.id;

            const nombre = campo(formDestino, "destino");
            const kilometros = campo(formDestino, "kilometros");
            const galones = campo(formDestino, "galones");
            const peajes = campo(formDestino, "peajes");

            if (nombre) {
                nombre.value = nombreDeDestino(destino);
            }

            if (kilometros) {
                kilometros.value = hayValor(destino.km) ? destino.km : (destino.kilometros || "");
            }

            if (galones) {
                galones.value = destino.galones || "";
            }

            if (peajes) {
                peajes.value = destino.peajes || 0;
            }

            cambiarTituloModal(modalDestino, "Editar destino");
            cambiarBotonGuardar(formDestino, "fa-pen", "Actualizar destino");
            abrirModal("modalDestino");

        } catch (error) {

            console.error("Error obteniendo destino:", error);

            mostrarMensaje(error.message || "No se pudo cargar el destino.", "error");
        }
    }

    if (formDestino) {

        formDestino.addEventListener("submit", async function(event) {

            event.preventDefault();

            if (!formDestino.checkValidity()) {
                formDestino.reportValidity();
                return;
            }

            const nombreField = campo(formDestino, "destino");
            const kmField = campo(formDestino, "kilometros");
            const galonesField = campo(formDestino, "galones");
            const peajesField = campo(formDestino, "peajes");

            if (!kmField || kmField.value === "" || isNaN(parseFloat(kmField.value))) {
                mostrarMensaje("Los kilómetros son obligatorios y deben ser un número.", "error");
                return;
            }

            const datos = {
                destino: nombreField ? nombreField.value.trim() : "",
                km: parseFloat(kmField.value),
                galones: galonesField && galonesField.value !== "" ? parseFloat(galonesField.value) : 0,
                peajes: peajesField && peajesField.value !== "" ? parseInt(peajesField.value, 10) : 0
            };

            const boton = formDestino.querySelector('button[type="submit"]');

            try {

                if (boton) {
                    boton.disabled = true;
                }

                const editando = !!destinoEditando;

                if (editando) {
                    await api("/api/destinos/" + encodeURIComponent(destinoEditando), "PUT", datos);
                } else {
                    await api("/api/destinos", "POST", datos);
                }

                mostrarMensaje(
                    editando
                        ? "Destino actualizado correctamente."
                        : "Destino guardado correctamente."
                );

                cerrarModal("modalDestino");

                destinoEditando = null;
                formDestino.reset();

                await cargarDestinosDesdeBD();

            } catch (error) {

                console.error("Error guardando destino:", error);

                mostrarMensaje(error.message || "No se pudo guardar el destino.", "error");

            } finally {

                if (boton) {
                    boton.disabled = false;
                }
            }
        });
    }

    async function eliminarDestino(id) {

        try {

            await api("/api/destinos/" + encodeURIComponent(id), "DELETE");

            cerrarModal("modalEliminarDestino");
            mostrarMensaje("Destino eliminado correctamente.");

            destinoEliminar = null;

            await cargarDestinosDesdeBD();

        } catch (error) {

            console.error("Error eliminando destino:", error);

            mostrarMensaje(error.message || "No se pudo eliminar el destino.", "error");
        }
    }

    function prepararNuevoDestino() {

        destinoEditando = null;

        if (formDestino) {
            formDestino.reset();
        }

        cambiarTituloModal(modalDestino, "Registrar destino");
        cambiarBotonGuardar(formDestino, "fa-floppy-disk", "Guardar destino");
    }

    if (modalDestino) {
        modalDestino.addEventListener("hidden.bs.modal", function() {
            prepararNuevoDestino();
        });
    }

    /* =========================================================
       CONFIRMACIONES DE ELIMINAR
    ========================================================= */

    function enlazarConfirmacion(modal, accion) {

        const boton = modal ? modal.querySelector(".btn-confirmar-eliminar") : null;

        if (boton) {
            boton.addEventListener("click", accion);
        }
    }

    enlazarConfirmacion(modalEliminarViaje, function() {

        if (!hayValor(viajeEliminar)) {
            mostrarMensaje("No se encontró el viaje a eliminar.", "error");
            return;
        }

        eliminarViaje(viajeEliminar);
    });

    enlazarConfirmacion(modalEliminarDestino, function() {

        if (!destinoEliminar) {
            return;
        }

        eliminarDestino(destinoEliminar);
    });

    enlazarConfirmacion(modalEliminarRuta, function() {

        if (!rutaEliminar) {
            return;
        }

        eliminarRuta(rutaEliminar);
    });

    /* =========================================================
       CLICS (DELEGADOS)
    ========================================================= */

    document.addEventListener("click", function(event) {

        const objetivo = event.target;

        if (objetivo.closest("#btnNuevoViaje")) {
            event.preventDefault();
            abrirNuevoViaje();
            return;
        }

        if (objetivo.closest("#btnRecomendar")) {
            event.preventDefault();
            abrirRecomendacion();
            return;
        }

        if (objetivo.closest('.btn-crear[data-bs-target="#modalDestino"]')) {
            prepararNuevoDestino();
            return;
        }

        if (objetivo.closest('.btn-crear[data-bs-target="#modalRuta"]')) {
            prepararNuevaRuta();
            return;
        }

        /* Botones "Crear PDF" de las pestañas Destinos y Rutas */
        const botonPdf = objetivo.closest(".btn-pdf");

        if (botonPdf) {

            event.preventDefault();

            if (botonPdf.closest("#tab-destinos")) {
                generarPDFDestinos(botonPdf);
            } else if (botonPdf.closest("#tab-rutas")) {
                generarPDFRutas(botonPdf);
            }

            return;
        }

        if (objetivo.closest(".btn-remisiones")) {
            generarReporteRemisiones();
            return;
        }

        if (objetivo.closest(".btn-imagen")) {
            generarReporteImagen();
            return;
        }

        const boton = objetivo.closest(".btn-accion");

        if (!boton) {
            return;
        }

        const id = boton.dataset.id;

        if (!hayValor(id)) {
            return;
        }

        const esEditar = boton.classList.contains("editar");

        if (boton.closest("#tab-viajes")) {

            event.preventDefault();

            if (esEditar) {
                editarViaje(id);
            } else {
                viajeEliminar = id;
                abrirModal("modalEliminarViaje");
            }

            return;
        }

        if (boton.closest("#tab-destinos")) {

            if (esEditar) {
                editarDestino(id);
            } else {
                destinoEliminar = id;
                abrirModal("modalEliminarDestino");
            }

            return;
        }

        if (boton.closest("#tab-rutas")) {

            if (esEditar) {
                editarRuta(id);
            } else {
                rutaEliminar = id;
                abrirModal("modalEliminarRuta");
            }
        }
    });

    /* =========================================================
       CONTADORES (KPIs)
    ========================================================= */

    function actualizarContadores() {

        const programados = document.getElementById("totalViajesProgramados");

        if (programados) {
            programados.textContent = viajesBD.filter(function(v) {
                return v.estado === "PROGRAMADO";
            }).length;
        }

        const rutasActivas = document.getElementById("totalRutasActivas");

        if (rutasActivas) {
            rutasActivas.textContent = rutasBD.filter(function(r) {
                return esActiva(r.estado);
            }).length;
        }

        const destinosActivos = document.getElementById("totalDestinosActivos");

        if (destinosActivos) {
            destinosActivos.textContent = destinosBD.length;
        }
    }

    /* =========================================================
       UTILIDADES DE IMAGEN / PDF
    ========================================================= */

    /* Carga un <script> externo y espera a que termine */
    function cargarScript(src) {

        return new Promise(function(resolve, reject) {

            const script = document.createElement("script");

            script.src = src;
            script.async = true;

            script.onload = function() {
                resolve();
            };

            script.onerror = function() {
                script.remove();
                reject(new Error("No se pudo cargar la librería: " + src));
            };

            document.head.appendChild(script);
        });
    }

    function tieneJsPDF() {
        return !!(window.jspdf && window.jspdf.jsPDF);
    }

    function tieneAutoTable() {
        return tieneJsPDF() && typeof window.jspdf.jsPDF.API.autoTable === "function";
    }

    /* Si jsPDF / autoTable no están en el HTML, se descargan aquí */
    async function asegurarLibreriaPDF() {

        if (tieneAutoTable()) {
            return;
        }

        if (!tieneJsPDF()) {
            await cargarScript(JSPDF_URL);
        }

        if (!tieneAutoTable()) {
            await cargarScript(AUTOTABLE_URL);
        }

        if (!tieneAutoTable()) {
            throw new Error("La librería de PDF no se inicializó correctamente.");
        }
    }

    /* Convierte una imagen del servidor a base64 para incrustarla en el PDF */
    function cargarImagenComoDataURL(url) {

        return new Promise(function(resolve) {

            const img = new Image();

            img.onload = function() {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    canvas.getContext("2d").drawImage(img, 0, 0);
                    resolve({
                        data: canvas.toDataURL("image/png"),
                        ancho: img.naturalWidth,
                        alto: img.naturalHeight
                    });
                } catch (error) {
                    resolve(null);
                }
            };

            img.onerror = function() {
                resolve(null);
            };

            img.src = url;
        });
    }

    function esperarImagenes(contenedor) {

        const imagenes = Array.from(contenedor.querySelectorAll("img"));

        return Promise.all(imagenes.map(function(img) {

            if (img.complete) {
                return Promise.resolve();
            }

            return new Promise(function(resolve) {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }));
    }

    /* =========================================================
       PDF (DESTINOS Y RUTAS)
    ========================================================= */

    /*
     * Genera un PDF con membrete a partir de una configuración:
     * { titulo, columnas, filas, columnStyles, columnaEstado, nombreArchivo, resumen }
     */
    async function generarPDFTabla(config, boton) {

        if (!config.filas || config.filas.length === 0) {
            mostrarMensaje("No hay registros para generar el PDF.", "error");
            return;
        }

        const textoOriginal = boton ? boton.innerHTML : "";

        if (boton) {
            boton.disabled = true;
            boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando…';
        }

        try {

            await asegurarLibreriaPDF();

            const jsPDF = window.jspdf.jsPDF;
            const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

            const anchoPagina = doc.internal.pageSize.getWidth();
            const altoPagina = doc.internal.pageSize.getHeight();
            const margen = 40;

            const NAVY = [12, 31, 51];
            const NAVY2 = [22, 49, 78];
            const AMBAR = [245, 163, 0];
            const GRIS = [100, 116, 139];

            const ahora = fechaHoraActual();
            const logo = await cargarImagenComoDataURL("/imgs/logo.png");

            function dibujarEncabezado() {

                doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
                doc.rect(0, 0, anchoPagina, 84, "F");

                doc.setFillColor(AMBAR[0], AMBAR[1], AMBAR[2]);
                doc.rect(0, 84, anchoPagina, 5, "F");

                let textoX = margen;

                if (logo) {
                    const altoLogo = 50;
                    const anchoLogo = Math.min(90, altoLogo * (logo.ancho / logo.alto));
                    doc.addImage(logo.data, "PNG", margen, 17, anchoLogo, altoLogo);
                    textoX = margen + anchoLogo + 14;
                }

                doc.setTextColor(255, 255, 255);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(19);
                doc.text("TRANSPORTE CHC", textoX, 42);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(AMBAR[0], AMBAR[1], AMBAR[2]);
                doc.text("Logística Terrestre de Carga Pesada", textoX, 57);

                doc.setTextColor(255, 255, 255);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.text(config.titulo.toUpperCase(), anchoPagina - margen, 38, { align: "right" });

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(185, 200, 216);
                doc.text("Generado: " + ahora.fecha + "  " + ahora.hora, anchoPagina - margen, 54, { align: "right" });
            }

            /* Resumen debajo del encabezado (solo primera página) */
            doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text(config.subtitulo || config.titulo, margen, 118);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
            doc.text(config.resumen, margen, 132);

            doc.autoTable({
                head: [config.columnas],
                body: config.filas,
                startY: 146,
                margin: { top: 110, right: margen, bottom: 55, left: margen },
                theme: "striped",
                styles: {
                    font: "helvetica",
                    fontSize: 9,
                    cellPadding: 7,
                    textColor: [51, 65, 85],
                    lineColor: [221, 227, 234],
                    lineWidth: 0.4,
                    valign: "middle"
                },
                headStyles: {
                    fillColor: NAVY2,
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 8.5
                },
                alternateRowStyles: {
                    fillColor: [246, 248, 251]
                },
                columnStyles: config.columnStyles || {},
                didParseCell: function(data) {

                    if (
                        config.columnaEstado !== undefined &&
                        data.section === "body" &&
                        data.column.index === config.columnaEstado
                    ) {
                        const activa = String(data.cell.raw).toLowerCase() === "activa";
                        data.cell.styles.fontStyle = "bold";
                        data.cell.styles.textColor = activa ? [21, 128, 61] : [220, 38, 38];
                    }

                    if (data.section === "body" && data.column.index === 0) {
                        data.cell.styles.fontStyle = "bold";
                        data.cell.styles.textColor = NAVY;
                    }
                },
                didDrawPage: function() {
                    dibujarEncabezado();
                }
            });

            /* Pie de página con numeración */
            const totalPaginas = doc.internal.getNumberOfPages();

            for (let i = 1;i <= totalPaginas;i++) {

                doc.setPage(i);

                doc.setDrawColor(221, 227, 234);
                doc.setLineWidth(0.6);
                doc.line(margen, altoPagina - 38, anchoPagina - margen, altoPagina - 38);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
                doc.text(
                    "© " + new Date().getFullYear() + " Transporte CHC · Departamento de Operaciones",
                    margen,
                    altoPagina - 24
                );
                doc.text(
                    "Página " + i + " de " + totalPaginas,
                    anchoPagina - margen,
                    altoPagina - 24,
                    { align: "right" }
                );
            }

            doc.save(config.nombreArchivo);

            mostrarMensaje("PDF generado correctamente.");

        } catch (error) {

            console.error("Error generando PDF:", error);

            mostrarMensaje(
                "No se pudo generar el PDF. " + (error.message || ""),
                "error"
            );

        } finally {

            if (boton) {
                boton.disabled = false;
                boton.innerHTML = textoOriginal;
            }
        }
    }

    function generarPDFDestinos(boton) {

        const filas = destinosBD.map(function(destino) {
            return [
                nombreDeDestino(destino),
                formatearNumero(destino.km || destino.kilometros || 0) + " km",
                formatearNumero(destino.galones || 0) + " gal",
                formatearNumero(destino.peajes || 0)
            ];
        });

        generarPDFTabla({
            titulo: "Catálogo de destinos",
            subtitulo: "Destinos registrados",
            resumen: "Total de destinos: " + filas.length,
            columnas: ["DESTINO", "KILÓMETROS", "GALONES", "PEAJES"],
            filas: filas,
            columnStyles: {
                0: { cellWidth: "auto" },
                1: { halign: "center", cellWidth: 100 },
                2: { halign: "center", cellWidth: 100 },
                3: { halign: "center", cellWidth: 80 }
            },
            nombreArchivo: "Transporte_CHC_Destinos_" + fechaHoraActual().fecha.replace(/\//g, "-") + ".pdf"
        }, boton);
    }

    function generarPDFRutas(boton) {

        const filas = rutasBD.map(function(ruta) {

            const tiempoCrudo = ruta.odt || ruta.tiempo || ruta.tiempoPromedio || "";
            const tiempo = convertirHoraParaInput(tiempoCrudo) || String(tiempoCrudo);

            return [
                nombreDeRuta(ruta),
                tiempo ? tiempo + " h" : "",
                esActiva(ruta.estado) ? "Activa" : "Inactiva"
            ];
        });

        const activas = rutasBD.filter(function(r) {
            return esActiva(r.estado);
        }).length;

        generarPDFTabla({
            titulo: "Rutas y tiempos",
            subtitulo: "Rutas y tiempos de recorrido",
            resumen: "Total de rutas: " + filas.length + "   ·   Activas: " + activas + "   ·   Inactivas: " + (filas.length - activas),
            columnas: ["RUTA", "TIEMPO PROMEDIO", "ESTADO"],
            filas: filas,
            columnStyles: {
                0: { cellWidth: "auto" },
                1: { halign: "center", cellWidth: 120 },
                2: { halign: "center", cellWidth: 90 }
            },
            columnaEstado: 2,
            nombreArchivo: "Transporte_CHC_Rutas_" + fechaHoraActual().fecha.replace(/\//g, "-") + ".pdf"
        }, boton);
    }

    /* =========================================================
       GENERADOR DE IMAGEN (VIAJES)
       Usa TODOS los viajes filtrados (no solo la página visible).
    ========================================================= */

    async function generarReporteImagen() {

        const lista = viajesFiltrados.slice();

        if (lista.length === 0) {
            mostrarMensaje("No hay información filtrada para generar la imagen.", "error");
            return;
        }

        if (typeof html2canvas === "undefined") {
            mostrarMensaje("No se pudo cargar la librería para generar la imagen.", "error");
            return;
        }

        const ahora = fechaHoraActual();

        /* Texto del rango de fechas para el encabezado y el nombre del archivo */
        const rangoDesde = filtroDesde ? filtroDesde.value : "";
        const rangoHasta = filtroHasta ? filtroHasta.value : "";
        let fechaReporte = "General";

        if (rangoDesde && rangoHasta) {
            fechaReporte = formatearFecha(rangoDesde) + " al " + formatearFecha(rangoHasta);
        } else if (rangoDesde) {
            fechaReporte = "Desde " + formatearFecha(rangoDesde);
        } else if (rangoHasta) {
            fechaReporte = "Hasta " + formatearFecha(rangoHasta);
        }

        const hayFiltroFecha = fechaReporte !== "General";

        const estadosInfo = {
            "PROGRAMADO": { texto: "Programado", fondo: "#e0f2fe", color: "#0369a1", borde: "#bae6fd" },
            "EN_CURSO": { texto: "En curso", fondo: "#fff4d6", color: "#a16207", borde: "#fde68a" },
            "FINALIZADO": { texto: "Finalizado", fondo: "#dcfce7", color: "#15803d", borde: "#bbf7d0" },
            "CANCELADO": { texto: "Cancelado", fondo: "#fee2e2", color: "#dc2626", borde: "#fecaca" }
        };

        const reporte = document.createElement("div");
        reporte.id = "chc-reporte-virtual";

        Object.assign(reporte.style, {
            position: "fixed",
            left: "-10000px",
            top: "0",
            width: "1200px",
            backgroundColor: "#f4f6f9",
            padding: "50px",
            boxSizing: "border-box",
            fontFamily: '"Poppins", sans-serif',
            color: "#1e293b"
        });

        const th = "padding:16px 18px;text-align:left;color:#dbe6f1;font-size:12px;font-weight:600;letter-spacing:1.2px;";

        reporte.innerHTML = `
            <div style="background:#0c1f33;border-radius:18px 18px 0 0;padding:38px 42px;display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;">
                    <img src="/imgs/logo.png" style="width:96px;height:auto;margin-right:28px;" alt="" onerror="this.style.display='none'">
                    <div>
                        <h1 style="margin:0;color:#ffffff;font-size:38px;font-weight:700;letter-spacing:3px;">TRANSPORTE CHC</h1>
                        <p style="margin:6px 0 0 0;color:#f5a300;font-size:16px;font-weight:500;letter-spacing:1px;">Logística Terrestre de Carga Pesada</p>
                    </div>
                </div>
                <div style="text-align:right;color:#ffffff;">
                    <div style="font-size:13px;font-weight:600;letter-spacing:2px;color:#a9bdd1;">REPORTE</div>
                    <h3 style="margin:4px 0 0 0;font-size:24px;font-weight:700;text-transform:uppercase;color:#ffffff;">Programación Diaria</h3>
                    <p style="margin:8px 0 0 0;font-size:17px;font-weight:600;color:#f5a300;">Fecha: ${escaparHTML(fechaReporte)}</p>
                </div>
            </div>
            <div style="height:8px;background:#f5a300;border-radius:0 0 18px 18px;margin-bottom:20px;"></div>

            <table style="width:100%;border-collapse:separate;border-spacing:0 10px;">
                <thead>
                    <tr style="background-color:#16314e;">
                        <th style="${th}border-radius:12px 0 0 12px;">FECHA</th>
                        <th style="${th}">RUTA (ORIGEN → DESTINO)</th>
                        <th style="${th}">UNIDAD</th>
                        <th style="${th}">MOTORISTA</th>
                        <th style="${th}">TELÉFONO</th>
                        <th style="${th}text-align:center;border-radius:0 12px 12px 0;">ESTADO</th>
                    </tr>
                </thead>
                <tbody id="reporte-body"></tbody>
            </table>

            <div style="margin-top:44px;border-top:2px solid #dde3ea;padding-top:22px;display:flex;justify-content:space-between;font-size:13px;color:#64748b;">
                <p style="margin:0;">© ${new Date().getFullYear()} Transporte CHC · Departamento de Operaciones</p>
                <p style="margin:0;">Generado el ${escaparHTML(ahora.fecha)} a las ${escaparHTML(ahora.hora)} · ${lista.length} registro(s)</p>
            </div>
        `;

        const reporteBody = reporte.querySelector("#reporte-body");
        const td = "padding:16px 18px;border-top:1px solid #e6ebf2;border-bottom:1px solid #e6ebf2;background:#ffffff;vertical-align:middle;font-size:14px;";

        lista.forEach(function(viaje) {

            const estado = String(viaje.estado || "PROGRAMADO").toUpperCase();
            const info = estadosInfo[estado] || estadosInfo.PROGRAMADO;

            const iniciales = String(viaje.motorista || "")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(function(n) { return n.charAt(0); })
                .join("")
                .toUpperCase() || "M";

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td style="${td}border-left:1px solid #e6ebf2;border-radius:12px 0 0 12px;font-weight:600;color:#0c1f33;">${escaparHTML(formatearFecha(viaje.fecha))}</td>
                <td style="${td}font-weight:600;color:#334155;">
                    ${escaparHTML(viaje.destinoInicial)} <span style="color:#f5a300;font-weight:700;">→</span> ${escaparHTML(viaje.destinoFinal)}
                </td>
                <td style="${td}">
                    <span style="display:inline-block;padding:4px 12px;border:2px solid #0c1f33;border-radius:6px;font-family:monospace;font-size:14px;font-weight:700;letter-spacing:1.5px;color:#0c1f33;background:#ffffff;">${escaparHTML(viaje.placa)}</span>
                </td>
                <td style="${td}">
                    <span style="display:inline-block;width:34px;height:34px;line-height:34px;border-radius:50%;background:#0c1f33;color:#f5a300;text-align:center;font-size:12px;font-weight:700;vertical-align:middle;margin-right:10px;">${escaparHTML(iniciales)}</span>
                    <span style="vertical-align:middle;color:#334155;font-weight:500;">${escaparHTML(viaje.motorista)}</span>
                </td>
                <td style="${td}color:#475569;">${escaparHTML(viaje.telefono)}</td>
                <td style="${td}border-right:1px solid #e6ebf2;border-radius:0 12px 12px 0;text-align:center;">
                    <span style="display:inline-block;background:${info.fondo};color:${info.color};padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border:1px solid ${info.borde};">${escaparHTML(info.texto)}</span>
                </td>
            `;

            reporteBody.appendChild(tr);
        });

        document.body.appendChild(reporte);

        try {

            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            await esperarImagenes(reporte);

            const canvas = await html2canvas(reporte, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#f4f6f9",
                logging: false
            });

            const sufijo = hayFiltroFecha
                ? fechaReporte.replace(/\//g, "-").replace(/\s+/g, "_")
                : "General_" + ahora.fecha.replace(/\//g, "-");

            const link = document.createElement("a");
            link.download = "Transporte_CHC_Programacion_" + sufijo + ".png";
            link.href = canvas.toDataURL("image/png");
            link.click();

            mostrarMensaje("Imagen generada con éxito.");

        } catch (err) {

            console.error(err);

            mostrarMensaje("Error al renderizar la imagen corporativa.", "error");

        } finally {

            reporte.remove();
        }
    }

    /* =========================================================
       IMAGEN PARA REMISIONES (VIAJES POR CONDUCTOR)
       Muestra cuántos viajes hizo cada conductor según los filtros activos
       (rango de fechas, conductor, estado y búsqueda).
    ========================================================= */

    function obtenerRangoFechas() {

        let desde = filtroDesde ? filtroDesde.value : "";
        let hasta = filtroHasta ? filtroHasta.value : "";

        if (desde && hasta && desde > hasta) {
            const tmp = desde;
            desde = hasta;
            hasta = tmp;
        }

        let texto = "Todas las fechas";

        if (desde && hasta) {
            texto = formatearFecha(desde) + " al " + formatearFecha(hasta);
        } else if (desde) {
            texto = "Desde " + formatearFecha(desde);
        } else if (hasta) {
            texto = "Hasta " + formatearFecha(hasta);
        }

        return { texto: texto, hay: !!(desde || hasta) };
    }

    async function generarReporteRemisiones() {

        const lista = viajesFiltrados.slice();

        if (lista.length === 0) {
            mostrarMensaje("No hay viajes con los filtros actuales para generar el reporte.", "error");
            return;
        }

        if (typeof html2canvas === "undefined") {
            mostrarMensaje("No se pudo cargar la librería para generar la imagen.", "error");
            return;
        }

        const ahora = fechaHoraActual();
        const rango = obtenerRangoFechas();

        /* Agrupar los viajes por conductor */
        const mapa = {};

        lista.forEach(function(viaje) {

            const nombre = String(viaje.motorista || "").trim() || "Sin motorista";
            const clave = normalizarTexto(nombre);

            if (!mapa[clave]) {
                mapa[clave] = {
                    nombre: nombre,
                    total: 0,
                    placas: {}
                };
            }

            const grupo = mapa[clave];

            grupo.total++;

            if (viaje.placa) {
                grupo.placas[String(viaje.placa).trim()] = true;
            }
        });

        const conductores = Object.keys(mapa)
            .map(function(k) { return mapa[k]; })
            .sort(function(a, b) {
                return (b.total - a.total) || a.nombre.localeCompare(b.nombre, "es");
            });

        const totales = { total: 0 };

        conductores.forEach(function(c) {
            totales.total += c.total;
        });

        /* Filtros activos que se muestran en el encabezado */
        const nombresEstado = {
            "PROGRAMADO": "Programado",
            "EN_CURSO": "En curso",
            "FINALIZADO": "Finalizado",
            "CANCELADO": "Cancelado"
        };

        const detalles = [];

        if (filtroConductor && filtroConductor.value) {
            detalles.push("Conductor: " + filtroConductor.value);
        }

        if (filtroEstado && filtroEstado.value) {
            detalles.push("Estado: " + (nombresEstado[filtroEstado.value] || filtroEstado.value));
        }

        const reporte = document.createElement("div");
        reporte.id = "chc-remisiones-virtual";

        Object.assign(reporte.style, {
            position: "fixed",
            left: "-10000px",
            top: "0",
            width: "1200px",
            backgroundColor: "#f4f6f9",
            padding: "50px",
            boxSizing: "border-box",
            fontFamily: '"Poppins", sans-serif',
            color: "#1e293b"
        });

        const th = "padding:16px 18px;text-align:left;color:#dbe6f1;font-size:12px;font-weight:600;letter-spacing:1.2px;";
        const td = "padding:16px 18px;border-top:1px solid #e6ebf2;border-bottom:1px solid #e6ebf2;background:#ffffff;vertical-align:middle;font-size:14px;";

        reporte.innerHTML = `
            <div style="background:#0c1f33;border-radius:18px 18px 0 0;padding:38px 42px;display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;">
                    <img src="/imgs/logo.png" style="width:96px;height:auto;margin-right:28px;" alt="" onerror="this.style.display='none'">
                    <div>
                        <h1 style="margin:0;color:#ffffff;font-size:38px;font-weight:700;letter-spacing:3px;">TRANSPORTE CHC</h1>
                        <p style="margin:6px 0 0 0;color:#f5a300;font-size:16px;font-weight:500;letter-spacing:1px;">Logística Terrestre de Carga Pesada</p>
                    </div>
                </div>
                <div style="text-align:right;color:#ffffff;">
                    <div style="font-size:13px;font-weight:600;letter-spacing:2px;color:#a9bdd1;">REPORTE DE REMISIONES</div>
                    <h3 style="margin:4px 0 0 0;font-size:24px;font-weight:700;text-transform:uppercase;color:#ffffff;">Viajes por conductor</h3>
                    <p style="margin:8px 0 0 0;font-size:17px;font-weight:600;color:#f5a300;">Período: ${escaparHTML(rango.texto)}</p>
                    ${detalles.length ? '<p style="margin:4px 0 0 0;font-size:13px;color:#a9bdd1;">' + escaparHTML(detalles.join("  ·  ")) + '</p>' : ""}
                </div>
            </div>
            <div style="height:8px;background:#f5a300;border-radius:0 0 18px 18px;margin-bottom:20px;"></div>

            <table style="width:100%;border-collapse:separate;border-spacing:0 10px;">
                <thead>
                    <tr style="background-color:#16314e;">
                        <th style="${th}border-radius:12px 0 0 12px;width:50px;">#</th>
                        <th style="${th}">CONDUCTOR</th>
                        <th style="${th}">UNIDAD(ES)</th>
                        <th style="${th}text-align:center;border-radius:0 12px 12px 0;width:170px;">VIAJES</th>
                    </tr>
                </thead>
                <tbody id="remisiones-body"></tbody>
            </table>

            <div style="margin-top:44px;border-top:2px solid #dde3ea;padding-top:22px;display:flex;justify-content:space-between;font-size:13px;color:#64748b;">
                <p style="margin:0;">© ${new Date().getFullYear()} Transporte CHC · Departamento de Operaciones</p>
                <p style="margin:0;">Generado el ${escaparHTML(ahora.fecha)} a las ${escaparHTML(ahora.hora)} · ${conductores.length} conductor(es) · ${totales.total} viaje(s)</p>
            </div>
        `;

        const cuerpo = reporte.querySelector("#remisiones-body");

        conductores.forEach(function(c, i) {

            const iniciales = c.nombre
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(function(n) { return n.charAt(0); })
                .join("")
                .toUpperCase() || "M";

            const placas = Object.keys(c.placas).map(function(placa) {
                return '<span style="display:inline-block;margin:2px 6px 2px 0;padding:3px 10px;border:2px solid #0c1f33;border-radius:6px;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#0c1f33;background:#ffffff;">' + escaparHTML(placa) + '</span>';
            }).join("");

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td style="${td}border-left:1px solid #e6ebf2;border-radius:12px 0 0 12px;font-weight:700;color:#64748b;">${i + 1}</td>
                <td style="${td}">
                    <span style="display:inline-block;width:34px;height:34px;line-height:34px;border-radius:50%;background:#0c1f33;color:#f5a300;text-align:center;font-size:12px;font-weight:700;vertical-align:middle;margin-right:10px;">${escaparHTML(iniciales)}</span>
                    <span style="vertical-align:middle;color:#0c1f33;font-weight:600;">${escaparHTML(c.nombre)}</span>
                </td>
                <td style="${td}">${placas || '<span style="color:#cbd5e1;">–</span>'}</td>
                <td style="${td}border-right:1px solid #e6ebf2;border-radius:0 12px 12px 0;text-align:center;">
                    <span style="display:inline-block;min-width:46px;padding:6px 14px;border-radius:20px;background:#fff4d6;border:1px solid #fde68a;color:#0c1f33;font-size:16px;font-weight:700;">${c.total}</span>
                </td>
            `;

            cuerpo.appendChild(tr);
        });

        /* Fila de totales */
        const tdTotal = "padding:16px 18px;background:#0c1f33;color:#ffffff;font-size:14px;font-weight:700;vertical-align:middle;";

        const filaTotal = document.createElement("tr");

        filaTotal.innerHTML = `
            <td style="${tdTotal}border-radius:12px 0 0 12px;"></td>
            <td style="${tdTotal}letter-spacing:1px;">TOTAL GENERAL</td>
            <td style="${tdTotal}"></td>
            <td style="${tdTotal}border-radius:0 12px 12px 0;text-align:center;color:#f5a300;font-size:18px;">${totales.total}</td>
        `;

        cuerpo.appendChild(filaTotal);

        document.body.appendChild(reporte);

        try {

            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            await esperarImagenes(reporte);

            const canvas = await html2canvas(reporte, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#f4f6f9",
                logging: false
            });

            const sufijo = rango.hay
                ? rango.texto.replace(/\//g, "-").replace(/\s+/g, "_")
                : "General_" + ahora.fecha.replace(/\//g, "-");

            const link = document.createElement("a");
            link.download = "Transporte_CHC_Remisiones_" + sufijo + ".png";
            link.href = canvas.toDataURL("image/png");
            link.click();

            mostrarMensaje("Imagen de remisiones generada con éxito.");

        } catch (err) {

            console.error(err);

            mostrarMensaje("Error al renderizar la imagen de remisiones.", "error");

        } finally {

            reporte.remove();
        }
    }

    /* =========================================================
       RECOMENDACIÓN DE PROGRAMACIÓN
       Solo SUGIERE: no guarda, no modifica viajes y no toca los
       filtros, la paginación ni los reportes de la pantalla.

       Reglas:
       1) Para un viaje largo (más de 5 horas) tiene prioridad quien lleva
          más días sin hacer uno (o nunca ha hecho). Si empatan, quien no
          viajó ayer; si siguen empatando, quien lleva más días sin viajar.
       2) Para un viaje corto tiene prioridad quien NO viajó ayer.
       3) Los viajes largos se asignan primero; luego los cortos.

       La duración de cada viaje sale de la pestaña "Rutas y horarios"
       (ruta cuyo nombre coincide con el destino final del viaje).
    ========================================================= */

    const HORAS_VIAJE_LARGO = 5;

    const ESTADOS_CONDUCTOR_NO_DISPONIBLE = [
        "INACTIVO", "INACTIVA", "BAJA", "RETIRADO",
        "SUSPENDIDO", "VACACIONES", "INCAPACIDAD", "INCAPACITADO"
    ];

    let cargandoRecomendacion = false;

    /* "02:30" o "02:30:00" -> 2.5 horas. Devuelve null si no es válido o es 0. */
    function horasDeTexto(valor) {

        if (typeof valor === "number") {
            return isFinite(valor) && valor > 0 ? valor : null;
        }

        const m = String(valor || "").trim().match(/^(\d{1,3}):(\d{2})/);

        if (!m) {
            return null;
        }

        const horas = Number(m[1]) + Number(m[2]) / 60;

        return horas > 0 ? horas : null;
    }

    /* Mapa clave-de-ruta -> horas. Se arma una sola vez por cálculo. */
    function construirMapaHoras() {

        const mapa = new Map();

        rutasBD.forEach(function(ruta) {

            const clave = claveTexto(nombreDeRuta(ruta));

            if (!clave || mapa.has(clave)) {
                return;
            }

            const horas = horasDeTexto(ruta.odt || ruta.tiempo || ruta.tiempoPromedio);

            if (horas !== null) {
                mapa.set(clave, horas);
            }
        });

        return mapa;
    }

    function horasDeViaje(viaje, mapaHoras) {

        const clave = claveTexto(viaje.destinoFinal);

        return clave && mapaHoras.has(clave) ? mapaHoras.get(clave) : null;
    }

    function textoHoras(horas) {

        if (horas === null) {
            return "Sin tiempo";
        }

        const min = Math.round(horas * 60);

        return Math.floor(min / 60) + ":" + String(min % 60).padStart(2, "0") + " h";
    }

    /* Días entre dos fechas "AAAA-MM-DD" (con UTC: no le afectan cambios de hora) */
    function diasEntre(desdeISO, hastaISO) {

        const a = desdeISO.split("-").map(Number);
        const b = hastaISO.split("-").map(Number);

        return Math.round(
            (Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000
        );
    }

    function fechaISODesdeHoy(desplazamiento) {

        const d = new Date();

        d.setDate(d.getDate() + desplazamiento);

        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    function textoDias(dias) {

        if (dias === Infinity) {
            return "Sin registro";
        }

        return dias === 1 ? "Ayer" : "Hace " + dias + " días";
    }

    /*
     * Historial de cada conductor usando SOLO viajes anteriores a la
     * fecha elegida (así los viajes ya cargados ese día no lo alteran).
     */
    function calcularHistorial(fechaISO, mapaHoras) {

        const porConductor = {};
        let sinTiempo = 0;

        viajesBD.forEach(function(viaje) {

            if (viaje.estado === "CANCELADO") {
                return;
            }

            const f = convertirFechaInput(viaje.fecha);
            const clave = claveTexto(viaje.motorista);

            if (!f || !clave || f >= fechaISO) {
                return;
            }

            const dias = diasEntre(f, fechaISO);

            const reg = porConductor[clave] || (porConductor[clave] = {
                ultimoViaje: Infinity,
                ultimoLargo: Infinity,
                viajesSemana: 0
            });

            if (dias < reg.ultimoViaje) {
                reg.ultimoViaje = dias;
            }

            const horas = horasDeViaje(viaje, mapaHoras);

            if (horas === null) {
                if (dias <= 30) {
                    sinTiempo++;
                }
            } else if (horas > HORAS_VIAJE_LARGO && dias < reg.ultimoLargo) {
                reg.ultimoLargo = dias;
            }

            if (dias <= 7) {
                reg.viajesSemana++;
            }
        });

        return { porConductor: porConductor, sinTiempo: sinTiempo };
    }

    function construirCandidatos(porConductor) {

        const vistos = new Set();
        const lista = [];

        conductoresBD.forEach(function(c) {

            const nombre = nombreCompleto(c);
            const clave = claveTexto(nombre);

            if (!clave || vistos.has(clave)) {
                return;
            }

            const estado = String(c.estado || "").trim().toUpperCase();

            if (c.activo === false || ESTADOS_CONDUCTOR_NO_DISPONIBLE.includes(estado)) {
                return;
            }

            vistos.add(clave);

            const h = porConductor[clave] ||
                { ultimoViaje: Infinity, ultimoLargo: Infinity, viajesSemana: 0 };

            lista.push({
                clave: clave,
                nombre: nombre,
                placa: obtenerPlacaDeAsignacion(buscarAsignacionDelConductor(c.id)),
                viajoAyer: h.ultimoViaje === 1,
                diasUltimoViaje: h.ultimoViaje,
                diasUltimoLargo: h.ultimoLargo,
                viajesSemana: h.viajesSemana
            });
        });

        return lista;
    }

    /* Orden de prioridad para un viaje LARGO:
       1) más días sin hacer un viaje largo
       2) si empatan, quien no viajó ayer
       3) si siguen empatando, más días sin viajar */
    function compararParaLargo(a, b) {

        if (a.diasUltimoLargo !== b.diasUltimoLargo) {
            return b.diasUltimoLargo - a.diasUltimoLargo;
        }

        if (a.viajoAyer !== b.viajoAyer) {
            return a.viajoAyer ? 1 : -1;
        }

        if (a.diasUltimoViaje !== b.diasUltimoViaje) {
            return b.diasUltimoViaje - a.diasUltimoViaje;
        }

        if (a.viajesSemana !== b.viajesSemana) {
            return a.viajesSemana - b.viajesSemana;
        }

        return a.nombre.localeCompare(b.nombre, "es");
    }

    /* Orden de prioridad para un viaje CORTO */
    function compararParaCorto(a, b) {

        if (a.viajoAyer !== b.viajoAyer) {
            return a.viajoAyer ? 1 : -1;
        }

        if (a.diasUltimoViaje !== b.diasUltimoViaje) {
            return b.diasUltimoViaje - a.diasUltimoViaje;
        }

        if (a.viajesSemana !== b.viajesSemana) {
            return a.viajesSemana - b.viajesSemana;
        }

        /* Quien hizo un largo hace poco es el mejor para un corto */
        if (a.diasUltimoLargo !== b.diasUltimoLargo) {
            return a.diasUltimoLargo - b.diasUltimoLargo;
        }

        return a.nombre.localeCompare(b.nombre, "es");
    }

    function motivoRecomendacion(c, largo) {

        const ayer = c.viajoAyer ? "viajó ayer" : "no viajó ayer";

        if (largo) {
            return (c.diasUltimoLargo === Infinity
                ? "Nunca ha hecho viaje largo"
                : "Último largo: " + textoDias(c.diasUltimoLargo).toLowerCase()) +
                " · " + ayer;
        }

        return (c.viajoAyer ? "Viajó ayer" : "No viajó ayer") + " · " +
            (c.diasUltimoViaje === Infinity
                ? "sin viajes previos"
                : "último viaje: " + textoDias(c.diasUltimoViaje).toLowerCase());
    }

    /* Lista de destinos que el usuario ingresa para el día: [{ uid, destino }] */
    let destinosRec = [];
    let contadorRec = 0;

    const recDestino = document.getElementById("recDestino");
    const recCantidad = document.getElementById("recCantidad");

    /* Combo con las rutas activas (con su tiempo promedio al lado) */
    function llenarSelectDestinosRec() {

        if (!recDestino) {
            return;
        }

        const valorActual = recDestino.value;
        const mapaHoras = construirMapaHoras();
        const fragmento = document.createDocumentFragment();

        const vacio = document.createElement("option");
        vacio.value = "";
        vacio.textContent = "Selecciona un destino";
        fragmento.appendChild(vacio);

        rutasBD.forEach(function(ruta) {

            if (!ruta || !esActiva(ruta.estado)) {
                return;
            }

            const nombre = nombreDeRuta(ruta);

            if (!nombre) {
                return;
            }

            const horas = mapaHoras.get(claveTexto(nombre));
            const option = document.createElement("option");

            option.value = String(nombre);
            option.textContent = nombre + " · " + (horas ? textoHoras(horas) : "sin tiempo");

            fragmento.appendChild(option);
        });

        recDestino.innerHTML = "";
        recDestino.appendChild(fragmento);

        if (valorActual) {
            seleccionarPorTexto(recDestino, valorActual);
        }
    }

    function agregarDestinoRec() {

        const destino = recDestino ? recDestino.value : "";

        if (!destino) {
            mostrarMensaje("Selecciona un destino para agregarlo.", "error");
            return;
        }

        let cantidad = recCantidad ? parseInt(recCantidad.value, 10) : 1;

        if (!isFinite(cantidad) || cantidad < 1) {
            cantidad = 1;
        }

        if (cantidad > 50) {
            cantidad = 50;
        }

        for (let i = 0;i < cantidad;i++) {
            destinosRec.push({ uid: ++contadorRec, destino: destino });
        }

        if (recCantidad) {
            recCantidad.value = 1;
        }

        generarRecomendacion();
    }

    /* Copia a la lista los destinos finales de los viajes ya registrados en la fecha elegida */
    function traerViajesRegistradosRec() {

        const fecha = recFecha ? recFecha.value : "";

        if (!fecha) {
            mostrarMensaje("Selecciona primero la fecha.", "error");
            return;
        }

        const delDia = viajesBD.filter(function(v) {
            return v.estado !== "CANCELADO" && v.destinoFinal && convertirFechaInput(v.fecha) === fecha;
        });

        if (delDia.length === 0) {
            mostrarMensaje("No hay viajes registrados para esa fecha.", "error");
            return;
        }

        destinosRec = delDia.map(function(v) {
            return { uid: ++contadorRec, destino: v.destinoFinal };
        });

        generarRecomendacion();
    }

    function generarRecomendacion() {

        if (!recFecha || !recTbody || !recRankingTbody || !recResumen || !recAvisos) {
            return;
        }

        const fecha = recFecha.value;

        recAvisos.innerHTML = "";

        if (!fecha) {
            recResumen.textContent = "";
            recTbody.innerHTML = filaEstado(5, "fa-calendar", "Selecciona una fecha.");
            recRankingTbody.innerHTML = "";
            return;
        }

        const mapaHoras = construirMapaHoras();
        const historial = calcularHistorial(fecha, mapaHoras);
        const candidatos = construirCandidatos(historial.porConductor);

        const items = destinosRec.map(function(d) {

            const horas = mapaHoras.get(claveTexto(d.destino));

            return {
                uid: d.uid,
                destino: d.destino,
                horas: horas === undefined ? null : horas,
                largo: horas !== undefined && horas > HORAS_VIAJE_LARGO,
                recomendado: null
            };
        });

        /* Los viajes más largos se asignan primero (empate: en el orden en que se agregaron) */
        items.sort(function(a, b) {
            return ((b.horas || 0) - (a.horas || 0)) || (a.uid - b.uid);
        });

        const libres = candidatos.slice();

        items.forEach(function(it) {
            libres.sort(it.largo ? compararParaLargo : compararParaCorto);
            it.recomendado = libres.length ? libres.shift() : null;
        });

        /* ---------- Resumen y avisos ---------- */

        const largos = items.filter(function(i) { return i.largo; }).length;

        recResumen.innerHTML =
            "<strong>" + items.length + "</strong> viaje(s) · <strong>" + largos +
            "</strong> largo(s) · <strong>" + candidatos.length + "</strong> conductor(es)";

        const avisos = [];
        const sinTiempoHoy = items.filter(function(i) { return i.horas === null; }).length;
        const sinConductor = items.filter(function(i) { return !i.recomendado; }).length;

        if (candidatos.length === 0) {
            avisos.push("No hay conductores disponibles. Revisa que la lista de conductores esté cargada.");
        }

        if (sinTiempoHoy > 0) {
            avisos.push(sinTiempoHoy + " destino(s) no tienen tiempo registrado en Rutas y horarios. Se trataron como viajes cortos.");
        }

        if (historial.sinTiempo > 0) {
            avisos.push(historial.sinTiempo + " viaje(s) de los últimos 30 días no tienen tiempo registrado, por lo que no se pudo saber si fueron largos. Revisa que el destino final coincida con el nombre de una ruta.");
        }

        if (sinConductor > 0) {
            avisos.push("Hay más viajes que conductores: " + sinConductor + " viaje(s) quedaron sin conductor recomendado.");
        }

        if (viajesBD.length === 0) {
            avisos.push("Todavía no hay historial de programaciones: todos los conductores tienen la misma prioridad.");
        }

        recAvisos.innerHTML = avisos.map(function(t) {
            return '<div class="rec-aviso"><i class="fa-solid fa-triangle-exclamation"></i> ' + escaparHTML(t) + "</div>";
        }).join("");

        /* ---------- Tabla de recomendaciones ---------- */

        if (items.length === 0) {
            recTbody.innerHTML = filaEstado(5, "fa-list", "Agrega los destinos del día (arriba) para ver qué conductor le toca a cada uno.");
        } else {

            recTbody.innerHTML = items.map(function(it) {

                const rec = it.recomendado;

                const recHTML = rec
                    ? "<strong>" + escaparHTML(rec.nombre) + "</strong> " +
                      (rec.placa
                          ? '<span class="placa">' + escaparHTML(rec.placa) + "</span>"
                          : '<span class="rec-badge dif">Sin camión</span>')
                    : '<span class="rec-sin">Sin conductor disponible</span>';

                return `
                    <tr>
                        <td><span class="ruta">${escaparHTML(it.destino)}</span></td>
                        <td>${escaparHTML(textoHoras(it.horas))}
                            ${it.largo ? '<span class="rec-badge largo">Largo</span>' : ""}</td>
                        <td>${recHTML}</td>
                        <td class="rec-motivo">${rec ? escaparHTML(motivoRecomendacion(rec, it.largo)) : ""}</td>
                        <td>
                            <button type="button" class="btn-accion eliminar" data-rec-quitar="${it.uid}" title="Quitar este viaje">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        /* ---------- Tabla de prioridad de conductores ---------- */

        const asignadoHoy = {};

        items.forEach(function(it) {
            if (it.recomendado) {
                asignadoHoy[it.recomendado.clave] = it.destino;
            }
        });

        const ranking = candidatos.slice().sort(compararParaLargo);

        if (ranking.length === 0) {
            recRankingTbody.innerHTML = filaEstado(7, "fa-inbox", "No hay conductores.");
            return;
        }

        recRankingTbody.innerHTML = ranking.map(function(c, i) {

            const destino = asignadoHoy[c.clave];

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escaparHTML(c.nombre)}</strong></td>
                    <td>${c.placa ? '<span class="placa">' + escaparHTML(c.placa) + "</span>" : '<span class="rec-sin">—</span>'}</td>
                    <td>${escaparHTML(textoDias(c.diasUltimoViaje))}</td>
                    <td>${escaparHTML(textoDias(c.diasUltimoLargo))}</td>
                    <td>${c.viajesSemana}</td>
                    <td>${destino
                        ? '<span class="rec-badge ok">' + escaparHTML(destino) + "</span>"
                        : '<span class="rec-sin">Libre</span>'}</td>
                </tr>
            `;
        }).join("");
    }

    /*
     * Abre el modal enseguida y refresca los datos (historial, rutas,
     * conductores y camiones) para que la recomendación esté al día.
     * La lista de destinos ingresada se conserva mientras la página siga abierta.
     */
    async function abrirRecomendacion() {

        if (cargandoRecomendacion) {
            return;
        }

        cargandoRecomendacion = true;

        try {

            if (recFecha && !recFecha.value) {
                recFecha.value = fechaISODesdeHoy(0);
            }

            if (recTbody) {
                recTbody.innerHTML = filaEstado(5, "fa-spinner fa-spin", "Analizando el historial de programaciones…");
            }

            abrirModal("modalRecomendacion");

            await Promise.all([
                cargarViajesDesdeBD(),
                cargarRutasDesdeBD(),
                cargarConductoresParaViajes(),
                cargarAsignacionesParaViajes()
            ]);

            llenarSelectDestinosRec();
            generarRecomendacion();

        } catch (error) {

            console.error("Error generando la recomendación:", error);

            if (recTbody) {
                recTbody.innerHTML = filaEstado(5, "fa-circle-exclamation", "No se pudo generar la recomendación.");
            }

            mostrarMensaje(error.message || "No se pudo generar la recomendación.", "error");

        } finally {

            cargandoRecomendacion = false;
        }
    }

    if (recFecha) {
        recFecha.addEventListener("change", generarRecomendacion);
    }

    if (recCantidad) {
        recCantidad.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                agregarDestinoRec();
            }
        });
    }

    /* Botones del modal: Hoy / Mañana, Agregar, Traer, Limpiar y Quitar */
    if (modalRecomendacion) {

        modalRecomendacion.addEventListener("click", function(event) {

            const dia = event.target.closest("[data-rec-dia]");

            if (dia && recFecha) {
                recFecha.value = fechaISODesdeHoy(Number(dia.dataset.recDia) || 0);
                generarRecomendacion();
                return;
            }

            if (event.target.closest("#recAgregar")) {
                agregarDestinoRec();
                return;
            }

            if (event.target.closest("#recTraer")) {
                traerViajesRegistradosRec();
                return;
            }

            if (event.target.closest("#recLimpiar")) {
                destinosRec = [];
                generarRecomendacion();
                return;
            }

            const quitar = event.target.closest("[data-rec-quitar]");

            if (quitar) {

                const uid = Number(quitar.dataset.recQuitar);

                destinosRec = destinosRec.filter(function(d) {
                    return d.uid !== uid;
                });

                generarRecomendacion();
            }
        });
    }

    /* =========================================================
       PESTAÑAS
    ========================================================= */

    const pestanas = document.querySelectorAll(".pestana");
    const hojas = document.querySelectorAll(".hoja-tab");

    pestanas.forEach(function(pestana) {

        pestana.addEventListener("click", function() {

            pestanas.forEach(function(item) {
                item.classList.remove("activa");
            });

            hojas.forEach(function(hoja) {
                hoja.classList.remove("activa");
            });

            pestana.classList.add("activa");

            const hoja = document.getElementById("tab-" + pestana.dataset.tab);

            if (hoja) {
                hoja.classList.add("activa");
            }
        });
    });

    /* =========================================================
       INICIALIZAR (TODAS LAS CARGAS EN PARALELO)
    ========================================================= */

    async function inicializarModulo() {

        try {

            /*
             * Ninguna carga depende de otra, así que se lanzan juntas.
             * Cada función tiene su propio try/catch: si una falla,
             * las demás siguen funcionando.
             */
            await Promise.all([
                cargarViajesDesdeBD(),
                cargarRutasDesdeBD(),
                cargarDestinosDesdeBD(),
                cargarConductoresParaViajes(),
                cargarAsignacionesParaViajes()
            ]);

            console.log("reporteDiario.js cargado correctamente.");

        } catch (error) {

            console.error("Error inicializando sistema:", error);
        }
    }

    inicializarModulo();

    /* Si la página queda abierta, se revisa cada 10 minutos (cubre el cambio de día) */
    setInterval(finalizarViajesVencidos, 10 * 60 * 1000);

});