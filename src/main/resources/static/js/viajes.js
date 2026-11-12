/*=========================================================*
 *  VIAJES.JS  ·  Gestión de viajes · Transportes CHC
 *
 *  Mejoras principales:
 *   - Catálogos (conductores / rutas) se cargan UNA vez.
 *   - Los viajes se guardan en caché: ya no se pide /viajes/lista
 *     cada vez que se edita, se agrega o se elimina una nota.
 *   - Se corrige la edición (antes el modal recargaba los
 *     <select> y se perdían conductor y destino).
 *   - Al cancelar una edición el formulario vuelve a "Nuevo viaje".
 *   - Buscador compatible con DataTables 2.x.
 *   - Dashboard se actualiza solo en cada "draw".
 *   - Toasts en lugar de alert(), anti doble-clic al guardar.
 *   - La parte del PDF se movió a js/viajes-pdf.js (sin cambios).
 *=========================================================*/

/*=========================================================*
 *  CONSTANTES Y ESTADO
 *=========================================================*/

const URL_CONDUCTORES = "/conductores/api";
const URL_CAMIONES = "/camiones/disponibles";
const URL_RUTAS = "/rutas/activas";
const URL_VIAJES = "/viajes/lista";
const URL_GUARDAR_VIAJE = "/viajes/guardar";
const URL_ACTUALIZAR_VIAJE = "/viajes/actualizar/";
const URL_ELIMINAR_VIAJE = "/viajes/eliminar/";

const FURGONES_CUMPLIDOS = ["CHC", "CMI"];

const $modalNuevoViaje = $("#modalNuevoViaje");
const $formViaje = $("#formNuevoViaje");
const $cmbConductor = $("#conductor");
const $cmbDestino = $("#destino");
const $txtTiempoMaximo = $("#tiempo_maximo");

const cacheViajes = new Map();   // id -> viaje
let catalogoConductores = [];
let catalogoRutas = [];
let viajeSeleccionado = null;
let tablaViajes = null;


/*=========================================================*
 *  UTILIDADES
 *=========================================================*/

function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function obtenerTextoCelda(valor) {
    if (valor === null || valor === undefined) return "";
    return $("<div>").html(valor).text().trim();
}

function mensajeError(xhr, porDefecto) {
    try {
        const r = JSON.parse(xhr.responseText);
        return r.message || r.mensaje || porDefecto;
    } catch (e) {
        return porDefecto;
    }
}

function toast(mensaje, tipo) {
    tipo = tipo || "success";

    const iconos = {
        success: "bi-check-circle-fill",
        error: "bi-x-circle-fill",
        warning: "bi-exclamation-triangle-fill"
    };

    let $stack = $(".toast-stack");
    if (!$stack.length) {
        $stack = $('<div class="toast-stack"></div>').appendTo("body");
    }

    const $t = $(
        '<div class="app-toast ' + tipo + '" role="status">' +
        '<i class="bi ' + (iconos[tipo] || iconos.success) + '"></i>' +
        "<span></span></div>"
    );

    $t.find("span").text(mensaje);
    $stack.append($t);

    setTimeout(function () {
        $t.fadeOut(250, function () { $(this).remove(); });
    }, 3500);
}

function nombreConductor(c) {
    return ((c.nombre || "") + " " + (c.apellido || "")).trim();
}


/*=========================================================*
 *  TIEMPOS Y ESTADOS
 *=========================================================*/

function normalizarFecha(fecha) {
    if (!fecha) return null;
    const t = String(fecha).trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.substring(0, 10);

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
        const p = t.split("/");
        return p[2] + "-" + p[1] + "-" + p[0];
    }

    return t;
}

function horaAMinutos(hora) {
    if (!hora) return 0;
    const p = String(hora).split(":");
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
}

function minutosAHoras(minutos) {
    minutos = parseInt(minutos, 10) || 0;
    return Math.floor(minutos / 60) + "h " + (minutos % 60) + " min";
}

