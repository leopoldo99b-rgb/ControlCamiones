/* =========================================================
 * DESTINOS.JS  (lógica principal)
 * Los reportes PDF y Excel viven en Destinos-export.js
 * ========================================================= */

const URL_CONDUCTORES = "/viajes2/conductores";
const URL_DESTINOS = "/api/destinos";
const URL_RECORRIDOS = "/api/recorridos";
const URL_FURGONES = "/api/furgones";

const ISV_PORCENTAJE = 0.15;
const PEAJE_POR_EJES = { "2": 224, "3": 269 };
let porPagina = 10;
const KEY_BANDA = "banda_vigente";

let recorridosBD = [];          // lo usan también los reportes
let paginaActual = 1;
let editandoId = null;
let eliminarId = null;
let filtros = { texto: "", desde: "", hasta: "" };
let banda = { valor: "", semana: "", bloqueada: false };

const $ = id => document.getElementById(id);
const num = v => parseFloat(v) || 0;
const fmtNum = v => num(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMon = v => "L " + fmtNum(v);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isoFecha = f => String(f || "").slice(0, 10);
const fechaTabla = f => { const p = isoFecha(f).split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ""; };
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const modal = id => bootstrap.Modal.getOrCreateInstance($(id));

function lunesActual() {
    const d = new Date(); d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function aviso(msg, tipo = "success") {
    const t = $("toastApp");
    t.className = `toast align-items-center border-0 text-bg-${tipo}`;
    $("toastMsg").textContent = msg;
    bootstrap.Toast.getOrCreateInstance(t, { delay: 3500 }).show();
}

async function pedirJSON(url, opts) {
    const r = await fetch(url, opts);
    const txt = await r.text();
    if (!r.ok) {
        let m = txt || `HTTP ${r.status}`;
        try { const j = JSON.parse(txt); m = j.message || j.error || j.mensaje || m; } catch (e) {}
        throw new Error(m);
    }
    try { return txt ? JSON.parse(txt) : null; } catch (e) { return null; }
}

/* ---------- INICIO ---------- */
document.addEventListener("DOMContentLoaded", () => {
    $("fecha").value = hoyISO();
    cargarBanda();
    eventos();
    Promise.all([cargarMotoristas(), cargarDestinos(), cargarFurgones()]);
    cargarRecorridos();
    calcular();
});

function eventos() {
    $("ruta").addEventListener("change", cambiarRuta);
    $("furgon").addEventListener("change", () => {
        $("ejesCamion").value = $("furgon").selectedOptions[0]?.dataset.ejes || "";
        calcular();
    });
    $("bandaPorKm").addEventListener("input", () => {
        if (editandoId === null) { banda.valor = $("bandaPorKm").value; banda.semana = lunesActual(); guardarBanda(); avisoBanda(false); }
        calcular();
    });
    $("btnLockBanda").addEventListener("click", () => { banda.bloqueada = !banda.bloqueada; guardarBanda(); pintarBloqueo(); });
    $("btnBandaVigente").addEventListener("click", () => { banda.semana = lunesActual(); guardarBanda(); avisoBanda(false); });
    $("btnCancelar").addEventListener("click", limpiarFormulario);
    $("formViaje").addEventListener("submit", e => { e.preventDefault(); guardar(); });

    $("btnNuevoFurgon").addEventListener("click", () => {
        $("nuevoFurgon").value = ""; $("nuevoEjes").value = ""; $("mensajeNuevoFurgon").classList.add("d-none");
        modal("modalNuevoFurgon").show();
    });
    $("btnGuardarFurgon").addEventListener("click", guardarFurgon);
    $("btnConfirmarEliminar").addEventListener("click", eliminar);
    $("porPagina").addEventListener("change", e => { porPagina = parseInt(e.target.value) || 10; paginaActual = 1; render(); });

    $("buscadorViajes").addEventListener("input", e => { filtros.texto = e.target.value.trim().toLowerCase(); paginaActual = 1; render(); });
    $("btnAplicarFiltros").addEventListener("click", () => {
        const d = $("fechaDesde").value, h = $("fechaHasta").value;
        if (d && h && d > h) return aviso("La fecha 'Desde' no puede ser posterior a 'Hasta'.", "danger");
        filtros.desde = d; filtros.hasta = h; paginaActual = 1; render();
    });
    $("btnLimpiarFiltros").addEventListener("click", () => {
        $("buscadorViajes").value = ""; $("fechaDesde").value = ""; $("fechaHasta").value = "";
        filtros = { texto: "", desde: "", hasta: "" }; paginaActual = 1; render();
    });
}

/* ---------- BANDA SEMANAL (se recuerda entre viajes) ---------- */
function cargarBanda() {
    try { const b = JSON.parse(localStorage.getItem(KEY_BANDA)); if (b) banda = b; } catch (e) {}
    $("bandaPorKm").value = banda.valor;
    pintarBloqueo();
    avisoBanda(banda.valor !== "" && banda.semana && banda.semana !== lunesActual());
}
function guardarBanda() { try { localStorage.setItem(KEY_BANDA, JSON.stringify(banda)); } catch (e) {} }
function avisoBanda(mostrar) { $("avisoBanda").classList.toggle("d-none", !mostrar); }
function pintarBloqueo() {
    const bloq = banda.bloqueada && editandoId === null;
    $("bandaPorKm").readOnly = bloq;
    $("btnLockBanda").classList.toggle("locked", banda.bloqueada);
    $("btnLockBanda").innerHTML = `<i class="bi bi-${banda.bloqueada ? "lock-fill" : "unlock"}"></i>`;
    $("bandaHelp").textContent = banda.bloqueada ? "Banda fija: se aplica a todos los viajes nuevos." : "Se recuerda para todos los viajes nuevos.";
}

/* ---------- CARGA DE LISTAS ---------- */
function llenar(select, placeholder, items, fn) {
    select.innerHTML = `<option value="" selected disabled>${items.length ? placeholder : "No hay datos disponibles"}</option>`;
    items.forEach(it => { const o = document.createElement("option"); fn(o, it); select.appendChild(o); });
}
async function cargarMotoristas() {
    try {
        const lista = await pedirJSON(URL_CONDUCTORES, { headers: { Accept: "application/json" } }) || [];
        llenar($("motorista"), "Seleccionar motorista", lista, (o, m) => {
            o.value = o.textContent = `${m.nombre || ""} ${m.apellido || ""}`.trim() || "Sin nombre";
        });
    } catch (e) { $("motorista").innerHTML = `<option value="" disabled selected>Error al cargar motoristas</option>`; }
}
async function cargarDestinos() {
    try {
        const lista = await pedirJSON(URL_DESTINOS, { headers: { Accept: "application/json" } }) || [];
        llenar($("ruta"), "Seleccionar ruta", lista, (o, d) => {
            o.value = o.textContent = d.destino ?? d.nombre ?? "";
            o.dataset.km = d.km ?? d.kilometros ?? 0;
            o.dataset.peajes = d.peajes ?? d.cantidadPeajes ?? 0;
        });
    } catch (e) { $("ruta").innerHTML = `<option value="" disabled selected>Error al cargar destinos</option>`; }
}
async function cargarFurgones() {
    try {
        const lista = (await pedirJSON(URL_FURGONES, { headers: { Accept: "application/json" }, cache: "no-cache" }) || []).filter(f => f && f.furgon);
        llenar($("furgon"), "Seleccione furgón", lista, (o, f) => { o.value = o.textContent = String(f.furgon).trim(); o.dataset.ejes = f.ejes ?? ""; });
    } catch (e) { $("furgon").innerHTML = `<option value="" disabled selected>Error al cargar furgones</option>`; }
}

async function guardarFurgon() {
    const msg = $("mensajeNuevoFurgon"), furgon = $("nuevoFurgon").value.trim().toUpperCase(), ejes = $("nuevoEjes").value;
    const error = t => { msg.textContent = t; msg.classList.remove("d-none"); };
    if (!furgon) return error("Escribe la placa o código del furgón.");
    if (!ejes) return error("Selecciona la cantidad de ejes.");
    const btn = $("btnGuardarFurgon"); btn.disabled = true;
    try {
        const nuevo = await pedirJSON(URL_FURGONES, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ furgon, ejes: Number(ejes) }) });
        await cargarFurgones();
        $("furgon").value = nuevo?.furgon || furgon;
        $("ejesCamion").value = $("furgon").selectedOptions[0]?.dataset.ejes || ejes;
        calcular(); modal("modalNuevoFurgon").hide();
        aviso(`Furgón ${furgon} registrado.`);
    } catch (e) { error(e.message); } finally { btn.disabled = false; }
}

