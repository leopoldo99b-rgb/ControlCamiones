/* ===== CONFIGURACIÓN (debe coincidir con application.properties) ===== */
const CFG = { intervaloMs: 30000, velParadaKmh: 5, paradaMinMin: 5, radioDefecto: 100, sinSenalMin: 15, sinSenalApagadoMin: 360 };
/* sinSenalMin: minutos sin reporte para marcar "Sin señal" una unidad con el motor encendido.
   sinSenalApagadoMin: igual, pero con el motor apagado (reporta poco: se marca "Apagada" y solo pasa a "Sin señal" tras este tiempo). */
/* Rutas alineadas con MonitoreoViajeController (/api/viajes, /api/paradas) y PuntoPlantaController */
const RUTAS = { gps: '/gps/vehiculos', puntos: '/api/puntos-planta', viajes: '/api/viajes', paradas: '/api/paradas' };

/* ===== CAPA DE DATOS: habla con el backend (Spring Boot) ===== */
/* Spring Security: si CSRF está activo, el token viaja en la cookie XSRF-TOKEN o en <meta name="_csrf"> */
function csrf() {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    if (m) return ['X-XSRF-TOKEN', decodeURIComponent(m[1])];
    const t = document.querySelector('meta[name="_csrf"]'), hd = document.querySelector('meta[name="_csrf_header"]');
    return t ? [hd ? hd.content : 'X-CSRF-TOKEN', t.content] : null;
}
async function http(url, metodo = 'GET', cuerpo) {
    const h = { 'Content-Type': 'application/json' };
    if (metodo !== 'GET') { const c = csrf(); if (c) h[c[0]] = c[1] }
    const r = await fetch(url, { method: metodo, headers: h, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    const txt = await r.text();
    let j = null; try { j = txt ? JSON.parse(txt) : null } catch (e) {}
    if (!r.ok) throw new Error(r.status === 403 && !(j && (j.message || j.detail)) ? 'El servidor rechazó la solicitud (403). Revisa tu sesión o la configuración CSRF.' : (j && (j.message || j.detail)) || (j === null && txt && txt.length < 200 && txt[0] !== '<' ? txt : '') || (j && j.error) || 'Error HTTP ' + r.status);
    return j;
}
/* Adaptadores: convierten los DTO del backend a lo que usa la vista. Si tus records se llaman distinto, se ajusta SOLO aquí. */
const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, '_');
/* El backend manda LocalDateTime SIN zona y ya en hora de Honduras (UTC-6, sin horario de verano).
   Se interpreta siempre así, sin importar la zona del navegador. */
const ZONA_HN = 'America/Tegucigalpa';
const ms = t => {
    if (!t) return null;
    let n;
    if (Array.isArray(t)) n = Date.UTC(t[0], t[1] - 1, t[2], (t[3] || 0) + 6, t[4] || 0, t[5] || 0);
    else {
        let s = String(t).trim().replace(' ', 'T');
        if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) s += '-06:00';
        n = new Date(s).getTime();
    }
    return isFinite(n) ? n : null;
};
/* Hora de VTracker (Tracker_Datetime): llega sin zona. VTracker la envía en hora de Honduras (UTC-6). */
const GPS_SUFIJO_ZONA = '-06:00';
const fechaGps = f => {
    if (f == null || f === '') return NaN;
    if (typeof f === 'number') return f < 1e12 ? f * 1000 : f;
    let s = String(f).trim().replace(' ', 'T');
    if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) s += GPS_SUFIJO_ZONA;
    return new Date(s).getTime();
};
const aPunto = p => ({ id: p.id, nombre: p.nombre, tipo: String(p.tipo).toLowerCase(), lat: +(p.latitud ?? p.lat), lng: +(p.longitud ?? p.lng), radio: +(p.radioMetros ?? p.radio) || CFG.radioDefecto });
/* ParadaResponse envía "inicio" y "fin" (se aceptan también fechaHoraInicio/fechaHoraFin por compatibilidad) */
const aParada = p => ({ id: p.idParada, desde: ms(p.inicio ?? p.fechaHoraInicio), hasta: ms(p.fin ?? p.fechaHoraFin), lat: +p.latitud, lng: +p.longitud, motivo: p.motivo || '', lugar: p.observaciones || '', numero: p.numeroParada ?? null, fase: p.fase || null });
const aViaje = v => ({ id: v.idViaje, vehiculo: String(v.idVehiculoGps), etiqueta: v.conductorUnidad || '', origen: v.origen, destino: v.destino, inicio: ms(v.fechaInicio), fin: ms(v.fechaFin), llegada: ms(v.fechaLlegadaDestino), salidaDest: ms(v.fechaSalidaDestino), estado: slug(v.estado), nParadas: +(v.totalParadas ?? v.numeroParadas ?? v.paradas ?? 0) || 0, ruta: [], paradas: [] });
const API = {
    puntos: async () => (await http(RUTAS.puntos)).map(aPunto),
    crearPunto: p => http(RUTAS.puntos, 'POST', p),
    borrarPunto: id => http(`${RUTAS.puntos}/${id}`, 'DELETE'),
    viajes: async () => (await http(RUTAS.viajes)).map(aViaje),
    detalle: async id => { const r = await http(`${RUTAS.viajes}/${id}/ruta`); return { ...aViaje(r.viaje), ruta: (r.recorrido || r.puntos || []).map(x => [+x.latitud, +x.longitud, ms(x.fechaHora), x.fase || null]), paradas: (r.paradas || []).map(aParada) } },
    crearViaje: b => http(RUTAS.viajes, 'POST', b),
    finalizar: id => http(`${RUTAS.viajes}/${id}/finalizar`, 'POST'),
    borrarViaje: id => http(`${RUTAS.viajes}/${id}`, 'DELETE'),
    motivo: (id, motivo) => http(`${RUTAS.paradas}/${id}/motivo`, 'PUT', { motivo })
};
let db = { puntos: [], viajes: [] }, flota = [], tab = 'mon', selViaje = null, pick = false, filtro = 'todas', busca = '', primera = true;

