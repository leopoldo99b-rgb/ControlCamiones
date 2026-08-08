/*=========================================================
=            VARIABLES GLOBALES
=========================================================*/

const URL_CONDUCTORES = "/conductores/api";
const URL_CAMIONES = "/camiones/disponibles";
const URL_RUTAS = "/rutas/activas";

const $modalNuevoViaje = $("#modalNuevoViaje");

const $cmbConductor = $("#conductor");
const $cmbPlaca = $("#placa");
const $cmbDestino = $("#destino");

const $txtTiempoMaximo = $("#tiempo_maximo");

const $txtSalida = $("#salida");
const $txtLlegada = $("#llegada");


/*=========================================================
=            EVENTOS
=========================================================*/

$(document).ready(function () {
	
	
	/*=====================================================
	=            BOTÓN EXPORTAR PDF
	=====================================================*/

	$("#btnExportarPDF").on("click", function () {

	    exportarAuditoriaPDF();

	});

/*=====================================================
=            MODAL NUEVO VIAJE
=====================================================*/

$modalNuevoViaje.on("shown.bs.modal", function () {

    cargarConductores();
    cargarPlacas();
    cargarRutas();

});


/*=====================================================
=            AUDITORÍA DE VIAJES
=====================================================*/

cargarFiltrosAuditoria();


/*=====================================================
=            CARGAR VIAJES
=====================================================*/

cargarViajes();


/*=====================================================
=            BOTÓN BUSCAR AUDITORÍA
=====================================================*/

$("#btnBuscar").on("click", function () {

    aplicarFiltrosAuditoria();

});


/*=====================================================
=            BOTÓN LIMPIAR AUDITORÍA
=====================================================*/

$("#btnLimpiar").on("click", function () {

    $("#txtFechaInicio").val("");

    $("#txtFechaFin").val("");

    $("#cmbRuta").val("");

    $("#cmbConductor").val("");

    $("#cmbEstadoODT").val("");

    $("#cmbEstadoFurgon").val("");

    aplicarFiltrosAuditoria();

});


/*=====================================================
=            BOTÓN ACTUALIZAR
=====================================================*/

$("#btnActualizar").on("click", function () {

    cargarFiltrosAuditoria();

    cargarViajes();

});


/*=====================================================
=            CAMBIO DIRECTO DE FILTROS
=====================================================*/

$(
    "#txtFechaInicio, " +
    "#txtFechaFin, " +
    "#cmbRuta, " +
    "#cmbConductor, " +
    "#cmbEstadoODT, " +
    "#cmbEstadoFurgon"
).on("change", function () {

    aplicarFiltrosAuditoria();

});


});


/*=========================================================
=            CONDUCTORES
=========================================================*/

function cargarConductores() {

    $.ajax({

        url: URL_CONDUCTORES,
        type: "GET",
        dataType: "json",

        success: function (conductores) {

            $cmbConductor.empty();

            $cmbConductor.append(
                '<option value="">Seleccionar conductor</option>'
            );

            conductores.forEach(function (conductor) {

                $cmbConductor.append(`
                    <option value="${conductor.id}">
                        ${conductor.nombre} ${conductor.apellido}
                    </option>
                `);

            });

        },

        error: function (xhr) {

            console.error(xhr.responseText);

        }

    });

}


/*=========================================================
=            CAMIONES
=========================================================*/

function cargarPlacas() {

    $.ajax({

        url: URL_CAMIONES,
        type: "GET",
        dataType: "json",

        success: function (camiones) {

            $("#listaPlacas").empty();

            camiones.forEach(function (camion) {

                $("#listaPlacas").append(`
                    <option value="${camion.placa}">
                `);

            });

        },

        error: function (xhr) {

            console.error(xhr.responseText);

        }

    });

}


/*=========================================================
=            RUTAS
=========================================================*/

function cargarRutas() {

    $.ajax({

        url: URL_RUTAS,
        type: "GET",
        dataType: "json",

        success: function (rutas) {

            $cmbDestino.empty();

            $cmbDestino.append(
                '<option value="">Seleccionar destino</option>'
            );

            rutas.forEach(function (ruta) {

                $cmbDestino.append(`
                    <option
                        value="${ruta.destino}"
                        data-odt="${ruta.odt}">
                        ${ruta.destino}
                    </option>
                `);

            });

        },

        error: function (xhr) {

            console.error(xhr.responseText);

        }

    });

}


/*=========================================================
=            FILTROS DE AUDITORÍA
=========================================================*/

function cargarFiltrosAuditoria() {

    /*=====================================================
    =            CARGAR CONDUCTORES
    =====================================================*/

    $.ajax({

        url: URL_CONDUCTORES,
        type: "GET",
        dataType: "json",

        success: function (conductores) {

            const $filtroConductor = $("#cmbConductor");

            const valorActual = $filtroConductor.val();

            $filtroConductor.empty();

            $filtroConductor.append(
                '<option value="">Todos los conductores</option>'
            );

            conductores.forEach(function (conductor) {

                const nombreCompleto =
                    (conductor.nombre || "") +
                    " " +
                    (conductor.apellido || "");

                $filtroConductor.append(`
                    <option value="${escapeHtml(nombreCompleto.trim())}">
                        ${escapeHtml(nombreCompleto.trim())}
                    </option>
                `);

            });

            if (valorActual) {

                $filtroConductor.val(valorActual);

            }

        },

        error: function (xhr) {

            console.error(
                "Error cargando conductores para auditoría:",
                xhr.responseText
            );

        }

    });


    /*=====================================================
    =            CARGAR RUTAS
    =====================================================*/

    $.ajax({

        url: URL_RUTAS,
        type: "GET",
        dataType: "json",

        success: function (rutas) {

            const $filtroRuta = $("#cmbRuta");

            const valorActual = $filtroRuta.val();

            $filtroRuta.empty();

            $filtroRuta.append(
                '<option value="">Todas las rutas</option>'
            );

            rutas.forEach(function (ruta) {

                if (!ruta.destino) {

                    return;

                }

                $filtroRuta.append(`
                    <option value="${escapeHtml(ruta.destino)}">
                        ${escapeHtml(ruta.destino)}
                    </option>
                `);

            });

            if (valorActual) {

                $filtroRuta.val(valorActual);

            }

        },

        error: function (xhr) {

            console.error(
                "Error cargando rutas para auditoría:",
                xhr.responseText
            );

        }

    });

}


/*=========================================================
=            ESCAPAR HTML
=========================================================*/

function escapeHtml(text) {

    if (text === null || text === undefined) {

        return "";

    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



/*=========================================================*
=            FILTRADO DE AUDITORÍA DATATABLE
*=========================================================*/

$.fn.dataTable.ext.search.push(function (
    settings,
    data,
    dataIndex
) {

    /*=====================================================
    =            SOLO tblViajes
    =====================================================*/

    if (
        !settings.nTable ||
        settings.nTable.id !== "tblViajes"
    ) {

        return true;

    }


    /*=====================================================
    =            OBTENER FILTROS
    =====================================================*/

    const fechaInicio =
        $("#txtFechaInicio").val();

    const fechaFin =
        $("#txtFechaFin").val();

    const ruta =
        $("#cmbRuta").val();

    const conductor =
        $("#cmbConductor").val();

    const estadoODTFiltro =
        $("#cmbEstadoODT").val();

    const estadoFurgonFiltro =
        $("#cmbEstadoFurgon").val();


    /*=====================================================
    =            DATOS DE LA FILA
    =====================================================*/

    const fechaFila =
        obtenerTextoCelda(data[1]);

    const conductorFila =
        obtenerTextoCelda(data[2]);

    const rutaFila =
        obtenerTextoCelda(data[6]);


    /*
    =====================================================
    IMPORTANTE:

    data[12] = Estado ODT
    data[13] = Estado Furgón
    =====================================================
    */

    const estadoODTFila =
        obtenerTextoCelda(data[12])
            .toUpperCase()
            .trim();

    const estadoFurgonFila =
        obtenerTextoCelda(data[13])
            .toUpperCase()
            .trim();


    /*=====================================================
    =            FILTRO FECHA INICIO
    =====================================================*/

    if (fechaInicio) {

        const fechaRegistro =
            normalizarFecha(fechaFila);

        const fechaDesde =
            normalizarFecha(fechaInicio);

        if (
            fechaRegistro &&
            fechaDesde &&
            fechaRegistro < fechaDesde
        ) {

            return false;

        }

    }


    /*=====================================================
    =            FILTRO FECHA FIN
    =====================================================*/

    if (fechaFin) {

        const fechaRegistro =
            normalizarFecha(fechaFila);

        const fechaHasta =
            normalizarFecha(fechaFin);

        if (
            fechaRegistro &&
            fechaHasta &&
            fechaRegistro > fechaHasta
        ) {

            return false;

        }

    }


    /*=====================================================
    =            FILTRO RUTA
    =====================================================*/

    if (ruta) {

        if (
            rutaFila.trim().toUpperCase() !==
            ruta.trim().toUpperCase()
        ) {

            return false;

        }

    }


    /*=====================================================
    =            FILTRO CONDUCTOR
    =====================================================*/

    if (conductor) {

        if (
            conductorFila.trim().toUpperCase() !==
            conductor.trim().toUpperCase()
        ) {

            return false;

        }

    }


    /*=====================================================
    =            FILTRO ESTADO ODT
    =====================================================*/

    if (estadoODTFiltro) {

        if (
            estadoODTFila !==
            estadoODTFiltro.trim().toUpperCase()
        ) {

            return false;

        }

    }


    /*=====================================================
    =            FILTRO ESTADO FURGÓN
    =====================================================*/

    if (estadoFurgonFiltro) {

        if (
            estadoFurgonFila !==
            estadoFurgonFiltro.trim().toUpperCase()
        ) {

            return false;

        }

    }


    /*=====================================================
    =            FILA APROBADA
    =====================================================*/

    return true;

});



/*=========================================================
=            OBTENER TEXTO DE CELDA
=========================================================*/

function obtenerTextoCelda(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }

    return $("<div>")
        .html(valor)
        .text()
        .trim();

}


/*=========================================================
=            NORMALIZAR FECHA
=========================================================*/

function normalizarFecha(fecha) {

    if (!fecha) {

        return null;

    }

    const texto = String(fecha).trim();


    /*=====================================================
    =            FORMATO YYYY-MM-DD
    =====================================================*/

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ) {

        return texto;

    }


    /*=====================================================
    =            FORMATO ISO
    =====================================================*/

    if (
        /^\d{4}-\d{2}-\d{2}T/.test(texto)
    ) {

        return texto.substring(0, 10);

    }


    /*=====================================================
    =            FORMATO DD/MM/YYYY
    =====================================================*/

    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(texto)
    ) {

        const partes = texto.split("/");

        return (
            partes[2] +
            "-" +
            partes[1] +
            "-" +
            partes[0]
        );

    }


    return texto;

}


