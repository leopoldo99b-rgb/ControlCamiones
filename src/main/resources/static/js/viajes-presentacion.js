/* ============================================================
   PRESENTACIÓN EJECUTIVA DE VIAJES  ·  v3
   Transportes CHC

   Cambios de la v3 respecto a la v2:
   - Los destinos/orígenes con numeración (Teguarque 1, 2, 3...) se
     agrupan como un solo lugar ("Teguarque").
   - Logo de la empresa (imgs/logo.png) en la portada.
   - Menos redundancia: se quitaron el párrafo repetido del Resumen,
     la slide "Justificación", la slide "Mayores excesos" y la slide
     de Furgones (ahora va junto al cumplimiento ODT).
   - El registro completo ("Detalle") queda apagado; se activa con
     INCLUIR_DETALLE = true.

   Datos: lee los datos REALES (cacheViajes de viajes.js) y no las celdas
   de la tabla. Si cacheViajes no existe, usa la tabla como respaldo.

   Atajos:  ← → espacio  ·  Home / End  ·  M menú  ·  N guion
            G ir a slide ·  T tema       ·  F pantalla completa
            ?  ayuda     ·  Esc cierra (desglose → menú → presentación)
   ============================================================ */

(function() {

    "use strict";

    /* ============================================================
       CONFIGURACIÓN
       ============================================================ */

    const LOGO_URL = "imgs/logo.png";   // si tu página no está en la raíz, usa "/imgs/logo.png"
    const INCLUIR_DETALLE = false;      // true = agrega el registro completo de viajes

    const POR_PAGINA_INCIDENCIAS = 4;
    const POR_PAGINA_TABLAS = 9;
    const POR_PAGINA_DETALLE = 9;

    const SECCIONES = [
        { id: "Resumen", icono: "bi-speedometer2", desc: "Panorama general del período" },
        { id: "Cumplimiento", icono: "bi-pie-chart-fill", desc: "ODT, furgón y evolución por fecha" },
        { id: "Rutas", icono: "bi-signpost-split", desc: "Qué rutas se hicieron y cómo cumplieron" },
        { id: "Conductores", icono: "bi-person-badge-fill", desc: "Quién hizo cuántas rutas y quién incumplió" },
        { id: "Incumplimientos", icono: "bi-exclamation-triangle-fill", desc: "Cada caso con su justificación" },
        { id: "Detalle", icono: "bi-list-columns-reverse", desc: "Registro completo de viajes" },
        { id: "Cierre", icono: "bi-clipboard2-check-fill", desc: "Hallazgos y recomendaciones" }
    ].filter(function(s) { return INCLUIR_DETALLE || s.id !== "Detalle"; });


    /* ============================================================
       ESTADO
       ============================================================ */

    let root = null;
    let slides = [];
    let actual = 0;
    let viajes = [];
    let charts = [];
    let tecladoOk = false;
    let temaClaro = false;
    let idleTimer = null;

    const lugaresCanon = new Map();


    /* ============================================================
       INICIALIZACIÓN
       ============================================================ */

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializar);
    } else {
        inicializar();
    }

    function inicializar() {
        agregarEstilos();

        const btn = document.getElementById("btnPresentacion");
        if (!btn || btn.dataset.presentacionRegistrada === "true") return;

        btn.dataset.presentacionRegistrada = "true";
        btn.addEventListener("click", abrirPresentacion);
    }

    function abrirPresentacion() {

        lugaresCanon.clear();
        viajes = obtenerViajes();

        if (!viajes.length) {
            alert("No existen viajes que coincidan con los filtros seleccionados.");
            return;
        }

        crearContenedor();
        slides = construirSlides();

        document.getElementById("pvSlides").innerHTML =
            slides.map(function(s, i) {
                return '<section class="pv-slide ' + (s.clase || "") + '" data-i="' + i + '">' + s.html + "</section>";
            }).join("");

        renderMenu();
        irA(0);
        pantallaCompleta();
    }


    /* ============================================================
       DATOS  (cacheViajes → respaldo tabla)
       ============================================================ */

    function obtenerFilasTabla() {
        try {
            if (window.jQuery && $.fn.DataTable && $.fn.DataTable.isDataTable("#tblViajes")) {
                return $("#tblViajes").DataTable().rows({ search: "applied" }).data().toArray();
            }
        } catch (e) {
            console.error("Presentación: error leyendo DataTables", e);
        }
        return [];
    }

    function obtenerViajes() {

        const filas = obtenerFilasTabla();
        const cache = (typeof cacheViajes !== "undefined" && cacheViajes instanceof Map) ? cacheViajes : null;

        return filas.map(function(fila) {

            const celdaAcciones = String(fila[15] || "");
            const m = celdaAcciones.match(/data-id="([^"]*)"/);
            const crudo = (m && cache) ? cache.get(String(decodificar(m[1]))) : null;

            return crudo ? desdeCrudo(crudo) : desdeFila(fila);
        });
    }

    function decodificar(t) {
        const d = document.createElement("textarea");
        d.innerHTML = t;
        return d.value;
    }

    function texto(v) {
        if (v === null || v === undefined) return "";
        const d = document.createElement("div");
        d.innerHTML = String(v);
        return (d.textContent || "").replace(/\s+/g, " ").trim();
    }

    function horaAMin(h) {
        if (!h) return 0;
        const p = String(h).split(":");
        return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
    }

    function durAMin(t) {   // "2h 30 min" | "45 min" | "+45 min"
        const s = String(t || "");
        const h = s.match(/(\d+)\s*h/);
        const m = s.match(/(\d+)\s*min/);
        if (!h && !m) return parseInt(s.replace(/\D/g, ""), 10) || 0;
        return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
    }

    function horaDe(v) {
        if (!v) return "";
        const t = String(v);
        if (t.includes("T")) return (t.split("T")[1] || "").substring(0, 5);
        return t.includes(":") ? t.substring(0, 5) : t;
    }

    function fechaISO(f) {
        if (!f) return "";
        const t = String(f).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.substring(0, 10);
        const m = t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
        if (m) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
        return t;
    }

    function fechaBonita(iso) {
        const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return m ? m[3] + "/" + m[2] + "/" + m[1] : (iso || "");
    }

    function fmtMin(min) {
        min = Math.max(0, Math.round(Number(min) || 0));
        const h = Math.floor(min / 60), m = min % 60;
        return h ? h + "h " + m + " min" : m + " min";
    }

    function estado(v) {
        return String(v || "").trim().toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    /* ---- Lugares: agrupa los puntos numerados de un mismo destino ---- */

    // "Teguarque 3", "Teguarque #3", "Teguarque - 3", "Teguarque (3)", "Teguarque P3",
    // "Teguarque Parqueo 3"  →  "Teguarque"
    function limpiarLugar(t) {
        const original = String(t || "").replace(/\s+/g, " ").trim();
        const s = original.replace(
            /[\s\-–:,]*\(?\s*(?:#|n[ºo°.]*\s*)?(?:(?:punto|parqueo|estacionamiento|parking|puesto|p)\s*\.?\s*)?\d+\s*\)?\s*$/i, ""
        ).trim();
        return s || original;
    }

    // Unifica mayúsculas y tildes: "TEGUARQUE" y "Teguarque" cuentan como el mismo lugar
    function lugar(t) {
        const limpio = limpiarLugar(t);
        if (!limpio) return "";
        const clave = limpio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (!lugaresCanon.has(clave)) lugaresCanon.set(clave, limpio);
        return lugaresCanon.get(clave);
    }

    function desdeCrudo(v) {

        const salida = horaDe(v.salida);
        const llegada = horaDe(v.llegada);

        let real = horaAMin(llegada) - horaAMin(salida);
        if (real < 0) real += 1440;

        let max = Number(v.tiempoMaximo);
        if (!isFinite(max) || v.tiempoMaximo === null || v.tiempoMaximo === "" || v.tiempoMaximo === undefined) {
            max = horaAMin(v.odt);
        }

        const exceso = (v.tiempoExcedido !== null && v.tiempoExcedido !== undefined && v.tiempoExcedido !== "")
            ? (parseInt(v.tiempoExcedido, 10) || 0)
            : Math.max(0, real - max);

        const estadoODT = estado(v.estado) || (exceso > 0 ? "INCUMPLIDO" : "CUMPLIDO");
        const furgon = String(v.furgon || "").trim();
        const estadoFurgon = estado(v.estadoFurgon) ||
            (["CHC", "CMI"].indexOf(furgon.toUpperCase()) !== -1 ? "CUMPLIDO" : "INCUMPLIDO");

        return {
            fecha: fechaISO(v.fecha),
            conductor: String(v.conductor || "").trim() || "Sin conductor",
            placa: String(v.placa || "").trim(),
            furgon: furgon,
            origen: lugar(v.origen),
            destino: lugar(v.destino),
            salida: salida,
            llegada: llegada,
            real: real,
            max: max,
            exceso: exceso,
            estadoODT: estadoODT,
            estadoFurgon: estadoFurgon,
            notas: String(v.notas || "").trim()
        };
    }

    function desdeFila(f) {   // respaldo: columnas de viajes.js
        const exceso = durAMin(texto(f[11]));
        return {
            fecha: fechaISO(texto(f[1])),
            conductor: texto(f[2]) || "Sin conductor",
            placa: texto(f[3]),
            furgon: texto(f[4]),
            origen: lugar(texto(f[5])),
            destino: lugar(texto(f[6])),
            salida: texto(f[7]),
            llegada: texto(f[8]),
            real: durAMin(texto(f[9])),
            max: durAMin(texto(f[10])),
            exceso: exceso,
            estadoODT: estado(texto(f[12])) || (exceso > 0 ? "INCUMPLIDO" : "CUMPLIDO"),
            estadoFurgon: estado(texto(f[13])),
            notas: texto(f[14])
        };
    }

    function esMalo(v) { return v.estadoODT === "INCUMPLIDO"; }
    function rutaDe(v) { return (v.origen || "Sin origen") + " → " + (v.destino || "Sin destino"); }


    /* ============================================================
       RESUMEN / AGRUPACIONES
       ============================================================ */

    function agrupar(lista, fnClave) {
        const mapa = {};
        lista.forEach(function(v) {
            const k = fnClave(v) || "Sin información";
            (mapa[k] = mapa[k] || []).push(v);
        });
        return mapa;
    }

    function pct(a, b) { return b > 0 ? (a / b) * 100 : 0; }

    function calcular() {

        const total = viajes.length;
        const malos = viajes.filter(esMalo);
        const odtOk = total - malos.length;
        const furgOk = viajes.filter(function(v) { return v.estadoFurgon === "CUMPLIDO"; }).length;
        const furgBad = viajes.filter(function(v) { return v.estadoFurgon === "INCUMPLIDO"; }).length;
        const conExceso = viajes.filter(function(v) { return v.exceso > 0; });

        const promExceso = conExceso.length
            ? conExceso.reduce(function(s, v) { return s + v.exceso; }, 0) / conExceso.length : 0;

        const conNota = malos.filter(function(v) { return v.notas; }).length;

        const fechas = viajes.map(function(v) { return v.fecha; }).filter(Boolean).sort();

        // Conductores
        const porConductor = Object.entries(agrupar(viajes, function(v) { return v.conductor; }))
            .map(function(e) {
                const l = e[1];
                const bad = l.filter(esMalo).length;
                const rutas = {};
                l.forEach(function(v) { rutas[rutaDe(v)] = 1; });
                return {
                    nombre: e[0], lista: l, total: l.length, bad: bad, ok: l.length - bad,
                    pct: pct(l.length - bad, l.length),
                    rutasDistintas: Object.keys(rutas).length,
                    conNota: l.filter(function(v) { return esMalo(v) && v.notas; }).length
                };
            })
            .sort(function(a, b) { return b.total - a.total; });

        // Rutas
        const porRuta = Object.entries(agrupar(viajes, rutaDe))
            .map(function(e) {
                const l = e[1];
                const bad = l.filter(esMalo).length;
                const ex = l.filter(function(v) { return v.exceso > 0; });
                return {
                    nombre: e[0], lista: l, total: l.length, bad: bad, ok: l.length - bad,
                    pct: pct(l.length - bad, l.length),
                    promExceso: ex.length ? ex.reduce(function(s, v) { return s + v.exceso; }, 0) / ex.length : 0
                };
            })
            .sort(function(a, b) { return b.total - a.total; });

        // Furgones
        const porFurgon = Object.entries(agrupar(viajes, function(v) { return v.furgon; }))
            .map(function(e) {
                const l = e[1];
                const ok = l.filter(function(v) { return v.estadoFurgon === "CUMPLIDO"; }).length;
                return { nombre: e[0], lista: l, total: l.length, ok: ok, bad: l.length - ok, pct: pct(ok, l.length) };
            })
            .sort(function(a, b) { return b.total - a.total; });

        // Por fecha
        const porFecha = Object.entries(agrupar(viajes, function(v) { return v.fecha; }))
            .map(function(e) {
                const bad = e[1].filter(esMalo).length;
                return { fecha: e[0], total: e[1].length, bad: bad, ok: e[1].length - bad };
            })
            .sort(function(a, b) { return a.fecha < b.fecha ? -1 : 1; });

        const malosOrdenados = malos.slice().sort(function(a, b) {
            return a.fecha === b.fecha ? b.exceso - a.exceso : (a.fecha < b.fecha ? -1 : 1);
        });

        return {
            total: total, malos: malos, malosOrdenados: malosOrdenados,
            odtOk: odtOk, odtBad: malos.length, pctODT: pct(odtOk, total),
            furgOk: furgOk, furgBad: furgBad, pctFurgon: pct(furgOk, furgOk + furgBad),
            conExceso: conExceso, promExceso: promExceso,
            conNota: conNota, sinNota: malos.length - conNota,
            ini: fechas[0] || "", fin: fechas[fechas.length - 1] || "",
            porConductor: porConductor, porRuta: porRuta, porFurgon: porFurgon, porFecha: porFecha
        };
    }


    /* ============================================================
       CONSTRUCCIÓN DE SLIDES
       ============================================================ */

    function construirSlides() {

        const r = calcular();
        const lista = [];

        lista.push(slidePortada(r));
        lista.push(null);                       // agenda (se completa abajo)

        lista.push(slideResumen(r));
        lista.push(slideCumplimiento(r));
        lista.push(slideTendencia(r));

        slideRutas(r).forEach(function(s) { lista.push(s); });
        slideConductores(r).forEach(function(s) { lista.push(s); });

        lista.push(slideQuienIncumplio(r));
        slideIncidencias(r).forEach(function(s) { lista.push(s); });

        if (INCLUIR_DETALLE) slideDetalle(r).forEach(function(s) { lista.push(s); });
        lista.push(slideConclusiones(r));

        // Agenda: primer slide de cada sección
        const primero = {};
        lista.forEach(function(s, i) {
            if (s && s.sec && primero[s.sec] === undefined) primero[s.sec] = i;
        });
        lista[1] = slideAgenda(primero);

        return lista;
    }

    /* ---- Helpers de HTML ---- */

    function esc(v) {
        return String(v === null || v === undefined ? "" : v)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function titulo(t, sub, icono, extra) {
        return '<div class="pv-slide-title">' +
            '<div class="pv-slide-title-icon"><i class="bi ' + icono + '"></i></div>' +
            '<div><h2>' + esc(t) + '</h2><p>' + esc(sub) + '</p></div>' +
            (extra ? '<span class="pv-pagina">' + esc(extra) + "</span>" : "") +
            "</div>";
    }

    function kpi(t, valor, icono, color, sub) {
        return '<div class="pv-kpi pv-' + color + '">' +
            '<div class="pv-kpi-icon"><i class="bi ' + icono + '"></i></div>' +
            '<div><span>' + esc(t) + '</span><strong>' + esc(valor) + "</strong>" +
            (sub ? "<em>" + esc(sub) + "</em>" : "") + "</div></div>";
    }

    function clasePct(p) { return p >= 90 ? "pv-good" : (p >= 70 ? "pv-medium" : "pv-bad"); }

    function chip(p) { return '<span class="pv-chip ' + clasePct(p) + '">' + p.toFixed(1) + "%</span>"; }

    function badge(est) {
        const ok = est === "CUMPLIDO";
        return '<span class="pv-chip ' + (ok ? "pv-good" : "pv-bad") + '">' + esc(est || "SIN REGISTRO") + "</span>";
    }

    function drill(tipo, valor, contenido) {
        return '<a class="pv-drill" href="#" data-drill="' + esc(tipo) + '" data-valor="' + esc(valor) + '">' + contenido + "</a>";
    }

    function trozos(arr, n) {
        const out = [];
        for (let i = 0;i < arr.length;i += n) out.push(arr.slice(i, i + n));
        return out.length ? out : [[]];
    }

    function periodo(r) {
        if (!r.ini) return "Período seleccionado";
        return r.ini === r.fin ? fechaBonita(r.ini) : fechaBonita(r.ini) + " — " + fechaBonita(r.fin);
    }

    /* ---- Portada ---- */

    function slidePortada(r) {
        return {
            sec: "Inicio", titulo: "Portada", clase: "pv-cover",
            notas: "Presenta el informe: período " + periodo(r) + " con " + r.total + " viajes analizados. Menciona que el informe responde cuatro preguntas: ¿hubo incumplimientos?, ¿por qué?, ¿quién fue? y ¿cuántas rutas hizo cada conductor?",
            html:
                '<div class="pv-cover-content">' +
                '<div class="pv-cover-logo"><img src="' + esc(LOGO_URL) + '" alt="Transportes CHC" onerror="this.parentNode.style.display=\'none\'"></div>' +
                '<span class="pv-eyebrow">INFORME EJECUTIVO</span>' +
                "<h1>Gestión de Viajes</h1>" +
                '<p class="pv-cover-subtitle">Cumplimiento de tiempos, responsables y justificaciones</p>' +
                '<div class="pv-period"><i class="bi bi-calendar3"></i><span>' + esc(periodo(r)) + "</span></div>" +
                '<div class="pv-cover-stat"><strong>' + r.total + "</strong><span>viajes analizados</span></div>" +
                "</div>"
        };
    }

    /* ---- Agenda ---- */

    function slideAgenda(primero) {
        const items = SECCIONES.map(function(s, i) {
            if (primero[s.id] === undefined) return "";
            return '<button type="button" class="pv-agenda-item" data-go="' + primero[s.id] + '">' +
                '<span class="pv-agenda-n">' + (i + 1) + "</span>" +
                '<span class="pv-agenda-ico"><i class="bi ' + s.icono + '"></i></span>' +
                "<span><strong>" + esc(s.id) + "</strong><small>" + esc(s.desc) + "</small></span>" +
                '<i class="bi bi-chevron-right"></i></button>';
        }).join("");

        return {
            sec: "Inicio", titulo: "Agenda",
            notas: "Explica el orden de la exposición. Puedes saltar a cualquier sección haciendo clic aquí, con el menú (M) o con G + número de slide.",
            html: titulo("Agenda", "Haz clic en una sección para ir directo", "bi-list-check") +
                '<div class="pv-agenda">' + items + "</div>"
        };
    }

    /* ---- Resumen ---- */

    function slideResumen(r) {
        return {
            sec: "Resumen", titulo: "Resumen ejecutivo",
            notas: "De " + r.total + " viajes, " + r.odtBad + " incumplieron el tiempo ODT (" + (100 - r.pctODT).toFixed(1) + "%). De esos, " + r.conNota + " tienen justificación registrada y " + r.sinNota + " no. Si preguntan por qué, ve a la sección Incumplimientos.",
            html:
                titulo("Resumen ejecutivo", "Panorama general del período seleccionado", "bi-speedometer2") +
                '<div class="pv-kpi-grid">' +
                kpi("Total de viajes", r.total, "bi-truck", "primary") +
                kpi("ODT cumplidos", r.odtOk, "bi-check-circle", "success") +
                kpi("ODT incumplidos", r.odtBad, "bi-x-circle", "danger") +
                kpi("Cumplimiento ODT", r.pctODT.toFixed(1) + "%", "bi-percent", "success") +
                kpi("Con justificación", r.conNota + " / " + r.odtBad, "bi-chat-left-text", "info", "incumplimientos") +
                kpi("Sin justificación", r.sinNota, "bi-exclamation-circle", "warning", "incumplimientos") +
                "</div>"
        };
    }

    /* ---- Cumplimiento (ODT + furgón) ---- */

    function slideCumplimiento(r) {

        const filas = r.porFurgon.map(function(f) {
            return "<tr><td>" + drill("furgon", f.nombre, "<strong>" + esc(f.nombre || "Sin furgón") + "</strong>") + "</td>" +
                "<td>" + f.total + "</td><td>" + f.bad + "</td><td>" + chip(f.pct) + "</td></tr>";
        }).join("");

        return {
            sec: "Cumplimiento", titulo: "Cumplimiento operativo",
            notas: "ODT: " + r.pctODT.toFixed(1) + "% cumplido. Furgón: " + r.pctFurgon.toFixed(1) + "% cumplido (el estado depende de la empresa del furgón: CHC y CMI cumplen). Haz clic en un furgón para ver sus viajes.",
            html:
                titulo("Cumplimiento operativo", "ODT y furgón", "bi-pie-chart-fill") +
                '<div class="pv-chart-layout">' +
                '<div class="pv-card"><h3>Cumplimiento ODT</h3><div class="pv-chart-box"><canvas id="chartODT"></canvas></div></div>' +
                '<div class="pv-card pv-card-tabla"><h3>Furgón · ' + r.pctFurgon.toFixed(1) + '% cumplido</h3>' +
                '<div class="pv-table-wrap"><table class="pv-table"><thead><tr><th>Furgón</th><th>Viajes</th><th>Incumpl.</th><th>Cumpl.</th></tr></thead><tbody>' +
                (filas || '<tr><td colspan="4" class="pv-vacio">Sin datos</td></tr>') + "</tbody></table></div></div>" +
                "</div>",
            init: function() {
                dona("chartODT", r.odtOk, r.odtBad);
            }
        };
    }

    function slideTendencia(r) {
        const peor = r.porFecha.slice().sort(function(a, b) { return b.bad - a.bad; })[0];
        return {
            sec: "Cumplimiento", titulo: "Evolución por fecha",
            notas: peor && peor.bad > 0
                ? "El día con más incumplimientos fue " + fechaBonita(peor.fecha) + " con " + peor.bad + ". Haz clic en la barra para ver los viajes de ese día."
                : "No hubo días con incumplimientos en el período.",
            html:
                titulo("Evolución por fecha", "Viajes diarios cumplidos e incumplidos (clic en una barra para ver el día)", "bi-graph-up-arrow") +
                '<div class="pv-card pv-card-grande"><div class="pv-chart-box"><canvas id="chartFechas"></canvas></div></div>',
            init: function() {

                const c = colores();

                charts.push(new Chart(document.getElementById("chartFechas"), {
                    type: "bar",
                    data: {
                        labels: r.porFecha.map(function(d) { return fechaBonita(d.fecha); }),
                        datasets: [
                            { label: "Cumplidos", data: r.porFecha.map(function(d) { return d.ok; }), backgroundColor: c.ok, borderRadius: 4 },
                            { label: "Incumplidos", data: r.porFecha.map(function(d) { return d.bad; }), backgroundColor: c.bad, borderRadius: 4 }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        onClick: function(e, els) {
                            if (els.length) abrirDrill("fecha", r.porFecha[els[0].index].fecha);
                        },
                        scales: {
                            x: { stacked: true, ticks: { color: c.txt }, grid: { display: false } },
                            y: { stacked: true, beginAtZero: true, ticks: { color: c.txt, precision: 0 }, grid: { color: c.grid } }
                        },
                        plugins: { legend: { position: "bottom", labels: { color: c.txt, font: { size: 14 } } } }
                    }
                }));
            }
        };
    }

    /* ---- Rutas ---- */

    function slideRutas(r) {
        const paginas = trozos(r.porRuta, POR_PAGINA_TABLAS);

        return paginas.map(function(pag, p) {
            const filas = pag.map(function(x, i) {
                return "<tr><td>" + (p * POR_PAGINA_TABLAS + i + 1) + "</td>" +
                    "<td>" + drill("ruta", x.nombre, "<strong>" + esc(x.nombre) + "</strong>") + "</td>" +
                    "<td>" + x.total + "</td><td>" + x.ok + "</td><td>" + x.bad + "</td>" +
                    "<td>" + (x.promExceso ? "+" + Math.round(x.promExceso) + " min" : "—") + "</td>" +
                    "<td>" + chip(x.pct) + "</td></tr>";
            }).join("");

            return {
                sec: "Rutas", titulo: "Rutas (" + (p + 1) + "/" + paginas.length + ")",
                notas: "Hay " + r.porRuta.length + " rutas distintas. La más realizada fue " + (r.porRuta[0] ? r.porRuta[0].nombre + " con " + r.porRuta[0].total + " viajes" : "—") + ". Haz clic en una ruta para ver sus viajes.",
                html:
                    titulo("Análisis de rutas", r.porRuta.length + " rutas · clic en una ruta para ver sus viajes", "bi-signpost-split",
                        paginas.length > 1 ? (p + 1) + " / " + paginas.length : "") +
                    '<div class="pv-table-wrap"><table class="pv-table"><thead><tr><th>#</th><th>Ruta</th><th>Viajes</th><th>Cumplidos</th><th>Incumplidos</th><th>Exceso prom.</th><th>Cumplimiento</th></tr></thead><tbody>' +
                    (filas || '<tr><td colspan="7" class="pv-vacio">Sin rutas</td></tr>') + "</tbody></table></div>"
            };
        });
    }

    /* ---- Conductores ---- */

    function slideConductores(r) {
        const paginas = trozos(r.porConductor, POR_PAGINA_TABLAS);

        return paginas.map(function(pag, p) {
            const filas = pag.map(function(c, i) {
                return "<tr><td>" + (p * POR_PAGINA_TABLAS + i + 1) + "</td>" +
                    "<td>" + drill("conductor", c.nombre, "<strong>" + esc(c.nombre) + "</strong>") + "</td>" +
                    "<td><b>" + c.total + "</b></td><td>" + c.rutasDistintas + "</td>" +
                    "<td>" + c.ok + "</td>" +
                    '<td class="' + (c.bad ? "pv-text-danger" : "") + '"><b>' + c.bad + "</b></td>" +
                    "<td>" + chip(c.pct) + "</td></tr>";
            }).join("");

            return {
                sec: "Conductores", titulo: "Conductores (" + (p + 1) + "/" + paginas.length + ")",
                notas: "Responde \"¿cuántas rutas hizo cada uno?\": la columna Viajes es el total realizado y Rutas distintas cuántos recorridos diferentes hizo. Clic en el nombre para ver todos sus viajes.",
                html:
                    titulo("Viajes por conductor", r.porConductor.length + " conductores · clic en un nombre para ver su detalle", "bi-person-badge-fill",
                        paginas.length > 1 ? (p + 1) + " / " + paginas.length : "") +
                    '<div class="pv-table-wrap"><table class="pv-table"><thead><tr><th>#</th><th>Conductor</th><th>Viajes realizados</th><th>Rutas distintas</th><th>Cumplidos</th><th>Incumplidos</th><th>Cumplimiento</th></tr></thead><tbody>' +
                    (filas || '<tr><td colspan="7" class="pv-vacio">Sin conductores</td></tr>') + "</tbody></table></div>"
            };
        });
    }

    /* ---- ¿Quién incumplió? ---- */

    function slideQuienIncumplio(r) {

        const ranking = r.porConductor.filter(function(c) { return c.bad > 0; })
            .sort(function(a, b) { return b.bad - a.bad; }).slice(0, 8);

        const max = ranking.length ? ranking[0].bad : 1;

        const html = ranking.length
            ? ranking.map(function(c, i) {
                return '<div class="pv-rank-row"><div class="pv-rank-n">' + (i + 1) + "</div>" +
                    '<div class="pv-rank-info">' + drill("conductor", c.nombre, "<strong>" + esc(c.nombre) + "</strong>") +
                    '<small>' + c.total + " viajes · " + c.conNota + " con justificación · " + (c.bad - c.conNota) + ' sin justificación</small>' +
                    '<div class="pv-bar"><span style="width:' + pct(c.bad, max) + '%"></span></div></div>' +
                    '<div class="pv-rank-val">' + c.bad + "<small>incumpl.</small></div></div>";
            }).join("")
            : '<div class="pv-empty"><i class="bi bi-check-circle-fill"></i><h2>Sin incumplimientos</h2><p>Ningún conductor incumplió en el período seleccionado.</p></div>';

        return {
            sec: "Incumplimientos", titulo: "¿Quién incumplió?",
            notas: ranking.length
                ? "El conductor con más incumplimientos es " + ranking[0].nombre + " con " + ranking[0].bad + " de " + ranking[0].total + " viajes. Haz clic en su nombre para ver cada caso."
                : "No hay incumplimientos que comentar.",
            html: titulo("¿Quién incumplió?", "Conductores con más incumplimientos ODT", "bi-person-exclamation") +
                '<div class="pv-ranking">' + html + "</div>"
        };
    }

    /* ---- Incumplimientos (tarjetas) ---- */

    function slideIncidencias(r) {

        if (!r.malos.length) {
            return [{
                sec: "Incumplimientos", titulo: "Incumplimientos",
                notas: "No hubo incumplimientos ODT en el período.",
                html: titulo("Incumplimientos", "Viajes que requieren atención", "bi-shield-check") +
                    '<div class="pv-empty"><i class="bi bi-check-circle-fill"></i><h2>Sin incumplimientos registrados</h2><p>Todos los viajes cumplieron el tiempo ODT.</p></div>'
            }];
        }

        const paginas = trozos(r.malosOrdenados, POR_PAGINA_INCIDENCIAS);

        return paginas.map(function(pag, p) {

            const tarjetas = pag.map(function(v, i) {

                const n = p * POR_PAGINA_INCIDENCIAS + i + 1;

                return '<article class="pv-inc">' +
                    '<div class="pv-inc-top"><div class="pv-inc-n">' + n + "</div>" +
                    "<div>" + drill("conductor", v.conductor, "<strong>" + esc(v.conductor) + "</strong>") +
                    "<small>" + esc(fechaBonita(v.fecha)) + " · Placa " + esc(v.placa || "—") + "</small></div>" +
                    '<span class="pv-chip pv-bad">+' + v.exceso + " min</span></div>" +
                    '<div class="pv-inc-ruta">' + esc(v.origen || "Origen") + ' <i class="bi bi-arrow-right"></i> ' + esc(v.destino || "Destino") + "</div>" +
                    '<div class="pv-inc-datos">' +
                    "<div><small>SALIDA – LLEGADA</small><b>" + esc(v.salida || "—") + " – " + esc(v.llegada || "—") + "</b></div>" +
                    "<div><small>TIEMPO MÁXIMO</small><b>" + fmtMin(v.max) + "</b></div>" +
                    "<div><small>TIEMPO REAL</small><b class=\"pv-text-danger\">" + fmtMin(v.real) + "</b></div>" +
                    "<div><small>FURGÓN</small><b>" + esc(v.furgon || "—") + "</b></div>" +
                    "</div>" +
                    '<div class="pv-inc-nota ' + (v.notas ? "" : "pv-sin") + '">' +
                    '<i class="bi ' + (v.notas ? "bi-chat-left-text-fill" : "bi-exclamation-triangle-fill") + '"></i>' +
                    "<div><small>" + (v.notas ? "¿POR QUÉ OCURRIÓ? · JUSTIFICACIÓN" : "SIN JUSTIFICACIÓN") + "</small>" +
                    "<p>" + esc(v.notas || "No hay una justificación registrada para este incumplimiento.") + "</p></div></div>" +
                    "</article>";
            }).join("");

            return {
                sec: "Incumplimientos", titulo: "Incumplimientos (" + (p + 1) + "/" + paginas.length + ")",
                notas: "Casos " + (p * POR_PAGINA_INCIDENCIAS + 1) + " al " + (p * POR_PAGINA_INCIDENCIAS + pag.length) + " de " + r.malos.length + ". Para cada uno: quién fue, cuánto se excedió y la justificación registrada. Los marcados en ámbar no tienen justificación.",
                html: titulo("Incumplimientos ODT", r.malos.length + " casos · ordenados por fecha", "bi-exclamation-triangle-fill", (p + 1) + " / " + paginas.length) +
                    '<div class="pv-inc-grid">' + tarjetas + "</div>"
            };
        });
    }

    /* ---- Detalle (opcional: INCLUIR_DETALLE) ---- */

    function slideDetalle(r) {

        const ordenados = viajes.slice().sort(function(a, b) {
            return a.fecha === b.fecha ? 0 : (a.fecha < b.fecha ? -1 : 1);
        });
        const paginas = trozos(ordenados, POR_PAGINA_DETALLE);

        return paginas.map(function(pag, p) {

            const filas = pag.map(function(v) {
                return "<tr><td>" + fechaBonita(v.fecha) + "</td>" +
                    "<td>" + esc(v.conductor) + "</td>" +
                    "<td>" + esc(rutaDe(v)) + "</td>" +
                    "<td>" + esc(v.furgon) + "</td>" +
                    "<td>" + fmtMin(v.real) + " / " + fmtMin(v.max) + "</td>" +
                    "<td>" + badge(v.estadoODT) + "</td>" +
                    '<td class="pv-nota-celda">' + (v.notas ? esc(v.notas) : '<span class="pv-sin-nota">—</span>') + "</td></tr>";
            }).join("");

            return {
                sec: "Detalle", titulo: "Detalle (" + (p + 1) + "/" + paginas.length + ")",
                notas: "Registro completo, " + POR_PAGINA_DETALLE + " viajes por slide. Úsalo solo si piden revisar un viaje en específico.",
                html: titulo("Detalle del período", r.total + " viajes · tiempo real / máximo", "bi-list-columns-reverse", (p + 1) + " / " + paginas.length) +
                    '<div class="pv-table-wrap"><table class="pv-table pv-compacta"><thead><tr><th>Fecha</th><th>Conductor</th><th>Ruta</th><th>Furgón</th><th>Real / Máx.</th><th>Estado ODT</th><th>Justificación</th></tr></thead><tbody>' + filas + "</tbody></table></div>"
            };
        });
    }

    /* ---- Conclusiones ---- */

    function slideConclusiones(r) {

        const hallazgos = [];

        const peorCond = r.porConductor.slice().sort(function(a, b) { return b.bad - a.bad; })[0];
        if (peorCond && peorCond.bad > 0) {
            hallazgos.push("<b>" + esc(peorCond.nombre) + "</b> concentra más incumplimientos (" + peorCond.bad + " de " + peorCond.total + " viajes).");
        }

        const peorRuta = r.porRuta.slice().sort(function(a, b) { return b.bad - a.bad; })[0];
        if (peorRuta && peorRuta.bad > 0) {
            hallazgos.push("La ruta con más incumplimientos es <b>" + esc(peorRuta.nombre) + "</b> (" + peorRuta.bad + " de " + peorRuta.total + ").");
        }

        if (r.malos.length) {
            const mayor = r.malos.slice().sort(function(a, b) { return b.exceso - a.exceso; })[0];
            hallazgos.push("El mayor exceso fue de <b>" + mayor.exceso + " min</b> (" + esc(mayor.conductor) + ", " + esc(fechaBonita(mayor.fecha)) + ").");
            hallazgos.push("<b>" + r.conNota + "</b> de " + r.odtBad + " incumplimientos tienen justificación; <b>" + r.sinNota + "</b> aún no.");
        }

        const peorFurg = r.porFurgon.slice().sort(function(a, b) { return b.bad - a.bad; })[0];
        if (peorFurg && peorFurg.bad > 0) {
            hallazgos.push("En furgones, <b>" + esc(peorFurg.nombre || "Sin furgón") + "</b> acumula " + peorFurg.bad + " viajes incumplidos.");
        }

        if (!hallazgos.length) hallazgos.push("Todos los viajes del período cumplieron los tiempos establecidos.");

        const nivel = r.pctODT >= 95 ? "Nivel de cumplimiento excelente"
            : r.pctODT >= 85 ? "Nivel de cumplimiento satisfactorio"
                : r.pctODT >= 70 ? "Nivel de cumplimiento moderado"
                    : "Nivel de cumplimiento que requiere atención";

        return {
            sec: "Cierre", titulo: "Conclusiones", clase: "pv-conclusion",
            notas: "Cierra con los hallazgos y la recomendación: registrar justificación en todos los incumplimientos y dar seguimiento a los casos recurrentes.",
            html:
                titulo("Conclusiones ejecutivas", "Resultado general del período evaluado", "bi-clipboard2-check-fill") +
                '<div class="pv-score"><span>Cumplimiento ODT</span><strong>' + r.pctODT.toFixed(1) + "%</strong>" +
                '<div class="pv-score-bar"><span style="width:' + Math.min(100, Math.max(0, r.pctODT)) + '%"></span></div>' +
                "<small>" + nivel + "</small></div>" +
                '<div class="pv-hallazgos"><h3><i class="bi bi-search"></i> Hallazgos clave</h3><ul>' +
                hallazgos.map(function(h) { return "<li>" + h + "</li>"; }).join("") + "</ul></div>" +
                '<div class="pv-message"><i class="bi bi-lightbulb-fill"></i><div><strong>Recomendación</strong>' +
                "<p>Registrar la justificación de todos los incumplimientos, dar seguimiento a los casos recurrentes por conductor y por ruta, y usar las observaciones para identificar causas y acciones de mejora.</p></div></div>" +
                '<div class="pv-final"><strong>FIN DEL INFORME</strong><span>Gestión y Control de Viajes · Transportes CHC</span></div>'
        };
    }


    /* ============================================================
       CONTENEDOR / CONTROLES
       ============================================================ */

    function crearContenedor() {

        const previo = document.getElementById("presentacionViajes");
        if (previo) previo.remove();

        root = document.createElement("div");
        root.id = "presentacionViajes";
        root.className = temaClaro ? "pv-light" : "";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");

        root.innerHTML =
            '<div class="pv-background"></div>' +

            '<header class="pv-header">' +
            '<div class="pv-brand"><div class="pv-brand-icon"><i class="bi bi-truck"></i></div>' +
            "<div><strong>REPORTE EJECUTIVO</strong><small>Transportes CHC</small></div></div>" +
            '<nav id="pvTabs" class="pv-tabs" aria-label="Secciones"></nav>' +
            '<div class="pv-header-actions">' +
            '<button id="pvBtnMenu" type="button" title="Menú (M)"><i class="bi bi-list"></i></button>' +
            '<button id="pvBtnNotas" type="button" title="Guion del presentador (N)"><i class="bi bi-journal-text"></i></button>' +
            '<button id="pvBtnTema" type="button" title="Tema claro / oscuro (T)"><i class="bi bi-circle-half"></i></button>' +
            '<button id="pvBtnFull" type="button" title="Pantalla completa (F)"><i class="bi bi-fullscreen"></i></button>' +
            '<button id="pvBtnCerrar" type="button" title="Cerrar (Esc)"><i class="bi bi-x-lg"></i></button>' +
            "</div></header>" +

            '<aside id="pvMenu" class="pv-menu"><div class="pv-menu-head"><strong>Diapositivas</strong>' +
            '<button type="button" id="pvMenuCerrar"><i class="bi bi-x-lg"></i></button></div>' +
            '<div id="pvMenuLista" class="pv-menu-lista"></div></aside>' +

            '<main id="pvSlides" class="pv-slides"></main>' +

            '<div id="pvNotas" class="pv-notas"><div class="pv-notas-head"><i class="bi bi-journal-text"></i> Guion del presentador</div>' +
            '<p id="pvNotasTexto"></p></div>' +

            '<button id="pvPrev" type="button" class="pv-navigation pv-prev" title="Anterior"><i class="bi bi-chevron-left"></i></button>' +
            '<button id="pvNext" type="button" class="pv-navigation pv-next" title="Siguiente"><i class="bi bi-chevron-right"></i></button>' +

            '<footer class="pv-footer"><div id="pvProgress" class="pv-progress"></div>' +
            '<div id="pvCounter" class="pv-counter"></div></footer>' +

            '<div id="pvAyuda" class="pv-ayuda"><div class="pv-ayuda-box"><h3>Atajos de teclado</h3>' +
            "<ul><li><kbd>←</kbd> <kbd>→</kbd> <kbd>Espacio</kbd> navegar</li><li><kbd>Home</kbd> <kbd>End</kbd> primer / último</li>" +
            "<li><kbd>M</kbd> menú de slides</li><li><kbd>G</kbd> ir al slide número…</li><li><kbd>N</kbd> guion del presentador</li>" +
            "<li><kbd>T</kbd> tema claro / oscuro</li><li><kbd>F</kbd> pantalla completa</li><li><kbd>Esc</kbd> cerrar desglose / menú / presentación</li></ul>" +
            '<button type="button" id="pvAyudaCerrar">Entendido</button></div></div>' +

            '<div id="pvDrill" class="pv-drill-overlay"></div>';

        document.body.appendChild(root);
        document.body.style.overflow = "hidden";

        // Tabs de sección
        document.getElementById("pvTabs").innerHTML = SECCIONES.map(function(s) {
            return '<button type="button" data-sec="' + s.id + '">' + s.id + "</button>";
        }).join("");

        root.addEventListener("click", clicEnRaiz);
        root.addEventListener("mousemove", despertar);
        root.addEventListener("touchstart", despertar, { passive: true });

        // Swipe
        let x0 = null;
        const cont = document.getElementById("pvSlides");
        cont.addEventListener("touchstart", function(e) { x0 = e.touches[0].clientX; }, { passive: true });
        cont.addEventListener("touchend", function(e) {
            if (x0 === null) return;
            const dx = e.changedTouches[0].clientX - x0;
            if (Math.abs(dx) > 60) cambiar(dx < 0 ? 1 : -1);
            x0 = null;
        });

        if (!tecladoOk) {
            document.addEventListener("keydown", teclado);
            tecladoOk = true;
        }

        despertar();
    }

    function despertar() {
        if (!root) return;
        root.classList.remove("pv-idle");
        clearTimeout(idleTimer);
        idleTimer = setTimeout(function() { if (root) root.classList.add("pv-idle"); }, 3500);
    }

    function clicEnRaiz(e) {

        const t = e.target;

        const drillEl = t.closest("[data-drill]");
        if (drillEl) {
            e.preventDefault();
            abrirDrill(drillEl.dataset.drill, drillEl.dataset.valor);
            return;
        }

        const go = t.closest("[data-go]");
        if (go) {
            cerrarMenu();
            irA(Number(go.dataset.go));
            return;
        }

        const tab = t.closest("[data-sec]");
        if (tab) {
            const i = slides.findIndex(function(s) { return s.sec === tab.dataset.sec; });
            if (i !== -1) irA(i);
            return;
        }

        const id = t.closest("button") ? t.closest("button").id : "";

        if (id === "pvBtnCerrar") cerrar();
        else if (id === "pvBtnFull") alternarPantalla();
        else if (id === "pvBtnMenu") alternarMenu();
        else if (id === "pvMenuCerrar") cerrarMenu();
        else if (id === "pvBtnNotas") alternarNotas();
        else if (id === "pvBtnTema") alternarTema();
        else if (id === "pvPrev") cambiar(-1);
        else if (id === "pvNext") cambiar(1);
        else if (id === "pvAyudaCerrar") document.getElementById("pvAyuda").classList.remove("show");
        else if (id === "pvDrillCerrar") cerrarDrill();
        else if (t.id === "pvDrill") cerrarDrill();
    }

    function renderMenu() {
        let secActual = "";
        document.getElementById("pvMenuLista").innerHTML = slides.map(function(s, i) {
            let cab = "";
            if (s.sec !== secActual) {
                secActual = s.sec;
                cab = '<div class="pv-menu-sec">' + esc(secActual) + "</div>";
            }
            return cab + '<button type="button" class="pv-menu-item" data-go="' + i + '"><span>' + (i + 1) + "</span>" + esc(s.titulo) + "</button>";
        }).join("");
    }

    function alternarMenu() { document.getElementById("pvMenu").classList.toggle("show"); }
    function cerrarMenu() { document.getElementById("pvMenu").classList.remove("show"); }
    function alternarNotas() { document.getElementById("pvNotas").classList.toggle("show"); }

    function alternarTema() {
        temaClaro = !temaClaro;
        root.classList.toggle("pv-light", temaClaro);
        ejecutarInit();    // redibuja gráficos con colores del tema
    }


    /* ============================================================
       NAVEGACIÓN
       ============================================================ */

    function irA(i) {

        if (!slides.length) return;

        actual = Math.max(0, Math.min(Number(i) || 0, slides.length - 1));

        root.querySelectorAll("#pvSlides .pv-slide").forEach(function(el, idx) {
            el.classList.toggle("active", idx === actual);
            if (idx === actual) el.scrollTop = 0;
        });

        const s = slides[actual];

        // Tabs
        root.querySelectorAll("#pvTabs button").forEach(function(b) {
            b.classList.toggle("active", b.dataset.sec === s.sec);
        });

        // Menú
        root.querySelectorAll(".pv-menu-item").forEach(function(b) {
            b.classList.toggle("active", Number(b.dataset.go) === actual);
        });

        // Guion
        document.getElementById("pvNotasTexto").textContent = s.notas || "Sin notas para esta diapositiva.";

        // Contador y progreso
        document.getElementById("pvCounter").textContent = (actual + 1) + " / " + slides.length;
        document.getElementById("pvProgress").innerHTML = slides.map(function(_, k) {
            return '<button type="button" class="' + (k === actual ? "active" : "") + '" data-go="' + k + '" title="Slide ' + (k + 1) + '"></button>';
        }).join("");

        ejecutarInit();
    }

    function cambiar(d) { irA(actual + d); }

    function ejecutarInit() {
        destruirGraficos();
        const s = slides[actual];
        if (s && typeof s.init === "function" && typeof Chart !== "undefined") {
            setTimeout(function() {
                try { s.init(); } catch (e) { console.error("Presentación: error en gráfico", e); }
            }, 80);
        }
    }

    function teclado(e) {

        if (!root) return;

        const t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;

        const k = e.key;
        const drillAbierto = document.getElementById("pvDrill").classList.contains("show");

        if (k === "Escape") {
            if (drillAbierto) return cerrarDrill();
            if (document.getElementById("pvAyuda").classList.contains("show")) return document.getElementById("pvAyuda").classList.remove("show");
            if (document.getElementById("pvMenu").classList.contains("show")) return cerrarMenu();
            return cerrar();
        }

        if (drillAbierto) return;

        if (k === "ArrowRight" || k === "PageDown" || k === " ") { e.preventDefault(); cambiar(1); }
        else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); cambiar(-1); }
        else if (k === "Home") { e.preventDefault(); irA(0); }
        else if (k === "End") { e.preventDefault(); irA(slides.length - 1); }
        else if (k === "m" || k === "M") alternarMenu();
        else if (k === "n" || k === "N") alternarNotas();
        else if (k === "t" || k === "T") alternarTema();
        else if (k === "f" || k === "F") alternarPantalla();
        else if (k === "?" || k === "h" || k === "H") document.getElementById("pvAyuda").classList.toggle("show");
        else if (k === "g" || k === "G") {
            const n = parseInt(window.prompt("Ir al slide número (1 – " + slides.length + "):"), 10);
            if (n) irA(n - 1);
        }
    }


    /* ============================================================
       DESGLOSE (clic en conductor / ruta / furgón / fecha)
       ============================================================ */

    function abrirDrill(tipo, valor) {

        const filtro = {
            conductor: function(v) { return v.conductor === valor; },
            ruta: function(v) { return rutaDe(v) === valor; },
            furgon: function(v) { return v.furgon === valor; },
            fecha: function(v) { return v.fecha === valor; }
        }[tipo];

        if (!filtro) return;

        const lista = viajes.filter(filtro).sort(function(a, b) {
            return a.fecha === b.fecha ? 0 : (a.fecha < b.fecha ? -1 : 1);
        });

        const bad = lista.filter(esMalo).length;
        const conNota = lista.filter(function(v) { return esMalo(v) && v.notas; }).length;
        const rutas = {};
        lista.forEach(function(v) { rutas[rutaDe(v)] = (rutas[rutaDe(v)] || 0) + 1; });

        const etiqueta = tipo === "fecha" ? fechaBonita(valor) : valor;
        const nombreTipo = { conductor: "Conductor", ruta: "Ruta", furgon: "Furgón", fecha: "Fecha" }[tipo];

        const filas = lista.map(function(v) {
            return "<tr><td>" + fechaBonita(v.fecha) + "</td>" +
                "<td>" + esc(tipo === "conductor" ? rutaDe(v) : v.conductor + (tipo === "ruta" ? "" : " · " + rutaDe(v))) + "</td>" +
                "<td>" + esc(v.salida) + " – " + esc(v.llegada) + "</td>" +
                "<td>" + fmtMin(v.real) + " / " + fmtMin(v.max) + "</td>" +
                "<td>" + (v.exceso ? '<b class="pv-text-danger">+' + v.exceso + " min</b>" : "—") + "</td>" +
                "<td>" + badge(v.estadoODT) + "</td>" +
                '<td class="pv-nota-celda">' + (v.notas ? esc(v.notas) : (esMalo(v) ? '<span class="pv-text-warn">Sin justificación</span>' : '<span class="pv-sin-nota">—</span>')) + "</td></tr>";
        }).join("");

        const rutasTxt = Object.entries(rutas).sort(function(a, b) { return b[1] - a[1]; })
            .map(function(e) { return '<span class="pv-tag">' + esc(e[0]) + " <b>×" + e[1] + "</b></span>"; }).join("");

        const ov = document.getElementById("pvDrill");

        ov.innerHTML =
            '<div class="pv-drill-box">' +
            '<div class="pv-drill-head"><div><small>' + nombreTipo.toUpperCase() + "</small><h3>" + esc(etiqueta) + "</h3></div>" +
            '<button type="button" id="pvDrillCerrar"><i class="bi bi-x-lg"></i></button></div>' +
            '<div class="pv-drill-kpis">' +
            "<div><span>Viajes</span><b>" + lista.length + "</b></div>" +
            "<div><span>Incumplidos</span><b class=\"" + (bad ? "pv-text-danger" : "") + '">' + bad + "</b></div>" +
            "<div><span>Con justificación</span><b>" + conNota + " / " + bad + "</b></div>" +
            "<div><span>Rutas distintas</span><b>" + Object.keys(rutas).length + "</b></div>" +
            "<div><span>Cumplimiento</span><b>" + pct(lista.length - bad, lista.length).toFixed(1) + "%</b></div>" +
            "</div>" +
            (tipo === "conductor" ? '<div class="pv-drill-tags">' + rutasTxt + "</div>" : "") +
            '<div class="pv-drill-tabla"><table class="pv-table pv-compacta"><thead><tr><th>Fecha</th><th>' +
            (tipo === "conductor" ? "Ruta" : "Conductor / Ruta") +
            "</th><th>Horario</th><th>Real / Máx.</th><th>Exceso</th><th>Estado</th><th>Justificación</th></tr></thead><tbody>" + filas + "</tbody></table></div>" +
            '<div class="pv-drill-pie">Esc para volver a la presentación</div></div>';

        ov.classList.add("show");
    }

    function cerrarDrill() {
        const ov = document.getElementById("pvDrill");
        if (ov) ov.classList.remove("show");
    }


    /* ============================================================
       GRÁFICOS
       ============================================================ */

    function colores() {
        return temaClaro
            ? { ok: "#16a34a", bad: "#dc2626", txt: "#334155", grid: "rgba(15,23,42,.1)" }
            : { ok: "#22c55e", bad: "#ef4444", txt: "#cbd5e1", grid: "rgba(255,255,255,.08)" };
    }

    function dona(id, ok, bad) {

        const canvas = document.getElementById(id);
        if (!canvas) return;

        const c = colores();
        const total = ok + bad;

        charts.push(new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: ["Cumplidos", "Incumplidos"],
                datasets: [{ data: [ok, bad], backgroundColor: [c.ok, c.bad], borderWidth: 0 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: "66%",
                plugins: {
                    legend: { position: "bottom", labels: { color: c.txt, font: { size: 15 } } },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return " " + ctx.label + ": " + ctx.parsed + " (" + pct(ctx.parsed, total).toFixed(1) + "%)";
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: "centro",
                afterDraw: function(chart) {
                    const a = chart.chartArea, g = chart.ctx;
                    g.save();
                    g.textAlign = "center"; g.textBaseline = "middle";
                    g.fillStyle = c.txt;
                    g.font = "700 34px sans-serif";
                    g.fillText(pct(ok, total).toFixed(1) + "%", (a.left + a.right) / 2, (a.top + a.bottom) / 2);
                    g.restore();
                }
            }]
        }));
    }

    function destruirGraficos() {
        charts.forEach(function(c) { try { c.destroy(); } catch (e) { /* nada */ } });
        charts = [];
    }


    /* ============================================================
       CERRAR / PANTALLA COMPLETA
       ============================================================ */

    function cerrar() {

        destruirGraficos();
        clearTimeout(idleTimer);

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(function() {});
        }

        if (root) { root.remove(); root = null; }

        slides = []; viajes = []; actual = 0;
        document.body.style.overflow = "";
    }

    function pantallaCompleta() {
        if (root && root.requestFullscreen) root.requestFullscreen().catch(function() {});
    }

    function alternarPantalla() {
        if (document.fullscreenElement) document.exitFullscreen().catch(function() {});
        else pantallaCompleta();
    }


    /* ============================================================
       ESTILOS
       ============================================================ */

    function agregarEstilos() {

        if (document.getElementById("pv-estilos")) return;

        const style = document.createElement("style");
        style.id = "pv-estilos";

        style.textContent = `

        #presentacionViajes{
            --bg1:#07111f;--bg2:#0d1b2e;--card:rgba(255,255,255,.055);--card2:rgba(255,255,255,.035);
            --line:rgba(255,255,255,.09);--txt:#f8fafc;--txt2:#cbd5e1;--mut:#94a3b8;--mut2:#64748b;
            --acc:#60a5fa;--ok:#4ade80;--bad:#fb7185;--warn:#facc15;--bar:rgba(5,15,28,.78);--th:#122237;
            position:fixed;inset:0;z-index:999999;color:var(--txt);overflow:hidden;
            background:linear-gradient(135deg,var(--bg1) 0%,var(--bg2) 55%,#101d30 100%);
            font-family:Inter,"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
            font-size:17px;
        }
        #presentacionViajes.pv-light{
            --bg1:#f1f5fb;--bg2:#e6edf8;--card:#ffffff;--card2:#f7f9fc;--line:rgba(15,23,42,.12);
            --txt:#0f172a;--txt2:#334155;--mut:#64748b;--mut2:#94a3b8;--acc:#2563eb;--ok:#15803d;--bad:#dc2626;
            --warn:#b45309;--bar:rgba(255,255,255,.88);--th:#e2e8f0;
            background:linear-gradient(135deg,var(--bg1),var(--bg2));
        }
        #presentacionViajes *{box-sizing:border-box}
        #presentacionViajes button{font-family:inherit}

        .pv-background{position:absolute;inset:0;pointer-events:none;
            background:radial-gradient(circle at 20% 20%,rgba(13,110,253,.14),transparent 30%),
                       radial-gradient(circle at 80% 80%,rgba(13,202,240,.09),transparent 30%)}

        /* ---- Header ---- */
        .pv-header{position:absolute;top:0;left:0;right:0;height:72px;display:flex;align-items:center;
            justify-content:space-between;gap:16px;padding:0 28px;border-bottom:1px solid var(--line);
            background:var(--bar);backdrop-filter:blur(14px);z-index:10}
        .pv-brand{display:flex;align-items:center;gap:12px;flex:none}
        .pv-brand-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:20px;color:#fff;
            background:linear-gradient(135deg,#0d6efd,#0dcaf0)}
        .pv-brand strong{display:block;font-size:13px;letter-spacing:1.5px}
        .pv-brand small{color:var(--mut)}
        .pv-tabs{display:flex;gap:4px;overflow-x:auto;flex:1;justify-content:center}
        .pv-tabs button{border:0;background:transparent;color:var(--mut);font-size:13px;font-weight:600;
            padding:8px 14px;border-radius:999px;cursor:pointer;white-space:nowrap;transition:.2s}
        .pv-tabs button:hover{color:var(--txt);background:var(--card)}
        .pv-tabs button.active{background:var(--acc);color:#fff}
        .pv-header-actions{display:flex;gap:8px;flex:none}
        .pv-header-actions button{width:40px;height:40px;border:1px solid var(--line);background:var(--card);
            color:var(--txt);border-radius:10px;cursor:pointer;font-size:16px}
        .pv-header-actions button:hover{background:var(--acc);color:#fff}

        /* ---- Slides ---- */
        .pv-slides{position:absolute;top:72px;bottom:64px;left:0;right:0;overflow:hidden}
        .pv-slide{position:absolute;inset:0;padding:40px 7vw 36px;overflow-y:auto;opacity:0;visibility:hidden;
            transform:translateX(30px) scale(.985);pointer-events:none;
            transition:opacity .3s ease,transform .3s ease,visibility .3s}
        .pv-slide.active{opacity:1;visibility:visible;transform:none;pointer-events:auto}

        .pv-slide-title{display:flex;align-items:center;gap:18px;margin-bottom:28px}
        .pv-slide-title-icon{width:58px;height:58px;border-radius:16px;display:grid;place-items:center;
            background:rgba(96,165,250,.16);color:var(--acc);font-size:25px;flex:none}
        .pv-slide-title h2{margin:0;font-size:clamp(28px,3vw,40px);font-weight:800}
        .pv-slide-title p{margin:4px 0 0;color:var(--mut)}
        .pv-pagina{margin-left:auto;padding:6px 14px;border-radius:999px;background:var(--card);
            border:1px solid var(--line);color:var(--mut);font-weight:700;font-size:14px}

        /* ---- Portada ---- */
        .pv-cover{display:flex;align-items:center;justify-content:center;text-align:center}
        .pv-cover-content{max-width:900px}
        .pv-cover-logo{display:inline-block;margin:0 auto 26px;padding:18px 30px;border-radius:24px;background:#fff;
            box-shadow:0 20px 60px rgba(13,110,253,.25)}
        .pv-cover-logo img{display:block;max-width:260px;max-height:120px;object-fit:contain}
        .pv-eyebrow{color:var(--acc);font-weight:800;letter-spacing:4px;font-size:13px}
        .pv-cover h1{font-size:clamp(46px,7vw,88px);margin:10px 0;font-weight:800}
        .pv-cover-subtitle{color:var(--mut);font-size:20px}
        .pv-period{display:inline-flex;align-items:center;gap:10px;margin-top:18px;padding:12px 20px;
            border-radius:999px;background:var(--card);border:1px solid var(--line)}
        .pv-cover-stat{margin-top:40px}
        .pv-cover-stat strong{display:block;font-size:72px;line-height:1}
        .pv-cover-stat span{color:var(--mut)}

        /* ---- Agenda ---- */
        .pv-agenda{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;max-width:1100px}
        .pv-agenda-item{display:flex;align-items:center;gap:14px;padding:18px 20px;text-align:left;cursor:pointer;
            border-radius:16px;background:var(--card);border:1px solid var(--line);color:var(--txt);transition:.2s}
        .pv-agenda-item:hover{transform:translateX(5px);border-color:var(--acc);background:var(--card2)}
        .pv-agenda-n{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-weight:800;
            background:rgba(96,165,250,.16);color:var(--acc);flex:none}
        .pv-agenda-ico{font-size:22px;color:var(--acc)}
        .pv-agenda-item span:nth-child(3){flex:1;display:flex;flex-direction:column}
        .pv-agenda-item strong{font-size:18px}
        .pv-agenda-item small{color:var(--mut);font-size:13px}
        .pv-agenda-item>i{color:var(--mut)}

        /* ---- KPIs ---- */
        .pv-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px}
        .pv-kpi{padding:22px;border-radius:18px;display:flex;gap:16px;align-items:center;background:var(--card);border:1px solid var(--line)}
        .pv-kpi-icon{width:54px;height:54px;border-radius:14px;display:grid;place-items:center;font-size:23px;flex:none}
        .pv-kpi span{display:block;color:var(--mut);font-size:14px}
        .pv-kpi strong{display:block;font-size:32px;margin-top:2px;line-height:1.1}
        .pv-kpi em{display:block;font-style:normal;color:var(--mut2);font-size:12px;margin-top:2px}
        .pv-primary .pv-kpi-icon{background:rgba(13,110,253,.18);color:#60a5fa}
        .pv-success .pv-kpi-icon{background:rgba(25,135,84,.18);color:var(--ok)}
        .pv-danger .pv-kpi-icon{background:rgba(220,53,69,.18);color:var(--bad)}
        .pv-info .pv-kpi-icon{background:rgba(13,202,240,.18);color:#22b8d8}
        .pv-warning .pv-kpi-icon{background:rgba(255,193,7,.18);color:var(--warn)}

        .pv-message{margin-top:26px;padding:24px;border-radius:18px;display:flex;gap:18px;align-items:flex-start;
            background:rgba(13,110,253,.08);border:1px solid rgba(96,165,250,.18)}
        .pv-message>i{font-size:28px;color:var(--acc)}
        .pv-message p{margin:6px 0 0;color:var(--txt2);line-height:1.7}

        /* ---- Gráficos ---- */
        .pv-chart-layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;height:calc(100% - 110px);min-height:380px}
        .pv-card{padding:24px;border-radius:20px;background:var(--card);border:1px solid var(--line);min-width:0}
        .pv-card h3{margin:0 0 6px}
        .pv-card-grande{height:calc(100% - 110px);min-height:380px}
        .pv-card-tabla{overflow:auto}
        .pv-card-tabla h3{margin-bottom:14px}
        .pv-card-tabla .pv-table-wrap{max-height:none}
        .pv-chart-box{position:relative;height:calc(100% - 40px);min-height:300px}
        .pv-card-grande .pv-chart-box{height:100%}

        /* ---- Rankings ---- */
        .pv-ranking{max-width:1050px}
        .pv-rank-row{display:grid;grid-template-columns:48px 1fr 110px;gap:16px;align-items:center;padding:14px 18px;
            margin-bottom:10px;border-radius:14px;background:var(--card);border:1px solid var(--line)}
        .pv-rank-n{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-weight:800;
            background:rgba(220,53,69,.15);color:var(--bad)}
        .pv-rank-info{display:flex;flex-direction:column;gap:2px;min-width:0}
        .pv-rank-info strong{font-size:18px}
        .pv-rank-info small{color:var(--mut)}
        .pv-bar{height:8px;margin-top:6px;border-radius:99px;background:var(--line);overflow:hidden}
        .pv-bar span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#f59e0b,#ef4444)}
        .pv-rank-val{text-align:right;font-size:28px;font-weight:800}
        .pv-rank-val small{display:block;font-size:12px;color:var(--mut2);font-weight:500}

        /* ---- Tablas ---- */
        .pv-table-wrap{overflow:auto;max-height:calc(100% - 100px);border-radius:16px;border:1px solid var(--line);background:var(--card2)}
        .pv-table{width:100%;border-collapse:collapse}
        .pv-table th{position:sticky;top:0;background:var(--th);color:var(--mut);text-transform:uppercase;
            font-size:12px;letter-spacing:.8px;z-index:2;text-align:left;padding:14px 16px}
        .pv-table td{padding:14px 16px;border-bottom:1px solid var(--line);color:var(--txt2);text-align:left;vertical-align:middle}
        .pv-table tr:last-child td{border-bottom:0}
        .pv-table tbody tr:hover td{background:var(--card)}
        .pv-compacta th,.pv-compacta td{padding:10px 12px;font-size:14px}
        .pv-nota-celda{max-width:340px;white-space:normal;line-height:1.4}
        .pv-sin-nota{color:var(--mut2)}
        .pv-vacio{text-align:center!important;color:var(--mut2)!important;padding:30px!important}

        .pv-chip{display:inline-block;padding:5px 11px;border-radius:999px;font-size:13px;font-weight:800;white-space:nowrap}
        .pv-good{color:var(--ok);background:rgba(25,135,84,.15)}
        .pv-medium{color:var(--warn);background:rgba(255,193,7,.15)}
        .pv-bad{color:var(--bad);background:rgba(220,53,69,.15)}
        .pv-text-danger{color:var(--bad)!important}
        .pv-text-warn{color:var(--warn);font-weight:700}

        .pv-drill{color:inherit;text-decoration:none;border-bottom:1px dashed var(--acc);cursor:pointer}
        .pv-drill:hover{color:var(--acc)}

        /* ---- Incumplimientos ---- */
        .pv-inc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
        .pv-inc{padding:20px;border-radius:18px;background:rgba(220,53,69,.07);border:1px solid rgba(220,53,69,.2);min-width:0}
        .pv-inc-top{display:flex;align-items:center;gap:14px}
        .pv-inc-top>div:nth-child(2){flex:1;min-width:0}
        .pv-inc-top strong{font-size:18px}
        .pv-inc-top small{display:block;color:var(--mut);margin-top:2px}
        .pv-inc-n{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-weight:800;
            background:rgba(220,53,69,.18);color:var(--bad);flex:none}
        .pv-inc-ruta{margin:14px 0 4px;font-weight:700;font-size:17px}
        .pv-inc-ruta i{color:var(--acc);margin:0 4px}
        .pv-inc-datos{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}
        .pv-inc-datos small{display:block;color:var(--mut2);font-size:10px;font-weight:700;letter-spacing:.7px}
        .pv-inc-datos b{display:block;margin-top:3px;font-size:14px}
        .pv-inc-nota{display:flex;gap:12px;margin-top:14px;padding:14px 16px;border-radius:12px;
            background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.2)}
        .pv-inc-nota>i{font-size:18px;color:var(--acc);padding-top:2px}
        .pv-inc-nota small{display:block;font-size:10px;font-weight:800;letter-spacing:.8px;color:var(--acc)}
        .pv-inc-nota p{margin:5px 0 0;line-height:1.5;color:var(--txt);font-size:15px;overflow-wrap:anywhere}
        .pv-inc-nota.pv-sin{background:rgba(255,193,7,.08);border-color:rgba(255,193,7,.3)}
        .pv-inc-nota.pv-sin>i,.pv-inc-nota.pv-sin small{color:var(--warn)}
        .pv-inc-nota.pv-sin p{color:var(--mut);font-style:italic}

        /* ---- Vacío ---- */
        .pv-empty{text-align:center;padding:60px 20px}
        .pv-empty i{font-size:80px;color:var(--ok)}
        .pv-empty p{color:var(--mut)}

        /* ---- Conclusiones ---- */
        .pv-score{max-width:620px;margin:0 0 24px;text-align:center}
        .pv-score span{color:var(--mut)}
        .pv-score strong{display:block;font-size:72px;margin:2px 0;line-height:1.1}
        .pv-score-bar{height:14px;border-radius:99px;background:var(--line);overflow:hidden}
        .pv-score-bar span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#0d6efd,#20c997)}
        .pv-score small{display:block;margin-top:8px;color:var(--ok)}
        .pv-conclusion .pv-slide-title{margin-bottom:18px}
        .pv-conclusion{display:block}
        .pv-hallazgos{padding:22px 26px;border-radius:18px;background:var(--card);border:1px solid var(--line)}
        .pv-hallazgos h3{margin:0 0 10px;font-size:18px}
        .pv-hallazgos ul{margin:0;padding-left:22px;line-height:1.9;color:var(--txt2)}
        .pv-final{margin-top:26px;display:flex;flex-direction:column;gap:4px;color:var(--mut2);font-size:12px;letter-spacing:1px;text-align:center}

        /* ---- Menú lateral ---- */
        .pv-menu{position:absolute;top:72px;bottom:64px;left:0;width:330px;max-width:85vw;z-index:30;transform:translateX(-102%);
            transition:transform .25s ease;background:var(--bar);backdrop-filter:blur(16px);border-right:1px solid var(--line);
            display:flex;flex-direction:column}
        .pv-menu.show{transform:none}
        .pv-menu-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--line)}
        .pv-menu-head button{border:0;background:transparent;color:var(--mut);cursor:pointer;font-size:16px}
        .pv-menu-lista{overflow-y:auto;padding:8px 10px 16px}
        .pv-menu-sec{margin:14px 8px 6px;font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--acc)}
        .pv-menu-item{display:flex;gap:10px;align-items:center;width:100%;border:0;background:transparent;color:var(--txt2);
            padding:9px 10px;border-radius:10px;cursor:pointer;text-align:left;font-size:14px}
        .pv-menu-item span{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-size:12px;font-weight:700;
            background:var(--card);flex:none}
        .pv-menu-item:hover{background:var(--card)}
        .pv-menu-item.active{background:var(--acc);color:#fff}
        .pv-menu-item.active span{background:rgba(255,255,255,.25)}

        /* ---- Guion ---- */
        .pv-notas{position:absolute;left:50%;bottom:78px;transform:translate(-50%,20px);width:min(900px,92vw);z-index:25;
            padding:14px 20px;border-radius:16px;background:var(--bar);backdrop-filter:blur(16px);border:1px solid var(--acc);
            opacity:0;visibility:hidden;transition:.25s}
        .pv-notas.show{opacity:1;visibility:visible;transform:translate(-50%,0)}
        .pv-notas-head{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--acc);margin-bottom:6px}
        .pv-notas p{margin:0;line-height:1.6;color:var(--txt);font-size:16px}

        /* ---- Navegación y footer ---- */
        .pv-navigation{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border-radius:50%;
            border:1px solid var(--line);background:var(--card);color:var(--txt);z-index:20;cursor:pointer;transition:opacity .4s,background .2s}
        .pv-navigation:hover{background:var(--acc);color:#fff}
        .pv-prev{left:16px}.pv-next{right:16px}
        .pv-idle .pv-navigation{opacity:0}
        .pv-footer{position:absolute;bottom:0;left:0;right:0;min-height:64px;display:flex;align-items:center;justify-content:center;
            gap:24px;border-top:1px solid var(--line);background:var(--bar);backdrop-filter:blur(14px);z-index:10}
        .pv-progress{display:flex;gap:5px;max-width:72vw;overflow-x:auto;padding:4px}
        .pv-progress button{width:16px;height:5px;flex:0 0 auto;border:0;border-radius:99px;background:var(--line);cursor:pointer;transition:.2s}
        .pv-progress button.active{width:38px;background:var(--acc)}
        .pv-counter{color:var(--mut);font-size:14px;font-weight:700;white-space:nowrap}

        /* ---- Ayuda ---- */
        .pv-ayuda{position:absolute;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(2,8,18,.7)}
        .pv-ayuda.show{display:flex}
        .pv-ayuda-box{width:min(520px,92vw);padding:28px;border-radius:20px;background:var(--bg2);border:1px solid var(--line)}
        .pv-ayuda-box h3{margin:0 0 14px}
        .pv-ayuda-box ul{list-style:none;margin:0 0 18px;padding:0;line-height:2.1;color:var(--txt2)}
        .pv-ayuda-box kbd{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:2px 8px;font-size:13px;color:var(--txt)}
        .pv-ayuda-box button{border:0;border-radius:10px;padding:10px 20px;background:var(--acc);color:#fff;font-weight:700;cursor:pointer}

        /* ---- Desglose ---- */
        .pv-drill-overlay{position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;
            padding:4vh 4vw;background:rgba(2,8,18,.72);backdrop-filter:blur(4px)}
        .pv-drill-overlay.show{display:flex}
        .pv-drill-box{width:min(1200px,100%);max-height:100%;display:flex;flex-direction:column;border-radius:20px;
            background:var(--bg2);border:1px solid var(--line);box-shadow:0 30px 80px rgba(0,0,0,.45);overflow:hidden}
        .pv-drill-head{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid var(--line)}
        .pv-drill-head small{color:var(--acc);font-weight:800;letter-spacing:1.2px;font-size:11px}
        .pv-drill-head h3{margin:2px 0 0;font-size:24px}
        .pv-drill-head button{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--txt);cursor:pointer}
        .pv-drill-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:16px 24px}
        .pv-drill-kpis div{padding:10px 14px;border-radius:12px;background:var(--card);border:1px solid var(--line)}
        .pv-drill-kpis span{display:block;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.6px}
        .pv-drill-kpis b{display:block;font-size:22px;margin-top:2px}
        .pv-drill-tags{display:flex;flex-wrap:wrap;gap:8px;padding:0 24px 12px}
        .pv-tag{padding:5px 12px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:13px;color:var(--txt2)}
        .pv-drill-tabla{overflow:auto;margin:0 24px;border-radius:12px;border:1px solid var(--line);flex:1;min-height:0}
        .pv-drill-pie{padding:12px 24px;font-size:12px;color:var(--mut2);text-align:right}

        /* ---- Scrollbar ---- */
        #presentacionViajes ::-webkit-scrollbar{width:8px;height:8px}
        #presentacionViajes ::-webkit-scrollbar-track{background:transparent}
        #presentacionViajes ::-webkit-scrollbar-thumb{background:rgba(148,163,184,.3);border-radius:99px}

        /* ---- Responsive ---- */
        @media(max-width:1100px){
            .pv-inc-grid,.pv-agenda{grid-template-columns:1fr}
            .pv-tabs{display:none}
            .pv-drill-kpis{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:900px){
            .pv-chart-layout{grid-template-columns:1fr;height:auto}
            .pv-card{min-height:360px}
            .pv-slide{padding:28px 48px}
            .pv-inc-datos{grid-template-columns:1fr 1fr}
        }
        @media(max-width:600px){
            .pv-header{padding:0 14px}
            .pv-brand small{display:none}
            .pv-slide{padding:22px 18px}
            .pv-navigation{display:none}
            .pv-slide-title-icon{width:44px;height:44px;font-size:19px}
            .pv-slide-title h2{font-size:25px}
            .pv-rank-row{grid-template-columns:40px 1fr 70px}
        }
        @media print{ #presentacionViajes{display:none!important} }
        `;

        document.head.appendChild(style);
    }

})();