/* ---------- RUTA Y CÁLCULOS ---------- */
function cambiarRuta() {
    const o = $("ruta").selectedOptions[0];
    $("kmRecorridos").value = num(o?.dataset.km).toFixed(2);
    $("cantidadPeajes").value = parseInt(o?.dataset.peajes) || 0;
    calcular();
}

function calcular() {
    const km = num($("kmRecorridos").value), b = num($("bandaPorKm").value);
    const sub = km * b, isv = sub * ISV_PORCENTAJE, tar = sub + isv;
    const cant = parseInt($("cantidadPeajes").value) || 0;
    const ejes = String($("ejesCamion").value).trim();
    const vp = PEAJE_POR_EJES[ejes] || 0, tot = cant * vp;
    $("subtotal").value = sub.toFixed(2); $("isv").value = isv.toFixed(2); $("tarifa").value = tar.toFixed(2);
    $("valorPeaje").value = vp.toFixed(2); $("totalPeajes").value = tot.toFixed(2);
    $("subtotalTexto").textContent = fmtMon(sub); $("isvTexto").textContent = fmtMon(isv);
    $("tarifaTexto").textContent = fmtMon(tar); $("totalPeajesTexto").textContent = fmtMon(tot);
    $("resumenBanda").textContent = `${fmtMon(b)} / km`;
    document.querySelectorAll(".toll-option").forEach(el => el.classList.toggle("active", el.dataset.ejes === ejes));
}