/*=========================================================
=            APLICAR FILTROS
=========================================================*/

function aplicarFiltrosAuditoria() {

    if (
        !$.fn.DataTable.isDataTable("#tblViajes")
    ) {

        return;

    }

    const tabla = $("#tblViajes").DataTable();

    tabla.draw();

    actualizarDashboard();

}


/*=========================================================
=            CAMBIO DESTINO
=========================================================*/

$cmbDestino.on("change", function () {

    const odt = $(this)
        .find("option:selected")
        .data("odt");

    $txtTiempoMaximo.val(odt || "");

});


/*=========================================================
=            FUNCIONES DE TIEMPO
=========================================================*/

function calcularTiempoReal(horaSalida, horaLlegada) {

    const salida = new Date(
        "2000-01-01T" + horaSalida
    );

    const llegada = new Date(
        "2000-01-01T" + horaLlegada
    );

    let minutos =
        (llegada - salida) / 60000;

    if (minutos < 0) {

        minutos += 24 * 60;

    }

    return minutos;

}


function horaAMinutos(hora) {

    if (!hora) {

        return 0;

    }

    const partes = hora.split(":");

    return (
        parseInt(partes[0]) * 60
    ) + parseInt(partes[1]);

}


function minutosAHoras(minutos) {

    minutos = parseInt(minutos) || 0;

    const horas = Math.floor(
        minutos / 60
    );

    const mins = minutos % 60;

    return (
        horas +
        "h " +
        mins +
        " min"
    );

}


/*=========================================================
=            TIEMPO EXCEDIDO
=========================================================*/

function calcularTiempoExcedido(
    tiempoReal,
    tiempoODT
) {

    const odt = horaAMinutos(
        tiempoODT
    );

    if (tiempoReal <= odt) {

        return 0;

    }

    return tiempoReal - odt;

}


/*=========================================================
=            ESTADO ODT
=========================================================*/

function obtenerEstadoODT(
    tiempoExcedido
) {

    if (tiempoExcedido <= 0) {

        return "CUMPLIDO";

    }

    return "INCUMPLIDO";

}


/*=========================================================
=            ESTADO FURGON
=========================================================*/

function obtenerEstadoFurgon(furgon) {

    if (

        furgon === "CHC" ||

        furgon === "CMI"

    ) {

        return "CUMPLIDO";

    }

    return "INCUMPLIDO";

}


/*=========================================================
=            GUARDAR VIAJE
=========================================================*/

$("#formNuevoViaje").on(
    "submit",
    function (e) {

        e.preventDefault();


        /*=================================================
        =            VALIDAR CAMPOS
        =================================================*/

        if (

            $("#fecha").val() === "" ||

            $("#conductor").val() === "" ||

            $("#placa").val() === "" ||

            $("#furgon").val() === "" ||

            $("#origen").val().trim() === "" ||

            $("#destino").val() === "" ||

            $("#salida").val() === "" ||

            $("#llegada").val() === ""

        ) {

            alert(
                "Debe completar todos los campos."
            );

            return;

        }


        /*=================================================
        =            CALCULOS
        =================================================*/

        const tiempoReal =
            calcularTiempoReal(

                $("#salida").val(),

                $("#llegada").val()

            );


        const tiempoExcedido =
            calcularTiempoExcedido(

                tiempoReal,

                $("#tiempo_maximo").val()

            );


        const estadoODT =
            obtenerEstadoODT(

                tiempoExcedido

            );


        const estadoFurgon =
            obtenerEstadoFurgon(

                $("#furgon").val()

            );


        /*=================================================
        =            OBJETO
        =================================================*/

        const viaje = {

            fecha:
                $("#fecha").val(),

            conductor:
                $("#conductor option:selected").text().trim(),

            placa:
                $("#placa").val(),

            furgon:
                $("#furgon").val(),

            estadoFurgon:
                estadoFurgon,

            origen:
                $("#origen").val(),

            destino:
                $("#destino").val(),

            salida:
                $("#fecha").val() +
                "T" +
                $("#salida").val(),

            llegada:
                $("#fecha").val() +
                "T" +
                $("#llegada").val(),

            odt:
                $("#tiempo_maximo").val(),

            tiempoMaximo:
                horaAMinutos(
                    $("#tiempo_maximo").val()
                ),

            tiempoExcedido:
                tiempoExcedido,

            estado:
                estadoODT

        };


        /*=================================================
        =            GUARDAR
        =================================================*/

        $.ajax({

            url: "/viajes/guardar",

            type: "POST",

            contentType:
                "application/json",

            data:
                JSON.stringify(viaje),

            success:
                function (response) {

                    agregarFila(response);

                    actualizarDashboard();


                    /*=====================================
                    =            CERRAR MODAL
                    =====================================*/

                    bootstrap.Modal
                        .getInstance(
                            document.getElementById(
                                "modalNuevoViaje"
                            )
                        )
                        .hide();


                    /*=====================================
                    =            LIMPIAR FORMULARIO
                    =====================================*/

                    $("#formNuevoViaje")[0]
                        .reset();

                    $("#tiempo_maximo")
                        .val("");


                    /*=====================================
                    =            RECARGAR FILTROS
                    =====================================*/

                    cargarFiltrosAuditoria();

                },

            error:
                function (xhr) {

                    console.log(
                        xhr.responseText
                    );

                    alert(
                        "Error al guardar."
                    );

                }

        });

    }
);


/*=========================================================
=            AGREGAR FILA
=========================================================*/

function agregarFila(viaje) {

    const tabla =
        $("#tblViajes").DataTable();


    /*=====================================================
    =            FORMATEAR HORA SALIDA
    =====================================================*/

    const horaSalida =
        viaje.salida
            ? viaje.salida.substring(11, 16)
            : "";


    /*=====================================================
    =            FORMATEAR HORA LLEGADA
    =====================================================*/

    const horaLlegada =
        viaje.llegada
            ? viaje.llegada.substring(11, 16)
            : "";


    /*=====================================================
    =            TIEMPO REAL
    =====================================================*/

    const tiempoReal =
        calcularTiempoReal(
            horaSalida,
            horaLlegada
        );


    /*=====================================================
    =            TIEMPO MAXIMO
    =====================================================*/

    let tiempoMaximo =
        viaje.tiempoMaximo;


    if (
        tiempoMaximo === null ||
        tiempoMaximo === undefined
    ) {

        tiempoMaximo =
            horaAMinutos(viaje.odt);

    }


    /*=====================================================
    =            TIEMPO EXCEDIDO
    =====================================================*/

    const tiempoExcedido =
        viaje.tiempoExcedido !== null &&
        viaje.tiempoExcedido !== undefined
            ? viaje.tiempoExcedido
            : calcularTiempoExcedido(
                tiempoReal,
                viaje.odt
            );


    /*=====================================================
    =            ESTADO ODT
    =====================================================*/

    const estado =
        viaje.estado ||
        obtenerEstadoODT(
            tiempoExcedido
        );


    /*=====================================================
    =            ESTADO FURGON
    =====================================================*/

    const estadoFurgon =
        viaje.estadoFurgon ||
        obtenerEstadoFurgon(
            viaje.furgon
        );


    /*=====================================================
    =            AGREGAR FILA
    =====================================================*/

    tabla.row.add([

        tabla.rows().count() + 1,

        viaje.fecha,

        viaje.conductor,

        viaje.placa,

        viaje.furgon,

        viaje.origen,

        viaje.destino,

        horaSalida,

        horaLlegada,

        minutosAHoras(
            tiempoReal
        ),

        minutosAHoras(
            tiempoMaximo
        ),

        tiempoExcedido == 0

            ?

            "<span class='text-success'>0 min</span>"

            :

            "<span class='text-danger'>+" +
            tiempoExcedido +
            " min</span>",

        estado == "CUMPLIDO"

            ?

            "<span class='badge bg-success'>CUMPLIDO</span>"

            :

            "<span class='badge bg-danger'>INCUMPLIDO</span>",

        estadoFurgon == "CUMPLIDO"

            ?

            "<span class='badge bg-success'>CUMPLIDO</span>"

            :

            "<span class='badge bg-danger'>INCUMPLIDO</span>",

        `
        <button
            class="btn btn-warning btn-sm"
            title="Editar">

            <i class="bi bi-pencil"></i>

        </button>

        <button
            class="btn btn-danger btn-sm"
            onclick="eliminarViaje(${viaje.id})"
            title="Eliminar">

            <i class="bi bi-trash"></i>

        </button>
        `

    ]).draw(false);

}


