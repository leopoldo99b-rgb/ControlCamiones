/*=========================================================*
 *=                 VARIABLES GLOBALES
 *=========================================================*/

const URL_CONDUCTORES = "/conductores/api";
const URL_CAMIONES = "/camiones/disponibles";
const URL_RUTAS = "/rutas/activas";
const URL_VIAJES = "/viajes/lista";
const URL_GUARDAR_VIAJE = "/viajes/guardar";

const $modalNuevoViaje = $("#modalNuevoViaje");

const $cmbConductor = $("#conductor");
const $cmbPlaca = $("#placa");
const $cmbDestino = $("#destino");

const $txtTiempoMaximo = $("#tiempo_maximo");

const $txtSalida = $("#salida");
const $txtLlegada = $("#llegada");

let viajeSeleccionado = null;


/*=========================================================*
 *=                 DOCUMENT READY
 *=========================================================*/

$(document).ready(function () {

    console.log("========================================");
    console.log("VIAJES.JS INICIADO");
    console.log("========================================");


    /*=====================================================
     =              INICIALIZAR DATATABLE
     =====================================================*/

    inicializarTabla();


    /*=====================================================
     =              BOTÓN EXPORTAR PDF
     =====================================================*/

    $("#btnExportarPDF").on("click", function () {

        if (typeof exportarAuditoriaPDF === "function") {

            exportarAuditoriaPDF();

        } else {

            console.warn(
                "La función exportarAuditoriaPDF() no existe."
            );

        }

    });


    /*=====================================================
     =              MODAL NUEVO / EDITAR
     =====================================================*/

    $modalNuevoViaje.on("shown.bs.modal", function () {

        cargarConductores();
        cargarPlacas();
        cargarRutas();

    });


    /*=====================================================
     =              AUDITORÍA
     =====================================================*/

    cargarFiltrosAuditoria();


    /*=====================================================
     =              CARGAR VIAJES
     =====================================================*/

    cargarViajes();


    /*=====================================================
     =              BUSCAR AUDITORÍA
     =====================================================*/

    $("#btnBuscar").on("click", function () {

        aplicarFiltrosAuditoria();

    });


    /*=====================================================
     =              LIMPIAR AUDITORÍA
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
     =              ACTUALIZAR
     =====================================================*/

    $("#btnActualizar").on("click", function () {

        cargarFiltrosAuditoria();
        cargarViajes();

    });


    /*=====================================================
     =              CAMBIO DE FILTROS
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


    /*=====================================================
     =              AGREGAR NOTA
     =====================================================*/

    $(document).on("click", "#btnAgregarNota", function () {

        if (!viajeSeleccionado) {

            alert("No se ha seleccionado ningún viaje.");

            return;

        }

        abrirModalNota(false);

    });


    /*=====================================================
     =              MODIFICAR NOTA
     =====================================================*/

    $(document).on("click", "#btnModificarNota", function () {

        if (!viajeSeleccionado) {

            alert("No se ha seleccionado ningún viaje.");

            return;

        }

        abrirModalNota(true);

    });


    /*=====================================================
     =              VER NOTAS
     =====================================================*/

    $(document).on("click", ".btn-ver-notas", function () {

        const id = $(this).data("id");

        if (!id) {

            alert("No se encontró el ID del viaje.");

            return;

        }

        viajeSeleccionado = id;

        verNotasViaje(id);

    });


    /*=====================================================
     =              FORMULARIO NOTA
     =====================================================*/

    $(document).on("submit", "#formNotaViaje", function (e) {

        e.preventDefault();

        guardarNotaViaje();

    });


    /*=====================================================
     =              MODAL NUEVO VIAJE
     =====================================================*/

    $("#modalNuevoViaje").on("hidden.bs.modal", function () {

        /*
         * No limpiamos aquí porque también se utiliza
         * para editar viajes.
         */

    });

});


/*=========================================================*
 *=              INICIALIZAR DATATABLE
 *=========================================================*/

function inicializarTabla() {

    if (!$("#tblViajes").length) {

        console.error(
            "ERROR: No existe la tabla #tblViajes en el HTML."
        );

        return;

    }


    if ($.fn.DataTable.isDataTable("#tblViajes")) {

        console.log(
            "DataTable ya estaba inicializada."
        );

        return;

    }


    console.log(
        "Inicializando DataTable..."
    );


    $("#tblViajes").DataTable({

        language: {

            search: "Buscar:",

            zeroRecords:
                "No se encontraron viajes",

            emptyTable:
                "No hay viajes registrados",

            info:
                "Mostrando _TOTAL_ registros",

            infoEmpty:
                "Mostrando 0 registros",

            infoFiltered:
                "(filtrado de _MAX_ registros)"

        },


        /*
         * Sin paginación.
         */

        paging: false,

        ordering: true,

        searching: true,

        responsive: true,

        autoWidth: false,


        /*
         * =================================================
         * COLUMNAS
         *
         * 14 = NOTAS OCULTAS
         * 15 = ACCIONES
         * =================================================
         */

        columnDefs: [

            {
                targets: 14,
                visible: false,
                searchable: false,
                orderable: false
            },

            {
                targets: 15,
                orderable: false,
                searchable: false
            }

        ]

    });

}


/*=========================================================*
 *=                  CONDUCTORES
 *=========================================================*/

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


            if (!Array.isArray(conductores)) {

                console.warn(
                    "Conductores no es un arreglo:",
                    conductores
                );

                return;

            }


            conductores.forEach(function (conductor) {

                const id =
                    conductor.id ??
                    conductor.idConductor ??
                    "";


                const nombre =
                    (
                        (conductor.nombre || "") +
                        " " +
                        (conductor.apellido || "")
                    ).trim();


                $cmbConductor.append(`

                    <option value="${escapeHtml(id)}">

                        ${escapeHtml(nombre)}

                    </option>

                `);

            });

        },

        error: function (xhr) {

            console.error(
                "Error cargando conductores:",
                xhr.status,
                xhr.responseText
            );

        }

    });

}


/*=========================================================*
 *=                    CAMIONES
 *=========================================================*/

function cargarPlacas() {

    $.ajax({

        url: URL_CAMIONES,

        type: "GET",

        dataType: "json",

        success: function (camiones) {

            $("#listaPlacas").empty();


            if (!Array.isArray(camiones)) {

                console.warn(
                    "Camiones no es un arreglo:",
                    camiones
                );

                return;

            }


            camiones.forEach(function (camion) {

                if (!camion.placa) {

                    return;

                }


                $("#listaPlacas").append(`

                    <option
                        value="${escapeHtml(camion.placa)}">

                `);

            });

        },

        error: function (xhr) {

            console.error(
                "Error cargando placas:",
                xhr.status,
                xhr.responseText
            );

        }

    });

}


/*=========================================================*
 *=                      RUTAS
 *=========================================================*/

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


            if (!Array.isArray(rutas)) {

                console.warn(
                    "Rutas no es un arreglo:",
                    rutas
                );

                return;

            }


            rutas.forEach(function (ruta) {

                if (!ruta.destino) {

                    return;

                }


                $cmbDestino.append(`

                    <option
                        value="${escapeHtml(ruta.destino)}"
                        data-odt="${escapeHtml(ruta.odt || "")}">

                        ${escapeHtml(ruta.destino)}

                    </option>

                `);

            });

        },

        error: function (xhr) {

            console.error(
                "Error cargando rutas:",
                xhr.status,
                xhr.responseText
            );

        }

    });

}


/*=========================================================*
 *=                FILTROS DE AUDITORÍA
 *=========================================================*/