function calcularTiempoReal(horaSalida, horaLlegada) {
    if (!horaSalida || !horaLlegada) return 0;

    let minutos = horaAMinutos(horaLlegada) - horaAMinutos(horaSalida);
    if (minutos < 0) minutos += 24 * 60;   // viaje que cruza medianoche

    return minutos;
}

function calcularTiempoExcedido(tiempoReal, tiempoODT) {
    const odt = horaAMinutos(tiempoODT);
    return tiempoReal > odt ? tiempoReal - odt : 0;
}

function obtenerEstadoODT(tiempoExcedido) {
    return tiempoExcedido <= 0 ? "CUMPLIDO" : "INCUMPLIDO";
}

function obtenerEstadoFurgon(furgon) {
    const v = String(furgon || "").trim().toUpperCase();
    return FURGONES_CUMPLIDOS.indexOf(v) !== -1 ? "CUMPLIDO" : "INCUMPLIDO";
}

function obtenerHora(valor) {
    if (!valor) return "";
    const t = String(valor);

    if (t.includes("T")) {
        const h = t.split("T")[1];
        return h ? h.substring(0, 5) : "";
    }

    return t.includes(":") ? t.substring(0, 5) : t;
}

function convertirTiempoParaInput(valor) {
    if (valor === null || valor === undefined || valor === "") return "";
    if (String(valor).includes(":")) return String(valor).substring(0, 5);

    const minutos = parseInt(valor, 10);
    if (isNaN(minutos)) return String(valor);

    return String(Math.floor(minutos / 60)).padStart(2, "0") + ":" +
           String(minutos % 60).padStart(2, "0");
}


/*=========================================================*
 *  DOCUMENT READY
 *=========================================================*/

$(document).ready(function () {

    inicializarTabla();

    cargarCatalogos().always(function () {
        cargarViajes();
    });


    /* ---- Modal nuevo / editar ------------------------ */

    $modalNuevoViaje.on("shown.bs.modal", function () {
        cargarPlacas();
    });

    // Al cerrar (guardar o cancelar) se vuelve a modo "Nuevo viaje"
    $modalNuevoViaje.on("hidden.bs.modal", resetFormularioViaje);

    $cmbDestino.on("change", function () {
        const odt = $(this).find("option:selected").data("odt");
        $txtTiempoMaximo.val(odt ? convertirTiempoParaInput(odt) : "");
    });

    $formViaje.on("submit", function (e) {
        e.preventDefault();
        guardarViaje();
    });


    /* ---- Filtros ------------------------------------- */

    $("#txtFechaInicio, #txtFechaFin, #cmbRuta, #cmbConductor, #cmbEstadoODT, #cmbEstadoFurgon")
        .on("change", aplicarFiltrosAuditoria);

    $("#btnLimpiar").on("click", function () {
        $("#txtFechaInicio, #txtFechaFin, #cmbRuta, #cmbConductor, #cmbEstadoODT, #cmbEstadoFurgon").val("");
        aplicarFiltrosAuditoria();
    });

    $("#btnExportarPDF").on("click", function () {
        if (typeof window.exportarAuditoriaPDF === "function") {
            window.exportarAuditoriaPDF();
        } else {
            toast("El módulo de PDF no está cargado.", "error");
        }
    });


    /* ---- Acciones de fila (delegadas) ---------------- */

    $(document).on("click", ".btn-editar-viaje", function () {
        viajeSeleccionado = $(this).data("id");
        bootstrap.Modal.getOrCreateInstance("#modalAccionesViaje").show();
    });

    $(document).on("click", ".btn-ver-notas", function () {
        viajeSeleccionado = $(this).data("id");
        mostrarNota(viajeSeleccionado);
    });

    $(document).on("click", ".btn-eliminar-viaje", function () {
        eliminarViaje($(this).data("id"));
    });


    /* ---- Modal de acciones --------------------------- */

    $("#btnModificarInformacion").on("click", function () {
        const viaje = obtenerViajeSeleccionado();
        if (!viaje) return;

        cargarDatosViajeEnFormulario(viaje);
        cambiarModal("modalAccionesViaje", "modalNuevoViaje");
    });

    $("#btnAgregarNota").on("click", function () { abrirModalNota(false); });
    $("#btnModificarNota").on("click", function () { abrirModalNota(true); });

    $("#formNotaViaje").on("submit", function (e) {
        e.preventDefault();
        guardarNotaViaje();
    });


    /* ---- Overlay de nota ----------------------------- */

    $("#modalVerNota").on("click", function (e) {
        if (e.target === this) cerrarModalNota();
    });

    $(document).on("keydown", function (e) {
        if (e.key === "Escape") cerrarModalNota();
    });

});