/*=========================================================
=                    DASHBOARD
=========================================================*/

function actualizarDashboard() {

    const tabla =
        $("#tblViajes").DataTable();


    /*=====================================================
    =            SOLO FILAS FILTRADAS
    =====================================================*/

    const filasFiltradas =
        tabla.rows({
            search: "applied"
        });


    /*=====================================================
    =            TOTAL DE VIAJES
    =====================================================*/

    const total =
        filasFiltradas.count();


    let odtCumplidos = 0;

    let odtIncumplidos = 0;

    let furgonCumplidos = 0;

    let furgonIncumplidos = 0;


    /*=====================================================
    =            RECORRER FILAS FILTRADAS
    =====================================================*/

    filasFiltradas.every(function () {

        const fila =
            this.data();


        /*=================================================
        =            ESTADO ODT
        =================================================*/

        const estadoODT =
            $("<div>")
                .html(fila[12])
                .text()
                .trim()
                .toUpperCase();


        if (
            estadoODT === "CUMPLIDO"
        ) {

            odtCumplidos++;

        }

        else if (
            estadoODT === "INCUMPLIDO"
        ) {

            odtIncumplidos++;

        }


        /*=================================================
        =            ESTADO FURGON
        =================================================*/

        const estadoFurgon =
            $("<div>")
                .html(fila[13])
                .text()
                .trim()
                .toUpperCase();


        if (
            estadoFurgon === "CUMPLIDO"
        ) {

            furgonCumplidos++;

        }

        else if (
            estadoFurgon === "INCUMPLIDO"
        ) {

            furgonIncumplidos++;

        }

    });


    /*=====================================================
    =            ACTUALIZAR CARDS
    =====================================================*/

    $("#lblTotalViajes")
        .text(total);

    $("#lblODTCumplidos")
        .text(odtCumplidos);

    $("#lblODTIncumplidos")
        .text(odtIncumplidos);

    $("#lblFurgonCumplidos")
        .text(furgonCumplidos);

    $("#lblFurgonIncumplidos")
        .text(furgonIncumplidos);


    /*=====================================================
    =            PORCENTAJE ODT
    =====================================================*/

    let porcentajeODT = 0;

    const totalODT =
        odtCumplidos +
        odtIncumplidos;


    if (totalODT > 0) {

        porcentajeODT =
            (
                odtCumplidos /
                totalODT
            ) * 100;

    }


    /*=====================================================
    =            PORCENTAJE FURGON
    =====================================================*/

    let porcentajeFurgon = 0;

    const totalFurgon =
        furgonCumplidos +
        furgonIncumplidos;


    if (totalFurgon > 0) {

        porcentajeFurgon =
            (
                furgonCumplidos /
                totalFurgon
            ) * 100;

    }


    /*=====================================================
    =            MOSTRAR PORCENTAJES
    =====================================================*/

    $("#lblPorcentajeODT")
        .text(
            porcentajeODT.toFixed(2) +
            "%"
        );


    $("#lblPorcentajeFurgon")
        .text(
            porcentajeFurgon.toFixed(2) +
            "%"
        );


    /*=====================================================
    =            TOTAL REGISTROS
    =====================================================*/

    $("#lblRegistros")
        .text(total);

}


/*=========================================================
=            CARGAR VIAJES
=========================================================*/

function cargarViajes() {

    $.ajax({

        url: "/viajes/lista",

        type: "GET",

        dataType: "json",

        success:
            function (viajes) {

                const tabla =
                    $("#tblViajes").DataTable();


                /*=========================================
                =            LIMPIAR TABLA
                =========================================*/

                tabla.clear();


                /*=========================================
                =            AGREGAR VIAJES
                =========================================*/

                viajes.forEach(
                    function (viaje) {

                        agregarFila(viaje);

                    }
                );


                /*=========================================
                =            APLICAR FILTROS
                =========================================*/

                tabla.draw();


                /*=========================================
                =            DASHBOARD
                =========================================*/

                actualizarDashboard();

            },

        error:
            function (xhr) {

                console.log(
                    xhr.responseText
                );

            }

    });

}


/*=========================================================
=            ELIMINAR VIAJE
=========================================================*/

function eliminarViaje(id) {

    if (
        !confirm("¿Eliminar viaje?")
    ) {

        return;

    }


    $.ajax({

        url:
            "/viajes/eliminar/" +
            id,

        type: "DELETE",

        success:
            function () {

                cargarViajes();

            },

        error:
            function (xhr) {

                console.error(
                    xhr.responseText
                );

                alert(
                    "No se pudo eliminar el viaje."
                );

            }

    });

}


/* =========================================================
 * REPORTE PDF - AUDITORÍA DE VIAJES
 * =========================================================
 *
 * REQUISITOS:
 * - jsPDF
 * - jsPDF-AutoTable
 *
 * BOTÓN:
 * #btnExportarPDF
 *
 * onclick:
 * exportarAuditoriaPDF();
 *
 * ========================================================= */


/* =========================================================
 * CONFIGURACIÓN
 * ========================================================= */

const PDF_VIAJES_CONFIG = {

    nombreArchivo: "Reporte_Auditoria_Viajes.pdf",

    titulo: "REPORTE DE AUDITORÍA DE VIAJES",

    subtitulo:
        "Registro, monitoreo y análisis del cumplimiento de tiempos de viaje.",

    margen: 12,

    altoEncabezado: 28,

    altoPie: 10

};


/* =========================================================
 * FUNCIÓN PÚBLICA
 * ========================================================= */

window.exportarAuditoriaPDF = function () {

    try {

        /* -------------------------------------------------
         * VALIDAR LIBRERÍAS
         * ------------------------------------------------- */

        if (
            typeof window.jspdf === "undefined" ||
            typeof window.jspdf.jsPDF !== "function"
        ) {

            console.error(
                "jsPDF no está cargado correctamente."
            );

            alert(
                "No se pudo generar el PDF porque jsPDF no está cargado."
            );

            return;
        }


        if (
            !window.jspdf.jsPDF.API ||
            typeof window.jspdf.jsPDF.API.autoTable !== "function"
        ) {

            console.error(
                "jsPDF AutoTable no está cargado."
            );

            alert(
                "No se pudo generar el PDF porque AutoTable no está cargado."
            );

            return;
        }


        /* -------------------------------------------------
         * CREAR DOCUMENTO
         * ------------------------------------------------- */

        const doc =
            new window.jspdf.jsPDF({

                orientation: "landscape",

                unit: "mm",

                format: "a4",

                compress: true

            });


        /* -------------------------------------------------
         * OBTENER DATOS FILTRADOS
         * ------------------------------------------------- */

        const datos =
            obtenerDatosViajesPDF();


        if (
            !datos ||
            datos.length === 0
        ) {

            alert(
                "No existen viajes para generar el reporte con los filtros actuales."
            );

            return;
        }


        /* -------------------------------------------------
         * ESTADÍSTICAS
         * ------------------------------------------------- */

        const estadisticas =
            calcularEstadisticasPDF(
                datos
            );


        /* -------------------------------------------------
         * FILTROS
         * ------------------------------------------------- */

        const filtros =
            obtenerFiltrosPDF();


        /* -------------------------------------------------
         * PÁGINA 1
         * ------------------------------------------------- */

        dibujarPaginaResumenPDF(
            doc,
            estadisticas,
            filtros
        );


        /* -------------------------------------------------
         * PÁGINA 2
         * ------------------------------------------------- */

        doc.addPage();

        dibujarPaginaAnalisisPDF(
            doc,
            estadisticas
        );


        /* -------------------------------------------------
         * PÁGINA 3+
         * ------------------------------------------------- */

        doc.addPage();

        dibujarDetalleViajesPDF(
            doc,
            datos
        );


        /* -------------------------------------------------
         * PIE
         * ------------------------------------------------- */

        agregarPiePaginasPDF(
            doc
        );


        /* -------------------------------------------------
         * GUARDAR
         * ------------------------------------------------- */

        doc.save(
            PDF_VIAJES_CONFIG.nombreArchivo
        );


        console.log(
            "PDF generado correctamente."
        );


    } catch (error) {

        console.error(
            "Error generando PDF:",
            error
        );

        alert(
            "Ocurrió un error al generar el PDF. Revisa la consola."
        );

    }

};


/* =========================================================
 * OBTENER DATOS DE DATATABLE
 * ========================================================= */

