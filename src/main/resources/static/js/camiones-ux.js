// Se carga DESPUÉS de camiones.js y camiones-extra.js. No modifica su lógica: la complementa y se adelanta a errores comunes.
(() => {
  const $ = id => document.getElementById(id);
  const MAX_MB = 8, ANIO_MAX = new Date().getFullYear() + 1;
  const CLAVE = { vehiculo: c => `${c.marca || ""} ${c.modelo || ""}`, placa: c => c.placa, tipo: c => c.tipo, km: c => c.kilometrajeActual ?? 0 };
  const tb = $("tbodyCamiones"), modal = $("modalNuevoCamion");
  let orden = { k: null, d: 1 }, sucio = false;

  // 1. Esqueleto de carga mientras llegan los datos
  tb.innerHTML = Array(5).fill('<tr class="sk">' + '<td><div class="bar"></div></td>'.repeat(9) + "</tr>").join("");

  // 2. Orden y estados vacíos se actualizan cada vez que se filtra
  function vacio() {
    const td = tb.querySelector("td[colspan]");
    if (!td) return;
    td.innerHTML = listaCamiones.length
      ? '<div class="vacio"><i class="fa-solid fa-filter-circle-xmark"></i><b>Ningún camión coincide</b><span>Prueba con otra placa o quita algún filtro.</span><button type="button" class="btn-clear" data-vacio="limpiar">Limpiar filtros</button></div>'
      : '<div class="vacio"><i class="fa-solid fa-truck-front"></i><b>Aún no hay camiones registrados</b><span>Registra el primero para empezar a controlar la flota.</span><button type="button" class="btn-primary" data-vacio="nuevo"><i class="fa-solid fa-plus"></i> Nuevo camión</button></div>';
  }
  const original = window.aplicarFiltros;
  window.aplicarFiltros = function () {
    if (orden.k) {
      const f = CLAVE[orden.k];
      listaCamiones.sort((a, b) => {
        const x = f(a), y = f(b);
        return (typeof x === "number" ? x - y : String(x || "").localeCompare(String(y || ""), "es", { numeric: true })) * orden.d;
      });
    }
    const r = original.apply(this, arguments);
    vacio();
    return r;
  };

  // 3. Clics: orden por columna, limpiar, estados vacíos
  function limpiar() {
    $("buscarCamion").value = "";
    ["filtroEstado", "filtroTipo", "filtroMarca"].forEach(id => $(id).value = "");
    $("buscarCamion").dispatchEvent(new Event("input"));
  }
  document.addEventListener("click", e => {
    const th = e.target.closest("th[data-sort]");
    if (th && CLAVE[th.dataset.sort]) {
      orden = { k: th.dataset.sort, d: orden.k === th.dataset.sort ? -orden.d : 1 };
      document.querySelectorAll("th[data-sort]").forEach(h => h.classList.remove("asc", "desc"));
      th.classList.add(orden.d === 1 ? "asc" : "desc");
      window.aplicarFiltros();
      return;
    }
    const v = e.target.closest("[data-vacio]");
    if (v) v.dataset.vacio === "limpiar" ? limpiar() : $("btnNuevoCamion").click();
  });
  $("btnLimpiar").addEventListener("click", limpiar);

  // 4. Formulario: validaciones que evitan errores antes de enviar
  $("anio").min = 1980; $("anio").max = ANIO_MAX;
  ["kilometraje", "capacidad"].forEach(id => $(id).min = 0);
  const aviso = $("placaAviso");
  $("placa").addEventListener("input", e => {
    const v = e.target.value = e.target.value.toUpperCase().replace(/\s+/g, "");
    const editando = typeof modoEdicion !== "undefined" && modoEdicion;
    const dup = !!v && listaCamiones.some(c => (c.placa || "").toUpperCase() === v && !(editando && c.id == window.camionEditandoId));
    aviso.hidden = !dup;
    e.target.classList.toggle("invalido", dup);
  });
  $("formCamion").addEventListener("submit", e => {
    $("estado").value = "DISPONIBLE"; // el estado ya no se maneja: todo camión queda disponible
    if (!aviso.hidden) {
      e.preventDefault(); e.stopImmediatePropagation();
      mostrarNotificacion("error", "Placa repetida", "Ya existe un camión con esta placa");
    }
  }, true);

  // Fotos: tipo y tamaño correctos (se revisa antes de que se suban)
  document.addEventListener("change", e => {
    const i = e.target;
    if (!(i.id === "foto" || i.classList.contains("subir-foto")) || !i.files.length) return;
    const mal = [...i.files].find(f => !f.type.startsWith("image/") || f.size > MAX_MB * 1048576);
    if (mal) {
      e.stopImmediatePropagation(); i.value = "";
      mostrarNotificacion("error", "Archivo no válido", `"${mal.name}" debe ser una imagen de máximo ${MAX_MB} MB`);
    }
  }, true);

  // 5. Protección contra pérdida de datos al cerrar el formulario
  const abierto = () => modal.style.display === "flex";
  new MutationObserver(() => { aviso.hidden = true; $("placa").classList.remove("invalido"); sucio = false; })
    .observe(modal, { attributes: true, attributeFilter: ["style"] });
  $("formCamion").addEventListener("input", () => sucio = true);
  const confirmarSalida = () => !sucio || confirm("Hay cambios sin guardar. ¿Cerrar de todos modos?");
  document.addEventListener("click", e => {
    if (!abierto()) return;
    const cierra = e.target === modal || e.target.closest("#modalNuevoCamion .btn-close, #modalNuevoCamion .btn-cancel");
    if (cierra && !confirmarSalida()) e.stopPropagation();
  }, true);

  // 6. Atajos: "/" busca, Esc cierra (primero la imagen grande; el formulario con la misma protección)
  document.addEventListener("keydown", e => {
    const escribiendo = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (e.key === "/" && !escribiendo) { e.preventDefault(); $("buscarCamion").focus(); }
    if (e.key === "Escape") {
      const img = $("modalImagen");
      if (img.style.display === "flex") { img.style.display = "none"; return; }
      if (abierto() && !confirmarSalida()) return;
      document.querySelectorAll(".modal").forEach(m => m.style.display = "none");
    }
  });

  // 7. Señal inestable (patios y carreteras): avisar y recuperar solo
  window.addEventListener("offline", () => mostrarNotificacion("warning", "Sin conexión", "Los cambios no se guardarán hasta recuperar la señal"));
  window.addEventListener("online", () => { mostrarNotificacion("success", "Conexión recuperada", "Datos actualizados"); cargarCamiones(); });
})();