/*=========================================================*
 *  DATATABLE
 *=========================================================*/

function inicializarTabla() {

    if (!$("#tblViajes").length) {
        console.error("No existe #tblViajes en el HTML.");
        return null;
    }

    if ($.fn.DataTable.isDataTable("#tblViajes")) {
        return tablaViajes || $("#tblViajes").DataTable();
    }

    if ($.fn.dataTable.ext && $.fn.dataTable.ext.pager) {
        $.fn.dataTable.ext.pager.numbers_length = 5;
    }

    /*
     * Columnas:
     * 0 #   1 Fecha   2 Conductor   3 Placa   4 Furgón   5 Origen
     * 6 Destino   7 Salida   8 Llegada   9 Tiempo real   10 Máximo
     * 11 Exceso   12 Estado ODT   13 Estado Furgón   14 Notas (oculta)
     * 15 Acciones
     */
    tablaViajes = $("#tblViajes").DataTable({

        autoWidth: false,
        responsive: false,
        processing: false,
        stateSave: false,

        paging: true,
        pageLength: 40,
        lengthChange: false,
        pagingType: "full_numbers",

        order: [[1, "desc"]],
        searching: true,
        ordering: true,

        language: {
            search: "",
            searchPlaceholder: "Buscar viaje, conductor, placa, ruta...",
            zeroRecords: "No se encontraron viajes",
            emptyTable: "No hay viajes registrados",
            info: "Mostrando _START_–_END_ de _TOTAL_ viajes",
            infoEmpty: "Mostrando 0 viajes",
            infoFiltered: "(de _MAX_ viajes)",
            paginate: {
                first: '<i class="bi bi-chevron-double-left"></i>',
                previous: '<i class="bi bi-chevron-left"></i>',
                next: '<i class="bi bi-chevron-right"></i>',
                last: '<i class="bi bi-chevron-double-right"></i>'
            }
        },

        columnDefs: [
            { targets: 14, visible: false, searchable: false, orderable: false },
            { targets: 15, orderable: false, searchable: false }
        ],

        drawCallback: function () {
            $("#lblRegistros").text(this.api().page.info().recordsDisplay);

            $("#tblViajes tbody tr").css("animation", "tableRowIn .18s ease both");
        }
    });

    // El dashboard siempre refleja lo que está filtrado
    tablaViajes.on("draw", actualizarDashboard);

    moverBuscadorAlHeader();

    return tablaViajes;
}

function moverBuscadorAlHeader() {

    // DataTables 2.x usa .dt-search; 1.x usa .dataTables_filter
    const $filtro = $("#tblViajes_wrapper .dt-search, #tblViajes_wrapper .dataTables_filter").first();
    const $header = $(".table-panel-header");

    if (!$filtro.length || !$header.length) return;
    if ($header.find(".table-search-container").length) return;

    $('<div class="table-search-container"></div>')
        .append($filtro)
        .appendTo($header);
}


/*=========================================================*
 *  FILTROS DE AUDITORÍA
 *=========================================================*/

