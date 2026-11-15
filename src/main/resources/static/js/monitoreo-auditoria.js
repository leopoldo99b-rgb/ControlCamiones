"use strict";
/* Transportes CHC · Informe de auditoría de viaje (impresión / PDF).
   Uso: CHCAuditoria.imprimir({ viaje, paradas, origen, destino, unidad, nombreUnidad, minParada }) */
(() => {
    const ZONA = 'America/Tegucigalpa';
    const MAPA_W = 680, MAPA_H = 360;
    const COLOR = { IDA: '#0e7490', RETORNO: '#7c3aed' };

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = t => t ? new Date(t).toLocaleString('es-HN', { timeZone: ZONA, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '—';
    const minutos = (a, b) => (a && b) ? Math.max(0, Math.round((b - a) / 60000)) : null;
    const fmtDur = m => m == null ? '—' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
    const dist = (a, b, c, d) => { const R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)) };
    const faseDe = (x, v, t) => x || (v.salidaDest && t >= v.salidaDest ? 'RETORNO' : 'IDA');
    const etqFase = f => f === 'RETORNO' ? 'Retorno' : 'Ida';

    /* Parte la ruta en tramos de una misma fase (ida / retorno) */
    function tramosDe(v) {
        const tr = [];
        v.ruta.forEach(r => {
            const f = faseDe(r[3], v, r[2]), u = tr[tr.length - 1];
            if (u && u.fase === f) u.pts.push(r); else tr.push({ fase: f, pts: [r] });
        });
        return tr;
    }
    const kmTramo = pts => { let m = 0; for (let i = 1; i < pts.length; i++) m += dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); return m / 1000 };

    /* ---------- Mapa estático (mosaicos OSM + ruta en SVG), uno por fase ---------- */
    const mx = (lng, z) => (lng + 180) / 360 * 256 * 2 ** z;
    const my = (lat, z) => { const s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * 2 ** z };

    function mapaEstatico({ v, ps, origen, destino, tramos, fase }) {
        const W = MAPA_W, H = MAPA_H, color = COLOR[fase], nombre = fase === 'RETORNO' ? 'retorno' : 'ida';
        const mios = tramos.filter(t => t.fase === fase), misPs = ps.filter(s => s.fase === fase), pts = [];
        mios.forEach(t => t.pts.forEach(r => pts.push([r[0], r[1]])));
        misPs.forEach(s => pts.push([s.lat, s.lng]));
        if (!pts.length) return `<div class="sinmapa">${fase === 'RETORNO' && !v.salidaDest ? 'El viaje aún no inicia el retorno.' : 'Sin datos de recorrido GPS de ' + nombre + ' para dibujar el mapa.'}</div>`;
        [origen, destino].forEach(p => p && pts.push([p.lat, p.lng]));

        const lats = pts.map(p => p[0]), lngs = pts.map(p => p[1]);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
        const PAD = 50;
        let z = 17;
        for (; z > 3; z--) {
            const w = mx(maxLng, z) - mx(minLng, z), h = my(minLat, z) - my(maxLat, z);
            if (w <= W - 2 * PAD && h <= H - 2 * PAD) break;
        }
        const ox = (mx(minLng, z) + mx(maxLng, z)) / 2 - W / 2, oy = (my(minLat, z) + my(maxLat, z)) / 2 - H / 2;
        const P = (lat, lng) => [mx(lng, z) - ox, my(lat, z) - oy];
        const n = 2 ** z;

        let tiles = '';
        for (let tx = Math.floor(ox / 256); tx <= Math.floor((ox + W) / 256); tx++)
            for (let ty = Math.floor(oy / 256); ty <= Math.floor((oy + H) / 256); ty++) {
                if (ty < 0 || ty >= n) continue;
                const xw = ((tx % n) + n) % n;
                tiles += `<img alt="" src="https://tile.openstreetmap.org/${z}/${xw}/${ty}.png" style="left:${(tx * 256 - ox).toFixed(1)}px;top:${(ty * 256 - oy).toFixed(1)}px">`;
            }

        let svg = '';
        mios.forEach(t => {
            if (t.pts.length < 2) return;
            const paso = Math.ceil(t.pts.length / 1000);
            const str = t.pts.filter((_, i) => i % paso === 0 || i === t.pts.length - 1).map(r => P(r[0], r[1]).map(q => q.toFixed(1)).join(',')).join(' ');
            svg += `<polyline points="${str}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
                   `<polyline points="${str}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
        });
        const marca = (p, c, txt) => { if (!p) return ''; const [x, y] = P(p.lat, p.lng); return `<circle cx="${x}" cy="${y}" r="12" fill="${c}" stroke="#fff" stroke-width="3"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${txt}</text>` };
        svg += marca(origen, '#15803d', 'S') + marca(destino, '#b91c1c', 'D');
        misPs.forEach(s => {
            const [x, y] = P(s.lat, s.lng);
            svg += `<circle cx="${x}" cy="${y}" r="11" fill="#f59e0b" stroke="#fff" stroke-width="3"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#111">${s.n}</text>`;
        });

        return `<div class="mapa" style="width:${W}px;height:${H}px">${tiles}<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg}</svg><span class="atrib">© OpenStreetMap contributors</span></div>
        <div class="leyenda"><span><i style="background:${color}"></i>Recorrido de ${nombre}</span><span><i class="c" style="background:#15803d"></i>S = Origen</span><span><i class="c" style="background:#b91c1c"></i>D = Destino</span><span><i class="c" style="background:#f59e0b"></i>N.º = Parada</span></div>`;
    }

    /* ---------- Contenido del informe ---------- */
    function construir(d) {
        const v = d.viaje, ahora = Date.now();
        /* Cada parada con su número y fase ya resueltos */
        const ps = d.paradas.map((s, i) => ({ ...s, n: s.numero ?? i + 1, fase: faseDe(s.fase, v, s.desde) }));
        const [uNom, uPlaca, uCond] = (v.etiqueta || '').split(' | ');
        const unidad = uNom || d.nombreUnidad || '—', placa = uPlaca || d.unidad?.placa || '—', conductor = uCond || '—';
        const estado = ({ programado: 'Programado', en_curso: 'En ida', en_destino: 'En destino', en_retorno: 'En retorno', finalizado: 'Finalizado' })[v.estado] || v.estado;
        const finalizado = v.estado === 'finalizado';
        const origenN = d.origen?.nombre || v.origen, destinoN = d.destino?.nombre || v.destino;

        const tramos = tramosDe(v);
        const kmDe = f => tramos.filter(t => t.fase === f).reduce((a, t) => a + kmTramo(t.pts), 0);
        const kmIda = kmDe('IDA'), kmRet = kmDe('RETORNO'), km = kmIda + kmRet;
        const durParada = s => minutos(s.desde, s.hasta || ahora) || 0;
        const tDetenido = ps.reduce((a, s) => a + durParada(s), 0);
        const masLarga = ps.reduce((m, s) => durParada(s) > (m ? durParada(m) : -1) ? s : m, null);
        const sinMotivo = ps.filter(s => !(s.motivo || '').trim());
        const durTotal = v.inicio ? minutos(v.inicio, v.fin || ahora) : null;
        const tIda = minutos(v.inicio, v.llegada);
        const tRet = v.salidaDest ? minutos(v.salidaDest, v.fin || ahora) : null;
        const psIda = ps.filter(s => s.fase === 'IDA').length, psRet = ps.filter(s => s.fase === 'RETORNO').length;

        /* Línea de tiempo cronológica */
        const ev = [];
        if (v.inicio) ev.push({ t: v.inicio, o: 0, tit: 'Salida del origen', det: esc(origenN) });
        if (v.llegada) ev.push({ t: v.llegada, o: 1, tit: 'Llegada al destino', det: esc(destinoN) });
        if (v.salidaDest) ev.push({ t: v.salidaDest, o: 2, tit: 'Salida del destino', det: 'Inicio del retorno' });
        ps.forEach(s => ev.push({
            t: s.desde, o: 5, parada: true,
            tit: `Parada ${s.n} · ${etqFase(s.fase)}`,
            det: `${esc(s.lugar || 'Sin ubicación registrada')}<br>Duración: <b>${s.hasta ? fmtDur(durParada(s)) : 'sigue detenido (' + fmtDur(durParada(s)) + ')'}</b> · Motivo <b>M-${s.n}</b>: ${esc(s.motivo || 'Sin registrar')}`
        }));
        if (v.fin) ev.push({ t: v.fin, o: 9, tit: 'Regreso al origen · fin del viaje', det: esc(origenN) });
        ev.sort((a, b) => (a.t - b.t) || (a.o - b.o));
        const tl = ev.map(e => `<div class="tl-item${e.parada ? ' p' : ''}"><div class="tl-h"><b>${e.tit}</b><span>${fmt(e.t)}</span></div><div class="tl-d">${e.det}</div></div>`).join('')
            + (finalizado ? '' : '<div class="tl-item pend"><div class="tl-d">El viaje seguía en curso al momento de generar este informe.</div></div>');

        /* Tabla de paradas: el motivo va solo como referencia (M-n); el texto está en el anexo */
        const filas = ps.map(s => `<tr><td>${s.n}</td><td>${etqFase(s.fase)}</td><td>${fmt(s.desde)}</td><td>${s.hasta ? fmt(s.hasta) : 'Sigue detenido'}</td><td>${fmtDur(durParada(s))}</td><td>${esc(s.lugar || '—')}</td><td class="mref${(s.motivo || '').trim() ? '' : ' falta'}">M-${s.n}</td><td>${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}</td></tr>`).join('');

        /* Anexo: motivos completos en hoja aparte */
        const motivos = ps.map(s => {
            const txt = (s.motivo || '').trim();
            return `<div class="mot"><div class="mot-h"><b>M-${s.n}</b><span>Parada ${s.n} · ${etqFase(s.fase)} · ${fmt(s.desde)} · Duración ${fmtDur(durParada(s))}</span></div>
            <div class="mot-l">Lugar: ${esc(s.lugar || '—')}</div>
            <div class="mot-t${txt ? '' : ' falta'}">${txt ? esc(txt) : 'Sin registrar'}</div></div>`;
        }).join('');

        const dato = (k, val) => `<tr><th>${k}</th><td>${val}</td></tr>`;
        const stamp = new Date().toLocaleString('sv-SE', { timeZone: ZONA }).replace(/\D/g, '').slice(0, 12);
        const firmas = `<div class="firmas"><div>Elaborado por</div><div>Revisado por</div><div>Autorizado por</div></div>`;

        const cuerpo = `
        <div class="banda"><div><b>TRANSPORTES CHC</b><span>Informe de auditoría de viaje</span></div>
            <div class="der">Folio: AUD-${esc(v.id)}-${stamp}<br>Generado: ${fmt(ahora)} (hora de Honduras)</div></div>
        <h1>Viaje #${esc(v.id)} <span class="badge">${esc(estado)}</span></h1>
        <p class="sub">${esc(origenN)} → ${esc(destinoN)}</p>

        <h2><i>1</i>Datos generales</h2>
        <div class="cols">
          <table class="kv">${dato('Unidad', esc(unidad))}${dato('Placa', esc(placa))}${dato('Conductor', esc(conductor))}${dato('Estado', esc(estado))}</table>
          <table class="kv">${dato('Salida', fmt(v.inicio))}${dato('Llegada al destino', fmt(v.llegada))}${dato('Salida del destino', fmt(v.salidaDest))}${dato('Fin del viaje', fmt(v.fin))}</table>
        </div>

        <h2><i>2</i>Indicadores</h2>
        <div class="kpis">
          <div><b>${fmtDur(durTotal)}</b>Duración total</div>
          <div><b>${km.toFixed(1)} km</b>Distancia aprox.</div>
          <div><b>${ps.length}</b>Paradas</div>
          <div><b>${fmtDur(tDetenido)}</b>Tiempo detenido</div>
          <div><b>${masLarga ? fmtDur(durParada(masLarga)) : '—'}</b>Parada más larga</div>
          <div><b>${v.ruta.length}</b>Puntos GPS</div>
        </div>
        <div class="kpis k2">
          <div><b>${fmtDur(tIda)}</b>Tiempo de ida</div>
          <div><b>${fmtDur(minutos(v.llegada, v.salidaDest))}</b>Tiempo en destino</div>
          <div><b>${fmtDur(tRet)}</b>Tiempo de retorno</div>
        </div>

        <div class="bloque">
          <h2><i>3</i>Mapa de ida · origen → destino</h2>
          ${mapaEstatico({ v, ps, origen: d.origen, destino: d.destino, tramos, fase: 'IDA' })}
          <p class="cap">Tiempo de ida: <b>${fmtDur(tIda)}</b> · Distancia aprox.: <b>${kmIda.toFixed(1)} km</b> · Paradas en ida: <b>${psIda}</b></p>
        </div>

        <div class="bloque">
          <h2><i>4</i>Mapa de retorno · destino → origen</h2>
          ${mapaEstatico({ v, ps, origen: d.origen, destino: d.destino, tramos, fase: 'RETORNO' })}
          <p class="cap">Tiempo de retorno: <b>${fmtDur(tRet)}</b> · Distancia aprox.: <b>${kmRet.toFixed(1)} km</b> · Paradas en retorno: <b>${psRet}</b></p>
        </div>

        <h2><i>5</i>Línea de tiempo</h2>
        <div class="tl">${tl || '<p class="vacio">Sin eventos registrados.</p>'}</div>

        <h2><i>6</i>Detalle de paradas</h2>
        ${ps.length ? `<table class="grid"><thead><tr><th>N.º</th><th>Fase</th><th>Inicio</th><th>Fin</th><th>Duración</th><th>Lugar</th><th>Motivo</th><th>Coordenadas</th></tr></thead><tbody>${filas}</tbody></table>
        <p class="nota">El texto completo de cada motivo (M-1, M-2…) se encuentra en el Anexo A, en la hoja siguiente.</p>` : '<p class="vacio">No se registraron paradas en este viaje.</p>'}

        <h2><i>7</i>Observaciones de auditoría</h2>
        <ul class="obs">
          <li>Paradas con motivo registrado: <b>${ps.length - sinMotivo.length} de ${ps.length}</b>${sinMotivo.length ? ` · <b class="alerta">Sin motivo: ${sinMotivo.map(s => 'M-' + s.n).join(', ')}</b>` : ''}.</li>
          <li>La distancia es una estimación calculada con los puntos GPS registrados.</li>
          <li>Se registran paradas de ${d.minParada ?? 5} minutos o más. Horas en zona horaria de Honduras (UTC-6).</li>
        </ul>
        ${ps.length ? '' : firmas}

        ${ps.length ? `<div class="anexo">
          <h2><i>A</i>Anexo A · Motivos de las paradas</h2>
          <p class="nota">Viaje #${esc(v.id)} · ${esc(unidad)} · ${esc(origenN)} → ${esc(destinoN)}</p>
          ${motivos}
          ${firmas}
        </div>` : ''}`;

        const css = `
        @page { size: A4; margin: 14mm 14mm 16mm;
          @bottom-left { content: "Transportes CHC · Auditoría de viaje #${v.id}"; font: 9px Arial; color: #666 }
          @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 9px Arial; color: #666 } }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact }
        body { margin: 0; font: 11.5px/1.4 Arial, Helvetica, sans-serif; color: #111 }
        .banda { display: flex; justify-content: space-between; align-items: center; background: #0a1633; color: #fff; padding: 10px 14px; border-bottom: 3px solid #f59e0b; border-radius: 6px }
        .banda b { display: block; font-size: 16px; letter-spacing: .5px } .banda span { font-size: 11px; color: #c9d3ee }
        .banda .der { text-align: right; font-size: 10px; color: #c9d3ee }
        h1 { font-size: 22px; margin: 14px 0 2px } .sub { margin: 0 0 6px; color: #444; font-size: 13px }
        .badge { font-size: 11px; vertical-align: middle; background: #fff1d6; color: #8a4f00; border: 1px solid #f3d58a; padding: 2px 10px; border-radius: 99px }
        h2 { display: flex; align-items: center; gap: 8px; font-size: 13px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #0a1633; break-after: avoid; text-transform: uppercase; letter-spacing: .3px }
        h2 i { font-style: normal; background: #f59e0b; color: #0a1633; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; display: grid; place-items: center; font-size: 11px }
        .bloque { break-inside: avoid }
        .cap { margin: 6px 0 0; text-align: center; font-size: 10.5px; color: #333 }
        .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
        table { width: 100%; border-collapse: collapse }
        .kv th { width: 42%; text-align: left; background: #f1f4f9; font-weight: 700; color: #333 }
        .kv th, .kv td { border: 1px solid #cfd6e4; padding: 5px 8px }
        .kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px }
        .kpis.k2 { grid-template-columns: repeat(3, 1fr); margin-top: 8px }
        .kpis div { border: 1px solid #cfd6e4; border-top: 3px solid #0a1633; border-radius: 6px; padding: 7px 8px; font-size: 10px; color: #555; text-transform: uppercase; break-inside: avoid }
        .kpis b { display: block; font-size: 15px; color: #111; text-transform: none; margin-bottom: 2px }
        .mapa { position: relative; overflow: hidden; margin: 0 auto; background: #e9eef3; border: 1px solid #9aa6bd; break-inside: avoid }
        .mapa img { position: absolute; width: 256px; height: 256px } .mapa svg { position: absolute; left: 0; top: 0 }
        .atrib { position: absolute; right: 0; bottom: 0; background: #fffc; font-size: 8px; padding: 1px 5px }
        .leyenda { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; margin: 6px 0 0; font-size: 10px; color: #444 }
        .leyenda i { display: inline-block; width: 18px; height: 4px; border-radius: 2px; margin-right: 5px; vertical-align: middle } .leyenda i.c { width: 10px; height: 10px; border-radius: 50% }
        .sinmapa, .vacio { padding: 12px; border: 1px dashed #aaa; color: #555; text-align: center }
        .tl { border-left: 3px solid #0a1633; margin-left: 8px; padding-left: 18px }
        .tl-item { position: relative; margin: 0 0 10px; padding: 6px 10px; background: #f6f8fc; border: 1px solid #dfe5f0; border-radius: 6px; break-inside: avoid }
        .tl-item::before { content: ""; position: absolute; left: -29px; top: 10px; width: 10px; height: 10px; border-radius: 50%; background: #fff; border: 3px solid #0a1633 }
        .tl-item.p { border-left: 4px solid #f59e0b } .tl-item.p::before { border-color: #f59e0b }
        .tl-item.pend { background: none; border-style: dashed; color: #555 }
        .tl-h { display: flex; justify-content: space-between; gap: 10px } .tl-h span { color: #555 } .tl-d { color: #333; margin-top: 2px }
        .grid th, .grid td { border: 1px solid #cfd6e4; padding: 4px 6px; text-align: left; vertical-align: top; font-size: 10px }
        .grid th { background: #0a1633; color: #fff } .grid tr { break-inside: avoid } .grid tbody tr:nth-child(even) { background: #f6f8fc }
        .grid td.mref { font-weight: 700; text-align: center; white-space: nowrap } .grid td.mref.falta { color: #b91c1c }
        .nota { margin: 6px 0 0; font-size: 10.5px; color: #555 }
        .obs { margin: 0; padding-left: 18px } .obs li { margin: 3px 0 } .alerta { color: #b91c1c }
        .anexo { break-before: page }
        .mot { border: 1px solid #cfd6e4; border-left: 4px solid #f59e0b; border-radius: 6px; margin: 0 0 10px; padding: 8px 12px; break-inside: avoid }
        .mot-h { display: flex; gap: 12px; align-items: baseline } .mot-h b { font-size: 14px; color: #0a1633 } .mot-h span { color: #444; font-size: 10.5px }
        .mot-l { color: #555; font-size: 10.5px; margin-top: 2px }
        .mot-t { margin-top: 6px; padding: 8px 10px; background: #f6f8fc; border-radius: 4px; font-size: 12.5px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere }
        .mot-t.falta { color: #b91c1c; font-style: italic }
        .firmas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 50px; break-inside: avoid }
        .firmas div { border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 10px; color: #444 }`;

        return { titulo: `Auditoria viaje ${v.id}`, css, cuerpo };
    }

    /* ---------- Impresión en iframe oculto (espera a que carguen los mosaicos de los mapas) ---------- */
    function imprimirDoc({ titulo, css, cuerpo }) {
        return new Promise(resolve => {
            const f = document.createElement('iframe');
            f.setAttribute('aria-hidden', 'true');
            f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
            document.body.appendChild(f);
            const doc = f.contentDocument;
            doc.open();
            doc.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${esc(titulo)}</title><style>${css}</style></head><body>${cuerpo}</body></html>`);
            doc.close();
            const w = f.contentWindow;
            const imgs = [...doc.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r }));
            Promise.race([Promise.all(imgs), new Promise(r => setTimeout(r, 8000))]).then(() => {
                w.onafterprint = () => f.remove();
                setTimeout(() => f.remove(), 5 * 60000);
                w.focus(); w.print(); resolve();
            });
        });
    }

    window.CHCAuditoria = {
        imprimir: async d => {
            if (!d || !d.viaje) throw new Error('No hay un viaje seleccionado.');
            await imprimirDoc(construir(d));
        }
    };
})();