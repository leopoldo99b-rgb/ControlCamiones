(() => {
    'use strict';

    /* ---------- Utilidades ---------- */
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const lempira = new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' });
    const entero = new Intl.NumberFormat('es-HN');
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const hoy = () => {
        const d = new Date();
        const dos = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;   // fecha local, no UTC
    };
    const fecha = iso => new Date(iso + 'T00:00:00').toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });

    /* ---------- Datos (vienen del backend Spring Boot) ---------- */
    const API = document.body.dataset.api || '/api';

    async function api(ruta, opciones = {}) {
        let r;
        try {
            r = await fetch(API + ruta, { headers: { 'Content-Type': 'application/json' }, ...opciones });
        } catch (e) {
            throw new Error('No hay conexión con el servidor.');
        }
        let cuerpo = null;
        try { cuerpo = await r.json(); } catch (e) { /* respuesta sin cuerpo */ }
        if (!r.ok) throw new Error((cuerpo && cuerpo.error) || 'No se pudo completar la operación.');
        return cuerpo;
    }

    // Deshabilita el botón mientras se guarda, para evitar doble clic.
    async function enviar(boton, tarea) {
        boton.disabled = true;
        try { return await tarea(); } finally { boton.disabled = false; }
    }

    let datos = { productos: [], movimientos: [] };
    let vista = 'existencias';

    async function recargar() {
        const [productos, movimientos] = await Promise.all([api('/piezas'), api('/movimientos')]);
        datos = { productos, movimientos };
        renderTodo();
    }

    /* ---------- Lógica ---------- */
    const producto = id => datos.productos.find(p => p.id === id);
    const estado = p => p.stock <= 0 ? ['agotado', 'Agotado'] : p.stock <= p.minimo ? ['bajo', 'Stock bajo'] : ['ok', 'Disponible'];

    function productosFiltrados() {
        const q = $('#f-q').value.trim().toLowerCase();
        const cat = $('#f-cat').value, lug = $('#f-lugar').value, est = $('#f-estado').value;
        return datos.productos.filter(p =>
            (!q || `${p.codigo} ${p.nombre} ${p.lugar}`.toLowerCase().includes(q)) &&
            (!cat || p.categoria === cat) && (!lug || p.lugar === lug) && (!est || estado(p)[0] === est));
    }

    function movimientosFiltrados() {
        const q = $('#m-q').value.trim().toLowerCase();
        const tipo = $('#m-tipo').value, desde = $('#m-desde').value, hasta = $('#m-hasta').value;
        return datos.movimientos.filter(m => {
            const texto = `${m.productoNombre} ${m.productoCodigo} ${m.ref ?? ''}`.toLowerCase();
            return (!q || texto.includes(q)) && (!tipo || m.tipo === tipo) &&
                (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta);
        }).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
    }

    /* ---------- Render ---------- */
    function renderStats() {
        const ps = datos.productos;
        const valor = ps.reduce((s, p) => s + p.stock * p.costo, 0);
        const alertas = ps.filter(p => estado(p)[0] !== 'ok').length;
        $('#stats').innerHTML = `
      <div class="stat"><span>Piezas registradas</span><strong>${entero.format(ps.length)}</strong></div>
      <div class="stat"><span>Unidades en bodega</span><strong>${entero.format(ps.reduce((s, p) => s + p.stock, 0))}</strong></div>
      <div class="stat"><span>Valor del inventario</span><strong>${lempira.format(valor)}</strong></div>
      <div class="stat ${alertas ? 'alerta' : ''}"><span>Piezas por reponer</span><strong>${alertas}</strong></div>`;
    }

    function renderCategorias() {
        const cats = [...new Set(datos.productos.map(p => p.categoria))].sort();
        const actual = $('#f-cat').value;
        $('#f-cat').innerHTML = '<option value="">Todas las categorías</option>' +
            cats.map(c => `<option${c === actual ? ' selected' : ''}>${esc(c)}</option>`).join('');
        $('#lista-cat').innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');

        const lugares = [...new Set(datos.productos.map(p => p.lugar).filter(Boolean))].sort();
        const lugarActual = $('#f-lugar').value;
        $('#f-lugar').innerHTML = '<option value="">Todos los lugares</option>' +
            lugares.map(l => `<option${l === lugarActual ? ' selected' : ''}>${esc(l)}</option>`).join('');
        $('#lista-lugar').innerHTML = lugares.map(l => `<option value="${esc(l)}">`).join('');
    }

    function renderExistencias() {
        const lista = productosFiltrados();
        $('#body-existencias').innerHTML = lista.length ? lista.map(p => {
            const [clase, texto] = estado(p);
            return `<tr>
        <td>${esc(p.codigo)}</td><td>${esc(p.nombre)}</td><td>${esc(p.categoria)}</td><td>${esc(p.lugar) || '—'}</td>
        <td class="n">${entero.format(p.stock)}</td><td class="n">${entero.format(p.minimo)}</td>
        <td class="n">${lempira.format(p.costo)}</td><td class="n">${lempira.format(p.stock * p.costo)}</td>
        <td><span class="badge ${clase}">${texto}</span></td>
        <td class="no-print"><div class="acciones-celda">
          <button class="btn-mini entrada" data-mov="entrada" data-id="${p.id}" type="button">Entrada</button>
          <button class="btn-mini" data-mov="salida" data-id="${p.id}" type="button">Salida</button>
          <button class="btn-mini peligro" data-eliminar data-id="${p.id}" type="button">Eliminar</button>
        </div></td></tr>`;
        }).join('') : '<tr><td class="vacio" colspan="10">No hay piezas con esos filtros. Cambia la búsqueda o registra una nueva pieza.</td></tr>';

        $('#foot-existencias').innerHTML = `<tr><td colspan="4">Total (${lista.length} piezas)</td>
      <td class="n">${entero.format(lista.reduce((s, p) => s + p.stock, 0))}</td><td></td><td></td>
      <td class="n">${lempira.format(lista.reduce((s, p) => s + p.stock * p.costo, 0))}</td><td></td><td class="no-print"></td></tr>`;
    }

    function renderMovimientos() {
        const lista = movimientosFiltrados();
        $('#body-movimientos').innerHTML = lista.length ? lista.map(m => `<tr>
        <td>${fecha(m.fecha)}</td>
        <td><span class="badge ${m.tipo}">${m.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span></td>
        <td>${esc(m.productoCodigo + ' · ' + m.productoNombre)}</td>
        <td class="n">${entero.format(m.cantidad)}</td><td class="n">${lempira.format(m.costo)}</td>
        <td class="n">${lempira.format(m.cantidad * m.costo)}</td>
        <td>${esc(m.ref)}${m.notas ? `<br><small>${esc(m.notas)}</small>` : ''}</td></tr>`
        ).join('') : '<tr><td class="vacio" colspan="7">No hay movimientos en ese rango.</td></tr>';

        const total = t => lista.filter(m => m.tipo === t).reduce((s, m) => s + m.cantidad * m.costo, 0);
        $('#resumen-mov').innerHTML = `<span>Entradas: ${lempira.format(total('entrada'))}</span><span>Salidas: ${lempira.format(total('salida'))}</span>`;
    }

    function renderTodo() { renderStats(); renderCategorias(); renderExistencias(); renderMovimientos(); }

    /* ---------- Pestañas ---------- */
    function cambiarVista(v) {
        vista = v;
        ['existencias', 'movimientos'].forEach(n => {
            $('#tab-' + n).setAttribute('aria-selected', n === v);
            $('#panel-' + n).hidden = n !== v;
        });
    }
    $('#tab-existencias').onclick = () => cambiarVista('existencias');
    $('#tab-movimientos').onclick = () => cambiarVista('movimientos');

    ['#f-q', '#f-cat', '#f-estado'].forEach(s => $(s).addEventListener('input', renderExistencias));
    $('#f-lugar').addEventListener('input', renderExistencias);
    ['#m-q', '#m-tipo', '#m-desde', '#m-hasta'].forEach(s => $(s).addEventListener('input', renderMovimientos));

    /* ---------- Aviso ---------- */
    let temporizador;
    function aviso(texto) {
        const el = $('#aviso'); el.textContent = texto; el.classList.add('visible');
        clearTimeout(temporizador); temporizador = setTimeout(() => el.classList.remove('visible'), 3500);
    }

    /* ---------- Entradas y salidas ---------- */
    let tipoActual = 'entrada';

    function sincronizarCosto() {
        const p = producto(Number($('#mov-producto').value));
        const costo = $('#mov-costo');
        if (tipoActual === 'salida') { costo.value = p ? p.costo : 0; costo.readOnly = true; }
        else { costo.readOnly = false; if (p && !costo.value) costo.value = p.costo; }
    }

    function abrirMovimiento(tipo, id) {
        tipoActual = tipo;
        $('#mov-titulo').textContent = tipo === 'entrada' ? 'Registrar entrada' : 'Registrar salida';
        $('#mov-guardar').textContent = tipo === 'entrada' ? 'Guardar entrada' : 'Guardar salida';
        $('#mov-producto').innerHTML = datos.productos.map(p =>
            `<option value="${p.id}">${esc(p.codigo)} · ${esc(p.nombre)} (stock ${p.stock})</option>`).join('');
        if (id) $('#mov-producto').value = id;
        $('#mov-cantidad').value = '';
        $('#mov-costo').value = '';
        $('#mov-fecha').value = hoy();
        $('#mov-ref').value = ''; $('#mov-notas').value = ''; $('#mov-error').textContent = '';
        sincronizarCosto();
        $('#dlg-mov').showModal();
    }

    $('#mov-producto').addEventListener('change', () => { $('#mov-costo').value = ''; sincronizarCosto(); });

    $('#form-mov').addEventListener('submit', async e => {
        e.preventDefault();
        const p = producto(Number($('#mov-producto').value));
        const cantidad = Number($('#mov-cantidad').value);
        const costo = Number($('#mov-costo').value);
        const error = $('#mov-error');
        if (!p) { error.textContent = 'Primero crea una pieza para registrar movimientos.'; return; }
        if (!Number.isInteger(cantidad) || cantidad < 1) { error.textContent = 'Escribe una cantidad entera mayor que cero.'; return; }
        if (!(costo >= 0) || $('#mov-costo').value === '') { error.textContent = 'Escribe el costo unitario.'; return; }
        if (!$('#mov-fecha').value) { error.textContent = 'Elige la fecha del movimiento.'; return; }
        if (tipoActual === 'salida' && cantidad > p.stock) { error.textContent = `Solo hay ${p.stock} unidades en bodega.`; return; }

        try {
            await enviar($('#mov-guardar'), () => api('/movimientos', {
                method: 'POST',
                body: JSON.stringify({
                    productoId: p.id, tipo: tipoActual, fecha: $('#mov-fecha').value, cantidad, costo,
                    ref: $('#mov-ref').value.trim(), notas: $('#mov-notas').value.trim()
                })
            }));
            await recargar();
            $('#dlg-mov').close();
            aviso(tipoActual === 'entrada' ? 'Entrada guardada' : 'Salida guardada');
        } catch (err) {
            error.textContent = err.message;
        }
    });

    /* ---------- Nueva pieza ---------- */
    $('#btn-nueva').onclick = () => {
        $('#form-prod').reset(); $('#p-error').textContent = '';
        $('#dlg-prod').showModal();
    };

    $('#form-prod').addEventListener('submit', async e => {
        e.preventDefault();
        const codigo = $('#p-codigo').value.trim().toUpperCase();
        const nombre = $('#p-nombre').value.trim();
        const categoria = $('#p-categoria').value.trim();
        const lugar = $('#p-lugar').value.trim();
        const minimo = Number($('#p-minimo').value), stock = Number($('#p-stock').value), costo = Number($('#p-costo').value);
        const error = $('#p-error');
        if (!codigo || !nombre || !categoria || !lugar) { error.textContent = 'Completa código, nombre, categoría y lugar.'; return; }
        if (datos.productos.some(p => p.codigo === codigo)) { error.textContent = `El código ${codigo} ya existe.`; return; }
        if (![minimo, stock, costo].every(n => n >= 0)) { error.textContent = 'Mínimo, existencia y costo no pueden ser negativos.'; return; }
        if (!Number.isInteger(minimo) || !Number.isInteger(stock)) { error.textContent = 'Mínimo y existencia deben ser números enteros.'; return; }

        try {
            await enviar($('#p-guardar'), () => api('/piezas', {
                method: 'POST',
                body: JSON.stringify({ codigo, nombre, categoria, lugar, minimo, stock, costo })
            }));
            await recargar();
            $('#dlg-prod').close();
            aviso('Pieza guardada');
        } catch (err) {
            error.textContent = err.message;
        }
    });

    /* ---------- Eliminar pieza ---------- */
    let piezaAEliminar = null;

    function pedirEliminar(id) {
        const p = producto(id);
        if (!p) return;
        piezaAEliminar = p;
        $('#del-texto').textContent = `¿Eliminar "${p.codigo} · ${p.nombre}" del inventario?`;
        $('#del-aviso').textContent = p.stock > 0
            ? `Todavía tiene ${entero.format(p.stock)} unidades en existencia; dejarán de contarse en el inventario.`
            : '';
        $('#del-error').textContent = '';
        $('#dlg-eliminar').showModal();
    }

    $('#form-eliminar').addEventListener('submit', async e => {
        e.preventDefault();
        if (!piezaAEliminar) return;
        try {
            const r = await enviar($('#del-confirmar'), () => api(`/piezas/${piezaAEliminar.id}`, { method: 'DELETE' }));
            await recargar();
            $('#dlg-eliminar').close();
            piezaAEliminar = null;
            aviso(r.mensaje);
        } catch (err) {
            $('#del-error').textContent = err.message;
        }
    });

    /* ---------- Botones generales ---------- */

    document.addEventListener('click', e => {
        const mov = e.target.closest('[data-mov]');
        if (mov) return abrirMovimiento(mov.dataset.mov, Number(mov.dataset.id));
        const eliminar = e.target.closest('[data-eliminar]');
        if (eliminar) return pedirEliminar(Number(eliminar.dataset.id));
        const cerrar = e.target.closest('[data-cerrar]');
        if (cerrar) return $('#' + cerrar.dataset.cerrar).close();
        const limpiar = e.target.closest('[data-limpiar]');
        if (limpiar) return limpiarFiltros(limpiar.dataset.limpiar);
        const accion = e.target.closest('[data-accion]');
        if (accion) accion.dataset.accion === 'imprimir' ? imprimir() : exportarCSV();
    });

    /* ---------- Limpiar filtros ---------- */
    function limpiarFiltros(cual) {
        const campos = cual === 'existencias' ? ['#f-q', '#f-cat', '#f-lugar', '#f-estado'] : ['#m-q', '#m-tipo', '#m-desde', '#m-hasta'];
        campos.forEach(s => { $(s).value = ''; });
        cual === 'existencias' ? renderExistencias() : renderMovimientos();
    }

    /* ---------- Imprimir y exportar ---------- */
    function imprimir() {
        const ahora = new Date().toLocaleString('es-HN', { dateStyle: 'long', timeStyle: 'short' });
        if (vista === 'existencias') {
            $('#print-titulo').textContent = 'Reporte de existencias';
            $('#print-meta').textContent = `Generado el ${ahora} · ${productosFiltrados().length} piezas`;
        } else {
            const d = $('#m-desde').value, h = $('#m-hasta').value;
            const rango = d || h ? `Del ${d ? fecha(d) : 'inicio'} al ${h ? fecha(h) : 'hoy'}` : 'Todos los movimientos';
            $('#print-titulo').textContent = 'Reporte de movimientos';
            $('#print-meta').textContent = `Generado el ${ahora} · ${rango}`;
        }
        window.print();
    }

    function exportarCSV() {
        const celda = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        let filas;
        if (vista === 'existencias') {
            filas = [['Código', 'Pieza', 'Categoría', 'Lugar', 'Stock', 'Mínimo', 'Costo unitario', 'Valor total', 'Estado']]
                .concat(productosFiltrados().map(p => [p.codigo, p.nombre, p.categoria, p.lugar, p.stock, p.minimo, p.costo.toFixed(2), (p.stock * p.costo).toFixed(2), estado(p)[1]]));
        } else {
            filas = [['Fecha', 'Tipo', 'Código', 'Pieza', 'Cantidad', 'Costo unitario', 'Total', 'Referencia', 'Notas']]
                .concat(movimientosFiltrados().map(m =>
                    [m.fecha, m.tipo, m.productoCodigo, m.productoNombre, m.cantidad, m.costo.toFixed(2), (m.cantidad * m.costo).toFixed(2), m.ref, m.notas]));
        }
        const csv = '\ufeff' + filas.map(f => f.map(celda).join(',')).join('\r\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `inventario-${vista}-${hoy()}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    /* ---------- Inicio ---------- */
    renderTodo();
    recargar().catch(err => aviso('No se pudo cargar el inventario: ' + err.message));
})();