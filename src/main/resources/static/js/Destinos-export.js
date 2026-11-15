/* =========================================================
 * DESTINOS-EXPORT.JS
 * Reportes PDF y Excel + AUDITORÍA DE CÁLCULOS
 *
 * - Usa recorridosBD completo (no depende de la paginación).
 * - Respeta los filtros: fechaDesde, fechaHasta y buscador.
 * - Las 11 columnas del reporte NO cambian (sin furgón).
 * - La auditoría va en páginas / hoja aparte, y se puede
 *   desactivar con el interruptor "Incluir auditoría".
 *
 * Fórmulas:
 *   Subtotal = KM × Banda
 *   ISV      = Subtotal × 15%
 *   Tarifa   = Subtotal + ISV
 *   Peaje    = 2 ejes L 224 / 3 ejes L 269
 *   Total período         = Subtotal + ISV
 *   Total general período = Total período + Peajes
 * ========================================================= */
(function () {
    "use strict";

    const ISV_P = 0.15;
    const PEAJE = { 2: 224, 3: 269 };
    const TOL = 0.011;

    /* Paleta del diseño nuevo */
    const COL = {
        asfalto: [22, 26, 32], asfalto2: [35, 41, 50], ambar: [255, 183, 3],
        linea: [223, 227, 232], claro: [248, 250, 252], ok: [23, 138, 92], mal: [200, 55, 45], gris: [100, 110, 125]
    };
    const X = {
        asfalto: "161A20", asfalto2: "232932", ambar: "FFB703", claro: "F8FAFC", borde: "DFE3E8",
        texto: "374151", blanco: "FFFFFF", ok: "178A5C", mal: "C8372D"
    };

    /* ---------- utilidades ---------- */
    const el = id => document.getElementById(id);
    const num = v => parseFloat(v) || 0;
    const r2 = v => Math.round((num(v) + Number.EPSILON) * 100) / 100;
    const fmtN = v => num(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtM = v => "L " + fmtN(v);
    const iso = f => String(f || "").slice(0, 10);
    const dmy = f => { const p = iso(f).split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(f || ""); };

    function lunesDe(f) {
        const [y, m, d] = iso(f).split("-").map(Number);
        if (!y) return "";
        const x = new Date(y, m - 1, d, 12);
        x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
        return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    }

    /* ---------- datos filtrados ---------- */
    function obtenerDatos() {
        if (!Array.isArray(recorridosBD) || !recorridosBD.length) { alert("No hay recorridos cargados para generar el reporte."); return null; }
        const desde = el("fechaDesde")?.value || "", hasta = el("fechaHasta")?.value || "";
        if (desde && hasta && desde > hasta) { alert("La fecha inicial no puede ser mayor que la fecha final."); return null; }
        const texto = (el("buscadorViajes")?.value || "").trim().toLowerCase();
        const lista = recorridosBD.filter(r => {
            const f = iso(r.fecha);
            if (desde && f < desde) return false;
            if (hasta && f > hasta) return false;
            if (texto && !construirTextoBusqueda(r).includes(texto)) return false;
            return true;
        });
        if (!lista.length) { alert("No existen recorridos que coincidan con los filtros seleccionados."); return null; }
        let rango = "Todos los registros";
        if (desde && hasta) rango = `${dmy(desde)} al ${dmy(hasta)}`;
        else if (desde) rango = `Desde ${dmy(desde)}`;
        else if (hasta) rango = `Hasta ${dmy(hasta)}`;
        return { lista, desde, hasta, texto, rango, auditoria: el("chkAuditoria") ? el("chkAuditoria").checked : true };
    }

    function nombreArchivo(d, ext) {
        let n = "reporte_rutas_peajes";
        if (d.desde && d.hasta) n += `_${d.desde}_a_${d.hasta}`;
        else if (d.desde) n += `_desde_${d.desde}`;
        else if (d.hasta) n += `_hasta_${d.hasta}`;
        else n += "_todos";
        if (d.texto) n += "_filtrado";
        return n + ext;
    }

    function sumar(lista) {
        const t = { km: 0, sub: 0, isv: 0, tar: 0, peajes: 0, cant: 0 };
        lista.forEach(r => {
            t.km += num(r.kmRecorridos); t.sub += num(r.subtotal); t.isv += num(r.isv);
            t.tar += num(r.tarifa); t.peajes += num(r.totalPeajes); t.cant += parseInt(r.cantidadPeajes) || 0;
        });
        return t;
    }

    /* =========================================================
     * AUDITORÍA: recalcula cada recorrido desde sus datos base
     * ========================================================= */
    function auditar(lista) {
        const hall = [], calc = { sub: 0, isv: 0, tar: 0, tp: 0 };
        const rem = {};
        lista.forEach(r => { const k = String(r.remision || "").trim().toLowerCase(); if (k) rem[k] = (rem[k] || 0) + 1; });
        let sinFurgon = 0, sinRemision = 0;

        lista.forEach(r => {
            const km = num(r.kmRecorridos), banda = num(r.bandaPorKm), cant = parseInt(r.cantidadPeajes) || 0, ejes = parseInt(r.ejesCamion) || 0;
            const sub = r2(km * banda), isv = r2(sub * ISV_P), tar = r2(sub + isv), vp = PEAJE[ejes] || 0, tp = r2(cant * vp);
            calc.sub += sub; calc.isv += isv; calc.tar += tar; calc.tp += tp;

            [["Subtotal (KM × banda)", r.subtotal, sub], ["ISV (15%)", r.isv, isv], ["Tarifa (subtotal + ISV)", r.tarifa, tar],
            ["Valor por peaje", r.valorPeaje, vp], ["Total peajes (cantidad × valor)", r.totalPeajes, tp]]
                .forEach(([campo, reg, cal]) => {
                    if (Math.abs(num(reg) - cal) > TOL) hall.push({ r, nivel: "Error", tipo: "Cálculo distinto", detalle: campo, reg: num(reg), calc: cal, dif: num(reg) - cal });
                });
            if (!PEAJE[ejes]) hall.push({ r, nivel: "Error", tipo: "Ejes inválidos", detalle: `Ejes: ${r.ejesCamion ?? "—"} (deben ser 2 o 3)` });
            if (banda <= 0) hall.push({ r, nivel: "Error", tipo: "Banda en cero", detalle: "La banda por KM debe ser mayor que 0" });
            if (km <= 0) hall.push({ r, nivel: "Aviso", tipo: "KM en cero", detalle: "El recorrido no tiene kilómetros" });
            const rk = String(r.remision || "").trim().toLowerCase();
            if (rk && rem[rk] > 1) hall.push({ r, nivel: "Aviso", tipo: "Remisión repetida", detalle: `Aparece ${rem[rk]} veces` });
            if (!r.furgon) sinFurgon++;
            if (!rk) sinRemision++;
        });

        const T = sumar(lista);
        const ver = [
            ["Subtotal", "Suma de KM × banda", T.sub, calc.sub],
            ["ISV", "Subtotal × 15%", T.isv, calc.isv],
            ["Tarifa", "Subtotal + ISV", T.tar, calc.tar],
            ["Total peajes", "Cantidad × valor por eje", T.peajes, calc.tp],
            ["Coherencia de tarifa", "Tarifa registrada = Subtotal + ISV registrados", T.tar, T.sub + T.isv],
            ["Total del período", "Subtotal + ISV", T.sub + T.isv, calc.sub + calc.isv],
            ["Total general del período", "Total del período + Peajes", T.sub + T.isv + T.peajes, calc.sub + calc.isv + calc.tp]
        ].map(([c, f, reg, cal]) => ({ c, f, reg, cal, dif: reg - cal, ok: Math.abs(reg - cal) <= TOL }));

        const agr = (fn) => {
            const m = new Map();
            lista.forEach(r => {
                const k = fn(r); let g = m.get(k);
                if (!g) { g = { k, n: 0, km: 0, sub: 0, isv: 0, tar: 0, tp: 0, bandas: new Set() }; m.set(k, g); }
                g.n++; g.km += num(r.kmRecorridos); g.sub += num(r.subtotal); g.isv += num(r.isv); g.tar += num(r.tarifa); g.tp += num(r.totalPeajes);
                g.bandas.add(fmtM(r.bandaPorKm));
            });
            return [...m.values()];
        };
        const porMot = agr(r => r.motorista || "Sin motorista").sort((a, b) => a.k.localeCompare(b.k));
        const porFur = agr(r => r.furgon || "Sin furgón registrado").sort((a, b) =>
            (a.k.startsWith("Sin ") - b.k.startsWith("Sin ")) || a.k.localeCompare(b.k));
        const porSem = agr(r => lunesDe(r.fecha) || "Sin fecha").sort((a, b) => b.k.localeCompare(a.k));

        const errores = hall.filter(h => h.nivel === "Error").length, avisos = hall.length - errores;
        return { hall, ver, porMot, porFur, porSem, res: { n: lista.length, errores, avisos, sinFurgon, sinRemision }, total: T };
    }

    const hallTexto = h => `${h.nivel}: ${h.tipo}${h.detalle ? " — " + h.detalle : ""}`;
    const semTexto = k => (/^\d{4}-/.test(k) ? "Semana del " + dmy(k) : k);
    const NOTA = "Recalculado con: Subtotal = KM × Banda · ISV = 15% del subtotal · Tarifa = Subtotal + ISV · Peaje = L 224 (2 ejes) / L 269 (3 ejes) × cantidad. Tolerancia: L 0.01.";

    /* =========================================================
     * PDF
     * ========================================================= */
    function cabecera(doc, titulo, subtitulo, derecha) {
        const w = doc.internal.pageSize.getWidth();
        doc.setFillColor(...COL.asfalto); doc.rect(0, 0, w, 30, "F");
        doc.setFillColor(...COL.ambar); doc.rect(0, 30, w, 2.5, "F");
        doc.setDrawColor(...COL.ambar); doc.setLineWidth(0.8);
        doc.setLineDashPattern([7, 5], 0); doc.line(0, 26.5, w, 26.5); doc.setLineDashPattern([], 0);
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(titulo, 12, 13);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...COL.ambar); doc.text(subtitulo, 12, 20);
        doc.setTextColor(255, 255, 255); doc.setFontSize(8.5);
        derecha.forEach((t, i) => doc.text(t, w - 12, 11 + i * 6, { align: "right" }));
    }

    function tituloSeccion(doc, y, texto) {
        const alto = doc.internal.pageSize.getHeight();
        if (y > alto - 45) { doc.addPage(); y = 18; }
        doc.setFillColor(...COL.ambar); doc.rect(10, y - 4.4, 2, 5.6, "F");
        doc.setTextColor(...COL.asfalto); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(texto, 14.5, y);
        return y + 3;
    }

    function tablaPDF(doc, y, head, body, cols, estadoCol) {
        doc.autoTable({
            startY: y, head: [head], body, theme: "grid",
            margin: { top: 16, right: 10, bottom: 16, left: 10 },
            styles: { font: "helvetica", fontSize: 7.5, cellPadding: 1.8, lineWidth: 0.15, lineColor: COL.linea, textColor: [40, 40, 40], valign: "middle", overflow: "linebreak" },
            headStyles: { fillColor: COL.asfalto2, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
            alternateRowStyles: { fillColor: COL.claro },
            columnStyles: cols || {},
            didParseCell: data => {
                if (estadoCol !== undefined && data.section === "body" && data.column.index === estadoCol) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.textColor = String(data.cell.raw) === "OK" ? COL.ok : COL.mal;
                }
            }
        });
        return doc.lastAutoTable.finalY + 8;
    }

    function cajaResumen(doc, x, y, w, filas, totalTxt, totalVal) {
        const h = 8;
        doc.setFillColor(...COL.asfalto2); doc.rect(x, y, w, h, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
        doc.text("CONCEPTO", x + 4, y + 5.3); doc.text("VALOR", x + w - 4, y + 5.3, { align: "right" });
        y += h;
        filas.forEach(([c, v], i) => {
            doc.setFillColor(...(i % 2 ? [255, 255, 255] : COL.claro)); doc.setDrawColor(...COL.linea); doc.setLineWidth(0.2);
            doc.rect(x, y, w, h, "FD");
            doc.setTextColor(60, 60, 60); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
            doc.text(c, x + 4, y + 5.5); doc.text(fmtM(v), x + w - 4, y + 5.5, { align: "right" });
            y += h;
        });
        doc.setFillColor(...COL.asfalto); doc.rect(x, y, w, 11, "F");
        doc.setFillColor(...COL.ambar); doc.rect(x, y, 2.5, 11, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(totalTxt, x + 6, y + 7.2);
        doc.setTextColor(...COL.ambar); doc.setFontSize(11); doc.text(fmtM(totalVal), x + w - 4, y + 7.4, { align: "right" });
        return y + 11;
    }

    function exportarPDF() {
        if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") { alert("No se pudo cargar la librería PDF."); return; }
        const { jsPDF } = window.jspdf;
        if (typeof jsPDF.API.autoTable !== "function") { alert("No se pudo cargar el complemento AutoTable para PDF."); return; }
        const d = obtenerDatos(); if (!d) return;

        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "legal" });
        const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
        const T = sumar(d.lista);
        const ahora = new Date();
        const generado = `${ahora.toLocaleDateString("es-HN")} ${ahora.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}`;

        /* ----- PÁGINA 1: tabla de recorridos (11 columnas) ----- */
        cabecera(doc, "CONTROL DE RUTAS Y PEAJES", "Reporte detallado de recorridos", [`Registros: ${d.lista.length}`, `Periodo: ${d.rango}`]);
        doc.setTextColor(...COL.gris); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(`Generado: ${generado}`, 12, 39);

        const body = d.lista.map(r => [
            dmy(r.fecha), r.motorista ?? "", r.rutaDestino ?? "", r.remision ?? "", fmtN(r.kmRecorridos), fmtM(r.subtotal), fmtM(r.isv),
            fmtM(r.tarifa), parseInt(r.cantidadPeajes) || 0, fmtM(r.valorPeaje), fmtM(r.totalPeajes)]);
        const b = { halign: "right", fontStyle: "bold" };
        doc.autoTable({
            startY: 43,
            head: [["FECHA", "MOTORISTA", "DESTINO", "REMISIÓN", "KM", "SUBTOTAL", "ISV", "TARIFA", "PEAJES", "VALOR PEAJE", "TOTAL PEAJES"]],
            body,
            foot: [[{ content: "TOTAL GENERAL", colSpan: 4, styles: b }, { content: fmtN(T.km), styles: b }, { content: fmtM(T.sub), styles: b },
            { content: fmtM(T.isv), styles: b }, { content: fmtM(T.tar), styles: b }, { content: String(T.cant), styles: { halign: "center", fontStyle: "bold" } },
            { content: "—", styles: b }, { content: fmtM(T.peajes), styles: b }]],
            showFoot: "lastPage", theme: "grid",
            margin: { top: 16, right: 10, bottom: 16, left: 10 },
            styles: { font: "helvetica", fontSize: 7, cellPadding: 1.8, lineWidth: 0.15, lineColor: COL.linea, overflow: "linebreak", valign: "middle", textColor: [40, 40, 40] },
            headStyles: { fontSize: 7, fontStyle: "bold", halign: "center", textColor: [255, 255, 255], fillColor: COL.asfalto2 },
            footStyles: { fontSize: 7.5, textColor: [255, 255, 255], fillColor: COL.asfalto },
            alternateRowStyles: { fillColor: COL.claro },
            columnStyles: {
                0: { cellWidth: 23, halign: "center" }, 1: { cellWidth: 38 }, 2: { cellWidth: 42 }, 3: { cellWidth: 27 },
                4: { cellWidth: 17, halign: "right" }, 5: { cellWidth: 27, halign: "right" }, 6: { cellWidth: 22, halign: "right" },
                7: { cellWidth: 25, halign: "right" }, 8: { cellWidth: 17, halign: "center" }, 9: { cellWidth: 27, halign: "right" }, 10: { cellWidth: 30, halign: "right" }
            },
            didParseCell: data => { if (data.section === "body" && data.column.index === 10) { data.cell.styles.textColor = COL.ok; data.cell.styles.fontStyle = "bold"; } }
        });

        /* ----- Resumen financiero ----- */
        let y = doc.lastAutoTable.finalY + 12;
        if (y > H - 62) { doc.addPage(); y = 20; }
        doc.setTextColor(...COL.asfalto); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        doc.setFillColor(...COL.ambar); doc.rect(10, y - 4.4, 2, 5.6, "F"); doc.text("RESUMEN FINANCIERO", 14.5, y);
        const totalPeriodo = T.sub + T.isv;
        const y1 = cajaResumen(doc, 10, y + 4, 95, [["Subtotal", T.sub], ["Impuestos (ISV)", T.isv]], "TOTAL DEL PERÍODO", totalPeriodo);
        cajaResumen(doc, 115, y + 4, 95, [["Total del período", totalPeriodo], ["Peajes", T.peajes]], "TOTAL GENERAL DEL PERÍODO", totalPeriodo + T.peajes);
        doc.setTextColor(...COL.gris); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
        doc.text(`Recorridos incluidos: ${d.lista.length}  ·  KM totales: ${fmtN(T.km)}  ·  Peajes cobrados: ${T.cant}  ·  Tarifa acumulada: ${fmtM(T.tar)}`, 10, y1 + 7);

        /* ----- AUDITORÍA ----- */
        if (d.auditoria) {
            const A = auditar(d.lista);
            doc.addPage();
            cabecera(doc, "AUDITORÍA DE CÁLCULOS", "Verificación independiente de subtotal, ISV, tarifa y peajes", [`Recorridos revisados: ${A.res.n}`, `Periodo: ${d.rango}`]);
            doc.setTextColor(...COL.gris); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
            doc.text(doc.splitTextToSize(NOTA, W - 24), 12, 39);

            /* resultado */
            const limpio = A.res.errores === 0 && A.ver.every(v => v.ok);
            doc.setFillColor(...(limpio ? COL.ok : COL.mal)); doc.roundedRect(12, 46, W - 24, 12, 1.5, 1.5, "F");
            doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
            doc.text(limpio ? "RESULTADO: SIN DIFERENCIAS. Todos los cálculos coinciden." : `RESULTADO: REVISAR. ${A.res.errores} error(es) de cálculo o datos.`, 16, 53.5);
            doc.setFont("helvetica", "normal"); doc.setFontSize(8);
            doc.text(`Avisos: ${A.res.avisos}  ·  Sin furgón: ${A.res.sinFurgon}  ·  Sin remisión: ${A.res.sinRemision}`, W - 16, 53.5, { align: "right" });

            y = tituloSeccion(doc, 68, "1. Verificación de fórmulas (totales del reporte)");
            y = tablaPDF(doc, y, ["CONCEPTO", "FÓRMULA", "REGISTRADO", "RECALCULADO", "DIFERENCIA", "ESTADO"],
                A.ver.map(v => [v.c, v.f, fmtM(v.reg), fmtM(v.cal), fmtM(v.dif), v.ok ? "OK" : "DIFERENCIA"]),
                { 0: { cellWidth: 55 }, 1: { cellWidth: 95 }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "center", cellWidth: 30 } }, 5);

            y = tituloSeccion(doc, y, "2. Hallazgos por recorrido");
            if (!A.hall.length) {
                doc.setTextColor(...COL.ok); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
                doc.text("No se encontraron diferencias ni inconsistencias en los recorridos revisados.", 12, y + 4); y += 14;
            } else {
                y = tablaPDF(doc, y, ["FECHA", "MOTORISTA", "DESTINO", "REMISIÓN", "HALLAZGO", "REGISTRADO", "RECALCULADO", "DIFERENCIA"],
                    A.hall.map(h => [dmy(h.r.fecha), h.r.motorista ?? "", h.r.rutaDestino ?? "", h.r.remision ?? "", hallTexto(h),
                    h.reg === undefined ? "—" : fmtM(h.reg), h.calc === undefined ? "—" : fmtM(h.calc), h.dif === undefined ? "—" : fmtM(h.dif)]),
                    { 0: { halign: "center", cellWidth: 22 }, 3: { cellWidth: 26 }, 4: { cellWidth: 85 }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" } });
            }

            const grupo = (titulo, etq, g) => {
                y = tituloSeccion(doc, y, titulo);
                const tt = g.reduce((a, x) => ({ n: a.n + x.n, km: a.km + x.km, sub: a.sub + x.sub, isv: a.isv + x.isv, tar: a.tar + x.tar, tp: a.tp + x.tp }), { n: 0, km: 0, sub: 0, isv: 0, tar: 0, tp: 0 });
                const filas = g.map(x => [x.k, x.n, fmtN(x.km), fmtM(x.sub), fmtM(x.isv), fmtM(x.tar), fmtM(x.tp)]);
                filas.push(["TOTAL", tt.n, fmtN(tt.km), fmtM(tt.sub), fmtM(tt.isv), fmtM(tt.tar), fmtM(tt.tp)]);
                y = tablaPDF(doc, y, [etq, "VIAJES", "KM", "SUBTOTAL", "ISV", "TARIFA", "TOTAL PEAJES"], filas,
                    { 1: { halign: "center", cellWidth: 20 }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } });
            };
            grupo("3. Resumen por motorista", "MOTORISTA", A.porMot);
            grupo("4. Resumen por furgón", "FURGÓN", A.porFur);

            y = tituloSeccion(doc, y, "5. Control de banda por semana");
            y = tablaPDF(doc, y, ["SEMANA", "VIAJES", "KM", "SUBTOTAL", "BANDA(S) USADA(S)", "ESTADO"],
                A.porSem.map(g => [semTexto(g.k), g.n, fmtN(g.km), fmtM(g.sub), [...g.bandas].join("  /  "), g.bandas.size === 1 ? "OK" : "VARIAS BANDAS"]),
                { 1: { halign: "center", cellWidth: 20 }, 2: { halign: "right" }, 3: { halign: "right" }, 5: { halign: "center", cellWidth: 34 } }, 5);

            /* firmas */
            if (y > H - 40) { doc.addPage(); y = 30; }
            y += 14; doc.setDrawColor(...COL.asfalto); doc.setLineWidth(0.3);
            doc.line(12, y, 90, y); doc.line(120, y, 198, y);
            doc.setTextColor(...COL.gris); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
            doc.text("Elaborado por", 12, y + 5); doc.text("Revisado por", 120, y + 5);
        }

        /* ----- pie con numeración en todas las páginas ----- */
        const n = doc.internal.getNumberOfPages();
        for (let i = 1; i <= n; i++) {
            doc.setPage(i);
            doc.setDrawColor(...COL.linea); doc.setLineWidth(0.2); doc.line(10, H - 12, W - 10, H - 12);
            doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...COL.gris);
            doc.text(`Control de Rutas y Peajes  ·  ${d.rango}`, 10, H - 7);
            doc.text(`Página ${i} de ${n}`, W - 10, H - 7, { align: "right" });
        }
        doc.save(nombreArchivo(d, ".pdf"));
    }

    /* =========================================================
     * EXCEL
     * ========================================================= */
    const borde = { top: { style: "thin", color: { rgb: X.borde } }, bottom: { style: "thin", color: { rgb: X.borde } }, left: { style: "thin", color: { rgb: X.borde } }, right: { style: "thin", color: { rgb: X.borde } } };
    const st = (o = {}) => {
        const s = { font: { name: "Arial", sz: o.sz || 9, bold: !!o.b, italic: !!o.i, color: { rgb: o.c || X.texto } }, alignment: { horizontal: o.h || "left", vertical: "center", wrapText: !!o.w } };
        if (o.bg) s.fill = { patternType: "solid", fgColor: { rgb: o.bg } };
        if (!o.nb) s.border = o.top ? { ...borde, top: { style: "medium", color: { rgb: X.asfalto } } } : borde;
        return s;
    };
    const FM = '"L "#,##0.00', FK = "#,##0.00", FI = "0";

    class Hoja {
        constructor() { this.ws = {}; this.m = []; this.R = 0; this.C = 0; this.h = []; }
        put(r, c, v, s, z) {
            const cel = { v: v ?? "", t: typeof v === "number" ? "n" : "s", s }; if (z) cel.z = z;
            this.ws[XLSX.utils.encode_cell({ r, c })] = cel; this.R = Math.max(this.R, r); this.C = Math.max(this.C, c);
        }
        banda(r, c1, c2, v, s, z) { this.put(r, c1, v, s, z); for (let c = c1 + 1; c <= c2; c++) this.put(r, c, "", s); this.m.push({ s: { r, c: c1 }, e: { r, c: c2 } }); }
        alto(r, pt) { this.h[r] = { hpt: pt }; }
        fin(cols) {
            this.ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: this.R, c: this.C } });
            this.ws["!merges"] = this.m; this.ws["!cols"] = cols.map(w => ({ wch: w })); this.ws["!rows"] = this.h; return this.ws;
        }
    }

    function tituloHoja(h, ult, titulo, sub, linea3, linea4, caja) {
        h.banda(0, 0, ult, titulo, st({ sz: 18, b: 1, c: X.blanco, bg: X.asfalto, h: "center", nb: 1 })); h.alto(0, 32);
        h.banda(1, 0, ult, sub, st({ sz: 11, b: 1, c: X.ambar, bg: X.asfalto2, h: "center", nb: 1 })); h.alto(1, 22);
        const fin = caja ? ult - 3 : ult;   // con recuadro, el texto deja libres las 3 últimas columnas
        h.banda(2, 0, fin, linea3, st({ b: 1, nb: 1 })); h.banda(3, 0, fin, linea4, st({ b: 1, nb: 1 }));
        h.alto(2, 18); h.alto(3, 18);
        if (caja) {                          // recuadro de la banda (igual al del sistema)
            h.banda(2, ult - 2, ult, caja.etiqueta, st({ sz: 8, b: 1, c: "B8C1CE", bg: X.asfalto2, h: "center" }));
            h.banda(3, ult - 2, ult, caja.valor, st({ sz: 14, b: 1, c: X.ambar, bg: X.asfalto, h: "center" }), caja.formato);
            h.alto(3, 26);
        }
        h.alto(4, 8);
    }

    function hojaRecorridos(d) {
        const h = new Hoja(), T = sumar(d.lista);
        const bandas = [...new Set(d.lista.map(r => r2(r.bandaPorKm)))].sort((x, y) => x - y);
        const caja = bandas.length === 1
            ? { etiqueta: "Banda por KM del período", valor: bandas[0], formato: '"L "#,##0.00" / km"' }
            : { etiqueta: "Bandas por KM del período (varias)", valor: bandas.map(fmtM).join(" / ") };
        tituloHoja(h, 10, "CONTROL DE RUTAS Y PEAJES", "Reporte detallado de recorridos", `Periodo: ${d.rango}`, `Registros: ${d.lista.length}`, caja);

        const heads = ["FECHA", "MOTORISTA", "DESTINO", "REMISIÓN", "KM", "SUBTOTAL", "ISV", "TARIFA", "PEAJES", "VALOR PEAJE", "TOTAL PEAJES"];
        heads.forEach((t, c) => h.put(5, c, t, st({ b: 1, c: X.blanco, bg: X.asfalto2, h: "center", w: 1, top: 1 }))); h.alto(5, 28);

        d.lista.forEach((r, i) => {
            const row = 6 + i, bg = i % 2 === 0 ? X.claro : X.blanco, base = { bg };
            h.put(row, 0, dmy(r.fecha), st({ ...base, h: "center" }));
            h.put(row, 1, r.motorista ?? "", st({ ...base, w: 1 }));
            h.put(row, 2, r.rutaDestino ?? "", st({ ...base, b: 1, i: 1, h: "center", w: 1 }));
            h.put(row, 3, r.remision ?? "", st({ ...base, b: 1, i: 1, h: "center", w: 1 }));
            h.put(row, 4, num(r.kmRecorridos), st({ ...base, h: "right" }), FK);
            h.put(row, 5, num(r.subtotal), st({ ...base, h: "right" }), FM);
            h.put(row, 6, num(r.isv), st({ ...base, h: "right" }), FM);
            h.put(row, 7, num(r.tarifa), st({ ...base, h: "right" }), FM);
            h.put(row, 8, parseInt(r.cantidadPeajes) || 0, st({ ...base, h: "center" }), FI);
            h.put(row, 9, num(r.valorPeaje), st({ ...base, h: "right" }), FM);
            h.put(row, 10, num(r.totalPeajes), st({ ...base, h: "right", b: 1, c: X.ok }), FM);
            h.alto(row, 22);
        });
        const ult = 5 + d.lista.length, tot = ult + 2;
        const t = (o = {}) => st({ b: 1, c: X.blanco, bg: X.asfalto, h: "right", top: 1, ...o });
        h.banda(tot, 0, 3, "TOTAL GENERAL", t());
        h.put(tot, 4, T.km, t(), FK); h.put(tot, 5, T.sub, t(), FM); h.put(tot, 6, T.isv, t(), FM); h.put(tot, 7, T.tar, t(), FM);
        h.put(tot, 8, T.cant, t({ h: "center" }), FI); h.put(tot, 9, "", t()); h.put(tot, 10, T.peajes, t(), FM); h.alto(tot, 24);

        /* resumen financiero (debajo de la tabla) */
        let r = tot + 3;
        h.banda(r, 0, 3, "RESUMEN FINANCIERO", st({ sz: 14, b: 1, c: X.blanco, bg: X.asfalto, h: "center", nb: 1 })); h.alto(r, 28); r++;
        h.banda(r, 0, 2, "CONCEPTO", st({ b: 1, c: X.blanco, bg: X.asfalto2, h: "center" })); h.put(r, 3, "VALOR", st({ b: 1, c: X.blanco, bg: X.asfalto2, h: "center" })); r++;
        const totalPeriodo = T.sub + T.isv;
        const fila = (txt, v, z, destacado) => {
            const o = destacado ? { b: 1, sz: 10, c: X.blanco, bg: destacado } : { bg: X.blanco };
            h.banda(r, 0, 2, txt, st(o)); h.put(r, 3, v, st({ ...o, h: "right" }), z); if (destacado) h.alto(r, 26); r++;
        };
        fila("Subtotal", T.sub, FM); fila("Impuestos (ISV)", T.isv, FM); fila("TOTAL DEL PERÍODO", totalPeriodo, FM, X.asfalto);
        fila("Peajes", T.peajes, FM); fila("TOTAL GENERAL DEL PERÍODO", totalPeriodo + T.peajes, FM, X.asfalto2); r++;
        fila("Total de recorridos", d.lista.length, FI); fila("Total de KM", T.km, FK); fila("Total de peajes", T.cant, FI); fila("Total de tarifa", T.tar, FM);

        const ws = h.fin([14, 34, 35, 20, 14, 17, 15, 17, 12, 18, 20]);
        ws["!autofilter"] = { ref: `A6:K${ult + 1}` };
        return ws;
    }

    function hojaAuditoria(d) {
        const A = auditar(d.lista), h = new Hoja(), ULT = 7;
        tituloHoja(h, ULT, "AUDITORÍA DE CÁLCULOS", "Verificación independiente de subtotal, ISV, tarifa y peajes", `Periodo: ${d.rango}`, `Recorridos revisados: ${A.res.n}`);
        h.banda(4, 0, ULT, NOTA, st({ i: 1, w: 1, nb: 1, c: "667085" })); h.alto(4, 30);

        let r = 6;
        const limpio = A.res.errores === 0 && A.ver.every(v => v.ok);
        h.banda(r, 0, ULT, limpio ? "RESULTADO: SIN DIFERENCIAS. Todos los cálculos coinciden." : `RESULTADO: REVISAR. ${A.res.errores} error(es) de cálculo o datos.`,
            st({ b: 1, sz: 11, c: X.blanco, bg: limpio ? X.ok : X.mal, h: "center", nb: 1 })); h.alto(r, 26); r++;
        h.banda(r, 0, ULT, `Avisos: ${A.res.avisos}   ·   Sin furgón registrado: ${A.res.sinFurgon}   ·   Sin remisión: ${A.res.sinRemision}`, st({ c: "667085", nb: 1 })); r += 2;

        const seccion = txt => { h.banda(r, 0, ULT, txt, st({ b: 1, sz: 12, c: X.blanco, bg: X.asfalto, nb: 1 })); h.alto(r, 24); r++; };
        const cab = arr => { arr.forEach((t, c) => h.put(r, c, t, st({ b: 1, c: X.blanco, bg: X.asfalto2, h: "center", w: 1 }))); h.alto(r, 24); r++; };
        const estado = (c, ok, txt) => h.put(r, c, txt, st({ b: 1, h: "center", c: ok ? X.ok : X.mal }));

        seccion("1. Verificación de fórmulas (totales del reporte)");
        cab(["CONCEPTO", "FÓRMULA", "REGISTRADO", "RECALCULADO", "DIFERENCIA", "ESTADO"]);
        A.ver.forEach((v, i) => {
            const bg = i % 2 === 0 ? X.claro : X.blanco;
            h.put(r, 0, v.c, st({ bg, b: 1 })); h.put(r, 1, v.f, st({ bg, w: 1 }));
            h.put(r, 2, v.reg, st({ bg, h: "right" }), FM); h.put(r, 3, v.cal, st({ bg, h: "right" }), FM); h.put(r, 4, v.dif, st({ bg, h: "right" }), FM);
            estado(5, v.ok, v.ok ? "OK" : "DIFERENCIA"); r++;
        });
        r++;

        seccion("2. Hallazgos por recorrido");
        if (!A.hall.length) { h.banda(r, 0, ULT, "No se encontraron diferencias ni inconsistencias en los recorridos revisados.", st({ b: 1, c: X.ok, nb: 1 })); r++; }
        else {
            cab(["FECHA", "MOTORISTA", "DESTINO", "REMISIÓN", "HALLAZGO", "REGISTRADO", "RECALCULADO", "DIFERENCIA"]);
            A.hall.forEach((x, i) => {
                const bg = i % 2 === 0 ? X.claro : X.blanco;
                h.put(r, 0, dmy(x.r.fecha), st({ bg, h: "center" })); h.put(r, 1, x.r.motorista ?? "", st({ bg, w: 1 }));
                h.put(r, 2, x.r.rutaDestino ?? "", st({ bg, w: 1 })); h.put(r, 3, x.r.remision ?? "", st({ bg, h: "center" }));
                h.put(r, 4, hallTexto(x), st({ bg, w: 1, b: 1, c: x.nivel === "Error" ? X.mal : "B76B04" }));
                [x.reg, x.calc, x.dif].forEach((v, k) => h.put(r, 5 + k, v === undefined ? "—" : v, st({ bg, h: "right" }), v === undefined ? undefined : FM));
                r++;
            });
        }
        r++;

        const grupo = (txt, etq, g) => {
            seccion(txt); cab([etq, "VIAJES", "KM", "SUBTOTAL", "ISV", "TARIFA", "TOTAL PEAJES"]);
            const tt = { n: 0, km: 0, sub: 0, isv: 0, tar: 0, tp: 0 };
            g.forEach((x, i) => {
                const bg = i % 2 === 0 ? X.claro : X.blanco;
                h.put(r, 0, x.k, st({ bg, b: 1 })); h.put(r, 1, x.n, st({ bg, h: "center" }), FI); h.put(r, 2, x.km, st({ bg, h: "right" }), FK);
                [x.sub, x.isv, x.tar, x.tp].forEach((v, k) => h.put(r, 3 + k, v, st({ bg, h: "right" }), FM));
                Object.keys(tt).forEach(k => tt[k] += x[k]); r++;
            });
            const t = (o = {}) => st({ b: 1, c: X.blanco, bg: X.asfalto, top: 1, h: "right", ...o });
            h.put(r, 0, "TOTAL", t({ h: "left" })); h.put(r, 1, tt.n, t({ h: "center" }), FI); h.put(r, 2, tt.km, t(), FK);
            [tt.sub, tt.isv, tt.tar, tt.tp].forEach((v, k) => h.put(r, 3 + k, v, t(), FM)); r += 2;
        };
        grupo("3. Resumen por motorista", "MOTORISTA", A.porMot);
        grupo("4. Resumen por furgón", "FURGÓN", A.porFur);

        seccion("5. Control de banda por semana");
        cab(["SEMANA", "VIAJES", "KM", "SUBTOTAL", "BANDA(S) USADA(S)", "ESTADO"]);
        A.porSem.forEach((g, i) => {
            const bg = i % 2 === 0 ? X.claro : X.blanco, ok = g.bandas.size === 1;
            h.put(r, 0, semTexto(g.k), st({ bg, b: 1 })); h.put(r, 1, g.n, st({ bg, h: "center" }), FI); h.put(r, 2, g.km, st({ bg, h: "right" }), FK);
            h.put(r, 3, g.sub, st({ bg, h: "right" }), FM); h.put(r, 4, [...g.bandas].join("  /  "), st({ bg, w: 1 }));
            estado(5, ok, ok ? "OK" : "VARIAS BANDAS"); r++;
        });
        return h.fin([26, 30, 30, 18, 44, 18, 18, 18]);
    }

    function exportarExcel() {
        if (typeof XLSX === "undefined") { alert("No se pudo cargar la librería Excel."); return; }
        const d = obtenerDatos(); if (!d) return;
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hojaRecorridos(d), "Recorridos");
        if (d.auditoria) XLSX.utils.book_append_sheet(libro, hojaAuditoria(d), "Auditoría");
        XLSX.writeFile(libro, nombreArchivo(d, ".xlsx"), { bookType: "xlsx", compression: true });
    }

    document.addEventListener("DOMContentLoaded", () => {
        el("btnExportarPDF")?.addEventListener("click", exportarPDF);
        el("btnExportarExcel")?.addEventListener("click", exportarExcel);
    });
})();