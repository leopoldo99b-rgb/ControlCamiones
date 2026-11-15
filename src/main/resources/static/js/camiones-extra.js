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
    if (ver) {
      fichaId = ver.dataset.id;
      const cam = listaCamiones.find(x => x.id == fichaId); // el color no lo llena camiones.js
      $("colorDetalle").textContent = (cam && cam.color) || "";
      cargarFotos();
      return;
    }
    const del = e.target.closest(".foto-del");
    if (del && confirm("¿Eliminar esta fotografía?")) {
      const r = await fetch(`/camiones/fotos/${del.dataset.id}`, { method: "DELETE" });
      r.ok ? cargarFotos() : mostrarNotificacion("error", "Error", "No se pudo eliminar la fotografía");
    }
  });

  // ---------- Galería: pasar de una foto a otra sin cerrarla ----------
  const lbModal = $("modalImagen"), lbBox = lbModal.querySelector(".lightbox"), lbImg = $("imagenGrande");
  let lbLista = [], lbIdx = 0;
  const lbAbierta = () => lbModal.style.display === "flex";
  const lbReset = () => { lbLista = []; lbBox.classList.remove("multi"); };
  const lbMostrar = i => {
    lbIdx = (i + lbLista.length) % lbLista.length;
    lbImg.src = lbLista[lbIdx].src.replace("w_900", "w_1600");
    lbBox.classList.toggle("multi", lbLista.length > 1);
    lbBox.querySelector(".lb-count").textContent = `${lbIdx + 1} / ${lbLista.length}`;
  };
  const lbCerrar = () => { lbModal.style.display = "none"; lbReset(); };

  document.addEventListener("click", e => {
    const foto = e.target.closest(".foto-item img");
    if (foto) { // fotos de una galería: se abre la grande con su sección completa
      e.stopImmediatePropagation(); e.preventDefault();
      lbLista = [...foto.closest(".galeria").querySelectorAll("img")];
      lbModal.style.display = "flex";
      lbMostrar(lbLista.indexOf(foto));
      return;
    }
    if (e.target.closest(".camion-img, #fotoCamionDetalle")) lbReset(); // tabla y foto principal no tienen galería
    if (!lbAbierta()) return;
    const nav = e.target.closest(".lb-prev, .lb-next");
    if (nav) { e.stopPropagation(); if (lbLista.length > 1) lbMostrar(lbIdx + (nav.classList.contains("lb-next") ? 1 : -1)); }
    else if (e.target === lbModal || e.target.closest(".btn-close-img")) lbCerrar();
  }, true);

  document.addEventListener("keydown", e => {
    if (!lbAbierta() || lbLista.length < 2) return;
    if (e.key === "ArrowLeft") lbMostrar(lbIdx - 1);
    if (e.key === "ArrowRight") lbMostrar(lbIdx + 1);
  });

  let lbX0 = null; // deslizar con el dedo en el celular
  lbModal.addEventListener("touchstart", e => { lbX0 = e.touches[0].clientX; }, { passive: true });
  lbModal.addEventListener("touchend", e => {
    if (lbX0 === null) return;
    const dx = e.changedTouches[0].clientX - lbX0;
    lbX0 = null;
    if (Math.abs(dx) > 50 && lbLista.length > 1) lbMostrar(lbIdx + (dx < 0 ? 1 : -1));
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

  // ---------- Ficha individual en PDF: primero se elige qué información incluir ----------
  const CAMPOS = [
    ["placa", "Placa", c => c.placa], ["marca", "Marca", c => c.marca], ["modelo", "Modelo", c => c.modelo],
    ["anio", "Año", c => c.anio], ["color", "Color", c => c.color], ["tipo", "Tipo", c => c.tipo],
    ["cap", "Capacidad de carga", c => c.capacidadCarga], ["km", "Kilometraje / Horas", c => (c.kilometrajeActual ?? 0).toLocaleString("es-HN")],
    ["motor", "Número de motor", c => c.numeroMotor], ["chasis", "Número de chasis", c => c.numeroChasis]
  ];

  // Carga la imagen a buen tamaño y la pasa a JPEG con fondo blanco
  // (antes las imágenes con transparencia podían salir con fondo negro)
  const cargarImg = (url, ancho = 1200) => new Promise(res => {
    if (!url) return res(null);
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      try {
        const cv = document.createElement("canvas");
        cv.width = im.naturalWidth; cv.height = im.naturalHeight;
        const cx = cv.getContext("2d");
        cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height);
        cx.drawImage(im, 0, 0);
        res({ d: cv.toDataURL("image/jpeg", .88), w: cv.width, h: cv.height });
      } catch { res(null); }
    };
    im.onerror = () => res(null);
    im.src = url.includes("/upload/") ? url.replace("/upload/", `/upload/w_${ancho},q_auto,f_jpg/`) : url;
  });

  async function fichaPDF() {
    const c = camionSeleccionadoPDF;
    if (!c) return mostrarNotificacion("warning", "Sin selección", "No hay un camión seleccionado para generar la ficha");
    const marcados = n => [...document.querySelectorAll(`#modalPDF [name="${n}"]:checked`)].map(i => i.value);
    const campos = marcados("campo"), secc = marcados("secc");
    $("modalPDF").style.display = "none";
    mostrarNotificacion("warning", "Generando PDF", "Preparando la ficha del camión...");
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const W = 210, M = 14, CW = W - 2 * M;
    const ALTO_PRINCIPAL = 92;      // alto de la foto principal (mm)
    const FOTOS_POR_FILA = 2;       // 2 = dos por fila | 1 = una por fila (todavía más grandes)
    let y = 44;

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
      if (campos.includes("placa")) {
        pdf.setFillColor(...AMB); pdf.roundedRect(W - M - 46, full ? 9 : 4.5, 46, full ? 16 : 11, 2.5, 2.5, "F");
        pdf.setTextColor(...NAVY); pdf.setFont("helvetica", "bold"); pdf.setFontSize(full ? 15 : 11);
        pdf.text(String(c.placa || ""), W - M - 23, full ? 19 : 11.8, { align: "center" });
      }
    };
    const espacio = h => { if (y + h > 278) { pdf.addPage(); cabecera(false); y = 30; } };
    const titulo = t => {
      espacio(20);
      pdf.setFillColor(...AMB); pdf.rect(M, y, 1.8, 7, "F");
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(...NAVY);
      pdf.text(t, M + 5, y + 5.3);
      y += 11;
    };
    const vacioTxt = t => {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(...MUT);
      pdf.text(t, M + 5, y + 2); y += 10;
    };

    // Dibuja la foto COMPLETA dentro de un marco (sin recortar ni deformar, centrada)
    const fotoEnMarco = (im, x, yy, w, h) => {
      pdf.setFillColor(...GRIS); pdf.roundedRect(x, yy, w, h, 2.5, 2.5, "F");
      if (!im) {
        pdf.setFont("helvetica", "italic"); pdf.setFontSize(9); pdf.setTextColor(...MUT);
        pdf.text("Imagen no disponible", x + w / 2, yy + h / 2, { align: "center" });
        return;
      }
      const pad = 1.5;
      const esc = Math.min((w - 2 * pad) / im.w, (h - 2 * pad) / im.h);
      const dw = im.w * esc, dh = im.h * esc;
      pdf.addImage(im.d, "JPEG", x + (w - dw) / 2, yy + (h - dh) / 2, dw, dh);
    };

    cabecera(true);

    // Nombre del vehículo + foto principal (grande, ancho completo)
    const nombre = [campos.includes("marca") ? c.marca : "", campos.includes("modelo") ? c.modelo : ""].filter(Boolean).join(" ");
    if (nombre) {
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.setTextColor(...NAVY);
      pdf.text(pdf.splitTextToSize(nombre, CW)[0], M, y + 6);
      y += 13;
    }
    if (secc.includes("foto")) {
      const img = await cargarImg(c.imgcamion || "/imgs/stock.jpg", 1600);
      fotoEnMarco(img, M, y, CW, ALTO_PRINCIPAL);
      y += ALTO_PRINCIPAL + 8;
    }

    // Datos del vehículo (solo los marcados)
    const datos = CAMPOS.filter(([k]) => campos.includes(k));
    if (datos.length) {
      titulo("Datos del vehículo");
      datos.forEach(([k, t, val], i) => {
        if (i % 2 === 0) espacio(21);
        const x = M + (i % 2) * 94;
        pdf.setFillColor(...GRIS); pdf.roundedRect(x, y, 88, 17, 2, 2, "F");
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.setTextColor(...MUT);
        pdf.text(t, x + 4, y + 6);
        if (k === "km") { pdf.setFontSize(6.5); pdf.text("Se actualiza una vez al mes", x + 84, y + 6, { align: "right" }); }
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(...NAVY);
        pdf.text(String(val(c) || "No registrado"), x + 4, y + 13);
        if (i % 2 === 1 || i === datos.length - 1) y += 21;
      });
      y += 4;
    }

    // Observaciones
    if (secc.includes("obs")) {
      titulo("Observaciones");
      const obs = (c.observaciones || "").split("\n\n\n").map(o => o.trim()).filter(Boolean);
      if (!obs.length) vacioTxt("Sin observaciones registradas.");
      obs.forEach((o, i) => {
        const L = o.split("\n").map(l => l.trim());
        const campo = k => (L.find(l => l.startsWith(k + ":")) || "").slice(k.length + 1).trim();
        const di = L.findIndex(l => l.startsWith("Detalle:"));
        const detalle = di >= 0 ? [L[di].slice(8).trim(), ...L.slice(di + 1)].join("\n").trim() : o;
        const lineas = pdf.splitTextToSize(detalle, W - 2 * M - 10);
        const h = 16 + lineas.length * 3.9 + 3;
        espacio(h);
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
    }

    // Galerías: fotos grandes, 2 por fila (1 si solo hay una), completas y sin deformar
    let fotos = [];
    if (secc.includes("gu") || secc.includes("gr")) {
      try {
        const r = await fetch(`/camiones/${fichaId || c.id}/fotos`);
        if (!r.ok) throw new Error();
        fotos = await r.json();
      } catch {
        mostrarNotificacion("error", "Error", "No se pudieron leer las fotografías para el PDF");
      }
    }
    for (const [s, tipo, t] of [["gu", "UNIDAD", "Fotografías de la unidad"], ["gr", "REPUESTO", "Fotografías de repuestos"]]) {
      if (!secc.includes(s)) continue;
      const lista = fotos.filter(x => x.tipo === tipo);
      const imgs = await Promise.all(lista.map(x => cargarImg(x.url, 1200)));
      const cols = imgs.length === 1 ? 1 : FOTOS_POR_FILA;
      const gap = 6;
      const cw = (CW - gap * (cols - 1)) / cols;
      const ch = Math.min(cw * 0.75, 110);
      const fila = ch + 9;

      espacio(11 + (imgs.length ? fila : 10)); // el título nunca queda solo al final de la hoja
      titulo(t);
      if (!imgs.length) { vacioTxt("Sin fotografías registradas."); continue; }

      imgs.forEach((im, i) => {
        if (i % cols === 0) espacio(fila);
        const x = M + (i % cols) * (cw + gap);
        fotoEnMarco(im, x, y, cw, ch);
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.setTextColor(...MUT);
        pdf.text(`Foto ${i + 1}`, x + 1, y + ch + 4.5);
        if (i % cols === cols - 1 || i === imgs.length - 1) y += fila;
      });
      y += 4;
    }

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

  // Reemplaza el botón para quitarle el generador de PDF anterior: ahora abre la ventana de opciones
  const botonPDF = $("btnImprimirCamion");
  if (botonPDF) {
    const nuevo = botonPDF.cloneNode(true);
    botonPDF.replaceWith(nuevo);
    nuevo.addEventListener("click", () => {
      if (!camionSeleccionadoPDF) return mostrarNotificacion("warning", "Sin selección", "No hay un camión seleccionado para generar la ficha");
      $("modalPDF").style.display = "flex";
    });
  }
  // camiones.js cierra TODAS las ventanas al pulsar cualquier .btn-cancel (cerraría también la ficha): aquí se intercepta antes
  document.addEventListener("click", e => {
    if (!e.target.closest("#pdfCancelar")) return;
    e.stopPropagation();
    $("modalPDF").style.display = "none";
  }, true);
  $("pdfGenerar").addEventListener("click", fichaPDF);

  // ---------- PDF de toda la flota (tabla vectorial, no captura de pantalla) ----------
  window.exportarTablaPDF = function () {
    if (!listaCamiones.length) return mostrarNotificacion("warning", "Sin datos", "No existen camiones para exportar");
    const pdf = new window.jspdf.jsPDF("l", "mm", "a4");
    const COL = [["Placa", 26], ["Vehículo", 56], ["Año", 16], ["Tipo", 38], ["Color", 28], ["Km / Horas", 28], ["Motor", 40], ["Chasis", 45]];
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
        (c.kilometrajeActual ?? 0).toLocaleString("es-HN"), c.numeroMotor, c.numeroChasis];
      let x = 10;
      COL.forEach(([, w], k) => {
        pdf.setFont("helvetica", k === 0 ? "bold" : "normal"); pdf.setFontSize(8.5); pdf.setTextColor(...NAVY);
        pdf.text(pdf.splitTextToSize(String(v[k] ?? ""), w - 3)[0] || "", x + 2, y + 5.3);
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
    const H = ["Placa", "Marca", "Modelo", "Año", "Tipo", "Color", "Capacidad", "Kilometraje / Horas", "Número de motor", "Número de chasis"];
    const filas = [
      ["Control de flota vehicular"],
      ["Reporte general de camiones registrados"],
      ["Fecha de generación: " + HOY()],
      [`Total de camiones: ${listaCamiones.length}`],
      [], H,
      ...listaCamiones.map(c => [c.placa || "", c.marca || "", c.modelo || "", c.anio ?? "", c.tipo || "", c.color || "",
        c.capacidadCarga ?? "", c.kilometrajeActual ?? 0, c.numeroMotor || "", c.numeroChasis || ""])
    ];
    const ws = XLSX.utils.aoa_to_sheet(filas);
    const ult = H.length - 1;
    ws["!merges"] = [0, 1, 2, 3].map(r => ({ s: { r, c: 0 }, e: { r, c: ult } }));
    ws["!rows"] = [{ hpt: 36 }, { hpt: 22 }, { hpt: 20 }, { hpt: 22 }, { hpt: 8 }, { hpt: 28 }];
    ws["!cols"] = [14, 16, 16, 8, 18, 14, 12, 20, 22, 24].map(wch => ({ wch }));
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
        const s = {
          fill: { fgColor: { rgb: i % 2 ? "F4F6FA" : "FFFFFF" } },
          font: { name: "Calibri", sz: 11, bold: c === 0, color: { rgb: "0F1A2E" } },
          border: { top: linea, bottom: linea, left: linea, right: linea },
          alignment: { vertical: "center", horizontal: [3, 6, 7].includes(c) ? "center" : "left" }
        };
        const x = celda(6 + i, c, s);
        if (c === 7) x.z = "#,##0";
        if (c === 3) x.z = "0";
      }
    });
    ws["!autofilter"] = { ref: "A6:J" + filas.length };
    ws["!freeze"] = { xSplit: "0", ySplit: "6", topLeftCell: "A7", activePane: "bottomLeft", state: "frozen" };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Camiones");
    XLSX.writeFile(wb, "Reporte_Camiones.xlsx");
  };
})();