/* ===== GPS: ajusta aquí los nombres de campo de VTracker ===== */
const num = x => { const n = typeof x === 'string' ? parseFloat(x.replace(',', '.')) : +x; return isFinite(n) ? n : NaN };
function normalizar(raw) {
    const lista = Array.isArray(raw) ? raw : Object.values(raw || {}).find(Array.isArray) || [];
    if (lista[0] && !window._gpsLog) { window._gpsLog = 1; console.log('Ejemplo de unidad VTracker:', lista[0]) }
    const out = lista.map(v => {
        const pos = v.position || v.location || v.ubicacion || v.coords || {};
        const f = v.Tracker_Datetime ?? v.date ?? v.timestamp ?? v.lastUpdate ?? v.time ?? v.fecha;
        const t = fechaGps(f);
        return {
            id: String(v.Vehicle_ID ?? v.id ?? v.vehicleId ?? v.vehicle_id ?? v.plate ?? v.name ?? ''),
            nombre: String(v.Vehicle_Name ?? v.name ?? v.alias ?? v.plate ?? v.label ?? v.id ?? 'Unidad'),
            placa: String(v.Vehicle_Plate ?? v.plate ?? v.placa ?? ''),
            lat: num(v.Tracker_Latitude ?? v.lat ?? v.latitude ?? v.latitud ?? v.y ?? pos.lat ?? pos.latitude ?? pos.latitud),
            lng: num(v.Tracker_Longitude ?? v.lng ?? v.lon ?? v.longitude ?? v.longitud ?? v.x ?? pos.lng ?? pos.lon ?? pos.longitude ?? pos.longitud),
            vel: num(v.Tracker_Speed ?? v.speed ?? v.velocidad ?? 0) || 0, fecha: isFinite(t) ? t : null,
            ign: v.Tracker_Ignition == null ? null : +v.Tracker_Ignition > 0 /* true = motor encendido, false = apagado, null = no informa */
        };
    }).filter(u => u.id && isFinite(u.lat) && isFinite(u.lng) && !(u.lat === 0 && u.lng === 0));
    normalizar.descartadas = lista.length - out.length;
    if (lista.length && !out.length) console.warn('El GPS devolvió ' + lista.length + ' unidades pero ninguna con coordenadas legibles. Campos recibidos:', Object.keys(lista[0]));
    return out;
}
function estadoU(u) {
    const edad = u.fecha ? (Date.now() - u.fecha) / 60000 : null;
    /* Motor apagado y sin movimiento: el GPS ahorra batería y reporta poco, es normal. */
    const apagada = u.ign === false && u.vel < CFG.velParadaKmh;
    if (apagada) return edad != null && edad > CFG.sinSenalApagadoMin ? 'offline' : 'apagada';
    if (edad != null && edad > CFG.sinSenalMin) return 'offline';
    return u.vel >= CFG.velParadaKmh ? 'mov' : 'det';
}
const ETQ = { mov: 'En movimiento', det: 'Detenida', apagada: 'Apagada', offline: 'Sin señal' };
/* Clase CSS: "Apagada" reutiliza el estilo de "Detenida" (no hace falta tocar el CSS). */
const claseU = e => e === 'apagada' ? 'det' : e;

