(() => {
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];
    const MAX_MB = 5, MIN_PASS = 6;
    const norm = s => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const modal = $("#modalUsuario"), form = $("#formUsuario"), btnNuevo = $("#btnNuevoUsuario");
    const modalDel = $("#modalEliminar"), modalImg = $("#modalImagenPerfil");
    const drawer = $("#drawerPermisos"), overlay = $("#overlayPermisos");
    const cards = $$(".card");
    let filtro = "", sucio = false, passOriginal = "", usuarioOriginal = "";
    let formEliminar = null, permisosId = null, permisosInicial = "", permisosSucio = false;

    /* ---------- Aviso ---------- */
    let tToast;
    function toast(msg, tipo = "success") {
        const t = $("#mensajeToast");
        t.className = "toast " + tipo;
        $("#iconoToast").className = "fa-solid " + (tipo === "success" ? "fa-circle-check" : "fa-circle-exclamation");
        $("#textoToast").textContent = msg;
        requestAnimationFrame(() => t.classList.add("mostrar"));
        clearTimeout(tToast);
        tToast = setTimeout(() => t.classList.remove("mostrar"), 3500);
    }

    /* ---------- Cupos y contadores ---------- */
    const total = Number(btnNuevo.dataset.total), limite = Number(btnNuevo.dataset.limite);
    const lleno = total >= limite;
    (function cupos() {
        const p = limite ? Math.min(100, total / limite * 100) : 0, bar = $("#seatsBar");
        bar.style.width = p + "%";
        bar.classList.toggle("alto", p >= 80 && !lleno);
        bar.classList.toggle("lleno", lleno);
        $("#seatsTxt").textContent = lleno ? "Sin cupos: elimina un usuario para crear otro." : `Quedan ${limite - total} cupos disponibles.`;
        btnNuevo.classList.toggle("lleno", lleno);
        $("#cTodos").textContent = cards.length;
        ["administrador", "operador", "conductor"].forEach(r => $("#c" + r[0].toUpperCase() + r.slice(1)).textContent = cards.filter(c => c.dataset.rol === r).length);
        $("#cOnline").textContent = cards.filter(c => c.dataset.online === "true").length;
    })();

    /* ---------- Búsqueda y filtros ---------- */
    function aplicar() {
        const q = norm($("#buscadorUsuarios").value.trim());
        let n = 0;
        cards.forEach(c => {
            const okF = !filtro || (filtro === "online" ? c.dataset.online === "true" : c.dataset.rol === filtro);
            const ok = okF && (!q || norm(c.textContent).includes(q));
            c.hidden = !ok;
            if (ok) n++;
        });
        $("#sinResultados").hidden = n > 0 || !cards.length;
        $("#resultado").textContent = cards.length ? `Mostrando ${n} de ${cards.length}` : "";
    }
    $("#buscadorUsuarios").addEventListener("input", aplicar);
    $$(".chip").forEach(ch => ch.addEventListener("click", () => {
        filtro = ch.dataset.filtro;
        $$(".chip").forEach(x => x.classList.toggle("active", x === ch));
        aplicar();
    }));
    $("#btnLimpiar").addEventListener("click", () => {
        $("#buscadorUsuarios").value = ""; filtro = "";
        $$(".chip").forEach((x, i) => x.classList.toggle("active", i === 0));
        aplicar();
    });
    aplicar();

    /* ---------- Formulario: abrir / cerrar ---------- */
    function abrirForm(datos) {
        form.reset();
        ["#avisoUsuario", "#avisoCorreo"].forEach(s => $(s).hidden = true);
        $$("#formUsuario .invalido").forEach(i => i.classList.remove("invalido"));
        $("#password").type = "password";
        const edit = !!datos;
        $("#idUsuario").value = edit ? datos.id : "";
        $("#tituloModal").innerHTML = edit ? '<i class="fa-solid fa-user-pen"></i> Editar usuario' : '<i class="fa-solid fa-user-plus"></i> Crear usuario';
        $("#textoGuardar").textContent = edit ? "Guardar cambios" : "Guardar usuario";
        $("#previewFoto").src = (edit && datos.imagen && datos.imagen.trim()) ? datos.imagen : "/imgs/perfil.png";
        usuarioOriginal = edit ? (datos.usuario || "") : "";
        passOriginal = edit ? (datos.password || "") : "";
        if (edit) {
            $("#nombre").value = datos.nombre || "";
            $("#usuario").value = datos.usuario || "";
            $("#password").value = datos.password || "";
            $("#telefono").value = datos.telefono || "";
            $("#rol").value = datos.rol || "Operador";
            const c = datos.correo || "", i = c.lastIndexOf("@");
            if (i > 0) {
                const dom = c.slice(i), sel = $("#dominio");
                if (![...sel.options].some(o => o.value === dom)) sel.add(new Option(dom, dom));
                sel.value = dom; $("#correoUsuario").value = c.slice(0, i);
            } else $("#correoUsuario").value = c;
        }
        fuerza(); armarCorreo();
        sucio = false;
        modal.style.display = "flex";
        setTimeout(() => $("#nombre").focus(), 50);
    }
    function cerrarForm(forzar) {
        if (!forzar && sucio && !confirm("Hay cambios sin guardar. ¿Cerrar de todos modos?")) return;
        modal.style.display = "none"; sucio = false;
    }
    btnNuevo.addEventListener("click", () => lleno ? toast("Has alcanzado el límite de usuarios permitidos.", "warning") : abrirForm(null));
    ["#btnCerrarModal", "#btnCancelarModal"].forEach(s => $(s).addEventListener("click", () => cerrarForm()));
    modal.addEventListener("mousedown", e => { if (e.target === modal) cerrarForm(); });
    form.addEventListener("input", () => sucio = true);

    /* ---------- Correo (se arma también al pegar o autocompletar) ---------- */
    function armarCorreo() {
        let u = $("#correoUsuario").value.trim();
        const arroba = u.includes("@");
        $("#avisoCorreo").hidden = !arroba;
        $("#correoUsuario").classList.toggle("invalido", arroba);
        if (arroba) u = u.split("@")[0];
        $("#correo").value = u ? u + $("#dominio").value : "";
        return !arroba && !!u;
    }
    $("#correoUsuario").addEventListener("input", armarCorreo);
    $("#dominio").addEventListener("change", armarCorreo);

    /* ---------- Usuario único ---------- */
    const existentes = cards.map(c => norm(c.querySelector(".user span").textContent));
    function usuarioRepetido() {
        const v = norm($("#usuario").value.trim());
        const dup = !!v && v !== norm(usuarioOriginal) && existentes.includes(v);
        $("#avisoUsuario").hidden = !dup;
        $("#usuario").classList.toggle("invalido", dup);
        return dup;
    }
    $("#usuario").addEventListener("input", () => { $("#usuario").value = $("#usuario").value.replace(/\s+/g, ""); usuarioRepetido(); });

    /* ---------- Contraseña ---------- */
    function fuerza() {
        const v = $("#password").value;
        let s = 0;
        if (v.length >= MIN_PASS) s++;
        if (v.length >= 10) s++;
        if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
        if (/\d/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        s = v ? Math.max(1, Math.min(4, s)) : 0;
        const bar = $("#fuerzaBar");
        bar.style.width = s * 25 + "%";
        bar.style.background = ["", "#d92d20", "#f59e0b", "#84cc16", "#16a34a"][s];
        $("#fuerzaTxt").textContent = v ? ["", "Débil", "Regular", "Buena", "Fuerte"][s] : `Mínimo ${MIN_PASS} caracteres.`;
    }
    $("#password").addEventListener("input", fuerza);
    $("#btnMostrarCrearPassword").addEventListener("click", function() {
        const i = $("#password"), ver = i.type === "password";
        i.type = ver ? "text" : "password";
        this.firstElementChild.className = "fa-solid " + (ver ? "fa-eye-slash" : "fa-eye");
    });
    $("#btnGenerarPassword").addEventListener("click", () => {
        const grupos = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%"];
        const todo = grupos.join(""), r = new Uint32Array(14);
        crypto.getRandomValues(r);
        const c = grupos.map((g, i) => g[r[i] % g.length]);
        for (let i = 4;i < 14;i++) c.push(todo[r[i] % todo.length]);
        for (let i = c.length - 1;i > 0;i--) { const j = r[i] % (i + 1);[c[i], c[j]] = [c[j], c[i]]; }
        $("#password").value = c.join(""); $("#password").type = "text";
        $("#btnMostrarCrearPassword").firstElementChild.className = "fa-solid fa-eye-slash";
        sucio = true; fuerza();
        toast("Contraseña generada. Compártela de forma segura.");
    });

    /* ---------- Teléfono y foto ---------- */
    $("#telefono").addEventListener("input", e => {
        const d = e.target.value.replace(/\D/g, "").slice(0, 8);
        e.target.value = d.length > 4 ? d.slice(0, 4) + "-" + d.slice(4) : d;
    });
    $("#fotoPerfil").addEventListener("change", function() {
        const f = this.files[0];
        if (!f) return;
        if (!f.type.startsWith("image/") || f.size > MAX_MB * 1048576) {
            this.value = ""; return toast(`La foto debe ser una imagen de máximo ${MAX_MB} MB.`, "error");
        }
        const r = new FileReader();
        r.onload = e => $("#previewFoto").src = e.target.result;
        r.readAsDataURL(f);
    });

    /* ---------- Enviar ---------- */
    form.addEventListener("submit", e => {
        const falla = (msg, campo) => { e.preventDefault(); toast(msg, "error"); campo && campo.focus(); };
        if (!$("#nombre").value.trim()) return falla("Escribe el nombre completo.", $("#nombre"));
        if (!$("#usuario").value.trim()) return falla("Escribe el nombre de usuario.", $("#usuario"));
        if (usuarioRepetido()) return falla("Ese nombre de usuario ya existe.", $("#usuario"));
        const pw = $("#password").value;
        if (!pw || (pw !== passOriginal && pw.length < MIN_PASS)) return falla(`La contraseña necesita al menos ${MIN_PASS} caracteres.`, $("#password"));
        if (!armarCorreo()) return falla("Escribe un correo válido (sin el @).", $("#correoUsuario"));
        sucio = false;
        const b = $("#btnGuardar");
        b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    });
    window.addEventListener("pageshow", () => {
        const b = $("#btnGuardar");
        b.disabled = false; b.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span id="textoGuardar">' + ($("#idUsuario").value ? "Guardar cambios" : "Guardar usuario") + "</span>";
        const d = $("#btnConfirmarEliminar");
        d.disabled = false; d.innerHTML = '<i class="fa-solid fa-trash"></i> Sí, eliminar';
    });

    /* ---------- Eliminar ---------- */
    function cerrarEliminar() { modalDel.style.display = "none"; formEliminar = null; }
    $("#btnCancelarEliminar").addEventListener("click", cerrarEliminar);
    modalDel.addEventListener("mousedown", e => { if (e.target === modalDel) cerrarEliminar(); });
    $("#btnConfirmarEliminar").addEventListener("click", function() {
        if (!formEliminar) return;
        this.disabled = true; this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Eliminando...';
        formEliminar.submit();
    });

    /* ---------- Permisos ---------- */
    const lista = $("#listaPermisos");
    const marcados = () => $$("#listaPermisos input");
    function contar() {
        const m = marcados();
        $("#contadorPermisos").textContent = `${m.filter(i => i.checked).length} de ${m.length} activos`;
        permisosSucio = m.filter(i => i.checked).map(i => i.value).join() !== permisosInicial;
    }
    async function abrirPermisos(btn) {
        permisosId = btn.dataset.id; permisosSucio = false;
        $("#tituloPermisos").textContent = btn.dataset.nombre || "Usuario";
        $("#buscarPermiso").value = "";
        lista.innerHTML = '<div class="sk"></div>'.repeat(6);
        $("#btnGuardarPermisos").disabled = true;
        drawer.classList.add("abierto"); overlay.classList.add("abierto"); drawer.setAttribute("aria-hidden", "false");
        try {
            const [rt, ru] = await Promise.all([fetch("/usuarios/permisos"), fetch("/usuarios/permisos/" + permisosId)]);
            if (!rt.ok || !ru.ok) throw new Error();
            const todos = await rt.json(), propios = (await ru.json()).map(p => p.id);
            if (!todos.length) { lista.innerHTML = '<p class="permiso-estado">No hay permisos configurados en el sistema.</p>'; return; }
            lista.innerHTML = todos.map(p => `<label class="permiso-item"><input type="checkbox" value="${p.id}" ${propios.includes(p.id) ? "checked" : ""}><span></span></label>`).join("");
            [...lista.children].forEach((el, i) => el.lastElementChild.textContent = todos[i].nombre);
            permisosInicial = marcados().filter(i => i.checked).map(i => i.value).join();
            $("#btnGuardarPermisos").disabled = false; contar();
        } catch {
            lista.innerHTML = '<p class="permiso-estado"><i class="fa-solid fa-wifi"></i><br>No se pudieron cargar los permisos.<br>Revisa tu conexión e inténtalo de nuevo.</p>';
        }
    }
    function cerrarPermisos(forzar) {
        if (!forzar && permisosSucio && !confirm("Hay cambios sin guardar. ¿Cerrar de todos modos?")) return;
        drawer.classList.remove("abierto"); overlay.classList.remove("abierto"); drawer.setAttribute("aria-hidden", "true");
    }
    lista.addEventListener("change", contar);
    $("#buscarPermiso").addEventListener("input", e => {
        const q = norm(e.target.value);
        $$("#listaPermisos .permiso-item").forEach(l => l.hidden = !norm(l.textContent).includes(q));
    });
    const marcarTodos = v => { $$("#listaPermisos .permiso-item:not([hidden]) input").forEach(i => i.checked = v); contar(); };
    $("#btnTodos").addEventListener("click", () => marcarTodos(true));
    $("#btnNinguno").addEventListener("click", () => marcarTodos(false));
    ["#btnCerrarPermisos", "#btnCancelarPermisos"].forEach(s => $(s).addEventListener("click", () => cerrarPermisos()));
    overlay.addEventListener("click", () => cerrarPermisos());
    $("#btnGuardarPermisos").addEventListener("click", async function() {
        const ids = marcados().filter(i => i.checked).map(i => Number(i.value));
        this.disabled = true; this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        try {
            const r = await fetch("/usuarios/permisos/" + permisosId, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ids) });
            if (!r.ok) throw new Error();
            cerrarPermisos(true);
            toast("Permisos actualizados correctamente");
        } catch {
            toast("No se pudieron guardar los permisos. Inténtalo de nuevo.", "error");
        } finally {
            this.disabled = false; this.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar permisos';
        }
    });

    /* ---------- Clics en las tarjetas (editar, permisos, eliminar, foto) ---------- */
    $("#gridUsuarios").addEventListener("click", e => {
        const img = e.target.closest(".ver-imagen");
        if (img) { $("#imagenGrande").src = img.dataset.imagen; modalImg.style.display = "flex"; return; }
        const b = e.target.closest("[data-accion]");
        if (!b) return;
        if (b.dataset.accion === "editar") abrirForm({ ...b.dataset });
        else if (b.dataset.accion === "permisos") abrirPermisos(b);
        else if (b.dataset.accion === "eliminar") {
            formEliminar = b.closest("form");
            $("#nombreEliminar").textContent = formEliminar.dataset.nombre || "este usuario";
            modalDel.style.display = "flex";
            setTimeout(() => $("#btnCancelarEliminar").focus(), 50);
        }
    });
    const cerrarImg = () => { modalImg.style.display = "none"; $("#imagenGrande").src = ""; };
    $("#cerrarImagen").addEventListener("click", cerrarImg);
    modalImg.addEventListener("mousedown", e => { if (e.target === modalImg) cerrarImg(); });

    /* ---------- Teclado: "/" busca, Esc cierra lo que esté arriba ---------- */
    document.addEventListener("keydown", e => {
        const escribiendo = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        if (e.key === "/" && !escribiendo) { e.preventDefault(); $("#buscadorUsuarios").focus(); }
        if (e.key !== "Escape") return;
        if (modalImg.style.display === "flex") cerrarImg();
        else if (modalDel.style.display === "flex") cerrarEliminar();
        else if (drawer.classList.contains("abierto")) cerrarPermisos();
        else if (modal.style.display === "flex") cerrarForm();
    });
})();