/* Transportes CHC · Planillas simplificadas */
(() => {
	const $ = (s, r = document) => r.querySelector(s);
	const $$ = (s, r = document) => [...r.querySelectorAll(s)];
	const API = '/planillas/api';
	const L = n => 'L ' + Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
	const hoy = () => new Date().toISOString().slice(0, 10);
	const MESES_X_PERIODO = { SEMANAL: 52 / 12, QUINCENAL: 2, MENSUAL: 1 }; // períodos por mes
	let empleados = [], planillas = [], descuentos = [], planillaAbierta = null;

	async function api(url, opt = {}) {
		const r = await fetch(API + url, {
			headers: { 'Content-Type': 'application/json' }, ...opt,
			body: opt.body ? JSON.stringify(opt.body) : undefined
		});
		if (!r.ok) throw new Error((await r.text()) || 'Error ' + r.status);
		return r.status === 204 ? null : r.json();
	}
	function toast(msg, error) {
		const t = $('#toast'); t.textContent = msg; t.className = 'toast on' + (error ? ' error' : '');
		clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3200);
	}
	const run = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };
	const tabla = (el, cols, filas, pie = '') => {
		el.innerHTML = filas.length
			? `<thead><tr>${cols.map(c => `<th class="${c.num ? 'num' : ''}">${c.t}</th>`).join('')}</tr></thead><tbody>${filas.join('')}</tbody>${pie}`
			: `<tbody><tr><td class="vacio">Sin registros</td></tr></tbody>`;
	};

	/* ---------- Pestañas, modales, cajón ---------- */
	$$('.tab').forEach(b => b.onclick = () => {
		$$('.tab').forEach(x => x.classList.toggle('activa', x === b));
		$$('.panel').forEach(p => p.classList.toggle('visible', p.id === 'p-' + b.dataset.tab));
	});
	const abrir = id => $('#' + id).classList.add('abierto');
	const cerrar = m => m.classList.remove('abierto');
	$$('[data-abrir]').forEach(b => b.onclick = () => {
		if (b.dataset.abrir === 'mEmpleado') { $('#fEmpleado').reset(); $('#fEmpleado [name=id]').value = ''; $('#empTitulo').textContent = 'Nuevo empleado'; }
		if (b.dataset.abrir === 'mDescuento') { $('#dFecha').value = hoy(); llenarEmpleados(); }
		abrir(b.dataset.abrir);
	});
	$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m || e.target.hasAttribute('data-cerrar')) cerrar(m); }));
	const cajon = open => { $('#cajon').classList.toggle('abierto', open); $('#velo').classList.toggle('on', open); };
	$('#velo').onclick = () => cajon(false);
	$('[data-cerrar-cajon]').onclick = () => cajon(false);
	$('#dTipo').onchange = e => $('#lCuota').style.display = e.target.value === 'PRESTAMO' ? 'block' : 'none';

	/* ---------- Empleados ---------- */
	function llenarEmpleados() {
		$('#dEmp').innerHTML = empleados.filter(e => e.activo).map(e => `<option value="${e.id}">${esc(e.codigo)} · ${esc(e.nombre)}</option>`).join('');
	}
	function pintarEmpleados() {
		const q = $('#buscaEmp').value.toLowerCase();
		const f = empleados.filter(e => [e.codigo, e.nombre, e.cargo].join(' ').toLowerCase().includes(q));
		tabla($('#tEmpleados'),
			[{ t: 'Código' }, { t: 'Nombre' }, { t: 'Cargo' }, { t: 'Frecuencia' }, { t: 'Salario mensual', num: 1 }, { t: 'Estado' }, { t: '' }],
			f.map(e => `<tr><td>${esc(e.codigo)}</td><td>${esc(e.nombre)}</td><td>${esc(e.cargo)}</td>
				<td><span class="tag freq">${e.frecuenciaPago}</span></td><td class="num">${L(e.salarioMensual)}</td>
				<td><span class="tag ${e.activo ? 'PAGADA' : 'INACTIVO'}">${e.activo ? 'Activo' : 'Inactivo'}</span></td>
				<td><button class="btn btn-claro btn-sm" data-edit="${e.id}"><i class="fa-solid fa-pen"></i></button></td></tr>`));
		$$('[data-edit]').forEach(b => b.onclick = () => {
			const e = empleados.find(x => x.id == b.dataset.edit), f = $('#fEmpleado');
			$('#empTitulo').textContent = 'Editar empleado';
			['id', 'codigo', 'identidad', 'nombre', 'cargo', 'frecuenciaPago', 'salarioMensual', 'fechaIngreso'].forEach(k => f[k].value = e[k] ?? '');
			f.activo.checked = e.activo; abrir('mEmpleado');
		});
	}
	$('#buscaEmp').oninput = pintarEmpleados;
	$('#fEmpleado').onsubmit = run(async ev => {
		ev.preventDefault();
		const f = ev.target, d = Object.fromEntries(new FormData(f));
		d.activo = f.activo.checked; d.salarioMensual = +d.salarioMensual;
		const id = d.id; delete d.id;
		await api('/empleados' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: d });
		cerrar($('#mEmpleado')); toast('Empleado guardado'); await cargar();
	});

	/* ---------- Adelantos, vales y préstamos ---------- */
	function pintarDescuentos() {
		const t = $('#fTipoDesc').value;
		tabla($('#tDescuentos'),
			[{ t: 'Fecha' }, { t: 'Empleado' }, { t: 'Tipo' }, { t: 'Monto', num: 1 }, { t: 'Cuota', num: 1 }, { t: 'Saldo', num: 1 }, { t: 'Motivo' }, { t: 'Estado' }],
			descuentos.filter(d => !t || d.tipo === t).map(d => `<tr><td>${d.fecha}</td><td>${esc(d.nombre)}</td>
				<td><span class="tag freq">${d.tipo}</span></td><td class="num">${L(d.monto)}</td>
				<td class="num">${d.cuota ? L(d.cuota) : 'Completo'}</td><td class="num">${L(d.saldo)}</td>
				<td>${esc(d.motivo)}</td><td><span class="tag ${d.estado}">${d.estado}</span></td></tr>`));
	}
	$('#fTipoDesc').onchange = pintarDescuentos;
	$('#fDescuento').onsubmit = run(async ev => {
		ev.preventDefault();
		const d = Object.fromEntries(new FormData(ev.target));
		d.empleadoId = +d.empleadoId; d.monto = +d.monto;
		d.cuota = d.tipo === 'PRESTAMO' && d.cuota ? +d.cuota : null;
		if (d.tipo === 'PRESTAMO' && !d.cuota) throw new Error('Indica la cuota del préstamo');
		await api('/adelantos', { method: 'POST', body: d });
		cerrar($('#mDescuento')); ev.target.reset(); toast('Registrado'); await cargar();
	});

	/* ---------- Planillas ---------- */
	function pintarPlanillas() {
		tabla($('#tPlanillas'),
			[{ t: 'N.º' }, { t: 'Descripción' }, { t: 'Frecuencia' }, { t: 'Período' }, { t: 'Sueldos', num: 1 }, { t: 'Descuentos', num: 1 }, { t: 'Neto', num: 1 }, { t: 'Estado' }, { t: '' }],
			planillas.map(p => `<tr><td>${p.id}</td><td>${esc(p.descripcion)}</td><td><span class="tag freq">${p.frecuencia}</span></td>
				<td>${p.fechaInicio} → ${p.fechaFin}</td><td class="num">${L(p.totalIngresos)}</td><td class="num">${L(p.totalDescuentos)}</td>
				<td class="num"><b>${L(p.totalNeto)}</b></td><td><span class="tag ${p.estado}">${p.estado}</span></td>
				<td><button class="btn btn-claro btn-sm" data-ver="${p.id}"><i class="fa-solid fa-eye"></i> Abrir</button></td></tr>`));
		$$('[data-ver]').forEach(b => b.onclick = run(() => verPlanilla(b.dataset.ver)));
	}
	$('#fGenerar').onsubmit = run(async ev => {
		ev.preventDefault();
		const p = await api('/periodos', { method: 'POST', body: Object.fromEntries(new FormData(ev.target)) });
		cerrar($('#mGenerar')); toast('Planilla generada'); await cargar(); await verPlanilla(p.id);
	});
	async function verPlanilla(id) {
		planillaAbierta = await api('/periodos/' + id);
		const p = planillaAbierta, d = p.detalle;
		$('#cajonTitulo').textContent = `Planilla N.º ${p.id} · ${p.frecuencia}`;
		$('#cajonSub').textContent = `${p.fechaInicio} → ${p.fechaFin} · ${p.estado}`;
		$('#cajonAcc').innerHTML = `<button class="btn btn-claro" id="aImp"><i class="fa-solid fa-print"></i> Imprimir firmas</button>` +
			(p.estado === 'BORRADOR' ? `<button class="btn btn-verde" id="aPagar"><i class="fa-solid fa-check"></i> Marcar como pagada</button>
			<button class="btn btn-rojo" id="aBorrar"><i class="fa-solid fa-trash"></i> Eliminar</button>` : '');
		const s = k => d.reduce((a, x) => a + +x[k], 0);
		const sueldo = 'salarioBase';
		tabla($('#tDetalle'),
			[{ t: 'Empleado' }, { t: 'Sueldo', num: 1 }, { t: 'Adelantos', num: 1 }, { t: 'Vales', num: 1 }, { t: 'Préstamos', num: 1 }, { t: 'Neto a pagar', num: 1 }],
			d.map(x => `<tr><td>${esc(x.nombre)}</td><td class="num">${L(x.salarioBase)}</td><td class="num">${L(x.adelantos)}</td>
				<td class="num">${L(x.vales)}</td><td class="num">${L(x.prestamos)}</td><td class="num"><b>${L(x.neto)}</b></td></tr>`),
			`<tfoot><tr><td>Totales</td><td class="num">${L(s('salarioBase'))}</td><td class="num">${L(s('adelantos'))}</td><td class="num">${L(s('vales'))}</td><td class="num">${L(s('prestamos'))}</td><td class="num">${L(s('neto'))}</td></tr></tfoot>`);
		$('#aImp').onclick = () => imprimir(`Planilla N.º ${p.id} · ${p.descripcion || p.frecuencia}`, `${p.fechaInicio} al ${p.fechaFin}`,
			['Empleado', 'Sueldo', 'Descuentos', 'Neto a pagar'],
			d.map(x => [x.nombre, L(x.salarioBase), L(+x.adelantos + +x.vales + +x.prestamos), L(x.neto)]),
			['Totales', L(s('salarioBase')), L(s('adelantos') + s('vales') + s('prestamos')), L(s('neto'))]);
		if ($('#aPagar')) $('#aPagar').onclick = run(async () => {
			if (!confirm('¿Marcar como pagada? Se rebajan los saldos de adelantos, vales y préstamos.')) return;
			await api(`/periodos/${p.id}/pagar`, { method: 'POST' }); toast('Planilla pagada'); await cargar(); await verPlanilla(p.id);
		});
		if ($('#aBorrar')) $('#aBorrar').onclick = run(async () => {
			if (!confirm('¿Eliminar esta planilla borrador?')) return;
			await api('/periodos/' + p.id, { method: 'DELETE' }); cajon(false); toast('Planilla eliminada'); await cargar();
		});
		cajon(true);
	}

	/* ---------- 14.º y aguinaldo (guardados en la base de datos) ---------- */
	let prest = [];
	const prQuery = () => `?tipo=${$('#prTipo').value}&anio=${$('#prAnio').value}`;
	async function cargarPrest() { prest = await api('/prestaciones' + prQuery()); pintarPrest(); }
	function pintarPrest() {
		const total = prest.reduce((a, f) => a + +f.monto, 0);
		tabla($('#tPrest'), [{ t: 'Empleado' }, { t: 'Meses', num: 1 }, { t: 'Salario mensual', num: 1 }, { t: 'Monto', num: 1 }, { t: 'Estado' }, { t: '' }],
			prest.map(f => `<tr><td>${esc(f.nombre)}</td><td class="num">${f.meses}</td><td class="num">${L(f.salarioBase)}</td>
				<td class="num"><b>${L(f.monto)}</b></td><td><span class="tag ${f.estado}">${f.estado}</span></td>
				<td>${f.estado === 'PENDIENTE' ? `<button class="btn btn-verde btn-sm" data-pagpr="${f.id}">Marcar pagado</button>` : ''}</td></tr>`),
			`<tfoot><tr><td colspan="3">Total</td><td class="num">${L(total)}</td><td colspan="2"></td></tr></tfoot>`);
		$$('[data-pagpr]').forEach(b => b.onclick = run(async () => { await api(`/prestaciones/${b.dataset.pagpr}/pagar`, { method: 'POST' }); toast('Marcado como pagado'); await cargarPrest(); }));
	}
	$('#prTipo').onchange = $('#prAnio').onchange = run(cargarPrest);
	$('#prGenerar').onclick = run(async () => {
		const r = await api('/prestaciones/generar', { method: 'POST', body: { tipo: $('#prTipo').value, anio: +$('#prAnio').value } });
		toast(r.nuevos + ' calculados'); await cargarPrest();
	});
	$('#prImprimir').onclick = () => {
		if (!prest.length) return toast('Primero calcula', true);
		const nombre = $('#prTipo').value === 'AGUINALDO' ? 'Aguinaldo' : 'Decimocuarto mes';
		imprimir(`${nombre} ${$('#prAnio').value}`, `${prest[0].periodoInicio} al ${prest[0].periodoFin}`,
			['Empleado', 'Meses', 'Monto a pagar'], prest.map(f => [f.nombre, f.meses, L(f.monto)]),
			['Total', '', L(prest.reduce((a, f) => a + +f.monto, 0))]);
	};

	/* ---------- Impresión con columna de firma ---------- */
	function imprimir(titulo, sub, cols, filas, pie) {
		const num = i => i > 0 ? ' class="num"' : '';
		$('#areaImpresion').innerHTML = `<div class="enc"><div><h1>Transportes CHC</h1><b>${esc(titulo)}</b></div><div>${esc(sub)}</div></div>
			<table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}<th>Firma</th></tr></thead>
			<tbody>${filas.map(f => `<tr>${f.map((c, i) => `<td${num(i)}>${esc(c)}</td>`).join('')}<td class="firma"></td></tr>`).join('')}</tbody>
			<tfoot><tr>${pie.map((c, i) => `<td${num(i)}>${esc(c)}</td>`).join('')}<td></td></tr></tfoot></table>
			<div class="pie-firmas"><div>Elaboró</div><div>Autorizó</div></div>`;
		window.print();
	}

	/* ---------- Carga inicial ---------- */
	async function cargar() {
		[empleados, planillas, descuentos] = await Promise.all([api('/empleados'), api('/periodos'), api('/adelantos')]);
		pintarEmpleados(); pintarPlanillas(); pintarDescuentos(); await cargarPrest();
	}
	$('#prAnio').value = new Date().getFullYear();
	run(cargar)();
})();