/* ===== UTILIDADES ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const hora = t => t ? new Date(t).toLocaleString('es-HN', { timeZone: ZONA_HN, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const dur = (a, b) => { const m = Math.round((b - a) / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min' };
function dist(a, b, c, d) { const R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)) }
/* p.id llega como número y dataset.* siempre es texto: se comparan como texto */
const punto = id => db.puntos.find(p => String(p.id) === String(id));
const unidad = id => flota.find(u => u.id === id || u.nombre === id);
const nomU = v => unidad(v.vehiculo)?.nombre || v.vehiculo;
const pOri = v => db.puntos.find(p => p.nombre === v.origen), pDes = v => db.puntos.find(p => p.nombre === v.destino);
const paradasDe = v => v.paradaActual ? [...v.paradas, { ...v.paradaActual, hasta: null }] : v.paradas;

/* ===== MAPA ===== */
const map = L.map('map').setView([15.5, -88.03], 9);
const base = {
    'Calles': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }),
    'Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri' }),
    'Oscuro': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd', attribution: '© OpenStreetMap © CARTO' })
};
base['Calles'].addTo(map);
L.control.layers(base, null, { position: 'topright' }).addTo(map);
const capaP = L.layerGroup().addTo(map), capaF = L.layerGroup().addTo(map), capaV = L.layerGroup().addTo(map), marks = {};
const todasPuntos = () => flota.map(u => [u.lat, u.lng]).concat(db.puntos.map(p => [p.lat, p.lng]));
new (L.Control.extend({
    onAdd() {
        const b = L.DomUtil.create('button', 'btn navy sm centrar'); b.type = 'button'; b.textContent = 'Ver todas las unidades';
        L.DomEvent.disableClickPropagation(b);
        b.onclick = () => { const p = flota.map(u => [u.lat, u.lng]); if (p.length) map.fitBounds(p, { padding: [60, 60], maxZoom: 15 }); else alert('Aún no hay unidades con ubicación GPS.') };
        return b;
    }
}))({ position: 'topleft' }).addTo(map);