function obtenerDatosViajesPDF() {

    if (
        typeof $ === "undefined" ||
        !$.fn ||
        !$.fn.DataTable ||
        !$.fn.DataTable.isDataTable("#tblViajes")
    ) {

        console.error(
            "No se encontró la DataTable #tblViajes."
        );

        return [];

    }


    const tabla =
        $("#tblViajes").DataTable();


    const filas =
        tabla.rows({
            search: "applied"
        }).data();


    const resultado = [];


    filas.each(function (fila) {

        if (
            !fila
        ) {

            return;

        }


        /*
         * DataTables puede devolver arrays u objetos.
         * Este reporte está preparado para el formato
         * actual de columnas.
         */

        if (
            !Array.isArray(fila)
        ) {

            return;

        }


        resultado.push({

            numero:
                obtenerTextoPDF(
                    fila[0]
                ),

            fecha:
                obtenerTextoPDF(
                    fila[1]
                ),

            conductor:
                obtenerTextoPDF(
                    fila[2]
                ),

            placa:
                obtenerTextoPDF(
                    fila[3]
                ),

            furgon:
                obtenerTextoPDF(
                    fila[4]
                ),

            origen:
                obtenerTextoPDF(
                    fila[5]
                ),

            destino:
                obtenerTextoPDF(
                    fila[6]
                ),

            salida:
                obtenerTextoPDF(
                    fila[7]
                ),

            llegada:
                obtenerTextoPDF(
                    fila[8]
                ),

            tiempoReal:
                obtenerTextoPDF(
                    fila[9]
                ),

            tiempoMaximo:
                obtenerTextoPDF(
                    fila[10]
                ),

            tiempoExcedido:
                obtenerTextoPDF(
                    fila[11]
                ),

            estadoODT:
                obtenerTextoPDF(
                    fila[12]
                ).toUpperCase(),

            estadoFurgon:
                obtenerTextoPDF(
                    fila[13]
                ).toUpperCase()

        });

    });


    return resultado;

}


/* =========================================================
 * LIMPIAR TEXTO
 * ========================================================= */

function obtenerTextoPDF(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }


    /*
     * AutoTable puede entregar data.cell.text
     * como ARRAY.
     */

    if (
        Array.isArray(valor)
    ) {

        valor =
            valor.join(" ");

    }


    const textoOriginal =
        String(valor);


    /*
     * Eliminar HTML
     */

    const temporal =
        $("<div>")
            .html(textoOriginal);


    return temporal
        .text()
        .replace(/\s+/g, " ")
        .trim();

}


/* =========================================================
 * OBTENER FILTROS ACTUALES
 * ========================================================= */

function obtenerFiltrosPDF() {

    return {

        fechaInicio:
            $("#txtFechaInicio").val() ||
            "",

        fechaFin:
            $("#txtFechaFin").val() ||
            "",

        ruta:
            obtenerTextoPDF(
                $("#cmbRuta option:selected").text()
            ) ||
            "Todas las rutas",

        conductor:
            obtenerTextoPDF(
                $("#cmbConductor option:selected").text()
            ) ||
            "Todos los conductores",

        estadoODT:
            obtenerTextoPDF(
                $("#cmbEstadoODT option:selected").text()
            ) ||
            "Todos",

        estadoFurgon:
            obtenerTextoPDF(
                $("#cmbEstadoFurgon option:selected").text()
            ) ||
            "Todos"

    };

}


/* =========================================================
 * ESTADÍSTICAS
 * ========================================================= */

function calcularEstadisticasPDF(datos) {

    const total =
        datos.length;


    let odtCumplidos = 0;

    let odtIncumplidos = 0;

    let furgonCumplidos = 0;

    let furgonIncumplidos = 0;

    let minutosExcedidosTotal = 0;

    let minutosExcedidosMax = 0;

    let viajesConExceso = 0;

    /*
     * NUEVO:
     * Total de minutos reales de recorrido.
     */

    let minutosRecorridoTotal = 0;


    const rutas = {};

    const furgones = {};

    const conductores = {};


    datos.forEach(function (viaje) {

        /* ---------------------------------------------
         * TIEMPO TOTAL DE RECORRIDO
         * --------------------------------------------- */

        const minutosRecorrido =
            extraerMinutosPDF(
                viaje.tiempoReal
            );


        minutosRecorridoTotal +=
            minutosRecorrido;


        /* ---------------------------------------------
         * ODT
         * --------------------------------------------- */

        if (
            viaje.estadoODT === "CUMPLIDO"
        ) {

            odtCumplidos++;

        }

        else if (
            viaje.estadoODT === "INCUMPLIDO"
        ) {

            odtIncumplidos++;

        }


        /* ---------------------------------------------
         * FURGÓN
         * --------------------------------------------- */

        if (
            viaje.estadoFurgon === "CUMPLIDO"
        ) {

            furgonCumplidos++;

        }

        else if (
            viaje.estadoFurgon === "INCUMPLIDO"
        ) {

            furgonIncumplidos++;

        }


        /* ---------------------------------------------
         * EXCESO
         * --------------------------------------------- */

        const excesoMinutos =
            extraerMinutosPDF(
                viaje.tiempoExcedido
            );


        if (
            excesoMinutos > 0
        ) {

            viajesConExceso++;


            minutosExcedidosTotal +=
                excesoMinutos;


            if (
                excesoMinutos >
                minutosExcedidosMax
            ) {

                minutosExcedidosMax =
                    excesoMinutos;

            }

        }


        /* ---------------------------------------------
         * RUTA
         * --------------------------------------------- */

        const nombreRuta =
            viaje.destino ||
            "Sin destino";


        if (
            !rutas[nombreRuta]
        ) {

            rutas[nombreRuta] = {

                total: 0,

                cumplidos: 0,

                incumplidos: 0,

                exceso: 0

            };

        }


        rutas[nombreRuta].total++;


        if (
            viaje.estadoODT === "CUMPLIDO"
        ) {

            rutas[nombreRuta].cumplidos++;

        }

        else if (
            viaje.estadoODT === "INCUMPLIDO"
        ) {

            rutas[nombreRuta].incumplidos++;

        }


        rutas[nombreRuta].exceso +=
            excesoMinutos;


        /* ---------------------------------------------
         * FURGÓN
         * --------------------------------------------- */

        const nombreFurgon =
            viaje.furgon ||
            "Sin furgón";


        if (
            !furgones[nombreFurgon]
        ) {

            furgones[nombreFurgon] = {

                total: 0,

                cumplidos: 0,

                incumplidos: 0

            };

        }


        furgones[nombreFurgon].total++;


        if (
            viaje.estadoFurgon === "CUMPLIDO"
        ) {

            furgones[nombreFurgon].cumplidos++;

        }

        else if (
            viaje.estadoFurgon === "INCUMPLIDO"
        ) {

            furgones[nombreFurgon].incumplidos++;

        }


        /* ---------------------------------------------
         * CONDUCTOR
         * --------------------------------------------- */

        const nombreConductor =
            viaje.conductor ||
            "Sin conductor";


        if (
            !conductores[nombreConductor]
        ) {

            conductores[nombreConductor] = {

                total: 0,

                cumplidos: 0,

                incumplidos: 0

            };

        }


        conductores[nombreConductor].total++;


        if (
            viaje.estadoODT === "CUMPLIDO"
        ) {

            conductores[nombreConductor].cumplidos++;

        }

        else if (
            viaje.estadoODT === "INCUMPLIDO"
        ) {

            conductores[nombreConductor].incumplidos++;

        }

    });


    const totalODT =
        odtCumplidos +
        odtIncumplidos;


    const totalFurgon =
        furgonCumplidos +
        furgonIncumplidos;


    const porcentajeODT =
        totalODT > 0
            ? (
                odtCumplidos /
                totalODT
            ) * 100
            : 0;


    const porcentajeFurgon =
        totalFurgon > 0
            ? (
                furgonCumplidos /
                totalFurgon
            ) * 100
            : 0;


    const promedioExceso =
        viajesConExceso > 0
            ? (
                minutosExcedidosTotal /
                viajesConExceso
            )
            : 0;


    const rutasArray =
        Object.keys(rutas)
            .map(function (nombre) {

                return {

                    nombre: nombre,

                    total:
                        rutas[nombre].total,

                    cumplidos:
                        rutas[nombre].cumplidos,

                    incumplidos:
                        rutas[nombre].incumplidos,

                    exceso:
                        rutas[nombre].exceso

                };

            })
            .sort(function (a, b) {

                return (
                    b.total -
                    a.total
                );

            });


    const furgonesArray =
        Object.keys(furgones)
            .map(function (nombre) {

                return {

                    nombre: nombre,

                    total:
                        furgones[nombre].total,

                    cumplidos:
                        furgones[nombre].cumplidos,

                    incumplidos:
                        furgones[nombre].incumplidos

                };

            })
            .sort(function (a, b) {

                return (
                    b.total -
                    a.total
                );

            });


    const conductoresArray =
        Object.keys(conductores)
            .map(function (nombre) {

                return {

                    nombre: nombre,

                    total:
                        conductores[nombre].total,

                    cumplidos:
                        conductores[nombre].cumplidos,

                    incumplidos:
                        conductores[nombre].incumplidos

                };

            })
            .sort(function (a, b) {

                return (
                    b.incumplidos -
                    a.incumplidos
                );

            });


    return {

        total,

        odtCumplidos,

        odtIncumplidos,

        furgonCumplidos,

        furgonIncumplidos,

        porcentajeODT,

        porcentajeFurgon,

        minutosRecorridoTotal,

        minutosExcedidosTotal,

        minutosExcedidosMax,

        promedioExceso,

        viajesConExceso,

        rutas:
            rutasArray,

        furgones:
            furgonesArray,

        conductores:
            conductoresArray

    };

}


/* =========================================================
 * EXTRAER MINUTOS
 * =========================================================
 *
 * Soporta formatos como:
 *
 *  - 90 min
 *  - 1 h 30 min
 *  - 1h 30m
 *  - 1 hora 30 minutos
 *  - 01:30
 *  - 01:30:00
 *  - 1.5 h
 *  - 90
 *
 * ========================================================= */

