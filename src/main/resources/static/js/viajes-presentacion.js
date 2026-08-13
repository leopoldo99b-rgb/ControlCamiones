/* ============================================================
   PRESENTACIÓN EJECUTIVA DE VIAJES
   VERSIÓN COMPLETA CORREGIDA Y MEJORADA
   ============================================================ */

(function () {

    "use strict";


    /* ============================================================
       VARIABLES GLOBALES
       ============================================================ */

    let presentacion = null;

    let slideActual = 0;

    let slides = [];

    let datosViajes = [];

    let charts = [];

    let tecladoRegistrado = false;


    /* ============================================================
       CONFIGURACIÓN DE COLUMNAS
       ============================================================ */

    /*
        Estructura esperada de la tabla:

        0  -> Acción / checkbox / ID
        1  -> Fecha
        2  -> Conductor
        3  -> Placa
        4  -> Furgón
        5  -> Origen
        6  -> Destino
        7  -> Salida
        8  -> Llegada
        9  -> ODT
        10 -> Tiempo máximo
        11 -> Tiempo excedido
        12 -> Estado ODT
        13 -> Estado Furgón
        14 -> Notas / Observaciones
    */

    const COLUMNAS = {

        fecha: 1,
        conductor: 2,
        placa: 3,
        furgon: 4,
        origen: 5,
        destino: 6,
        salida: 7,
        llegada: 8,
        odt: 9,
        tiempoMaximo: 10,
        tiempoExcedido: 11,
        estadoODT: 12,
        estadoFurgon: 13,
        notas: 14

    };


    /* ============================================================
       INICIALIZACIÓN
       ============================================================ */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar
        );

    } else {

        inicializar();

    }


    function inicializar() {

        agregarEstilos();


        const btn =
            document.getElementById(
                "btnPresentacion"
            );


        if (!btn) {

            console.warn(
                "No se encontró #btnPresentacion"
            );

            return;

        }


        /*
            Evita registrar dos veces el evento
            si este script se carga más de una vez.
        */

        if (
            btn.dataset.presentacionRegistrada === "true"
        ) {

            return;

        }


        btn.dataset.presentacionRegistrada = "true";


        btn.addEventListener(
            "click",
            abrirPresentacion
        );

    }


    /* ============================================================
       ABRIR PRESENTACIÓN
       ============================================================ */

    function abrirPresentacion() {

        datosViajes =
            obtenerViajesFiltrados();


        if (!Array.isArray(datosViajes)) {

            datosViajes = [];

        }


        if (!datosViajes.length) {

            alert(
                "No existen viajes que coincidan con los filtros seleccionados."
            );

            return;

        }


        crearPresentacion();

        construirSlides();

        mostrarSlide(0);

        intentarPantallaCompleta();

    }


    /* ============================================================
       OBTENER VIAJES FILTRADOS DESDE DATATABLES
       ============================================================ */

    function obtenerViajesFiltrados() {

        try {

            /*
                Primera opción:
                variable global tablaViajes.
            */

            if (
                typeof window.tablaViajes !== "undefined" &&
                window.tablaViajes &&
                typeof window.tablaViajes.rows === "function"
            ) {

                return window.tablaViajes
                    .rows({
                        search: "applied"
                    })
                    .data()
                    .toArray();

            }


            /*
                Segunda opción:
                DataTable asociado a #tblViajes.
            */

            if (
                typeof $ !== "undefined" &&
                $.fn &&
                $.fn.DataTable &&
                $.fn.DataTable.isDataTable("#tblViajes")
            ) {

                const tabla =
                    $("#tblViajes").DataTable();


                return tabla
                    .rows({
                        search: "applied"
                    })
                    .data()
                    .toArray();

            }

        } catch (error) {

            console.error(
                "Error obteniendo viajes filtrados desde DataTables:",
                error
            );

        }


        /*
            Si DataTables no está disponible,
            usamos la tabla HTML.
        */

        return obtenerViajesDesdeTablaHTML();

    }


    /* ============================================================
       FALLBACK: LEER TABLA HTML
       ============================================================ */

    function obtenerViajesDesdeTablaHTML() {

        const filas = [];


        const filasHTML =
            document.querySelectorAll(
                "#tblViajes tbody tr"
            );


        filasHTML.forEach(
            function (tr) {

                /*
                    Ignorar filas que DataTables utiliza
                    para mensajes como "No data available".
                */

                if (
                    tr.classList.contains("child") ||
                    tr.querySelector("td.dataTables_empty")
                ) {

                    return;

                }


                const celdas =
                    tr.querySelectorAll("td");


                if (!celdas.length) {

                    return;

                }


                filas.push(
                    Array.from(celdas).map(
                        function (td) {

                            return limpiarHTML(
                                td.innerHTML
                            );

                        }
                    )
                );

            }
        );


        return filas;

    }


    /* ============================================================
       LIMPIAR HTML
       ============================================================ */

    function limpiarHTML(valor) {

        if (
            valor === null ||
            valor === undefined
        ) {

            return "";

        }


        /*
            Si ya es un número,
            no necesitamos pasar por innerHTML.
        */

        if (
            typeof valor === "number"
        ) {

            return String(valor);

        }


        const div =
            document.createElement("div");


        div.innerHTML =
            String(valor);


        return (
            div.textContent ||
            div.innerText ||
            ""
        )
            .replace(/\s+/g, " ")
            .trim();

    }


    /* ============================================================
       CREAR CONTENEDOR
       ============================================================ */

    function crearPresentacion() {

        const existente =
            document.getElementById(
                "presentacionViajes"
            );


        if (existente) {

            existente.remove();

        }


        presentacion =
            document.createElement("div");


        presentacion.id =
            "presentacionViajes";


        presentacion.setAttribute(
            "role",
            "dialog"
        );


        presentacion.setAttribute(
            "aria-modal",
            "true"
        );


        presentacion.innerHTML = `

            <div class="pv-background"></div>


            <header class="pv-header">

                <div class="pv-brand">

                    <div class="pv-brand-icon">

                        <i class="bi bi-truck"></i>

                    </div>


                    <div>

                        <strong>
                            REPORTE EJECUTIVO
                        </strong>

                        <small>
                            Gestión y Control de Viajes
                        </small>

                    </div>

                </div>


                <div class="pv-header-actions">

                    <button
                        id="pvFullscreen"
                        type="button"
                        title="Pantalla completa"
                        aria-label="Pantalla completa">

                        <i class="bi bi-fullscreen"></i>

                    </button>


                    <button
                        id="pvCerrar"
                        type="button"
                        title="Cerrar presentación"
                        aria-label="Cerrar presentación">

                        <i class="bi bi-x-lg"></i>

                    </button>

                </div>

            </header>


            <main
                id="pvSlides"
                class="pv-slides">
            </main>


            <button
                id="pvAnterior"
                type="button"
                class="pv-navigation pv-prev"
                title="Diapositiva anterior"
                aria-label="Diapositiva anterior">

                <i class="bi bi-chevron-left"></i>

            </button>


            <button
                id="pvSiguiente"
                type="button"
                class="pv-navigation pv-next"
                title="Siguiente diapositiva"
                aria-label="Siguiente diapositiva">

                <i class="bi bi-chevron-right"></i>

            </button>


            <footer class="pv-footer">

                <div
                    id="pvProgress"
                    class="pv-progress">
                </div>


                <div
                    id="pvCounter"
                    class="pv-counter">
                </div>

            </footer>

        `;


        document.body.appendChild(
            presentacion
        );


        const btnCerrar =
            document.getElementById(
                "pvCerrar"
            );


        const btnAnterior =
            document.getElementById(
                "pvAnterior"
            );


        const btnSiguiente =
            document.getElementById(
                "pvSiguiente"
            );


        const btnFullscreen =
            document.getElementById(
                "pvFullscreen"
            );


        if (btnCerrar) {

            btnCerrar.addEventListener(
                "click",
                cerrarPresentacion
            );

        }


        if (btnAnterior) {

            btnAnterior.addEventListener(
                "click",
                function () {

                    cambiarSlide(-1);

                }
            );

        }


        if (btnSiguiente) {

            btnSiguiente.addEventListener(
                "click",
                function () {

                    cambiarSlide(1);

                }
            );

        }


        if (btnFullscreen) {

            btnFullscreen.addEventListener(
                "click",
                alternarPantallaCompleta
            );

        }


        /*
            El listener de teclado solamente se registra
            una vez para toda la vida del script.
        */

        if (!tecladoRegistrado) {

            document.addEventListener(
                "keydown",
                controlarTeclado
            );

            tecladoRegistrado = true;

        }


        document.body.style.overflow =
            "hidden";

    }


    /* ============================================================
       CONSTRUIR SLIDES
       ============================================================ */

    function construirSlides() {

        slides = [];


        const resumen =
            calcularResumen();


        slides.push(
            crearSlidePortada(resumen)
        );


        slides.push(
            crearSlideResumen(resumen)
        );


        slides.push(
            crearSlideCumplimiento(resumen)
        );


        slides.push(
            crearSlideRutas(resumen)
        );


        slides.push(
            crearSlideConductores(resumen)
        );


        slides.push(
            crearSlideTiempos(resumen)
        );


        slides.push(
            crearSlideIncidencias(resumen)
        );


        slides.push(
            crearSlideDetalle(resumen)
        );


        slides.push(
            crearSlideConclusiones(resumen)
        );


        const contenedor =
            document.getElementById(
                "pvSlides"
            );


        if (contenedor) {

            contenedor.innerHTML =
                slides.join("");

        }

    }


    /* ============================================================
       OBTENER NOTA / OBSERVACIÓN
       ============================================================ */

    function obtenerNotaViaje(row) {

        /*
            ========================================================
            CASO 1: DATA DESDE OBJETO
            ========================================================
        */

        if (
            row &&
            !Array.isArray(row) &&
            typeof row === "object"
        ) {

            /*
                Se prueban varios nombres posibles porque
                dependiendo de cómo se haya construido DataTables
                el campo puede llamarse diferente.
            */

            const posiblesCampos = [

                "notas",
                "nota",
                "observaciones",
                "observacion",
                "comentarios",
                "comentario",
                "Notas",
                "Nota",
                "Observaciones",
                "Observacion",
                "Comentarios",
                "Comentario"

            ];


            for (
                let i = 0;
                i < posiblesCampos.length;
                i++
            ) {

                const campo =
                    posiblesCampos[i];


                if (
                    Object.prototype.hasOwnProperty.call(
                        row,
                        campo
                    )
                ) {

                    const valor =
                        limpiarHTML(
                            row[campo]
                        );


                    if (valor) {

                        return valor;

                    }

                }

            }


            return "";

        }


        /*
            ========================================================
            CASO 2: DATA DESDE ARRAY
            ========================================================
        */

        if (Array.isArray(row)) {

            /*
                Primero intentamos la posición configurada.
            */

            if (
                row.length >
                COLUMNAS.notas
            ) {

                const nota =
                    limpiarHTML(
                        row[COLUMNAS.notas]
                    );


                if (nota) {

                    return nota;

                }

            }


            /*
                Fallback:
                si la estructura cambió, buscamos una columna
                cuyo encabezado sea Nota / Observación / Comentario.
            */

            const indice =
                buscarIndiceColumnaNotas();


            if (
                indice !== -1 &&
                row.length > indice
            ) {

                return limpiarHTML(
                    row[indice]
                );

            }

        }


        return "";

    }


    /* ============================================================
       BUSCAR COLUMNA DE NOTAS POR ENCABEZADO
       ============================================================ */

    function buscarIndiceColumnaNotas() {

        const encabezados =
            document.querySelectorAll(
                "#tblViajes thead th"
            );


        if (!encabezados.length) {

            return -1;

        }


        for (
            let i = 0;
            i < encabezados.length;
            i++
        ) {

            const texto =
                limpiarHTML(
                    encabezados[i].innerHTML
                )
                    .toUpperCase();


            if (
                texto.includes("NOTA") ||
                texto.includes("OBSERV") ||
                texto.includes("COMENT")
            ) {

                return i;

            }

        }


        return -1;

    }


    /* ============================================================
       NORMALIZAR DATOS
       ============================================================ */

    function normalizarViaje(row) {

        /*
            ========================================================
            DATA COMO ARRAY
            ========================================================
        */

        if (Array.isArray(row)) {

            return {

                fecha:
                    limpiarHTML(
                        row[COLUMNAS.fecha]
                    ),


                conductor:
                    limpiarHTML(
                        row[COLUMNAS.conductor]
                    ),


                placa:
                    limpiarHTML(
                        row[COLUMNAS.placa]
                    ),


                furgon:
                    limpiarHTML(
                        row[COLUMNAS.furgon]
                    ),


                origen:
                    limpiarHTML(
                        row[COLUMNAS.origen]
                    ),


                destino:
                    limpiarHTML(
                        row[COLUMNAS.destino]
                    ),


                salida:
                    limpiarHTML(
                        row[COLUMNAS.salida]
                    ),


                llegada:
                    limpiarHTML(
                        row[COLUMNAS.llegada]
                    ),


                odt:
                    limpiarHTML(
                        row[COLUMNAS.odt]
                    ),


                tiempoMaximo:
                    limpiarHTML(
                        row[COLUMNAS.tiempoMaximo]
                    ),


                tiempoExcedido:
                    limpiarHTML(
                        row[COLUMNAS.tiempoExcedido]
                    ),


                estadoODT:
                    limpiarHTML(
                        row[COLUMNAS.estadoODT]
                    ),


                estadoFurgon:
                    limpiarHTML(
                        row[COLUMNAS.estadoFurgon]
                    ),


                notas:
                    obtenerNotaViaje(row)

            };

        }


        /*
            ========================================================
            DATA COMO OBJETO
            ========================================================
        */

        if (
            row &&
            typeof row === "object"
        ) {

            return {

                fecha:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "fecha",
                                "Fecha"
                            ]
                        )
                    ),


                conductor:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "conductor",
                                "Conductor"
                            ]
                        )
                    ),


                placa:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "placa",
                                "Placa"
                            ]
                        )
                    ),


                furgon:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "furgon",
                                "Furgon",
                                "furgón",
                                "Furgón"
                            ]
                        )
                    ),


                origen:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "origen",
                                "Origen"
                            ]
                        )
                    ),


                destino:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "destino",
                                "Destino"
                            ]
                        )
                    ),


                salida:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "salida",
                                "Salida"
                            ]
                        )
                    ),


                llegada:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "llegada",
                                "Llegada"
                            ]
                        )
                    ),


                odt:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "odt",
                                "ODT"
                            ]
                        )
                    ),


                tiempoMaximo:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "tiempoMaximo",
                                "tiempo_maximo",
                                "TiempoMaximo",
                                "Tiempo máximo"
                            ]
                        )
                    ),


                tiempoExcedido:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "tiempoExcedido",
                                "tiempo_excedido",
                                "TiempoExcedido",
                                "Tiempo excedido"
                            ]
                        )
                    ),


                estadoODT:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "estadoODT",
                                "estadoOdt",
                                "estado_odt",
                                "EstadoODT",
                                "estado"
                            ]
                        )
                    ),


                estadoFurgon:
                    limpiarHTML(
                        obtenerPropiedad(
                            row,
                            [
                                "estadoFurgon",
                                "estadoFurgón",
                                "estado_furgon",
                                "EstadoFurgon",
                                "Estado Furgón"
                            ]
                        )
                    ),


                notas:
                    obtenerNotaViaje(row)

            };

        }


        /*
            Estructura desconocida.
        */

        return {

            fecha: "",
            conductor: "",
            placa: "",
            furgon: "",
            origen: "",
            destino: "",
            salida: "",
            llegada: "",
            odt: "",
            tiempoMaximo: "",
            tiempoExcedido: "",
            estadoODT: "",
            estadoFurgon: "",
            notas: ""

        };

    }


    /* ============================================================
       OBTENER PROPIEDAD DE OBJETO
       ============================================================ */

    function obtenerPropiedad(
        objeto,
        propiedades
    ) {

        if (
            !objeto ||
            typeof objeto !== "object"
        ) {

            return "";

        }


        for (
            let i = 0;
            i < propiedades.length;
            i++
        ) {

            const propiedad =
                propiedades[i];


            if (
                Object.prototype.hasOwnProperty.call(
                    objeto,
                    propiedad
                )
            ) {

                const valor =
                    objeto[propiedad];


                if (
                    valor !== null &&
                    valor !== undefined
                ) {

                    return valor;

                }

            }

        }


        return "";

    }


    /* ============================================================
       RESUMEN
       ============================================================ */

    function calcularResumen() {

        const viajes =
            datosViajes
                .map(normalizarViaje)
                .filter(
                    v =>
                        v &&
                        typeof v === "object"
                );


        const total =
            viajes.length;


        const odtCumplidos =
            viajes.filter(
                v =>
                    normalizarEstado(
                        v.estadoODT
                    ) === "CUMPLIDO"
            ).length;


        const odtIncumplidos =
            viajes.filter(
                v =>
                    normalizarEstado(
                        v.estadoODT
                    ) === "INCUMPLIDO"
            ).length;


        const furgonCumplidos =
            viajes.filter(
                v =>
                    normalizarEstado(
                        v.estadoFurgon
                    ) === "CUMPLIDO"
            ).length;


        const furgonIncumplidos =
            viajes.filter(
                v =>
                    normalizarEstado(
                        v.estadoFurgon
                    ) === "INCUMPLIDO"
            ).length;


        const porcentajeODT =
            total
                ? (odtCumplidos / total) * 100
                : 0;


        const porcentajeFurgon =
            total
                ? (furgonCumplidos / total) * 100
                : 0;


        const excedidos =
            viajes.filter(
                v =>
                    parseNumero(
                        v.tiempoExcedido
                    ) > 0
            );


        const promedioExcedido =
            excedidos.length

                ? excedidos.reduce(
                    function (
                        sum,
                        v
                    ) {

                        return (
                            sum +
                            parseNumero(
                                v.tiempoExcedido
                            )
                        );

                    },
                    0
                ) / excedidos.length

                : 0;


        const incumplimientosConNota =
            viajes.filter(
                v =>

                    normalizarEstado(
                        v.estadoODT
                    ) === "INCUMPLIDO"

                    &&

                    String(
                        v.notas ?? ""
                    ).trim() !== ""

            ).length;


        const incumplimientosConExcedencia =
            viajes.filter(
                v =>

                    normalizarEstado(
                        v.estadoODT
                    ) === "INCUMPLIDO"

                    &&

                    parseNumero(
                        v.tiempoExcedido
                    ) > 0

            ).length;


        const incumplimientosFurgon =
            viajes.filter(
                v =>
                    normalizarEstado(
                        v.estadoFurgon
                    ) === "INCUMPLIDO"
            ).length;


        return {

            viajes,

            total,

            odtCumplidos,

            odtIncumplidos,

            furgonCumplidos,

            furgonIncumplidos,

            porcentajeODT,

            porcentajeFurgon,

            excedidos,

            promedioExcedido,

            incumplimientosConNota,

            incumplimientosConExcedencia,

            incumplimientosFurgon,

            fechaInicio:
                obtenerFechaMin(viajes),

            fechaFin:
                obtenerFechaMax(viajes)

        };

    }


    /* ============================================================
       PORTADA
       ============================================================ */

    function crearSlidePortada(r) {

        return `

        <section class="pv-slide pv-cover">

            <div class="pv-cover-content">

                <div class="pv-cover-icon">

                    <i class="bi bi-truck-front-fill"></i>

                </div>


                <span class="pv-eyebrow">
                    INFORME EJECUTIVO
                </span>


                <h1>
                    Gestión de Viajes
                </h1>


                <p class="pv-cover-subtitle">

                    Análisis operativo y cumplimiento
                    de viajes realizados

                </p>


                <div class="pv-period">

                    <i class="bi bi-calendar3"></i>

                    <span>
                        ${escapeHTML(
                            formatearPeriodo(
                                r.fechaInicio,
                                r.fechaFin
                            )
                        )}
                    </span>

                </div>


                <div class="pv-cover-stat">

                    <strong>
                        ${r.total}
                    </strong>

                    <span>
                        viajes analizados
                    </span>

                </div>

            </div>

        </section>

        `;

    }


    /* ============================================================
       RESUMEN EJECUTIVO
       ============================================================ */

    function crearSlideResumen(r) {

        return `

        <section class="pv-slide">

            ${tituloSlide(
                "Resumen ejecutivo",
                "Panorama general del período seleccionado",
                "bi-speedometer2"
            )}


            <div class="pv-kpi-grid">

                ${kpi(
                    "Total de viajes",
                    r.total,
                    "bi-truck",
                    "primary"
                )}


                ${kpi(
                    "ODT cumplidos",
                    r.odtCumplidos,
                    "bi-check-circle",
                    "success"
                )}


                ${kpi(
                    "ODT incumplidos",
                    r.odtIncumplidos,
                    "bi-x-circle",
                    "danger"
                )}


                ${kpi(
                    "Cumplimiento ODT",
                    r.porcentajeODT.toFixed(1) + "%",
                    "bi-percent",
                    "success"
                )}


                ${kpi(
                    "Furgón cumplido",
                    r.furgonCumplidos,
                    "bi-box-seam",
                    "info"
                )}


                ${kpi(
                    "Furgón incumplido",
                    r.furgonIncumplidos,
                    "bi-exclamation-circle",
                    "warning"
                )}

            </div>


            <div class="pv-summary-message">

                <div class="pv-summary-icon">

                    <i class="bi bi-bar-chart-line-fill"></i>

                </div>


                <div>

                    <strong>
                        Resultado del período
                    </strong>


                    <p>

                        Se analizaron
                        <b>${r.total}</b>
                        viajes durante el período seleccionado.

                        El cumplimiento ODT alcanzó
                        <b>${r.porcentajeODT.toFixed(1)}%</b>,

                        registrándose
                        <b>${r.odtIncumplidos}</b>
                        incumplimientos.

                        De estos,
                        <b>${r.incumplimientosConExcedencia}</b>
                        presentaron excedencia de tiempo y
                        <b>${r.incumplimientosConNota}</b>
                        cuentan con observaciones registradas.

                    </p>

                </div>

            </div>

        </section>

        `;

    }


    /* ============================================================
       CUMPLIMIENTO
       ============================================================ */

    function crearSlideCumplimiento(r) {

        return `

        <section class="pv-slide">

            ${tituloSlide(
                "Cumplimiento operativo",
                "Comparación entre viajes cumplidos e incumplidos",
                "bi-pie-chart-fill"
            )}


            <div class="pv-chart-layout">

                <div class="pv-chart-card">

                    <h3>
                        Cumplimiento ODT
                    </h3>


                    <div class="pv-chart-container">

                        <canvas id="chartODT"></canvas>

                    </div>

                </div>


                <div class="pv-chart-card">

                    <h3>
                        Cumplimiento de Furgón
                    </h3>


                    <div class="pv-chart-container">

                        <canvas id="chartFurgon"></canvas>

                    </div>

                </div>

            </div>

        </section>

        `;

    }


    /* ============================================================
       RUTAS
       ============================================================ */

    function crearSlideRutas(r) {

        const rutas =
            agrupar(
                r.viajes,
                function (v) {

                    return (
                        `${v.origen || "Sin origen"} → ` +
                        `${v.destino || "Sin destino"}`
                    );

                }
            );


        const ranking =
            Object.entries(rutas)
                .sort(
                    function (a, b) {

                        return (
                            b[1].total -
                            a[1].total
                        );

                    }
                )
                .slice(0, 8);


        return `

        <section class="pv-slide">

            ${tituloSlide(
                "Análisis de rutas",
                "Distribución de viajes por origen y destino",
                "bi-signpost-split"
            )}


            <div class="pv-ranking">

                ${
                    ranking.length

                        ? ranking.map(
                            function (
                                [ruta, info],
                                index
                            ) {

                                return `

                                <div class="pv-ranking-row">

                                    <div class="pv-ranking-number">
                                        ${index + 1}
                                    </div>


                                    <div class="pv-ranking-info">

                                        <strong>
                                            ${escapeHTML(ruta)}
                                        </strong>


                                        <div class="pv-ranking-bar">

                                            <span
                                                style="
                                                    width:${porcentaje(
                                                        info.total,
                                                        r.total
                                                    )}%
                                                "
                                            ></span>

                                        </div>

                                    </div>


                                    <div class="pv-ranking-value">

                                        ${info.total}

                                        <small>
                                            viajes
                                        </small>

                                    </div>

                                </div>

                                `;

                            }
                        ).join("")

                        : `

                            <div class="pv-empty-small">

                                <i class="bi bi-signpost-split"></i>

                                <p>
                                    No hay información de rutas disponible.
                                </p>

                            </div>

                        `
                }

            </div>

        </section>

        `;

    }


    /* ============================================================
       CONDUCTORES
       ============================================================ */

    function crearSlideConductores(r) {

        const conductores =
            agrupar(
                r.viajes,
                function (v) {

                    return v.conductor ||
                        "Sin conductor";

                }
            );


        const ranking =
            Object.entries(conductores)
                .map(
                    function (
                        [nombre, info]
                    ) {

                        const cumplidos =
                            info.viajes.filter(
                                function (v) {

                                    return (
                                        normalizarEstado(
                                            v.estadoODT
                                        ) === "CUMPLIDO"
                                    );

                                }
                            ).length;


                        return {

                            nombre,

                            total:
                                info.total,

                            cumplidos,

                            porcentaje:
                                info.total
                                    ? (
                                        cumplidos /
                                        info.total
                                    ) * 100
                                    : 0

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
                )
                .slice(0, 8);


        return `

        <section class="pv-slide">

            ${tituloSlide(
                "Desempeño por conductor",
                "Viajes y cumplimiento ODT",
                "bi-person-badge-fill"
            )}


            <div class="pv-table-wrapper">

                <table class="pv-table">

                    <thead>

                        <tr>

                            <th>#</th>

                            <th>Conductor</th>

                            <th>Viajes</th>

                            <th>Cumplidos</th>

                            <th>Cumplimiento</th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            ranking.length

                                ? ranking.map(
                                    function (
                                        c,
                                        i
                                    ) {

                                        return `

                                        <tr>

                                            <td>
                                                ${i + 1}
                                            </td>


                                            <td>

                                                <strong>
                                                    ${escapeHTML(
                                                        c.nombre
                                                    )}
                                                </strong>

                                            </td>


                                            <td>
                                                ${c.total}
                                            </td>


                                            <td>
                                                ${c.cumplidos}
                                            </td>


                                            <td>

                                                <span
                                                    class="
                                                        pv-percentage
                                                        ${clasePorcentaje(
                                                            c.porcentaje
                                                        )}
                                                    "
                                                >

                                                    ${c.porcentaje.toFixed(1)}%

                                                </span>

                                            </td>

                                        </tr>

                                        `;

                                    }
                                ).join("")

                                : `

                                    <tr>

                                        <td
                                            colspan="5"
                                            class="pv-no-data"
                                        >
                                            No hay conductores disponibles.
                                        </td>

                                    </tr>

                                `
                        }

                    </tbody>

                </table>

            </div>

        </section>

        `;

    }


    /* ============================================================
       TIEMPOS
       ============================================================ */

    function crearSlideTiempos(r) {

        const tiemposMaximos =
            r.viajes.map(
                function (v) {

                    return parseNumero(
                        v.tiempoMaximo
                    );

                }
            );


        const maximo =
            tiemposMaximos.length
                ? Math.max(
                    ...tiemposMaximos,
                    0
                )
                : 0;


        const excedido =
            r.promedioExcedido;


        return `

        <section class="pv-slide">

            ${tituloSlide(
                "Control de tiempos",
                "Análisis de cumplimiento de tiempos establecidos",
                "bi-stopwatch-fill"
            )}


            <div class="pv-time-grid">

                ${kpi(
                    "Viajes con excedencia",
                    r.excedidos.length,
                    "bi-clock-history",
                    "danger"
                )}


                ${kpi(
                    "Excedencia promedio",
                    excedido.toFixed(1) + " min",
                    "bi-hourglass-split",
                    "warning"
                )}


                ${kpi(
                    "Mayor tiempo máximo",
                    maximo + " min",
                    "bi-clock",
                    "info"
                )}

            </div>


            <div class="pv-time-message">

                <i class="bi bi-info-circle-fill"></i>


                <div>

                    <strong>
                        Control de tiempos
                    </strong>


                    <p>

                        De los
                        <b>${r.total}</b>
                        viajes analizados,
                        <b>${r.excedidos.length}</b>
                        presentaron algún tiempo
                        excedido respecto al tiempo
                        establecido.

                    </p>

                </div>

            </div>

        </section>

        `;

    }


    /* ============================================================
       INCIDENCIAS / INCUMPLIMIENTOS
       ============================================================ */

    function crearSlideIncidencias(r) {

        const incidencias =
            r.viajes.filter(
                function (v) {

                    return (
                        normalizarEstado(
                            v.estadoODT
                        ) === "INCUMPLIDO"
                    );

                }
            );


        if (!incidencias.length) {

            return `

            <section class="pv-slide">

                ${tituloSlide(
                    "Incidencias y observaciones",
                    "Viajes que requieren atención o seguimiento",
                    "bi-shield-check"
                )}


                <div class="pv-empty">

                    <i class="bi bi-check-circle-fill"></i>


                    <h2>
                        Sin incumplimientos registrados
                    </h2>


                    <p>

                        No se registraron viajes con
                        incumplimiento ODT durante
                        el período seleccionado.

                    </p>

                </div>

            </section>

            `;

        }


        const conExcedencia =
            incidencias.filter(
                function (v) {

                    return (
                        parseNumero(
                            v.tiempoExcedido
                        ) > 0
                    );

                }
            ).length;


        const conNota =
            incidencias.filter(
                function (v) {

                    return (
                        String(
                            v.notas ?? ""
                        ).trim() !== ""
                    );

                }
            ).length;


        return `

        <section class="pv-slide">

            ${tituloSlide(
                "Incidencias y observaciones",
                `${incidencias.length} viaje${incidencias.length !== 1 ? "s" : ""} con incumplimiento ODT`,
                "bi-exclamation-triangle-fill"
            )}


            <div class="pv-incidencias-resumen">

                <div class="pv-incidencia-total">

                    <span>
                        Incumplimientos detectados
                    </span>

                    <strong>
                        ${incidencias.length}
                    </strong>

                </div>


                <div class="pv-incidencia-total">

                    <span>
                        Con excedencia de tiempo
                    </span>

                    <strong>
                        ${conExcedencia}
                    </strong>

                </div>


                <div class="pv-incidencia-total">

                    <span>
                        Con observación registrada
                    </span>

                    <strong>
                        ${conNota}
                    </strong>

                </div>

            </div>


            <div class="pv-incidencias">

                ${
                    incidencias
                        .slice(0, 8)
                        .map(
                            function (
                                v,
                                index
                            ) {

                                const nota =
                                    String(
                                        v.notas ?? ""
                                    ).trim();


                                const excedido =
                                    parseNumero(
                                        v.tiempoExcedido
                                    );


                                const estadoFurgon =
                                    normalizarEstado(
                                        v.estadoFurgon
                                    );


                                return `

                                <div
                                    class="
                                        pv-incidencia
                                        pv-incidencia-destacada
                                    "
                                >

                                    <div class="pv-incidencia-number">

                                        ${index + 1}

                                    </div>


                                    <div class="pv-incidencia-content">

                                        <div class="pv-incidencia-top">

                                            <div>

                                                <strong
                                                    class="
                                                        pv-incidencia-conductor
                                                    "
                                                >

                                                    ${escapeHTML(
                                                        v.conductor ||
                                                        "Sin conductor"
                                                    )}

                                                </strong>


                                                <span
                                                    class="
                                                        pv-incidencia-fecha
                                                    "
                                                >

                                                    ${escapeHTML(
                                                        v.fecha ||
                                                        "Sin fecha"
                                                    )}

                                                </span>

                                            </div>


                                            <span
                                                class="
                                                    pv-incidencia-badge
                                                "
                                            >

                                                <i
                                                    class="
                                                        bi
                                                        bi-x-circle-fill
                                                    "
                                                ></i>

                                                INCUMPLIDO

                                            </span>

                                        </div>


                                        <div
                                            class="
                                                pv-incidencia-ruta
                                            "
                                        >

                                            <span>
                                                ${escapeHTML(
                                                    v.origen ||
                                                    "Origen"
                                                )}
                                            </span>


                                            <i
                                                class="
                                                    bi
                                                    bi-arrow-right
                                                "
                                            ></i>


                                            <span>
                                                ${escapeHTML(
                                                    v.destino ||
                                                    "Destino"
                                                )}
                                            </span>

                                        </div>


                                        <div
                                            class="
                                                pv-incidencia-datos
                                            "
                                        >

                                            <div>

                                                <small>
                                                    PLACA
                                                </small>


                                                <strong>
                                                    ${escapeHTML(
                                                        v.placa ||
                                                        "—"
                                                    )}
                                                </strong>

                                            </div>


                                            <div>

                                                <small>
                                                    FURGÓN
                                                </small>


                                                <strong
                                                    class="
                                                        ${
                                                            estadoFurgon ===
                                                            "INCUMPLIDO"

                                                                ? "pv-text-danger"

                                                                : "pv-text-success"
                                                        }
                                                    "
                                                >

                                                    ${escapeHTML(
                                                        v.estadoFurgon ||
                                                        "SIN REGISTRO"
                                                    )}

                                                </strong>

                                            </div>


                                            <div>

                                                <small>
                                                    EXCEDENCIA
                                                </small>


                                                <strong
                                                    class="
                                                        ${
                                                            excedido > 0

                                                                ? "pv-text-danger"

                                                                : "pv-text-success"
                                                        }
                                                    "
                                                >

                                                    ${
                                                        excedido > 0

                                                            ? excedido + " min"

                                                            : "Sin excedencia"
                                                    }

                                                </strong>

                                            </div>


                                            <div>

                                                <small>
                                                    ODT
                                                </small>


                                                <strong>
                                                    ${escapeHTML(
                                                        v.odt ||
                                                        "—"
                                                    )}
                                                </strong>

                                            </div>

                                        </div>


                                        <div
                                            class="
                                                pv-incidencia-nota
                                            "
                                        >

                                            <div
                                                class="
                                                    pv-nota-icon
                                                "
                                            >

                                                <i
                                                    class="
                                                        bi
                                                        bi-chat-left-text-fill
                                                    "
                                                ></i>

                                            </div>


                                            <div>

                                                <small>
                                                    NOTA / OBSERVACIÓN
                                                </small>


                                                <p>

                                                    ${
                                                        escapeHTML(
                                                            nota ||
                                                            "Sin observación registrada."
                                                        )
                                                    }

                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                                `;

                            }
                        )
                        .join("")
                }

            </div>


            ${
                incidencias.length > 8

                    ? `

                    <div class="pv-incidencias-mas">

                        <i class="bi bi-info-circle"></i>

                        Se muestran los primeros
                        8 incumplimientos.
                        El detalle completo permanece
                        disponible en el registro de viajes.

                    </div>

                    `

                    : ""
            }

        </section>

        `;

    }


    /* ============================================================
       DETALLE DEL PERÍODO
       ============================================================ */

    function crearSlideDetalle(r) {

        return `

        <section class="pv-slide">

            ${tituloSlide(
                "Detalle del período",
                "Registro completo de viajes incluidos en este informe",
                "bi-list-columns-reverse"
            )}


            <div class="pv-detail-scroll">

                <table
                    class="
                        pv-table
                        pv-detail-table
                    "
                >

                    <thead>

                        <tr>

                            <th>
                                Fecha
                            </th>

                            <th>
                                Conductor
                            </th>

                            <th>
                                Ruta
                            </th>

                            <th>
                                Furgón
                            </th>

                            <th>
                                ODT
                            </th>

                            <th>
                                Estado
                            </th>

                            <th>
                                Observación
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            r.viajes.length

                                ? r.viajes.map(
                                    function (v) {

                                        return `

                                        <tr>

                                            <td>
                                                ${escapeHTML(
                                                    v.fecha
                                                )}
                                            </td>


                                            <td>
                                                ${escapeHTML(
                                                    v.conductor
                                                )}
                                            </td>


                                            <td>

                                                ${escapeHTML(
                                                    v.origen
                                                )}

                                                <i
                                                    class="
                                                        bi
                                                        bi-arrow-right
                                                    "
                                                ></i>

                                                ${escapeHTML(
                                                    v.destino
                                                )}

                                            </td>


                                            <td>
                                                ${escapeHTML(
                                                    v.furgon
                                                )}
                                            </td>


                                            <td>
                                                ${escapeHTML(
                                                    v.odt
                                                )}
                                            </td>


                                            <td>

                                                <span
                                                    class="
                                                        pv-status
                                                        ${estadoClase(
                                                            v.estadoODT
                                                        )}
                                                    "
                                                >

                                                    ${escapeHTML(
                                                        v.estadoODT ||
                                                        "SIN REGISTRO"
                                                    )}

                                                </span>

                                            </td>


                                            <td
                                                class="
                                                    pv-detail-note
                                                "
                                            >

                                                ${
                                                    v.notas

                                                        ? escapeHTML(
                                                            v.notas
                                                        )

                                                        : `<span class="pv-no-note">
                                                            Sin observación
                                                          </span>`
                                                }

                                            </td>

                                        </tr>

                                        `;

                                    }
                                ).join("")

                                : `

                                    <tr>

                                        <td
                                            colspan="7"
                                            class="pv-no-data"
                                        >
                                            No hay viajes disponibles.
                                        </td>

                                    </tr>

                                `
                        }

                    </tbody>

                </table>

            </div>

        </section>

        `;

    }


    /* ============================================================
       CONCLUSIONES
       ============================================================ */

    function crearSlideConclusiones(r) {

        const nivel =
            obtenerNivelCumplimiento(
                r.porcentajeODT
            );


        return `

        <section class="pv-slide pv-conclusion">

            ${tituloSlide(
                "Conclusiones ejecutivas",
                "Resultado general del período evaluado",
                "bi-clipboard2-check-fill"
            )}


            <div class="pv-conclusion-score">

                <span>
                    Cumplimiento ODT
                </span>


                <strong>
                    ${r.porcentajeODT.toFixed(1)}%
                </strong>


                <div class="pv-score-bar">

                    <span
                        style="
                            width:${Math.min(
                                Math.max(
                                    r.porcentajeODT,
                                    0
                                ),
                                100
                            )}%
                        "
                    ></span>

                </div>


                <small>
                    ${nivel}
                </small>

            </div>


            <div class="pv-conclusion-grid">

                <div>

                    <i class="bi bi-check-circle-fill"></i>

                    <strong>
                        ${r.odtCumplidos}
                    </strong>

                    <span>
                        viajes ODT cumplidos
                    </span>

                </div>


                <div>

                    <i class="bi bi-x-circle-fill"></i>

                    <strong>
                        ${r.odtIncumplidos}
                    </strong>

                    <span>
                        viajes ODT incumplidos
                    </span>

                </div>


                <div>

                    <i class="bi bi-clock-fill"></i>

                    <strong>
                        ${r.excedidos.length}
                    </strong>

                    <span>
                        viajes con excedencia
                    </span>

                </div>

            </div>


            <div class="pv-final-message">

                <i class="bi bi-bar-chart-fill"></i>


                <p>

                    El período presenta un nivel de
                    cumplimiento ODT del

                    <strong>
                        ${r.porcentajeODT.toFixed(1)}%
                    </strong>,

                    con

                    <strong>
                        ${r.total}
                    </strong>

                    viajes analizados.

                    Se identificaron

                    <strong>
                        ${r.odtIncumplidos}
                    </strong>

                    incumplimientos ODT.

                    De ellos,

                    <strong>
                        ${r.incumplimientosConNota}
                    </strong>

                    cuentan con observaciones registradas

                    y

                    <strong>
                        ${r.incumplimientosConExcedencia}
                    </strong>

                    presentaron excedencia de tiempo.

                    Se recomienda mantener el seguimiento
                    de los casos incumplidos y utilizar las
                    observaciones registradas como base para
                    identificar causas recurrentes y acciones
                    de mejora.

                </p>

            </div>


            <div class="pv-final">

                <strong>
                    FIN DEL INFORME
                </strong>

                <span>
                    Gestión y Control de Viajes
                </span>

            </div>

        </section>

        `;

    }


    /* ============================================================
       TÍTULO DE SLIDE
       ============================================================ */

    function tituloSlide(
        titulo,
        subtitulo,
        icono
    ) {

        return `

            <div class="pv-slide-title">

                <div class="pv-slide-title-icon">

                    <i class="bi ${icono}"></i>

                </div>


                <div>

                    <h2>
                        ${escapeHTML(titulo)}
                    </h2>


                    <p>
                        ${escapeHTML(subtitulo)}
                    </p>

                </div>

            </div>

        `;

    }


    /* ============================================================
       KPI
       ============================================================ */

    function kpi(
        titulo,
        valor,
        icono,
        color
    ) {

        return `

            <div class="pv-kpi pv-${escapeHTML(color)}">

                <div class="pv-kpi-icon">

                    <i class="bi ${icono}"></i>

                </div>


                <div>

                    <span>
                        ${escapeHTML(titulo)}
                    </span>


                    <strong>
                        ${escapeHTML(valor)}
                    </strong>

                </div>

            </div>

        `;

    }


    /* ============================================================
       NAVEGACIÓN
       ============================================================ */

    function mostrarSlide(indice) {

        if (!presentacion) {

            return;

        }


        if (!slides.length) {

            return;

        }


        slideActual =
            Math.max(
                0,
                Math.min(
                    Number(indice) || 0,
                    slides.length - 1
                )
            );


        document
            .querySelectorAll(
                "#pvSlides .pv-slide"
            )
            .forEach(
                function (
                    slide,
                    index
                ) {

                    slide.classList.toggle(
                        "active",
                        index === slideActual
                    );

                }
            );


        actualizarControles();


        /*
            Slide 2 = Cumplimiento.
        */

        if (slideActual === 2) {

            setTimeout(
                crearGraficos,
                120
            );

        }

    }


    function cambiarSlide(direccion) {

        if (!slides.length) {

            return;

        }


        mostrarSlide(
            slideActual +
            direccion
        );

    }


    function actualizarControles() {

        const counter =
            document.getElementById(
                "pvCounter"
            );


        if (counter) {

            counter.textContent =
                `${slideActual + 1} / ${slides.length}`;

        }


        const progress =
            document.getElementById(
                "pvProgress"
            );


        if (!progress) {

            return;

        }


        progress.innerHTML =
            slides.map(
                function (_, i) {

                    return `

                        <button
                            type="button"
                            class="
                                ${i === slideActual
                                    ? "active"
                                    : ""}
                            "
                            data-slide="${i}"
                            title="Ir a diapositiva ${i + 1}"
                            aria-label="Ir a diapositiva ${i + 1}">
                        </button>

                    `;

                }
            ).join("");


        progress
            .querySelectorAll("button")
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            mostrarSlide(
                                Number(
                                    this.dataset.slide
                                )
                            );

                        }
                    );

                }
            );

    }


    /* ============================================================
       TECLADO
       ============================================================ */

    function controlarTeclado(e) {

        if (!presentacion) {

            return;

        }


        /*
            Si el usuario está escribiendo en un input,
            textarea o elemento editable, no interceptamos
            las teclas de navegación.
        */

        const objetivo =
            e.target;


        if (
            objetivo &&
            (
                objetivo.tagName === "INPUT" ||
                objetivo.tagName === "TEXTAREA" ||
                objetivo.tagName === "SELECT" ||
                objetivo.isContentEditable
            )
        ) {

            return;

        }


        if (
            e.key === "ArrowRight" ||
            e.key === "PageDown" ||
            e.key === " "
        ) {

            e.preventDefault();

            cambiarSlide(1);

            return;

        }


        if (
            e.key === "ArrowLeft" ||
            e.key === "PageUp"
        ) {

            e.preventDefault();

            cambiarSlide(-1);

            return;

        }


        if (e.key === "Home") {

            e.preventDefault();

            mostrarSlide(0);

            return;

        }


        if (e.key === "End") {

            e.preventDefault();

            mostrarSlide(
                slides.length - 1
            );

            return;

        }


        if (e.key === "Escape") {

            cerrarPresentacion();

        }

    }


    /* ============================================================
       GRÁFICOS
       ============================================================ */

    function crearGraficos() {

        if (
            typeof Chart === "undefined"
        ) {

            console.warn(
                "Chart.js no está disponible."
            );

            return;

        }


        destruirGraficos();


        const r =
            calcularResumen();


        const canvasODT =
            document.getElementById(
                "chartODT"
            );


        const canvasFurgon =
            document.getElementById(
                "chartFurgon"
            );


        /*
            Gráfico ODT.
        */

        if (canvasODT) {

            try {

                charts.push(

                    new Chart(
                        canvasODT,
                        {

                            type: "doughnut",


                            data: {

                                labels: [
                                    "Cumplidos",
                                    "Incumplidos"
                                ],


                                datasets: [{

                                    data: [

                                        r.odtCumplidos,

                                        r.odtIncumplidos

                                    ]

                                }]

                            },


                            options: {

                                responsive: true,

                                maintainAspectRatio: false,


                                cutout: "65%",


                                plugins: {

                                    legend: {

                                        position:
                                            "bottom",

                                        labels: {

                                            color:
                                                "#cbd5e1"

                                        }

                                    }

                                }

                            }

                        }
                    )

                );

            } catch (error) {

                console.error(
                    "Error creando gráfico ODT:",
                    error
                );

            }

        }


        /*
            Gráfico Furgón.
        */

        if (canvasFurgon) {

            try {

                charts.push(

                    new Chart(
                        canvasFurgon,
                        {

                            type: "doughnut",


                            data: {

                                labels: [
                                    "Cumplidos",
                                    "Incumplidos"
                                ],


                                datasets: [{

                                    data: [

                                        r.furgonCumplidos,

                                        r.furgonIncumplidos

                                    ]

                                }]

                            },


                            options: {

                                responsive: true,

                                maintainAspectRatio: false,


                                cutout: "65%",


                                plugins: {

                                    legend: {

                                        position:
                                            "bottom",

                                        labels: {

                                            color:
                                                "#cbd5e1"

                                        }

                                    }

                                }

                            }

                        }
                    )

                );

            } catch (error) {

                console.error(
                    "Error creando gráfico Furgón:",
                    error
                );

            }

        }

    }


    /* ============================================================
       DESTRUIR GRÁFICOS
       ============================================================ */

    function destruirGraficos() {

        charts.forEach(
            function (chart) {

                try {

                    if (chart) {

                        chart.destroy();

                    }

                } catch (error) {

                    console.warn(
                        "No se pudo destruir un gráfico:",
                        error
                    );

                }

            }
        );


        charts = [];

    }


    /* ============================================================
       UTILIDADES
       ============================================================ */

    function agrupar(
        array,
        callback
    ) {

        if (!Array.isArray(array)) {

            return {};

        }


        return array.reduce(
            function (
                resultado,
                elemento
            ) {

                let clave;


                try {

                    clave =
                        callback(elemento);

                } catch (error) {

                    clave =
                        "Sin información";

                }


                clave =
                    String(
                        clave ??
                        "Sin información"
                    ).trim();


                if (!clave) {

                    clave =
                        "Sin información";

                }


                if (!resultado[clave]) {

                    resultado[clave] = {

                        total: 0,

                        viajes: []

                    };

                }


                resultado[clave].total++;


                resultado[clave]
                    .viajes
                    .push(elemento);


                return resultado;

            },
            {}
        );

    }


    /* ============================================================
       PARSEAR NÚMERO
       ============================================================ */

    function parseNumero(valor) {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {

            return 0;

        }


        let texto =
            String(valor)
                .trim();


        if (!texto) {

            return 0;

        }


        /*
            Eliminamos espacios.
        */

        texto =
            texto.replace(
                /\s/g,
                ""
            );


        /*
            Caso:
            12,5 -> 12.5
        */

        if (
            texto.includes(",") &&
            !texto.includes(".")
        ) {

            texto =
                texto.replace(
                    ",",
                    "."
                );

        }


        /*
            Caso:
            1.234,5 -> 1234.5
        */

        else if (
            texto.includes(",") &&
            texto.includes(".")
        ) {

            const ultimaComa =
                texto.lastIndexOf(",");


            const ultimoPunto =
                texto.lastIndexOf(".");


            if (
                ultimaComa >
                ultimoPunto
            ) {

                texto =
                    texto
                        .replace(
                            /\./g,
                            ""
                        )
                        .replace(
                            ",",
                            "."
                        );

            } else {

                texto =
                    texto.replace(
                        /,/g,
                        ""
                    );

            }

        }


        /*
            Dejamos únicamente números,
            signo negativo y punto decimal.
        */

        texto =
            texto.replace(
                /[^\d.-]/g,
                ""
            );


        const numero =
            parseFloat(
                texto
            );


        return Number.isFinite(numero)
            ? numero
            : 0;

    }


    /* ============================================================
       NORMALIZAR ESTADO
       ============================================================ */

    function normalizarEstado(valor) {

        return String(
            valor ?? ""
        )
            .trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );

    }


    /* ============================================================
       PORCENTAJE
       ============================================================ */

    function porcentaje(
        valor,
        total
    ) {

        const numeroValor =
            Number(valor) || 0;


        const numeroTotal =
            Number(total) || 0;


        if (
            numeroTotal <= 0
        ) {

            return 0;

        }


        return Math.min(
            100,
            Math.max(
                0,
                (numeroValor /
                    numeroTotal) *
                    100
            )
        );

    }


    /* ============================================================
       CLASE PORCENTAJE
       ============================================================ */

    function clasePorcentaje(
        valor
    ) {

        const numero =
            Number(valor) || 0;


        if (numero >= 90) {

            return "pv-good";

        }


        if (numero >= 70) {

            return "pv-medium";

        }


        return "pv-bad";

    }


    /* ============================================================
       ESTADO
       ============================================================ */

    function estadoClase(
        valor
    ) {

        const estado =
            normalizarEstado(
                valor
            );


        if (
            estado === "CUMPLIDO" ||
            estado === "COMPLETADO" ||
            estado === "OK"
        ) {

            return "pv-status-good";

        }


        if (!estado) {

            return "pv-status-neutral";

        }


        return "pv-status-bad";

    }


    /* ============================================================
       NIVEL DE CUMPLIMIENTO
       ============================================================ */

    function obtenerNivelCumplimiento(
        porcentaje
    ) {

        if (porcentaje >= 95) {

            return "Nivel de cumplimiento excelente";

        }


        if (porcentaje >= 85) {

            return "Nivel de cumplimiento satisfactorio";

        }


        if (porcentaje >= 70) {

            return "Nivel de cumplimiento moderado";

        }


        return "Nivel de cumplimiento que requiere atención";

    }


    /* ============================================================
       FECHAS
       ============================================================ */

    function obtenerFechaMin(
        viajes
    ) {

        const fechas =
            viajes
                .map(
                    function (v) {

                        return v.fecha;

                    }
                )
                .filter(Boolean);


        if (!fechas.length) {

            return "";

        }


        fechas.sort(
            compararFechas
        );


        return fechas[0] || "";

    }


    function obtenerFechaMax(
        viajes
    ) {

        const fechas =
            viajes
                .map(
                    function (v) {

                        return v.fecha;

                    }
                )
                .filter(Boolean);


        if (!fechas.length) {

            return "";

        }


        fechas.sort(
            compararFechas
        );


        return fechas[
            fechas.length - 1
        ] || "";

    }


    /* ============================================================
       COMPARAR FECHAS
       ============================================================ */

    function compararFechas(
        a,
        b
    ) {

        const fechaA =
            convertirFecha(
                a
            );


        const fechaB =
            convertirFecha(
                b
            );


        /*
            Si ambas se pueden convertir,
            comparación cronológica real.
        */

        if (
            fechaA !== null &&
            fechaB !== null
        ) {

            return (
                fechaA.getTime() -
                fechaB.getTime()
            );

        }


        /*
            Fallback alfabético.
        */

        return String(a).localeCompare(
            String(b),
            undefined,
            {
                numeric: true,
                sensitivity: "base"
            }
        );

    }


    /* ============================================================
       CONVERTIR FECHA
       ============================================================ */

    function convertirFecha(
        valor
    ) {

        if (!valor) {

            return null;

        }


        const texto =
            String(valor)
                .trim();


        /*
            DD/MM/YYYY
            DD-MM-YYYY
        */

        let match =
            texto.match(
                /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/
            );


        if (match) {

            const dia =
                Number(match[1]);


            const mes =
                Number(match[2]) - 1;


            const anio =
                Number(match[3]);


            const fecha =
                new Date(
                    anio,
                    mes,
                    dia
                );


            if (
                fecha.getFullYear() === anio &&
                fecha.getMonth() === mes &&
                fecha.getDate() === dia
            ) {

                return fecha;

            }

        }


        /*
            YYYY-MM-DD
        */

        match =
            texto.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})/
            );


        if (match) {

            const fecha =
                new Date(
                    Number(match[1]),
                    Number(match[2]) - 1,
                    Number(match[3])
                );


            if (
                !isNaN(
                    fecha.getTime()
                )
            ) {

                return fecha;

            }

        }


        const fechaNativa =
            new Date(texto);


        if (
            !isNaN(
                fechaNativa.getTime()
            )
        ) {

            return fechaNativa;

        }


        return null;

    }


    /* ============================================================
       FORMATEAR PERÍODO
       ============================================================ */

    function formatearPeriodo(
        inicio,
        fin
    ) {

        if (
            !inicio &&
            !fin
        ) {

            return "Período seleccionado";

        }


        if (
            inicio === fin
        ) {

            return inicio;

        }


        return `${inicio} — ${fin}`;

    }


    /* ============================================================
       ESCAPAR HTML
       ============================================================ */

    function escapeHTML(
        valor
    ) {

        return String(
            valor ?? ""
        )
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


    /* ============================================================
       CERRAR PRESENTACIÓN
       ============================================================ */

    function cerrarPresentacion() {

        destruirGraficos();


        if (
            document.fullscreenElement
        ) {

            document
                .exitFullscreen()
                .catch(
                    function () {}
                );

        }


        if (presentacion) {

            presentacion.remove();

            presentacion = null;

        }


        slides = [];

        slideActual = 0;

        datosViajes = [];


        document.body.style.overflow =
            "";

    }


    /* ============================================================
       PANTALLA COMPLETA
       ============================================================ */

    function intentarPantallaCompleta() {

        if (!presentacion) {

            return;

        }


        document.body.style.overflow =
            "hidden";


        if (
            presentacion.requestFullscreen
        ) {

            presentacion
                .requestFullscreen()
                .catch(
                    function () {}
                );

        }

    }


    function alternarPantallaCompleta() {

        if (!presentacion) {

            return;

        }


        if (
            document.fullscreenElement
        ) {

            document
                .exitFullscreen()
                .catch(
                    function () {}
                );

            return;

        }


        intentarPantallaCompleta();

    }


    /* ============================================================
       ESTILOS
       ============================================================ */

    function agregarEstilos() {

        if (
            document.getElementById(
                "pv-estilos"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "pv-estilos";


        style.textContent = `

        /* =====================================================
           CONTENEDOR PRINCIPAL
           ===================================================== */

        #presentacionViajes {

            position: fixed;

            inset: 0;

            z-index: 999999;

            background:
                linear-gradient(
                    135deg,
                    #07111f 0%,
                    #0d1b2e 55%,
                    #101d30 100%
                );

            color: #f8fafc;

            font-family:
                Inter,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;

            overflow: hidden;

        }


        #presentacionViajes * {

            box-sizing: border-box;

        }


        /* =====================================================
           FONDO
           ===================================================== */

        .pv-background {

            position: absolute;

            inset: 0;

            background:
                radial-gradient(
                    circle at 20% 20%,
                    rgba(13,110,253,.16),
                    transparent 30%
                ),

                radial-gradient(
                    circle at 80% 80%,
                    rgba(13,202,240,.10),
                    transparent 30%
                );

            pointer-events: none;

        }


        /* =====================================================
           HEADER
           ===================================================== */

        .pv-header {

            position: absolute;

            top: 0;
            left: 0;
            right: 0;

            height: 74px;

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding: 0 38px;

            border-bottom:
                1px solid
                rgba(255,255,255,.08);

            background:
                rgba(5,15,28,.65);

            backdrop-filter:
                blur(14px);

            z-index: 10;

        }


        .pv-brand {

            display: flex;

            align-items: center;

            gap: 13px;

        }


        .pv-brand-icon {

            width: 42px;
            height: 42px;

            border-radius: 12px;

            display: flex;

            align-items: center;
            justify-content: center;

            background:
                linear-gradient(
                    135deg,
                    #0d6efd,
                    #0dcaf0
                );

            font-size: 20px;

        }


        .pv-brand strong {

            display: block;

            font-size: 13px;

            letter-spacing: 1.5px;

        }


        .pv-brand small {

            color: #94a3b8;

        }


        .pv-header-actions {

            display: flex;

            gap: 8px;

        }


        .pv-header-actions button {

            width: 40px;
            height: 40px;

            border:
                1px solid
                rgba(255,255,255,.1);

            background:
                rgba(255,255,255,.06);

            color: white;

            border-radius: 10px;

            cursor: pointer;

        }


        .pv-header-actions button:hover {

            background:
                rgba(255,255,255,.14);

        }


        /* =====================================================
           SLIDES
           ===================================================== */

        .pv-slides {

            position: absolute;

            top: 74px;
            bottom: 70px;
            left: 0;
            right: 0;

            overflow: hidden;

        }


        .pv-slide {

            position: absolute;

            inset: 0;

            padding:
                55px 8vw 50px;

            overflow-y: auto;

            opacity: 0;

            visibility: hidden;

            transform:
                translateX(35px)
                scale(.98);

            transition:
                opacity .35s ease,
                transform .35s ease,
                visibility .35s ease;

            pointer-events: none;

        }


        .pv-slide.active {

            opacity: 1;

            visibility: visible;

            transform:
                translateX(0)
                scale(1);

            pointer-events: auto;

        }


        /* =====================================================
           TÍTULOS
           ===================================================== */

        .pv-slide-title {

            display: flex;

            align-items: center;

            gap: 18px;

            margin-bottom: 38px;

        }


        .pv-slide-title-icon {

            width: 58px;
            height: 58px;

            border-radius: 16px;

            display: flex;

            align-items: center;
            justify-content: center;

            background:
                rgba(13,110,253,.16);

            color: #60a5fa;

            font-size: 25px;

            flex-shrink: 0;

        }


        .pv-slide-title h2 {

            margin: 0;

            font-size:
                clamp(
                    28px,
                    3vw,
                    42px
                );

            font-weight: 700;

        }


        .pv-slide-title p {

            margin: 5px 0 0;

            color: #94a3b8;

        }


        /* =====================================================
           PORTADA
           ===================================================== */

        .pv-cover {

            display: flex;

            align-items: center;

            justify-content: center;

            text-align: center;

        }


        .pv-cover-content {

            max-width: 900px;

        }


        .pv-cover-icon {

            width: 100px;
            height: 100px;

            margin:
                0 auto 25px;

            border-radius: 28px;

            display: flex;

            align-items: center;
            justify-content: center;

            font-size: 45px;

            background:
                linear-gradient(
                    135deg,
                    #0d6efd,
                    #0dcaf0
                );

            box-shadow:
                0 20px 60px
                rgba(13,110,253,.25);

        }


        .pv-eyebrow {

            color: #60a5fa;

            font-weight: 700;

            letter-spacing: 4px;

            font-size: 13px;

        }


        .pv-cover h1 {

            font-size:
                clamp(
                    48px,
                    7vw,
                    90px
                );

            margin:
                10px 0;

            font-weight: 800;

        }


        .pv-cover-subtitle {

            color: #94a3b8;

            font-size: 20px;

        }


        .pv-period {

            display: inline-flex;

            align-items: center;

            gap: 10px;

            margin-top: 20px;

            padding:
                12px 20px;

            border-radius: 999px;

            background:
                rgba(255,255,255,.06);

            border:
                1px solid
                rgba(255,255,255,.08);

        }


        .pv-cover-stat {

            margin-top: 45px;

        }


        .pv-cover-stat strong {

            display: block;

            font-size: 70px;

            line-height: 1;

        }


        .pv-cover-stat span {

            color: #94a3b8;

        }


        /* =====================================================
           KPIs
           ===================================================== */

        .pv-kpi-grid {

            display: grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(220px, 1fr)
                );

            gap: 18px;

        }


        .pv-kpi {

            padding: 24px;

            border-radius: 18px;

            display: flex;

            gap: 17px;

            align-items: center;

            background:
                rgba(255,255,255,.055);

            border:
                1px solid
                rgba(255,255,255,.08);

        }


        .pv-kpi-icon {

            width: 52px;
            height: 52px;

            border-radius: 14px;

            display: flex;

            align-items: center;
            justify-content: center;

            font-size: 22px;

            flex-shrink: 0;

        }


        .pv-kpi span {

            display: block;

            color: #94a3b8;

            font-size: 13px;

        }


        .pv-kpi strong {

            display: block;

            font-size: 30px;

            margin-top: 3px;

        }


        .pv-primary .pv-kpi-icon {

            background:
                rgba(13,110,253,.18);

            color: #60a5fa;

        }


        .pv-success .pv-kpi-icon {

            background:
                rgba(25,135,84,.18);

            color: #4ade80;

        }


        .pv-danger .pv-kpi-icon {

            background:
                rgba(220,53,69,.18);

            color: #fb7185;

        }


        .pv-info .pv-kpi-icon {

            background:
                rgba(13,202,240,.18);

            color: #67e8f9;

        }


        .pv-warning .pv-kpi-icon {

            background:
                rgba(255,193,7,.18);

            color: #facc15;

        }


        /* =====================================================
           MENSAJES
           ===================================================== */

        .pv-summary-message,
        .pv-time-message,
        .pv-final-message {

            margin-top: 30px;

            padding: 25px;

            border-radius: 18px;

            display: flex;

            gap: 18px;

            align-items: flex-start;

            background:
                rgba(13,110,253,.08);

            border:
                1px solid
                rgba(96,165,250,.16);

        }


        .pv-summary-icon {

            font-size: 28px;

            color: #60a5fa;

        }


        .pv-summary-message p,
        .pv-time-message p,
        .pv-final-message p {

            margin: 7px 0 0;

            color: #cbd5e1;

            line-height: 1.7;

        }


        /* =====================================================
           GRÁFICOS
           ===================================================== */

        .pv-chart-layout {

            display: grid;

            grid-template-columns:
                repeat(
                    2,
                    minmax(0, 1fr)
                );

            gap: 25px;

            min-height: 420px;

            height: 65%;

        }


        .pv-chart-card {

            padding: 25px;

            border-radius: 20px;

            background:
                rgba(255,255,255,.05);

            border:
                1px solid
                rgba(255,255,255,.08);

            min-width: 0;

        }


        .pv-chart-card h3 {

            margin-top: 0;

        }


        .pv-chart-container {

            height:
                calc(100% - 50px);

            min-height: 280px;

            position: relative;

        }


        /* =====================================================
           RANKINGS
           ===================================================== */

        .pv-ranking {

            max-width: 1000px;

            margin: auto;

        }


        .pv-ranking-row {

            display: grid;

            grid-template-columns:
                50px 1fr 100px;

            gap: 15px;

            align-items: center;

            padding: 16px;

            margin-bottom: 10px;

            border-radius: 13px;

            background:
                rgba(255,255,255,.045);

        }


        .pv-ranking-number {

            width: 36px;
            height: 36px;

            border-radius: 10px;

            display: flex;

            align-items: center;
            justify-content: center;

            background:
                rgba(13,110,253,.15);

            color: #60a5fa;

            font-weight: 700;

        }


        .pv-ranking-bar {

            height: 7px;

            margin-top: 8px;

            border-radius: 99px;

            background:
                rgba(255,255,255,.08);

            overflow: hidden;

        }


        .pv-ranking-bar span {

            display: block;

            height: 100%;

            border-radius: inherit;

            background:
                linear-gradient(
                    90deg,
                    #0d6efd,
                    #0dcaf0
                );

        }


        .pv-ranking-value {

            text-align: right;

            font-weight: 700;

        }


        .pv-ranking-value small {

            display: block;

            color: #64748b;

            font-weight: 400;

        }


        /* =====================================================
           TABLAS
           ===================================================== */

        .pv-table-wrapper,
        .pv-detail-scroll {

            overflow: auto;

            max-height: 68%;

            border-radius: 18px;

            border:
                1px solid
                rgba(255,255,255,.08);

        }


        .pv-table {

            width: 100%;

            border-collapse: collapse;

        }


        .pv-table th {

            position: sticky;

            top: 0;

            background: #122237;

            color: #94a3b8;

            text-transform: uppercase;

            font-size: 11px;

            letter-spacing: .8px;

            z-index: 2;

        }


        .pv-table th,
        .pv-table td {

            padding:
                14px 16px;

            text-align: left;

            border-bottom:
                1px solid
                rgba(255,255,255,.06);

        }


        .pv-table td {

            color: #cbd5e1;

        }


        .pv-detail-table td {

            vertical-align: top;

        }


        .pv-detail-note {

            min-width: 220px;

            max-width: 350px;

            white-space: normal;

            line-height: 1.45;

        }


        .pv-no-note {

            color: #64748b;

            font-style: italic;

        }


        .pv-no-data {

            text-align: center !important;

            color: #64748b !important;

            padding: 30px !important;

        }


        .pv-percentage,
        .pv-status {

            padding:
                5px 10px;

            border-radius: 999px;

            font-size: 12px;

            font-weight: 700;

            white-space: nowrap;

        }


        .pv-good,
        .pv-status-good {

            color: #4ade80;

            background:
                rgba(25,135,84,.14);

        }


        .pv-medium {

            color: #facc15;

            background:
                rgba(255,193,7,.14);

        }


        .pv-bad,
        .pv-status-bad {

            color: #fb7185;

            background:
                rgba(220,53,69,.14);

        }


        .pv-status-neutral {

            color: #cbd5e1;

            background:
                rgba(148,163,184,.12);

        }


        /* =====================================================
           TIEMPOS
           ===================================================== */

        .pv-time-grid {

            display: grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            gap: 20px;

        }


        /* =====================================================
           INCIDENCIAS
           ===================================================== */

        .pv-incidencias-resumen {

            display: grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            gap: 15px;

            margin-bottom: 20px;

        }


        .pv-incidencia-total {

            padding:
                16px 20px;

            border-radius: 14px;

            background:
                rgba(255,255,255,.045);

            border:
                1px solid
                rgba(255,255,255,.07);

        }


        .pv-incidencia-total span {

            display: block;

            color: #94a3b8;

            font-size: 12px;

        }


        .pv-incidencia-total strong {

            display: block;

            margin-top: 4px;

            font-size: 26px;

            color: #f8fafc;

        }


        .pv-incidencias {

            display: grid;

            grid-template-columns:
                repeat(
                    2,
                    1fr
                );

            gap: 12px;

        }


        .pv-incidencia {

            display: flex;

            gap: 15px;

            padding: 18px;

            border-radius: 15px;

            background:
                rgba(220,53,69,.07);

            border:
                1px solid
                rgba(220,53,69,.14);

        }


        .pv-incidencia-destacada {

            position: relative;

        }


        .pv-incidencia-number {

            min-width: 34px;

            height: 34px;

            border-radius: 10px;

            display: flex;

            align-items: center;

            justify-content: center;

            background:
                rgba(220,53,69,.16);

            color: #fb7185;

            font-weight: 800;

        }


        .pv-incidencia-content {

            flex: 1;

            min-width: 0;

        }


        .pv-incidencia-top {

            display: flex;

            justify-content: space-between;

            align-items: flex-start;

            gap: 20px;

        }


        .pv-incidencia-conductor {

            display: block;

            font-size: 15px;

        }


        .pv-incidencia-fecha {

            display: block;

            margin-top: 3px;

            color: #64748b;

            font-size: 11px;

        }


        .pv-incidencia-badge {

            display: inline-flex;

            align-items: center;

            gap: 5px;

            padding:
                5px 9px;

            border-radius: 999px;

            background:
                rgba(220,53,69,.14);

            color: #fb7185;

            font-size: 10px;

            font-weight: 800;

            white-space: nowrap;

        }


        .pv-incidencia-ruta {

            display: flex;

            align-items: center;

            gap: 9px;

            margin-top: 14px;

            font-weight: 600;

            color: #e2e8f0;

            flex-wrap: wrap;

        }


        .pv-incidencia-ruta i {

            color: #60a5fa;

        }


        .pv-incidencia-datos {

            display: grid;

            grid-template-columns:
                repeat(
                    4,
                    1fr
                );

            gap: 10px;

            margin-top: 15px;

            padding-top: 14px;

            border-top:
                1px solid
                rgba(255,255,255,.06);

        }


        .pv-incidencia-datos small {

            display: block;

            color: #64748b;

            font-size: 9px;

            font-weight: 700;

            letter-spacing: .7px;

        }


        .pv-incidencia-datos strong {

            display: block;

            margin-top: 3px;

            color: #cbd5e1;

            font-size: 12px;

        }


        .pv-text-danger {

            color: #fb7185 !important;

        }


        .pv-text-success {

            color: #4ade80 !important;

        }


        .pv-incidencia-nota {

            display: flex;

            gap: 12px;

            margin-top: 15px;

            padding:
                13px 15px;

            border-radius: 11px;

            background:
                rgba(255,193,7,.055);

            border:
                1px solid
                rgba(255,193,7,.12);

        }


        .pv-nota-icon {

            color: #facc15;

            font-size: 17px;

            padding-top: 2px;

        }


        .pv-incidencia-nota small {

            display: block;

            color: #facc15;

            font-size: 9px;

            font-weight: 800;

            letter-spacing: .8px;

        }


        .pv-incidencia-nota p {

            margin: 4px 0 0;

            color: #cbd5e1;

            font-size: 12px;

            line-height: 1.5;

            overflow-wrap: anywhere;

        }


        .pv-incidencias-mas {

            margin-top: 15px;

            text-align: center;

            color: #64748b;

            font-size: 11px;

        }


        .pv-incidencias-mas i {

            color: #60a5fa;

            margin-right: 5px;

        }


        /* =====================================================
           SIN INCIDENCIAS
           ===================================================== */

        .pv-empty {

            height: 60%;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            text-align: center;

        }


        .pv-empty i {

            font-size: 80px;

            color: #4ade80;

        }


        .pv-empty h2 {

            margin-bottom: 5px;

        }


        .pv-empty p {

            color: #94a3b8;

        }


        .pv-empty-small {

            text-align: center;

            padding: 50px 20px;

            color: #64748b;

        }


        .pv-empty-small i {

            display: block;

            font-size: 45px;

            margin-bottom: 10px;

            color: #60a5fa;

        }


        /* =====================================================
           CONCLUSIONES
           ===================================================== */

        .pv-conclusion {

            text-align: center;

        }


        .pv-conclusion-score {

            max-width: 650px;

            margin:
                0 auto 35px;

        }


        .pv-conclusion-score span {

            color: #94a3b8;

        }


        .pv-conclusion-score strong {

            display: block;

            font-size: 75px;

            margin: 5px 0;

        }


        .pv-score-bar {

            height: 14px;

            border-radius: 99px;

            background:
                rgba(255,255,255,.08);

            overflow: hidden;

        }


        .pv-score-bar span {

            display: block;

            height: 100%;

            border-radius: inherit;

            background:
                linear-gradient(
                    90deg,
                    #0d6efd,
                    #20c997
                );

        }


        .pv-conclusion-score small {

            display: block;

            margin-top: 10px;

            color: #4ade80;

        }


        .pv-conclusion-grid {

            display: grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            max-width: 900px;

            margin: auto;

            gap: 15px;

        }


        .pv-conclusion-grid > div {

            padding: 20px;

            border-radius: 16px;

            background:
                rgba(255,255,255,.05);

        }


        .pv-conclusion-grid i {

            display: block;

            font-size: 25px;

            color: #60a5fa;

        }


        .pv-conclusion-grid strong {

            display: block;

            font-size: 30px;

            margin: 5px;

        }


        .pv-conclusion-grid span {

            color: #94a3b8;

            font-size: 13px;

        }


        .pv-final {

            margin-top: 30px;

            display: flex;

            flex-direction: column;

            gap: 5px;

            color: #64748b;

            font-size: 12px;

            letter-spacing: 1px;

        }


        /* =====================================================
           NAVEGACIÓN
           ===================================================== */

        .pv-navigation {

            position: absolute;

            top: 50%;

            transform:
                translateY(-50%);

            width: 48px;
            height: 48px;

            border-radius: 50%;

            border:
                1px solid
                rgba(255,255,255,.1);

            background:
                rgba(255,255,255,.06);

            color: white;

            z-index: 20;

            cursor: pointer;

        }


        .pv-navigation:hover {

            background:
                rgba(13,110,253,.35);

        }


        .pv-prev {

            left: 20px;

        }


        .pv-next {

            right: 20px;

        }


        /* =====================================================
           FOOTER
           ===================================================== */

        .pv-footer {

            position: absolute;

            bottom: 0;
            left: 0;
            right: 0;

            min-height: 70px;

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 25px;

            border-top:
                1px solid
                rgba(255,255,255,.08);

            background:
                rgba(5,15,28,.65);

            backdrop-filter:
                blur(14px);

            z-index: 10;

        }


        .pv-progress {

            display: flex;

            gap: 6px;

            max-width: 70vw;

            overflow-x: auto;

            padding: 4px;

        }


        .pv-progress button {

            width: 24px;
            height: 4px;

            flex: 0 0 auto;

            border: none;

            border-radius: 99px;

            background:
                rgba(255,255,255,.15);

            cursor: pointer;

            transition:
                .2s ease;

        }


        .pv-progress button.active {

            width: 45px;

            background: #0d6efd;

        }


        .pv-counter {

            color: #64748b;

            font-size: 13px;

            white-space: nowrap;

        }


        /* =====================================================
           SCROLLBAR
           ===================================================== */

        #presentacionViajes ::-webkit-scrollbar {

            width: 8px;

            height: 8px;

        }


        #presentacionViajes ::-webkit-scrollbar-track {

            background:
                rgba(255,255,255,.03);

        }


        #presentacionViajes ::-webkit-scrollbar-thumb {

            background:
                rgba(148,163,184,.25);

            border-radius: 99px;

        }


        #presentacionViajes ::-webkit-scrollbar-thumb:hover {

            background:
                rgba(148,163,184,.4);

        }


        /* =====================================================
           RESPONSIVE
           ===================================================== */

        @media(max-width: 1100px) {

            .pv-incidencias {

                grid-template-columns:
                    1fr;

            }

        }


        @media(max-width: 900px) {

            .pv-chart-layout,
            .pv-time-grid,
            .pv-conclusion-grid {

                grid-template-columns:
                    1fr;

            }


            .pv-incidencias-resumen {

                grid-template-columns:
                    1fr 1fr;

            }


            .pv-incidencia-datos {

                grid-template-columns:
                    1fr 1fr;

            }


            .pv-slide {

                padding:
                    35px 55px;

            }


            .pv-ranking-row {

                grid-template-columns:
                    40px 1fr 70px;

            }


            .pv-chart-layout {

                height: auto;

            }


            .pv-chart-card {

                min-height: 380px;

            }

        }


        @media(max-width: 600px) {

            .pv-header {

                padding:
                    0 15px;

            }


            .pv-brand small {

                display: none;

            }


            .pv-slide {

                padding:
                    25px 30px;

            }


            .pv-navigation {

                display: none;

            }


            .pv-incidencias-resumen {

                grid-template-columns:
                    1fr;

            }


            .pv-incidencia-top {

                flex-direction: column;

                gap: 10px;

            }


            .pv-incidencia-datos {

                grid-template-columns:
                    1fr 1fr;

            }


            .pv-slide-title {

                align-items: flex-start;

            }


            .pv-slide-title-icon {

                width: 45px;
                height: 45px;

                font-size: 19px;

            }


            .pv-slide-title h2 {

                font-size: 27px;

            }


            .pv-cover h1 {

                font-size: 48px;

            }


            .pv-cover-subtitle {

                font-size: 16px;

            }


            .pv-cover-stat strong {

                font-size: 55px;

            }


            .pv-conclusion-score strong {

                font-size: 55px;

            }


            .pv-footer {

                gap: 10px;

                padding:
                    0 15px;

            }


            .pv-progress {

                max-width: 60vw;

            }

        }

        `;


        document.head.appendChild(
            style
        );

    }


})();