document.addEventListener("DOMContentLoaded", function() {

    const API_URL = "/notas/api";
    const $ = (id) => document.getElementById(id);

    const CATS = {
        OPERATIVA: { n: "Operativa", i: "fa-gears", c: "#4a6a85" },
        VIAJE: { n: "Viaje", i: "fa-route", c: "#b9822a" },
        CAMION: { n: "Camión", i: "fa-truck", c: "#5f7f5a" },
        CONDUCTOR: { n: "Conductor", i: "fa-id-card", c: "#7a6a8f" },
        PERSONAL: { n: "Personal", i: "fa-user", c: "#9a6070" },
        GENERAL: { n: "General", i: "fa-layer-group", c: "#64748b" }
    };

    const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

    let notas = [];
    let editId = null;
    let selCat = "OPERATIVA";
    let filtroCat = "ALL";
    let vista = localStorage.getItem("notas.vista") || "grid";
    let fijadas = new Set(JSON.parse(localStorage.getItem("notas.fijadas") || "[]"));
    const pendientes = new Map();

    /* ---------- utilidades ---------- */
    const hoyStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    const fechaObj = (f) => {
        const p = String(f || "").split("-").map(Number);
        return p.length === 3 ? new Date(p[0], p[1] - 1, p[2]) : null;
    };

    const fechaLarga = (f) => {
        const d = fechaObj(f);
        return d ? d.toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" }) : "--";
    };

    const fechaCorta = (f) => {
        const d = fechaObj(f);
        return d ? `${d.getDate()} ${MESES[d.getMonth()]}` : "--";
    };

    function etiquetaGrupo(f) {
        const d = fechaObj(f);
        if (!d) return "Sin fecha";
        const dias = Math.round((fechaObj(hoyStr()) - d) / 86400000);
        if (dias === 0) return "Hoy";
        if (dias === 1) return "Ayer";
        if (dias > 1 && dias < 7) return d.toLocaleDateString("es-HN", { weekday: "long" });
        return fechaLarga(f);
    }

    const catDe = (t) => {
        const m = String(t || "").match(/^\[([^\]]+)\]/);
        const k = m ? m[1].trim().toUpperCase() : "GENERAL";
        return CATS[k] ? k : "GENERAL";
    };
    const limpio = (t) => String(t || "").replace(/^\[[^\]]+\]\s*/, "").trim();

    const hora = (v) => {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });
    };

    function resaltar(texto, q) {
        const s = esc(texto);
        if (!q) return s;
        const re = new RegExp(`(${esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        return s.replace(re, "<mark>$1</mark>");
    }

    function toast(msg, opts = {}) {
        const t = document.createElement("div");
        t.className = "toast" + (opts.error ? " error" : "");
        t.innerHTML = `<span>${esc(msg)}</span>`;
        if (opts.undo) {
            const b = document.createElement("button");
            b.textContent = "Deshacer";
            b.onclick = () => { opts.undo(); t.remove(); };
            t.appendChild(b);
        }
        $("toasts").appendChild(t);
        setTimeout(() => t.remove(), opts.ms || 4000);
    }

    /* ---------- tema y vista ---------- */
    function aplicarTema(t) {
        document.documentElement.dataset.theme = t;
        $("btnTema").innerHTML = `<i class="fas fa-${t === "dark" ? "sun" : "moon"}"></i>`;
        localStorage.setItem("notas.tema", t);
    }
    aplicarTema(localStorage.getItem("notas.tema") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    $("btnTema").onclick = () => aplicarTema(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

    function aplicarVista(v) {
        vista = v;
        $("notesList").className = "notes " + v;
        $("vGrid").classList.toggle("on", v === "grid");
        $("vList").classList.toggle("on", v === "list");
        localStorage.setItem("notas.vista", v);
    }
    $("vGrid").onclick = () => aplicarVista("grid");
    $("vList").onclick = () => aplicarVista("list");
    aplicarVista(vista);

    /* ---------- saludo ---------- */
    (function saludo() {
        const h = new Date().getHours();
        $("saludo").textContent = h < 12 ? "Buenos días ☀️" : h < 19 ? "Buenas tardes 👋" : "Buenas noches 🌙";
        $("fechaHoy").textContent = new Date().toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "long" });
    })();

    /* ---------- sidebar ---------- */
    function pintarNav() {
        const cuenta = (k) => notas.filter((n) => catDe(n.titulo) === k).length;
        let h = `<button class="nav-item ${filtroCat === "ALL" ? "on" : ""}" data-cat="ALL"><i class="fas fa-inbox"></i>Todas<em>${notas.length}</em></button>
                 <button class="nav-item ${filtroCat === "PIN" ? "on" : ""}" data-cat="PIN" style="--c:#b9822a"><i class="fas fa-thumbtack"></i>Fijadas<em>${notas.filter((n) => fijadas.has(String(n.id))).length}</em></button>
                 <div class="nav-sep"></div>`;
        Object.entries(CATS).forEach(([k, v]) => {
            h += `<button class="nav-item ${filtroCat === k ? "on" : ""}" data-cat="${k}" style="--c:${v.c}"><i class="fas ${v.i}"></i>${v.n}<em>${cuenta(k)}</em></button>`;
        });
        $("nav").innerHTML = h;
        $("nav").querySelectorAll(".nav-item").forEach((b) => b.onclick = () => {
            filtroCat = b.dataset.cat;
            cerrarMenu();
            render();
        });
    }

    const cerrarMenu = () => { $("side").classList.remove("open"); $("scrim").classList.remove("show"); };
    $("btnMenu").onclick = () => { $("side").classList.add("open"); $("scrim").classList.add("show"); };
    $("scrim").onclick = cerrarMenu;

    /* ---------- render ---------- */
    function filtradas() {
        const q = $("buscarNota").value.trim().toLowerCase();
        const f = $("fechaFiltro").value;
        return notas.filter((n) => {
            const k = catDe(n.titulo);
            if (filtroCat === "PIN" && !fijadas.has(String(n.id))) return false;
            if (filtroCat !== "ALL" && filtroCat !== "PIN" && k !== filtroCat) return false;
            if (f && String(n.fecha) !== f) return false;
            return !q || limpio(n.titulo).toLowerCase().includes(q) || String(n.contenido || "").toLowerCase().includes(q);
        });
    }

    function tarjeta(n, q, i) {
        const k = catDe(n.titulo), c = CATS[k], pin = fijadas.has(String(n.id));
        const h = n.createdAt ? hora(n.createdAt) : "";
        return `<article class="note-card ${pin ? "pinned" : ""}" style="--c:${c.c};animation-delay:${Math.min(i, 12) * 30}ms" data-id="${esc(n.id)}">
            <div class="note-top">
                <span class="chip"><i class="fas ${c.i}"></i>${c.n}</span>
                <div class="note-actions">
                    <button class="pin ${pin ? "on" : ""}" data-a="pin" title="${pin ? "Quitar de fijadas" : "Fijar"}"><i class="fas fa-thumbtack"></i></button>
                    <button data-a="edit" title="Editar"><i class="fas fa-pen"></i></button>
                    <button class="delete" data-a="del" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <h3>${resaltar(limpio(n.titulo), q)}</h3>
            <p>${resaltar(n.contenido, q)}</p>
            <div class="note-foot">
                <span><i class="far fa-calendar"></i>${fechaCorta(n.fecha)}</span>
                ${h ? `<span><i class="far fa-clock"></i>${h}</span>` : ""}
                <span style="margin-left:auto">${String(n.contenido || "").length} car.</span>
            </div>
        </article>`;
    }

    function render() {
        pintarNav();
        actualizarResumen();

        const q = $("buscarNota").value.trim();
        const lista = filtradas().sort((a, b) => {
            const pa = fijadas.has(String(a.id)) ? 1 : 0, pb = fijadas.has(String(b.id)) ? 1 : 0;
            if (pa !== pb) return pb - pa;
            const fa = String(a.fecha || ""), fb = String(b.fecha || "");
            return fa !== fb ? fb.localeCompare(fa) : String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        });

        $("tituloLista").textContent = filtroCat === "ALL" ? "Todas las notas" : filtroCat === "PIN" ? "Notas fijadas" : CATS[filtroCat].n;
        $("contadorNotas").textContent = lista.length === 1 ? "1 nota" : `${lista.length} notas`;
        $("btnLimpiarFiltros").hidden = !(q || $("fechaFiltro").value || filtroCat !== "ALL");

        const vacio = lista.length === 0;
        $("emptyState").hidden = !vacio;
        $("notesList").hidden = vacio;
        if (vacio) {
            const hayFiltro = notas.length > 0;
            $("emptyTitulo").textContent = hayFiltro ? "Sin resultados" : "Aún no hay notas";
            $("emptyTexto").textContent = hayFiltro ? "Prueba con otra búsqueda, fecha o categoría." : "Crea la primera y empieza a organizar la operación.";
            return;
        }

        let html = "", grupo = null, i = 0;
        const fijas = lista.filter((n) => fijadas.has(String(n.id)));
        if (fijas.length) {
            html += `<div class="group-title"><i class="fas fa-thumbtack"></i> Fijadas</div>`;
            fijas.forEach((n) => html += tarjeta(n, q, i++));
        }
        lista.filter((n) => !fijadas.has(String(n.id))).forEach((n) => {
            const g = etiquetaGrupo(n.fecha);
            if (g !== grupo) { grupo = g; html += `<div class="group-title">${esc(g)}</div>`; }
            html += tarjeta(n, q, i++);
        });
        $("notesList").innerHTML = html;
    }

    $("notesList").addEventListener("click", (e) => {
        const card = e.target.closest(".note-card");
        if (!card) return;
        const id = card.dataset.id, btn = e.target.closest("button[data-a]");
        const a = btn ? btn.dataset.a : "edit";
        if (a === "pin") alternarPin(id);
        else if (a === "del") eliminar(id);
        else ver(id);
    });

    function actualizarResumen() {
        $("totalNotas").textContent = notas.length;
        $("notasHoy").textContent = notas.filter((n) => String(n.fecha) === hoyStr()).length;
        $("totalFijadas").textContent = notas.filter((n) => fijadas.has(String(n.id))).length;
        const ult = [...notas].sort((a, b) => String(b.createdAt || b.fecha || "").localeCompare(String(a.createdAt || a.fecha || "")))[0];
        $("ultimaNota").textContent = ult ? fechaCorta(ult.fecha) : "--";
    }

    function alternarPin(id) {
        id = String(id);
        fijadas.has(id) ? fijadas.delete(id) : fijadas.add(id);
        localStorage.setItem("notas.fijadas", JSON.stringify([...fijadas]));
        render();
    }

    /* ---------- panel editor ---------- */
    function pintarCats() {
        $("catPicker").innerHTML = Object.entries(CATS).map(([k, v]) =>
            `<button type="button" class="cat-opt ${k === selCat ? "on" : ""}" data-k="${k}" style="--c:${v.c}"><i class="fas ${v.i}"></i>${v.n}</button>`).join("");
        $("catPicker").querySelectorAll(".cat-opt").forEach((b) => b.onclick = () => { selCat = b.dataset.k; pintarCats(); });
    }

    function contador() {
        const n = $("notaContenido").value.length;
        $("contadorCaracteres").textContent = n;
        $("barra").style.width = (n / 2000 * 100) + "%";
        $("barra").style.background = n > 1800 ? "#e11d48" : "";
    }

    function abrir() {
        $("notaModal").classList.add("show");
        $("overlay").classList.add("show");
        $("notaModal").setAttribute("aria-hidden", "false");
        document.body.classList.add("lock");
        pintarCats();
        contador();
        setTimeout(() => $("notaTitulo").focus(), 250);
    }

    function cerrar() {
        $("notaModal").classList.remove("show");
        $("overlay").classList.remove("show");
        $("notaModal").setAttribute("aria-hidden", "true");
        document.body.classList.remove("lock");
        editId = null;
    }

    function nueva() {
        editId = null;
        $("modalTitle").textContent = "Nueva nota";
        $("notaForm").reset();
        $("notaFecha").value = hoyStr();
        selCat = filtroCat in CATS ? filtroCat : "OPERATIVA";
        abrir();
    }

    function editar(id) {
        const n = notas.find((x) => String(x.id) === String(id));
        if (!n) return toast("No se encontró la nota.", { error: true });
        editId = n.id;
        $("modalTitle").textContent = "Editar nota";
        $("notaFecha").value = n.fecha || "";
        $("notaTitulo").value = limpio(n.titulo);
        $("notaContenido").value = n.contenido || "";
        selCat = catDe(n.titulo);
        abrir();
    }

    async function guardar(e) {
        e.preventDefault();
        const titulo = $("notaTitulo").value.trim(), contenido = $("notaContenido").value.trim(), fecha = $("notaFecha").value;
        if (!fecha || !titulo || !contenido) return toast("Completa fecha, título y contenido.", { error: true });

        const btn = $("btnGuardar");
        btn.disabled = true;
        const body = JSON.stringify({ fecha, titulo: `[${selCat}] ${titulo}`, contenido });

        try {
            const r = await fetch(editId !== null ? `${API_URL}/${editId}` : API_URL, {
                method: editId !== null ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body
            });
            if (!r.ok) throw new Error((await r.text().catch(() => "")) || "No se pudo guardar la nota.");
            const editando = editId !== null;
            cerrar();
            await cargar();
            toast(editando ? "Nota actualizada ✓" : "Nota creada ✓");
        } catch (err) {
            console.error(err);
            toast(err.message, { error: true });
        } finally {
            btn.disabled = false;
        }
    }

    /* ---------- lectura completa ---------- */
    let verId = null;

    function ver(id) {
        const n = notas.find((x) => String(x.id) === String(id));
        if (!n) return;
        verId = n.id;
        const c = CATS[catDe(n.titulo)], pin = fijadas.has(String(n.id)), h = n.createdAt ? hora(n.createdAt) : "";
        $("vistaNota").style.setProperty("--c", c.c);
        $("vChip").innerHTML = `<i class="fas ${c.i}"></i>${c.n}`;
        $("vTitulo").textContent = limpio(n.titulo);
        $("vMeta").innerHTML = `<span><i class="far fa-calendar"></i>${esc(fechaLarga(n.fecha))}</span>` +
            (h ? `<span><i class="far fa-clock"></i>${esc(h)}</span>` : "") +
            `<span><i class="fas fa-font"></i>${String(n.contenido || "").length} caracteres</span>`;
        $("vContenido").textContent = n.contenido || "";
        $("vPin").innerHTML = `<i class="fas fa-thumbtack"></i> ${pin ? "Quitar fijada" : "Fijar"}`;
        $("vistaNota").classList.add("show");
        $("vistaNota").setAttribute("aria-hidden", "false");
        $("overlay").classList.add("show");
        document.body.classList.add("lock");
    }

    function cerrarVista() {
        $("vistaNota").classList.remove("show");
        $("vistaNota").setAttribute("aria-hidden", "true");
        if (!$("notaModal").classList.contains("show")) {
            $("overlay").classList.remove("show");
            document.body.classList.remove("lock");
        }
        verId = null;
    }

    /* ---------- eliminar con deshacer ---------- */
    function eliminar(id) {
        const idx = notas.findIndex((x) => String(x.id) === String(id));
        if (idx < 0) return;
        const nota = notas[idx];
        notas.splice(idx, 1);
        render();

        const timer = setTimeout(() => borrarServidor(id), 5000);
        pendientes.set(String(id), timer);

        toast("Nota eliminada", {
            ms: 5000,
            undo: () => {
                clearTimeout(timer);
                pendientes.delete(String(id));
                notas.splice(idx, 0, nota);
                render();
            }
        });
    }

    async function borrarServidor(id, keepalive) {
        pendientes.delete(String(id));
        try {
            const r = await fetch(`${API_URL}/${id}`, { method: "DELETE", keepalive: !!keepalive });
            if (!r.ok) throw new Error();
            fijadas.delete(String(id));
            localStorage.setItem("notas.fijadas", JSON.stringify([...fijadas]));
        } catch {
            toast("No se pudo eliminar en el servidor.", { error: true });
            cargar();
        }
    }

    window.addEventListener("pagehide", () => {
        pendientes.forEach((t, id) => { clearTimeout(t); borrarServidor(id, true); });
    });

    /* ---------- carga ---------- */
    async function cargar() {
        try {
            const r = await fetch(API_URL, { headers: { Accept: "application/json" } });
            if (!r.ok) throw new Error(`Error HTTP ${r.status}`);
            const d = await r.json();
            notas = (Array.isArray(d) ? d : []).filter((n) => !pendientes.has(String(n.id)));
            render();
        } catch (err) {
            console.error("Error cargando notas:", err);
            notas = [];
            render();
            $("emptyTitulo").textContent = "No se pudieron cargar las notas";
            $("emptyTexto").textContent = "Verifica la conexión con el servidor e inténtalo de nuevo.";
            toast("Error al cargar las notas", { error: true });
        }
    }

    /* ---------- eventos ---------- */
    ["btnNuevaNota", "btnNuevaNotaEmpty", "btnFab"].forEach((id) => $(id).onclick = () => { cerrarMenu(); nueva(); });
    $("btnCerrarModal").onclick = cerrar;
    $("btnCancelarNota").onclick = cerrar;
    $("overlay").onclick = () => { cerrar(); cerrarVista(); };
    $("vCerrar").onclick = cerrarVista;
    $("vEditar").onclick = () => { const id = verId; cerrarVista(); editar(id); };
    $("vEliminar").onclick = () => { const id = verId; cerrarVista(); eliminar(id); };
    $("vPin").onclick = () => { const id = verId; alternarPin(id); ver(id); };
    $("notaForm").addEventListener("submit", guardar);
    $("notaContenido").addEventListener("input", contador);
    $("buscarNota").addEventListener("input", render);
    $("fechaFiltro").addEventListener("change", render);
    $("btnLimpiarFiltros").onclick = () => {
        $("buscarNota").value = "";
        $("fechaFiltro").value = "";
        filtroCat = "ALL";
        render();
    };

    document.addEventListener("keydown", (e) => {
        const enCampo = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        const abierto = $("notaModal").classList.contains("show");
        if (e.key === "Escape") { if (abierto) cerrar(); else if ($("vistaNota").classList.contains("show")) cerrarVista(); else cerrarMenu(); }
        else if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && abierto) $("notaForm").requestSubmit();
        else if (!enCampo && !abierto && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (e.key === "/") { e.preventDefault(); $("buscarNota").focus(); }
            else if (e.key.toLowerCase() === "n") { e.preventDefault(); nueva(); }
        }
    });

    $("notesList").innerHTML = Array(6).fill('<div class="skel"></div>').join("");
    cargar();
});