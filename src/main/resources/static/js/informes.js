(() => {
    const $ = id => document.getElementById(id);
    const CATS = {
        operaciones: { n: 'Operaciones y viajes', i: 'fa-route', c: '#e09b00' },
        mantenimiento: { n: 'Mantenimiento de flota', i: 'fa-wrench', c: '#2f6fdb' },
        combustible: { n: 'Combustible', i: 'fa-gas-pump', c: '#e8662b' },
        seguridad: { n: 'Seguridad y accidentes', i: 'fa-helmet-safety', c: '#d83b3b' },
        conductores: { n: 'Conductores', i: 'fa-id-card', c: '#12a3a3' },
        finanzas: { n: 'Finanzas y costos', i: 'fa-sack-dollar', c: '#1f9d55' },
        otros: { n: 'Otros', i: 'fa-folder', c: '#6b7482' }
    };
    let datos = [], filtro = '', idBorrar = null, idDrive = null;

    // ---------- util ----------
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = f => new Date(f + 'T00:00:00').toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
    const prev = id => `https://drive.google.com/file/d/${id}/preview`;
    const desc = id => `https://drive.google.com/uc?export=download&id=${id}`;
    const abrir = id => `https://drive.google.com/file/d/${id}/view`;
    const toast = (m, t = '') => { const e = document.createElement('div'); e.className = 'toast ' + t; e.textContent = m; $('toasts').appendChild(e); setTimeout(() => e.remove(), 3500); };
    function extraerId(u) {
        try {
            const x = new URL(u.trim());
            if (!/(^|\.)drive\.google\.com$/.test(x.hostname)) return { err: 'El enlace debe ser de drive.google.com' };
            if (x.pathname.includes('/folders/')) return { err: 'Ese enlace es de una carpeta. Pega el enlace del archivo PDF.' };
            const m = x.pathname.match(/\/d\/([\w-]{10,})/) || [null, x.searchParams.get('id')];
            return m[1] ? { id: m[1] } : { err: 'No se encontró el archivo en el enlace' };
        } catch { return { err: 'Enlace no válido' }; }
    }
    function contar(el, n) {
        const t0 = performance.now(), d = 700;
        (function paso(t) { const p = Math.min((t - t0) / d, 1); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(paso); })(t0);
    }

    // ---------- formulario ----------
    Object.entries(CATS).forEach(([k, v]) => $('categoria').add(new Option(v.n, k)));
    $('fecha').value = new Date().toISOString().slice(0, 10);
    $('toggleForm').addEventListener('click', () => {
        const p = $('panelForm'); p.classList.toggle('cerrado');
        $('toggleForm').setAttribute('aria-expanded', !p.classList.contains('cerrado'));
    });
    function validar() {
        const r = $('enlace').value.trim() ? extraerId($('enlace').value) : null, e = $('enlaceEstado');
        if (!r) { e.textContent = ''; e.className = 'estado'; }
        else if (r.err) { e.textContent = '✕ ' + r.err; e.className = 'estado err'; }
        else { e.textContent = '✓ Archivo de Drive detectado'; e.className = 'estado ok'; }
        $('btnGuardar').disabled = !(r && r.id && $('titulo').value.trim() && $('fecha').value);
    }
    ['enlace', 'titulo', 'fecha'].forEach(i => $(i).addEventListener('input', validar));
    $('form').addEventListener('reset', () => setTimeout(() => { $('fecha').value = new Date().toISOString().slice(0, 10); validar(); }));
    $('form').addEventListener('submit', async e => {
        e.preventDefault(); $('btnGuardar').disabled = true;
        try {
            const r = await fetch('/api/informes', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                    titulo: $('titulo').value.trim(), categoria: $('categoria').value, enlace: $('enlace').value.trim(),
                    fecha: $('fecha').value, descripcion: $('descripcion').value.trim()
                })
            });
            if (!r.ok) throw new Error(await r.text());
            toast('Informe guardado', 'ok'); $('form').reset(); cargar();
        } catch (x) { toast('No se pudo guardar. ' + (x.message || ''), 'err'); validar(); }
    });

    // ---------- lista ----------
    async function cargar() {
        $('grid').innerHTML = '<div class="skel"></div>'.repeat(3);
        try { const r = await fetch('/api/informes'); if (!r.ok) throw 0; datos = await r.json(); }
        catch { datos = []; toast('No se pudieron cargar los informes', 'err'); }
        chips(); pintar(); stats();
    }
    function stats() {
        const mes = new Date().toISOString().slice(0, 7);
        contar($('stTotal'), datos.length);
        contar($('stMes'), datos.filter(d => d.fecha.startsWith(mes)).length);
        contar($('stCat'), new Set(datos.map(d => d.categoria)).size);
        $('stUlt').textContent = datos.length ? fmt([...datos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0].fecha) : '—';
    }
    function chips() {
        const cnt = {}; datos.forEach(d => cnt[d.categoria] = (cnt[d.categoria] || 0) + 1);
        $('chips').innerHTML = `<button class="chip ${filtro ? '' : 'act'}" data-c="">Todos · ${datos.length}</button>` +
            Object.entries(CATS).filter(([k]) => cnt[k]).map(([k, v]) =>
                `<button class="chip ${filtro === k ? 'act' : ''}" data-c="${k}"><i class="fa-solid ${v.i}"></i>${v.n} · ${cnt[k]}</button>`).join('');
    }
    $('chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; filtro = b.dataset.c; chips(); pintar(); });
    ['buscar', 'orden'].forEach(i => $(i).addEventListener('input', pintar));
    function pintar() {
        const q = $('buscar').value.toLowerCase(), o = $('orden').value;
        const l = datos.filter(d => (!filtro || d.categoria === filtro) && (d.titulo + ' ' + (d.descripcion || '')).toLowerCase().includes(q));
        l.sort((a, b) => o === 'az' ? a.titulo.localeCompare(b.titulo) : o === 'ant' ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha));
        $('contador').textContent = l.length;
        $('vacio').hidden = l.length > 0;
        $('grid').innerHTML = l.map((d, n) => {
            const c = CATS[d.categoria] || CATS.otros;
            return `<article class="inf" style="--c:${c.c};--i:${Math.min(n, 12)}">
        <div class="inf-cuerpo">
          <div class="inf-top"><span class="inf-ico"><i class="fa-solid ${c.i}"></i></span>
            <div><h3>${esc(d.titulo)}</h3><small><i class="fa-regular fa-calendar"></i> ${fmt(d.fecha)}</small></div></div>
          <span class="etq">${c.n}</span>
          ${d.descripcion ? `<p>${esc(d.descripcion)}</p>` : ''}
        </div>
        <div class="acc">
          <button class="btn pri grow" data-a="ver" data-id="${d.id}"><i class="fa-solid fa-eye"></i><span>Ver</span></button>
          <a class="btn sec" href="${desc(d.driveId)}" target="_blank" rel="noopener" title="Descargar"><i class="fa-solid fa-download"></i><span>Descargar</span></a>
          <button class="btn sec" data-a="link" data-id="${d.id}" title="Copiar enlace"><i class="fa-solid fa-link"></i><span>Link</span></button>
          <button class="btn sec peligro" data-a="del" data-id="${d.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
        </div></article>`;
        }).join('');
    }
    $('grid').addEventListener('click', async e => {
        const b = e.target.closest('button[data-a]'); if (!b) return;
        const d = datos.find(x => String(x.id) === b.dataset.id); if (!d) return;
        if (b.dataset.a === 'ver') {
            $('visorTitulo').textContent = d.titulo;
            $('visorMeta').textContent = (CATS[d.categoria] || CATS.otros).n + ' · ' + fmt(d.fecha);
            $('visorDesc').href = desc(d.driveId); $('visorDrive').href = abrir(d.driveId);
            $('visor').src = prev(d.driveId); $('modal').hidden = false;
        } else if (b.dataset.a === 'link') {
            try { await navigator.clipboard.writeText(d.enlace); toast('Enlace copiado', 'ok'); } catch { prompt('Copia el enlace:', d.enlace); }
        } else { idBorrar = d.id; $('confirmaTxt').textContent = d.titulo; $('confirmar').hidden = false; }
    });
    const cerrarVisor = () => { $('modal').hidden = true; $('visor').src = 'about:blank'; };
    $('visorCerrar').addEventListener('click', cerrarVisor);
    $('modal').addEventListener('click', e => { if (e.target === $('modal')) cerrarVisor(); });
    $('cNo').addEventListener('click', () => $('confirmar').hidden = true);
    $('confirmar').addEventListener('click', e => { if (e.target === $('confirmar')) $('confirmar').hidden = true; });
    $('cSi').addEventListener('click', async () => {
        $('confirmar').hidden = true;
        const r = await fetch('/api/informes/' + idBorrar, { method: 'DELETE' });
        if (r.ok) { toast('Informe eliminado', 'ok'); cargar(); } else toast('No se pudo eliminar', 'err');
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { cerrarVisor(); $('confirmar').hidden = true; } });
    $('visor').addEventListener('load', () => $('visor').previousElementSibling.style.display = 'none');
    $('modal').addEventListener('transitionstart', () => {});
    new MutationObserver(() => { if (!$('modal').hidden) $('visor').previousElementSibling.style.display = ''; }).observe($('modal'), { attributes: true, attributeFilter: ['hidden'] });

    validar(); cargar();
})();