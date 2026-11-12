/* =========================================================
   TRANSPORTES CHC · Combustible dentro de Programación de Viajes
   Cargar DESPUÉS de reporteDiario.js:
   <script src="/js/viaje-combustible.js"></script>

   Qué hace:
   1. Agrega al modal "Registrar viaje" los campos Combustible y
      Gasolinera, con el estimado de galones y costo.
   2. Envía esos datos al guardar/editar el viaje, para que el
      backend registre el abastecimiento automáticamente.
   3. Muestra el aviso que devuelve el servidor.
========================================================= */
document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    const GASOLINERAS = ["Shell", "Texaco", "Puma", "UNO", "Otra"];

    const form = document.getElementById("formViaje");
    const modal = document.getElementById("modalViaje");

    if (!form || !modal) {
        return;
    }

    let combustibles = [];
    let destinos = [];

    /* ---------- utilidades ---------- */

    function normalizar(t) {
        return String(t || "")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ").trim().toLowerCase();
    }

    function numero(n) {
        return Number(n || 0).toLocaleString("es-HN", {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });
    }

    function campo(nombre) {
        return form.querySelector('[name="' + nombre + '"]');
    }

    /* Misma regla que usa el backend para unir ruta y destino */
    function buscarDestino(nombreViaje) {

        const buscado = normalizar(nombreViaje);

        if (!buscado) { return null; }

        const nombre = d => normalizar(d.destino || d.nombre || d.nombreDestino);

        let d = destinos.find(x => nombre(x) === buscado);
        if (d) { return d; }

        const partes = buscado.split(/\s*[-–→>]\s*/);
        const ultimo = partes[partes.length - 1].trim();

        d = destinos.find(x => nombre(x) === ultimo);
        if (d) { return d; }

        let mejor = null;

        destinos.forEach(x => {
            const n = nombre(x);
            if (n && buscado.includes(n) && (!mejor || n.length > nombre(mejor).length)) {
                mejor = x;
            }
        });

        return mejor;
    }

    /* ---------- aviso propio ---------- */

    function aviso(texto, tipo) {

        const el = document.createElement("div");

        el.setAttribute("role", "status");
        el.textContent = texto;

        Object.assign(el.style, {
            position: "fixed", top: "84px", right: "20px", zIndex: "999999",
            width: "min(460px, calc(100vw - 40px))",
            padding: "14px 18px", borderRadius: "6px",
            borderLeft: "5px solid " + (tipo === "aviso" ? "#c99700" : "#1f8a5b"),
            background: tipo === "aviso" ? "#fff3c6" : "#dcf1e6",
            color: tipo === "aviso" ? "#6b5200" : "#17583b",
            boxShadow: "0 10px 30px rgba(0,0,0,.2)",
            fontSize: "14px", fontWeight: "500"
        });

        document.body.appendChild(el);
        setTimeout(() => el.remove(), 6000);
    }

    /* ---------- bloque en el modal ---------- */

    const bloque = document.createElement("div");

    bloque.className = "bloque-combustible";
    bloque.innerHTML = `
        <h6><i class="fa-solid fa-gas-pump"></i> Combustible del viaje</h6>

        <div class="fila-form">
            <div class="campo-form">
                <label for="combustibleViaje">Tipo de combustible</label>
                <select id="combustibleViaje" class="campo-input"></select>
            </div>
            <div class="campo-form">
                <label for="gasolineraViaje">Gasolinera</label>
                <select id="gasolineraViaje" class="campo-input">
                    <option value="">Por definir (se guarda como Otra)</option>
                    ${GASOLINERAS.map(g => `<option value="${g}">${g}</option>`).join("")}
                </select>
            </div>
        </div>

        <div id="estimadoCombustible" class="estimado-combustible">
            Elija el destino final para calcular el combustible.
        </div>

        <small style="display:block;margin-top:8px;color:#5b6877">
            Al guardar, el abastecimiento se registra solo con los km y galones
            del destino y el precio vigente.
        </small>
    `;

    const cuerpo = form.querySelector(".modal-body");

    if (cuerpo) {
        cuerpo.appendChild(bloque);
    }

    const selCombustible = bloque.querySelector("#combustibleViaje");
    const selGasolinera = bloque.querySelector("#gasolineraViaje");
    const estimado = bloque.querySelector("#estimadoCombustible");

    /* ---------- datos ---------- */

    async function cargarCatalogos() {

        try {

            const [rc, rd] = await Promise.all([
                fetch("/api/combustibles/activos", { headers: { Accept: "application/json" } }),
                fetch("/api/destinos", { headers: { Accept: "application/json" } })
            ]);

            combustibles = rc.ok ? await rc.json() : [];
            destinos = rd.ok ? await rd.json() : [];

        } catch (e) {
            console.warn("No se pudieron cargar combustibles o destinos:", e);
        }

        selCombustible.innerHTML = combustibles
            .map(c => `<option value="${c.id}">${c.nombre} · L. ${numero(c.precioGalon)}/gal</option>`)
            .join("");

        seleccionarDiesel();
        actualizarEstimado();
    }

    function seleccionarDiesel() {

        const diesel = combustibles.find(c => normalizar(c.nombre).includes("diesel"));

        if (diesel) {
            selCombustible.value = String(diesel.id);
        }
    }

    function actualizarEstimado() {

        const destinoFinal = campo("destinoFinal");
        const nombre = destinoFinal ? destinoFinal.value : "";

        estimado.classList.remove("aviso");

        if (!nombre) {
            estimado.textContent = "Elija el destino final para calcular el combustible.";
            return;
        }

        const destino = buscarDestino(nombre);

        if (!destino) {
            estimado.classList.add("aviso");
            estimado.textContent =
                "Este destino no tiene km ni galones en la pestaña Destinos. " +
                "El viaje se guardará sin combustible.";
            return;
        }

        const galones = Number(destino.galones || 0);
        const km = Number(destino.km || destino.kilometros || 0);
        const comb = combustibles.find(c => String(c.id) === selCombustible.value);
        const precio = comb ? Number(comb.precioGalon || 0) : 0;

        estimado.innerHTML =
            `<span>Ruta<strong>${numero(km)} km</strong></span>` +
            `<span>Galones<strong>${numero(galones)}</strong></span>` +
            `<span>Costo estimado<strong>L. ${numero(galones * precio)}</strong></span>`;
    }

    /* ---------- al abrir el modal ---------- */

    modal.addEventListener("show.bs.modal", async function () {

        selGasolinera.value = "";
        seleccionarDiesel();
        actualizarEstimado();

        const idInput = form.querySelector('[name="id"]');
        const id = idInput ? idInput.value : "";

        if (!id) {
            return;
        }

        /* Edición: traer el combustible y la gasolinera ya registrados */
        try {

            const rv = await fetch("/programaciones/" + encodeURIComponent(id),
                { headers: { Accept: "application/json" }, cache: "no-store" });

            if (!rv.ok) { return; }

            const viaje = await rv.json();

            if (!viaje.abastecimientoId) { return; }

            const ra = await fetch("/api/abastecimientos/" + viaje.abastecimientoId,
                { headers: { Accept: "application/json" }, cache: "no-store" });

            if (!ra.ok) { return; }

            const abast = await ra.json();

            const combId = abast.combustibleId || (abast.combustible && abast.combustible.id);

            if (combId) { selCombustible.value = String(combId); }
            if (abast.gasolinera) { selGasolinera.value = abast.gasolinera; }

            actualizarEstimado();

        } catch (e) {
            console.warn("No se pudo cargar el combustible del viaje:", e);
        }
    });

    form.addEventListener("change", function (e) {
        if (e.target && (e.target.name === "destinoFinal" || e.target === selCombustible)) {
            actualizarEstimado();
        }
    });

    /* ---------- envío: agrega los datos y lee el aviso ---------- */

    const fetchOriginal = window.fetch.bind(window);

    window.fetch = async function (url, opciones) {

        const ruta = typeof url === "string" ? url : (url && url.url) || "";
        const metodo = ((opciones && opciones.method) || "GET").toUpperCase();

        const esGuardado =
            (metodo === "POST" && ruta.indexOf("/programaciones/guardar") !== -1) ||
            (metodo === "PUT" && ruta.indexOf("/programaciones/editar/") !== -1);

        if (!esGuardado) {
            return fetchOriginal(url, opciones);
        }

        try {

            const datos = JSON.parse(opciones.body);

            datos.combustibleId = selCombustible.value ? Number(selCombustible.value) : null;
            datos.gasolinera = selGasolinera.value || null;

            opciones = Object.assign({}, opciones, { body: JSON.stringify(datos) });

        } catch (e) {
            console.warn("No se pudo agregar el combustible al viaje:", e);
        }

        const respuesta = await fetchOriginal(url, opciones);

        if (respuesta.ok) {

            respuesta.clone().json().then(function (viaje) {

                if (viaje && viaje.avisoCombustible) {
                    aviso(viaje.avisoCombustible, "aviso");
                } else if (viaje && viaje.abastecimientoId) {
                    aviso("Combustible registrado automáticamente para este viaje.", "ok");
                }

            }).catch(function () { /* sin cuerpo JSON */ });
        }

        return respuesta;
    };

    cargarCatalogos();
});