/*==================================================
  ASIGNACIÓN DE CAMIONES
==================================================*/

const POR_PAGINA = 8;

const state = {
    asignaciones: [],
    conductores: [],
    camiones: [],
    conductoresLibres: [],
    estado: "TODAS",
    texto: "",
    pagina: 1,
    cargado: false
};

const $ = (id) => document.getElementById(id);

/*---------- Utilidades ----------*/

function esc(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

// Acepta "2026-11-10", "2026-11-10T00:00:00" o [2026, 11, 10] sin desfase de zona horaria
function parseFecha(f) {
    if (!f) return null;
    if (Array.isArray(f)) return new Date(f[0], f[1] - 1, f[2]);
    const [y, m, d] = String(f).split("T")[0].split("-").map(Number);
    return y ? new Date(y, m - 1, d) : null;
}

function formatearFecha(f) {
    const d = parseFecha(f);
    if (!d) return "—";
    return String(d.getDate()).padStart(2, "0") + "/" +
        String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
}

function duracion(a) {
    const ini = parseFecha(a.fechaAsignacion);
    if (!ini) return "—";
    const fin = parseFecha(a.fechaFinalizacion) || new Date();
    const dias = Math.max(0, Math.floor((fin - ini) / 864e5));
    return dias === 0 ? "Hoy" : dias === 1 ? "1 día" : dias + " días";
}

function iniciales(nombre) {
    return String(nombre || "?").trim().split(/\s+/).slice(0, 2)
        .map((p) => p[0]).join("").toUpperCase();
}

function fechaHoyLocal() {
    const h = new Date();
    return h.getFullYear() + "-" + String(h.getMonth() + 1).padStart(2, "0") +
        "-" + String(h.getDate()).padStart(2, "0");
}

/*---------- Notificaciones ----------*/

function mostrarNotificacion(tipo, titulo, mensaje) {
    const icono = { success: "fa-circle-check", error: "fa-circle-exclamation", info: "fa-circle-info" }[tipo] || "fa-circle-info";
    const t = document.createElement("div");
    t.className = "toast " + (tipo === "success" ? "" : tipo);
    t.innerHTML = `<i class="fa-solid ${icono}"></i><div><b>${esc(titulo)}</b>${mensaje ? `<span>${esc(mensaje)}</span>` : ""}</div>`;
    $("toasts").appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

/*---------- Modales ----------*/

let ultimoFoco = null;

function abrirModal(id) {
    const m = $(id);
    if (!m) return;
    ultimoFoco = document.activeElement;
    m.classList.add("active");
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("lock");
    const primero = m.querySelector("select, input, textarea, button:not(.icon-btn)");
    if (primero) setTimeout(() => primero.focus(), 30);
}

function cerrarModales() {
    document.querySelectorAll(".modal.active").forEach((m) => {
        m.classList.remove("active");
        m.setAttribute("aria-hidden", "true");
    });
    document.body.classList.remove("lock");
    if (ultimoFoco) ultimoFoco.focus();
}

// Confirmación propia (reemplaza confirm())
function confirmar({ titulo, texto, boton = "Confirmar", peligro = false }) {
    return new Promise((resolve) => {
        $("confTitulo").textContent = titulo;
        $("confTexto").textContent = texto;
        $("confSi").textContent = boton;
        $("confSi").className = "btn " + (peligro ? "btn-danger" : "btn-primary");
        $("confIcono").className = "confirm-icon" + (peligro ? " danger" : "");
        abrirModal("modalConfirmar");
        const fin = (r) => {
            $("confSi").onclick = $("confNo").onclick = null;
            cerrarModales();
            resolve(r);
        };
        $("confSi").onclick = () => fin(true);
        $("confNo").onclick = () => fin(false);
    });
}

/*---------- Eventos ----------*/

document.addEventListener("DOMContentLoaded", () => {
    iniciarEventos();
    $("fechaAsignacion").value = fechaHoyLocal();
    renderizarTabla();
    cargarDatosIniciales();
});

function iniciarEventos() {
    $("btnNuevaAsignacion").addEventListener("click", () => {
        filtrarConductoresDisponibles();
        cargarSelects();
        $("fechaAsignacion").value = fechaHoyLocal();
        abrirModal("modalAsignacion");
    });

    document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", cerrarModales));

    document.querySelectorAll(".modal").forEach((m) =>
        m.addEventListener("mousedown", (e) => { if (e.target === m && m.id !== "modalConfirmar") cerrarModales(); }));

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModales(); });

    let temporizador;
    $("buscarAsignacion").addEventListener("input", (e) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            state.texto = e.target.value.trim().toLowerCase();
            state.pagina = 1;
            renderizarTabla();
        }, 150);
    });

    $("chipsEstado").addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        state.estado = chip.dataset.estado;
        state.pagina = 1;
        document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
        renderizarTabla();
    });

    $("tbodyAsignaciones").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const id = Number(btn.dataset.id);
        if (btn.dataset.action === "ver") verDetalle(id);
        if (btn.dataset.action === "finalizar") finalizarAsignacion(id);
        if (btn.dataset.action === "eliminar") eliminarAsignacion(id);
    });

    $("paginacion").addEventListener("click", (e) => {
        const b = e.target.closest("[data-pagina]");
        if (!b || b.disabled) return;
        state.pagina = Number(b.dataset.pagina);
        renderizarTabla();
        document.querySelector(".table-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("selectConductores").addEventListener("change", mostrarConductorSeleccionado);
    $("selectCamiones").addEventListener("change", mostrarCamionSeleccionado);
    $("btnGuardarAsignacion").addEventListener("click", guardarAsignacion);
}

/*---------- Carga de datos ----------*/

async function obtener(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " respondió " + r.status);
    return r.json();
}

async function cargarDatosIniciales() {
    try {
        [state.conductores, state.camiones, state.asignaciones] = await Promise.all([
            obtener("/conductores/activos"),
            obtener("/camiones/disponibles"),
            obtener("/asignaciones/lista")
        ]);
        state.cargado = true;
        filtrarConductoresDisponibles();
        cargarSelects();
        renderizarTabla();
        actualizarTarjetas();
    } catch (error) {
        console.error("Error cargando datos:", error);
        state.cargado = true;
        renderizarTabla();
        mostrarNotificacion("error", "No se pudieron cargar los datos", "Revisa la conexión e intenta de nuevo.");
    }
}

function filtrarConductoresDisponibles() {
    const ocupados = state.asignaciones.filter((a) => a.estado === "ACTIVA").map((a) => a.conductor.id);
    state.conductoresLibres = state.conductores.filter((c) => c.estado === "ACTIVO" && !ocupados.includes(c.id));
}

/*---------- Selects y previsualización ----------*/

function cargarSelects() {
    $("selectConductores").innerHTML = '<option value="">Seleccione conductor</option>' +
        state.conductoresLibres.map((c) =>
            `<option value="${esc(c.id)}">${esc(c.nombre)} · Licencia ${esc(c.licencia)}</option>`).join("");

    $("selectCamiones").innerHTML = '<option value="">Seleccione camión</option>' +
        state.camiones.map((c) =>
            `<option value="${esc(c.id)}">${esc(c.placa)} · ${esc(c.marca)} ${esc(c.modelo)}</option>`).join("");

    $("previewConductor").hidden = true;
    $("previewCamion").hidden = true;
    $("observacion").value = "";
}

function mostrarConductorSeleccionado() {
    const c = state.conductores.find((x) => x.id === Number($("selectConductores").value));
    const p = $("previewConductor");
    p.hidden = !c;
    if (c) p.innerHTML = `<span class="avatar">${esc(iniciales(c.nombre))}</span><div><strong>${esc(c.nombre)}</strong><span class="sub">Licencia ${esc(c.licencia)}</span></div>`;
}

function mostrarCamionSeleccionado() {
    const c = state.camiones.find((x) => x.id === Number($("selectCamiones").value));
    const p = $("previewCamion");
    p.hidden = !c;
    if (c) p.innerHTML = `<span class="plate">${esc(c.placa)}</span><div><strong>${esc(c.marca)} ${esc(c.modelo)}</strong><span class="sub">Listo para asignar</span></div>`;
}

/*---------- Tabla ----------*/

function listaFiltrada() {
    const t = state.texto;
    return state.asignaciones
        .filter((a) => state.estado === "TODAS" || a.estado === state.estado)
        .filter((a) => !t || [a.conductor.nombre, a.conductor.licencia, a.camion.placa, a.camion.marca, a.camion.modelo]
            .some((v) => String(v ?? "").toLowerCase().includes(t)))
        .sort((a, b) => (b.estado === "ACTIVA") - (a.estado === "ACTIVA") ||
            (parseFecha(b.fechaAsignacion) || 0) - (parseFecha(a.fechaAsignacion) || 0));
}

function renderizarTabla() {
    const tbody = $("tbodyAsignaciones");

    if (!state.cargado) {
        tbody.innerHTML = '<tr class="skeleton"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'.repeat(4);
        $("paginacion").innerHTML = "";
        return;
    }

    actualizarContadores();
    const lista = listaFiltrada();
    const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    state.pagina = Math.min(state.pagina, paginas);
    const inicio = (state.pagina - 1) * POR_PAGINA;
    const visibles = lista.slice(inicio, inicio + POR_PAGINA);

    if (!visibles.length) {
        const hayFiltro = state.texto || state.estado !== "TODAS";
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7"><div class="empty">
			<i class="fa-solid fa-truck-ramp-box"></i>
			<h3>${hayFiltro ? "Sin resultados" : "Aún no hay asignaciones"}</h3>
			<p>${hayFiltro ? "Prueba con otra búsqueda o cambia el filtro." : "Crea la primera con «Nueva asignación»."}</p></div></td></tr>`;
        $("paginacion").innerHTML = "";
        return;
    }

    tbody.innerHTML = visibles.map((a) => `
		<tr>
			<td class="cell-person">
				<div class="person">
					<span class="avatar">${esc(iniciales(a.conductor.nombre))}</span>
					<div><strong>${esc(a.conductor.nombre)}</strong><span class="sub">Licencia ${esc(a.conductor.licencia)}</span></div>
				</div>
			</td>
			<td data-label="Camión">
				<div><span class="plate">${esc(a.camion.placa)}</span><span class="sub">${esc(a.camion.marca)} ${esc(a.camion.modelo)}</span></div>
			</td>
			<td data-label="Asignado el">${formatearFecha(a.fechaAsignacion)}</td>
			<td data-label="Finalizó el">${a.fechaFinalizacion ? formatearFecha(a.fechaFinalizacion) : '<span class="muted">En curso</span>'}</td>
			<td data-label="Duración">${duracion(a)}</td>
			<td data-label="Estado">${crearBadgeEstado(a.estado)}</td>
			<td class="cell-actions">
				<div class="row-actions">
					<button class="icon-btn" type="button" title="Ver detalle" aria-label="Ver detalle" data-action="ver" data-id="${a.id}"><i class="fa-solid fa-eye"></i></button>
					${a.estado === "ACTIVA" ? `<button class="icon-btn finish" type="button" title="Finalizar asignación" aria-label="Finalizar asignación" data-action="finalizar" data-id="${a.id}"><i class="fa-solid fa-flag-checkered"></i></button>` : ""}
					<button class="icon-btn delete" type="button" title="Eliminar" aria-label="Eliminar asignación" data-action="eliminar" data-id="${a.id}"><i class="fa-solid fa-trash"></i></button>
				</div>
			</td>
		</tr>`).join("");

    renderizarPaginacion(lista.length, inicio, visibles.length, paginas);
}

function renderizarPaginacion(total, inicio, cantidad, paginas) {
    if (paginas <= 1) {
        $("paginacion").innerHTML = `<span class="pager-info">${total} ${total === 1 ? "registro" : "registros"}</span>`;
        return;
    }
    const num = [];
    for (let i = 1;i <= paginas;i++) {
        if (i === 1 || i === paginas || Math.abs(i - state.pagina) <= 1) num.push(i);
        else if (num[num.length - 1] !== "…") num.push("…");
    }
    $("paginacion").innerHTML = `
		<span class="pager-info">Mostrando ${inicio + 1}–${inicio + cantidad} de ${total}</span>
		<div class="pager-btns">
			<button class="pg" data-pagina="${state.pagina - 1}" ${state.pagina === 1 ? "disabled" : ""} aria-label="Página anterior"><i class="fa-solid fa-chevron-left"></i></button>
			${num.map((n) => n === "…" ? '<span class="pg" style="border:0;line-height:34px;text-align:center">…</span>'
        : `<button class="pg ${n === state.pagina ? "active" : ""}" data-pagina="${n}">${n}</button>`).join("")}
			<button class="pg" data-pagina="${state.pagina + 1}" ${state.pagina === paginas ? "disabled" : ""} aria-label="Página siguiente"><i class="fa-solid fa-chevron-right"></i></button>
		</div>`;
}

function crearBadgeEstado(estado) {
    const mapa = { ACTIVA: ["badge-activa", "En ruta"], FINALIZADA: ["badge-finalizada", "Finalizada"], PENDIENTE: ["badge-pendiente", "Pendiente"] };
    const [clase, texto] = mapa[estado] || ["badge-pendiente", estado];
    return `<span class="badge ${clase}">${esc(texto)}</span>`;
}

function actualizarContadores() {
    const activas = state.asignaciones.filter((a) => a.estado === "ACTIVA").length;
    const fin = state.asignaciones.filter((a) => a.estado === "FINALIZADA").length;
    $("cntTodas").textContent = state.asignaciones.length;
    $("cntActivas").textContent = activas;
    $("cntFinalizadas").textContent = fin;
}

/*---------- Tarjetas de resumen ----------*/

function actualizarTarjetas() {
    const activas = state.asignaciones.filter((a) => a.estado === "ACTIVA").length;
    const finalizadas = state.asignaciones.filter((a) => a.estado === "FINALIZADA").length;
    const flota = activas + state.camiones.length;
    const uso = flota ? Math.round((activas / flota) * 100) : 0;

    $("totalDisponibles").textContent = state.camiones.length;
    $("totalAsignados").textContent = activas;
    $("totalConductores").textContent = state.conductoresLibres.length;
    $("totalFinalizadas").textContent = finalizadas;
    $("fleetTexto").textContent = `${activas} de ${flota} camiones asignados (${uso}%)`;
    $("fleetFill").style.width = uso + "%";
    $("fleetBar").setAttribute("aria-valuenow", uso);
}

/*---------- Acciones ----------*/

async function guardarAsignacion() {
    const conductorId = Number($("selectConductores").value);
    const camionId = Number($("selectCamiones").value);
    const fecha = $("fechaAsignacion").value;

    if (!conductorId || !camionId) {
        mostrarNotificacion("info", "Faltan datos", "Selecciona un conductor y un camión.");
        return;
    }
    if (!fecha) {
        mostrarNotificacion("info", "Falta la fecha", "Indica la fecha de asignación.");
        return;
    }

    const btn = $("btnGuardarAsignacion");
    btn.disabled = true;
    try {
        const r = await fetch("/asignaciones/guardar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                conductor: { id: conductorId },
                camion: { id: camionId },
                fechaAsignacion: fecha,
                observacion: $("observacion").value.trim()
            })
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
        cerrarModales();
        mostrarNotificacion("success", "Asignación creada", "El camión quedó asignado al conductor.");
        await cargarDatosIniciales();
    } catch (e) {
        console.error(e);
        mostrarNotificacion("error", "No se pudo guardar", "Intenta de nuevo en unos segundos.");
    } finally {
        btn.disabled = false;
    }
}

async function finalizarAsignacion(id) {
    const ok = await confirmar({
        titulo: "¿Finalizar asignación?",
        texto: "El camión volverá a estar disponible y el conductor quedará libre.",
        boton: "Finalizar"
    });
    if (!ok) return;
    try {
        const r = await fetch(`/asignaciones/finalizar/${id}`, { method: "PUT" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        mostrarNotificacion("success", "Asignación finalizada");
        await cargarDatosIniciales();
    } catch (e) {
        console.error(e);
        mostrarNotificacion("error", "No se pudo finalizar", "Revisa la conexión e intenta de nuevo.");
    }
}

async function eliminarAsignacion(id) {
    const ok = await confirmar({
        titulo: "¿Eliminar asignación?",
        texto: "Se borrará del historial y no se puede deshacer.",
        boton: "Eliminar",
        peligro: true
    });
    if (!ok) return;
    try {
        const r = await fetch(`/asignaciones/eliminar/${id}`, { method: "DELETE" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        mostrarNotificacion("success", "Asignación eliminada");
        await cargarDatosIniciales();
    } catch (e) {
        console.error(e);
        mostrarNotificacion("error", "No se pudo eliminar", "Revisa la conexión e intenta de nuevo.");
    }
}

function verDetalle(id) {
    const a = state.asignaciones.find((x) => x.id === id);
    if (!a) return;
    $("detalleConductor").textContent = `${a.conductor.nombre} · Licencia ${a.conductor.licencia ?? "—"}`;
    $("detalleCamion").textContent = `${a.camion.placa} · ${a.camion.marca ?? ""} ${a.camion.modelo ?? ""}`.trim();
    $("detalleFecha").textContent = formatearFecha(a.fechaAsignacion);
    $("detalleFin").textContent = a.fechaFinalizacion ? formatearFecha(a.fechaFinalizacion) : "En curso";
    $("detalleDuracion").textContent = duracion(a);
    $("detalleEstado").innerHTML = crearBadgeEstado(a.estado);
    $("detalleObservacion").textContent = a.observacion || "Sin observaciones";
    abrirModal("modalDetalle");
}