$.fn.dataTable.ext.search.push(function (settings, data) {

    if (!settings.nTable || settings.nTable.id !== "tblViajes") return true;

    const desde = $("#txtFechaInicio").val();
    const hasta = $("#txtFechaFin").val();
    const ruta = $("#cmbRuta").val();
    const conductor = $("#cmbConductor").val();
    const estadoODT = $("#cmbEstadoODT").val();
    const estadoFurgon = $("#cmbEstadoFurgon").val();

    const igual = function (a, b) {
        return String(a).trim().toUpperCase() === String(b).trim().toUpperCase();
    };

    const fecha = normalizarFecha(obtenerTextoCelda(data[1]));

    if (desde && fecha && fecha < normalizarFecha(desde)) return false;
    if (hasta && fecha && fecha > normalizarFecha(hasta)) return false;

    if (ruta && !igual(obtenerTextoCelda(data[6]), ruta)) return false;
    if (conductor && !igual(obtenerTextoCelda(data[2]), conductor)) return false;
    if (estadoODT && !igual(obtenerTextoCelda(data[12]), estadoODT)) return false;
    if (estadoFurgon && !igual(obtenerTextoCelda(data[13]), estadoFurgon)) return false;

    return true;
});

function aplicarFiltrosAuditoria() {
    if ($.fn.DataTable.isDataTable("#tblViajes")) {
        $("#tblViajes").DataTable().draw();   // el evento "draw" actualiza el dashboard
    }
}


/*=========================================================*
 *  CATÁLOGOS
 *=========================================================*/

function cargarCatalogos() {

    return $.when(
        $.getJSON(URL_CONDUCTORES),
        $.getJSON(URL_RUTAS)
    ).done(function (resC, resR) {

        catalogoConductores = Array.isArray(resC[0]) ? resC[0] : [];
        catalogoRutas = Array.isArray(resR[0]) ? resR[0] : [];

        pintarCatalogos();

    }).fail(function (xhr) {
        console.error("Error cargando catálogos:", xhr.status, xhr.responseText);
        toast("No se pudieron cargar conductores y rutas.", "error");
    });
}

function pintarCatalogos() {

    /* ---- Formulario ---------------------------------- */

    let html = '<option value="">Seleccionar conductor</option>';
    catalogoConductores.forEach(function (c) {
        const id = c.id ?? c.idConductor ?? "";
        html += '<option value="' + escapeHtml(id) + '">' +
                escapeHtml(nombreConductor(c)) + "</option>";
    });
    $cmbConductor.html(html);

    html = '<option value="">Seleccionar destino</option>';
    catalogoRutas.forEach(function (r) {
        if (!r.destino) return;
        html += '<option value="' + escapeHtml(r.destino) + '" data-odt="' +
                escapeHtml(r.odt || "") + '">' + escapeHtml(r.destino) + "</option>";
    });
    $cmbDestino.html(html);

    /* ---- Filtros (conservan la selección actual) ----- */

    const $fc = $("#cmbConductor");
    const $fr = $("#cmbRuta");
    // OJO: #conductor (formulario) y #cmbConductor (filtro) son distintos

    const conductorActual = $fc.val();
    const rutaActual = $fr.val();

    html = '<option value="">Todos los conductores</option>';
    catalogoConductores.forEach(function (c) {
        const n = nombreConductor(c);
        html += '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + "</option>";
    });
    $fc.html(html).val(conductorActual || "");

    const destinos = [];
    catalogoRutas.forEach(function (r) {
        if (r.destino && destinos.indexOf(r.destino) === -1) destinos.push(r.destino);
    });

    html = '<option value="">Todas las rutas</option>';
    destinos.forEach(function (d) {
        html += '<option value="' + escapeHtml(d) + '">' + escapeHtml(d) + "</option>";
    });
    $fr.html(html).val(rutaActual || "");
}

function cargarPlacas() {

    $.getJSON(URL_CAMIONES)
        .done(function (camiones) {

            const $lista = $("#listaPlacas").empty();
            if (!Array.isArray(camiones)) return;

            camiones.forEach(function (c) {
                if (c.placa) {
                    $lista.append('<option value="' + escapeHtml(c.placa) + '"></option>');
                }
            });
        })
        .fail(function (xhr) {
            console.error("Error cargando placas:", xhr.status, xhr.responseText);
        });
}