function extraerMinutosPDF(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return 0;

    }


    const texto =
        obtenerTextoPDF(valor)
            .toLowerCase()
            .trim();


    if (
        texto === ""
    ) {

        return 0;

    }


    /*
     * -----------------------------------------------------
     * FORMATO HH:MM:SS
     * -----------------------------------------------------
     */

    let coincidencia =
        texto.match(
            /^(\d{1,3}):(\d{1,2}):(\d{1,2})$/
        );


    if (
        coincidencia
    ) {

        const horas =
            parseInt(
                coincidencia[1],
                10
            ) || 0;


        const minutos =
            parseInt(
                coincidencia[2],
                10
            ) || 0;


        const segundos =
            parseInt(
                coincidencia[3],
                10
            ) || 0;


        return (
            horas * 60 +
            minutos +
            segundos / 60
        );

    }


    /*
     * -----------------------------------------------------
     * FORMATO HH:MM
     * -----------------------------------------------------
     */

    coincidencia =
        texto.match(
            /^(\d{1,3}):(\d{1,2})$/
        );


    if (
        coincidencia
    ) {

        const horas =
            parseInt(
                coincidencia[1],
                10
            ) || 0;


        const minutos =
            parseInt(
                coincidencia[2],
                10
            ) || 0;


        return (
            horas * 60 +
            minutos
        );

    }


    /*
     * -----------------------------------------------------
     * FORMATO HORAS + MINUTOS
     *
     * Ej:
     * 1 h 30 min
     * 2 horas 15 minutos
     * 1h 30m
     * -----------------------------------------------------
     */

    const tieneHoras =
        texto.match(
            /(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)/
        );


    const tieneMinutos =
        texto.match(
            /(\d+(?:[.,]\d+)?)\s*(?:m|min|mins|minuto|minutos)/
        );


    if (
        tieneHoras ||
        tieneMinutos
    ) {

        let minutosTotales = 0;


        if (
            tieneHoras
        ) {

            const horas =
                parseFloat(
                    tieneHoras[1]
                        .replace(",", ".")
                ) || 0;


            minutosTotales +=
                horas * 60;

        }


        if (
            tieneMinutos
        ) {

            minutosTotales +=
                parseFloat(
                    tieneMinutos[1]
                        .replace(",", ".")
                ) || 0;

        }


        return minutosTotales;

    }


    /*
     * -----------------------------------------------------
     * FORMATO SOLO HORAS
     *
     * Ej:
     * 1.5 h
     * -----------------------------------------------------
     */

    coincidencia =
        texto.match(
            /^(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)$/
        );


    if (
        coincidencia
    ) {

        return (
            (
                parseFloat(
                    coincidencia[1]
                        .replace(",", ".")
                ) || 0
            ) * 60
        );

    }


    /*
     * -----------------------------------------------------
     * FORMATO SOLO MINUTOS
     *
     * Ej:
     * 90 min
     * 45 minutos
     * -----------------------------------------------------
     */

    coincidencia =
        texto.match(
            /^(\d+(?:[.,]\d+)?)\s*(?:m|min|mins|minuto|minutos)$/
        );


    if (
        coincidencia
    ) {

        return (
            parseFloat(
                coincidencia[1]
                    .replace(",", ".")
            ) || 0
        );

    }


    /*
     * -----------------------------------------------------
     * NÚMERO PURO
     *
     * Se interpreta como minutos para mantener
     * compatibilidad con el funcionamiento anterior.
     * -----------------------------------------------------
     */

    coincidencia =
        texto.match(
            /^(\d+(?:[.,]\d+)?)$/
        );


    if (
        coincidencia
    ) {

        return (
            parseFloat(
                coincidencia[1]
                    .replace(",", ".")
            ) || 0
        );

    }


    /*
     * -----------------------------------------------------
     * ÚLTIMO RECURSO
     *
     * Busca un número dentro del texto.
     * -----------------------------------------------------
     */

    coincidencia =
        texto.match(
            /(\d+(?:[.,]\d+)?)/
        );


    if (
        !coincidencia
    ) {

        return 0;

    }


    return (
        parseFloat(
            coincidencia[1]
                .replace(",", ".")
        ) || 0
    );

}


/* =========================================================
 * FORMATEAR TIEMPO
 * =========================================================
 *
 * Convierte minutos a:
 *
 *  - 45 min
 *  - 1 h 20 min
 *  - 12 h 35 min
 *
 * ========================================================= */

function formatearDuracionPDF(minutos) {

    const totalMinutos =
        Math.max(
            0,
            Math.round(
                Number(minutos) || 0
            )
        );


    const horas =
        Math.floor(
            totalMinutos / 60
        );


    const minutosRestantes =
        totalMinutos % 60;


    if (
        horas === 0
    ) {

        return (
            minutosRestantes +
            " min"
        );

    }


    if (
        minutosRestantes === 0
    ) {

        return (
            horas +
            (
                horas === 1
                    ? " h"
                    : " h"
            )
        );

    }


    return (
        horas +
        " h " +
        minutosRestantes +
        " min"
    );

}


/* =========================================================
 * FORMATEAR DURACIÓN COMPACTA
 * ========================================================= */

function formatearDuracionCompactaPDF(minutos) {

    const totalMinutos =
        Math.max(
            0,
            Math.round(
                Number(minutos) || 0
            )
        );


    const horas =
        Math.floor(
            totalMinutos / 60
        );


    const minutosRestantes =
        totalMinutos % 60;


    return (
        String(horas).padStart(2, "0") +
        ":" +
        String(minutosRestantes).padStart(2, "0")
    );

}


/* =========================================================
 * ENCABEZADO
 * ========================================================= */

function dibujarEncabezadoPDF(
    doc,
    titulo,
    subtitulo
) {

    const ancho =
        doc.internal.pageSize.getWidth();


    /* ---------------------------------------------
     * BARRA
     * --------------------------------------------- */

    doc.setFillColor(
        25,
        55,
        90
    );


    doc.rect(
        0,
        0,
        ancho,
        22,
        "F"
    );


    /* ---------------------------------------------
     * TÍTULO
     * --------------------------------------------- */

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
        16
    );


    doc.text(
        titulo,
        PDF_VIAJES_CONFIG.margen,
        10
    );


    /* ---------------------------------------------
     * SUBTÍTULO
     * --------------------------------------------- */

    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        8
    );


    doc.text(
        subtitulo,
        PDF_VIAJES_CONFIG.margen,
        16
    );


    /* ---------------------------------------------
     * FECHA
     * --------------------------------------------- */

    const ahora =
        new Date();


    const fecha =
        ahora.toLocaleDateString(
            "es-ES"
        );


    const hora =
        ahora.toLocaleTimeString(
            "es-ES",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    doc.text(
        "Generado: " +
        fecha +
        " " +
        hora,
        ancho -
        PDF_VIAJES_CONFIG.margen,
        10,
        {
            align: "right"
        }
    );


    doc.setTextColor(
        40,
        40,
        40
    );

}


/* =========================================================
 * PÁGINA 1 - RESUMEN
 * ========================================================= */