function cargarFiltrosAuditoria() {

    /*=====================================================
     =                  CONDUCTORES
     =====================================================*/

    $.ajax({

        url: URL_CONDUCTORES,

        type: "GET",

        dataType: "json",

        success: function (conductores) {

            const $filtroConductor =
                $("#cmbConductor");


            const valorActual =
                $filtroConductor.val();


            $filtroConductor.empty();


            $filtroConductor.append(
                '<option value="">Todos los conductores</option>'
            );


            if (!Array.isArray(conductores)) {

                return;

            }


            conductores.forEach(function (conductor) {

                const nombreCompleto =
                    (
                        (conductor.nombre || "") +
                        " " +
                        (conductor.apellido || "")
                    ).trim();


                $filtroConductor.append(`

                    <option value="${escapeHtml(nombreCompleto)}">

                        ${escapeHtml(nombreCompleto)}

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
     =                      RUTAS
     =====================================================*/

    $.ajax({

        url: URL_RUTAS,

        type: "GET",

        dataType: "json",

        success: function (rutas) {

            const $filtroRuta =
                $("#cmbRuta");


            const valorActual =
                $filtroRuta.val();


            $filtroRuta.empty();


            $filtroRuta.append(
                '<option value="">Todas las rutas</option>'
            );


            if (!Array.isArray(rutas)) {

                return;

            }


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


/*=========================================================*
 *=                    ESCAPE HTML
 *=========================================================*/

function escapeHtml(text) {

    if (
        text === null ||
        text === undefined
    ) {

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
 *=                OBTENER TEXTO CELDA
 *=========================================================*/

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


/*=========================================================*
 *=                   NORMALIZAR FECHA
 *=========================================================*/

function normalizarFecha(fecha) {

    if (!fecha) {

        return null;

    }


    const texto =
        String(fecha).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ) {

        return texto;

    }


    if (
        /^\d{4}-\d{2}-\d{2}T/.test(texto)
    ) {

        return texto.substring(0, 10);

    }


    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(texto)
    ) {

        const partes =
            texto.split("/");


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


/*=========================================================*
 *=                FILTRADO DATATABLE
 *=========================================================*/

$.fn.dataTable.ext.search.push(

    function (
        settings,
        data,
        dataIndex
    ) {

        if (
            !settings.nTable ||
            settings.nTable.id !== "tblViajes"
        ) {

            return true;

        }


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


        /*
         * Los índices 1, 2, 6, 12 y 13
         * NO cambian porque agregamos Notas
         * DESPUÉS de Estado Furgón.
         */

        const fechaFila =
            obtenerTextoCelda(data[1]);


        const conductorFila =
            obtenerTextoCelda(data[2]);


        const rutaFila =
            obtenerTextoCelda(data[6]);


        const estadoODTFila =
            obtenerTextoCelda(data[12])
                .toUpperCase()
                .trim();


        const estadoFurgonFila =
            obtenerTextoCelda(data[13])
                .toUpperCase()
                .trim();


        /*=================================================
         =                  FECHA INICIO
         =================================================*/

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


        /*=================================================
         =                    FECHA FIN
         =================================================*/

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


        /*=================================================
         =                       RUTA
         =================================================*/

        if (ruta) {

            if (

                rutaFila
                    .trim()
                    .toUpperCase() !==

                ruta
                    .trim()
                    .toUpperCase()

            ) {

                return false;

            }

        }


        /*=================================================
         =                    CONDUCTOR
         =================================================*/

        if (conductor) {

            if (

                conductorFila
                    .trim()
                    .toUpperCase() !==

                conductor
                    .trim()
                    .toUpperCase()

            ) {

                return false;

            }

        }


        /*=================================================
         =                    ESTADO ODT
         =================================================*/

        if (estadoODTFiltro) {

            if (

                estadoODTFila !==
                estadoODTFiltro
                    .trim()
                    .toUpperCase()

            ) {

                return false;

            }

        }


        /*=================================================
         =                  ESTADO FURGÓN
         =================================================*/

        if (estadoFurgonFiltro) {

            if (

                estadoFurgonFila !==
                estadoFurgonFiltro
                    .trim()
                    .toUpperCase()

            ) {

                return false;

            }

        }


        return true;

    }

);


/*=========================================================*
 *=                 APLICAR FILTROS
 *=========================================================*/

function aplicarFiltrosAuditoria() {

    if (
        !$.fn.DataTable.isDataTable("#tblViajes")
    ) {

        return;

    }


    const tabla =
        $("#tblViajes").DataTable();


    tabla.draw();


    actualizarDashboard();

}


/*=========================================================*
 *=                  CAMBIO DESTINO
 *=========================================================*/

$cmbDestino.on("change", function () {

    const odt =
        $(this)
            .find("option:selected")
            .data("odt");


    $txtTiempoMaximo.val(
        odt || ""
    );

});


/*=========================================================*
 *=                CALCULAR TIEMPO REAL
 *=========================================================*/

function calcularTiempoReal(
    horaSalida,
    horaLlegada
) {

    if (
        !horaSalida ||
        !horaLlegada
    ) {

        return 0;

    }


    const salida =
        new Date(
            "2000-01-01T" +
            horaSalida
        );


    const llegada =
        new Date(
            "2000-01-01T" +
            horaLlegada
        );


    let minutos =
        (llegada - salida) / 60000;


    if (minutos < 0) {

        minutos += 24 * 60;

    }


    return minutos;

}


/*=========================================================*
 *=                  HORA A MINUTOS
 *=========================================================*/

function horaAMinutos(hora) {

    if (!hora) {

        return 0;

    }


    const partes =
        String(hora).split(":");


    return (

        parseInt(partes[0] || 0) * 60

    ) +

        parseInt(partes[1] || 0);

}


/*=========================================================*
 *=                 MINUTOS A HORAS
 *=========================================================*/

function minutosAHoras(minutos) {

    minutos =
        parseInt(minutos) || 0;


    const horas =
        Math.floor(minutos / 60);


    const mins =
        minutos % 60;


    return (

        horas +
        "h " +
        mins +
        " min"

    );

}


/*=========================================================*
 *=                 TIEMPO EXCEDIDO
 *=========================================================*/

function calcularTiempoExcedido(
    tiempoReal,
    tiempoODT
) {

    const odt =
        horaAMinutos(tiempoODT);


    if (tiempoReal <= odt) {

        return 0;

    }


    return tiempoReal - odt;

}


/*=========================================================*
 *=                    ESTADO ODT
 *=========================================================*/

function obtenerEstadoODT(
    tiempoExcedido
) {

    if (tiempoExcedido <= 0) {

        return "CUMPLIDO";

    }


    return "INCUMPLIDO";

}


/*=========================================================*
 *=                  ESTADO FURGÓN
 *=========================================================*/

function obtenerEstadoFurgon(furgon) {

    const valor =
        String(furgon || "")
            .trim()
            .toUpperCase();


    if (

        valor === "CHC" ||
        valor === "CMI"

    ) {

        return "CUMPLIDO";

    }


    return "INCUMPLIDO";

}


/*=========================================================*
 *=              ABRIR MODAL ACCIONES
 *=========================================================*/

$(document).on(
    "click",
    ".btn-editar-viaje",
    function () {

        const id =
            $(this).data("id");


        if (
            id === undefined ||
            id === null ||
            id === ""
        ) {

            alert(
                "No se encontró el ID del viaje."
            );

            return;

        }


        viajeSeleccionado =
            id;


        const elemento =
            document.getElementById(
                "modalAccionesViaje"
            );


        if (!elemento) {

            alert(
                "No existe el modal de acciones."
            );

            return;

        }


        const modal =
            bootstrap.Modal.getOrCreateInstance(
                elemento
            );


        modal.show();

    }
);


/*=========================================================*
 *=              MODIFICAR INFORMACIÓN
 *=========================================================*/

$(document).on(
    "click",
    "#btnModificarInformacion",
    function () {

        if (!viajeSeleccionado) {

            alert(
                "No se ha seleccionado ningún viaje."
            );

            return;

        }


        cerrarModalAcciones();


        cargarViajeParaEditar(
            viajeSeleccionado
        );

    }
);


/*=========================================================*
 *=              CERRAR MODAL ACCIONES
 *=========================================================*/

function cerrarModalAcciones() {

    const elemento =
        document.getElementById(
            "modalAccionesViaje"
        );


    if (!elemento) {

        return;

    }


    const modal =
        bootstrap.Modal.getInstance(
            elemento
        );


    if (modal) {

        modal.hide();

    }

}


/*=========================================================*
 *=             OBTENER VIAJE PARA EDITAR
 *=========================================================*/

function cargarViajeParaEditar(id) {

    $.ajax({

        url: URL_VIAJES,

        type: "GET",

        dataType: "json",

        success: function (viajes) {

            if (!Array.isArray(viajes)) {

                alert(
                    "El servidor no devolvió una lista válida de viajes."
                );

                return;

            }


            const viaje =
                viajes.find(function (item) {

                    return String(item.id) ===
                        String(id);

                });


            if (!viaje) {

                alert(
                    "No se encontró el viaje seleccionado."
                );

                return;

            }


            cargarDatosViajeEnFormulario(
                viaje
            );

        },

        error: function (xhr) {

            console.error(
                "Error obteniendo viaje:",
                xhr.status,
                xhr.responseText
            );


            alert(
                "No se pudo obtener la información del viaje."
            );

        }

    });

}


/*=========================================================*
 *=            CARGAR DATOS FORMULARIO
 *=========================================================*/

function cargarDatosViajeEnFormulario(viaje) {

    console.log(
        "Viaje seleccionado para editar:",
        viaje
    );


    /*=====================================================
     =                     FECHA
     =====================================================*/

    let fecha =
        viaje.fecha || "";


    if (
        fecha &&
        String(fecha).includes("T")
    ) {

        fecha =
            String(fecha).substring(0, 10);

    }


    $("#fecha").val(fecha);


    /*=====================================================
     =                   CONDUCTOR
     =====================================================*/

    const conductorViaje =
        String(
            viaje.conductor || ""
        )
            .trim()
            .toUpperCase();


    let conductorEncontrado =
        false;


    $("#conductor option").each(
        function () {

            const texto =
                $(this)
                    .text()
                    .trim()
                    .toUpperCase();


            if (
                texto === conductorViaje
            ) {

                $("#conductor")
                    .val(
                        $(this).val()
                    );


                conductorEncontrado =
                    true;


                return false;

            }

        }
    );


    if (!conductorEncontrado) {

        console.warn(
            "No se encontró el conductor:",
            viaje.conductor
        );

    }


    /*=====================================================
     =                      PLACA
     =====================================================*/

    $("#placa").val(
        viaje.placa || ""
    );


    /*=====================================================
     =                     FURGÓN
     =====================================================*/

    $("#furgon").val(
        viaje.furgon || ""
    );


    /*=====================================================
     =                     ORIGEN
     =====================================================*/

    $("#origen").val(
        viaje.origen || ""
    );


    /*=====================================================
     =                    DESTINO
     =====================================================*/

    $("#destino").val(
        viaje.destino || ""
    );


    /*=====================================================
     =                   HORA SALIDA
     =====================================================*/

    $("#salida").val(
        obtenerHora(
            viaje.salida
        )
    );


    /*=====================================================
     =                  HORA LLEGADA
     =====================================================*/

    $("#llegada").val(
        obtenerHora(
            viaje.llegada
        )
    );


    /*=====================================================
     =                    TIEMPO ODT
     =====================================================*/

    const tiempoMaximo =
        viaje.tiempoMaximo ??
        viaje.tiempo_maximo ??
        viaje.odt ??
        "";


    $("#tiempo_maximo").val(
        convertirTiempoParaInput(
            tiempoMaximo
        )
    );


    /*=====================================================
     =                       ID
     =====================================================*/

    $("#formNuevoViaje").data(
        "id",
        viaje.id
    );


    /*=====================================================
     =                      NOTAS
     =====================================================*/

    $("#formNuevoViaje").data(
        "notas",
        viaje.notas || ""
    );


    /*=====================================================
     =                     TÍTULO
     =====================================================*/

    $("#modalNuevoViaje .modal-title")
        .html(`
            <i class="bi bi-pencil-square"></i>
            Modificar Viaje
        `);


    /*=====================================================
     =                     BOTÓN
     =====================================================*/

    $("#formNuevoViaje button[type='submit']")
        .html(`
            <i class="bi bi-save"></i>
            Actualizar Viaje
        `);


    /*=====================================================
     =                  ABRIR MODAL
     =====================================================*/

    const elemento =
        document.getElementById(
            "modalNuevoViaje"
        );


    if (!elemento) {

        alert(
            "No existe el modalNuevoViaje."
        );

        return;

    }


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            elemento
        );


    modal.show();

}


/*=========================================================*
 *=                 CONVERTIR TIEMPO INPUT
 *=========================================================*/

function convertirTiempoParaInput(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return "";

    }


    if (
        String(valor).includes(":")
    ) {

        return String(valor).substring(0, 5);

    }


    const minutos =
        parseInt(valor);


    if (!isNaN(minutos)) {

        const horas =
            Math.floor(minutos / 60);


        const mins =
            minutos % 60;


        return (

            String(horas).padStart(2, "0") +
            ":" +
            String(mins).padStart(2, "0")

        );

    }


    return String(valor);

}


/*=========================================================*
 *=                    OBTENER HORA
 *=========================================================*/

function obtenerHora(valor) {

    if (!valor) {

        return "";

    }


    const texto =
        String(valor);


    if (
        texto.includes("T")
    ) {

        const hora =
            texto.split("T")[1];


        return hora
            ? hora.substring(0, 5)
            : "";

    }


    if (
        texto.includes(":")
    ) {

        return texto.substring(
            0,
            5
        );

    }


    return texto;

}


/*=========================================================*
 *=             FORMULARIO NUEVO / EDITAR
 *=========================================================*/

$("#formNuevoViaje").on(
    "submit",
    function (e) {

        e.preventDefault();


        /*=================================================
         =                    VALIDACIÓN
         =================================================*/

        if (

            $("#fecha").val() === "" ||

            $("#conductor").val() === "" ||

            $("#placa").val().trim() === "" ||

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
         =                   CÁLCULOS
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
         =                       ID
         =================================================*/

        const idViaje =
            $("#formNuevoViaje")
                .data("id");


        /*=================================================
         =                      NOTAS
         =================================================*/

        const notasExistentes =
            $("#formNuevoViaje")
                .data("notas") || "";


        /*=================================================
         =                     VIAJE
         =================================================*/

        const viaje = {

            id:
                idViaje || null,

            fecha:
                $("#fecha").val(),

            conductor:
                $("#conductor option:selected")
                    .text()
                    .trim(),

            placa:
                $("#placa")
                    .val()
                    .trim(),

            furgon:
                $("#furgon").val(),

            estadoFurgon:
                estadoFurgon,

            origen:
                $("#origen")
                    .val()
                    .trim(),

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
                estadoODT,

            notas:
                notasExistentes

        };


        /*=================================================
         =                  URL / MÉTODO
         =================================================*/

        let url =
            URL_GUARDAR_VIAJE;


        let metodo =
            "POST";


        if (idViaje) {

            url =
                "/viajes/actualizar/" +
                idViaje;


            metodo =
                "PUT";

        }


        console.log(
            "========================================"
        );

        console.log(
            "GUARDANDO VIAJE"
        );

        console.log(
            "URL:",
            url
        );

        console.log(
            "Método:",
            metodo
        );

        console.log(
            "Datos:",
            viaje
        );

        console.log(
            "========================================"
        );


        /*=================================================
         =                     AJAX
         =================================================*/

        $.ajax({

            url: url,

            type: metodo,

            contentType:
                "application/json",

            data:
                JSON.stringify(viaje),

            success:
                function (response) {

                    console.log(
                        "Respuesta servidor:",
                        response
                    );


                    const elemento =
                        document.getElementById(
                            "modalNuevoViaje"
                        );


                    const modal =
                        bootstrap.Modal.getInstance(
                            elemento
                        );


                    if (modal) {

                        modal.hide();

                    }


                    $("#formNuevoViaje")[0]
                        .reset();


                    $("#formNuevoViaje")
                        .removeData("id");


                    $("#formNuevoViaje")
                        .removeData("notas");


                    $("#tiempo_maximo")
                        .val("");


                    $("#modalNuevoViaje .modal-title")
                        .html(`
                            <i class="bi bi-truck"></i>
                            Registrar Nuevo Viaje
                        `);


                    $("#formNuevoViaje button[type='submit']")
                        .html(`
                            <i class="bi bi-save"></i>
                            Guardar Viaje
                        `);


                    viajeSeleccionado =
                        null;


                    cargarViajes();


                    cargarFiltrosAuditoria();


                    setTimeout(
                        function () {

                            actualizarDashboard();

                        },
                        300
                    );


                    alert(

                        idViaje

                            ? "Viaje actualizado correctamente."

                            : "Viaje guardado correctamente."

                    );

                },


            error:
                function (xhr) {

                    console.error(
                        "ERROR GUARDANDO VIAJE"
                    );

                    console.error(
                        "Status:",
                        xhr.status
                    );

                    console.error(
                        "Respuesta:",
                        xhr.responseText
                    );


                    let mensaje =
                        "Error al guardar el viaje.";


                    try {

                        const respuesta =
                            JSON.parse(
                                xhr.responseText
                            );


                        if (
                            respuesta.message
                        ) {

                            mensaje =
                                respuesta.message;

                        }
                        else if (
                            respuesta.mensaje
                        ) {

                            mensaje =
                                respuesta.mensaje;

                        }

                    }
                    catch (error) {

                        console.warn(
                            "La respuesta no es JSON."
                        );

                    }


                    alert(
                        mensaje
                    );

                }

        });

    }
);


/*=========================================================*
 *=                ABRIR MODAL NOTA
 *=========================================================*/

function abrirModalNota(modificar) {

    if (!viajeSeleccionado) {

        alert(
            "No se ha seleccionado ningún viaje."
        );

        return;

    }


    $.ajax({

        url: URL_VIAJES,

        type: "GET",

        dataType: "json",

        success: function (viajes) {

            if (!Array.isArray(viajes)) {

                alert(
                    "No se pudo obtener la información de los viajes."
                );

                return;

            }


            const viaje =
                viajes.find(function (item) {

                    return String(item.id) ===
                        String(viajeSeleccionado);

                });


            if (!viaje) {

                alert(
                    "No se encontró el viaje seleccionado."
                );

                return;

            }


            $("#idViajeNota")
                .val(viaje.id);


            $("#txtNotaViaje")
                .val(viaje.notas || "");


            if (modificar) {

                $("#tituloModalNota")
                    .html(`
                        <i class="bi bi-pencil-square"></i>
                        Modificar nota del viaje
                    `);

            } else {

                $("#tituloModalNota")
                    .html(`
                        <i class="bi bi-sticky"></i>
                        Agregar nota al viaje
                    `);

            }


            cerrarModalAcciones();


            const elemento =
                document.getElementById(
                    "modalNotaViaje"
                );


            if (!elemento) {

                alert(
                    "No existe el modalNotaViaje."
                );

                return;

            }


            const modal =
                bootstrap.Modal.getOrCreateInstance(
                    elemento
                );


            modal.show();

        },

        error: function (xhr) {

            console.error(
                "Error obteniendo viaje para nota:",
                xhr.status,
                xhr.responseText
            );


            alert(
                "No se pudo cargar la información del viaje."
            );

        }

    });

}


/*=========================================================*
 *=                   GUARDAR NOTA
 *=========================================================*/

function guardarNotaViaje() {

    const idViaje =
        $("#idViajeNota").val();


    const nota =
        $("#txtNotaViaje")
            .val()
            .trim();


    if (!idViaje) {

        alert(
            "No se encontró el ID del viaje."
        );

        return;

    }


    if (!nota) {

        alert(
            "Debe escribir una nota."
        );

        return;

    }


    $.ajax({

        url: URL_VIAJES,

        type: "GET",

        dataType: "json",

        success: function (viajes) {

            if (!Array.isArray(viajes)) {

                alert(
                    "El servidor no devolvió una lista válida."
                );

                return;

            }


            const viaje =
                viajes.find(function (item) {

                    return String(item.id) ===
                        String(idViaje);

                });


            if (!viaje) {

                alert(
                    "No se encontró el viaje."
                );

                return;

            }


            viaje.notas =
                nota;


            console.log(
                "Guardando nota:",
                viaje
            );


            $.ajax({

                url:
                    "/viajes/actualizar/" +
                    idViaje,

                type:
                    "PUT",

                contentType:
                    "application/json",

                data:
                    JSON.stringify(viaje),

                success:
                    function (response) {

                        console.log(
                            "Nota guardada:",
                            response
                        );


                        const elemento =
                            document.getElementById(
                                "modalNotaViaje"
                            );


                        const modal =
                            bootstrap.Modal.getInstance(
                                elemento
                            );


                        if (modal) {

                            modal.hide();

                        }


                        $("#formNotaViaje")[0]
                            .reset();


                        $("#idViajeNota")
                            .val("");


                        cargarViajes();


                        alert(
                            "Nota guardada correctamente."
                        );

                    },


                error:
                    function (xhr) {

                        console.error(
                            "Error guardando nota:",
                            xhr.status,
                            xhr.responseText
                        );


                        let mensaje =
                            "No se pudo guardar la nota.";


                        try {

                            const respuesta =
                                JSON.parse(
                                    xhr.responseText
                                );


                            if (
                                respuesta.message
                            ) {

                                mensaje =
                                    respuesta.message;

                            }
                            else if (
                                respuesta.mensaje
                            ) {

                                mensaje =
                                    respuesta.mensaje;

                            }

                        }
                        catch (error) {

                            console.warn(
                                "Respuesta no JSON."
                            );

                        }


                        alert(
                            mensaje
                        );

                    }

            });

        },

        error: function (xhr) {

            console.error(
                "Error obteniendo viaje:",
                xhr.status,
                xhr.responseText
            );


            alert(
                "No se pudo obtener la información actual del viaje."
            );

        }

    });

}


/*=========================================================*
 *=                  VER NOTAS DEL VIAJE
 *=========================================================*/

function verNotasViaje(id) {

    $.ajax({

        url: URL_VIAJES,

        type: "GET",

        dataType: "json",

        success: function (viajes) {

            if (!Array.isArray(viajes)) {

                alert(
                    "No se pudieron cargar las notas."
                );

                return;

            }


            const viaje =
                viajes.find(function (item) {

                    return String(item.id) ===
                        String(id);

                });


            if (!viaje) {

                alert(
                    "No se encontró el viaje."
                );

                return;

            }


            mostrarModalNotas(viaje);

        },

        error: function (xhr) {

            console.error(
                "Error cargando notas:",
                xhr.status,
                xhr.responseText
            );


            alert(
                "No se pudieron cargar las notas."
            );

        }

    });

}


/*=========================================================*
 *=                 MODAL VISUALIZAR NOTAS
 *=========================================================*/

function mostrarModalNotas(viaje) {

    $("#modalVisualizarNotas").remove();


    const nota =
        viaje.notas || "";


    const conductor =
        viaje.conductor || "Sin conductor";


    const destino =
        viaje.destino || "Sin destino";


    const fecha =
        viaje.fecha || "";


    const modalHTML = `

        <div
            class="modal fade"
            id="modalVisualizarNotas"
            tabindex="-1"
            aria-hidden="true">

            <div
                class="modal-dialog modal-dialog-centered modal-lg">

                <div
                    class="modal-content border-0 shadow-lg">

                    <div
                        class="modal-header bg-dark text-white">

                        <div>

                            <h5
                                class="modal-title mb-1">

                                <i
                                    class="bi bi-journal-text me-2">
                                </i>

                                Notas del viaje

                            </h5>

                            <small
                                class="text-white-50">

                                ${escapeHtml(conductor)}

                            </small>

                        </div>


                        <button
                            type="button"
                            class="btn-close btn-close-white"
                            data-bs-dismiss="modal">
                        </button>

                    </div>


                    <div
                        class="modal-body p-4">

                        <div
                            class="row g-3 mb-4">

                            <div class="col-md-4">

                                <div
                                    class="bg-light rounded p-3">

                                    <small
                                        class="text-muted">

                                        <i
                                            class="bi bi-calendar3 me-1">
                                        </i>

                                        Fecha

                                    </small>

                                    <div
                                        class="fw-semibold">

                                        ${escapeHtml(fecha)}

                                    </div>

                                </div>

                            </div>


                            <div class="col-md-4">

                                <div
                                    class="bg-light rounded p-3">

                                    <small
                                        class="text-muted">

                                        <i
                                            class="bi bi-person me-1">
                                        </i>

                                        Conductor

                                    </small>

                                    <div
                                        class="fw-semibold">

                                        ${escapeHtml(conductor)}

                                    </div>

                                </div>

                            </div>


                            <div class="col-md-4">

                                <div
                                    class="bg-light rounded p-3">

                                    <small
                                        class="text-muted">

                                        <i
                                            class="bi bi-geo-alt me-1">
                                        </i>

                                        Destino

                                    </small>

                                    <div
                                        class="fw-semibold">

                                        ${escapeHtml(destino)}

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div
                            class="border rounded-3 p-4">

                            <div
                                class="d-flex align-items-center mb-3">

                                <i
                                    class="bi bi-sticky-fill fs-4 text-warning me-2">
                                </i>

                                <h6
                                    class="mb-0">

                                    Nota registrada

                                </h6>

                            </div>


                            <div
                                class="p-3 bg-light rounded">

                                ${
                                    nota
                                        ? escapeHtml(nota)
                                        : `
                                            <span
                                                class="text-muted">

                                                Este viaje no tiene
                                                ninguna nota registrada.

                                            </span>
                                        `
                                }

                            </div>

                        </div>

                    </div>


                    <div
                        class="modal-footer">

                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-bs-dismiss="modal">

                            <i
                                class="bi bi-x-lg me-1">
                            </i>

                            Cerrar

                        </button>


                        ${
                            nota
                            ? `

                                <button
                                    type="button"
                                    class="btn btn-danger"
                                    onclick="eliminarNota(${viaje.id})">

                                    <i
                                        class="bi bi-trash me-1">
                                    </i>

                                    Eliminar nota

                                </button>

                              `
                            : ""
                        }

                    </div>

                </div>

            </div>

        </div>

    `;


    $("body").append(
        modalHTML
    );


    const elemento =
        document.getElementById(
            "modalVisualizarNotas"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            elemento
        );


    modal.show();


    $(elemento).on(
        "hidden.bs.modal",
        function () {

            $(this).remove();

        }
    );

}


/*=========================================================*
 *=                    ELIMINAR NOTA
 *=========================================================*/

function eliminarNota(id) {

    if (
        !confirm(
            "¿Está seguro de eliminar esta nota?"
        )
    ) {

        return;

    }


    $.ajax({

        url: URL_VIAJES,

        type: "GET",

        dataType: "json",

        success: function (viajes) {

            if (!Array.isArray(viajes)) {

                alert(
                    "No se pudo obtener el viaje."
                );

                return;

            }


            const viaje =
                viajes.find(function (item) {

                    return String(item.id) ===
                        String(id);

                });


            if (!viaje) {

                alert(
                    "No se encontró el viaje."
                );

                return;

            }


            viaje.notas = "";


            $.ajax({

                url:
                    "/viajes/actualizar/" +
                    id,

                type:
                    "PUT",

                contentType:
                    "application/json",

                data:
                    JSON.stringify(viaje),

                success:
                    function () {

                        const elemento =
                            document.getElementById(
                                "modalVisualizarNotas"
                            );


                        const modal =
                            bootstrap.Modal.getInstance(
                                elemento
                            );


                        if (modal) {

                            modal.hide();

                        }


                        cargarViajes();


                        alert(
                            "Nota eliminada correctamente."
                        );

                    },

                error:
                    function (xhr) {

                        console.error(
                            "Error eliminando nota:",
                            xhr.status,
                            xhr.responseText
                        );


                        alert(
                            "No se pudo eliminar la nota."
                        );

                    }

            });

        },

        error: function (xhr) {

            console.error(
                "Error obteniendo viaje:",
                xhr.responseText
            );


            alert(
                "No se pudo obtener el viaje."
            );

        }

    });

}


/*=========================================================*
 *=                    AGREGAR FILA
 *=========================================================*/

function agregarFila(viaje) {

    const tabla =
        $("#tblViajes").DataTable();


    console.log(
        "Agregando viaje a tabla:",
        viaje
    );


    const horaSalida =
        obtenerHora(
            viaje.salida
        );


    const horaLlegada =
        obtenerHora(
            viaje.llegada
        );


    const tiempoReal =
        calcularTiempoReal(
            horaSalida,
            horaLlegada
        );


    let tiempoMaximo =
        viaje.tiempoMaximo;


    if (
        tiempoMaximo === null ||
        tiempoMaximo === undefined ||
        tiempoMaximo === ""
    ) {

        tiempoMaximo =
            horaAMinutos(
                viaje.odt
            );

    }


    if (
        typeof tiempoMaximo === "string" &&
        tiempoMaximo.includes(":")
    ) {

        tiempoMaximo =
            horaAMinutos(
                tiempoMaximo
            );

    }


    const tiempoExcedido =

        viaje.tiempoExcedido !== null &&
        viaje.tiempoExcedido !== undefined

            ?

            parseInt(
                viaje.tiempoExcedido
            ) || 0

            :

            calcularTiempoExcedido(
                tiempoReal,
                viaje.odt
            );


    const estado =
        String(
            viaje.estado ||
            obtenerEstadoODT(
                tiempoExcedido
            )
        )
            .toUpperCase();


    const estadoFurgon =
        String(
            viaje.estadoFurgon ||
            obtenerEstadoFurgon(
                viaje.furgon
            )
        )
            .toUpperCase();


    const tieneNota =
        viaje.notas &&
        String(viaje.notas).trim() !== "";


    /*=====================================================
     =                BOTÓN DE NOTAS
     =====================================================*/

    const botonNota = tieneNota

        ?

        `

            <button
                type="button"
                class="btn btn-info btn-sm btn-ver-notas"
                data-id="${escapeHtml(viaje.id)}"
                title="Ver notas">

                <i class="bi bi-eye"></i>

            </button>

        `

        :

        `

            <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                disabled
                title="Este viaje no tiene notas">

                <i class="bi bi-eye-slash"></i>

            </button>

        `;


    /*=====================================================
     =                    BOTONES
     =====================================================*/

    const botones = `

        <div
            class="d-flex gap-1 justify-content-center">

            ${botonNota}


            <button
                type="button"
                class="btn btn-warning btn-sm btn-editar-viaje"
                data-id="${escapeHtml(viaje.id)}"
                title="Editar viaje">

                <i class="bi bi-pencil"></i>

            </button>


            <button
                type="button"
                class="btn btn-danger btn-sm"
                onclick="eliminarViaje(${Number(viaje.id)})"
                title="Eliminar viaje">

                <i class="bi bi-trash"></i>

            </button>

        </div>

    `;


    /*=====================================================
     =                   AGREGAR FILA
     =====================================================*/

    const filaViaje = [

        /* 0 - Número */
        tabla.rows().count() + 1,

        /* 1 - Fecha */
        escapeHtml(
            viaje.fecha || ""
        ),

        /* 2 - Conductor */
        escapeHtml(
            viaje.conductor || ""
        ),

        /* 3 - Placa */
        escapeHtml(
            viaje.placa || ""
        ),

        /* 4 - Furgón */
        escapeHtml(
            viaje.furgon || ""
        ),

        /* 5 - Origen */
        escapeHtml(
            viaje.origen || ""
        ),

        /* 6 - Destino */
        escapeHtml(
            viaje.destino || ""
        ),

        /* 7 - Salida */
        horaSalida,

        /* 8 - Llegada */
        horaLlegada,

        /* 9 - Tiempo real */
        minutosAHoras(
            tiempoReal
        ),

        /* 10 - Tiempo máximo */
        minutosAHoras(
            tiempoMaximo
        ),

        /* 11 - Exceso */
        tiempoExcedido === 0

            ?

            "<span class='text-success fw-semibold'>0 min</span>"

            :

            "<span class='text-danger fw-semibold'>+" +
            tiempoExcedido +
            " min</span>",

        /* 12 - Estado ODT */
        estado === "CUMPLIDO"

            ?

            "<span class='badge bg-success'>CUMPLIDO</span>"

            :

            "<span class='badge bg-danger'>INCUMPLIDO</span>",

        /* 13 - Estado Furgón */
        estadoFurgon === "CUMPLIDO"

            ?

            "<span class='badge bg-success'>CUMPLIDO</span>"

            :

            "<span class='badge bg-danger'>INCUMPLIDO</span>",

        /*=================================================
         * 14 - NOTAS
         *
         * ESTA COLUMNA ESTARÁ OCULTA
         * =================================================*/

        escapeHtml(
            viaje.notas || ""
        ),

        /*=================================================
         * 15 - ACCIONES
         * =================================================*/

        botones

    ];


    /*
     * Agregamos la fila a DataTables.
     */

    tabla.row.add(
        filaViaje
    );

}


/*=========================================================*
 *=                 ACTUALIZAR DASHBOARD
 *=========================================================*/

function actualizarDashboard() {

    if (
        !$.fn.DataTable.isDataTable(
            "#tblViajes"
        )
    ) {

        return;

    }


    const tabla =
        $("#tblViajes").DataTable();


    const filasFiltradas =
        tabla.rows({
            search: "applied"
        });


    const total =
        filasFiltradas.count();


    let odtCumplidos = 0;

    let odtIncumplidos = 0;

    let furgonCumplidos = 0;

    let furgonIncumplidos = 0;


    filasFiltradas.every(function () {

        const fila =
            this.data();


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


        if (
            estadoODT === "INCUMPLIDO"
        ) {

            odtIncumplidos++;

        }


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


        if (
            estadoFurgon === "INCUMPLIDO"
        ) {

            furgonIncumplidos++;

        }

    });


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


    const totalODT =
        odtCumplidos +
        odtIncumplidos;


    const porcentajeODT =
        totalODT > 0

            ?

            (
                odtCumplidos /
                totalODT
            ) * 100

            :

            0;


    const totalFurgon =
        furgonCumplidos +
        furgonIncumplidos;


    const porcentajeFurgon =
        totalFurgon > 0

            ?

            (
                furgonCumplidos /
                totalFurgon
            ) * 100

            :

            0;


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


    $("#lblRegistros")
        .text(total);

}


/*=========================================================*
 *=                   CARGAR VIAJES
 *=========================================================*/

function cargarViajes() {

    console.log(
        "========================================"
    );

    console.log(
        "CARGANDO VIAJES..."
    );

    console.log(
        "URL:",
        URL_VIAJES
    );


    if (
        !$("#tblViajes").length
    ) {

        console.error(
            "No existe #tblViajes."
        );

        return;

    }


    inicializarTabla();


    const tabla =
        $("#tblViajes").DataTable();


    $.ajax({

        url: URL_VIAJES,

        type: "GET",

        dataType: "json",

        success:
            function (viajes) {

                console.log(
                    "Respuesta /viajes/lista:",
                    viajes
                );


                tabla.clear();


                if (
                    !Array.isArray(viajes)
                ) {

                    console.error(
                        "El backend NO devolvió un Array."
                    );

                    console.error(
                        "Respuesta recibida:",
                        viajes
                    );


                    tabla.draw();


                    actualizarDashboard();


                    return;

                }


                console.log(
                    "Cantidad de viajes:",
                    viajes.length
                );


                viajes.forEach(
                    function (viaje) {

                        agregarFila(
                            viaje
                        );

                    }
                );


                tabla.draw();


                actualizarDashboard();


                console.log(
                    "Tabla cargada correctamente."
                );

            },


        error:
            function (xhr) {

                console.error(
                    "========================================"
                );

                console.error(
                    "ERROR CARGANDO VIAJES"
                );

                console.error(
                    "Status:",
                    xhr.status
                );

                console.error(
                    "Respuesta:",
                    xhr.responseText
                );

                console.error(
                    "========================================"
                );


                alert(
                    "No se pudieron cargar los viajes."
                );

            }

    });

}


/*=========================================================*
 *=                   ELIMINAR VIAJE
 *=========================================================*/

function eliminarViaje(id) {

    if (
        !confirm(
            "¿Está seguro de eliminar este viaje?"
        )
    ) {

        return;

    }


    $.ajax({

        url:
            "/viajes/eliminar/" +
            id,

        type:
            "DELETE",

        success:
            function () {

                cargarViajes();

                cargarFiltrosAuditoria();

                viajeSeleccionado =
                    null;

            },

        error:
            function (xhr) {

                console.error(
                    "Error eliminando:",
                    xhr.status,
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
 *
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

window.exportarAuditoriaPDF = async function () {

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
         * OBTENER DATOS
         *
         * IMPORTANTE:
         * Esta función es async porque consulta:
         *
         * GET /viajes/lista
         *
         * para obtener las notas.
         * ------------------------------------------------- */

        const datos =
            await obtenerDatosViajesPDF();


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
         * PÁGINA DE NOTAS
         *
         * SOLO SE CREA SI EXISTEN VIAJES CON NOTAS.
         * ------------------------------------------------- */

        const viajesConNotas =
            obtenerViajesConNotasPDF(
                datos,
                filtros
            );


        if (
            viajesConNotas.length > 0
        ) {

            doc.addPage();

            dibujarNotasViajesPDF(
                doc,
                viajesConNotas,
                filtros
            );

        }


        /* -------------------------------------------------
         * PIE DE PÁGINA
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
 * OBTENER DATOS DE DATATABLE PARA PDF
 *
 * IMPORTANTE:
 *
 * La columna 14 contiene NOTAS.
 * La columna 14 está oculta visualmente,
 * pero sigue existiendo dentro de DataTables.
 *
 * Estructura:
 *
 * 0  Número
 * 1  Fecha
 * 2  Conductor
 * 3  Placa
 * 4  Furgón
 * 5  Origen
 * 6  Destino
 * 7  Salida
 * 8  Llegada
 * 9  Tiempo real
 * 10 Tiempo máximo
 * 11 Exceso
 * 12 Estado ODT
 * 13 Estado Furgón
 * 14 NOTAS
 * 15 Acciones
 * ========================================================= */

function obtenerDatosViajesPDF() {

    /* -----------------------------------------------------
     * VERIFICAR DATATABLE
     * ----------------------------------------------------- */

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


    /* -----------------------------------------------------
     * OBTENER DATATABLE
     * ----------------------------------------------------- */

    const tabla =
        $("#tblViajes").DataTable();


    /* -----------------------------------------------------
     * RESULTADO
     * ----------------------------------------------------- */

    const resultado = [];


    /* -----------------------------------------------------
     * RECORRER SOLAMENTE LAS FILAS FILTRADAS
     *
     * Esto es importante porque el PDF debe respetar
     * los filtros de auditoría.
     * ----------------------------------------------------- */

    tabla.rows({
        search: "applied"
    }).every(function () {

        const fila =
            this.data();


        if (
            !fila ||
            !Array.isArray(fila)
        ) {

            return;

        }


        /* -------------------------------------------------
         * NOTAS
         *
         * AHORA LAS NOTAS ESTÁN EN LA COLUMNA 14.
         *
         * Esta es la modificación principal.
         * ------------------------------------------------- */

        const notas =
            obtenerTextoPDF(
                fila[14]
            );


        /* -------------------------------------------------
         * ID
         *
         * Se intenta obtener del atributo interno si existe.
         * El PDF no depende de él para imprimir las notas.
         * ------------------------------------------------- */

        let idViaje = null;


        if (
            fila._viajeId !== undefined &&
            fila._viajeId !== null
        ) {

            idViaje =
                String(
                    fila._viajeId
                );

        }


        /* -------------------------------------------------
         * AGREGAR VIAJE
         * ------------------------------------------------- */

        resultado.push({

            id:
                idViaje,


            /* ---------------------------------------------
             * COLUMNAS
             * --------------------------------------------- */

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
                )
                .toUpperCase(),


            estadoFurgon:
                obtenerTextoPDF(
                    fila[13]
                )
                .toUpperCase(),


            /* ---------------------------------------------
             * NOTAS
             *
             * COLUMNA OCULTA 14
             * --------------------------------------------- */

            notas:
                notas

        });

    });


    /* -----------------------------------------------------
     * DEBUG
     * ----------------------------------------------------- */

    console.log(
        "========================================"
    );

    console.log(
        "DATOS PREPARADOS PARA PDF"
    );

    console.log(
        "Total:",
        resultado.length
    );

    console.log(
        "Viajes con notas:",
        resultado.filter(
            function (viaje) {

                return obtenerTextoPDF(
                    viaje.notas
                ) !== "";

            }
        ).length
    );

    console.log(
        "========================================"
    );


    console.log(
        resultado
    );


    return resultado;

}

/* =========================================================
 * OBTENER SOLO VIAJES CON NOTAS
 *
 * REGLAS:
 *
 * 1. Debe tener una nota.
 * 2. Debe estar dentro del período.
 * 3. Respeta los filtros aplicados en DataTable porque
 *    "datos" ya viene filtrado.
 * ========================================================= */

function obtenerViajesConNotasPDF(
    datos,
    filtros
) {

    if (
        !datos ||
        datos.length === 0
    ) {

        return [];

    }


    const fechaInicio =
        filtros.fechaInicio
            ? convertirFechaPDF(
                filtros.fechaInicio
            )
            : null;


    const fechaFin =
        filtros.fechaFin
            ? convertirFechaPDF(
                filtros.fechaFin
            )
            : null;


    return datos.filter(
        function (viaje) {

            /* ---------------------------------------------
             * DEBE TENER NOTA
             * --------------------------------------------- */

            const nota =
                obtenerTextoPDF(
                    viaje.notas
                );


            if (
                nota === ""
            ) {

                return false;

            }


            /* ---------------------------------------------
             * FECHA DEL VIAJE
             * --------------------------------------------- */

            const fechaViaje =
                convertirFechaPDF(
                    viaje.fecha
                );


            /*
             * Si existe fecha de inicio y la fecha
             * del viaje es menor, no se agrega.
             */

            if (
                fechaInicio &&
                fechaViaje &&
                fechaViaje < fechaInicio
            ) {

                return false;

            }


            /*
             * Si existe fecha final y la fecha
             * del viaje es mayor, no se agrega.
             */

            if (
                fechaFin &&
                fechaViaje &&
                fechaViaje > fechaFin
            ) {

                return false;

            }


            return true;

        }
    );

}


/* =========================================================
 * CONVERTIR FECHA PARA COMPARACIÓN
 * ========================================================= */

function convertirFechaPDF(valor) {

    if (
        !valor
    ) {

        return null;

    }


    const texto =
        String(valor)
            .trim();


    /*
     * YYYY-MM-DD
     */

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            texto
        )
    ) {

        return texto;

    }


    /*
     * DD/MM/YYYY
     */

    const partes =
        texto.split("/");


    if (
        partes.length === 3
    ) {

        const dia =
            partes[0].padStart(
                2,
                "0"
            );


        const mes =
            partes[1].padStart(
                2,
                "0"
            );


        const anio =
            partes[2];


        if (
            anio.length === 4
        ) {

            return (
                anio +
                "-" +
                mes +
                "-" +
                dia
            );

        }

    }


    return texto;

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

    if (
        typeof $ !== "undefined"
    ) {

        const temporal =
            $("<div>")
                .html(textoOriginal);


        return temporal
            .text()
            .replace(/\s+/g, " ")
            .trim();

    }


    /*
     * Fallback si jQuery no está disponible.
     */

    const temporal =
        document.createElement("div");


    temporal.innerHTML =
        textoOriginal;


    return temporal
        .textContent
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

    let minutosRecorridoTotal = 0;


    const rutas = {};

    const furgones = {};

    const conductores = {};


    datos.forEach(
        function (viaje) {

            /* -----------------------------------------
             * TIEMPO TOTAL DE RECORRIDO
             * ----------------------------------------- */

            const minutosRecorrido =
                extraerMinutosPDF(
                    viaje.tiempoReal
                );


            minutosRecorridoTotal +=
                minutosRecorrido;


            /* -----------------------------------------
             * ODT
             * ----------------------------------------- */

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


            /* -----------------------------------------
             * FURGÓN
             * ----------------------------------------- */

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


            /* -----------------------------------------
             * EXCESO
             * ----------------------------------------- */

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


            /* -----------------------------------------
             * RUTA
             * ----------------------------------------- */

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


            /* -----------------------------------------
             * FURGÓN
             * ----------------------------------------- */

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


            /* -----------------------------------------
             * CONDUCTOR
             * ----------------------------------------- */

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

        }
    );


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
            .map(
                function (nombre) {

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

                }
            )
            .sort(
                function (a, b) {

                    return (
                        b.total -
                        a.total
                    );

                }
            );


    const furgonesArray =
        Object.keys(furgones)
            .map(
                function (nombre) {

                    return {

                        nombre: nombre,

                        total:
                            furgones[nombre].total,

                        cumplidos:
                            furgones[nombre].cumplidos,

                        incumplidos:
                            furgones[nombre].incumplidos

                    };

                }
            )
            .sort(
                function (a, b) {

                    return (
                        b.total -
                        a.total
                    );

                }
            );


    const conductoresArray =
        Object.keys(conductores)
            .map(
                function (nombre) {

                    return {

                        nombre: nombre,

                        total:
                            conductores[nombre].total,

                        cumplidos:
                            conductores[nombre].cumplidos,

                        incumplidos:
                            conductores[nombre].incumplidos

                    };

                }
            )
            .sort(
                function (a, b) {

                    return (
                        b.incumplidos -
                        a.incumplidos
                    );

                }
            );


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


    /* -----------------------------------------------------
     * HH:MM:SS
     * ----------------------------------------------------- */

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


    /* -----------------------------------------------------
     * HH:MM
     * ----------------------------------------------------- */

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


    /* -----------------------------------------------------
     * HORAS + MINUTOS
     * ----------------------------------------------------- */

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


    /* -----------------------------------------------------
     * SOLO HORAS
     * ----------------------------------------------------- */

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


    /* -----------------------------------------------------
     * SOLO MINUTOS
     * ----------------------------------------------------- */

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


    /* -----------------------------------------------------
     * NÚMERO PURO
     * ----------------------------------------------------- */

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


    /* -----------------------------------------------------
     * ÚLTIMO RECURSO
     * ----------------------------------------------------- */

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
            " h"
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


    y += 45;


    /* ---------------------------------------------
     * CONCLUSIÓN
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


    doc.text(
        lineasConclusion.slice(0, 1),
        xConclusion + 5,
        y + 9.5
    );

}


/* =========================================================
 * TEXTO DE FILTROS
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
     * CENTRO
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
     * INDICADORES
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
     * TABLA RUTAS
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
 * NUEVA PÁGINA - NOTAS DE VIAJES
 *
 * SOLO VIAJES QUE:
 *
 * 1. TENGAN NOTA
 * 2. ESTÉN DENTRO DEL PERÍODO
 * 3. PASEN LOS FILTROS DE LA DATATABLE
 * ========================================================= */

function dibujarNotasViajesPDF(
    doc,
    viajesConNotas,
    filtros
) {

    dibujarEncabezadoPDF(
        doc,
        "NOTAS Y CAUSAS DE INCUMPLIMIENTO",
        "Detalle de las notas registradas en los viajes del período seleccionado."
    );


    let y = 30;


    /* ---------------------------------------------
     * PERÍODO
     * --------------------------------------------- */

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


    const desde =
        filtros.fechaInicio ||
        "Sin fecha";


    const hasta =
        filtros.fechaFin ||
        "Sin fecha";


    doc.text(
        "Período: " +
        desde +
        " al " +
        hasta,
        PDF_VIAJES_CONFIG.margen,
        y
    );


    y += 5;


    /* ---------------------------------------------
     * CANTIDAD
     * --------------------------------------------- */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        9
    );


    doc.setTextColor(
        25,
        55,
        90
    );


    doc.text(
        "Viajes con notas: " +
        viajesConNotas.length,
        PDF_VIAJES_CONFIG.margen,
        y
    );


    y += 6;


    /* ---------------------------------------------
     * TABLA
     * --------------------------------------------- */

    const filas =
        viajesConNotas.map(
            function (viaje, indice) {

                const ruta =
                    (
                        viaje.origen ||
                        "Sin origen"
                    ) +
                    " -- " +
                    (
                        viaje.destino ||
                        "Sin destino"
                    );


                return [

                    String(
                        indice + 1
                    ),

                    viaje.fecha,

                    viaje.conductor,

                    viaje.placa,

                    viaje.furgon,

                    ruta,

                    viaje.estadoODT,

                    viaje.estadoFurgon,

                    viaje.tiempoExcedido,

                    viaje.notas

                ];

            }
        );


    doc.autoTable({

        startY: y,

        margin: {

            top: 28,

            bottom: 14,

            left: 7,

            right: 7

        },

        tableWidth:
            281,

        theme:
            "grid",

        head: [[

            "#",

            "Fecha",

            "Conductor",

            "Placa",

            "Furgón",

            "Ruta",

            "Estado ODT",

            "Estado Furgón",

            "Exceso",

            "Nota / causa del incumplimiento"

        ]],

        body:
            filas,

        styles: {

            font:
                "helvetica",

            fontSize:
                6.5,

            cellPadding:
                2,

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
                6.2,

            halign:
                "center",

            valign:
                "middle",

            cellPadding:
                2

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
                    18,

                halign:
                    "center"

            },

            2: {

                cellWidth:
                    30

            },

            3: {

                cellWidth:
                    17,

                halign:
                    "center"

            },

            4: {

                cellWidth:
                    20,

                halign:
                    "center"

            },

            5: {

                cellWidth:
                    35

            },

            6: {

                cellWidth:
                    20,

                halign:
                    "center"

            },

            7: {

                cellWidth:
                    23,

                halign:
                    "center"

            },

            8: {

                cellWidth:
                    18,

                halign:
                    "center"

            },

            9: {

                cellWidth:
                    93

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
                    data.column.index === 6
                ) {

                    const estado =
                        obtenerTextoPDF(
                            data.cell.text
                        ).toUpperCase();


                    if (
                        estado ===
                        "INCUMPLIDO"
                    ) {

                        data.cell.styles.textColor =
                            [
                                190,
                                45,
                                45
                            ];

                        data.cell.styles.fontStyle =
                            "bold";

                    }

                    else if (
                        estado ===
                        "CUMPLIDO"
                    ) {

                        data.cell.styles.textColor =
                            [
                                25,
                                125,
                                70
                            ];

                    }

                }


                /* -----------------------------------------
                 * ESTADO FURGÓN
                 * ----------------------------------------- */

                if (
                    data.column.index === 7
                ) {

                    const estado =
                        obtenerTextoPDF(
                            data.cell.text
                        ).toUpperCase();


                    if (
                        estado ===
                        "INCUMPLIDO"
                    ) {

                        data.cell.styles.textColor =
                            [
                                190,
                                45,
                                45
                            ];

                        data.cell.styles.fontStyle =
                            "bold";

                    }

                    else if (
                        estado ===
                        "CUMPLIDO"
                    ) {

                        data.cell.styles.textColor =
                            [
                                25,
                                125,
                                70
                            ];

                    }

                }


                /* -----------------------------------------
                 * EXCESO
                 * ----------------------------------------- */

                if (
                    data.column.index === 8
                ) {

                    const exceso =
                        obtenerTextoPDF(
                            data.cell.text
                        );


                    if (
                        exceso !== "" &&
                        exceso !== "0" &&
                        exceso !== "0 min"
                    ) {

                        data.cell.styles.textColor =
                            [
                                190,
                                45,
                                45
                            ];

                        data.cell.styles.fontStyle =
                            "bold";

                    }

                }


                /* -----------------------------------------
                 * NOTA
                 * ----------------------------------------- */

                if (
                    data.column.index === 9
                ) {

                    data.cell.styles.fontStyle =
                        "normal";

                    data.cell.styles.fontSize =
                        6.5;

                    data.cell.styles.valign =
                        "top";

                }

            },

        didDrawPage:
            function (data) {

                if (
                    data.pageNumber > 1
                ) {

                    dibujarEncabezadoPDF(
                        doc,
                        "NOTAS Y CAUSAS DE INCUMPLIMIENTO",
                        "Continuación de notas registradas."
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


        doc.setLineWidth(
            0.35
        );


        doc.setDrawColor(
            220,
            223,
            227
        );


        /* ---------------------------------------------
         * LÍNEA DEL PIE
         * --------------------------------------------- */

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


        /* ---------------------------------------------
         * TEXTO IZQUIERDO
         * --------------------------------------------- */

        doc.text(
            "Sistema de Gestión de Viajes",
            PDF_VIAJES_CONFIG.margen,
            alto - 5
        );


        /* ---------------------------------------------
         * NÚMERO DE PÁGINA
         * --------------------------------------------- */

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