/*
 * NOTA: arriba #cmbConductor es el filtro de auditoría y
 * $cmbConductor (const global) apunta a #conductor (formulario).
 * Para evitar confusión, el filtro se maneja siempre por id.
 */


/*=========================================================*
 *  CARGAR VIAJES
 *=========================================================*/

function cargarViajes() {

    const tabla = inicializarTabla();
    if (!tabla) return $.Deferred().reject().promise();

    return $.ajax({
        url: URL_VIAJES,
        type: "GET",
        dataType: "json"
    }).done(function (viajes) {

        tabla.clear();
        cacheViajes.clear();

        if (!Array.isArray(viajes)) {
            console.error("El backend NO devolvió un Array:", viajes);
            tabla.draw();
            return;
        }

        const filas = viajes.map(function (viaje, i) {
            cacheViajes.set(String(viaje.id), viaje);
            return construirFila(viaje, i + 1);
        });

        tabla.rows.add(filas).draw();   // un solo draw para todo el lote

    }).fail(function (xhr) {
        console.error("ERROR CARGANDO VIAJES:", xhr.status, xhr.responseText);
        toast("No se pudieron cargar los viajes.", "error");
    });
}

function obtenerViajeSeleccionado() {

    if (!viajeSeleccionado) {
        toast("No se ha seleccionado ningún viaje.", "warning");
        return null;
    }

    const viaje = cacheViajes.get(String(viajeSeleccionado));

    if (!viaje) {
        toast("No se encontró el viaje seleccionado.", "error");
        return null;
    }

    return viaje;
}


/*=========================================================*
 *  CONSTRUIR FILA
 *=========================================================*/

function construirFila(viaje, numero) {

    const horaSalida = obtenerHora(viaje.salida);
    const horaLlegada = obtenerHora(viaje.llegada);
    const tiempoReal = calcularTiempoReal(horaSalida, horaLlegada);

    let tiempoMaximo = viaje.tiempoMaximo;

    if (tiempoMaximo === null || tiempoMaximo === undefined || tiempoMaximo === "") {
        tiempoMaximo = horaAMinutos(viaje.odt);
    }

    if (typeof tiempoMaximo === "string" && tiempoMaximo.includes(":")) {
        tiempoMaximo = horaAMinutos(tiempoMaximo);
    }

    const tiempoExcedido =
        viaje.tiempoExcedido !== null && viaje.tiempoExcedido !== undefined
            ? parseInt(viaje.tiempoExcedido, 10) || 0
            : calcularTiempoExcedido(tiempoReal, viaje.odt);

    const estado = String(viaje.estado || obtenerEstadoODT(tiempoExcedido)).toUpperCase();
    const estadoFurgon = String(viaje.estadoFurgon || obtenerEstadoFurgon(viaje.furgon)).toUpperCase();

    const tieneNota = viaje.notas && String(viaje.notas).trim() !== "";
    const id = escapeHtml(viaje.id);

    const botonNota = tieneNota
        ? '<button type="button" class="btn-accion btn-accion-ver btn-ver-notas" data-id="' + id +
          '" title="Ver nota"><i class="bi bi-eye"></i></button>'
        : '<button type="button" class="btn-accion btn-accion-vacio" disabled ' +
          'title="Este viaje no tiene notas"><i class="bi bi-eye-slash"></i></button>';

    const botones =
        '<div class="d-flex gap-1 justify-content-center">' +
            botonNota +
            '<button type="button" class="btn-accion btn-accion-editar btn-editar-viaje" data-id="' + id +
            '" title="Editar viaje"><i class="bi bi-pencil"></i></button>' +
            '<button type="button" class="btn-accion btn-accion-eliminar btn-eliminar-viaje" data-id="' + id +
            '" title="Eliminar viaje"><i class="bi bi-trash"></i></button>' +
        "</div>";

    const badge = function (valor) {
        return valor === "CUMPLIDO"
            ? '<span class="badge-estado ok">CUMPLIDO</span>'
            : '<span class="badge-estado bad">INCUMPLIDO</span>';
    };

    return [
        numero,                                         // 0
        escapeHtml(viaje.fecha || ""),                  // 1
        escapeHtml(viaje.conductor || ""),              // 2
        escapeHtml(viaje.placa || ""),                  // 3
        escapeHtml(viaje.furgon || ""),                 // 4
        escapeHtml(viaje.origen || ""),                 // 5
        escapeHtml(viaje.destino || ""),                // 6
        horaSalida,                                     // 7
        horaLlegada,                                    // 8
        minutosAHoras(tiempoReal),                      // 9
        minutosAHoras(tiempoMaximo),                    // 10
        tiempoExcedido === 0                            // 11
            ? "<span class='tiempo-ok'>0 min</span>"
            : "<span class='tiempo-bad'>+" + tiempoExcedido + " min</span>",
        badge(estado),                                  // 12
        badge(estadoFurgon),                            // 13
        escapeHtml(viaje.notas || ""),                  // 14 (oculta)
        botones                                         // 15
    ];
}