/* ---------- FORMULARIO ---------- */
function datosForm() {
    return {
        fecha: $("fecha").value || null,
        motorista: $("motorista").value || null,
        furgon: $("furgon").value || null,
        ejesCamion: parseInt($("ejesCamion").value) || null,
        rutaDestino: $("ruta").value || null,
        kmRecorridos: num($("kmRecorridos").value),
        remision: $("remision").value.trim(),
        bandaPorKm: num($("bandaPorKm").value),
        cantidadPeajes: parseInt($("cantidadPeajes").value) || 0,
        subtotal: num($("subtotal").value), isv: num($("isv").value), tarifa: num($("tarifa").value),
        valorPeaje: num($("valorPeaje").value), totalPeajes: num($("totalPeajes").value)
    };
}

function validar() {
    const reglas = [
        ["fecha", !$("fecha").value, "Selecciona la fecha."],
        ["motorista", !$("motorista").value, "Selecciona un motorista."],
        ["furgon", !$("furgon").value, "Selecciona el furgón."],
        ["ruta", !$("ruta").value, "Selecciona una ruta o destino."],
        ["bandaPorKm", num($("bandaPorKm").value) <= 0, "Ingresa una banda por KM mayor que 0."]
    ];
    document.querySelectorAll(".is-bad").forEach(e => e.classList.remove("is-bad"));
    const fallo = reglas.find(r => r[1]);
    if (!fallo) return true;
    $(fallo[0]).classList.add("is-bad"); $(fallo[0]).focus(); aviso(fallo[2], "danger");
    return false;
}

async function guardar() {
    if (!validar()) return;
    calcular();
    const btn = $("btnGuardar"), id = editandoId;
    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    try {
        await pedirJSON(id ? `${URL_RECORRIDOS}/${encodeURIComponent(id)}` : URL_RECORRIDOS, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(datosForm())
        });
        limpiarFormulario(true);
        await cargarRecorridos();
        aviso(id ? "Recorrido actualizado." : "Recorrido guardado.");
    } catch (e) { aviso("No se pudo guardar: " + e.message, "danger"); }
    finally { btn.disabled = false; btn.innerHTML = `<i class="bi bi-check2-circle me-2"></i>${editandoId !== null ? "Actualizar" : "Guardar"} recorrido`; }
}

function limpiarFormulario(mantenerFecha = false) {
    const fecha = $("fecha").value;
    editandoId = null;
    $("formViaje").reset();
    $("fecha").value = mantenerFecha === true && fecha ? fecha : hoyISO();
    $("bandaPorKm").value = banda.valor;            // la banda NO se reinicia
    ["motorista", "furgon", "ruta"].forEach(i => { $(i).selectedIndex = 0; $(i).classList.remove("is-bad"); });
    $("ejesCamion").value = ""; $("kmRecorridos").value = "0.00"; $("cantidadPeajes").value = "0";
    $("bannerEdicion").classList.add("d-none");
    $("btnGuardar").innerHTML = '<i class="bi bi-check2-circle me-2"></i>Guardar recorrido';
    pintarBloqueo(); calcular();
}