function dibujarPaginaResumenPDF(
    doc,
    estadisticas,
    filtros
) {

    dibujarEncabezadoPDF(
        doc,
        PDF_VIAJES_CONFIG.titulo,
        PDF_VIAJES_CONFIG.subtitulo
    );


    let y = 32;


    /* ---------------------------------------------
     * TÍTULO FILTROS
     * --------------------------------------------- */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        10
    );


    doc.setTextColor(
        25,
        55,
        90
    );


    doc.text(
        "Resumen del período",
        PDF_VIAJES_CONFIG.margen,
        y
    );


    y += 5;


    /* ---------------------------------------------
     * BLOQUE DE FILTROS
     * --------------------------------------------- */

    const anchoPagina =
        doc.internal.pageSize.getWidth();


    const anchoDisponible =
        anchoPagina -
        (
            PDF_VIAJES_CONFIG.margen * 2
        );


    const separacionFiltro = 4;


    const anchoFiltro =
        (
            anchoDisponible -
            separacionFiltro
        ) / 2;


    const filtrosPDF = [

        {
            etiqueta: "Desde",
            valor:
                filtros.fechaInicio ||
                "Sin fecha"
        },

        {
            etiqueta: "Hasta",
            valor:
                filtros.fechaFin ||
                "Sin fecha"
        },

        {
            etiqueta: "Ruta",
            valor:
                filtros.ruta ||
                "Todas las rutas"
        },

        {
            etiqueta: "Conductor",
            valor:
                filtros.conductor ||
                "Todos los conductores"
        },

        {
            etiqueta: "Estado ODT",
            valor:
                filtros.estadoODT ||
                "Todos"
        },

        {
            etiqueta: "Estado Furgón",
            valor:
                filtros.estadoFurgon ||
                "Todos"

        }

    ];


    const altoFiltro = 12;


    filtrosPDF.forEach(
        function (filtro, indice) {

            const fila =
                Math.floor(
                    indice / 2
                );


            const columna =
                indice % 2;


            const x =
                PDF_VIAJES_CONFIG.margen +
                (
                    columna *
                    (
                        anchoFiltro +
                        separacionFiltro
                    )
                );


            const filtroY =
                y +
                (
                    fila *
                    (
                        altoFiltro +
                        3
                    )
                );


            doc.setFillColor(
                247,
                249,
                252
            );


            doc.roundedRect(
                x,
                filtroY,
                anchoFiltro,
                altoFiltro,
                2,
                2,
                "F"
            );


            doc.setLineWidth(
                0.35
            );


            doc.setDrawColor(
                225,
                228,
                232
            );


            doc.roundedRect(
                x,
                filtroY,
                anchoFiltro,
                altoFiltro,
                2,
                2,
                "S"
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(
                6.5
            );


            doc.setTextColor(
                90,
                95,
                100
            );


            doc.text(
                filtro.etiqueta + ":",
                x + 3,
                filtroY + 4.5
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(
                7
            );


            doc.setTextColor(
                45,
                50,
                55
            );


            const valorFiltro =
                doc.splitTextToSize(
                    String(
                        filtro.valor
                    ),
                    anchoFiltro - 28
                );


            doc.text(
                valorFiltro.slice(0, 2),
                x + 27,
                filtroY + 4.5
            );

        }
    );


    y +=
        (
            3 *
            (
                altoFiltro +
                3
            )
        ) +
        4;


    /* ---------------------------------------------
     * TARJETAS
     * --------------------------------------------- */

    const anchoTarjeta =
        (
            anchoPagina -
            (
                PDF_VIAJES_CONFIG.margen * 2
            ) -
            12
        ) / 4;


    const altoTarjeta =
        20;


    const tarjetas = [

        {
            titulo: "Total viajes",
            valor:
                estadisticas.total
        },

        {
            titulo: "ODT cumplidos",
            valor:
                estadisticas.odtCumplidos
        },

        {
            titulo: "ODT incumplidos",
            valor:
                estadisticas.odtIncumplidos
        },

        {
            titulo: "Cumplimiento ODT",
            valor:
                formatearPorcentajePDF(
                    estadisticas.porcentajeODT
                )
        },

        {
            titulo: "Furgón cumplidos",
            valor:
                estadisticas.furgonCumplidos
        },

        {
            titulo: "Furgón incumplidos",
            valor:
                estadisticas.furgonIncumplidos
        },

        {
            titulo: "Cumplimiento Furgón",
            valor:
                formatearPorcentajePDF(
                    estadisticas.porcentajeFurgon
                )
        },

        {
            titulo: "Viajes con exceso",
            valor:
                estadisticas.viajesConExceso
        }

    ];


    tarjetas.forEach(
        function (tarjeta, indice) {

            const fila =
                Math.floor(
                    indice / 4
                );


            const columna =
                indice % 4;


            const x =
                PDF_VIAJES_CONFIG.margen +
                (
                    columna *
                    (
                        anchoTarjeta +
                        4
                    )
                );


            const tarjetaY =
                y +
                (
                    fila *
                    (
                        altoTarjeta +
                        4
                    )
                );


            doc.setFillColor(
                245,
                247,
                250
            );


            doc.roundedRect(
                x,
                tarjetaY,
                anchoTarjeta,
                altoTarjeta,
                2,
                2,
                "F"
            );


            doc.setLineWidth(
                0.35
            );


            doc.setDrawColor(
                220,
                224,
                230
            );


            doc.roundedRect(
                x,
                tarjetaY,
                anchoTarjeta,
                altoTarjeta,
                2,
                2,
                "S"
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(
                7
            );


            doc.setTextColor(
                90,
                95,
                100
            );


            doc.text(
                tarjeta.titulo,
                x + 4,
                tarjetaY + 6
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(
                14
            );


            doc.setTextColor(
                25,
                55,
                90
            );


            doc.text(
                String(
                    tarjeta.valor
                ),
                x + 4,
                tarjetaY + 16
            );

        }
    );


    y +=
        (
            2 *
            (
                altoTarjeta +
                4
            )
        ) +
        4;


    /* ---------------------------------------------
     * GRÁFICOS
     *
     * SE COMPACTA LA ALTURA PARA RESERVAR
     * ESPACIO REAL AL PIE DE PÁGINA.
     * --------------------------------------------- */

    const anchoGrafico =
        (
            anchoPagina -
            (
                PDF_VIAJES_CONFIG.margen * 2
            ) -
            8
        ) / 2;


    const altoGrafico =
        40;


    dibujarGraficoDonutPDF(
        doc,
        {

            x:
                PDF_VIAJES_CONFIG.margen,

            y:
                y,

            ancho:
                anchoGrafico,

            alto:
                altoGrafico,

            titulo:
                "Cumplimiento ODT",

            cumplidos:
                estadisticas.odtCumplidos,

            incumplidos:
                estadisticas.odtIncumplidos

        }
    );


    dibujarGraficoDonutPDF(
        doc,
        {

            x:
                PDF_VIAJES_CONFIG.margen +
                anchoGrafico +
                8,

            y:
                y,

            ancho:
                anchoGrafico,

            alto:
                altoGrafico,

            titulo:
                "Cumplimiento Furgón",

            cumplidos:
                estadisticas.furgonCumplidos,

            incumplidos:
                estadisticas.furgonIncumplidos

        }
    );


    /*
     * Espacio controlado.
     */

    y += 45;


    /* ---------------------------------------------
     * CONCLUSIÓN
     *
     * CORRECCIÓN PRINCIPAL:
     * La conclusión queda completamente por encima
     * del área reservada para el pie.
     * --------------------------------------------- */

    const altoConclusion =
        13;


    const xConclusion =
        PDF_VIAJES_CONFIG.margen;


    const anchoConclusion =
        anchoPagina -
        (
            PDF_VIAJES_CONFIG.margen * 2
        );


    /*
     * Si por cualquier cambio futuro y quedara
     * demasiado abajo, se fuerza una posición segura.
     */

    const altoPagina =
        doc.internal.pageSize.getHeight();


    const limiteSuperiorConclusion =
        altoPagina -
        PDF_VIAJES_CONFIG.altoPie -
        altoConclusion -
        3;


    if (
        y > limiteSuperiorConclusion
    ) {

        y =
            limiteSuperiorConclusion;

    }


    doc.setFillColor(
        247,
        249,
        252
    );


    doc.roundedRect(
        xConclusion,
        y,
        anchoConclusion,
        altoConclusion,
        2,
        2,
        "F"
    );


    doc.setLineWidth(
        0.35
    );


    doc.setDrawColor(
        225,
        228,
        232
    );


    doc.roundedRect(
        xConclusion,
        y,
        anchoConclusion,
        altoConclusion,
        2,
        2,
        "S"
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        8
    );


    doc.setTextColor(
        25,
        55,
        90
    );


    doc.text(
        "Conclusión ejecutiva",
        xConclusion + 5,
        y + 5
    );


    const conclusion =
        construirConclusionPDF(
            estadisticas
        );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        5.9
    );


    doc.setTextColor(
        65,
        70,
        75
    );


    const anchoTextoConclusion =
        anchoConclusion - 10;


    const lineasConclusion =
        doc.splitTextToSize(
            conclusion,
            anchoTextoConclusion
        );


    /*
     * Solo una línea en esta zona compacta.
     * La conclusión ya contiene la información
     * esencial de tiempos.
     */

    doc.text(
        lineasConclusion.slice(0, 1),
        xConclusion + 5,
        y + 9.5
    );


    doc.setLineWidth(
        0.35
    );

}


/* =========================================================
 * TEXTO DE FILTROS
 *
 * Se conserva por compatibilidad.
 * ========================================================= */

function construirTextoFiltrosPDF(
    filtros
) {

    const desde =
        filtros.fechaInicio ||
        "Sin fecha";


    const hasta =
        filtros.fechaFin ||
        "Sin fecha";


    return (
        "Desde: " +
        desde +
        " | Hasta: " +
        hasta +
        " | Ruta: " +
        filtros.ruta +
        " | Conductor: " +
        filtros.conductor +
        " | Estado ODT: " +
        filtros.estadoODT +
        " | Estado Furgón: " +
        filtros.estadoFurgon
    );

}


/* =========================================================
 * CONCLUSIÓN
 * ========================================================= */

function construirConclusionPDF(
    estadisticas
) {

    let resultado = "";


    if (
        estadisticas.total === 0
    ) {

        return (
            "No existen registros para el período seleccionado."
        );

    }


    if (
        estadisticas.porcentajeODT >= 90
    ) {

        resultado +=
            "El cumplimiento ODT presenta un desempeño favorable con " +
            formatearPorcentajePDF(
                estadisticas.porcentajeODT
            ) +
            " de cumplimiento. ";

    }

    else if (
        estadisticas.porcentajeODT >= 75
    ) {

        resultado +=
            "El cumplimiento ODT presenta un desempeño intermedio con " +
            formatearPorcentajePDF(
                estadisticas.porcentajeODT
            ) +
            " de cumplimiento. ";

    }

    else {

        resultado +=
            "El cumplimiento ODT requiere atención, con " +
            formatearPorcentajePDF(
                estadisticas.porcentajeODT
            ) +
            " de cumplimiento. ";

    }


    resultado +=
        "En el período se realizaron " +
        formatearDuracionPDF(
            estadisticas.minutosRecorridoTotal
        ) +
        " de recorrido total";


    if (
        estadisticas.minutosExcedidosTotal > 0
    ) {

        resultado +=
            ", acumulando " +
            formatearDuracionPDF(
                estadisticas.minutosExcedidosTotal
            ) +
            " de exceso de tiempo.";

    }

    else {

        resultado +=
            ", sin exceso de tiempo acumulado.";

    }


    return resultado;

}


/* =========================================================
 * GRÁFICO DONUT
 * ========================================================= */

function dibujarGraficoDonutPDF(
    doc,
    opciones
) {

    const x =
        opciones.x;


    const y =
        opciones.y;


    const ancho =
        opciones.ancho;


    const alto =
        opciones.alto;


    const total =
        (
            Number(opciones.cumplidos) || 0
        ) +
        (
            Number(opciones.incumplidos) || 0
        );


    /* ---------------------------------------------
     * CONTENEDOR
     * --------------------------------------------- */

    doc.setFillColor(
        250,
        250,
        251
    );


    doc.roundedRect(
        x,
        y,
        ancho,
        alto,
        2,
        2,
        "F"
    );


    doc.setLineWidth(
        0.35
    );


    doc.setDrawColor(
        225,
        228,
        232
    );


    doc.roundedRect(
        x,
        y,
        ancho,
        alto,
        2,
        2,
        "S"
    );


    /* ---------------------------------------------
     * TÍTULO
     * --------------------------------------------- */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        8
    );


    doc.setTextColor(
        35,
        40,
        45
    );


    doc.text(
        opciones.titulo,
        x + 6,
        y + 6
    );


    /* ---------------------------------------------
     * CÍRCULO
     * --------------------------------------------- */

    const centroX =
        x +
        ancho / 2;


    /*
     * Centro ligeramente más alto debido
     * a la reducción del contenedor.
     */

    const centroY =
        y +
        23;


    const radioExterior =
        9.5;


    const radioInterior =
        5.5;


    const porcentajeCumplimiento =
        total > 0
            ? (
                opciones.cumplidos /
                total
            )
            : 0;


    const anguloCumplido =
        porcentajeCumplimiento *
        Math.PI *
        2;


    /* ---------------------------------------------
     * ARCO CUMPLIDO
     * --------------------------------------------- */

    if (
        anguloCumplido > 0
    ) {

        dibujarArcoPDF(
            doc,
            centroX,
            centroY,
            radioExterior,
            -Math.PI / 2,
            -Math.PI / 2 +
            anguloCumplido,
            25,
            130,
            167
        );

    }


    /* ---------------------------------------------
     * ARCO INCUMPLIDO
     * --------------------------------------------- */

    if (
        anguloCumplido <
        Math.PI * 2
    ) {

        dibujarArcoPDF(
            doc,
            centroX,
            centroY,
            radioExterior,
            -Math.PI / 2 +
            anguloCumplido,
            -Math.PI / 2 +
            Math.PI * 2,
            220,
            75,
            75
        );

    }


    /* ---------------------------------------------
     * CENTRO DEL DONUT
     * --------------------------------------------- */

    doc.setFillColor(
        250,
        250,
        251
    );


    doc.circle(
        centroX,
        centroY,
        radioInterior,
        "F"
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        8
    );


    doc.setTextColor(
        25,
        55,
        90
    );


    doc.text(
        formatearPorcentajePDF(
            porcentajeCumplimiento * 100
        ),
        centroX,
        centroY + 2.7,
        {
            align: "center"
        }
    );


    /* ---------------------------------------------
     * LEYENDA
     * --------------------------------------------- */

    const leyendaY =
        y + 36;


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        6.2
    );


    doc.setTextColor(
        70,
        75,
        80
    );


    doc.text(
        "Cumplidos: " +
        opciones.cumplidos,
        x + 8,
        leyendaY
    );


    doc.text(
        "Incumplidos: " +
        opciones.incumplidos,
        x +
        ancho / 2,
        leyendaY
    );


    doc.setLineWidth(
        0.35
    );

}