/*=========================================================*
 *  DASHBOARD
 *=========================================================*/

function actualizarDashboard() {

    if (!$.fn.DataTable.isDataTable("#tblViajes")) return;

    const filas = $("#tblViajes").DataTable().rows({ search: "applied" }).data().toArray();

    let odtOk = 0, odtBad = 0, furgonOk = 0, furgonBad = 0;

    filas.forEach(function (fila) {
        const odt = obtenerTextoCelda(fila[12]).toUpperCase();
        const furgon = obtenerTextoCelda(fila[13]).toUpperCase();

        if (odt === "CUMPLIDO") odtOk++;
        else if (odt === "INCUMPLIDO") odtBad++;

        if (furgon === "CUMPLIDO") furgonOk++;
        else if (furgon === "INCUMPLIDO") furgonBad++;
    });

    const pct = function (ok, bad) {
        return (ok + bad) > 0 ? (ok / (ok + bad)) * 100 : 0;
    };

    $("#lblTotalViajes").text(filas.length);
    $("#lblODTCumplidos").text(odtOk);
    $("#lblODTIncumplidos").text(odtBad);
    $("#lblFurgonCumplidos").text(furgonOk);
    $("#lblFurgonIncumplidos").text(furgonBad);
    $("#lblPorcentajeODT").text(pct(odtOk, odtBad).toFixed(2) + "%");
    $("#lblPorcentajeFurgon").text(pct(furgonOk, furgonBad).toFixed(2) + "%");
    $("#lblRegistros").text(filas.length);
}


/*=========================================================*
 *  MODALES: UTILIDAD PARA ENCADENAR
 *=========================================================*/

function cambiarModal(idActual, idSiguiente) {

    const actual = document.getElementById(idActual);
    const siguiente = bootstrap.Modal.getOrCreateInstance("#" + idSiguiente);

    if (actual && actual.classList.contains("show")) {
        actual.addEventListener("hidden.bs.modal", function () {
            siguiente.show();
        }, { once: true });

        bootstrap.Modal.getInstance(actual).hide();
    } else {
        siguiente.show();
    }
}


/*=========================================================*
 *  FORMULARIO NUEVO / EDITAR
 *=========================================================*/

function resetFormularioViaje() {

    $formViaje[0].reset();
    $formViaje.removeData("id").removeData("notas");
    $formViaje.find(".is-invalid").removeClass("is-invalid");
    $txtTiempoMaximo.val("");

    $("#modalNuevoViaje .modal-title").text("Registrar Nuevo Viaje");
    $formViaje.find("button[type='submit']")
        .prop("disabled", false)
        .html('<i class="bi bi-check2"></i> Guardar Viaje');
}

