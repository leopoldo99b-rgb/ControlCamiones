/*=========================================================*
 *  VIAJES-PDF.JS · Auditoría de viajes · Transportes CHC
 *  Requiere: jQuery, DataTables, jsPDF y jsPDF-AutoTable
 *  Exporta lo que está filtrado actualmente en la tabla.
 *
 *  Estructura del PDF:
 *    Pág. 1   Filtros, KPIs y gráficas de cumplimiento
 *    Pág. 2   Evolución, conductores y tiempos
 *    Pág. 3+  Detalle de viajes (las notas se marcan con un número)
 *    Anexo    Notas y observaciones (hoja(s) al final)
 *    Cierre   Firmas
 *
 *  Las gráficas se dibujan con jsPDF (no necesitan Chart.js).
 *=========================================================*/
(function () {
    "use strict";

    const PAPEL = "letter";   // cambia a "a4" si lo prefieres
    const M = 10;             // margen en mm

    const C = {
        navy950: [7, 23, 49],   navy900: [10, 31, 61],  navy800: [16, 41, 77],
        accent: [245, 158, 11],
        ink: [15, 27, 45],      ink2: [51, 65, 85],     muted: [100, 116, 139],
        line: [226, 232, 240],  lineStrong: [203, 213, 225], surface2: [247, 249, 252],
        blue: [37, 99, 235],
        green: [22, 163, 74],   greenSoft: [230, 246, 236],
        red: [220, 38, 38],     redSoft: [253, 236, 236],
        cyan: [8, 145, 178],    orange: [234, 88, 12],
        white: [255, 255, 255]
    };

    /* ---------- utilidades ---------- */

    function txt(v) {
        if (v === null || v === undefined) return "";
        return $("<div>").html(v).text().trim();
    }

    function fechaDMY(f) {
        const m = String(f).match(/^(\d{4})-(\d{2})-(\d{2})/);
        return m ? m[3] + "/" + m[2] + "/" + m[1] : f;
    }

    function compacto(t) {            // "1h 20 min" -> "1h 20m"
        return String(t).replace(/\s*min/i, "m");
    }

    function pad(n) { return String(n).padStart(2, "0"); }

    function ahora() {
        const d = new Date();
        return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() +
               " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }

    function aviso(msg, tipo) {
        if (typeof toast === "function") toast(msg, tipo);
        else alert(msg);
    }

    function fill(doc, c)   { doc.setFillColor(c[0], c[1], c[2]); }
    function stroke(doc, c) { doc.setDrawColor(c[0], c[1], c[2]); }
    function ink(doc, c)    { doc.setTextColor(c[0], c[1], c[2]); }
    function fuente(doc, estilo, size) {
        doc.setFont("helvetica", estilo);
        doc.setFontSize(size);
    }

    function recortar(doc, t, ancho) {
        t = String(t);
        if (doc.getTextWidth(t) <= ancho) return t;
        while (t.length > 1 && doc.getTextWidth(t + "...") > ancho) t = t.slice(0, -1);
        return t + "...";
    }

    function pctTxt(a, b) {
        return b ? (Math.round(a * 1000 / b) / 10) + "%" : "0%";
    }

    function nice(v) {                // paso "bonito" para ejes (1, 2, 5, 10...)
        const p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
        const f = v / p;
        const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
        return Math.max(1, n * p);
    }

    function leerFiltros() {
        const sel = function (id, todos) {
            return $(id).val() ? $(id + " option:selected").text().trim() : todos;
        };
        const fec = function (id) {
            const v = $(id).val();
            return v ? fechaDMY(v) : "Sin límite";
        };
        return [
            ["Desde", fec("#txtFechaInicio")],
            ["Hasta", fec("#txtFechaFin")],
            ["Ruta", sel("#cmbRuta", "Todas")],
            ["Conductor", sel("#cmbConductor", "Todos")],
            ["Estado ODT", sel("#cmbEstadoODT", "Todos")],
            ["Estado furgón", sel("#cmbEstadoFurgon", "Todos")]
        ];
    }

    /* ---------- preparación de datos para las gráficas ---------- */

    function aMin(t) {                // "1h 20 min" / "45 min" / "2h" -> minutos
        t = String(t);
        const h = t.match(/(\d+)\s*h/i);
        const m = t.match(/(\d+)\s*m/i);
        if (!h && !m) return null;
        return (h ? +h[1] : 0) * 60 + (m ? +m[1] : 0);
    }

    function fmtMin(n) {
        const s = n < 0 ? "-" : "";
        n = Math.abs(Math.round(n));
        const h = Math.floor(n / 60), m = n % 60;
        return s + (h ? h + "h " : "") + m + "m";
    }

    function conSigno(n) { return (n > 0 ? "+" : "") + fmtMin(n); }

    function excesoMin(texto, real, max) {
        const m = aMin(texto);
        const t = String(texto).trim();
        if (m !== null) {
            if (t.charAt(0) === "-") return -m;
            if (t.charAt(0) === "+") return m;
        }
        if (real !== null && max !== null) return real - max;
        return m === 0 ? 0 : null;
    }

    function esOk(v) { return String(v).trim().toUpperCase() === "CUMPLIDO"; }

    function normalizar(datos) {
        return datos.map(function (f, i) {
            const real = aMin(txt(f[9])), max = aMin(txt(f[10]));
            const nota = txt(f[14]);
            return {
                n: i + 1,
                fecha: txt(f[1]),
                conductor: txt(f[2]) || "Sin asignar",
                placa: txt(f[3]),
                ruta: (txt(f[5]) || "?") + " > " + (txt(f[6]) || "?"),
                exceso: excesoMin(txt(f[11]), real, max),
                odt: esOk(txt(f[12])),
                fur: esOk(txt(f[13])),
                nota: /^[\s.\-\u2013\u2014]*$/.test(nota) ? "" : nota,
                ref: 0
            };
        });
    }

    function agrupar(viajes, clave) {
        const mapa = Object.create(null), orden = [];
        viajes.forEach(function (v) {
            const k = clave(v);
            if (!mapa[k]) {
                mapa[k] = { clave: k, total: 0, odtOk: 0, odtNo: 0, furOk: 0, furNo: 0, excSuma: 0, excN: 0 };
                orden.push(k);
            }
            const g = mapa[k];
            g.total++;
            if (v.odt) g.odtOk++; else g.odtNo++;
            if (v.fur) g.furOk++; else g.furNo++;
            if (v.exceso !== null) { g.excSuma += v.exceso; g.excN++; }
        });
        return orden.map(function (k) { return mapa[k]; });
    }

    function topConOtras(grupos, max, etiqueta) {
        const orden = grupos.slice().sort(function (a, b) { return b.total - a.total; });
        if (orden.length <= max) return orden;
        const top = orden.slice(0, max - 1);
        const resto = orden.slice(max - 1);
        const o = { clave: etiqueta + " (" + resto.length + ")", total: 0, odtOk: 0, odtNo: 0, furOk: 0, furNo: 0, excSuma: 0, excN: 0 };
        resto.forEach(function (g) {
            ["total", "odtOk", "odtNo", "furOk", "furNo", "excSuma", "excN"].forEach(function (k) { o[k] += g[k]; });
        });
        top.push(o);
        return top;
    }

    function parseFecha(f) {
        const m = String(f).match(/^(\d{4})-(\d{2})-(\d{2})/);
        return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
    }

    function serieTemporal(viajes) {
        const DIA = 86400000;
        const con = [];
        viajes.forEach(function (v) {
            const t = parseFecha(v.fecha);
            if (t !== null) con.push({ v: v, t: t });
        });
        if (!con.length) return { serie: [], sub: "" };

        let tmin = con[0].t, tmax = con[0].t;
        const distintos = Object.create(null);
        con.forEach(function (o) {
            if (o.t < tmin) tmin = o.t;
            if (o.t > tmax) tmax = o.t;
            distintos[o.t] = true;
        });

        let modo = "mes", sub = "Viajes por mes";
        if (Object.keys(distintos).length <= 31) { modo = "dia"; sub = "Viajes por día"; }
        else if ((tmax - tmin) / DIA <= 210) { modo = "semana"; sub = "Viajes por semana (la etiqueta indica el lunes de inicio)"; }

        const clave = function (t) {
            const d = new Date(t);
            if (modo === "dia") return t;
            if (modo === "semana") return t - ((d.getUTCDay() + 6) % 7) * DIA;
            return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
        };
        const etiqueta = function (t) {
            const d = new Date(t);
            if (modo === "mes") return pad(d.getUTCMonth() + 1) + "/" + String(d.getUTCFullYear()).slice(2);
            return pad(d.getUTCDate()) + "/" + pad(d.getUTCMonth() + 1);
        };

        const mapa = Object.create(null);
        con.forEach(function (o) {
            const k = clave(o.t);
            if (!mapa[k]) mapa[k] = { t: k, ok: 0, no: 0 };
            if (o.v.odt) mapa[k].ok++; else mapa[k].no++;
        });

        let serie = Object.keys(mapa).map(function (k) { return mapa[k]; })
            .sort(function (a, b) { return a.t - b.t; });
        if (serie.length > 40) serie = serie.slice(-40);
        serie.forEach(function (s) { s.etq = etiqueta(s.t); });
        return { serie: serie, sub: sub };
    }

    /* ---------- bloques de diseño ---------- */

    function cabecera(doc, W, emitido) {
        doc.setFillColor.apply(doc, C.navy900);
        doc.rect(0, 0, W, 24, "F");

        // franja "carretera"
        doc.setFillColor.apply(doc, C.navy950);
        doc.rect(0, 24, W, 4.5, "F");
        doc.setDrawColor.apply(doc, C.accent);
        doc.setLineWidth(0.5);
        doc.setLineDashPattern([5, 3.5], 0);
        doc.line(0, 26.25, W, 26.25);
        doc.setLineDashPattern([], 0);

        // logo (camión)
        doc.setFillColor.apply(doc, C.accent);
        doc.roundedRect(M, 5.5, 13, 13, 2.5, 2.5, "F");
        doc.setFillColor.apply(doc, C.navy950);
        doc.rect(M + 2, 9.5, 6.2, 4.4, "F");
        doc.rect(M + 8.6, 11.1, 2.6, 2.8, "F");
        doc.circle(M + 4.2, 14.7, 0.9, "F");
        doc.circle(M + 9.8, 14.7, 0.9, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text("TRANSPORTES CHC", M + 17, 11.8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(159, 179, 209);
        doc.text("Sistema de gestión de viajes", M + 17, 16.8);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor.apply(doc, C.accent);
        doc.text("AUDITORÍA DE VIAJES", W - M, 11.8, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(159, 179, 209);
        doc.text("Emitido: " + emitido, W - M, 16.8, { align: "right" });
    }

    function cabeceraCompacta(doc, W, emitido) {
        doc.setFillColor.apply(doc, C.navy900);
        doc.rect(0, 0, W, 11, "F");
        doc.setFillColor.apply(doc, C.accent);
        doc.rect(0, 11, W, 1, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text("TRANSPORTES CHC  |  Auditoría de viajes", M, 7);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(159, 179, 209);
        doc.text("Emitido: " + emitido, W - M, 7, { align: "right" });
    }

    function seccion(doc, texto, y) {
        doc.setFillColor.apply(doc, C.accent);
        doc.rect(M, y - 3, 1.2, 4, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor.apply(doc, C.navy800);
        doc.text(texto, M + 3, y);
    }

    function filtros(doc, W, y, lista) {
        const gap = 2.5, n = lista.length;
        const w = (W - 2 * M - gap * (n - 1)) / n, h = 11;

        lista.forEach(function (f, i) {
            const x = M + i * (w + gap);
            doc.setFillColor.apply(doc, C.surface2);
            doc.setDrawColor.apply(doc, C.line);
            doc.setLineWidth(0.2);
            doc.roundedRect(x, y, w, h, 1.8, 1.8, "FD");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(5.5);
            doc.setTextColor.apply(doc, C.muted);
            doc.text(f[0].toUpperCase(), x + 2.5, y + 4);

            doc.setFontSize(7.5);
            doc.setTextColor.apply(doc, C.ink);
            doc.text(recortar(doc, f[1], w - 5), x + 2.5, y + 8.4);
        });
    }

    function kpis(doc, W, y, lista) {
        const gap = 3, n = lista.length;
        const w = (W - 2 * M - gap * (n - 1)) / n, h = 17;

        lista.forEach(function (k, i) {
            const x = M + i * (w + gap);
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor.apply(doc, C.line);
            doc.setLineWidth(0.2);
            doc.roundedRect(x, y, w, h, 1.8, 1.8, "FD");

            doc.setFillColor.apply(doc, k.color);
            doc.rect(x + 0.4, y, w - 0.8, 1.4, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(5.4);
            doc.setTextColor.apply(doc, C.muted);
            doc.text(k.label, x + 3, y + 5.8);

            doc.setFontSize(15);
            doc.setTextColor.apply(doc, k.color);
            doc.text(k.valor, x + 3, y + 13.4);
        });
    }

    /* marcador numerado que enlaza una fila con su nota del anexo */
    function pildora(doc, cx, cy, n) {
        const t = String(n);
        fuente(doc, "bold", 5.4);
        const w = Math.max(4.4, doc.getTextWidth(t) + 2.8), h = 3.6;
        fill(doc, C.accent);
        doc.roundedRect(cx - w / 2, cy - h / 2, w, h, 1.8, 1.8, "F");
        ink(doc, C.navy950);
        doc.text(t, cx, cy + 0.65, { align: "center" });
    }

    /* ---------- gráficas ---------- */

    function tarjeta(doc, x, y, w, h, titulo, sub) {
        fill(doc, C.white);
        stroke(doc, C.line);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, w, h, 1.8, 1.8, "FD");

        fill(doc, C.accent);
        doc.rect(x + 3, y + 3.2, 1, 3.6, "F");

        fuente(doc, "bold", 7.5);
        ink(doc, C.navy800);
        doc.text(titulo, x + 5.5, y + 6.2);

        if (sub) {
            fuente(doc, "normal", 6);
            ink(doc, C.muted);
            doc.text(sub, x + 5.5, y + 10);
        }
    }

    function leyenda(doc, xDer, y, items) {
        fuente(doc, "normal", 6);
        let x = xDer;
        for (let i = items.length - 1; i >= 0; i--) {
            x -= doc.getTextWidth(items[i].t);
            ink(doc, C.ink2);
            doc.text(items[i].t, x, y);
            x -= 3.2;
            fill(doc, items[i].color);
            doc.roundedRect(x, y - 2.3, 2.4, 2.4, 0.5, 0.5, "F");
            x -= 4;
        }
    }

    function mensajeVacio(doc, x, y, w, h, msg) {
        fuente(doc, "italic", 8);
        ink(doc, C.muted);
        doc.text(msg, x + w / 2, y + h / 2 + 5, { align: "center" });
    }

    function sector(doc, cx, cy, R, a0, a1, color) {
        const pasos = Math.max(4, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 45)));
        let px = R * Math.cos(a0), py = R * Math.sin(a0);
        const seg = [[px, py]];
        for (let i = 1; i <= pasos; i++) {
            const a = a0 + (a1 - a0) * i / pasos;
            const x = R * Math.cos(a), y = R * Math.sin(a);
            seg.push([x - px, y - py]);
            px = x; py = y;
        }
        fill(doc, color);
        doc.lines(seg, cx, cy, [1, 1], "F", true);
    }

    function donut(doc, cx, cy, R, r, partes) {
        const total = partes.reduce(function (a, p) { return a + p.v; }, 0);
        const activas = partes.filter(function (p) { return p.v > 0; });

        fill(doc, total ? activas[activas.length - 1].c : C.lineStrong);
        doc.circle(cx, cy, R, "F");

        let a0 = -Math.PI / 2;
        if (activas.length > 1) {
            activas.slice(0, -1).forEach(function (p) {
                const a1 = a0 + (p.v / total) * Math.PI * 2;
                sector(doc, cx, cy, R, a0, a1, p.c);
                a0 = a1;
            });
        }
        fill(doc, C.white);
        doc.circle(cx, cy, r, "F");
    }

    function graficoDonut(doc, x, y, w, h, titulo, sub, ok, no, cOk, cNo) {
        tarjeta(doc, x, y, w, h, titulo, sub);
        const total = ok + no;
        const cx = x + 27, cy = y + h / 2 + 4;

        donut(doc, cx, cy, 16.5, 10.2, [{ v: ok, c: cOk }, { v: no, c: cNo }]);

        fuente(doc, "bold", 11);
        ink(doc, C.ink);
        doc.text(total ? pctTxt(ok, total) : "-", cx, cy + 1.2, { align: "center" });
        fuente(doc, "normal", 5.2);
        ink(doc, C.muted);
        doc.text("CUMPLIMIENTO", cx, cy + 4.6, { align: "center" });

        const lx = x + 52;
        [["CUMPLIDOS", ok, cOk], ["INCUMPLIDOS", no, cNo]].forEach(function (it, i) {
            const ly = y + 21 + i * 15;
            fill(doc, it[2]);
            doc.roundedRect(lx, ly - 2.4, 2.6, 2.6, 0.6, 0.6, "F");
            fuente(doc, "bold", 5.6);
            ink(doc, C.muted);
            doc.text(it[0], lx + 4, ly);

            const num = String(it[1]);
            fuente(doc, "bold", 13);
            ink(doc, it[2]);
            doc.text(num, lx, ly + 7);
            const wNum = doc.getTextWidth(num);
            fuente(doc, "normal", 7);
            ink(doc, C.muted);
            doc.text(pctTxt(it[1], total), lx + wNum + 2, ly + 7);
        });
    }

    function graficoRutas(doc, x, y, w, h, grupos) {
        tarjeta(doc, x, y, w, h, "Cumplimiento ODT por ruta", "% de cumplimiento y, entre paréntesis, total de viajes de la ruta");
        leyenda(doc, x + w - 5, y + 6.2, [{ t: "Cumplido", color: C.green }, { t: "Incumplido", color: C.red }]);

        const filas = topConOtras(grupos, 11, "Otras rutas");
        if (!filas.length) { mensajeVacio(doc, x, y, w, h, "Sin datos"); return; }

        const top = y + 16, bottom = y + h - 5;
        const rowH = Math.min(10, (bottom - top) / filas.length);
        const barH = Math.min(6.2, rowH * 0.62);
        const labelW = 54, px = x + 5 + labelW, pw = w - 10 - labelW - 28;
        const max = Math.max.apply(null, filas.map(function (g) { return g.total; }));

        stroke(doc, C.lineStrong);
        doc.setLineWidth(0.2);
        doc.line(px, top, px, top + rowH * filas.length);

        filas.forEach(function (g, i) {
            const cy = top + i * rowH + rowH / 2;
            const by = cy - barH / 2;
            const wOk = g.odtOk / max * pw, wNo = g.odtNo / max * pw;

            fuente(doc, "normal", 6.6);
            ink(doc, C.ink2);
            doc.text(recortar(doc, g.clave, labelW - 3), x + 5, cy + 0.9);

            if (wOk > 0) { fill(doc, C.green); doc.rect(px, by, wOk, barH, "F"); }
            if (wNo > 0) { fill(doc, C.red); doc.rect(px + wOk, by, wNo, barH, "F"); }

            fuente(doc, "bold", 5.6);
            ink(doc, C.white);
            if (wOk >= 5) doc.text(String(g.odtOk), px + wOk / 2, cy + 0.7, { align: "center" });
            if (wNo >= 5) doc.text(String(g.odtNo), px + wOk + wNo / 2, cy + 0.7, { align: "center" });

            fuente(doc, "bold", 6.4);
            ink(doc, C.ink);
            doc.text(pctTxt(g.odtOk, g.total) + "  (" + g.total + ")", px + wOk + wNo + 2, cy + 0.8);
        });
    }

    function graficoPeriodo(doc, x, y, w, h, serie, sub) {
        tarjeta(doc, x, y, w, h, "Evolución de viajes y cumplimiento ODT", sub);
        leyenda(doc, x + w - 5, y + 6.2, [{ t: "ODT cumplido", color: C.green }, { t: "ODT incumplido", color: C.red }]);

        if (!serie.length) { mensajeVacio(doc, x, y, w, h, "Sin fechas válidas para graficar"); return; }

        const px = x + 14, pw = w - 14 - 6, py = y + 18, ph = h - 18 - 12;
        let maxT = 1;
        serie.forEach(function (s) { if (s.ok + s.no > maxT) maxT = s.ok + s.no; });
        const paso = nice(maxT / 4), tope = paso * Math.ceil(maxT / paso);

        doc.setLineWidth(0.15);
        for (let v = 0; v <= tope; v += paso) {
            const gy = py + ph - v / tope * ph;
            stroke(doc, v === 0 ? C.lineStrong : C.line);
            doc.line(px, gy, px + pw, gy);
            fuente(doc, "normal", 5.8);
            ink(doc, C.muted);
            doc.text(String(v), px - 2, gy + 0.8, { align: "right" });
        }

        const slot = pw / serie.length, bw = Math.min(slot * 0.62, 12);
        const skip = Math.max(1, Math.ceil(10 / slot));

        serie.forEach(function (s, i) {
            const bx = px + i * slot + (slot - bw) / 2;
            const hOk = s.ok / tope * ph, hNo = s.no / tope * ph;

            if (hOk > 0) { fill(doc, C.green); doc.rect(bx, py + ph - hOk, bw, hOk, "F"); }
            if (hNo > 0) { fill(doc, C.red); doc.rect(bx, py + ph - hOk - hNo, bw, hNo, "F"); }

            if (slot >= 5.5) {
                fuente(doc, "bold", 5.8);
                ink(doc, C.ink2);
                doc.text(String(s.ok + s.no), bx + bw / 2, py + ph - hOk - hNo - 1.2, { align: "center" });
            }
            if (i % skip === 0) {
                fuente(doc, "normal", 5.6);
                ink(doc, C.muted);
                doc.text(s.etq, bx + bw / 2, py + ph + 4.2, { align: "center" });
            }
        });
    }

    function graficoConductores(doc, x, y, w, h, grupos) {
        tarjeta(doc, x, y, w, h, "Conductores con más incumplimientos", "Cantidad de viajes incumplidos (total de viajes a la derecha)");
        leyenda(doc, x + w - 5, y + 6.2, [{ t: "ODT", color: C.red }, { t: "Furgón", color: C.orange }]);

        const lista = grupos
            .filter(function (g) { return g.odtNo + g.furNo > 0; })
            .sort(function (a, b) { return (b.odtNo + b.furNo) - (a.odtNo + a.furNo) || b.total - a.total; })
            .slice(0, 8);

        if (!lista.length) { mensajeVacio(doc, x, y, w, h, "Sin incumplimientos en el periodo"); return; }

        const top = y + 16, bottom = y + h - 5;
        const rowH = Math.min(11, (bottom - top) / lista.length);
        const barH = Math.min(3.2, rowH * 0.3);
        const labelW = 44, px = x + 5 + labelW, pw = w - 10 - labelW - 22;
        let max = 1;
        lista.forEach(function (g) { max = Math.max(max, g.odtNo, g.furNo); });

        stroke(doc, C.lineStrong);
        doc.setLineWidth(0.2);
        doc.line(px, top, px, top + rowH * lista.length);

        lista.forEach(function (g, i) {
            const cy = top + i * rowH + rowH / 2;

            fuente(doc, "normal", 6.6);
            ink(doc, C.ink2);
            doc.text(recortar(doc, g.clave, labelW - 3), x + 5, cy + 0.9);

            [[g.odtNo, C.red, -barH - 0.3], [g.furNo, C.orange, 0.3]].forEach(function (b) {
                const bw = b[0] / max * pw;
                if (bw > 0) { fill(doc, b[1]); doc.rect(px, cy + b[2], bw, barH, "F"); }
                fuente(doc, "bold", 5.6);
                ink(doc, b[1]);
                doc.text(String(b[0]), px + bw + 1.5, cy + b[2] + barH - 0.4);
            });

            fuente(doc, "normal", 6);
            ink(doc, C.muted);
            doc.text(g.total + (g.total === 1 ? " viaje" : " viajes"), x + w - 5, cy + 0.8, { align: "right" });
        });
    }

    function graficoExceso(doc, x, y, w, h, grupos) {
        tarjeta(doc, x, y, w, h, "Exceso de tiempo promedio por ruta", "Rojo: supera el tiempo máximo  |  Verde: dentro del máximo");

        const lista = grupos
            .filter(function (g) { return g.excN > 0; })
            .map(function (g) { return { clave: g.clave, prom: g.excSuma / g.excN }; })
            .sort(function (a, b) { return b.prom - a.prom; })
            .slice(0, 8);

        if (!lista.length) { mensajeVacio(doc, x, y, w, h, "Sin datos de tiempos"); return; }

        const top = y + 16, bottom = y + h - 5;
        const rowH = Math.min(11, (bottom - top) / lista.length);
        const barH = Math.min(5, rowH * 0.5);
        const labelW = 50, px = x + 5 + labelW, pw = w - 10 - labelW - 20;

        let minV = 0, maxV = 0;
        lista.forEach(function (g) { minV = Math.min(minV, g.prom); maxV = Math.max(maxV, g.prom); });
        const span = (maxV - minV) || 1;
        const zero = px + (-minV) / span * pw;

        stroke(doc, C.lineStrong);
        doc.setLineWidth(0.25);
        doc.line(zero, top, zero, top + rowH * lista.length);

        lista.forEach(function (g, i) {
            const cy = top + i * rowH + rowH / 2;
            const col = g.prom > 0 ? C.red : C.green;
            const bw = Math.abs(g.prom) / span * pw;

            fuente(doc, "normal", 6.6);
            ink(doc, C.ink2);
            doc.text(recortar(doc, g.clave, labelW - 3), x + 5, cy + 0.9);

            if (bw > 0) {
                fill(doc, col);
                doc.rect(g.prom >= 0 ? zero : zero - bw, cy - barH / 2, bw, barH, "F");
            }

            fuente(doc, "bold", 6.6);
            ink(doc, col);
            doc.text(conSigno(g.prom), x + w - 5, cy + 0.9, { align: "right" });
        });
    }

    /* ---------- configuración común de las tablas ---------- */

    function baseTabla() {
        return {
            margin: { top: 17, left: M, right: M, bottom: 16 },
            theme: "grid",
            showHead: "everyPage",
            rowPageBreak: "avoid",
            styles: {
                font: "helvetica",
                fontSize: 6.8,
                cellPadding: { top: 1.6, bottom: 1.6, left: 1.4, right: 1.4 },
                textColor: C.ink2,
                lineColor: C.line,
                lineWidth: 0.15,
                valign: "middle",
                overflow: "linebreak",
                minCellHeight: 6.5
            },
            headStyles: {
                fillColor: C.navy900,
                textColor: [230, 237, 249],
                fontStyle: "bold",
                fontSize: 6.4,
                halign: "center",
                lineColor: C.navy900
            },
            alternateRowStyles: { fillColor: C.surface2 }
        };
    }

    function estilosColumnas(anchos, alineacion) {
        const cs = {};
        anchos.forEach(function (a, i) {
            cs[i] = { cellWidth: a, halign: alineacion[i] };
        });
        return cs;
    }

    /* ---------- exportación principal ---------- */

    window.exportarAuditoriaPDF = function () {

        if (!window.jspdf || !window.jspdf.jsPDF) {
            aviso("No se cargó la librería jsPDF.", "error");
            return;
        }

        if (!$.fn.DataTable.isDataTable("#tblViajes")) return;

        const dt = $("#tblViajes").DataTable();
        const datos = dt.rows({ search: "applied", order: "applied" }).data().toArray();

        if (!datos.length) {
            aviso("No hay viajes para exportar con los filtros actuales.", "warning");
            return;
        }

        const doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: PAPEL });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();
        const emitido = ahora();

        doc.setProperties({
            title: "Auditoría de viajes",
            subject: "Reporte de cumplimiento de viajes",
            author: "Transportes CHC",
            creator: "Sistema de gestión de viajes"
        });

        /* ----- datos para gráficas y anexo ----- */

        const viajes = normalizar(datos);
        const notas = [];
        viajes.forEach(function (v) {
            if (v.nota) { notas.push(v); v.ref = notas.length; }
        });

        const odtOk = viajes.filter(function (v) { return v.odt; }).length;
        const furOk = viajes.filter(function (v) { return v.fur; }).length;
        const porRuta = agrupar(viajes, function (v) { return v.ruta; });
        const porConductor = agrupar(viajes, function (v) { return v.conductor; });
        const temporal = serieTemporal(viajes);

        const kpi = function (id) { return $(id).text() || "-"; };

        /* ----- Página 1: encabezado, filtros, KPIs y gráficas de cumplimiento ----- */

        cabecera(doc, W, emitido);

        seccion(doc, "FILTROS APLICADOS", 35);
        filtros(doc, W, 38, leerFiltros());

        seccion(doc, "RESUMEN DE CUMPLIMIENTO", 55);
        kpis(doc, W, 58, [
            { label: "TOTAL VIAJES",        valor: kpi("#lblTotalViajes"),        color: C.blue },
            { label: "ODT CUMPLIDOS",       valor: kpi("#lblODTCumplidos"),       color: C.green },
            { label: "ODT INCUMPLIDOS",     valor: kpi("#lblODTIncumplidos"),     color: C.red },
            { label: "FURGÓN CUMPLIDOS",    valor: kpi("#lblFurgonCumplidos"),    color: C.cyan },
            { label: "FURGÓN INCUMPLIDOS",  valor: kpi("#lblFurgonIncumplidos"),  color: C.orange },
            { label: "CUMPLIMIENTO ODT",    valor: kpi("#lblPorcentajeODT"),      color: C.green },
            { label: "CUMPLIMIENTO FURGÓN", valor: kpi("#lblPorcentajeFurgon"),   color: C.cyan }
        ]);

        seccion(doc, "ANÁLISIS DE CUMPLIMIENTO", 83);

        const yG = 86, gap = 4, wIzq = 100, hDonut = 51;
        const subTotal = "Sobre " + viajes.length + (viajes.length === 1 ? " viaje" : " viajes");

        graficoDonut(doc, M, yG, wIzq, hDonut, "Cumplimiento ODT", subTotal,
                     odtOk, viajes.length - odtOk, C.green, C.red);
        graficoDonut(doc, M, yG + hDonut + gap, wIzq, hDonut, "Cumplimiento de furgón", subTotal,
                     furOk, viajes.length - furOk, C.cyan, C.orange);
        graficoRutas(doc, M + wIzq + gap, yG, W - 2 * M - wIzq - gap, 2 * hDonut + gap, porRuta);

        /* ----- Página 2: evolución, conductores y tiempos ----- */

        doc.addPage();
        cabeceraCompacta(doc, W, emitido);
        seccion(doc, "EVOLUCIÓN, CONDUCTORES Y TIEMPOS", 21);

        graficoPeriodo(doc, M, 25, W - 2 * M, 78, temporal.serie, temporal.sub);

        const wMitad = (W - 2 * M - gap) / 2;
        graficoConductores(doc, M, 108, wMitad, 84, porConductor);
        graficoExceso(doc, M + wMitad + gap, 108, wMitad, 84, porRuta);

        /* ----- Página 3+: detalle de viajes ----- */

        doc.addPage();
        seccion(doc, "DETALLE DE VIAJES  (" + datos.length + " registros)", 21);

        if (notas.length) {
            fuente(doc, "italic", 6.6);
            ink(doc, C.muted);
            doc.text("Las notas se numeran en la columna Nota y se detallan en el anexo al final del documento.",
                     W - M, 21, { align: "right" });
        }

        const cabeceras = ["#", "Fecha", "Conductor", "Placa", "Furgón", "Origen", "Destino",
                           "Salida", "Llegada", "T. real", "T. máx.", "Exceso",
                           "Estado ODT", "Estado furgón", "Nota"];

        const filas = datos.map(function (f, i) {
            return [
                i + 1,
                fechaDMY(txt(f[1])),
                txt(f[2]), txt(f[3]), txt(f[4]), txt(f[5]), txt(f[6]),
                txt(f[7]), txt(f[8]),
                compacto(txt(f[9])), compacto(txt(f[10])), compacto(txt(f[11])),
                txt(f[12]), txt(f[13]),
                viajes[i].ref ? String(viajes[i].ref) : "-"
            ];
        });

        const anchos = [8, 18, 31, 16, 20, 24, 25, 12, 12, 15, 15, 13, 19, 19, 12];
        const sobrante = W - 2 * M - anchos.reduce(function (a, b) { return a + b; }, 0);
        if (sobrante > 0) {                // reparte el espacio libre (p. ej. en A4)
            anchos[2] += sobrante / 3;
            anchos[5] += sobrante / 3;
            anchos[6] += sobrante / 3;
        }

        const alineacion = ["center", "center", "left", "center", "left", "left", "left",
                            "center", "center", "center", "center", "center", "center", "center", "center"];

        doc.autoTable(Object.assign(baseTabla(), {
            startY: 25,
            head: [cabeceras],
            body: filas,
            tableWidth: W - 2 * M,
            columnStyles: estilosColumnas(anchos, alineacion),

            didParseCell: function (d) {
                if (d.section !== "body") return;
                const i = d.column.index;

                if (i === 0) d.cell.styles.textColor = C.muted;

                if (i === 11) {   // exceso de tiempo
                    const excedido = String(d.cell.raw).charAt(0) === "+";
                    d.cell.styles.textColor = excedido ? C.red : C.green;
                    d.cell.styles.fontStyle = "bold";
                }

                if (i === 12 || i === 13) d.cell.text = [""];   // se dibuja como etiqueta

                if (i === 14) {
                    if (d.cell.raw === "-") d.cell.styles.textColor = C.muted;
                    else d.cell.text = [""];                    // se dibuja como marcador
                }
            },

            didDrawCell: function (d) {
                if (d.section !== "body") return;
                const i = d.column.index;

                if (i === 14 && d.cell.raw !== "-") {
                    pildora(doc, d.cell.x + d.cell.width / 2, d.cell.y + d.cell.height / 2, d.cell.raw);
                    return;
                }

                if (i !== 12 && i !== 13) return;

                const ok = String(d.cell.raw).toUpperCase() === "CUMPLIDO";
                const w = Math.min(d.cell.width - 2.4, 16), h = 3.8;
                const x = d.cell.x + (d.cell.width - w) / 2;
                const y = d.cell.y + (d.cell.height - h) / 2;

                doc.setFillColor.apply(doc, ok ? C.greenSoft : C.redSoft);
                doc.roundedRect(x, y, w, h, 1.9, 1.9, "F");

                doc.setFont("helvetica", "bold");
                doc.setFontSize(5.4);
                doc.setTextColor.apply(doc, ok ? C.green : C.red);
                doc.text(ok ? "CUMPLIDO" : "INCUMPLIDO", x + w / 2, y + h / 2 + 0.6, { align: "center" });
            },

            didDrawPage: function () {
                if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
                    cabeceraCompacta(doc, W, emitido);
                }
            }
        }));

        /* ----- Anexo: notas y observaciones ----- */

        if (notas.length) {
            doc.addPage();
            seccion(doc, "ANEXO: NOTAS Y OBSERVACIONES  (" + notas.length + (notas.length === 1 ? " nota" : " notas") + ")", 21);

            fuente(doc, "italic", 6.6);
            ink(doc, C.muted);
            doc.text("La referencia coincide con el marcador de la columna Nota en el detalle de viajes.",
                     W - M, 21, { align: "right" });

            const anchosN = [14, 10, 20, 42, 20, 62];
            anchosN.push(W - 2 * M - anchosN.reduce(function (a, b) { return a + b; }, 0));

            const filasN = notas.map(function (v) {
                return [v.ref, v.n, fechaDMY(v.fecha), v.conductor, v.placa, v.ruta, v.nota];
            });

            const base = baseTabla();
            base.styles.fontSize = 7.2;
            base.styles.cellPadding = { top: 2, bottom: 2, left: 1.8, right: 1.8 };
            base.styles.minCellHeight = 8;

            doc.autoTable(Object.assign(base, {
                startY: 25,
                head: [["Ref.", "#", "Fecha", "Conductor", "Placa", "Ruta", "Nota / Observación"]],
                body: filasN,
                tableWidth: W - 2 * M,
                columnStyles: estilosColumnas(anchosN,
                    ["center", "center", "center", "left", "center", "left", "left"]),

                didParseCell: function (d) {
                    if (d.section !== "body") return;
                    if (d.column.index === 0) d.cell.text = [""];
                    if (d.column.index === 1) d.cell.styles.textColor = C.muted;
                    if (d.column.index === 6) d.cell.styles.textColor = C.ink;
                },

                didDrawCell: function (d) {
                    if (d.section === "body" && d.column.index === 0) {
                        pildora(doc, d.cell.x + d.cell.width / 2, d.cell.y + d.cell.height / 2, d.cell.raw);
                    }
                },

                didDrawPage: function () {
                    if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
                        cabeceraCompacta(doc, W, emitido);
                    }
                }
            }));
        }

        /* ----- Firmas (al cierre del documento) ----- */

        let y = doc.lastAutoTable.finalY + 16;
        if (y > H - 24) {
            doc.addPage();
            cabeceraCompacta(doc, W, emitido);
            y = 40;
        }

        const anchoFirma = 70;
        ["Elaborado por", "Revisado por"].forEach(function (t, i) {
            const x = i === 0 ? M + 10 : W - M - 10 - anchoFirma;
            doc.setDrawColor.apply(doc, C.lineStrong);
            doc.setLineWidth(0.3);
            doc.line(x, y, x + anchoFirma, y);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor.apply(doc, C.muted);
            doc.text(t, x + anchoFirma / 2, y + 4, { align: "center" });
        });

        /* ----- Pie de página en todas las hojas ----- */

        const total = doc.getNumberOfPages();
        for (let p = 1; p <= total; p++) {
            doc.setPage(p);
            doc.setDrawColor.apply(doc, C.line);
            doc.setLineWidth(0.25);
            doc.line(M, H - 10, W - M, H - 10);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(6.8);
            doc.setTextColor.apply(doc, C.muted);
            doc.text("Transportes CHC  |  Auditoría de viajes  |  Documento generado automáticamente", M, H - 6);
            doc.text("Página " + p + " de " + total, W - M, H - 6, { align: "right" });
        }

        const d = new Date();
        doc.save("Auditoria_Viajes_" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + ".pdf");
    };

})();