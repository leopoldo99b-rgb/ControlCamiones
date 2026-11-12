// Se carga DESPUÉS de camiones.js. Usa sus funciones y variables globales.
(() => {
  const $ = id => document.getElementById(id);
  const GAL = { UNIDAD: ["galUnidad", "cntUnidad"], REPUESTO: ["galRepuestos", "cntRepuestos"] };
  let fichaId = null;

  const f = $("fechaImpresion");
  if (f) f.textContent = new Date().toLocaleDateString("es-HN");

  // ---------- Fotografías de la unidad / repuestos ----------
  async function cargarFotos() {
    if (!fichaId) return;
    Object.values(GAL).forEach(([g, c]) => { $(g).innerHTML = ""; $(c).textContent = 0; });
    try {
      const r = await fetch(`/camiones/${fichaId}/fotos`);
      if (!r.ok) throw new Error();
      const total = { UNIDAD: 0, REPUESTO: 0 };
      (await r.json()).forEach(foto => {
        const dest = GAL[foto.tipo];
        if (!dest) return;
        total[foto.tipo]++;
        const fig = document.createElement("figure");
        fig.className = "foto-item";
        fig.innerHTML = `<img class="camion-img" loading="lazy" decoding="async" alt="Fotografía">
          <button type="button" class="foto-del no-print" data-id="${foto.id}" aria-label="Eliminar fotografía"><i class="fa-solid fa-trash"></i></button>`;
        fig.firstElementChild.src = foto.url.replace("/upload/", "/upload/w_900,q_auto,f_auto/");
        $(dest[0]).appendChild(fig);
      });
      Object.entries(total).forEach(([t, n]) => $(GAL[t][1]).textContent = n);
    } catch {
      mostrarNotificacion("error", "Error", "No se pudieron cargar las fotografías");
    }
  }

  document.querySelectorAll(".subir-foto").forEach(inp => inp.addEventListener("change", async () => {
    if (!fichaId || !inp.files.length) return;
    const fd = new FormData();
    fd.append("tipo", inp.dataset.tipo);
    [...inp.files].forEach(file => fd.append("fotos", file));
    mostrarNotificacion("warning", "Subiendo fotografías", "Espere un momento...");
    try {
      const r = await fetch(`/camiones/${fichaId}/fotos`, { method: "POST", body: fd });
      if (!r.ok) throw new Error();
      mostrarNotificacion("success", "Fotografías guardadas", "Se agregaron correctamente");
      await cargarFotos();
    } catch {
      mostrarNotificacion("error", "Error", "No se pudieron subir las fotografías");
    }
    inp.value = "";
  }));

  document.addEventListener("click", async e => {
    const ver = e.target.closest(".btn-ver");
    if (ver) { fichaId = ver.dataset.id; cargarFotos(); return; }
    const del = e.target.closest(".foto-del");
    if (del && confirm("¿Eliminar esta fotografía?")) {
      const r = await fetch(`/camiones/fotos/${del.dataset.id}`, { method: "DELETE" });
      r.ok ? cargarFotos() : mostrarNotificacion("error", "Error", "No se pudo eliminar la fotografía");
    }
  });

  // ---------- Imprimir la ficha de la unidad ----------
  $("btnImprimirFicha")?.addEventListener("click", () => {
    document.body.classList.add("printing-ficha");
    document.querySelectorAll("#modalVerCamion img").forEach(i => i.loading = "eager");
    setTimeout(() => window.print(), 350);
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("printing-ficha"));

  // ---------- Cerrar la confirmación después de eliminar (antes quedaba abierta) ----------
  $("confirmarEliminar")?.addEventListener("click", () => $("modalConfirmarEliminar").style.display = "none");

  // ---------- camiones.js todavía lee estos campos eliminados: se crean ocultos para que no falle ----------
  ["fechaCompra", "valorCompra"].forEach(id => {
    if ($(id)) return;
    const i = document.createElement("input");
    i.type = "hidden"; i.id = id;
    $("formCamion").appendChild(i);
  });

  // ---------- Estilo común de las exportaciones ----------
  const HOY = () => new Date().toLocaleDateString("es-HN");
  const NAVY = [11, 27, 52], AMB = [245, 158, 11], GRIS = [244, 246, 250], MUT = [100, 116, 139];
  const EST = { "DISPONIBLE": ["DCFCE7", "166534"], "EN VIAJE": ["DBEAFE", "1D4ED8"], "MANTENIMIENTO": ["FEF3C7", "92400E"], "FUERA DE SERVICIO": ["FEE2E2", "991B1B"] };
  const rgb = h => [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));

  // ---------- Ficha individual en PDF (sin Estado ni Capacidad) ----------
  const cargarImg = url => new Promise(res => {
    if (!url) return res(null);
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      try {
        const cv = document.createElement("canvas");
        cv.width = im.naturalWidth; cv.height = im.naturalHeight;
        cv.getContext("2d").drawImage(im, 0, 0);
        res({ d: cv.toDataURL("image/jpeg", .85), w: cv.width, h: cv.height });
      } catch { res(null); }
    };
    im.onerror = () => res(null);
    im.src = url.replace("/upload/", "/upload/w_900,q_auto/");
  });

  async function fichaPDF() {
    const c = camionSeleccionadoPDF;
    if (!c) return mostrarNotificacion("warning", "Sin selección", "No hay un camión seleccionado para generar la ficha");
    mostrarNotificacion("warning", "Generando PDF", "Preparando la ficha del camión...");
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const W = 210, M = 14;
    const img = await cargarImg(c.imgcamion || "/imgs/stock.jpg");

    const cabecera = full => {
      const h = full ? 34 : 20;
      pdf.setFillColor(...NAVY); pdf.rect(0, 0, W, h, "F");
      pdf.setFillColor(...AMB); pdf.rect(0, h, W, 1.6, "F");
      pdf.setTextColor(255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(full ? 20 : 13);
      pdf.text("Ficha del camión", M, full ? 17 : 13);
      if (full) {
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(159, 179, 209);
        pdf.text("Sistema de gestión de flota", M, 24);
        pdf.text("Emitida el " + HOY(), M, 29.5);
      }
      pdf.setFillColor(...AMB); pdf.roundedRect(W - M - 46, full ? 9 : 4.5, 46, full ? 16 : 11, 2.5, 2.5, "F");
      pdf.setTextColor(...NAVY); pdf.setFont("helvetica", "bold"); pdf.setFontSize(full ? 15 : 11);
      pdf.text(String(c.placa || ""), W - M - 23, full ? 19 : 11.8, { align: "center" });
    };
    const titulo = (t, y) => {
      pdf.setFillColor(...AMB); pdf.rect(M, y, 1.8, 7, "F");
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(...NAVY);
      pdf.text(t, M + 5, y + 5.3);
    };

    cabecera(true);

    // Foto y nombre del vehículo
    pdf.setFillColor(...GRIS); pdf.roundedRect(M, 44, 72, 54, 3, 3, "F");
    if (img) {
      let w = 72, h = w * img.h / img.w;
      if (h > 54) { h = 54; w = h * img.w / img.h; }
      pdf.addImage(img.d, "JPEG", M + (72 - w) / 2, 44 + (54 - h) / 2, w, h);
    }
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.setTextColor(...NAVY);
    pdf.text(pdf.splitTextToSize(`${c.marca || ""} ${c.modelo || ""}`, W - M - 96), 96, 58);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(11); pdf.setTextColor(...MUT);
    pdf.text([c.tipo, c.anio].filter(Boolean).join("  |  "), 96, 72);

    // Datos del vehículo
    titulo("Datos del vehículo", 108);
    const km = (c.kilometrajeActual ?? 0).toLocaleString("es-HN") + " km";
    const datos = [["Placa", c.placa], ["Marca", c.marca], ["Modelo", c.modelo], ["Año", c.anio],
      ["Tipo", c.tipo], ["Kilometraje", km], ["Número de motor", c.numeroMotor], ["Número de chasis", c.numeroChasis]];
    datos.forEach(([k, v], i) => {
      const x = M + (i % 2) * 94, y = 119 + Math.floor(i / 2) * 21;
      pdf.setFillColor(...GRIS); pdf.roundedRect(x, y, 88, 17, 2, 2, "F");
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.setTextColor(...MUT);
      pdf.text(k, x + 4, y + 6);
      if (k === "Kilometraje") { pdf.setFontSize(6.5); pdf.text("Se actualiza una vez al mes", x + 84, y + 6, { align: "right" }); }
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(...NAVY);
      pdf.text(String(v || "No registrado"), x + 4, y + 13);
    });

    // Observaciones
    let y = 212;
    const nueva = () => { pdf.addPage(); cabecera(false); y = 30; };
    titulo("Observaciones", y); y += 11;
    const obs = (c.observaciones || "").split("\n\n\n").map(o => o.trim()).filter(Boolean);
    if (!obs.length) {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(...MUT);
      pdf.text("Sin observaciones registradas.", M + 5, y + 4);
    }
    obs.forEach((o, i) => {
      const L = o.split("\n").map(l => l.trim());
      const campo = k => (L.find(l => l.startsWith(k + ":")) || "").slice(k.length + 1).trim();
      const di = L.findIndex(l => l.startsWith("Detalle:"));
      const detalle = di >= 0 ? [L[di].slice(8).trim(), ...L.slice(di + 1)].join("\n").trim() : o;
      const lineas = pdf.splitTextToSize(detalle, W - 2 * M - 10);
      const h = 16 + lineas.length * 3.9 + 3;
      if (y + h > 278) nueva();
      pdf.setFillColor(...GRIS); pdf.roundedRect(M, y, W - 2 * M, h, 2, 2, "F");
      pdf.setFillColor(...AMB); pdf.rect(M, y + 2, 1.6, h - 4, "F");
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(10.5); pdf.setTextColor(...NAVY);
      pdf.text(`${i + 1}. ${campo("Tipo") || "Observación"}`, M + 6, y + 7);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); pdf.setTextColor(...MUT);
      pdf.text([campo("Fecha"), campo("Hora")].filter(Boolean).join("   "), W - M - 4, y + 7, { align: "right" });
      pdf.setFontSize(9.5); pdf.setTextColor(30, 41, 59);
      pdf.text(lineas, M + 6, y + 14);
      y += h + 4;
    });

    const n = pdf.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      pdf.setPage(p);
      pdf.setDrawColor(226, 232, 240); pdf.line(M, 285, W - M, 285);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(...MUT);
      pdf.text("Sistema de gestión de flota - Ficha vehicular", M, 291);
      pdf.text(`Página ${p} de ${n}`, W - M, 291, { align: "right" });
    }
    pdf.save("Ficha_" + (c.placa || "camion") + ".pdf");
  }

  // Reemplaza el botón para quitarle el generador de PDF anterior
  const botonPDF = $("btnImprimirCamion");
  if (botonPDF) {
    const nuevo = botonPDF.cloneNode(true);
    botonPDF.replaceWith(nuevo);
    nuevo.addEventListener("click", fichaPDF);
  }

  // ---------- PDF de toda la flota (tabla vectorial, no captura de pantalla) ----------
  window.exportarTablaPDF = function () {
    if (!listaCamiones.length) return mostrarNotificacion("warning", "Sin datos", "No existen camiones para exportar");
    const pdf = new window.jspdf.jsPDF("l", "mm", "a4");
    const COL = [["Placa", 24], ["Vehículo", 52], ["Año", 14], ["Tipo", 34], ["Color", 26], ["Km", 26], ["Estado", 34], ["Motor", 32], ["Chasis", 35]];
    const cabecera = () => {
      pdf.setFillColor(...NAVY); pdf.rect(0, 0, 297, 22, "F");
      pdf.setFillColor(...AMB); pdf.rect(0, 22, 297, 1.5, "F");
      pdf.setTextColor(255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(17);
      pdf.text("Reporte de flota de camiones", 10, 14);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(159, 179, 209);
      pdf.text(`${listaCamiones.length} camiones   |   ${HOY()}`, 287, 14, { align: "right" });
      pdf.setFillColor(22, 49, 92); pdf.rect(10, 28, 277, 8, "F");
      pdf.setTextColor(255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(8.5);
      let x = 10;
      COL.forEach(([t, w]) => { pdf.text(t, x + 2, 33.3); x += w; });
      return 36;
    };
    let y = cabecera();
    listaCamiones.forEach((c, i) => {
      if (y + 8 > 198) { pdf.addPage(); y = cabecera(); }
      if (i % 2 === 0) { pdf.setFillColor(...GRIS); pdf.rect(10, y, 277, 8, "F"); }
      const v = [c.placa, `${c.marca || ""} ${c.modelo || ""}`, c.anio, c.tipo, c.color,
        (c.kilometrajeActual ?? 0).toLocaleString("es-HN"), "", c.numeroMotor, c.numeroChasis];
      let x = 10;
      COL.forEach(([, w], k) => {
        const e = EST[c.estado];
        if (k === 6) {
          if (e) {
            pdf.setFillColor(...rgb(e[0])); pdf.roundedRect(x + 1, y + 1.5, w - 4, 5, 2.5, 2.5, "F");
            pdf.setTextColor(...rgb(e[1])); pdf.setFont("helvetica", "bold"); pdf.setFontSize(7.5);
            pdf.text(c.estado, x + (w - 2) / 2, y + 5.2, { align: "center" });
          }
        } else {
          pdf.setFont("helvetica", k === 0 ? "bold" : "normal"); pdf.setFontSize(8.5); pdf.setTextColor(...NAVY);
          pdf.text(pdf.splitTextToSize(String(v[k] ?? ""), w - 3)[0] || "", x + 2, y + 5.3);
        }
        x += w;
      });
      y += 8;
    });
    const n = pdf.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      pdf.setPage(p); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(...MUT);
      pdf.text("Sistema de gestión de flota", 10, 204);
      pdf.text(`Página ${p} de ${n}`, 287, 204, { align: "right" });
    }
    pdf.save("Reporte_Flota_Camiones.pdf");
  };

  // ---------- Excel profesional ----------
  window.exportarExcelCamiones = function () {
    if (!listaCamiones.length) return mostrarNotificacion("warning", "Sin datos", "No existen camiones para exportar");
    const H = ["Placa", "Marca", "Modelo", "Año", "Tipo", "Color", "Capacidad", "Kilometraje", "Estado", "Número de motor", "Número de chasis"];
    const n = e => listaCamiones.filter(c => c.estado === e).length;
    const filas = [
      ["Control de flota vehicular"],
      ["Reporte general de camiones registrados"],
      ["Fecha de generación: " + HOY()],
      [`Total: ${listaCamiones.length}   |   Disponibles: ${n("DISPONIBLE")}   |   En viaje: ${n("EN VIAJE")}   |   Mantenimiento: ${n("MANTENIMIENTO")}   |   Fuera de servicio: ${n("FUERA DE SERVICIO")}`],
      [], H,
      ...listaCamiones.map(c => [c.placa || "", c.marca || "", c.modelo || "", c.anio ?? "", c.tipo || "", c.color || "",
        c.capacidadCarga ?? "", c.kilometrajeActual ?? 0, c.estado || "", c.numeroMotor || "", c.numeroChasis || ""])
    ];
    const ws = XLSX.utils.aoa_to_sheet(filas);
    const ult = H.length - 1;
    ws["!merges"] = [0, 1, 2, 3].map(r => ({ s: { r, c: 0 }, e: { r, c: ult } }));
    ws["!rows"] = [{ hpt: 36 }, { hpt: 22 }, { hpt: 20 }, { hpt: 22 }, { hpt: 8 }, { hpt: 28 }];
    ws["!cols"] = [14, 16, 16, 8, 18, 14, 12, 14, 20, 22, 24].map(wch => ({ wch }));
    const celda = (r, c, s) => {
      const a = XLSX.utils.encode_cell({ r, c });
      if (!ws[a]) ws[a] = { t: "s", v: "" };
      ws[a].s = s; return ws[a];
    };
    const banda = (fill, color, sz, bold) => ({ fill: { fgColor: { rgb: fill } }, font: { name: "Calibri", sz, bold, color: { rgb: color } }, alignment: { horizontal: "center", vertical: "center" } });
    for (let c = 0; c <= ult; c++) {
      celda(0, c, banda("0B1B34", "FFFFFF", 20, true));
      celda(1, c, banda("F59E0B", "0B1B34", 12, true));
      celda(2, c, banda("EEF1F6", "475569", 10, false));
      celda(3, c, banda("EEF1F6", "0B1B34", 11, true));
      celda(5, c, { ...banda("16315C", "FFFFFF", 11, true), border: { bottom: { style: "medium", color: { rgb: "F59E0B" } } } });
    }
    const linea = { style: "thin", color: { rgb: "E2E8F0" } };
    listaCamiones.forEach((cam, i) => {
      for (let c = 0; c <= ult; c++) {
        const e = EST[cam.estado];
        const s = {
          fill: { fgColor: { rgb: i % 2 ? "F4F6FA" : "FFFFFF" } },
          font: { name: "Calibri", sz: 11, bold: c === 0, color: { rgb: "0F1A2E" } },
          border: { top: linea, bottom: linea, left: linea, right: linea },
          alignment: { vertical: "center", horizontal: [3, 6, 7, 8].includes(c) ? "center" : "left" }
        };
        if (c === 8 && e) { s.fill = { fgColor: { rgb: e[0] } }; s.font = { ...s.font, bold: true, color: { rgb: e[1] } }; }
        const x = celda(6 + i, c, s);
        if (c === 7) x.z = '#,##0 "km"';
        if (c === 3) x.z = "0";
      }
    });
    ws["!autofilter"] = { ref: "A6:K" + filas.length };
    ws["!freeze"] = { xSplit: "0", ySplit: "6", topLeftCell: "A7", activePane: "bottomLeft", state: "frozen" };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Camiones");
    XLSX.writeFile(wb, "Reporte_Camiones.xlsx");
  };
})();