function cargarDatosViajeEnFormulario(viaje) {

    resetFormularioViaje();

    $("#fecha").val(normalizarFecha(viaje.fecha) || "");

    // Conductor: el viaje guarda el nombre, el select usa el id
    const nombre = String(viaje.conductor || "").trim().toUpperCase();
    $("#conductor option").each(function () {
        if ($(this).text().trim().toUpperCase() === nombre) {
            $("#conductor").val($(this).val());
            return false;
        }
    });

    $("#placa").val(viaje.placa || "");
    $("#furgon").val(viaje.furgon || "");
    $("#origen").val(viaje.origen || "");

    // Destino: si ya no está activo, se agrega temporalmente
    if (viaje.destino && !$cmbDestino.find("option").filter(function () {
        return this.value === viaje.destino;
    }).length) {
        $cmbDestino.append(
            '<option value="' + escapeHtml(viaje.destino) + '">' +
            escapeHtml(viaje.destino) + " (inactiva)</option>"
        );
    }

    $cmbDestino.val(viaje.destino || "");

    $("#salida").val(obtenerHora(viaje.salida));
    $("#llegada").val(obtenerHora(viaje.llegada));

    const odtOpcion = $cmbDestino.find("option:selected").data("odt");

    $txtTiempoMaximo.val(
        convertirTiempoParaInput(
            odtOpcion || viaje.odt || viaje.tiempoMaximo || viaje.tiempo_maximo || ""
        )
    );

    $formViaje.data("id", viaje.id);
    $formViaje.data("notas", viaje.notas || "");

    $("#modalNuevoViaje .modal-title").text("Modificar Viaje");
    $formViaje.find("button[type='submit']")
        .html('<i class="bi bi-save"></i> Actualizar Viaje');
}

function validarFormularioViaje() {

    const campos = ["#fecha", "#conductor", "#placa", "#furgon", "#origen", "#destino", "#salida", "#llegada"];
    let primero = null;

    campos.forEach(function (sel) {
        const $c = $(sel);
        const vacio = String($c.val() || "").trim() === "";
        $c.toggleClass("is-invalid", vacio);
        if (vacio && !primero) primero = $c;
    });

    if (primero) {
        primero.trigger("focus");
        toast("Debe completar todos los campos.", "warning");
        return false;
    }

    if (!$txtTiempoMaximo.val()) {
        $cmbDestino.addClass("is-invalid");
        toast("El destino seleccionado no tiene tiempo máximo (ODT) configurado.", "warning");
        return false;
    }

    return true;
}

function guardarViaje() {

    if (!validarFormularioViaje()) return;

    const tiempoReal = calcularTiempoReal($("#salida").val(), $("#llegada").val());
    const tiempoExcedido = calcularTiempoExcedido(tiempoReal, $txtTiempoMaximo.val());
    const idViaje = $formViaje.data("id");

    const viaje = {
        id: idViaje || null,
        fecha: $("#fecha").val(),
        conductor: $("#conductor option:selected").text().trim(),
        placa: $("#placa").val().trim(),
        furgon: $("#furgon").val(),
        estadoFurgon: obtenerEstadoFurgon($("#furgon").val()),
        origen: $("#origen").val().trim(),
        destino: $("#destino").val(),
        salida: $("#fecha").val() + "T" + $("#salida").val(),
        llegada: $("#fecha").val() + "T" + $("#llegada").val(),
        odt: $txtTiempoMaximo.val(),
        tiempoMaximo: horaAMinutos($txtTiempoMaximo.val()),
        tiempoExcedido: tiempoExcedido,
        estado: obtenerEstadoODT(tiempoExcedido),
        notas: $formViaje.data("notas") || ""
    };

    const $btn = $formViaje.find("button[type='submit']");
    $btn.prop("disabled", true);   // evita doble clic

    $.ajax({
        url: idViaje ? URL_ACTUALIZAR_VIAJE + idViaje : URL_GUARDAR_VIAJE,
        type: idViaje ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(viaje)
    }).done(function () {

        bootstrap.Modal.getInstance("#modalNuevoViaje")?.hide();   // hidden => reset
        viajeSeleccionado = null;

        cargarViajes();

        toast(idViaje ? "Viaje actualizado correctamente." : "Viaje guardado correctamente.");

    }).fail(function (xhr) {

        console.error("ERROR GUARDANDO VIAJE:", xhr.status, xhr.responseText);
        toast(mensajeError(xhr, "Error al guardar el viaje."), "error");

    }).always(function () {
        $btn.prop("disabled", false);
    });
}