/* ---------- EDITAR / ELIMINAR / DETALLE ---------- */
const buscarRec = id => recorridosBD.find(r => String(r.id) === String(id));

function editar(id) {
    const r = buscarRec(id); if (!r) return aviso("No se encontró el recorrido.", "danger");
    editandoId = id;
    $("fecha").value = isoFecha(r.fecha);
    $("motorista").value = r.motorista; $("furgon").value = r.furgon || "";
    if (!$("furgon").value) $("furgon").selectedIndex = 0;
    $("ejesCamion").value = r.ejesCamion ?? "";
    $("ruta").value = r.rutaDestino;
    $("kmRecorridos").value = num(r.kmRecorridos).toFixed(2);
    $("cantidadPeajes").value = parseInt(r.cantidadPeajes) || 0;
    $("remision").value = r.remision ?? "";
    $("bandaPorKm").value = num(r.bandaPorKm).toFixed(2);
    $("bannerEdicion").classList.remove("d-none");
    $("btnGuardar").innerHTML = '<i class="bi bi-check2-circle me-2"></i>Actualizar recorrido';
    pintarBloqueo(); calcular();
    $("formViaje").scrollIntoView({ behavior: "smooth", block: "start" });
}

function pedirEliminar(id) { eliminarId = id; modal("modalEliminar").show(); }
async function eliminar() {
    if (eliminarId === null) return;
    const id = eliminarId, btn = $("btnConfirmarEliminar"); btn.disabled = true;
    try {
        await pedirJSON(`${URL_RECORRIDOS}/${encodeURIComponent(id)}`, { method: "DELETE" });
        modal("modalEliminar").hide();
        if (String(editandoId) === String(id)) limpiarFormulario();
        eliminarId = null; await cargarRecorridos(); aviso("Recorrido eliminado.");
    } catch (e) { modal("modalEliminar").hide(); aviso("No se pudo eliminar: " + e.message, "danger"); }
    finally { btn.disabled = false; }
}

function verDetalle(id) {
    const r = buscarRec(id); if (!r) return;
    $("detalleFurgon").textContent = r.furgon || "Sin furgón registrado";
    const filas = [
        ["Fecha", fechaTabla(r.fecha)], ["Motorista", r.motorista], ["Ejes", r.ejesCamion ?? "—"],
        ["Ruta / destino", r.rutaDestino], ["Remisión", r.remision || "—"], ["Kilómetros", fmtNum(r.kmRecorridos)],
        ["Banda por KM", fmtMon(r.bandaPorKm)], ["Tarifa", fmtMon(r.tarifa)],
        ["Peajes", `${r.cantidadPeajes || 0} × ${fmtMon(r.valorPeaje)} = ${fmtMon(r.totalPeajes)}`]
    ];
    $("detalleBody").innerHTML = filas.map(([k, v]) => `<div class="d-row"><span>${k}</span><strong>${esc(v)}</strong></div>`).join("");
    modal("modalDetalle").show();
}

/* ---------- TABLA ---------- */
async function cargarRecorridos() {
    try { const d = await pedirJSON(URL_RECORRIDOS, { headers: { Accept: "application/json" } }); recorridosBD = Array.isArray(d) ? d : []; }
    catch (e) { recorridosBD = []; aviso("No se pudieron cargar los recorridos.", "danger"); }
    render();
}

/* La búsqueda también encuentra por furgón, aunque la tabla no lo muestre. */
function construirTextoBusqueda(r) {
    return [r.id, fechaTabla(r.fecha), r.fecha, r.motorista, r.furgon, r.rutaDestino, r.remision, r.kmRecorridos, r.bandaPorKm,
    r.cantidadPeajes, r.ejesCamion, r.subtotal, r.isv, r.tarifa, r.valorPeaje, r.totalPeajes]
        .filter(v => v !== null && v !== undefined).join(" ").toLowerCase();
}

function filtrados() {
    return recorridosBD.filter(r => {
        const f = isoFecha(r.fecha);
        if (filtros.texto && !construirTextoBusqueda(r).includes(filtros.texto)) return false;
        if (filtros.desde && f < filtros.desde) return false;
        if (filtros.hasta && f > filtros.hasta) return false;
        return true;
    });
}

