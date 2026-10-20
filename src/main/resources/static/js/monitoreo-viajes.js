"use strict";

/**
 * Transportes CHC - Viajes, recorrido y paradas (frontend)
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

    function ahoraLocalISO() {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
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
    // Ruta y paradas en el mapa
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
            el("span", "", `Motivo: ${p.motivo || "Sin registrar"}`),
            document.createElement("br")
        );

        const b = el("button", "btn-editar-motivo", "Registrar / editar motivo");
        b.type = "button";
        b.addEventListener("click", () => abrirDetalle(idViaje));
        caja.appendChild(b);

        return caja;
    }

    async function mostrarRuta(id, { ajustar = true } = {}) {
        const mapa = getMapa();
        if (!mapa) return;

        const ruta = await api(`${API}/viajes/${id}/ruta`);

        estado.rutaId = id;

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
                .bindPopup(() => popupParada(p, id))
                .addTo(estado.capa);
        });

        const todos = puntos.concat(puntosParada);

        if (ajustar && todos.length) {
            mapa.fitBounds(todos, { padding: [40, 40], maxZoom: 16 });
        }

        renderTimeline(ruta);
    }

    function renderTimeline(ruta) {
        const v = ruta.viaje;
        const [unidad] = (v.conductorUnidad || "").split(" | ");

        const u = $("timelineUnidad");
        const vi = $("timelineViaje");
        const es = $("timelineEstado");
        const cont = $("timelineEventos");

        if (u) u.textContent = unidad || "Unidad";
        if (vi) vi.textContent = `#${v.idViaje}`;
        if (es) es.textContent = v.estado;
        if (!cont) return;

        cont.replaceChildren();

        const item = (titulo, detalle) => {
            const d = el("div", "timeline-item");
            d.append(el("strong", "", titulo), el("small", "", detalle));
            cont.appendChild(d);
        };

        item("Inicio del viaje", `${fmt(v.fechaInicio)} · ${v.origen} → ${v.destino}`);

        ruta.paradas.forEach(p => {
            item(
                `Parada ${p.numeroParada}: ${p.motivo || "motivo pendiente"}`,
                `${fmt(p.inicio)} → ${p.fin ? fmt(p.fin) : "en curso"} (${fmtDuracion(p.duracionMinutos)})`
            );
        });

        if (v.fechaFin) {
            item("Fin del viaje", fmt(v.fechaFin));
        }
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
            campos.append(campoMotivo, campoParada("Observaciones", p.observaciones || "—"));

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
            const [unidad, placa, conductor] = (v.conductorUnidad || "").split(" | ");

            if (!mantenerMensaje) $("mensajeEdicionMotivo").textContent = "";

            $("detalleTitulo").textContent = `Detalle del viaje #${v.idViaje}`;

            const est = $("detalleEstado");
            est.replaceChildren(el("i", "bi bi-circle-fill"),
                document.createTextNode(" " + v.estado));

            $("detalleUnidad").textContent =
                `${unidad || "—"}${placa ? " · " + placa : ""} / ${conductor || "—"}`;
            $("detalleFecha").textContent = fmt(v.fechaInicio);
            $("detalleOrigen").textContent = v.origen || "—";
            $("detalleDestino").textContent = v.destino || "—";

            renderParadas(ruta);

            bootstrap.Modal.getOrCreateInstance($("modalDetalleViaje")).show();
        } catch (error) {
            window.alert(error.message);
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

        $("eventosTable")?.addEventListener("click", evento => {
            const boton = evento.target.closest("[data-accion]");
            if (!boton) return;

            const id = Number(boton.dataset.viaje);

            if (boton.dataset.accion === "ruta") mostrarRuta(id).catch(e => window.alert(e.message));
            if (boton.dataset.accion === "detalle") abrirDetalle(id);
            if (boton.dataset.accion === "finalizar") finalizarViaje(id);
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