/* =========================================================
 * DIBUJAR ARCO
 * ========================================================= */

function dibujarArcoPDF(
    doc,
    cx,
    cy,
    radio,
    inicio,
    fin,
    r,
    g,
    b
) {

    const pasos = 36;


    doc.setDrawColor(
        r,
        g,
        b
    );


    doc.setLineWidth(
        4
    );


    let anteriorX =
        cx +
        Math.cos(inicio) *
        radio;


    let anteriorY =
        cy +
        Math.sin(inicio) *
        radio;


    for (
        let i = 1;
        i <= pasos;
        i++
    ) {

        const angulo =
            inicio +
            (
                (
                    fin -
                    inicio
                ) *
                (
                    i /
                    pasos
                )
            );


        const actualX =
            cx +
            Math.cos(angulo) *
            radio;


        const actualY =
            cy +
            Math.sin(angulo) *
            radio;


        doc.line(
            anteriorX,
            anteriorY,
            actualX,
            actualY
        );


        anteriorX =
            actualX;


        anteriorY =
            actualY;

    }


    doc.setLineWidth(
        0.35
    );

}


/* =========================================================
 * PÁGINA 2 - ANÁLISIS OPERATIVO
 * ========================================================= */

function dibujarPaginaAnalisisPDF(
    doc,
    estadisticas
) {

    dibujarEncabezadoPDF(
        doc,
        "ANÁLISIS OPERATIVO",
        "Distribución de viajes, rutas, furgones y comportamiento de tiempos."
    );


    let y = 34;


    /* ---------------------------------------------
     * INDICADORES DE TIEMPO
     * --------------------------------------------- */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        10
    );


    doc.setTextColor(
        25,
        55,
        90
    );


    doc.text(
        "Indicadores de tiempo",
        PDF_VIAJES_CONFIG.margen,
        y
    );


    y += 6;


    const anchoPagina =
        doc.internal.pageSize.getWidth();


    const anchoCaja =
        (
            anchoPagina -
            (
                PDF_VIAJES_CONFIG.margen * 2
            ) -
            12
        ) / 4;


    /*
     * NUEVOS INDICADORES:
     *
     * 1. Tiempo total recorrido
     * 2. Exceso total
     *
     * Se sustituyen los valores de minutos
     * por formatos más legibles.
     */

    const indicadoresTiempo = [

        {
            titulo: "Viajes con exceso",
            valor:
                estadisticas.viajesConExceso
        },

        {
            titulo: "Recorrido total",
            valor:
                formatearDuracionPDF(
                    estadisticas.minutosRecorridoTotal
                )
        },

        {
            titulo: "Exceso total",
            valor:
                formatearDuracionPDF(
                    estadisticas.minutosExcedidosTotal
                )
        },

        {
            titulo: "Mayor exceso",
            valor:
                formatearDuracionPDF(
                    estadisticas.minutosExcedidosMax
                )
        }

    ];


    indicadoresTiempo.forEach(
        function (item, indice) {

            const x =
                PDF_VIAJES_CONFIG.margen +
                (
                    indice *
                    (
                        anchoCaja +
                        4
                    )
                );


            doc.setFillColor(
                246,
                248,
                250
            );


            doc.roundedRect(
                x,
                y,
                anchoCaja,
                20,
                2,
                2,
                "F"
            );


            doc.setLineWidth(
                0.35
            );


            doc.setDrawColor(
                220,
                224,
                230
            );


            doc.roundedRect(
                x,
                y,
                anchoCaja,
                20,
                2,
                2,
                "S"
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(
                7
            );


            doc.setTextColor(
                90,
                95,
                100
            );


            doc.text(
                item.titulo,
                x + 4,
                y + 7
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(
                11
            );


            doc.setTextColor(
                25,
                55,
                90
            );


            doc.text(
                String(
                    item.valor
                ),
                x + 4,
                y + 16
            );

        }
    );


    y += 28;


    /* ---------------------------------------------
     * TABLA DE RUTAS
     * --------------------------------------------- */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        10
    );


    doc.text(
        "Rendimiento por ruta",
        PDF_VIAJES_CONFIG.margen,
        y
    );


    y += 4;


    const rutas =
        estadisticas.rutas
            .slice(0, 8);


    doc.autoTable({

        startY: y,

        margin: {

            left:
                PDF_VIAJES_CONFIG.margen,

            right:
                PDF_VIAJES_CONFIG.margen

        },

        tableWidth:
            "auto",

        theme:
            "grid",

        head: [[

            "Ruta",

            "Viajes",

            "Cumplidos",

            "Incumplidos",

            "% Cumplimiento",

            "Exceso"

        ]],

        body:
            rutas.map(
                function (ruta) {

                    const porcentajeRuta =
                        ruta.total > 0
                            ? (
                                ruta.cumplidos /
                                ruta.total
                            ) *
                            100
                            : 0;


                    return [

                        ruta.nombre,

                        String(
                            ruta.total
                        ),

                        String(
                            ruta.cumplidos
                        ),

                        String(
                            ruta.incumplidos
                        ),

                        formatearPorcentajePDF(
                            porcentajeRuta
                        ),

                        formatearDuracionPDF(
                            ruta.exceso
                        )

                    ];

                }
            ),

        styles: {

            font:
                "helvetica",

            fontSize:
                7,

            cellPadding:
                2.2,

            overflow:
                "linebreak",

            valign:
                "middle"

        },

        headStyles: {

            fillColor: [
                25,
                55,
                90
            ],

            textColor: [
                255,
                255,
                255
            ],

            fontStyle:
                "bold",

            halign:
                "center"

        },

        columnStyles: {

            0: {
                cellWidth:
                    70
            },

            1: {
                cellWidth:
                    20,
                halign:
                    "center"
            },

            2: {
                cellWidth:
                    25,
                halign:
                    "center"
            },

            3: {
                cellWidth:
                    25,
                halign:
                    "center"
            },

            4: {
                cellWidth:
                    30,
                halign:
                    "center"
            },

            5: {
                cellWidth:
                    25,
                halign:
                    "center"
            }

        },

        didParseCell:
            function (data) {

                if (
                    data.section !==
                    "body"
                ) {

                    return;

                }


                if (
                    data.column.index === 4
                ) {

                    const valorRuta =
                        obtenerTextoPDF(
                            data.cell.text
                        );


                    const numeroRuta =
                        parseFloat(
                            valorRuta.replace(
                                "%",
                                ""
                            )
                        );


                    if (
                        numeroRuta >= 90
                    ) {

                        data.cell.styles.textColor =
                            [
                                25,
                                130,
                                75
                            ];

                    }

                    else if (
                        numeroRuta < 75
                    ) {

                        data.cell.styles.textColor =
                            [
                                190,
                                45,
                                45
                            ];

                    }

                }

            }

    });


    /* ---------------------------------------------
     * FURGONES
     * --------------------------------------------- */

    const finalY =
        doc.lastAutoTable
            ? doc.lastAutoTable.finalY + 8
            : y + 30;


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        10
    );


    doc.text(
        "Distribución por furgón",
        PDF_VIAJES_CONFIG.margen,
        finalY
    );


    const furgones =
        estadisticas.furgones;


    doc.autoTable({

        startY:
            finalY + 4,

        margin: {

            left:
                PDF_VIAJES_CONFIG.margen,

            right:
                PDF_VIAJES_CONFIG.margen

        },

        tableWidth:
            "auto",

        theme:
            "grid",

        head: [[

            "Furgón",

            "Viajes",

            "Cumplidos",

            "Incumplidos",

            "% Cumplimiento"

        ]],

        body:
            furgones.map(
                function (item) {

                    const porcentajeFurgon =
                        item.total > 0
                            ? (
                                item.cumplidos /
                                item.total
                            ) *
                            100
                            : 0;


                    return [

                        item.nombre,

                        String(
                            item.total
                        ),

                        String(
                            item.cumplidos
                        ),

                        String(
                            item.incumplidos
                        ),

                        formatearPorcentajePDF(
                            porcentajeFurgon
                        )

                    ];

                }
            ),

        styles: {

            font:
                "helvetica",

            fontSize:
                7,

            cellPadding:
                2.5,

            overflow:
                "linebreak",

            valign:
                "middle"

        },

        headStyles: {

            fillColor: [
                45,
                120,
                150
            ],

            textColor: [
                255,
                255,
                255
            ],

            fontStyle:
                "bold",

            halign:
                "center"

        },

        columnStyles: {

            0: {
                cellWidth:
                    70
            },

            1: {
                cellWidth:
                    25,
                halign:
                    "center"
            },

            2: {
                cellWidth:
                    30,
                halign:
                    "center"
            },

            3: {
                cellWidth:
                    30,
                halign:
                    "center"
            },

            4: {
                cellWidth:
                    40,
                halign:
                    "center"
            }

        }

    });

}