function pintarPuntos() {
    capaP.clearLayers();
    db.puntos.forEach(p => {
        const c = p.tipo === 'origen' ? '#1fa463' : '#e5484d';
        L.circle([p.lat, p.lng], { radius: p.radio, color: c, weight: 2, fillOpacity: .18 }).addTo(capaP);
        L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${c}"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] }) })
            .bindTooltip(esc(p.nombre), { permanent: true, direction: 'top', offset: [0, -10], className: 'ptip' }).addTo(capaP);
    });
}
const SVG_CAMION = '<svg viewBox="0 0 24 24" width="17" height="17" fill="#fff" aria-hidden="true"><path d="M2 6h12v10H2zM14 9h4.5L22 12.5V16h-8z"/><circle cx="7" cy="17.5" r="2.2" stroke="#0a1633" stroke-width="1"/><circle cx="17.5" cy="17.5" r="2.2" stroke="#0a1633" stroke-width="1"/></svg>';
function popupU(u) {
    return `<b>${esc(u.nombre)}</b>${u.placa ? '<br>' + esc(u.placa) : ''}<br>${ETQ[estadoU(u)]} · ${Math.round(u.vel)} km/h<br><span class="mut">${u.fecha ? 'Último dato: ' + hora(u.fecha) : 'Sin hora de reporte'}</span><br><span class="mut">${u.lat.toFixed(5)}, ${u.lng.toFixed(5)}</span>`;
}
function pintarFlota() {
    const vivos = new Set();
    flota.forEach(u => {
        vivos.add(u.id);
        const e = estadoU(u);
        const ic = L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="unit ${claseU(e)}"><i>${SVG_CAMION}</i><span>${esc(u.nombre)}</span></div>` });
        const z = e === 'mov' ? 1200 : 1000;
        if (marks[u.id]) marks[u.id].setLatLng([u.lat, u.lng]).setIcon(ic).setZIndexOffset(z);
        else marks[u.id] = L.marker([u.lat, u.lng], { icon: ic, zIndexOffset: z }).addTo(capaF).bindPopup(() => popupU(flota.find(x => x.id === u.id)));
    });
    Object.keys(marks).forEach(id => { if (!vivos.has(id)) { capaF.removeLayer(marks[id]); delete marks[id] } });
    if (primera && flota.length) { map.fitBounds(todasPuntos(), { padding: [60, 60], maxZoom: 14 }); primera = false }
}
/* Fase de un punto o parada. Los registros viejos no la traen: se deduce con la hora de salida del destino. */
const COLOR_IDA = '#22d3ee', COLOR_RETORNO = '#a78bfa';
const faseDe = (x, v, t) => x || (v.salidaDest && t >= v.salidaDest ? 'RETORNO' : 'IDA');

/* Parte la ruta en tramos de una misma fase (ida / retorno). */
function tramosRuta(v) {
    const tramos = [];
    v.ruta.forEach(r => {
        const f = faseDe(r[3], v, r[2]), u = tramos[tramos.length - 1];
        if (u && u.fase === f) u.pts.push([r[0], r[1]]); else tramos.push({ fase: f, pts: [[r[0], r[1]]] });
    });
    return tramos;
}
function pintarViaje(v, ajustar) {
    capaV.clearLayers(); if (!v) return;
    const pts = [];
    tramosRuta(v).forEach(t => {
        if (t.pts.length < 2) return;
        const color = t.fase === 'RETORNO' ? COLOR_RETORNO : COLOR_IDA, nombre = t.fase === 'RETORNO' ? 'Retorno' : 'Ida';
        /* contorno oscuro + línea de color: se ve igual sobre mapa claro, satélite u oscuro */
        L.polyline(t.pts, { color: '#0a1633', weight: 11, opacity: .9, lineCap: 'round', lineJoin: 'round' }).addTo(capaV);
        L.polyline(t.pts, { color, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).bindTooltip(nombre, { sticky: true }).addTo(capaV);
        t.pts.forEach(p => pts.push(p));
    });
    const flag = (p, cls, txt) => p && L.marker([p.lat, p.lng], { zIndexOffset: 500, icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="flag ${cls}">${txt}</div>` }) }).bindPopup(`<b>${esc(p.nombre)}</b>`).addTo(capaV);
    flag(pOri(v), 's', 'Salida'); flag(pDes(v), 'l', 'Destino');
    paradasDe(v).forEach((s, i) => {
        const n = s.numero ?? i + 1, fase = faseDe(s.fase, v, s.desde) === 'RETORNO' ? 'Retorno' : 'Ida';
        L.marker([s.lat, s.lng], { zIndexOffset: 700, icon: L.divIcon({ className: '', html: `<div class="n${s.hasta ? '' : ' vivo'}">${n}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }) })
            .bindPopup(`<b>Parada ${n}</b> · ${fase}<br>${esc(s.lugar || '')}<br>Paró: ${hora(s.desde)}<br>Continuó: ${s.hasta ? hora(s.hasta) : 'sigue detenido'}<br>Duración: ${dur(s.desde, s.hasta || Date.now())}`).addTo(capaV);
        pts.push([s.lat, s.lng]);
    });
    [pOri(v), pDes(v)].forEach(p => p && pts.push([p.lat, p.lng]));
    if (ajustar && pts.length) map.fitBounds(pts, { padding: [50, 50], maxZoom: 15 });
}

/* Línea de tiempo: todos los eventos ordenados por su hora real. */
function lineaTiempo(v, ps) {
    const ev = [], fin = v.estado === 'finalizado';
    const hito = (cls, tit, extra, sub) => `<li><span class="n ext ${cls}"></span><b>${tit}</b>${extra}<div class="mut">${sub}</div></li>`;
    if (v.estado === 'programado') ev.push({ t: null, o: 0, html: hito('s', 'Salida', ' · ' + esc(v.origen), 'Esperando que la unidad salga') });
    else ev.push({ t: v.inicio, o: 0, html: hito('s', 'Salida', ' · ' + esc(v.origen), hora(v.inicio)) });
    if (v.llegada) ev.push({ t: v.llegada, o: 1, html: hito('l', 'Llegada al destino', ' · ' + esc(v.destino), hora(v.llegada)) });
    else if (!fin) ev.push({ t: null, o: 1, html: hito('l', 'Llegada al destino', ' · ' + esc(v.destino), 'Pendiente') });
    if (v.salidaDest) ev.push({ t: v.salidaDest, o: 2, html: hito('s', 'Salida del destino', '', hora(v.salidaDest)) });
    else if (!fin) ev.push({ t: null, o: 2, html: hito('s', 'Salida del destino', '', 'Pendiente') });
    ps.forEach((s, i) => {
        const n = s.numero ?? i + 1, fase = faseDe(s.fase, v, s.desde) === 'RETORNO' ? 'Retorno' : 'Ida';
        ev.push({ t: s.desde, o: 5, html: `<li data-s="${i}" class="clic"><span class="n${s.hasta ? '' : ' vivo'}">${n}</span><div class="st"><b>Parada ${n}</b> <span class="mut">· ${fase}</span><div>${esc(s.lugar || 'Sin ubicación')}</div><div class="mut">Paró ${hora(s.desde)} · ${s.hasta ? 'continuó ' + hora(s.hasta) : 'sigue detenido'}</div><span class="dur">${s.hasta ? 'Duró ' + dur(s.desde, s.hasta) : 'Lleva ' + dur(s.desde, Date.now())}</span>
      <div class="row" style="margin-top:8px;grid-template-columns:1fr auto"><input data-m="${s.id}" maxlength="300" placeholder="Motivo de la parada" value="${esc(s.motivo)}"><button class="btn sm navy" data-ms="${s.id}">Guardar</button></div></div></li>` });
    });
    if (v.fin) ev.push({ t: v.fin, o: 9, html: hito('s', 'Regreso al origen', ' · ' + esc(v.origen), hora(v.fin)) });
    else ev.push({ t: null, o: 9, html: hito('s', 'Regreso al origen', ' · ' + esc(v.origen), 'Pendiente') });
    const conHora = ev.filter(e => e.t != null).sort((a, b) => a.t - b.t || a.o - b.o);
    const pend = ev.filter(e => e.t == null).sort((a, b) => a.o - b.o);
    const vacio = ps.length ? '' : `<li class="vacio mut">Sin paradas registradas (se guardan las de ${CFG.paradaMinMin} min o más).</li>`;
    return [...conHora.filter(e => e.o !== 9), ...pend.filter(e => e.o !== 9), vacio, ...conHora.concat(pend).filter(e => e.o === 9)].map(e => e.html ?? e).join('');
}

/* ===== REFRESCO: el monitoreo lo hace el backend (MonitoreoAutomaticoService); aquí solo se lee ===== */
async function ciclo() {
    const est = $('#estado');
    try {
        const r = await fetch(RUTAS.gps); if (!r.ok) throw new Error('HTTP ' + r.status);
        flota = normalizar(await r.json());
        if (!flota.length && normalizar.descartadas) { est.className = 'estado mal'; est.textContent = 'GPS sin coordenadas legibles'; est.title = 'Abre la consola (F12) para ver los campos que envía el GPS' }
        else { est.className = 'estado ok'; est.title = ''; est.textContent = 'GPS en línea · ' + flota.length + ' unidades · ' + new Date().toLocaleTimeString('es-HN') }
    } catch (e) { est.className = 'estado mal'; est.textContent = 'Sin conexión al GPS'; est.title = e.message + ' (' + RUTAS.gps + ')'; console.warn('GPS:', e.message, RUTAS.gps) }
    pintarFlota();
    try {
        db.viajes = await API.viajes();
        if (selViaje) { const d = await API.detalle(selViaje), i = db.viajes.findIndex(x => x.id === selViaje); if (i >= 0) db.viajes[i] = d }
    } catch (e) { console.warn('No se pudieron leer los viajes:', e.message) }
    kpis();
    if (tab === 'mon') lista();
    else if (tab === 'viajes' && !$('#panel input:focus')) vViajes(); // no repintar si el usuario está escribiendo un motivo
    const sv = db.viajes.find(x => x.id === selViaje); if (sv) pintarViaje(sv, false);
}

/* ===== KPIs ===== */
function kpis() {
    const c = k => flota.filter(u => estadoU(u) === k).length, vs = e => db.viajes.filter(v => v.estado === e).length;
    const paradas = db.viajes.reduce((n, v) => n + v.nParadas, 0);
    const K = [['Unidades', flota.length, ''], ['En movimiento', c('mov'), 'g'], ['Detenidas', c('det'), 'o'], ['Apagadas', c('apagada'), ''], ['Sin señal', c('offline'), 'r'], ['Programados', vs('programado'), ''], ['Viajes activos', vs('en_curso') + vs('en_destino') + vs('en_retorno'), 't'], ['Paradas registradas', paradas, '']];
    $('#kpis').innerHTML = K.map(k => `<div class="kpi ${k[2]}"><small>${k[0]}</small><b>${k[1]}</b></div>`).join('');
}

/* ===== VISTAS ===== */
const TIT = { mon: 'Monitoreo', viajes: 'Viajes', puntos: 'Puntos' };
function vista() { pintarPuntos(); ({ mon: vMon, viajes: vViajes, puntos: vPuntos })[tab](); }
$('#tabs').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    tab = b.dataset.t; selViaje = null; pintarViaje(null); $('#crumb').textContent = TIT[tab];
    document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === b)); vista()
};

function vMon() {
    $('#panel').innerHTML = `<div class="ph"><h2>Unidades</h2><span class="mut" id="cuenta"></span></div>
  <input id="busca" placeholder="Buscar por nombre o placa" value="${esc(busca)}">
  <div class="chips">${[['todas', 'Todas'], ['mov', 'En movimiento'], ['det', 'Detenidas'], ['apagada', 'Apagadas'], ['offline', 'Sin señal']].map(f => `<button class="chip ${filtro === f[0] ? 'on' : ''}" data-f="${f[0]}">${f[1]}</button>`).join('')}</div>
  <div id="lista"></div>`;
    $('#busca').oninput = e => { busca = e.target.value; lista() };
    document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtro = b.dataset.f; vMon() });
    lista();
}
function lista() {
    const el = $('#lista'); if (!el) return;
    const q = busca.toLowerCase();
    const L2 = flota.filter(u => (filtro === 'todas' || estadoU(u) === filtro) && (u.nombre + u.placa).toLowerCase().includes(q));
    $('#cuenta').textContent = L2.length + ' de ' + flota.length;
    el.innerHTML = L2.length ? L2.map(u => {
        const e = estadoU(u); return `<div class="item" data-u="${esc(u.id)}"><div class="top2"><b>${esc(u.nombre)}</b><span class="tag ${claseU(e)}">${ETQ[e]}</span></div>
    <div class="mut">${u.placa ? esc(u.placa) + ' · ' : ''}${Math.round(u.vel)} km/h · ${u.fecha ? hora(u.fecha) : 'sin hora'}</div></div>`
    }).join('')
        : `<div class="empty">${flota.length ? 'Ninguna unidad coincide con el filtro.' : 'Esperando datos del GPS. Revisa que el backend esté activo y que VTRACKER_* estén configuradas.'}</div>`;
    el.querySelectorAll('[data-u]').forEach(i => i.onclick = () => { const m = marks[i.dataset.u]; if (m) { map.flyTo(m.getLatLng(), 16); m.openPopup() } });
}

function vPuntos() {
    $('#panel').innerHTML = `<div class="ph"><h2>Puntos</h2></div>` + (db.puntos.length ? db.puntos.map(p => `<div class="item" data-go="${p.id}"><div class="top2"><div><b>${esc(p.nombre)}</b><div class="mut">${p.tipo} · radio ${p.radio} m</div></div><button class="btn sm del" data-del="${p.id}">Eliminar</button></div></div>`).join('') : '<div class="empty">Crea un origen y un destino con “Nuevo punto”.</div>');
    document.querySelectorAll('[data-go]').forEach(el => el.onclick = () => { const p = punto(el.dataset.go); if (p) map.flyTo([p.lat, p.lng], 15) });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = async e => {
        e.stopPropagation();
        const p = punto(b.dataset.del); if (!p) return;
        if (db.viajes.some(v => v.origen === p.nombre || v.destino === p.nombre) && !confirm('Este punto se usa en viajes. ¿Eliminar de todos modos?')) return;
        try { await API.borrarPunto(p.id); db.puntos = await API.puntos(); vista() } catch (err) { alert(err.message) }
    });
}

const ETQV = { programado: 'Programado', en_curso: 'En ida', en_destino: 'En destino', en_retorno: 'En retorno', finalizado: 'Finalizado' };
const etq = e => ETQV[e] || String(e).replace(/_/g, ' ');
async function abrirViaje(id) {
    selViaje = id;
    try { const d = await API.detalle(id), i = db.viajes.findIndex(x => x.id === id); if (i >= 0) db.viajes[i] = d } catch (e) { alert(e.message) }
    vViajes(); pintarViaje(db.viajes.find(x => x.id === id), true);
}
function vViajes() {
    const v = db.viajes.find(x => x.id === selViaje);
    if (v) {
        const ps = paradasDe(v);
        $('#panel').innerHTML = `<div class="top2"><button class="btn sm soft" id="bback">Volver</button><span>${v.estado !== 'finalizado' ? '<button class="btn sm soft" id="bfin">Finalizar</button> ' : ''}<button class="btn sm del" id="bdel">Eliminar viaje</button></span></div>
    <div class="ph" style="margin-top:12px"><h2>${esc(nomU(v))}</h2><span class="tag ${v.estado}">${etq(v.estado)}</span></div>
    <div class="mut">Viaje #${v.id}${v.etiqueta ? ' · ' + esc(v.etiqueta.split(' | ').slice(1).join(' · ')) : ''}</div>
    <ul class="tl">${lineaTiempo(v, ps)}</ul>`;
        $('#bback').onclick = () => { selViaje = null; pintarViaje(null); vViajes() };
        const bf = $('#bfin'); if (bf) bf.onclick = async () => { if (!confirm('¿Finalizar este viaje ahora?')) return; try { await API.finalizar(v.id); await ciclo() } catch (e) { alert(e.message) } };
        $('#bdel').onclick = async () => { if (!confirm('¿Eliminar este viaje y su historial?')) return; try { await API.borrarViaje(v.id); db.viajes = db.viajes.filter(x => x.id !== v.id); selViaje = null; pintarViaje(null); vViajes(); kpis() } catch (e) { alert(e.message) } };
        document.querySelectorAll('[data-s]').forEach(el => el.onclick = () => { const s = ps[+el.dataset.s]; map.flyTo([s.lat, s.lng], 16) });
        document.querySelectorAll('[data-m]').forEach(i => i.onclick = e => e.stopPropagation());
        document.querySelectorAll('[data-ms]').forEach(b => b.onclick = async e => {
            e.stopPropagation(); const id = +b.dataset.ms, txt = $(`[data-m="${id}"]`).value.trim();
            if (!txt) return alert('Escribe el motivo de la parada.');
            try { await API.motivo(id, txt); v.paradas.find(s => s.id === id).motivo = txt; b.textContent = 'Guardado ✓' } catch (err) { alert(err.message) }
        });
        return;
    }
    $('#panel').innerHTML = `<div class="ph"><h2>Viajes</h2><span class="mut">${db.viajes.length} registrados</span></div>` +
        (db.viajes.length ? db.viajes.map(x => `<div class="item" data-v="${x.id}"><div class="top2"><b>${esc(nomU(x))}</b><span class="tag ${x.estado}">${etq(x.estado)}</span></div>
    <div class="mut">${esc(x.origen)} → ${esc(x.destino)}</div><div class="mut">Salida ${hora(x.inicio)} · ${x.nParadas} paradas</div></div>`).join('') : '<div class="empty">Aún no hay viajes. Usa “Nuevo viaje” para programar uno.</div>');
    document.querySelectorAll('[data-v]').forEach(el => el.onclick = () => abrirViaje(+el.dataset.v));
}

/* ===== DIÁLOGOS ===== */
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
const aviso = (sel, msg) => { const a = $(sel); if (!a) { if (msg) alert(msg); return } a.textContent = msg || ''; a.hidden = !msg };
$('#nuevoViaje').onclick = () => {
    const O = db.puntos.filter(p => p.tipo === 'origen'), D = db.puntos.filter(p => p.tipo === 'destino'), opt = a => a.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('');
    $('#vcam').innerHTML = flota.map(u => `<option value="${esc(u.id)}">${esc(u.nombre)}${u.placa ? ' · ' + esc(u.placa) : ''}</option>`).join('');
    $('#vori').innerHTML = opt(O); $('#vdes').innerHTML = opt(D); $('#vid').value = '';
    $('#vfec').value = ''; /* opcional: la hora real la pone el GPS */
    const falta = !O.length || !D.length || !flota.length;
    aviso('#vaviso', falta ? (!flota.length ? 'Aún no hay unidades cargadas desde el GPS.' : 'Primero crea un punto de origen y uno de destino.') : '');
    $('#fv button.amber').disabled = falta; $('#dv').showModal();
};
$('#fv').onsubmit = async e => {
    e.preventDefault();
    const btn = $('#fv button.amber'); btn.disabled = true;
    try {
        await API.crearViaje({ idViaje: +$('#vid').value || null, idVehiculoGps: $('#vcam').value, origenId: +$('#vori').value, destinoId: +$('#vdes').value, fechaSalida: $('#vfec').value || null });
        $('#dv').close(); tab = 'viajes'; selViaje = null; $('#crumb').textContent = 'Viajes';
        document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === 'viajes'));
        pintarViaje(null); await ciclo(); vista();
    } catch (err) { aviso('#vaviso', err.message) } finally { btn.disabled = false }
};
$('#nuevoPunto').onclick = () => { $('#fp').reset(); $('#prad').value = CFG.radioDefecto; aviso('#paviso'); $('#dp').showModal() };
$('#fp').onsubmit = async e => {
    e.preventDefault();
    try {
        await API.crearPunto({ nombre: $('#pnom').value.trim(), tipo: $('#ptipo').value.toUpperCase(), latitud: +$('#plat').value, longitud: +$('#plng').value, radioMetros: +$('#prad').value });
        db.puntos = await API.puntos(); $('#dp').close(); vista();
    } catch (err) { aviso('#paviso', err.message) }
};
$('#bpick').onclick = () => { pick = true; $('#dp').close(); $('#pickbar').hidden = false; map.getContainer().style.cursor = 'crosshair' };
function finPick() { pick = false; $('#pickbar').hidden = true; map.getContainer().style.cursor = ''; $('#dp').showModal() }
$('#pickcancel').onclick = finPick;
map.on('click', e => { if (!pick) return; $('#plat').value = e.latlng.lat.toFixed(6); $('#plng').value = e.latlng.lng.toFixed(6); finPick() });

/* ===== ARRANQUE ===== */
(async () => {
    try { db.puntos = await API.puntos() } catch (e) { console.warn('No se pudieron leer los puntos:', e.message) }
    vista(); kpis();
    if (db.puntos.length) map.fitBounds(db.puntos.map(p => [p.lat, p.lng]), { padding: [60, 60], maxZoom: 13 });
    await ciclo(); setInterval(ciclo, CFG.intervaloMs);
})();