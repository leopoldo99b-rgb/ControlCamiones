document.addEventListener("DOMContentLoaded", function () {

    // ============================================================
    // CONFIGURACIÓN
    // ============================================================

    const API_COMBUSTIBLES = "/api/combustibles";
    const API_ABASTECIMIENTOS = "/api/abastecimientos";
    const API_DESTINOS = "/api/destinos";
    const API_CAMIONES = "/viajes2/camiones";
    const API_CONDUCTORES = "/conductores/api";


    // ============================================================
    // ELEMENTOS - MODAL ABASTECIMIENTO
    // ============================================================

    const modalCombustible = document.getElementById("modalCombustible");
    const destinoSelect = document.getElementById("destinoCombustible");
    const kmRuta = document.getElementById("kmRuta");
    const galonesRuta = document.getElementById("galonesRuta");
    const galonesInput = document.getElementById("galonesInput");
    const tipoCombustible = document.getElementById("tipoCombustible");
    const precioAplicado = document.getElementById("precioAplicado");
    const totalAbastecimiento = document.getElementById("totalAbastecimiento");
    const unidadSelect = document.getElementById("unidadCombustible");
    const gasolineraSelect = document.getElementById("gasolineraCombustible");
    const fechaInput = document.getElementById("fechaCombustible");

    // MOTORISTA: ahora es un <input> con <datalist> (elegir o escribir)
    const motoristaSelect = document.getElementById("motoristaCombustible");
    const listaMotoristas = document.getElementById("listaMotoristas");

    // TOTAL EDITABLE
    const chkEditarTotal = document.getElementById("chkEditarTotal");
    const grupoTotalManual = document.getElementById("grupoTotalManual");
    const totalManualInput = document.getElementById("totalManualInput");


    // ============================================================
    // ELEMENTOS - MODAL EDITAR PRECIO
    // ============================================================

    const modalPrecio = document.getElementById("modalPrecio");
    const combustiblePrecioSeleccionado = document.getElementById("combustiblePrecioSeleccionado");
    const nuevoPrecio = document.getElementById("nuevoPrecio");
    const btnGuardarPrecio = document.getElementById("btnGuardarPrecio");


    // ============================================================
    // ELEMENTOS DE LA VISTA
    // ============================================================

    const tablaBody = document.querySelector(".fuel-table tbody");
    const btnRegistrar = document.getElementById("btnGuardarAbastecimiento");
    const btnBuscar = document.getElementById("btnBuscar");
    const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");
    const btnExportar = document.getElementById("btnExportar");


    // ============================================================
    // FILTROS
    // ============================================================

    const fechaDesde = document.getElementById("fechaDesde");
    const fechaHasta = document.getElementById("fechaHasta");
    const filtroPlaca = document.getElementById("filtroPlaca");
    const filtroMotorista = document.getElementById("filtroMotorista");
    const filtroCombustible = document.getElementById("filtroCombustible");
    const filtroGasolinera = document.getElementById("filtroGasolinera");


    // ============================================================
    // VARIABLES
    // ============================================================

    let combustibles = [];
    let destinos = [];
    let abastecimientos = [];
    let editandoId = null;


    // ============================================================
    // INICIALIZAR
    // ============================================================

    inicializar();

    async function inicializar() {

        try {

            mostrarCargando();

            await cargarCombustibles();
            await cargarDestinos();
            await cargarCamiones();
            await cargarConductores();
            await cargarAbastecimientos();

            establecerFechaActual();
            actualizarResumen();

        } catch (error) {

            console.error("Error al inicializar:", error);

            mostrarError(
                error.message ||
                "No fue posible cargar la información del sistema."
            );
        }
    }


    // ============================================================
    // CARGAR COMBUSTIBLES
    // ============================================================

    async function cargarCombustibles() {

        const response = await fetch(API_COMBUSTIBLES + "/activos", {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {

            const error = await obtenerRespuesta(response);

            throw new Error(
                error?.message ||
                error?.error ||
                "Error al obtener combustibles."
            );
        }

        const datos = await response.json();

        if (!Array.isArray(datos)) {
            throw new Error("La API de combustibles no devolvió una lista válida.");
        }

        combustibles = datos;

        llenarComboCombustibles();
        actualizarTarjetasPrecios();
        actualizarFiltroCombustibles();
    }


    // ============================================================
    // LLENAR COMBO COMBUSTIBLES
    // ============================================================

    function llenarComboCombustibles() {

        if (!tipoCombustible) {
            return;
        }

        tipoCombustible.innerHTML = `
            <option value="" selected disabled>
                Seleccionar combustible
            </option>
        `;

        combustibles.forEach(function (combustible) {

            if (!combustible) {
                return;
            }

            const option = document.createElement("option");

            option.value = combustible.id ?? "";
            option.textContent = combustible.nombre ?? "Sin nombre";
            option.dataset.precio = combustible.precioGalon ?? 0;

            tipoCombustible.appendChild(option);
        });
    }


    // ============================================================
    // TARJETAS DE PRECIOS
    // ============================================================

    function actualizarTarjetasPrecios() {

        const precioDiesel = document.getElementById("precioDiesel");
        const precioRegular = document.getElementById("precioRegular");
        const precioSuper = document.getElementById("precioSuper");

        const diesel = buscarCombustible("diesel");
        const regular = buscarCombustible("regular");
        const superCombustible = buscarCombustible("super");

        if (diesel && precioDiesel) {
            precioDiesel.textContent = formatearNumero(diesel.precioGalon);
        }

        if (regular && precioRegular) {
            precioRegular.textContent = formatearNumero(regular.precioGalon);
        }

        if (superCombustible && precioSuper) {
            precioSuper.textContent = formatearNumero(superCombustible.precioGalon);
        }

        const ultimaActualizacion = document.getElementById("ultimaActualizacion");

        if (ultimaActualizacion) {

            const fechas = combustibles
                .map(c => c?.fechaActualizacion)
                .filter(Boolean);

            if (fechas.length > 0) {

                const fechaMasReciente = fechas.sort().reverse()[0];
                const fecha = formatearFecha(fechaMasReciente);

                ultimaActualizacion.textContent = `${fecha.fecha} ${fecha.hora}`;
            }
        }
    }


    // ============================================================
    // BUSCAR COMBUSTIBLE
    // ============================================================

    function buscarCombustible(tipo) {

        const texto = normalizarTexto(tipo);

        return combustibles.find(function (combustible) {

            if (!combustible) {
                return false;
            }

            const nombre = normalizarTexto(combustible.nombre);

            if (texto === "super") return nombre.includes("super");
            if (texto === "regular") return nombre.includes("regular");
            if (texto === "diesel") return nombre.includes("diesel");

            return nombre.includes(texto);
        });
    }


    // ============================================================
    // EDITAR PRECIO DE COMBUSTIBLE (tarjetas)
    // ============================================================

    document.querySelectorAll(".btn-edit-price").forEach(function (button) {

        button.addEventListener("click", function () {

            const combustible = buscarCombustible(this.dataset.fuel);

            if (!combustible) {
                mostrarAdvertencia("No se encontró el combustible seleccionado.");
                return;
            }

            if (!modalPrecio) {
                mostrarError("No se encontró el modal para editar el precio.");
                return;
            }

            modalPrecio.dataset.combustibleId = String(combustible.id);
            modalPrecio.dataset.combustibleNombre = combustible.nombre;

            if (combustiblePrecioSeleccionado) {
                combustiblePrecioSeleccionado.textContent = combustible.nombre;
            }

            if (nuevoPrecio) {
                nuevoPrecio.value = combustible.precioGalon ?? "";
            }
        });
    });


    // ============================================================
    // GUARDAR NUEVO PRECIO
    // ============================================================

    if (btnGuardarPrecio) {

        btnGuardarPrecio.addEventListener("click", async function () {

            const id = modalPrecio?.dataset?.combustibleId;
            const nombre = modalPrecio?.dataset?.combustibleNombre || "combustible";
            const precio = parseFloat(nuevoPrecio?.value);

            if (!id) {
                mostrarAdvertencia("No se pudo identificar el combustible que desea editar.");
                return;
            }

            if (isNaN(precio) || precio <= 0) {

                mostrarAdvertencia("Ingrese un precio válido mayor que cero.");

                if (nuevoPrecio) {
                    nuevoPrecio.focus();
                }

                return;
            }

            const textoOriginal = btnGuardarPrecio.innerHTML;

            btnGuardarPrecio.disabled = true;
            btnGuardarPrecio.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Guardando...
            `;

            try {

                const response = await fetch(`${API_COMBUSTIBLES}/${id}/precio`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ precioGalon: precio })
                });

                const resultado = await obtenerRespuesta(response);

                if (!response.ok) {
                    throw new Error(
                        resultado?.message ||
                        resultado?.error ||
                        "No fue posible actualizar el precio."
                    );
                }

                const indice = combustibles.findIndex(
                    c => String(c.id) === String(id)
                );

                if (indice !== -1) {

                    combustibles[indice].precioGalon = precio;

                    if (resultado?.fechaActualizacion) {
                        combustibles[indice].fechaActualizacion = resultado.fechaActualizacion;
                    }
                }

                actualizarTarjetasPrecios();
                llenarComboCombustibles();

                if (typeof bootstrap !== "undefined" && modalPrecio) {
                    bootstrap.Modal.getOrCreateInstance(modalPrecio).hide();
                }

                limpiarModalPrecio();

                mostrarExito(`El precio de ${nombre} fue actualizado correctamente.`);

            } catch (error) {

                console.error("Error al actualizar precio:", error);

                mostrarError(
                    error.message ||
                    "No fue posible actualizar el precio."
                );

            } finally {

                btnGuardarPrecio.disabled = false;
                btnGuardarPrecio.innerHTML = textoOriginal;
            }
        });
    }


    // ============================================================
    // LIMPIAR MODAL PRECIO
    // ============================================================

    function limpiarModalPrecio() {

        if (modalPrecio) {
            delete modalPrecio.dataset.combustibleId;
            delete modalPrecio.dataset.combustibleNombre;
        }

        if (combustiblePrecioSeleccionado) {
            combustiblePrecioSeleccionado.textContent = "—";
        }

        if (nuevoPrecio) {
            nuevoPrecio.value = "";
        }
    }

    if (modalPrecio) {
        modalPrecio.addEventListener("hidden.bs.modal", limpiarModalPrecio);
    }


    // ============================================================
    // CARGAR DESTINOS
    // ============================================================

    async function cargarDestinos() {

        const response = await fetch(API_DESTINOS, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {

            const error = await obtenerRespuesta(response);

            throw new Error(
                error?.message ||
                error?.error ||
                `Error al obtener destinos. HTTP ${response.status}`
            );
        }

        const datos = await response.json();

        if (!Array.isArray(datos)) {
            throw new Error("La API de destinos no devolvió una lista válida.");
        }

        destinos = datos;

        llenarComboDestinos();
    }

    function llenarComboDestinos() {

        if (!destinoSelect) {
            return;
        }

        destinoSelect.innerHTML = `
            <option value="" selected disabled>
                Seleccionar destino
            </option>
        `;

        destinos.forEach(function (destino) {

            if (!destino) {
                return;
            }

            const option = document.createElement("option");

            option.value = destino.id ?? "";
            option.textContent = destino.destino ?? "Sin nombre";
            option.dataset.km = destino.km ?? "";
            option.dataset.galones = destino.galones ?? "";

            destinoSelect.appendChild(option);
        });
    }


    // ============================================================
    // CAMBIO DE DESTINO
    // ============================================================

    if (destinoSelect) {

        destinoSelect.addEventListener("change", function () {

            const option = this.options[this.selectedIndex];

            if (!option) {
                return;
            }

            const km = option.dataset.km;
            const galones = option.dataset.galones;

            const tieneKm = km !== undefined && km !== null && km !== "";
            const tieneGalones = galones !== undefined && galones !== null && galones !== "";

            if (kmRuta) {
                kmRuta.textContent = tieneKm ? formatearNumero(km) + " km" : "— km";
            }

            if (galonesRuta) {
                galonesRuta.textContent = tieneGalones ? formatearNumero(galones) + " gal" : "— gal";
            }

            if (galonesInput) {
                galonesInput.value = tieneGalones ? Number(galones).toFixed(2) : "";
            }

            calcularTotal();
        });
    }


    // ============================================================
    // CAMBIO DE COMBUSTIBLE
    // ============================================================

    if (tipoCombustible) {

        tipoCombustible.addEventListener("change", function () {

            const option = this.options[this.selectedIndex];

            if (!option) {
                return;
            }

            const precio = parseFloat(option.dataset.precio) || 0;

            if (precioAplicado) {
                precioAplicado.textContent = precio.toFixed(2);
            }

            calcularTotal();
        });
    }


    // ============================================================
    // CAMBIO DE GALONES
    // ============================================================

    if (galonesInput) {
        galonesInput.addEventListener("input", calcularTotal);
    }


    // ============================================================
    // TOTAL: CALCULADO O EDITADO DIRECTAMENTE
    // ============================================================

    function totalManualActivo() {
        return !!chkEditarTotal?.checked && totalManualInput?.value !== "";
    }

    function calcularTotal() {

        const galones = parseFloat(galonesInput?.value) || 0;
        const precio = parseFloat(precioAplicado?.textContent) || 0;

        const total = totalManualActivo()
            ? (parseFloat(totalManualInput.value) || 0)
            : galones * precio;

        if (totalAbastecimiento) {
            totalAbastecimiento.textContent = "L. " + formatearNumero(total);
        }

        const caja = document.querySelector("#modalCombustible .calculation-box");

        if (caja) {
            caja.classList.toggle("is-manual", !!chkEditarTotal?.checked);
        }
    }

    if (chkEditarTotal) {

        chkEditarTotal.addEventListener("change", function () {

            grupoTotalManual.hidden = !this.checked;

            if (this.checked && totalManualInput.value === "") {

                const g = parseFloat(galonesInput?.value) || 0;
                const p = parseFloat(precioAplicado?.textContent) || 0;

                totalManualInput.value = (g * p).toFixed(2);
            }

            calcularTotal();
        });

        totalManualInput.addEventListener("input", calcularTotal);
    }


    // ============================================================
    // CARGAR CAMIONES
    // ============================================================

    async function cargarCamiones() {

        if (!unidadSelect) {
            return;
        }

        try {

            const response = await fetch(API_CAMIONES, {
                method: "GET",
                headers: { "Accept": "application/json" }
            });

            if (!response.ok) {
                console.warn("No se pudieron cargar camiones. HTTP:", response.status);
                return;
            }

            const camiones = await response.json();

            if (!Array.isArray(camiones)) {
                return;
            }

            unidadSelect.innerHTML = `
                <option selected disabled value="">
                    Seleccionar unidad
                </option>
            `;

            camiones.forEach(function (camion) {

                if (!camion) {
                    return;
                }

                const placa =
                    camion.placa ||
                    camion.Placa ||
                    camion.numeroPlaca ||
                    camion.codigo ||
                    camion.matricula;

                if (!placa) {
                    return;
                }

                const option = document.createElement("option");

                option.value = placa;
                option.textContent = placa;

                unidadSelect.appendChild(option);
            });

        } catch (error) {
            console.warn("No se pudieron cargar camiones:", error);
        }
    }


    // ============================================================
    // CARGAR CONDUCTORES (llena el datalist: elegir o escribir)
    // ============================================================

    async function cargarConductores() {

        if (!listaMotoristas) {
            return;
        }

        try {

            const response = await fetch(API_CONDUCTORES, {
                method: "GET",
                headers: { "Accept": "application/json" }
            });

            if (!response.ok) {
                console.warn("No se pudieron cargar conductores. HTTP:", response.status);
                return;
            }

            const conductores = await response.json();

            if (!Array.isArray(conductores)) {
                console.warn("La API de conductores no devolvió una lista válida.");
                return;
            }

            listaMotoristas.innerHTML = "";

            conductores.forEach(function (conductor) {

                if (!conductor) {
                    return;
                }

                let nombre = conductor.nombreCompleto;

                if (!nombre && conductor.nombre) {

                    nombre = conductor.nombre;

                    if (conductor.apellido) {
                        nombre += " " + conductor.apellido;
                    }
                }

                nombre = nombre || conductor.motorista || conductor.nombreConductor;

                if (!nombre) {
                    return;
                }

                const option = document.createElement("option");

                option.value = nombre;

                listaMotoristas.appendChild(option);
            });

        } catch (error) {
            console.warn("No se pudieron cargar conductores:", error);
        }
    }


    // ============================================================
    // CARGAR ABASTECIMIENTOS
    // ============================================================

    async function cargarAbastecimientos() {

        const response = await fetch(API_ABASTECIMIENTOS, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {

            const error = await obtenerRespuesta(response);

            throw new Error(
                error?.message ||
                error?.error ||
                `Error al obtener abastecimientos. HTTP ${response.status}`
            );
        }

        const datos = await response.json();

        if (!Array.isArray(datos)) {
            throw new Error("La API de abastecimientos no devolvió una lista válida.");
        }

        abastecimientos = datos;

        renderizarTabla(abastecimientos);
    }


    // ============================================================
    // MOSTRAR TABLA
    // ============================================================

    function renderizarTabla(registros) {

        if (!tablaBody) {
            return;
        }

        tablaBody.innerHTML = "";

        if (!Array.isArray(registros) || registros.length === 0) {

            tablaBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-5">
                        <i class="bi bi-inbox fs-2"></i>
                        <div class="mt-2">
                            No existen abastecimientos registrados.
                        </div>
                    </td>
                </tr>
            `;

            actualizarFooter(0);

            return;
        }

        registros.forEach(function (registro) {

            if (!registro) {
                return;
            }

            const tr = document.createElement("tr");

            const fecha = formatearFecha(registro.fecha);

            const combustibleNombre =
                registro.combustible?.nombre ||
                registro.combustibleNombre ||
                "—";

            const combustibleClase = obtenerClaseCombustible(combustibleNombre);

            const gasolinera = registro.gasolinera || "—";

            // acento lateral por tipo de combustible
            if (combustibleClase) {
                tr.classList.add("row-" + combustibleClase);
            }

            // marca de total editado a mano
            const marcaManual = registro.totalManual
                ? '<span class="badge-manual">editado</span>'
                : "";

            tr.innerHTML = `
                <td>
                    <span class="date-main">${escaparHTML(fecha.fecha)}</span>
                    <span class="date-time">${escaparHTML(fecha.hora)}</span>
                </td>

                <td>
                    <span class="unit-badge">${escaparHTML(registro.placa)}</span>
                </td>

                <td>
                    <span class="driver-name">${escaparHTML(registro.motorista)}</span>
                </td>

                <td>
                    <span class="destination-name">${escaparHTML(registro.destino)}</span>
                </td>

                <td>
                    <span class="km-value">${formatearNumero(registro.kmRuta)} km</span>
                </td>

                <td>
                    <span class="gallons-value">${formatearNumero(registro.galonesAutorizados)} gal</span>
                </td>

                <td>
                    <span class="station-badge">${escaparHTML(gasolinera)}</span>
                </td>

                <td>
                    <span class="fuel-badge ${combustibleClase}">${escaparHTML(combustibleNombre)}</span>
                </td>

                <td>
                    <span class="money-cell">L. ${formatearNumero(registro.precioGalon)}</span>
                </td>

                <td>
                    <span class="total-cell">L. ${formatearNumero(registro.total)}</span>${marcaManual}
                </td>

                <td>
                    <div class="action-buttons">
                        <button type="button" class="action-btn edit" title="Editar" data-id="${registro.id}">
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button type="button" class="action-btn delete" title="Eliminar" data-id="${registro.id}">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </td>
            `;

            tablaBody.appendChild(tr);
        });

        actualizarFooter(registros.length);
    }


    // ============================================================
    // EDITAR / ELIMINAR (clicks en la tabla)
    // ============================================================

    if (tablaBody) {

        tablaBody.addEventListener("click", function (event) {

            const botonEditar = event.target.closest(".action-btn.edit");
            const botonEliminar = event.target.closest(".action-btn.delete");

            if (botonEditar) {
                editarAbastecimiento(botonEditar.dataset.id);
                return;
            }

            if (botonEliminar) {
                eliminarAbastecimiento(botonEliminar.dataset.id);
            }
        });
    }


    // ============================================================
    // EDITAR ABASTECIMIENTO
    // ============================================================

    async function editarAbastecimiento(id) {

        if (!id) {
            return;
        }

        try {

            const response = await fetch(`${API_ABASTECIMIENTOS}/${id}`, {
                method: "GET",
                headers: { "Accept": "application/json" }
            });

            if (!response.ok) {

                const error = await obtenerRespuesta(response);

                throw new Error(
                    error?.message ||
                    error?.error ||
                    "No se encontró el registro."
                );
            }

            const registro = await response.json();

            editandoId = id;

            abrirModalEdicion(registro);

        } catch (error) {

            console.error(error);

            mostrarError(
                error.message ||
                "No fue posible cargar el abastecimiento."
            );
        }
    }


    // ============================================================
    // ABRIR MODAL EDICIÓN
    // ============================================================

    function abrirModalEdicion(registro) {

        if (!modalCombustible) {
            return;
        }

        if (fechaInput && registro.fecha) {
            fechaInput.value = String(registro.fecha).substring(0, 10);
        }

        if (unidadSelect) {
            unidadSelect.value = registro.placa ?? "";
        }

        // Funciona igual con <input>: el nombre se muestra tal cual,
        // exista o no en el catálogo de conductores.
        if (motoristaSelect) {
            motoristaSelect.value = registro.motorista ?? "";
        }

        if (destinoSelect) {

            const destino = destinos.find(
                d => normalizarTexto(d.destino) === normalizarTexto(registro.destino)
            );

            if (destino) {
                destinoSelect.value = destino.id;
                destinoSelect.dispatchEvent(new Event("change"));
            }
        }

        if (tipoCombustible) {

            let combustibleId = registro.combustibleId;

            if (!combustibleId && registro.combustible) {
                combustibleId = registro.combustible.id;
            }

            if (combustibleId) {
                tipoCombustible.value = combustibleId;
                tipoCombustible.dispatchEvent(new Event("change"));
            }
        }

        if (galonesInput) {
            galonesInput.value = registro.galonesAutorizados ?? "";
        }

        if (gasolineraSelect) {
            gasolineraSelect.value = registro.gasolinera ?? "";
        }

        // Conservar el precio con el que se registró
        // (no reemplazarlo por el precio vigente)
        if (precioAplicado && registro.precioGalon != null) {
            precioAplicado.textContent = Number(registro.precioGalon).toFixed(2);
        }

        // Si el total guardado no es galones × precio,
        // se activa el modo "total editado"
        const calculado =
            (Number(registro.galonesAutorizados) || 0) *
            (Number(registro.precioGalon) || 0);

        const esManual =
            registro.totalManual === true ||
            Math.abs((Number(registro.total) || 0) - calculado) > 0.005;

        if (chkEditarTotal) {

            chkEditarTotal.checked = esManual;
            grupoTotalManual.hidden = !esManual;
            totalManualInput.value = esManual
                ? Number(registro.total).toFixed(2)
                : "";
        }

        calcularTotal();

        if (btnRegistrar) {
            btnRegistrar.innerHTML = `
                <i class="bi bi-check-lg"></i>
                Actualizar abastecimiento
            `;
        }

        if (typeof bootstrap !== "undefined") {
            bootstrap.Modal.getOrCreateInstance(modalCombustible).show();
        }
    }


    // ============================================================
    // GUARDAR / ACTUALIZAR ABASTECIMIENTO
    // ============================================================

    if (btnRegistrar) {
        btnRegistrar.addEventListener("click", async function () {
            await guardarAbastecimiento();
        });
    }

    async function guardarAbastecimiento() {

        try {

            const datos = obtenerDatosFormulario();
            const error = validarFormulario(datos);

            if (error) {
                mostrarAdvertencia(error);
                return;
            }

            mostrarProcesando(
                editandoId
                    ? "Actualizando abastecimiento..."
                    : "Registrando abastecimiento..."
            );

            const url = editandoId
                ? `${API_ABASTECIMIENTOS}/${editandoId}`
                : API_ABASTECIMIENTOS;

            const metodo = editandoId ? "PUT" : "POST";

            console.log("Datos enviados al backend:", datos);

            const response = await fetch(url, {
                method: metodo,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(datos)
            });

            const resultado = await obtenerRespuesta(response);

            if (!response.ok) {
                throw new Error(
                    resultado?.message ||
                    resultado?.error ||
                    resultado ||
                    "No fue posible guardar el abastecimiento."
                );
            }

            const eraEdicion = !!editandoId;

            cerrarSweetAlert();
            cerrarModal();
            limpiarFormulario();

            await cargarAbastecimientos();

            actualizarResumen();

            mostrarExito(
                eraEdicion
                    ? "El abastecimiento fue actualizado correctamente."
                    : "El abastecimiento fue registrado correctamente."
            );

            editandoId = null;

        } catch (error) {

            console.error("Error guardando abastecimiento:", error);

            cerrarSweetAlert();

            mostrarError(
                error.message ||
                "No fue posible completar la operación."
            );
        }
    }


    // ============================================================
    // OBTENER DATOS FORMULARIO
    // ============================================================

    function obtenerDatosFormulario() {

        const destinoOption = destinoSelect?.options[destinoSelect.selectedIndex];
        const combustibleOption = tipoCombustible?.options[tipoCombustible.selectedIndex];

        const galones = parseFloat(galonesInput?.value) || 0;
        const precio = parseFloat(precioAplicado?.textContent) || 0;

        const manual = totalManualActivo();

        const total = manual
            ? (parseFloat(totalManualInput.value) || 0)
            : galones * precio;

        let fecha = fechaInput?.value || "";

        if (fecha) {
            fecha += "T00:00:00";
        }

        return {

            fecha: fecha || null,

            placa: unidadSelect?.value || "",

            // Nombre elegido de la lista o escrito a mano.
            // Se limpia y se pasa a mayúsculas para no duplicar motoristas.
            motorista: (motoristaSelect?.value || "")
                .trim()
                .replace(/\s+/g, " ")
                .toUpperCase(),

            destino: destinoOption?.textContent?.trim() || "",

            kmRuta:
                destinoOption?.dataset.km !== undefined &&
                destinoOption?.dataset.km !== ""
                    ? Number(destinoOption.dataset.km)
                    : 0,

            galonesAutorizados: galones,

            gasolinera: gasolineraSelect?.value || "",

            combustibleId: combustibleOption?.value
                ? Number(combustibleOption.value)
                : null,

            precioGalon: precio,

            total: Number(total.toFixed(2)),

            // indica que el total fue editado directamente
            totalManual: manual
        };
    }


    // ============================================================
    // VALIDAR FORMULARIO
    // ============================================================

    function validarFormulario(datos) {

        if (!datos.fecha) {
            return "Seleccione la fecha del abastecimiento.";
        }

        if (!datos.placa) {
            return "Seleccione una unidad.";
        }

        if (!datos.motorista) {
            return "Seleccione o escriba el nombre del motorista.";
        }

        if (!datos.destino) {
            return "Seleccione un destino.";
        }

        if (
            datos.kmRuta === null ||
            datos.kmRuta === undefined ||
            isNaN(datos.kmRuta) ||
            datos.kmRuta < 0
        ) {
            return "Los kilómetros de ruta no son válidos.";
        }

        if (!datos.galonesAutorizados || datos.galonesAutorizados <= 0) {
            return "Los galones autorizados deben ser mayores a cero.";
        }

        if (!datos.gasolinera) {
            return "Seleccione la gasolinera.";
        }

        if (!datos.combustibleId) {
            return "Seleccione el tipo de combustible.";
        }

        if (
            datos.precioGalon === null ||
            datos.precioGalon === undefined ||
            isNaN(datos.precioGalon) ||
            datos.precioGalon <= 0
        ) {
            return "El precio del combustible no es válido.";
        }

        // validar total editado
        if (datos.totalManual && !(datos.total > 0)) {
            return "El total ingresado debe ser mayor a cero.";
        }

        return null;
    }


    // ============================================================
    // ELIMINAR
    // ============================================================

    async function eliminarAbastecimiento(id) {

        const registro = abastecimientos.find(
            item => String(item.id) === String(id)
        );

        const placa = registro?.placa || "";
        const destino = registro?.destino || "";
        const total = registro?.total || 0;

        const confirmado = await confirmarEliminacion(placa, destino, total);

        if (!confirmado) {
            return;
        }

        try {

            mostrarProcesando("Eliminando abastecimiento...");

            const response = await fetch(`${API_ABASTECIMIENTOS}/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {

                const resultado = await obtenerRespuesta(response);

                throw new Error(
                    resultado?.message ||
                    resultado?.error ||
                    resultado ||
                    "No fue posible eliminar el registro."
                );
            }

            cerrarSweetAlert();

            await cargarAbastecimientos();

            actualizarResumen();

            mostrarExito("El abastecimiento fue eliminado correctamente.");

        } catch (error) {

            console.error(error);

            cerrarSweetAlert();

            mostrarError(
                error.message ||
                "No fue posible eliminar el registro."
            );
        }
    }

    async function confirmarEliminacion(placa, destino, total) {

        if (typeof Swal !== "undefined") {

            const resultado = await Swal.fire({

                title: "¿Eliminar abastecimiento?",

                html: `
                    <p>
                        Esta acción eliminará el registro seleccionado.
                    </p>

                    <div class="delete-record">
                        <strong>${escaparHTML(placa)}</strong>
                        <span>
                            ${escaparHTML(destino)}
                            ·
                            L. ${formatearNumero(total)}
                        </span>
                    </div>
                `,

                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
                reverseButtons: true
            });

            return resultado.isConfirmed;
        }

        return window.confirm("¿Está seguro de eliminar este abastecimiento?");
    }


    // ============================================================
    // CERRAR MODAL / LIMPIAR FORMULARIO
    // ============================================================

    function cerrarModal() {

        if (!modalCombustible) {
            return;
        }

        if (typeof bootstrap !== "undefined") {

            const instancia = bootstrap.Modal.getInstance(modalCombustible);

            if (instancia) {
                instancia.hide();
            }
        }
    }

    function limpiarFormulario() {

        if (fechaInput) {
            establecerFechaActual();
        }

        if (unidadSelect) {
            unidadSelect.value = "";
        }

        if (motoristaSelect) {
            motoristaSelect.value = "";
        }

        if (destinoSelect) {

            destinoSelect.value = "";

            if (kmRuta) {
                kmRuta.textContent = "— km";
            }

            if (galonesRuta) {
                galonesRuta.textContent = "— gal";
            }
        }

        if (tipoCombustible) {
            tipoCombustible.value = "";
        }

        if (gasolineraSelect) {
            gasolineraSelect.value = "";
        }

        if (galonesInput) {
            galonesInput.value = "";
        }

        if (precioAplicado) {
            precioAplicado.textContent = "0.00";
        }

        // reiniciar total editable
        if (chkEditarTotal) {
            chkEditarTotal.checked = false;
            grupoTotalManual.hidden = true;
            totalManualInput.value = "";
        }

        if (totalAbastecimiento) {
            totalAbastecimiento.textContent = "L. 0.00";
        }

        document.querySelector("#modalCombustible .calculation-box")
            ?.classList.remove("is-manual");

        if (btnRegistrar) {
            btnRegistrar.innerHTML = `
                <i class="bi bi-check-lg"></i>
                Registrar abastecimiento
            `;
        }

        editandoId = null;
    }

    if (modalCombustible) {
        modalCombustible.addEventListener("hidden.bs.modal", limpiarFormulario);
    }


    // ============================================================
    // FILTROS
    // ============================================================

    if (btnBuscar) {
        btnBuscar.addEventListener("click", aplicarFiltros);
    }

    if (btnLimpiarFiltros) {

        btnLimpiarFiltros.addEventListener("click", function () {

            if (fechaDesde) fechaDesde.value = "";
            if (fechaHasta) fechaHasta.value = "";
            if (filtroPlaca) filtroPlaca.value = "";
            if (filtroMotorista) filtroMotorista.value = "";
            if (filtroCombustible) filtroCombustible.value = "";
            if (filtroGasolinera) filtroGasolinera.value = "";

            renderizarTabla(abastecimientos);
            actualizarResumen(abastecimientos);
        });
    }

    // una sola función de filtrado (tabla, resumen y PDF)
    function filtrarRegistros() {

        let resultado = [...abastecimientos];

        if (fechaDesde?.value) {
            resultado = resultado.filter(
                r => obtenerFechaSolo(r.fecha) >= fechaDesde.value
            );
        }

        if (fechaHasta?.value) {
            resultado = resultado.filter(
                r => obtenerFechaSolo(r.fecha) <= fechaHasta.value
            );
        }

        if (filtroPlaca?.value) {
            resultado = resultado.filter(
                r => normalizarTexto(r.placa) === normalizarTexto(filtroPlaca.value)
            );
        }

        if (filtroMotorista?.value) {
            resultado = resultado.filter(
                r => normalizarTexto(r.motorista) === normalizarTexto(filtroMotorista.value)
            );
        }

        if (filtroCombustible?.value) {
            resultado = resultado.filter(function (r) {

                const nombre =
                    r.combustible?.nombre ||
                    r.combustibleNombre ||
                    "";

                return normalizarTexto(nombre) === normalizarTexto(filtroCombustible.value);
            });
        }

        if (filtroGasolinera?.value) {
            resultado = resultado.filter(
                r => normalizarTexto(r.gasolinera) === normalizarTexto(filtroGasolinera.value)
            );
        }

        return resultado;
    }

    function aplicarFiltros() {

        const resultado = filtrarRegistros();

        renderizarTabla(resultado);
        actualizarResumen(resultado);
    }


    // ============================================================
    // OPCIONES DE FILTROS
    // ============================================================

    function actualizarFiltroPlacas() {

        if (!filtroPlaca) {
            return;
        }

        const valorActual = filtroPlaca.value;

        const placas = [
            ...new Set(abastecimientos.map(i => i?.placa).filter(Boolean))
        ].sort();

        filtroPlaca.innerHTML = `
            <option value="">Todas las unidades</option>
        `;

        placas.forEach(function (placa) {

            const option = document.createElement("option");

            option.value = placa;
            option.textContent = placa;

            filtroPlaca.appendChild(option);
        });

        if (placas.includes(valorActual)) {
            filtroPlaca.value = valorActual;
        }
    }

    // filtro de motoristas (incluye los escritos a mano,
    // porque se arma con los registros guardados)
    function actualizarFiltroMotoristas() {

        if (!filtroMotorista) {
            return;
        }

        const valorActual = filtroMotorista.value;

        const nombres = [
            ...new Set(abastecimientos.map(i => i?.motorista).filter(Boolean))
        ].sort();

        filtroMotorista.innerHTML = `
            <option value="">Todos</option>
        `;

        nombres.forEach(function (nombre) {

            const option = document.createElement("option");

            option.value = nombre;
            option.textContent = nombre;

            filtroMotorista.appendChild(option);
        });

        if (nombres.includes(valorActual)) {
            filtroMotorista.value = valorActual;
        }
    }

    function actualizarFiltroCombustibles() {

        if (!filtroCombustible) {
            return;
        }

        const valorActual = filtroCombustible.value;

        filtroCombustible.innerHTML = `
            <option value="">Todos</option>
        `;

        combustibles.forEach(function (combustible) {

            if (!combustible?.nombre) {
                return;
            }

            const option = document.createElement("option");

            option.value = combustible.nombre;
            option.textContent = combustible.nombre;

            filtroCombustible.appendChild(option);
        });

        if ([...filtroCombustible.options].some(o => o.value === valorActual)) {
            filtroCombustible.value = valorActual;
        }
    }

    function actualizarFiltroGasolineras() {

        if (!filtroGasolinera) {
            return;
        }

        const valorActual = filtroGasolinera.value;

        const gasolineras = ["Shell", "Texaco", "Puma", "UNO", "Otra"];

        filtroGasolinera.innerHTML = `
            <option value="">Todas</option>
        `;

        gasolineras.forEach(function (gasolinera) {

            const option = document.createElement("option");

            option.value = gasolinera;
            option.textContent = gasolinera;

            filtroGasolinera.appendChild(option);
        });

        if (gasolineras.includes(valorActual)) {
            filtroGasolinera.value = valorActual;
        }
    }


    // ============================================================
    // RESUMEN
    // ============================================================

    function actualizarResumen(registros = abastecimientos) {

        if (!Array.isArray(registros)) {
            registros = [];
        }

        const totalGalones = registros.reduce(
            (t, item) => t + (Number(item?.galonesAutorizados) || 0), 0
        );

        const totalCosto = registros.reduce(
            (t, item) => t + (Number(item?.total) || 0), 0
        );

        const totalGalonesElemento = document.getElementById("totalGalones");
        const totalCostoElemento = document.getElementById("totalCosto");
        const totalViajesElemento = document.getElementById("totalViajes");

        if (totalGalonesElemento) {
            totalGalonesElemento.textContent = formatearNumero(totalGalones);
        }

        if (totalCostoElemento) {
            totalCostoElemento.textContent = "L. " + formatearNumero(totalCosto);
        }

        if (totalViajesElemento) {
            totalViajesElemento.textContent = registros.length;
        }

        actualizarFiltroPlacas();
        actualizarFiltroMotoristas();
        actualizarFiltroCombustibles();
        actualizarFiltroGasolineras();
    }


    // ============================================================
    // FOOTER
    // ============================================================

    function actualizarFooter(cantidad) {

        const footer = document.querySelector(".table-footer");

        if (!footer) {
            return;
        }

        const registroDesde = document.getElementById("registroDesde");
        const registroHasta = document.getElementById("registroHasta");
        const totalRegistros = document.getElementById("totalRegistros");

        if (registroDesde) {
            registroDesde.textContent = cantidad > 0 ? "1" : "0";
        }

        if (registroHasta) {
            registroHasta.textContent = cantidad;
        }

        if (totalRegistros) {
            totalRegistros.textContent = abastecimientos.length;
        }
    }


    // ============================================================
    // UTILIDADES DE FECHA Y FORMATO
    // ============================================================

    function establecerFechaActual() {

        if (!fechaInput) {
            return;
        }

        const hoy = new Date();

        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        fechaInput.value = `${año}-${mes}-${dia}`;
    }

    function obtenerFechaSolo(fecha) {

        if (!fecha) {
            return "";
        }

        return String(fecha).substring(0, 10);
    }

    function formatearFecha(fecha) {

        if (!fecha) {
            return { fecha: "—", hora: "" };
        }

        const texto = String(fecha);
        const fechaObj = new Date(texto);

        if (isNaN(fechaObj.getTime())) {
            return { fecha: obtenerFechaSolo(texto), hora: "" };
        }

        return {
            fecha: fechaObj.toLocaleDateString("es-HN"),
            hora: fechaObj.toLocaleTimeString("es-HN", {
                hour: "2-digit",
                minute: "2-digit"
            })
        };
    }

    function formatearNumero(numero) {

        const valor = Number(numero);

        return (isNaN(valor) ? 0 : valor).toLocaleString("es-HN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function normalizarTexto(texto) {

        return String(texto ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function obtenerClaseCombustible(nombre) {

        const texto = normalizarTexto(nombre);

        if (texto.includes("diesel")) return "diesel";
        if (texto.includes("regular")) return "regular";
        if (texto.includes("super")) return "super";

        return "";
    }

    function escaparHTML(texto) {

        return String(texto ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function obtenerRespuesta(response) {

        const texto = await response.text();

        if (!texto) {
            return null;
        }

        try {
            return JSON.parse(texto);
        } catch {
            return { message: texto };
        }
    }


    // ============================================================
    // MENSAJES
    // ============================================================

    function mostrarExito(mensaje) {

        if (typeof Swal !== "undefined") {

            Swal.fire({
                icon: "success",
                title: "Operación exitosa",
                text: mensaje,
                confirmButtonText: "Aceptar",
                timer: 2500,
                timerProgressBar: true
            });

            return;
        }

        mostrarToast("toastExito", mensaje);
    }

    function mostrarAdvertencia(mensaje) {

        if (typeof Swal !== "undefined") {

            Swal.fire({
                icon: "warning",
                title: "Verifique los datos",
                text: mensaje,
                confirmButtonText: "Aceptar"
            });

            return;
        }

        mostrarToast("toastAdvertencia", mensaje);
    }

    function mostrarError(mensaje) {

        if (typeof Swal !== "undefined") {

            Swal.fire({
                icon: "error",
                title: "Error",
                text: mensaje,
                confirmButtonText: "Aceptar"
            });

            return;
        }

        mostrarToast("toastError", mensaje);
    }

    function mostrarProcesando(mensaje) {

        if (typeof Swal !== "undefined") {

            Swal.fire({
                title: mensaje,
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: function () {
                    Swal.showLoading();
                }
            });
        }
    }

    function mostrarToast(id, mensaje) {

        const toast = document.getElementById(id);

        if (!toast) {
            return;
        }

        const parrafo = toast.querySelector("p");

        if (parrafo) {
            parrafo.textContent = mensaje;
        }

        if (typeof bootstrap !== "undefined") {
            bootstrap.Toast.getOrCreateInstance(toast).show();
        }
    }

    function cerrarSweetAlert() {

        if (typeof Swal !== "undefined") {
            Swal.close();
        }
    }

    window.addEventListener("beforeunload", cerrarSweetAlert);


	// ============================================================
	    // EXPORTAR REPORTE PDF
	    // ============================================================

	    // Ponga en false si no desea el bloque de firmas al final del reporte
	    const PDF_INCLUIR_FIRMAS = true;

	    // Misma paleta del sistema (variables de combustible.css)
	    const PDF_COLORES = {
	        asfalto: [27, 36, 48],
	        asfalto2: [42, 58, 77],
	        linea: [242, 183, 5],
	        borde: [221, 227, 234],
	        fondoSuave: [241, 244, 248],
	        filaAlterna: [248, 249, 251],
	        pistaBarra: [226, 231, 238],
	        textoSuave: [107, 122, 140],
	        textoCuerpo: [45, 52, 60],
	        azul: [45, 91, 138],
	        blanco: [255, 255, 255]
	    };

	    if (btnExportar) {
	        btnExportar.addEventListener("click", exportarPDF);
	    }


	    // ---------- utilidades del reporte ----------

	    function nombreCombustibleRegistro(registro) {

	        return registro?.combustible?.nombre ||
	            registro?.combustibleNombre ||
	            "Sin combustible";
	    }

	    function estiloCombustiblePDF(nombre) {

	        const clase = obtenerClaseCombustible(nombre);

	        if (clase === "diesel") {
	            return { fondo: [255, 244, 204], texto: [138, 102, 0], barra: [242, 183, 5] };
	        }

	        if (clase === "regular") {
	            return { fondo: [224, 243, 234], texto: [31, 107, 70], barra: [59, 155, 107] };
	        }

	        if (clase === "super") {
	            return { fondo: [253, 227, 224], texto: [165, 43, 34], barra: [214, 69, 59] };
	        }

	        return { fondo: [241, 244, 248], texto: [27, 36, 48], barra: [45, 91, 138] };
	    }

	    function dineroPDF(numero) {
	        return "L. " + formatearNumeroPDF(numero);
	    }

	    function porcentajePDF(parte, total) {
	        return total > 0 ? (parte / total) * 100 : 0;
	    }

	    function textoPorcentajePDF(parte, total) {
	        return porcentajePDF(parte, total).toFixed(1) + "%";
	    }

	    function pluralPDF(cantidad, singular, plural) {
	        return `${cantidad} ${cantidad === 1 ? singular : plural}`;
	    }

	    // Agrupa los registros (por unidad, motorista, destino, etc.)
	    // y acumula galones, kilómetros y costo, también por tipo de combustible.
	    function agruparRegistrosPDF(registros, obtenerClave) {

	        const mapa = new Map();

	        registros.forEach(function (registro) {

	            const nombre = String(obtenerClave(registro) ?? "").trim() || "Sin dato";
	            const llave = normalizarTexto(nombre);

	            if (!mapa.has(llave)) {
	                mapa.set(llave, {
	                    nombre: nombre,
	                    abastecimientos: 0,
	                    km: 0,
	                    galones: 0,
	                    costo: 0,
	                    porCombustible: {}
	                });
	            }

	            const grupo = mapa.get(llave);

	            const galones = Number(registro.galonesAutorizados) || 0;
	            const costo = Number(registro.total) || 0;

	            grupo.abastecimientos += 1;
	            grupo.km += Number(registro.kmRuta) || 0;
	            grupo.galones += galones;
	            grupo.costo += costo;

	            const llaveCombustible = normalizarTexto(nombreCombustibleRegistro(registro));

	            if (!grupo.porCombustible[llaveCombustible]) {
	                grupo.porCombustible[llaveCombustible] = { galones: 0, costo: 0 };
	            }

	            grupo.porCombustible[llaveCombustible].galones += galones;
	            grupo.porCombustible[llaveCombustible].costo += costo;
	        });

	        // el que más gastó primero
	        return [...mapa.values()].sort((a, b) => b.costo - a.costo);
	    }


	    // ---------- reporte ----------

	    async function exportarPDF() {

	        if (
	            typeof window.jspdf === "undefined" ||
	            typeof window.jspdf.jsPDF === "undefined"
	        ) {
	            mostrarError("No se pudo cargar la herramienta para generar el PDF.");
	            return;
	        }

	        // misma función de filtrado que la tabla
	        const registros = filtrarRegistros();

	        if (!registros || registros.length === 0) {
	            mostrarAdvertencia(
	                "No existen registros que coincidan con los filtros seleccionados."
	            );
	            return;
	        }

	        // orden cronológico para el reporte
	        registros.sort((a, b) =>
	            String(a.fecha ?? "").localeCompare(String(b.fecha ?? ""))
	        );

	        const { jsPDF } = window.jspdf;

	        const doc = new jsPDF({
	            orientation: "landscape",
	            unit: "mm",
	            format: "a4"
	        });

	        if (typeof doc.autoTable !== "function") {
	            mostrarError("No se pudo cargar el complemento de tablas del PDF.");
	            return;
	        }

	        const C = PDF_COLORES;
	        const fmt = formatearNumeroPDF;

	        const anchoPagina = doc.internal.pageSize.getWidth();
	        const altoPagina = doc.internal.pageSize.getHeight();
	        const margen = 10;
	        const anchoUtil = anchoPagina - (margen * 2);
	        const limiteInferior = altoPagina - 18;
	        const topContinuacion = 18;


	        // ======================================================
	        // DATOS DEL REPORTE
	        // ======================================================

	        // período
	        let textoRango = "Todos los registros";

	        if (fechaDesde?.value && fechaHasta?.value) {
	            textoRango = `${formatearFechaPDF(fechaDesde.value)} al ${formatearFechaPDF(fechaHasta.value)}`;
	        } else if (fechaDesde?.value) {
	            textoRango = `Desde ${formatearFechaPDF(fechaDesde.value)}`;
	        } else if (fechaHasta?.value) {
	            textoRango = `Hasta ${formatearFechaPDF(fechaHasta.value)}`;
	        }

	        // filtros activos
	        const filtros = [];

	        if (filtroPlaca?.value) filtros.push(`Unidad ${filtroPlaca.value}`);
	        if (filtroMotorista?.value) filtros.push(`Motorista ${filtroMotorista.value}`);
	        if (filtroCombustible?.value) filtros.push(`Combustible ${filtroCombustible.value}`);
	        if (filtroGasolinera?.value) filtros.push(`Gasolinera ${filtroGasolinera.value}`);

	        // fecha y hora de generación
	        const ahora = new Date();
	        const dos = n => String(n).padStart(2, "0");

	        const fechaGeneracion =
	            `${dos(ahora.getDate())}/${dos(ahora.getMonth() + 1)}/${ahora.getFullYear()} ` +
	            `${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`;

	        // totales
	        const totalGalones = registros.reduce(
	            (t, i) => t + (Number(i?.galonesAutorizados) || 0), 0
	        );

	        const totalCosto = registros.reduce(
	            (t, i) => t + (Number(i?.total) || 0), 0
	        );

	        const totalKilometros = registros.reduce(
	            (t, i) => t + (Number(i?.kmRuta) || 0), 0
	        );

	        const precioPromedio = totalGalones > 0 ? totalCosto / totalGalones : 0;
	        const costoPorKm = totalKilometros > 0 ? totalCosto / totalKilometros : 0;
	        const totalesManuales = registros.filter(r => r.totalManual).length;

	        // agrupaciones
	        const porCombustible = agruparRegistrosPDF(registros, nombreCombustibleRegistro);
	        const porUnidad = agruparRegistrosPDF(registros, r => r.placa);
	        const porMotorista = agruparRegistrosPDF(registros, r => r.motorista);
	        const porDestino = agruparRegistrosPDF(registros, r => r.destino);
	        const porGasolinera = agruparRegistrosPDF(registros, r => r.gasolinera);

	        // columnas de combustible (orden alfabético, igual en todas las tablas)
	        const tiposCombustible = porCombustible
	            .map(g => ({ nombre: g.nombre, clave: normalizarTexto(g.nombre) }))
	            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));


	        // ======================================================
	        // FUNCIONES DE DIBUJO
	        // ======================================================

	        function dibujarTarjeta(x, y, ancho, titulo, valor, subtitulo, destacada) {

	            const alto = 25;

	            if (destacada) {
	                doc.setFillColor(...C.asfalto);
	                doc.roundedRect(x, y, ancho, alto, 2, 2, "F");
	            } else {
	                doc.setFillColor(...C.fondoSuave);
	                doc.setDrawColor(...C.borde);
	                doc.setLineWidth(0.25);
	                doc.roundedRect(x, y, ancho, alto, 2, 2, "FD");
	            }

	            // franja amarilla inferior (como las tarjetas del sistema)
	            doc.setFillColor(...C.linea);
	            doc.rect(x + 5, y + alto - 1.4, ancho - 10, 1.4, "F");

	            doc.setFont("helvetica", "bold");
	            doc.setFontSize(6.5);
	            doc.setTextColor(...(destacada ? C.linea : C.textoSuave));
	            doc.text(titulo.toUpperCase(), x + 5, y + 7);

	            // el valor se reduce si no cabe en la tarjeta
	            let tamano = 14;
	            doc.setFont("helvetica", "bold");
	            doc.setFontSize(tamano);

	            while (doc.getTextWidth(valor) > ancho - 10 && tamano > 8) {
	                tamano -= 0.5;
	                doc.setFontSize(tamano);
	            }

	            doc.setTextColor(...(destacada ? C.blanco : C.asfalto));
	            doc.text(valor, x + 5, y + 15.5);

	            doc.setFont("helvetica", "normal");
	            doc.setFontSize(6.5);
	            doc.setTextColor(...(destacada ? [200, 208, 218] : C.textoSuave));
	            doc.text(subtitulo, x + 5, y + 20.5);
	        }

	        function tituloSeccion(y, titulo, subtitulo) {

	            doc.setFillColor(...C.linea);
	            doc.roundedRect(margen, y, 1.8, subtitulo ? 9 : 6, 0.9, 0.9, "F");

	            doc.setFont("helvetica", "bold");
	            doc.setFontSize(11);
	            doc.setTextColor(...C.asfalto);
	            doc.text(titulo, margen + 5, y + 4);

	            if (subtitulo) {
	                doc.setFont("helvetica", "normal");
	                doc.setFontSize(7.5);
	                doc.setTextColor(...C.textoSuave);
	                doc.text(subtitulo, margen + 5, y + 8.3);
	            }

	            return y + (subtitulo ? 13 : 9);
	        }

	        // si no cabe lo siguiente, pasa a una página nueva
	        function asegurarEspacio(y, alto) {

	            if (y + alto > limiteInferior) {
	                doc.addPage();
	                return topContinuacion + 2;
	            }

	            return y;
	        }

	        // cinta superior de las páginas 2 en adelante
	        function dibujarBandaContinuacion() {

	            doc.setFillColor(...C.asfalto);
	            doc.rect(0, 0, anchoPagina, 11, "F");

	            doc.setFillColor(...C.linea);
	            doc.rect(0, 11, anchoPagina, 0.9, "F");

	            doc.setFont("helvetica", "bold");
	            doc.setFontSize(9);
	            doc.setTextColor(...C.blanco);
	            doc.text("REPORTE DE COMBUSTIBLE", margen, 7);

	            doc.setFont("helvetica", "normal");
	            doc.setFontSize(7.5);
	            doc.setTextColor(...C.linea);
	            doc.text(`Período: ${textoRango}`, anchoPagina - margen, 7, { align: "right" });
	        }

	        function dibujarPie(pagina, totalPaginas) {

	            doc.setDrawColor(...C.borde);
	            doc.setLineWidth(0.3);
	            doc.line(margen, altoPagina - 13, anchoPagina - margen, altoPagina - 13);

	            doc.setFillColor(...C.linea);
	            doc.rect(margen, altoPagina - 13.4, 24, 0.9, "F");

	            doc.setFont("helvetica", "normal");
	            doc.setFontSize(7);
	            doc.setTextColor(...C.textoSuave);

	            doc.text("Transportes CHC  ·  Reporte de Combustible", margen, altoPagina - 7);

	            doc.text(
	                `Generado el ${fechaGeneracion}`,
	                anchoPagina / 2,
	                altoPagina - 7,
	                { align: "center" }
	            );

	            doc.text(
	                `Página ${pagina} de ${totalPaginas}`,
	                anchoPagina - margen,
	                altoPagina - 7,
	                { align: "right" }
	            );
	        }

	        // Tabla de desglose con barra de porcentaje del gasto
	        function tablaDesglose(y, cfg) {

	            const encabezado = [cfg.colNombre, "Abast."];

	            if (cfg.conKm) encabezado.push("KM ruta");

	            if (cfg.conCombustible) {
	                tiposCombustible.forEach(t => encabezado.push(`${t.nombre} (gal)`));
	            }

	            encabezado.push("Galones");

	            if (cfg.conPrecioProm) encabezado.push("Precio prom./gal");

	            encabezado.push("Costo total", "% del gasto");

	            const ultimo = encabezado.length - 1;

	            const cuerpo = cfg.grupos.map(function (g) {

	                const fila = [g.nombre, String(g.abastecimientos)];

	                if (cfg.conKm) fila.push(`${fmt(g.km)} km`);

	                if (cfg.conCombustible) {
	                    tiposCombustible.forEach(function (t) {
	                        const dato = g.porCombustible[t.clave];
	                        fila.push(dato ? fmt(dato.galones) : "—");
	                    });
	                }

	                fila.push(fmt(g.galones));

	                if (cfg.conPrecioProm) {
	                    fila.push(dineroPDF(g.galones > 0 ? g.costo / g.galones : 0));
	                }

	                fila.push(dineroPDF(g.costo));
	                fila.push(textoPorcentajePDF(g.costo, totalCosto));

	                return fila;
	            });

	            const pie = ["TOTAL", String(registros.length)];

	            if (cfg.conKm) pie.push(`${fmt(totalKilometros)} km`);

	            if (cfg.conCombustible) {
	                tiposCombustible.forEach(function (t) {
	                    const suma = cfg.grupos.reduce(
	                        (s, g) => s + (g.porCombustible[t.clave]?.galones || 0), 0
	                    );
	                    pie.push(suma > 0 ? fmt(suma) : "—");
	                });
	            }

	            pie.push(fmt(totalGalones));

	            if (cfg.conPrecioProm) pie.push(dineroPDF(precioPromedio));

	            pie.push(dineroPDF(totalCosto), "100%");

	            const porcentajes = cfg.grupos.map(g => porcentajePDF(g.costo, totalCosto));

	            const columnas = {};
	            columnas[0] = { cellWidth: cfg.anchoNombre };
	            columnas[ultimo] = { cellWidth: 42 };

	            y = asegurarEspacio(y, 38);
	            y = tituloSeccion(y, cfg.titulo, cfg.subtitulo);

	            doc.autoTable({

	                startY: y,

	                margin: { left: margen, right: margen, top: topContinuacion, bottom: 18 },

	                head: [encabezado],
	                body: cuerpo,
	                foot: [pie],
	                showFoot: "lastPage",

	                theme: "grid",

	                styles: {
	                    font: "helvetica",
	                    fontSize: 7.5,
	                    cellPadding: 2.2,
	                    textColor: C.textoCuerpo,
	                    lineColor: C.borde,
	                    lineWidth: 0.25,
	                    valign: "middle"
	                },

	                headStyles: {
	                    fillColor: C.asfalto2,
	                    textColor: C.blanco,
	                    fontStyle: "bold",
	                    fontSize: 7
	                },

	                footStyles: {
	                    fillColor: C.asfalto,
	                    textColor: C.linea,
	                    fontStyle: "bold"
	                },

	                alternateRowStyles: { fillColor: C.filaAlterna },

	                columnStyles: columnas,

	                didParseCell: function (data) {

	                    const col = data.column.index;

	                    // alineación: texto a la izquierda, cifras a la derecha
	                    data.cell.styles.halign =
	                        (col === 0 || col === ultimo) ? "left" : "right";

	                    if (data.section === "body" && col === 0) {

	                        data.cell.styles.fontStyle = "bold";

	                        if (cfg.colorearNombre) {
	                            const estilo = estiloCombustiblePDF(data.cell.raw);
	                            data.cell.styles.fillColor = estilo.fondo;
	                            data.cell.styles.textColor = estilo.texto;
	                        }
	                    }

	                    if (data.section === "body" && col === ultimo - 1) {
	                        data.cell.styles.fontStyle = "bold";
	                    }
	                },

	                didDrawCell: function (data) {

	                    if (data.section !== "body" || data.column.index !== ultimo) {
	                        return;
	                    }

	                    const grupo = cfg.grupos[data.row.index];
	                    const pct = porcentajes[data.row.index] || 0;

	                    const x = data.cell.x + 15;
	                    const ancho = data.cell.width - 15 - 3;
	                    const alto = 2.2;
	                    const yBarra = data.cell.y + (data.cell.height / 2) - (alto / 2);

	                    if (!grupo || ancho < 5) {
	                        return;
	                    }

	                    doc.setFillColor(...C.pistaBarra);
	                    doc.roundedRect(x, yBarra, ancho, alto, 1, 1, "F");

	                    const relleno = pct > 0 ? Math.max(ancho * pct / 100, 0.8) : 0;

	                    if (relleno > 0) {

	                        doc.setFillColor(
	                            ...(cfg.colorearNombre
	                                ? estiloCombustiblePDF(grupo.nombre).barra
	                                : C.azul)
	                        );

	                        if (relleno < 2) {
	                            doc.rect(x, yBarra, relleno, alto, "F");
	                        } else {
	                            doc.roundedRect(x, yBarra, relleno, alto, 1, 1, "F");
	                        }
	                    }
	                }
	            });

	            return doc.lastAutoTable.finalY + 9;
	        }


	        // ======================================================
	        // ENCABEZADO
	        // ======================================================

	        const altoEncabezado = 38;

	        doc.setFillColor(...C.asfalto);
	        doc.rect(0, 0, anchoPagina, altoEncabezado, "F");

	        // diagonal más clara a la derecha (efecto degradado del sistema)
	        doc.setFillColor(...C.asfalto2);
	        doc.triangle(
	            anchoPagina * 0.6, 0,
	            anchoPagina, 0,
	            anchoPagina, altoEncabezado,
	            "F"
	        );

	        // línea de carretera
	        doc.setDrawColor(...C.linea);
	        doc.setLineWidth(1.1);
	        doc.setLineDashPattern([7, 4], 0);
	        doc.line(margen, altoEncabezado - 3.5, anchoPagina - margen, altoEncabezado - 3.5);
	        doc.setLineDashPattern([], 0);

	        // logo (se ajusta sin deformarse, sobre un recuadro blanco)
	        let logo = null;

	        try {
	            logo = await cargarImagenPDF("/imgs/logo.png");
	        } catch (error) {
	            console.warn("No se pudo cargar el logo:", error);
	        }

	        const cajaLogo = { x: margen, y: 5.5, w: 40, h: 24 };

	        if (logo && logo.naturalWidth > 0 && logo.naturalHeight > 0) {

				// Fondo del logo azul oscuro
				doc.setFillColor(30, 43, 58);

				doc.roundedRect(
				    cajaLogo.x,
				    cajaLogo.y,
				    cajaLogo.w,
				    cajaLogo.h,
				    2.5,
				    2.5,
				    "F"
				);

	            const escala = Math.min(
	                (cajaLogo.w - 4) / logo.naturalWidth,
	                (cajaLogo.h - 4) / logo.naturalHeight
	            );

	            const wLogo = logo.naturalWidth * escala;
	            const hLogo = logo.naturalHeight * escala;

	            doc.addImage(
	                logo,
	                "PNG",
	                cajaLogo.x + ((cajaLogo.w - wLogo) / 2),
	                cajaLogo.y + ((cajaLogo.h - hLogo) / 2),
	                wLogo,
	                hLogo
	            );
	        } else {
	            logo = null;
	        }

	        const xContenido = logo ? margen + 46 : margen;

	        // etiqueta "CONTROL DE FLOTA"
	        doc.setFillColor(57, 57, 42);
	        doc.roundedRect(xContenido, 6.5, 36, 5.6, 2.8, 2.8, "F");

	        doc.setFont("helvetica", "bold");
	        doc.setFontSize(6.5);
	        doc.setTextColor(...C.linea);
	        doc.text("CONTROL DE FLOTA", xContenido + 18, 10.3, { align: "center" });

	        // título
	        doc.setFont("helvetica", "bold");
	        doc.setFontSize(20);
	        doc.setTextColor(...C.blanco);
	        doc.text("REPORTE DE COMBUSTIBLE", xContenido, 20);

	        doc.setFont("helvetica", "normal");
	        doc.setFontSize(8.5);
	        doc.setTextColor(200, 208, 218);
	        doc.text(
	            "Transportes CHC  ·  Control de abastecimientos y consumo de combustible",
	            xContenido,
	            26
	        );

	        // período (y filtros, si los hay)
	        doc.setFont("helvetica", "bold");
	        doc.setFontSize(9);
	        doc.setTextColor(...C.linea);

	        const lineaPeriodo = `Período: ${textoRango}` +
	            (filtros.length ? `   ·   ${filtros.join("  ·  ")}` : "");

	        doc.text(
	            doc.splitTextToSize(lineaPeriodo, anchoPagina - xContenido - 65)[0],
	            xContenido,
	            31
	        );

	        // datos a la derecha
	        doc.setFont("helvetica", "normal");
	        doc.setFontSize(8);
	        doc.setTextColor(220, 226, 232);
	        doc.text(`Generado: ${fechaGeneracion}`, anchoPagina - margen, 12, { align: "right" });
	        doc.text(`Registros: ${registros.length}`, anchoPagina - margen, 18, { align: "right" });


	        // ======================================================
	        // TARJETAS DE RESUMEN
	        // ======================================================

	        const yResumen = altoEncabezado + 8;
	        const espacio = 4;
	        const anchoTarjeta = (anchoUtil - (espacio * 4)) / 5;

	        const subtituloCosto = totalKilometros > 0
	            ? `${dineroPDF(costoPorKm)} por km de ruta`
	            : "Costo de combustible";

	        dibujarTarjeta(
	            margen, yResumen, anchoTarjeta,
	            "Abastecimientos", String(registros.length), "Registros incluidos", false
	        );

	        dibujarTarjeta(
	            margen + (anchoTarjeta + espacio), yResumen, anchoTarjeta,
	            "Galones", fmt(totalGalones), "Total autorizado", false
	        );

	        dibujarTarjeta(
	            margen + ((anchoTarjeta + espacio) * 2), yResumen, anchoTarjeta,
	            "Kilómetros", fmt(totalKilometros), "Distancia de ruta registrada", false
	        );

	        dibujarTarjeta(
	            margen + ((anchoTarjeta + espacio) * 3), yResumen, anchoTarjeta,
	            "Precio promedio", dineroPDF(precioPromedio), "Por galón (ponderado)", false
	        );

	        dibujarTarjeta(
	            margen + ((anchoTarjeta + espacio) * 4), yResumen, anchoTarjeta,
	            "Total gastado", dineroPDF(totalCosto), subtituloCosto, true
	        );


	        // ======================================================
	        // TABLA DE DETALLE
	        // ======================================================

	        let y = tituloSeccion(
	            yResumen + 25 + 8,
	            "Detalle de abastecimientos",
	            `${pluralPDF(registros.length, "registro", "registros")} en orden cronológico`
	        );

	        const filas = registros.map(function (item, indice) {

	            const fecha = formatearFecha(item.fecha);
	            const marca = item.totalManual ? "*" : "";

	            return [
	                String(indice + 1),
	                fecha.fecha,
	                item.placa || "—",
	                item.motorista || "—",
	                item.destino || "—",
	                item.gasolinera || "—",
	                `${fmt(item.kmRuta)} km`,
	                `${fmt(item.galonesAutorizados)} gal`,
	                nombreCombustibleRegistro(item),
	                dineroPDF(item.precioGalon),
	                dineroPDF(item.total) + marca
	            ];
	        });

	        doc.autoTable({

	            startY: y,

	            margin: { left: margen, right: margen, top: topContinuacion, bottom: 18 },

	            head: [[
	                "#",
	                "Fecha",
	                "Placa",
	                "Motorista",
	                "Destino",
	                "Gasolinera",
	                "KM ruta",
	                "Galones",
	                "Combustible",
	                "Precio/galón",
	                "Total"
	            ]],

	            body: filas,

	            foot: [[
	                { content: "TOTALES", colSpan: 6, styles: { halign: "right" } },
	                `${fmt(totalKilometros)} km`,
	                `${fmt(totalGalones)} gal`,
	                "",
	                `Prom. ${dineroPDF(precioPromedio)}`,
	                dineroPDF(totalCosto)
	            ]],

	            showFoot: "lastPage",

	            theme: "grid",

	            styles: {
	                font: "helvetica",
	                fontSize: 7,
	                cellPadding: 2.2,
	                textColor: C.textoCuerpo,
	                lineColor: C.borde,
	                lineWidth: 0.25,
	                valign: "middle"
	            },

	            headStyles: {
	                fillColor: C.asfalto,
	                textColor: C.blanco,
	                fontStyle: "bold",
	                fontSize: 7,
	                halign: "center"
	            },

	            footStyles: {
	                fillColor: C.asfalto,
	                textColor: C.linea,
	                fontStyle: "bold",
	                halign: "right"
	            },

	            alternateRowStyles: { fillColor: C.filaAlterna },

	            columnStyles: {
	                0: { halign: "center", cellWidth: 8 },
	                1: { halign: "center", cellWidth: 20 },
	                2: { halign: "center", cellWidth: 20 },
	                3: { halign: "left", cellWidth: 40 },
	                4: { halign: "left", cellWidth: 40 },
	                5: { halign: "center", cellWidth: 24 },
	                6: { halign: "right", cellWidth: 20 },
	                7: { halign: "right", cellWidth: 22 },
	                8: { halign: "center", cellWidth: 28 },
	                9: { halign: "right", cellWidth: 26 },
	                10: { halign: "right", cellWidth: 29 }
	            },

	            didParseCell: function (data) {

	                if (data.section !== "body") {
	                    return;
	                }

	                // el tipo de combustible lleva el color del sistema
	                if (data.column.index === 8) {
	                    const estilo = estiloCombustiblePDF(data.cell.raw);
	                    data.cell.styles.fillColor = estilo.fondo;
	                    data.cell.styles.textColor = estilo.texto;
	                    data.cell.styles.fontStyle = "bold";
	                }

	                if (data.column.index === 2 || data.column.index === 10) {
	                    data.cell.styles.fontStyle = "bold";
	                }
	            }
	        });

	        y = doc.lastAutoTable.finalY + 5;

	        if (totalesManuales > 0) {

	            y = asegurarEspacio(y, 8);

	            doc.setFont("helvetica", "italic");
	            doc.setFontSize(7);
	            doc.setTextColor(...C.textoSuave);
	            doc.text(
	                "* Total editado manualmente (no corresponde a galones × precio).",
	                margen,
	                y
	            );

	            y += 6;
	        }


	        // ======================================================
	        // ESPECIFICACIONES DEL REPORTE
	        // ======================================================

	        // --- análisis en palabras ---

	        const unidadTop = porUnidad[0];
	        const motoristaTop = porMotorista[0];
	        const destinoTop = porDestino[0];

	        const gasolineraTop = [...porGasolinera].sort(
	            (a, b) => (b.abastecimientos - a.abastecimientos) || (b.costo - a.costo)
	        )[0];

	        const mayor = registros.reduce(
	            (m, r) => (Number(r.total) || 0) > (Number(m.total) || 0) ? r : m,
	            registros[0]
	        );

	        const describir = g =>
	            `${g.nombre}, con ${fmt(g.galones)} galones por ${dineroPDF(g.costo)} ` +
	            `(${textoPorcentajePDF(g.costo, totalCosto)} del gasto) en ` +
	            `${pluralPDF(g.abastecimientos, "abastecimiento", "abastecimientos")}.`;

	        const items = [];

	        items.push({
	            etiqueta: "Alcance",
	            texto:
	                `${textoRango}. Incluye ${pluralPDF(registros.length, "abastecimiento", "abastecimientos")} ` +
	                `de ${pluralPDF(porUnidad.length, "unidad", "unidades")}, realizados por ` +
	                `${pluralPDF(porMotorista.length, "motorista", "motoristas")} hacia ` +
	                `${pluralPDF(porDestino.length, "destino", "destinos")}.` +
	                (filtros.length ? ` Filtros aplicados: ${filtros.join(", ")}.` : "")
	        });

	        items.push({
	            etiqueta: "Total gastado",
	            texto:
	                `${dineroPDF(totalCosto)} en ${fmt(totalGalones)} galones, a un precio promedio de ` +
	                `${dineroPDF(precioPromedio)} por galón` +
	                (totalKilometros > 0
	                    ? `; equivale a ${dineroPDF(costoPorKm)} por kilómetro de ruta.`
	                    : ".")
	        });

	        items.push({
	            etiqueta: "Por combustible",
	            texto: [...porCombustible]
	                .map(g =>
	                    `${g.nombre}: ${fmt(g.galones)} gal por ${dineroPDF(g.costo)} ` +
	                    `(${textoPorcentajePDF(g.costo, totalCosto)})`
	                )
	                .join("; ") + "."
	        });

	        items.push({ etiqueta: "Unidad con mayor gasto", texto: describir(unidadTop) });
	        items.push({ etiqueta: "Motorista con mayor gasto", texto: describir(motoristaTop) });
	        items.push({ etiqueta: "Destino con mayor gasto", texto: describir(destinoTop) });

	        items.push({
	            etiqueta: "Gasolinera más usada",
	            texto:
	                `${gasolineraTop.nombre}, con ` +
	                `${pluralPDF(gasolineraTop.abastecimientos, "abastecimiento", "abastecimientos")} ` +
	                `por ${dineroPDF(gasolineraTop.costo)} (${fmt(gasolineraTop.galones)} galones).`
	        });

	        items.push({
	            etiqueta: "Mayor abastecimiento",
	            texto:
	                `${dineroPDF(mayor.total)} el ${formatearFecha(mayor.fecha).fecha}, ` +
	                `unidad ${mayor.placa || "—"} hacia ${mayor.destino || "—"} ` +
	                `(${fmt(mayor.galonesAutorizados)} galones de ${nombreCombustibleRegistro(mayor)}).`
	        });

	        if (totalesManuales > 0) {
	            items.push({
	                etiqueta: "Totales editados",
	                texto:
	                    `${pluralPDF(totalesManuales, "registro tiene", "registros tienen")} el total ` +
	                    `editado manualmente (marcados con * en el detalle).`
	            });
	        }

	        // medir el cuadro antes de dibujarlo
	        const anchoEtiqueta = 40;
	        const xEtiqueta = margen + 7;
	        const xTexto = xEtiqueta + anchoEtiqueta;
	        const anchoTexto = anchoPagina - margen - 5 - xTexto;
	        const interlinea = 3.8;

	        doc.setFont("helvetica", "normal");
	        doc.setFontSize(8);

	        const bloques = items.map(it => ({
	            etiqueta: it.etiqueta,
	            lineas: doc.splitTextToSize(it.texto, anchoTexto)
	        }));

	        const altoCaja = bloques.reduce(
	            (t, b) => t + (b.lineas.length * interlinea) + 2.2, 0
	        ) + 4.5;

	        y = asegurarEspacio(y + 4, 15 + altoCaja);

	        // cinta del título de la sección
	        doc.setFillColor(...C.asfalto);
	        doc.roundedRect(margen, y, anchoUtil, 11, 2, 2, "F");

	        doc.setFillColor(...C.linea);
	        doc.roundedRect(margen + 4, y + 3, 1.8, 5, 0.9, 0.9, "F");

	        doc.setFont("helvetica", "bold");
	        doc.setFontSize(10);
	        doc.setTextColor(...C.blanco);
	        doc.text("ESPECIFICACIONES DEL REPORTE", margen + 9, y + 7.2);

	        doc.setFont("helvetica", "normal");
	        doc.setFontSize(8);
	        doc.setTextColor(...C.linea);
	        doc.text(
	            "Detalle del consumo y del gasto del período",
	            anchoPagina - margen - 4,
	            y + 7.2,
	            { align: "right" }
	        );

	        y += 15;

	        // cuadro de análisis
	        doc.setFillColor(...C.fondoSuave);
	        doc.setDrawColor(...C.borde);
	        doc.setLineWidth(0.25);
	        doc.roundedRect(margen, y, anchoUtil, altoCaja, 2, 2, "FD");

	        doc.setFillColor(...C.linea);
	        doc.rect(margen, y + 2, 1.6, altoCaja - 4, "F");

	        let yTexto = y + 6.5;

	        bloques.forEach(function (bloque) {

	            doc.setFont("helvetica", "bold");
	            doc.setFontSize(8);
	            doc.setTextColor(...C.asfalto);
	            doc.text(bloque.etiqueta, xEtiqueta, yTexto);

	            doc.setFont("helvetica", "normal");
	            doc.setTextColor(...C.textoCuerpo);

	            bloque.lineas.forEach(function (linea, i) {
	                doc.text(linea, xTexto, yTexto + (i * interlinea));
	            });

	            yTexto += (bloque.lineas.length * interlinea) + 2.2;
	        });

	        y += altoCaja + 9;

	        // --- tablas de desglose ---

	        y = tablaDesglose(y, {
	            titulo: "Gasto por tipo de combustible",
	            subtitulo: "Cuántos galones se abastecieron de cada combustible, a qué precio promedio y cuánto costaron.",
	            colNombre: "Combustible",
	            grupos: porCombustible,
	            anchoNombre: 50,
	            conPrecioProm: true,
	            colorearNombre: true
	        });

	        y = tablaDesglose(y, {
	            titulo: "Consumo por unidad (placa)",
	            subtitulo: "Galones de cada combustible que consumió cada unidad y lo que costó.",
	            colNombre: "Unidad",
	            grupos: porUnidad,
	            anchoNombre: 36,
	            conKm: true,
	            conCombustible: true
	        });

	        y = tablaDesglose(y, {
	            titulo: "Consumo por motorista",
	            subtitulo: "Galones de cada combustible abastecidos por cada motorista y lo que costó.",
	            colNombre: "Motorista",
	            grupos: porMotorista,
	            anchoNombre: 62,
	            conKm: true,
	            conCombustible: true
	        });

	        y = tablaDesglose(y, {
	            titulo: "Gasto por destino",
	            subtitulo: "Viajes, kilómetros y galones autorizados por destino, con su costo.",
	            colNombre: "Destino",
	            grupos: porDestino,
	            anchoNombre: 60,
	            conKm: true
	        });

	        y = tablaDesglose(y, {
	            titulo: "Gasto por gasolinera",
	            subtitulo: "Dónde se abasteció la flota y cuánto se gastó en cada gasolinera.",
	            colNombre: "Gasolinera",
	            grupos: porGasolinera,
	            anchoNombre: 50,
	            conPrecioProm: true
	        });

	        // --- notas ---

	        y = asegurarEspacio(y, 16);

	        const textoNota =
	            "Notas: los kilómetros y galones corresponden a los valores autorizados para cada destino. " +
	            "El costo de cada abastecimiento usa el precio por galón vigente al momento de registrarlo" +
	            (totalesManuales > 0
	                ? ", salvo los marcados con * cuyo total fue editado manualmente."
	                : ".");

	        const lineasNota = doc.splitTextToSize(textoNota, anchoUtil);

	        doc.setFont("helvetica", "italic");
	        doc.setFontSize(7);
	        doc.setTextColor(...C.textoSuave);

	        lineasNota.forEach(function (linea, i) {
	            doc.text(linea, margen, y + (i * 3.2));
	        });

	        y += (lineasNota.length * 3.2) + 4;

	        // --- firmas ---

	        if (PDF_INCLUIR_FIRMAS) {

	            y = asegurarEspacio(y + 4, 26);

	            const separacion = 22;
	            const anchoFirma = (anchoUtil - (separacion * 2)) / 3;

	            ["Elaborado por", "Revisado por", "Autorizado por"].forEach(function (etiqueta, i) {

	                const x = margen + (i * (anchoFirma + separacion));
	                const yLinea = y + 14;

	                doc.setDrawColor(...C.textoSuave);
	                doc.setLineWidth(0.3);
	                doc.line(x, yLinea, x + anchoFirma, yLinea);

	                doc.setFont("helvetica", "bold");
	                doc.setFontSize(7.5);
	                doc.setTextColor(...C.asfalto);
	                doc.text(etiqueta, x + (anchoFirma / 2), yLinea + 4.5, { align: "center" });

	                doc.setFont("helvetica", "normal");
	                doc.setFontSize(6.5);
	                doc.setTextColor(...C.textoSuave);
	                doc.text("Nombre, firma y fecha", x + (anchoFirma / 2), yLinea + 8, { align: "center" });
	            });
	        }


	        // ======================================================
	        // CINTA SUPERIOR (pág. 2+) Y PIE EN TODAS LAS PÁGINAS
	        // ======================================================

	        const totalPaginas = doc.internal.getNumberOfPages();

	        for (let pagina = 1; pagina <= totalPaginas; pagina++) {

	            doc.setPage(pagina);

	            if (pagina > 1) {
	                dibujarBandaContinuacion();
	            }

	            dibujarPie(pagina, totalPaginas);
	        }


	        // ======================================================
	        // NOMBRE DEL ARCHIVO
	        // ======================================================

	        let nombreArchivo = "Reporte_de_Combustible";

	        if (fechaDesde?.value && fechaHasta?.value) {
	            nombreArchivo += `_${fechaDesde.value}_${fechaHasta.value}`;
	        } else if (fechaDesde?.value) {
	            nombreArchivo += `_desde_${fechaDesde.value}`;
	        } else if (fechaHasta?.value) {
	            nombreArchivo += `_hasta_${fechaHasta.value}`;
	        }

	        if (filtroGasolinera?.value) {
	            nombreArchivo += `_${filtroGasolinera.value}`;
	        }

	        nombreArchivo += ".pdf";

	        doc.save(nombreArchivo);

	        mostrarExito("El reporte de combustible fue generado correctamente en PDF.");
	    }

	    function cargarImagenPDF(src) {

	        return new Promise(function (resolve, reject) {

	            const img = new Image();

	            img.onload = () => resolve(img);

	            img.onerror = () => reject(
	                new Error("No se pudo cargar la imagen: " + src)
	            );

	            img.src = src;
	        });
	    }

	    function formatearFechaPDF(fecha) {

	        if (!fecha) {
	            return "—";
	        }

	        const partes = String(fecha).substring(0, 10).split("-");

	        if (partes.length !== 3) {
	            return fecha;
	        }

	        return `${partes[2]}/${partes[1]}/${partes[0]}`;
	    }

	    function formatearNumeroPDF(numero) {

	        const valor = Number(numero);

	        if (isNaN(valor)) {
	            return "0.00";
	        }

	        return valor.toLocaleString("es-HN", {
	            minimumFractionDigits: 2,
	            maximumFractionDigits: 2
	        });
	    }

    // ============================================================
    // ESTADO DE CARGA
    // ============================================================

    function mostrarCargando() {

        if (!tablaBody) {
            return;
        }

        tablaBody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center py-5">
                    <div class="spinner-border" role="status"></div>
                    <div class="mt-3">Cargando información...</div>
                </td>
            </tr>
        `;
    }

});