/* =========================================================
 * DETALLE DE VIAJES
 * ========================================================= */

function dibujarDetalleViajesPDF(
    doc,
    datos
) {

    dibujarEncabezadoPDF(
        doc,
        "DETALLE DE VIAJES",
        "Listado detallado de los viajes incluidos en el reporte."
    );


    const filas =
        datos.map(
            function (viaje) {

                return [

                    viaje.numero,

                    viaje.fecha,

                    viaje.conductor,

                    viaje.placa,

                    viaje.furgon,

                    viaje.origen,

                    viaje.destino,

                    viaje.salida,

                    viaje.llegada,

                    viaje.tiempoReal,

                    viaje.tiempoMaximo,

                    viaje.tiempoExcedido,

                    viaje.estadoODT,

                    viaje.estadoFurgon

                ];

            }
        );


    doc.autoTable({

        startY: 28,

        margin: {

            top: 28,

            bottom: 14,

            left: 7,

            right: 7

        },

        tableWidth:
            281,

        theme:
            "striped",

        head: [[

            "#",

            "Fecha",

            "Conductor",

            "Placa",

            "Furgón",

            "Origen",

            "Destino",

            "Salida",

            "Llegada",

            "Tiempo",

            "Máximo",

            "Exceso",

            "ODT",

            "Furgón"

        ]],

        body:
            filas,

        styles: {

            font:
                "helvetica",

            fontSize:
                5.5,

            cellPadding:
                1.4,

            overflow:
                "linebreak",

            valign:
                "middle",

            lineWidth:
                0.1,

            lineColor: [
                220,
                220,
                220
            ]

        },

        headStyles: {

            fillColor: [
                25,
                55,
                90
            ],

            textColor: [
                255,
                255,
                255
            ],

            fontStyle:
                "bold",

            fontSize:
                5.5,

            halign:
                "center",

            valign:
                "middle",

            cellPadding:
                1.5

        },

        alternateRowStyles: {

            fillColor: [
                248,
                249,
                251
            ]

        },

        columnStyles: {

            0: {
                cellWidth:
                    7,
                halign:
                    "center"
            },

            1: {
                cellWidth:
                    17,
                halign:
                    "center"
            },

            2: {
                cellWidth:
                    29
            },

            3: {
                cellWidth:
                    16,
                halign:
                    "center"
            },

            4: {
                cellWidth:
                    18,
                halign:
                    "center"
            },

            5: {
                cellWidth:
                    23
            },

            6: {
                cellWidth:
                    23
            },

            7: {
                cellWidth:
                    15,
                halign:
                    "center"
            },

            8: {
                cellWidth:
                    15,
                halign:
                    "center"
            },

            9: {
                cellWidth:
                    18,
                halign:
                    "center"
            },

            10: {
                cellWidth:
                    18,
                halign:
                    "center"
            },

            11: {
                cellWidth:
                    18,
                halign:
                    "center"
            },

            12: {
                cellWidth:
                    22,
                halign:
                    "center"
            },

            13: {
                cellWidth:
                    22,
                halign:
                    "center"
            }

        },

        didParseCell:
            function (data) {

                if (
                    data.section !==
                    "body"
                ) {

                    return;

                }


                /* -----------------------------------------
                 * ESTADO ODT
                 * ----------------------------------------- */

                if (
                    data.column.index === 12
                ) {

                    const estadoODTPDF =
                        obtenerTextoPDF(
                            data.cell.text
                        ).toUpperCase();


                    if (
                        estadoODTPDF ===
                        "CUMPLIDO"
                    ) {

                        data.cell.styles.textColor =
                            [
                                25,
                                125,
                                70
                            ];

                    }

                    else if (
                        estadoODTPDF ===
                        "INCUMPLIDO"
                    ) {

                        data.cell.styles.textColor =
                            [
                                190,
                                45,
                                45
                            ];

                    }

                }


                /* -----------------------------------------
                 * ESTADO FURGÓN
                 * ----------------------------------------- */

                if (
                    data.column.index === 13
                ) {

                    const estadoFurgonPDF =
                        obtenerTextoPDF(
                            data.cell.text
                        ).toUpperCase();


                    if (
                        estadoFurgonPDF ===
                        "CUMPLIDO"
                    ) {

                        data.cell.styles.textColor =
                            [
                                25,
                                125,
                                70
                            ];

                    }

                    else if (
                        estadoFurgonPDF ===
                        "INCUMPLIDO"
                    ) {

                        data.cell.styles.textColor =
                            [
                                190,
                                45,
                                45
                            ];

                    }

                }


                /* -----------------------------------------
                 * EXCESO
                 * ----------------------------------------- */

                if (
                    data.column.index === 11
                ) {

                    const excesoPDF =
                        obtenerTextoPDF(
                            data.cell.text
                        );


                    if (
                        excesoPDF !== "" &&
                        excesoPDF !== "0" &&
                        excesoPDF !== "0 min"
                    ) {

                        data.cell.styles.textColor =
                            [
                                190,
                                45,
                                45
                            ];

                    }

                }

            },

        didDrawPage:
            function (data) {

                /*
                 * ENCABEZADO EN PÁGINAS
                 * DE CONTINUACIÓN
                 */

                if (
                    data.pageNumber > 1
                ) {

                    dibujarEncabezadoPDF(
                        doc,
                        "DETALLE DE VIAJES",
                        "Continuación del listado de viajes."
                    );

                }

            }

    });

}


/* =========================================================
 * PIE DE PÁGINA
 * ========================================================= */

function agregarPiePaginasPDF(
    doc
) {

    const totalPaginas =
        doc.internal
            .getNumberOfPages();


    for (
        let pagina = 1;
        pagina <= totalPaginas;
        pagina++
    ) {

        doc.setPage(
            pagina
        );


        const ancho =
            doc.internal.pageSize
                .getWidth();


        const alto =
            doc.internal.pageSize
                .getHeight();


        /*
         * Grosor fino para el pie.
         */

        doc.setLineWidth(
            0.35
        );


        doc.setDrawColor(
            220,
            223,
            227
        );


        /*
         * Línea del pie.
         */

        doc.line(
            PDF_VIAJES_CONFIG.margen,
            alto - 10,
            ancho -
            PDF_VIAJES_CONFIG.margen,
            alto - 10
        );


        doc.setFont(
            "helvetica",
            "normal"
        );


        doc.setFontSize(
            7
        );


        doc.setTextColor(
            110,
            115,
            120
        );


        /*
         * Texto izquierdo.
         */

        doc.text(
            "Sistema de Gestión de Viajes",
            PDF_VIAJES_CONFIG.margen,
            alto - 5
        );


        /*
         * Número de página.
         *
         * Se mantiene en una zona exclusiva del pie.
         */

        doc.text(
            "Página " +
            pagina +
            " de " +
            totalPaginas,
            ancho -
            PDF_VIAJES_CONFIG.margen,
            alto - 5,
            {
                align:
                    "right"
            }
        );

    }

}


/* =========================================================
 * FORMATEAR PORCENTAJE
 * ========================================================= */

function formatearPorcentajePDF(
    valor
) {

    const numero =
        Number(valor);


    if (
        !isFinite(numero)
    ) {

        return "0.00%";

    }


    return (
        numero.toFixed(2) +
        "%"
    );

}