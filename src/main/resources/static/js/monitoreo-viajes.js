"use strict";

/**
 * Transportes CHC - Viajes, recorrido, paradas, línea de tiempo e impresión
 * Cargar DESPUÉS de /js/monitoreo-gps.js (usa window.TransportesCHCGPS.getMap()).
 */
(() => {
    const API = "/api";
    const REFRESH_MS = 30_000;

    const $ = id => document.getElementById(id);

    const CLASE_ESTADO = {
        "En curso": "estado-en-ruta",
        "Detenido": "estado-detenido",
        "En espera": "estado-espera",
        "Finalizado": "estado-finalizado"
    };

    const estado = {
        viajes: [],
        rutaId: null,
        ruta: null,        // última ruta cargada (para imprimir la línea de tiempo)
        reporte: null,     // último reporte generado (para imprimirlo)
        capa: null,
        primeraCarga: true
    };

    // -----------------------------------------------------
    // Utilidades
    // -----------------------------------------------------

    function el(tag, clase, texto) {
        const e = document.createElement(tag);
        if (clase) e.className = clase;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function esc(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[c]);
    }

    function fmt(valor) {
        if (!valor) return "—";
        const d = new Date(valor);
        return Number.isNaN(d.getTime())
            ? "—"
            : d.toLocaleString("es-HN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: false
            });
    }

    function fmtDuracion(min) {
        if (min == null) return "—";
        if (min < 60) return `${min} min`;
        return `${Math.floor(min / 60)} h ${min % 60} min`;
    }

    /** "2026-10-20" -> "20/10/2026" */
    function fechaCorta(iso) {
        return String(iso || "").split("-").reverse().join("/");
    }

    function ahoraLocalISO() {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    }

    /** "Unidad | Placa | Conductor" -> [unidad, placa, conductor] */
    function partesUnidad(texto) {
        const [unidad, placa, conductor] = (texto || "").split(" | ");
        return [unidad || "—", placa || "", conductor || "—"];
    }

    function csrfHeaders() {
        const token = document.querySelector('meta[name="_csrf"]');
        const header = document.querySelector('meta[name="_csrf_header"]');
        return token && header ? { [header.content]: token.content } : {};
    }

    async function api(url, opciones = {}) {
        const headers = {
            Accept: "application/json",
            ...csrfHeaders(),
            ...(opciones.body ? { "Content-Type": "application/json" } : {})
        };

        const respuesta = await fetch(url, { ...opciones, headers, cache: "no-store" });
        const texto = await respuesta.text();

        let datos = null;
        try { datos = texto ? JSON.parse(texto) : null; } catch { datos = null; }

        if (!respuesta.ok) {
            const detalle = datos?.errores
                ? Object.values(datos.errores).join(" ")
                : "";
            throw new Error(datos?.mensaje || detalle || `Error HTTP ${respuesta.status}`);
        }

        return datos;
    }

    function getMapa() {
        return window.TransportesCHCGPS?.getMap?.() ?? null;
    }

    // -----------------------------------------------------
    // Tabla de viajes
    // -----------------------------------------------------

    function celdaUnidad(conductorUnidad) {
        const [unidad, placa, conductor] = (conductorUnidad || "").split(" | ");
        const td = el("td");
        td.append(
            el("span", "unidad-nombre", `${unidad || "—"}${placa ? " · " + placa : ""}`),
            el("span", "conductor-nombre", conductor || "")
        );
        return td;
    }

    function botonAccion(texto, icono, accion, id) {
        const b = el("button", "btn-accion-viaje");
        b.type = "button";
        b.dataset.accion = accion;
        b.dataset.viaje = id;
        b.append(el("i", `bi ${icono}`), document.createTextNode(" " + texto));
        return b;
    }

    function renderTabla() {
        const tbody = $("eventosTable");
        if (!tbody) return;

        tbody.replaceChildren();

        if (!estado.viajes.length) {
            const tr = el("tr");
            const td = el("td", "text-center py-3", "Todavía no hay viajes registrados.");
            td.colSpan = 9;
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        estado.viajes.forEach((v, i) => {
            const tr = el("tr");

            const tdId = el("td");
            tdId.appendChild(el("strong", "", `#${v.idViaje}`));

            const tdEstado = el("td");
            tdEstado.appendChild(
                el("span", `estado-viaje ${CLASE_ESTADO[v.estado] || ""}`, v.estado));

            const tdAcciones = el("td");
            const caja = el("div", "acciones-viaje");
            caja.append(
                botonAccion("Ruta", "bi-signpost-split", "ruta", v.idViaje),
                botonAccion("Ver", "bi-eye", "detalle", v.idViaje)
            );
            if (v.estado === "En curso") {
                caja.appendChild(botonAccion("Finalizar", "bi-flag", "finalizar", v.idViaje));
            }
            const eliminar = botonAccion("Eliminar", "bi-trash", "eliminar", v.idViaje);
            eliminar.classList.add("btn-eliminar-viaje");
            caja.appendChild(eliminar);
            tdAcciones.appendChild(caja);

            tr.append(
                el("td", "", String(i + 1)),
                tdId,
                el("td", "", fmt(v.fechaInicio)),
                celdaUnidad(v.conductorUnidad),
                el("td", "", v.origen || "—"),
                el("td", "", v.destino || "—"),
                tdEstado,
                el("td", "", `${v.totalParadas} parada(s)`),
                tdAcciones
            );

            tbody.appendChild(tr);
        });
    }

    function renderMetricas() {
        const enCurso = estado.viajes.filter(v => v.estado === "En curso").length;
        const m = $("viajesEnCurso");
        if (m) m.textContent = String(enCurso);
    }

    async function cargarViajes() {
        try {
            estado.viajes = await api(`${API}/viajes`) || [];
            renderTabla();
            renderMetricas();

            if (estado.primeraCarga) {
                estado.primeraCarga = false;
                const activo = estado.viajes.find(v => v.estado === "En curso");
                if (activo) await mostrarRuta(activo.idViaje);
            }
        } catch (error) {
            console.error("Error cargando viajes:", error);
        }
    }

    // -----------------------------------------------------
    // Ruta, paradas y línea de tiempo
    // -----------------------------------------------------

    function iconoParada(numero) {
        return L.divIcon({
            className: "chc-parada-marcador",
            html: `<div style="width:28px;height:28px;border-radius:50%;
                background:#f59e0b;border:3px solid #fff;color:#111;
                font-weight:800;font-size:13px;display:flex;
                align-items:center;justify-content:center;
                box-shadow:0 2px 8px #0006;">${Number(numero)}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });
    }

    function popupParada(p, idViaje) {
        const caja = el("div", "gps-popup");
        caja.append(
            el("strong", "", `Parada ${p.numeroParada}`),
            document.createElement("br"),
            el("span", "", `Inicio: ${fmt(p.inicio)}`),
            document.createElement("br"),
            el("span", "", p.fin ? `Fin: ${fmt(p.fin)}` : "Sigue detenido"),
            document.createElement("br"),
            el("span", "", `Duración: ${fmtDuracion(p.duracionMinutos)}`),
            document.createElement("br"),
            el("span", "", `Lugar: ${p.observaciones || "—"}`),
            document.createElement("br"),
            el("span", "", `Motivo: ${p.motivo || "Sin registrar"}`),
            document.createElement("br")
        );

        const b = el("button", "btn-editar-motivo", "Registrar / editar motivo");
        b.type = "button";
        b.addEventListener("click", () => abrirDetalle(idViaje));
        caja.appendChild(b);

        return caja;
    }

    /** Dibuja el recorrido y las paradas en el mapa (si el mapa está disponible). */
    function dibujarRutaEnMapa(ruta, idViaje, ajustar) {
        const mapa = getMapa();

        if (!mapa) {
            console.warn("El mapa no está disponible: se muestra solo la línea de tiempo.");
            return;
        }

        if (!estado.capa) {
            estado.capa = L.layerGroup().addTo(mapa);
        }
        estado.capa.clearLayers();

        const puntos = ruta.recorrido.map(p => [p.latitud, p.longitud]);

        if (puntos.length > 1) {
            L.polyline(puntos, { color: "#22d3ee", weight: 5, opacity: 0.9 })
                .addTo(estado.capa);
        }

        if (puntos.length) {
            L.circleMarker(puntos[0], {
                radius: 7, color: "#fff", weight: 2,
                fillColor: "#22c55e", fillOpacity: 1
            }).bindTooltip("Inicio del recorrido").addTo(estado.capa);
        }

        const puntosParada = [];

        ruta.paradas.forEach(p => {
            if (p.latitud == null || p.longitud == null) return;

            puntosParada.push([p.latitud, p.longitud]);

            L.marker([p.latitud, p.longitud], { icon: iconoParada(p.numeroParada) })
                .bindPopup(() => popupParada(p, idViaje))
                .addTo(estado.capa);
        });

        const todos = puntos.concat(puntosParada);

        if (ajustar && todos.length) {
            mapa.fitBounds(todos, { padding: [40, 40], maxZoom: 16 });
        }
    }

    async function mostrarRuta(id, { ajustar = true } = {}) {
        const ruta = await api(`${API}/viajes/${id}/ruta`);

        estado.rutaId = id;
        estado.ruta = ruta;

        // La línea de tiempo se muestra siempre, aunque el mapa falle.
        renderTimeline(ruta);
        dibujarRutaEnMapa(ruta, id, ajustar);
    }

    /** Eventos de la línea de tiempo (se usan en pantalla y al imprimir). */
    function eventosTimeline(ruta) {
        const v = ruta.viaje;

        const eventos = [{
            titulo: "Inicio del viaje",
            detalle: `${fmt(v.fechaInicio)} · ${v.origen || "—"} → ${v.destino || "—"}`
        }];

        ruta.paradas.forEach(p => {
            eventos.push({
                titulo: `Parada ${p.numeroParada}: ${p.motivo || "motivo pendiente"}`,
                detalle: `${fmt(p.inicio)} → ${p.fin ? fmt(p.fin) : "en curso"} ` +
                         `(${fmtDuracion(p.duracionMinutos)})`,
                lugar: p.observaciones || ""
            });
        });

        if (v.fechaFin) {
            eventos.push({ titulo: "Fin del viaje", detalle: fmt(v.fechaFin) });
        }

        return eventos;
    }

    function renderTimeline(ruta) {
        const v = ruta.viaje;
        const [unidad] = partesUnidad(v.conductorUnidad);

        const u = $("timelineUnidad");
        const vi = $("timelineViaje");
        const es = $("timelineEstado");
        const cont = $("timelineEventos");

        if (u) u.textContent = unidad;
        if (vi) vi.textContent = `#${v.idViaje}`;
        if (es) es.textContent = v.estado;

        const btnImprimir = $("btnImprimirTimeline");
        if (btnImprimir) btnImprimir.disabled = false;

        if (!cont) return;

        cont.replaceChildren();

        eventosTimeline(ruta).forEach(e => {
            const d = el("div", "timeline-item");
            d.append(el("strong", "", e.titulo), el("small", "", e.detalle));

            if (e.lugar) {
                d.appendChild(el("small", "", `Lugar: ${e.lugar}`));
            }

            cont.appendChild(d);
        });
    }

    // -----------------------------------------------------
    // Detalle del viaje y edición del motivo
    // -----------------------------------------------------

    function campoParada(etiqueta, valor) {
        const c = el("div", "parada-campo");
        c.append(el("span", "detalle-etiqueta", etiqueta), el("div", "detalle-valor", valor));
        return c;
    }

    function renderParadas(ruta) {
        const cont = $("detalleParadas");
        cont.replaceChildren();

        if (!ruta.paradas.length) {
            cont.appendChild(el("p", "text-muted small",
                "El sistema todavía no ha detectado paradas en este viaje."));
            return;
        }

        ruta.paradas.forEach(p => {
            const tarjeta = el("section", "parada-card");

            const cab = el("div", "parada-cabecera");
            const titulo = el("div", "parada-titulo");
            titulo.append(
                el("span", "parada-numero", String(p.numeroParada)),
                el("span", "", `Parada ${p.numeroParada}`)
            );

            const editar = el("button", "btn-editar-motivo");
            editar.type = "button";
            editar.title = "Editar motivo de la parada";
            editar.setAttribute("aria-label", `Editar motivo de la parada ${p.numeroParada}`);
            editar.appendChild(el("i", "bi bi-pencil"));
            cab.append(titulo, editar);

            const campos = el("div", "parada-campos");
            campos.append(
                campoParada("Inicio", fmt(p.inicio)),
                campoParada("Fin", p.fin ? fmt(p.fin) : "Sigue detenido"),
                campoParada("Duración", fmtDuracion(p.duracionMinutos))
            );

            const campoMotivo = campoParada("Motivo", p.motivo || "Sin registrar");
            campos.append(
                campoMotivo,
                campoParada("Lugar / observaciones", p.observaciones || "—")
            );

            editar.addEventListener("click", () =>
                mostrarEditor(campoMotivo, ruta.viaje.idViaje, p));

            tarjeta.append(cab, campos);
            cont.appendChild(tarjeta);
        });
    }

    function mostrarEditor(campoMotivo, idViaje, parada) {
        if (campoMotivo.querySelector(".motivo-editor")) return;

        const mensaje = $("mensajeEdicionMotivo");
        const editor = el("div", "motivo-editor");

        const entrada = document.createElement("input");
        entrada.type = "text";
        entrada.maxLength = 250;
        entrada.value = parada.motivo || "";
        entrada.placeholder = "Escribe el motivo de la parada";
        entrada.setAttribute("aria-label", "Motivo de la parada");

        const guardar = el("button", "btn-guardar-motivo", "Guardar");
        guardar.type = "button";

        const cancelar = el("button", "btn-cancelar-motivo", "Cancelar");
        cancelar.type = "button";

        guardar.addEventListener("click", async () => {
            const motivo = entrada.value.trim();

            if (!motivo) {
                entrada.setCustomValidity("Introduce un motivo para continuar.");
                entrada.reportValidity();
                entrada.addEventListener("input", () => entrada.setCustomValidity(""), { once: true });
                return;
            }

            guardar.disabled = true;

            try {
                await api(`${API}/paradas/${parada.idParada}/motivo`, {
                    method: "PUT",
                    body: JSON.stringify({ motivo })
                });

                mensaje.textContent = `Motivo de la parada ${parada.numeroParada} guardado.`;
                await abrirDetalle(idViaje, { mantenerMensaje: true });
                await mostrarRuta(idViaje, { ajustar: false });
            } catch (error) {
                mensaje.textContent = error.message;
                guardar.disabled = false;
            }
        });

        cancelar.addEventListener("click", () => abrirDetalle(idViaje));

        editor.append(entrada, guardar, cancelar);
        campoMotivo.appendChild(editor);
        entrada.focus();
    }

    async function abrirDetalle(id, { mantenerMensaje = false } = {}) {
        try {
            const ruta = await api(`${API}/viajes/${id}/ruta`);
            const v = ruta.viaje;
            const [unidad, placa, conductor] = partesUnidad(v.conductorUnidad);

            if (!mantenerMensaje) $("mensajeEdicionMotivo").textContent = "";

            $("detalleTitulo").textContent = `Detalle del viaje #${v.idViaje}`;

            const est = $("detalleEstado");
            est.replaceChildren(el("i", "bi bi-circle-fill"),
                document.createTextNode(" " + v.estado));

            $("detalleUnidad").textContent =
                `${unidad}${placa ? " · " + placa : ""} / ${conductor}`;
            $("detalleFecha").textContent = fmt(v.fechaInicio);
            $("detalleOrigen").textContent = v.origen || "—";
            $("detalleDestino").textContent = v.destino || "—";

            renderParadas(ruta);

            bootstrap.Modal.getOrCreateInstance($("modalDetalleViaje")).show();
        } catch (error) {
            window.alert(error.message);
        }
    }

    // -----------------------------------------------------
    // Eliminar viaje (advertencia + confirmación escribiendo el ID)
    // -----------------------------------------------------

    let viajeAEliminar = null;

    async function pedirEliminarViaje(id) {
        try {
            const ruta = await api(`${API}/viajes/${id}/ruta`);
            const v = ruta.viaje;
            const [unidad, placa, conductor] = partesUnidad(v.conductorUnidad);

            viajeAEliminar = v;

            const lineas = [
                `Viaje #${v.idViaje} · ${v.estado}`,
                `${unidad}${placa ? " · " + placa : ""} · ${conductor}`,
                `${v.origen || "—"} → ${v.destino || "—"}`,
                `Inicio: ${fmt(v.fechaInicio)}`,
                `Se borrarán ${ruta.paradas.length} parada(s) y ` +
                `${ruta.recorrido.length} punto(s) de recorrido.`
            ];

            $("eliminarResumen").replaceChildren(
                ...lineas.map(t => el("div", "", t)));
            $("eliminarEnCurso").hidden = v.estado !== "En curso";
            $("eliminarIdEsperado").textContent = String(v.idViaje);
            $("eliminarConfirmacion").value = "";
            $("btnConfirmarEliminar").disabled = true;
            $("mensajeEliminar").textContent = "";

            bootstrap.Modal.getOrCreateInstance($("modalEliminarViaje")).show();
        } catch (error) {
            window.alert(error.message);
        }
    }

    /** El botón de borrar se activa solo si se escribe el ID correcto. */
    function validarConfirmacionEliminar() {
        const escrito = $("eliminarConfirmacion").value.trim();
        $("btnConfirmarEliminar").disabled =
            !viajeAEliminar || escrito !== String(viajeAEliminar.idViaje);
    }

    function limpiarRutaMostrada() {
        estado.rutaId = null;
        estado.ruta = null;
        estado.capa?.clearLayers();

        const u = $("timelineUnidad");
        const vi = $("timelineViaje");
        const es = $("timelineEstado");
        const cont = $("timelineEventos");
        const btn = $("btnImprimirTimeline");

        if (u) u.textContent = "Sin unidad seleccionada";
        if (vi) vi.textContent = "";
        if (es) es.textContent = "Sin datos";
        if (btn) btn.disabled = true;
        if (cont) {
            cont.replaceChildren(el("p", "text-muted small",
                'Selecciona un viaje y pulsa "Ruta" para consultar su información.'));
        }
    }

    async function confirmarEliminarViaje() {
        if (!viajeAEliminar) return;

        const id = viajeAEliminar.idViaje;
        const boton = $("btnConfirmarEliminar");
        const mensaje = $("mensajeEliminar");

        boton.disabled = true;
        mensaje.textContent = "Eliminando viaje...";

        try {
            await api(`${API}/viajes/${id}`, { method: "DELETE" });

            bootstrap.Modal.getOrCreateInstance($("modalEliminarViaje")).hide();
            viajeAEliminar = null;

            if (estado.rutaId === id) limpiarRutaMostrada();

            await cargarViajes();
        } catch (error) {
            mensaje.textContent = error.message;
            boton.disabled = false;
        }
    }

    async function finalizarViaje(id) {
        if (!window.confirm("¿Finalizar este viaje manualmente?")) return;

        try {
            await api(`${API}/viajes/${id}/finalizar`, { method: "POST" });
            await cargarViajes();
            if (estado.rutaId === Number(id)) await mostrarRuta(id, { ajustar: false });
        } catch (error) {
            window.alert(error.message);
        }
    }

    // -----------------------------------------------------
    // Impresión: línea de tiempo de un viaje y reporte por fechas
    // -----------------------------------------------------

    const CSS_IMPRESION = `
        @page { margin: 14mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        h2 { font-size: 14px; margin: 0 0 6px; }
        .sub { color: #555; margin: 0 0 14px; }
        .resumen { display: flex; gap: 28px; margin: 0 0 18px; padding: 10px 12px;
                   border: 1px solid #bbb; border-radius: 6px; }
        .resumen strong { display: block; font-size: 16px; }
        .viaje { margin: 0 0 22px; }
        .cab { background: #eee; padding: 8px 10px; border: 1px solid #bbb;
               border-radius: 6px 6px 0 0; break-after: avoid; }
        .cab div { margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #bbb; padding: 5px 7px; text-align: left; vertical-align: top; }
        th { background: #f5f5f5; }
        tr { break-inside: avoid; }
        .vacio { padding: 8px 10px; border: 1px solid #bbb; border-top: 0; color: #555; }
        .tl { border-left: 3px solid #555; margin: 16px 0 0 8px; padding-left: 20px; }
        .tl-item { position: relative; margin: 0 0 14px; break-inside: avoid; }
        .tl-item::before { content: ""; position: absolute; left: -29px; top: 2px;
                           width: 10px; height: 10px; border-radius: 50%;
                           background: #fff; border: 3px solid #555; }
        .tl-item small { display: block; color: #444; margin-top: 2px; }
    `;

    /** Imprime HTML en un iframe oculto (no depende del tema oscuro de la página). */
    function imprimirDocumento(titulo, cuerpo) {
        const iframe = document.createElement("iframe");
        iframe.setAttribute("aria-hidden", "true");
        iframe.style.cssText =
            "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument;
        doc.open();
        doc.write(
            `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">` +
            `<title>${esc(titulo)}</title><style>${CSS_IMPRESION}</style></head>` +
            `<body>${cuerpo}</body></html>`);
        doc.close();

        const ventana = iframe.contentWindow;
        ventana.onafterprint = () => iframe.remove();
        window.setTimeout(() => iframe.remove(), 5 * 60_000); // respaldo

        ventana.focus();
        ventana.print();
    }

    function htmlCabeceraViaje(v) {
        const [unidad, placa, conductor] = partesUnidad(v.conductorUnidad);

        return `
            <div class="cab">
                <h2>Viaje #${esc(v.idViaje)} · ${esc(v.estado)}</h2>
                <div>${esc(unidad)}${placa ? " · " + esc(placa) : ""} · Conductor: ${esc(conductor)}</div>
                <div>${esc(v.origen || "—")} → ${esc(v.destino || "—")}</div>
                <div>Inicio: ${esc(fmt(v.fechaInicio))} ·
                     Fin: ${esc(v.fechaFin ? fmt(v.fechaFin) : "—")} ·
                     Paradas: ${esc(v.totalParadas)}</div>
            </div>`;
    }

    function htmlTablaParadas(paradas) {
        if (!paradas.length) {
            return `<div class="vacio">Sin paradas registradas.</div>`;
        }

        const filas = paradas.map(p => `
            <tr>
                <td>${esc(p.numeroParada)}</td>
                <td>${esc(fmt(p.inicio))}</td>
                <td>${esc(p.fin ? fmt(p.fin) : "Sigue detenido")}</td>
                <td>${esc(fmtDuracion(p.duracionMinutos))}</td>
                <td>${esc(p.observaciones || "—")}</td>
                <td>${esc(p.motivo || "Sin registrar")}</td>
            </tr>`).join("");

        return `
            <table>
                <thead>
                    <tr>
                        <th>#</th><th>Inicio</th><th>Fin</th>
                        <th>Duración</th><th>Lugar</th><th>Motivo</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>`;
    }

    // --- Línea de tiempo de UN viaje ---

    function htmlLineaTiempo(ruta) {
        const items = eventosTimeline(ruta).map(e => `
            <div class="tl-item">
                <strong>${esc(e.titulo)}</strong>
                <small>${esc(e.detalle)}</small>
                ${e.lugar ? `<small>Lugar: ${esc(e.lugar)}</small>` : ""}
            </div>`).join("");

        return `
            <h1>Línea de tiempo del viaje #${esc(ruta.viaje.idViaje)}</h1>
            <p class="sub">Generado: ${esc(fmt(new Date()))}</p>
            ${htmlCabeceraViaje(ruta.viaje)}
            <div class="tl">${items}</div>`;
    }

    function imprimirTimeline() {
        if (!estado.ruta) {
            window.alert('Selecciona un viaje y pulsa "Ruta" primero.');
            return;
        }

        imprimirDocumento(
            `Línea de tiempo - viaje ${estado.ruta.viaje.idViaje}`,
            htmlLineaTiempo(estado.ruta));
    }

    // --- Reporte por rango de fechas (tabla por viaje) ---

    function htmlReporte({ desde, hasta, datos }) {
        const totalParadas = datos.reduce((s, d) => s + d.paradas.length, 0);
        const totalMin = datos.reduce((s, d) =>
            s + d.paradas.reduce((a, p) => a + (p.duracionMinutos || 0), 0), 0);

        const bloques = datos.map(d => `
            <section class="viaje">
                ${htmlCabeceraViaje(d.viaje)}
                ${htmlTablaParadas(d.paradas)}
            </section>`).join("");

        return `
            <h1>Reporte de viajes</h1>
            <p class="sub">Del ${esc(fechaCorta(desde))} al ${esc(fechaCorta(hasta))}
                · Generado: ${esc(fmt(new Date()))}</p>

            <div class="resumen">
                <div><strong>${datos.length}</strong>Viajes</div>
                <div><strong>${totalParadas}</strong>Paradas</div>
                <div><strong>${esc(fmtDuracion(totalMin))}</strong>Tiempo total detenido</div>
            </div>

            ${bloques}`;
    }

    async function generarReporte() {
        const desde = $("reporteDesde").value;
        const hasta = $("reporteHasta").value;
        const resumen = $("reporteResumen");
        const btnImprimir = $("btnImprimirReporte");

        estado.reporte = null;
        btnImprimir.disabled = true;

        if (!desde || !hasta) {
            resumen.textContent = "Selecciona la fecha inicial y la final.";
            return;
        }

        if (hasta < desde) {
            resumen.textContent = "La fecha final no puede ser anterior a la inicial.";
            return;
        }

        resumen.textContent = "Consultando viajes...";

        try {
            const url = `${API}/viajes/reporte` +
                `?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;

            const datos = await api(url) || [];

            if (!datos.length) {
                resumen.textContent = "No hay viajes en ese rango de fechas.";
                return;
            }

            const paradas = datos.reduce((s, d) => s + d.paradas.length, 0);

            estado.reporte = { desde, hasta, datos };
            resumen.textContent =
                `${datos.length} viaje(s) y ${paradas} parada(s) listos para imprimir.`;
            btnImprimir.disabled = false;
        } catch (error) {
            resumen.textContent = error.message;
        }
    }

    function imprimirReporte() {
        if (!estado.reporte) return;

        imprimirDocumento("Reporte de viajes", htmlReporte(estado.reporte));
    }

    function iniciarReporte() {
        const desde = $("reporteDesde");
        const hasta = $("reporteHasta");

        if (!desde || !hasta) return;

        const hoy = ahoraLocalISO().slice(0, 10);

        if (!desde.value) desde.value = hoy.slice(0, 8) + "01"; // primer día del mes
        if (!hasta.value) hasta.value = hoy;

        const invalidar = () => {
            estado.reporte = null;
            $("btnImprimirReporte").disabled = true;
            $("reporteResumen").textContent = "";
        };

        desde.addEventListener("change", invalidar);
        hasta.addEventListener("change", invalidar);

        $("btnGenerarReporte")?.addEventListener("click", generarReporte);
        $("btnImprimirReporte")?.addEventListener("click", imprimirReporte);
    }

    // -----------------------------------------------------
    // Formulario "Crear viaje"
    // -----------------------------------------------------

    function iniciarFormulario() {
        const form = $("formCrearViaje");
        if (!form) return;

        const fecha = $("fechaSalida");
        if (fecha && !fecha.value) fecha.value = ahoraLocalISO();

        form.addEventListener("submit", async evento => {
            evento.preventDefault();

            const mensaje = $("mensajeCrearViaje");
            const boton = $("btnGuardarViaje");

            const cuerpo = {
                idViaje: Number($("idViaje").value) || null,
                idVehiculoGps: $("conductorUnidad").value,
                origenId: Number($("origen").value) || null,
                destinoId: Number($("destino").value) || null,
                fechaSalida: $("fechaSalida").value || null
            };

            boton.disabled = true;
            mensaje.textContent = "Creando viaje...";

            try {
                const viaje = await api(`${API}/viajes`, {
                    method: "POST",
                    body: JSON.stringify(cuerpo)
                });

                mensaje.textContent = "";
                form.reset();
                if (fecha) fecha.value = ahoraLocalISO();

                window.location.hash = ""; // cierra el modal (:target)

                await cargarViajes();
                await mostrarRuta(viaje.idViaje);
            } catch (error) {
                mensaje.textContent = error.message;
            } finally {
                boton.disabled = false;
            }
        });
    }

    // -----------------------------------------------------
    // Inicio
    // -----------------------------------------------------

    function iniciar() {
        iniciarFormulario();
        iniciarReporte();

        $("btnImprimirTimeline")?.addEventListener("click", imprimirTimeline);
        $("eliminarConfirmacion")?.addEventListener("input", validarConfirmacionEliminar);
        $("btnConfirmarEliminar")?.addEventListener("click", confirmarEliminarViaje);

        $("eventosTable")?.addEventListener("click", evento => {
            const boton = evento.target.closest("[data-accion]");
            if (!boton) return;

            const id = Number(boton.dataset.viaje);

            if (boton.dataset.accion === "ruta") mostrarRuta(id).catch(e => window.alert(e.message));
            if (boton.dataset.accion === "detalle") abrirDetalle(id);
            if (boton.dataset.accion === "finalizar") finalizarViaje(id);
            if (boton.dataset.accion === "eliminar") pedirEliminarViaje(id);
        });

		document.addEventListener("chc:actualizar", async () => {
		    await cargarViajes();
		    if (estado.rutaId !== null) {
		        mostrarRuta(estado.rutaId, { ajustar: false }).catch(console.error);
		    }
		});
		
        cargarViajes();

        window.setInterval(async () => {
            if (document.hidden) return;
            await cargarViajes();
            if (estado.rutaId !== null) {
                mostrarRuta(estado.rutaId, { ajustar: false }).catch(console.error);
            }
        }, REFRESH_MS);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();