/*=========================================================*
 *  ACTUALIZAR VIAJE (reutilizable)
 *=========================================================*/

function actualizarViaje(viaje) {
    return $.ajax({
        url: URL_ACTUALIZAR_VIAJE + viaje.id,
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(viaje)
    });
}


/*=========================================================*
 *  NOTAS
 *=========================================================*/

function abrirModalNota(modificar) {

    const viaje = obtenerViajeSeleccionado();
    if (!viaje) return;

    $("#idViajeNota").val(viaje.id);
    $("#txtNotaViaje").val(viaje.notas || "");

    $("#tituloModalNota").text(modificar ? "Modificar nota del viaje" : "Agregar nota al viaje");

    cambiarModal("modalAccionesViaje", "modalNotaViaje");
}

function guardarNotaViaje() {

    const id = $("#idViajeNota").val();
    const nota = $("#txtNotaViaje").val().trim();

    if (!nota) {
        toast("Debe escribir una nota.", "warning");
        return;
    }

    const original = cacheViajes.get(String(id));

    if (!original) {
        toast("No se encontró el viaje.", "error");
        return;
    }

    const $btn = $("#formNotaViaje button[type='submit']").prop("disabled", true);

    actualizarViaje(Object.assign({}, original, { notas: nota }))
        .done(function () {
            bootstrap.Modal.getInstance("#modalNotaViaje")?.hide();
            $("#formNotaViaje")[0].reset();
            cargarViajes();
            toast("Nota guardada correctamente.");
        })
        .fail(function (xhr) {
            console.error("Error guardando nota:", xhr.status, xhr.responseText);
            toast(mensajeError(xhr, "No se pudo guardar la nota."), "error");
        })
        .always(function () {
            $btn.prop("disabled", false);
        });
}

function mostrarNota(id) {

    const viaje = cacheViajes.get(String(id));

    if (!viaje) {
        toast("No se encontró el viaje.", "error");
        return;
    }

    $("#notaConductor").text(viaje.conductor || "---");
    $("#notaPlaca").text(viaje.placa || "---");
    $("#notaFecha").text(normalizarFecha(viaje.fecha) || "---");
    $("#notaRuta").text((viaje.origen || "---") + " → " + (viaje.destino || "---"));
    $("#notaTexto").text(viaje.notas || "Este viaje no tiene ninguna nota registrada.");

    $("#modalVerNota").addClass("show");
}

function cerrarModalNota() {
    $("#modalVerNota").removeClass("show");
}

function eliminarNotaActual() {

    const viaje = obtenerViajeSeleccionado();
    if (!viaje) return;

    if (!confirm("¿Está seguro de eliminar esta nota?")) return;

    actualizarViaje(Object.assign({}, viaje, { notas: "" }))
        .done(function () {
            cerrarModalNota();
            cargarViajes();
            toast("Nota eliminada correctamente.");
        })
        .fail(function (xhr) {
            console.error("Error eliminando nota:", xhr.status, xhr.responseText);
            toast(mensajeError(xhr, "No se pudo eliminar la nota."), "error");
        });
}


/*=========================================================*
 *  ELIMINAR VIAJE
 *=========================================================*/

function eliminarViaje(id) {

    if (!confirm("¿Está seguro de eliminar este viaje?")) return;

    $.ajax({
        url: URL_ELIMINAR_VIAJE + id,
        type: "DELETE"
    }).done(function () {
        viajeSeleccionado = null;
        cargarViajes();
        toast("Viaje eliminado correctamente.");
    }).fail(function (xhr) {
        console.error("Error eliminando:", xhr.status, xhr.responseText);
        toast(mensajeError(xhr, "No se pudo eliminar el viaje."), "error");
    });
}