function fila(r) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${fechaTabla(r.fecha)}</td><td><strong>${esc(r.motorista)}</strong></td><td>${esc(r.rutaDestino)}</td><td>${esc(r.remision)}</td>
        <td>${fmtNum(r.kmRecorridos)}</td><td>${fmtMon(r.subtotal)}</td><td>${fmtMon(r.isv)}</td><td>${fmtMon(r.tarifa)}</td>
        <td><span class="toll-count">${parseInt(r.cantidadPeajes) || 0}</span></td><td>${fmtMon(r.valorPeaje)}</td><td class="total-cell">${fmtMon(r.totalPeajes)}</td>
        <td><div class="d-flex gap-1">
          <button type="button" class="btn btn-sm btn-outline-dark" data-act="ver" title="Ver detalle y furgón"><i class="bi bi-eye"></i></button>
          <button type="button" class="btn btn-sm btn-outline-primary" data-act="edit" title="Editar"><i class="bi bi-pencil"></i></button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-act="del" title="Eliminar"><i class="bi bi-trash"></i></button></div></td>`;
    const acciones = { ver: verDetalle, edit: editar, del: pedirEliminar };
    tr.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => acciones[b.dataset.act](r.id)));
    return tr;
}

function render() {
    const lista = filtrados(), total = lista.length;
    const paginas = Math.max(1, Math.ceil(total / porPagina));
    paginaActual = Math.min(Math.max(1, paginaActual), paginas);
    const inicio = (paginaActual - 1) * porPagina;
    const pagina = lista.slice(inicio, inicio + porPagina);
    const tb = $("tablaViajesBody"); tb.innerHTML = "";
    if (!total) tb.innerHTML = `<tr><td colspan="12" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-2 d-block mb-2"></i>No hay recorridos para mostrar.</td></tr>`;
    pagina.forEach(r => tb.appendChild(fila(r)));
    $("registrosMostrados").textContent = total ? `${inicio + 1}–${inicio + pagina.length}` : "0"; $("registrosTotales").textContent = total;
    totales(lista); paginar(paginas);
}

function totales(lista) {
    const s = k => lista.reduce((a, r) => a + num(r[k]), 0);
    const km = s("kmRecorridos"), sub = s("subtotal"), pea = s("totalPeajes");
    $("totalKmTabla").textContent = fmtNum(km); $("totalSubtotalTabla").textContent = fmtMon(sub);
    $("totalIsvTabla").textContent = fmtMon(s("isv")); $("totalTarifaTabla").textContent = fmtMon(s("tarifa")); $("totalPeajesTabla").textContent = fmtMon(pea);
    $("resumenKm").textContent = `${fmtNum(km)} km`; $("resumenSubtotal").textContent = fmtMon(sub); $("resumenPeajes").textContent = fmtMon(pea);
}

/* Paginación compacta: 1 … 4 5 6 … 20  (nunca se desborda) */
function paginar(total) {
    const ul = $("paginacionViajes"); ul.innerHTML = "";
    if (total <= 1) return;
    const add = (label, p, { dis = false, act = false, aria = "" } = {}) => {
        const li = document.createElement("li");
        li.className = `page-item${dis ? " disabled" : ""}${act ? " active" : ""}`;
        li.innerHTML = `<button type="button" class="page-link"${aria ? ` aria-label="${aria}"` : ""}>${label}</button>`;
        if (!dis) li.firstChild.addEventListener("click", () => { paginaActual = p; render(); });
        ul.appendChild(li);
    };
    add('<i class="bi bi-chevron-left"></i>', paginaActual - 1, { dis: paginaActual === 1, aria: "Anterior" });
    const set = new Set([1, total, paginaActual - 1, paginaActual, paginaActual + 1]);
    if (paginaActual <= 3) { set.add(2); set.add(3); }
    if (paginaActual >= total - 2) { set.add(total - 1); set.add(total - 2); }
    let prev = 0;
    [...set].filter(p => p >= 1 && p <= total).sort((a, b) => a - b).forEach(p => {
        if (p - prev === 2) add(prev + 1, prev + 1);
        else if (p - prev > 2) add("…", 0, { dis: true });
        add(p, p, { act: p === paginaActual });
        prev = p;
    });
    add('<i class="bi bi-chevron-right"></i>', paginaActual + 1, { dis: paginaActual === total, aria: "Siguiente" });
}