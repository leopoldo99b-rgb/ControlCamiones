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

    const modalCombustible =
        document.getElementById("modalCombustible");

    const destinoSelect =
        document.getElementById("destinoCombustible");

    const kmRuta =
        document.getElementById("kmRuta");

    const galonesRuta =
        document.getElementById("galonesRuta");

    const galonesInput =
        document.getElementById("galonesInput");

    const tipoCombustible =
        document.getElementById("tipoCombustible");

    const precioAplicado =
        document.getElementById("precioAplicado");

    const totalAbastecimiento =
        document.getElementById("totalAbastecimiento");

    const unidadSelect =
        document.getElementById("unidadCombustible");


    // ============================================================
    // ELEMENTOS - MODAL EDITAR PRECIO
    // ============================================================

    const modalPrecio =
        document.getElementById("modalPrecio");

    const combustiblePrecioSeleccionado =
        document.getElementById(
            "combustiblePrecioSeleccionado"
        );

    const nuevoPrecio =
        document.getElementById("nuevoPrecio");

    const btnGuardarPrecio =
        document.getElementById("btnGuardarPrecio");


    // ============================================================
    // ELEMENTOS DE LA VISTA
    // ============================================================

    const tablaBody =
        document.querySelector(".fuel-table tbody");

    const btnRegistrar =
        document.getElementById(
            "btnGuardarAbastecimiento"
        );

    const btnBuscar =
        document.getElementById("btnBuscar");

    const btnLimpiarFiltros =
        document.getElementById("btnLimpiarFiltros");

    const btnExportar =
        document.getElementById("btnExportar");


    // ============================================================
    // FECHA
    // ============================================================

    const fechaInput =
        document.getElementById("fechaCombustible");


    // ============================================================
    // MOTORISTA
    // ============================================================

    const motoristaSelect =
        document.getElementById(
            "motoristaCombustible"
        );


    // ============================================================
    // FILTROS
    // ============================================================

    const fechaDesde =
        document.getElementById("fechaDesde");

    const fechaHasta =
        document.getElementById("fechaHasta");

    const filtroPlaca =
        document.getElementById("filtroPlaca");

    const filtroCombustible =
        document.getElementById("filtroCombustible");


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

            console.error(
                "Error al inicializar:",
                error
            );

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

        const response =
            await fetch(
                API_COMBUSTIBLES + "/activos",
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (!response.ok) {

            const error =
                await obtenerRespuesta(response);

            throw new Error(
                error?.message ||
                error?.error ||
                "Error al obtener combustibles."
            );
        }


        const datos =
            await response.json();


        if (!Array.isArray(datos)) {

            throw new Error(
                "La API de combustibles no devolvió una lista válida."
            );
        }


        combustibles = datos;


        console.log(
            "Combustibles cargados:",
            combustibles
        );


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


            const option =
                document.createElement("option");


            option.value =
                combustible.id ?? "";


            option.textContent =
                combustible.nombre ?? "Sin nombre";


            option.dataset.precio =
                combustible.precioGalon ?? 0;


            tipoCombustible.appendChild(option);
        });
    }


    // ============================================================
    // TARJETAS DE PRECIOS
    // ============================================================

    function actualizarTarjetasPrecios() {

        const precioDiesel =
            document.getElementById("precioDiesel");

        const precioRegular =
            document.getElementById("precioRegular");

        const precioSuper =
            document.getElementById("precioSuper");


        const diesel =
            buscarCombustible("diesel");

        const regular =
            buscarCombustible("regular");

        const superCombustible =
            buscarCombustible("super");


        if (diesel && precioDiesel) {

            precioDiesel.textContent =
                formatearNumero(
                    diesel.precioGalon
                );
        }


        if (regular && precioRegular) {

            precioRegular.textContent =
                formatearNumero(
                    regular.precioGalon
                );
        }


        if (superCombustible && precioSuper) {

            precioSuper.textContent =
                formatearNumero(
                    superCombustible.precioGalon
                );
        }


        const ultimaActualizacion =
            document.getElementById(
                "ultimaActualizacion"
            );


        if (ultimaActualizacion) {

            const fechas =
                combustibles
                    .map(
                        combustible =>
                            combustible?.fechaActualizacion
                    )
                    .filter(Boolean);


            if (fechas.length > 0) {

                const fechaMasReciente =
                    fechas
                        .sort()
                        .reverse()[0];


                const fecha =
                    formatearFecha(
                        fechaMasReciente
                    );


                ultimaActualizacion.textContent =
                    `${fecha.fecha} ${fecha.hora}`;
            }
        }
    }


    // ============================================================
    // BUSCAR COMBUSTIBLE
    // ============================================================

    function buscarCombustible(tipo) {

        const texto =
            normalizarTexto(tipo);


        return combustibles.find(
            function (combustible) {

                if (!combustible) {
                    return false;
                }


                const nombre =
                    normalizarTexto(
                        combustible.nombre
                    );


                if (texto === "super") {

                    return nombre.includes("super");
                }


                if (texto === "regular") {

                    return nombre.includes("regular");
                }


                if (texto === "diesel") {

                    return nombre.includes("diesel");
                }


                return nombre.includes(texto);
            }
        );
    }


    // ============================================================
    // EDITAR PRECIO DE COMBUSTIBLE
    // ============================================================

    document
        .querySelectorAll(".btn-edit-price")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const tipo =
                        this.dataset.fuel;


                    const combustible =
                        buscarCombustible(tipo);


                    if (!combustible) {

                        mostrarAdvertencia(
                            "No se encontró el combustible seleccionado."
                        );

                        return;
                    }


                    if (!modalPrecio) {

                        mostrarError(
                            "No se encontró el modal para editar el precio."
                        );

                        return;
                    }


                    modalPrecio.dataset.combustibleId =
                        String(
                            combustible.id
                        );


                    modalPrecio.dataset.combustibleNombre =
                        combustible.nombre;


                    if (combustiblePrecioSeleccionado) {

                        combustiblePrecioSeleccionado.textContent =
                            combustible.nombre;
                    }


                    if (nuevoPrecio) {

                        nuevoPrecio.value =
                            combustible.precioGalon ?? "";
                    }
                }
            );
        });


    // ============================================================
    // GUARDAR NUEVO PRECIO
    // ============================================================

    if (btnGuardarPrecio) {

        btnGuardarPrecio.addEventListener(
            "click",
            async function () {

                const id =
                    modalPrecio?.dataset?.combustibleId;

                const nombre =
                    modalPrecio?.dataset?.combustibleNombre ||
                    "combustible";

                const precio =
                    parseFloat(
                        nuevoPrecio?.value
                    );


                if (!id) {

                    mostrarAdvertencia(
                        "No se pudo identificar el combustible que desea editar."
                    );

                    return;
                }


                if (
                    isNaN(precio) ||
                    precio <= 0
                ) {

                    mostrarAdvertencia(
                        "Ingrese un precio válido mayor que cero."
                    );


                    if (nuevoPrecio) {
                        nuevoPrecio.focus();
                    }


                    return;
                }


                const textoOriginal =
                    btnGuardarPrecio.innerHTML;


                btnGuardarPrecio.disabled =
                    true;


                btnGuardarPrecio.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Guardando...
                `;


                try {

                    const response =
                        await fetch(
                            `${API_COMBUSTIBLES}/${id}/precio`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                    "Accept":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify({
                                        precioGalon:
                                            precio
                                    })
                            }
                        );


                    const resultado =
                        await obtenerRespuesta(
                            response
                        );


                    if (!response.ok) {

                        throw new Error(
                            resultado?.message ||
                            resultado?.error ||
                            "No fue posible actualizar el precio."
                        );
                    }


                    const indice =
                        combustibles.findIndex(
                            function (combustible) {

                                return (
                                    String(
                                        combustible.id
                                    ) ===
                                    String(id)
                                );
                            }
                        );


                    if (indice !== -1) {

                        combustibles[indice].precioGalon =
                            precio;


                        if (
                            resultado?.fechaActualizacion
                        ) {

                            combustibles[indice]
                                .fechaActualizacion =
                                resultado.fechaActualizacion;
                        }
                    }


                    actualizarTarjetasPrecios();

                    llenarComboCombustibles();


                    if (
                        typeof bootstrap !==
                        "undefined" &&
                        modalPrecio
                    ) {

                        const instanciaModal =
                            bootstrap.Modal.getInstance(
                                modalPrecio
                            );


                        if (instanciaModal) {

                            instanciaModal.hide();

                        } else {

                            const nuevaInstancia =
                                bootstrap.Modal.getOrCreateInstance(
                                    modalPrecio
                                );

                            nuevaInstancia.hide();
                        }
                    }


                    limpiarModalPrecio();


                    mostrarExito(
                        `El precio de ${nombre} fue actualizado correctamente.`
                    );


                } catch (error) {

                    console.error(
                        "Error al actualizar precio:",
                        error
                    );


                    mostrarError(
                        error.message ||
                        "No fue posible actualizar el precio."
                    );


                } finally {

                    btnGuardarPrecio.disabled =
                        false;

                    btnGuardarPrecio.innerHTML =
                        textoOriginal;
                }
            }
        );
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

            combustiblePrecioSeleccionado.textContent =
                "—";
        }


        if (nuevoPrecio) {

            nuevoPrecio.value = "";
        }
    }


    // ============================================================
    // LIMPIAR MODAL PRECIO AL CERRAR
    // ============================================================

    if (modalPrecio) {

        modalPrecio.addEventListener(
            "hidden.bs.modal",
            function () {

                limpiarModalPrecio();
            }
        );
    }


    // ============================================================
    // CARGAR DESTINOS
    // ============================================================

    async function cargarDestinos() {

        const response =
            await fetch(
                API_DESTINOS,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            const error =
                await obtenerRespuesta(
                    response
                );


            throw new Error(
                error?.message ||
                error?.error ||
                `Error al obtener destinos. HTTP ${response.status}`
            );
        }


        const datos =
            await response.json();


        if (!Array.isArray(datos)) {

            throw new Error(
                "La API de destinos no devolvió una lista válida."
            );
        }


        destinos =
            datos;


        llenarComboDestinos();
    }


    // ============================================================
    // LLENAR COMBO DESTINOS
    // ============================================================

    function llenarComboDestinos() {

        if (!destinoSelect) {
            return;
        }


        destinoSelect.innerHTML = `
            <option value="" selected disabled>
                Seleccionar destino
            </option>
        `;


        destinos.forEach(
            function (destino) {

                if (!destino) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    destino.id ?? "";


                option.textContent =
                    destino.destino ??
                    "Sin nombre";


                option.dataset.km =
                    destino.km ?? "";


                option.dataset.galones =
                    destino.galones ?? "";


                destinoSelect.appendChild(
                    option
                );
            }
        );
    }


    // ============================================================
    // CAMBIO DE DESTINO
    // ============================================================

    if (destinoSelect) {

        destinoSelect.addEventListener(
            "change",
            function () {

                const option =
                    this.options[
                        this.selectedIndex
                    ];


                if (!option) {
                    return;
                }


                const km =
                    option.dataset.km;


                const galones =
                    option.dataset.galones;


                if (
                    km !== undefined &&
                    km !== null &&
                    km !== ""
                ) {

                    if (kmRuta) {

                        kmRuta.textContent =
                            formatearNumero(km) +
                            " km";
                    }

                } else {

                    if (kmRuta) {

                        kmRuta.textContent =
                            "— km";
                    }
                }


                if (
                    galones !== undefined &&
                    galones !== null &&
                    galones !== ""
                ) {

                    if (galonesRuta) {

                        galonesRuta.textContent =
                            formatearNumero(galones) +
                            " gal";
                    }


                    if (galonesInput) {

                        galonesInput.value =
                            Number(galones)
                                .toFixed(2);
                    }

                } else {

                    if (galonesRuta) {

                        galonesRuta.textContent =
                            "— gal";
                    }


                    if (galonesInput) {

                        galonesInput.value =
                            "";
                    }
                }


                calcularTotal();
            }
        );
    }


    // ============================================================
    // CAMBIO DE COMBUSTIBLE
    // ============================================================

    if (tipoCombustible) {

        tipoCombustible.addEventListener(
            "change",
            function () {

                const option =
                    this.options[
                        this.selectedIndex
                    ];


                if (!option) {
                    return;
                }


                const precio =
                    parseFloat(
                        option.dataset.precio
                    ) || 0;


                if (precioAplicado) {

                    precioAplicado.textContent =
                        precio.toFixed(2);
                }


                calcularTotal();
            }
        );
    }


    // ============================================================
    // CAMBIO DE GALONES
    // ============================================================

    if (galonesInput) {

        galonesInput.addEventListener(
            "input",
            calcularTotal
        );
    }


    // ============================================================
    // CALCULAR TOTAL
    // ============================================================

    function calcularTotal() {

        const galones =
            parseFloat(
                galonesInput?.value
            ) || 0;


        const precio =
            parseFloat(
                precioAplicado?.textContent
            ) || 0;


        const total =
            galones * precio;


        if (totalAbastecimiento) {

            totalAbastecimiento.textContent =
                "L. " +
                formatearNumero(total);
        }
    }


    // ============================================================
    // CARGAR CAMIONES
    // ============================================================

    async function cargarCamiones() {

        if (!unidadSelect) {
            return;
        }


        try {

            const response =
                await fetch(
                    API_CAMIONES,
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {

                console.warn(
                    "No se pudieron cargar camiones. HTTP:",
                    response.status
                );

                return;
            }


            const camiones =
                await response.json();


            if (!Array.isArray(camiones)) {
                return;
            }


            unidadSelect.innerHTML = `
                <option
                    selected
                    disabled
                    value="">
                    Seleccionar unidad
                </option>
            `;


            camiones.forEach(
                function (camion) {

                    if (!camion) {
                        return;
                    }


                    const option =
                        document.createElement(
                            "option"
                        );


                    const placa =
                        camion.placa ||
                        camion.Placa ||
                        camion.numeroPlaca ||
                        camion.codigo ||
                        camion.matricula;


                    if (!placa) {
                        return;
                    }


                    option.value =
                        placa;


                    option.textContent =
                        placa;


                    unidadSelect.appendChild(
                        option
                    );
                }
            );


        } catch (error) {

            console.warn(
                "No se pudieron cargar camiones:",
                error
            );
        }
    }


    // ============================================================
    // CARGAR CONDUCTORES
    // ============================================================

	async function cargarConductores() {

	    if (!motoristaSelect) {
	        return;
	    }

	    try {

	        const response = await fetch(
	            API_CONDUCTORES,
	            {
	                method: "GET",
	                headers: {
	                    "Accept": "application/json"
	                }
	            }
	        );

	        if (!response.ok) {

	            console.warn(
	                "No se pudieron cargar conductores. HTTP:",
	                response.status
	            );

	            return;
	        }

	        const conductores = await response.json();

	        if (!Array.isArray(conductores)) {

	            console.warn(
	                "La API de conductores no devolvió una lista válida."
	            );

	            return;
	        }

	        motoristaSelect.innerHTML = `
	            <option selected disabled value="">
	                Seleccionar motorista
	            </option>
	        `;

	        conductores.forEach(function (conductor) {

	            if (!conductor) {
	                return;
	            }

	            const option = document.createElement("option");

	            /*
	             * Tu entidad Conductor puede devolver
	             * nombre y apellido por separado.
	             */
	            let nombre = conductor.nombreCompleto;

	            if (!nombre && conductor.nombre) {

	                nombre = conductor.nombre;

	                if (conductor.apellido) {
	                    nombre += " " + conductor.apellido;
	                }
	            }

	            /*
	             * Compatibilidad por si tu entidad usa
	             * alguno de estos nombres.
	             */
	            nombre =
	                nombre ||
	                conductor.motorista ||
	                conductor.nombreConductor;

	            if (!nombre) {
	                return;
	            }

	            option.value = nombre;
	            option.textContent = nombre;

	            motoristaSelect.appendChild(option);

	        });

	    } catch (error) {

	        console.warn(
	            "No se pudieron cargar conductores:",
	            error
	        );
	    }
	}
    // ============================================================
    // CARGAR ABASTECIMIENTOS
    // ============================================================

    async function cargarAbastecimientos() {

        const response =
            await fetch(
                API_ABASTECIMIENTOS,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            const error =
                await obtenerRespuesta(
                    response
                );


            throw new Error(
                error?.message ||
                error?.error ||
                `Error al obtener abastecimientos. HTTP ${response.status}`
            );
        }


        const datos =
            await response.json();


        if (!Array.isArray(datos)) {

            throw new Error(
                "La API de abastecimientos no devolvió una lista válida."
            );
        }


        abastecimientos =
            datos;


        renderizarTabla(
            abastecimientos
        );
    }


    // ============================================================
    // MOSTRAR TABLA
    // ============================================================

    function renderizarTabla(registros) {

        if (!tablaBody) {
            return;
        }


        tablaBody.innerHTML = "";


        if (
            !Array.isArray(registros) ||
            registros.length === 0
        ) {

            tablaBody.innerHTML = `
                <tr>
                    <td
                        colspan="10"
                        class="text-center py-5">

                        <i class="bi bi-inbox fs-2"></i>

                        <div class="mt-2">
                            No existen abastecimientos
                            registrados.
                        </div>

                    </td>
                </tr>
            `;


            actualizarFooter(0);

            return;
        }


        registros.forEach(
            function (registro) {

                if (!registro) {
                    return;
                }


                const tr =
                    document.createElement("tr");


                const fecha =
                    formatearFecha(
                        registro.fecha
                    );


                const combustibleNombre =
                    registro.combustible?.nombre ||
                    registro.combustibleNombre ||
                    "—";


                const combustibleClase =
                    obtenerClaseCombustible(
                        combustibleNombre
                    );


                tr.innerHTML = `
                    <td>
                        <span class="date-main">
                            ${escaparHTML(fecha.fecha)}
                        </span>

                        <span class="date-time">
                            ${escaparHTML(fecha.hora)}
                        </span>
                    </td>

                    <td>
                        <span class="unit-badge">
                            ${escaparHTML(
                                registro.placa
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="driver-name">
                            ${escaparHTML(
                                registro.motorista
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="destination-name">
                            ${escaparHTML(
                                registro.destino
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="km-value">
                            ${formatearNumero(
                                registro.kmRuta
                            )}
                            km
                        </span>
                    </td>

                    <td>
                        <span class="gallons-value">
                            ${formatearNumero(
                                registro.galonesAutorizados
                            )}
                            gal
                        </span>
                    </td>

                    <td>
                        <span
                            class="fuel-badge ${combustibleClase}">
                            ${escaparHTML(
                                combustibleNombre
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="money-cell">
                            L.
                            ${formatearNumero(
                                registro.precioGalon
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="total-cell">
                            L.
                            ${formatearNumero(
                                registro.total
                            )}
                        </span>
                    </td>

                    <td>
                        <div class="action-buttons">

                            <button
                                type="button"
                                class="action-btn edit"
                                title="Editar"
                                data-id="${registro.id}">

                                <i class="bi bi-pencil"></i>

                            </button>

                            <button
                                type="button"
                                class="action-btn delete"
                                title="Eliminar"
                                data-id="${registro.id}">

                                <i class="bi bi-trash3"></i>

                            </button>

                        </div>
                    </td>
                `;


                tablaBody.appendChild(tr);
            }
        );


        actualizarFooter(
            registros.length
        );
    }


    // ============================================================
    // EDITAR / ELIMINAR
    // ============================================================

    if (tablaBody) {

        tablaBody.addEventListener(
            "click",
            function (event) {

                const botonEditar =
                    event.target.closest(
                        ".action-btn.edit"
                    );


                const botonEliminar =
                    event.target.closest(
                        ".action-btn.delete"
                    );


                if (botonEditar) {

                    editarAbastecimiento(
                        botonEditar.dataset.id
                    );

                    return;
                }


                if (botonEliminar) {

                    eliminarAbastecimiento(
                        botonEliminar.dataset.id
                    );
                }
            }
        );
    }


    // ============================================================
    // EDITAR ABASTECIMIENTO
    // ============================================================

    async function editarAbastecimiento(id) {

        if (!id) {
            return;
        }


        try {

            const response =
                await fetch(
                    `${API_ABASTECIMIENTOS}/${id}`,
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {

                const error =
                    await obtenerRespuesta(
                        response
                    );


                throw new Error(
                    error?.message ||
                    error?.error ||
                    "No se encontró el registro."
                );
            }


            const registro =
                await response.json();


            editandoId =
                id;


            abrirModalEdicion(
                registro
            );


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


        if (
            fechaInput &&
            registro.fecha
        ) {

            fechaInput.value =
                String(
                    registro.fecha
                ).substring(0, 10);
        }


        if (unidadSelect) {

            unidadSelect.value =
                registro.placa ?? "";
        }


        if (motoristaSelect) {

            motoristaSelect.value =
                registro.motorista ?? "";
        }


        if (destinoSelect) {

            const destino =
                destinos.find(
                    function (d) {

                        return (
                            normalizarTexto(
                                d.destino
                            ) ===
                            normalizarTexto(
                                registro.destino
                            )
                        );
                    }
                );


            if (destino) {

                destinoSelect.value =
                    destino.id;


                destinoSelect.dispatchEvent(
                    new Event("change")
                );
            }
        }


        if (tipoCombustible) {

            let combustibleId =
                registro.combustibleId;


            if (
                !combustibleId &&
                registro.combustible
            ) {

                combustibleId =
                    registro.combustible.id;
            }


            if (combustibleId) {

                tipoCombustible.value =
                    combustibleId;


                tipoCombustible.dispatchEvent(
                    new Event("change")
                );
            }
        }


        if (galonesInput) {

            galonesInput.value =
                registro.galonesAutorizados ?? "";
        }


        calcularTotal();


        if (btnRegistrar) {

            btnRegistrar.innerHTML = `
                <i class="bi bi-check-lg"></i>
                Actualizar abastecimiento
            `;
        }


        if (
            typeof bootstrap !==
            "undefined"
        ) {

            const instancia =
                bootstrap.Modal.getOrCreateInstance(
                    modalCombustible
                );


            instancia.show();
        }
    }


    // ============================================================
    // GUARDAR / ACTUALIZAR ABASTECIMIENTO
    // ============================================================

    if (btnRegistrar) {

        btnRegistrar.addEventListener(
            "click",
            async function () {

                await guardarAbastecimiento();
            }
        );
    }


    async function guardarAbastecimiento() {

        try {

            const datos =
                obtenerDatosFormulario();


            const error =
                validarFormulario(
                    datos
                );


            if (error) {

                mostrarAdvertencia(
                    error
                );

                return;
            }


            mostrarProcesando(
                editandoId
                    ? "Actualizando abastecimiento..."
                    : "Registrando abastecimiento..."
            );


            const url =
                editandoId
                    ? `${API_ABASTECIMIENTOS}/${editandoId}`
                    : API_ABASTECIMIENTOS;


            const metodo =
                editandoId
                    ? "PUT"
                    : "POST";


            const response =
                await fetch(
                    url,
                    {
                        method: metodo,
                        headers: {
                            "Content-Type":
                                "application/json",
                            "Accept":
                                "application/json"
                        },
                        body:
                            JSON.stringify(datos)
                    }
                );


            const resultado =
                await obtenerRespuesta(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    resultado?.message ||
                    resultado?.error ||
                    resultado ||
                    "No fue posible guardar el abastecimiento."
                );
            }


            cerrarSweetAlert();

            cerrarModal();

            limpiarFormulario();


            await cargarAbastecimientos();


            actualizarResumen();


            mostrarExito(
                editandoId
                    ? "El abastecimiento fue actualizado correctamente."
                    : "El abastecimiento fue registrado correctamente."
            );


            editandoId =
                null;


        } catch (error) {

            console.error(
                "Error guardando abastecimiento:",
                error
            );


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

        const destinoOption =
            destinoSelect?.options[
                destinoSelect.selectedIndex
            ];


        const combustibleOption =
            tipoCombustible?.options[
                tipoCombustible.selectedIndex
            ];


        const galones =
            parseFloat(
                galonesInput?.value
            ) || 0;


        const precio =
            parseFloat(
                precioAplicado?.textContent
            ) || 0;


        const total =
            galones * precio;


        let fecha =
            fechaInput?.value || "";


        if (fecha) {

            fecha +=
                "T00:00:00";
        }


        return {

            fecha:
                fecha || null,

            placa:
                unidadSelect?.value || "",

            motorista:
                motoristaSelect?.value || "",

            destino:
                destinoOption
                    ?.textContent
                    ?.trim() || "",

            kmRuta:
                destinoOption?.dataset.km !==
                    undefined &&
                destinoOption?.dataset.km !==
                    ""
                    ? Number(
                        destinoOption.dataset.km
                    )
                    : 0,

            galonesAutorizados:
                galones,

            combustibleId:
                combustibleOption?.value
                    ? Number(
                        combustibleOption.value
                    )
                    : null,

            precioGalon:
                precio,

            total:
                Number(
                    total.toFixed(2)
                )
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

            return "Seleccione un motorista.";
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


        if (
            !datos.galonesAutorizados ||
            datos.galonesAutorizados <= 0
        ) {

            return "Los galones autorizados deben ser mayores a cero.";
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


        return null;
    }


    // ============================================================
    // ELIMINAR
    // ============================================================

    async function eliminarAbastecimiento(id) {

        const registro =
            abastecimientos.find(
                function (item) {

                    return (
                        String(item.id) ===
                        String(id)
                    );
                }
            );


        const placa =
            registro?.placa || "";


        const destino =
            registro?.destino || "";


        const total =
            registro?.total || 0;


        const confirmado =
            await confirmarEliminacion(
                placa,
                destino,
                total
            );


        if (!confirmado) {
            return;
        }


        try {

            mostrarProcesando(
                "Eliminando abastecimiento..."
            );


            const response =
                await fetch(
                    `${API_ABASTECIMIENTOS}/${id}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!response.ok) {

                const resultado =
                    await obtenerRespuesta(
                        response
                    );


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


            mostrarExito(
                "El abastecimiento fue eliminado correctamente."
            );


        } catch (error) {

            console.error(error);


            cerrarSweetAlert();


            mostrarError(
                error.message ||
                "No fue posible eliminar el registro."
            );
        }
    }


    // ============================================================
    // CONFIRMACIÓN ELIMINACIÓN
    // ============================================================

    async function confirmarEliminacion(
        placa,
        destino,
        total
    ) {

        if (
            typeof Swal !==
            "undefined"
        ) {

            const resultado =
                await Swal.fire({

                    title:
                        "¿Eliminar abastecimiento?",

                    html: `
                        <p>
                            Esta acción eliminará
                            el registro seleccionado.
                        </p>

                        <div class="delete-record">

                            <strong>
                                ${escaparHTML(placa)}
                            </strong>

                            <span>
                                ${escaparHTML(destino)}
                                ·
                                L. ${formatearNumero(total)}
                            </span>

                        </div>
                    `,

                    icon:
                        "warning",

                    showCancelButton:
                        true,

                    confirmButtonText:
                        "Sí, eliminar",

                    cancelButtonText:
                        "Cancelar",

                    reverseButtons:
                        true
                });


            return resultado.isConfirmed;
        }


        return window.confirm(
            "¿Está seguro de eliminar este abastecimiento?"
        );
    }


    // ============================================================
    // CERRAR MODAL
    // ============================================================

    function cerrarModal() {

        if (!modalCombustible) {
            return;
        }


        if (
            typeof bootstrap !==
            "undefined"
        ) {

            const instancia =
                bootstrap.Modal.getInstance(
                    modalCombustible
                );


            if (instancia) {

                instancia.hide();
            }
        }
    }


    // ============================================================
    // LIMPIAR FORMULARIO
    // ============================================================

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

                kmRuta.textContent =
                    "— km";
            }


            if (galonesRuta) {

                galonesRuta.textContent =
                    "— gal";
            }
        }


        if (tipoCombustible) {

            tipoCombustible.value = "";
        }


        if (galonesInput) {

            galonesInput.value = "";
        }


        if (precioAplicado) {

            precioAplicado.textContent =
                "0.00";
        }


        if (totalAbastecimiento) {

            totalAbastecimiento.textContent =
                "L. 0.00";
        }


        if (btnRegistrar) {

            btnRegistrar.innerHTML = `
                <i class="bi bi-check-lg"></i>
                Registrar abastecimiento
            `;
        }


        editandoId =
            null;
    }


    // ============================================================
    // EVENTO CERRAR MODAL ABASTECIMIENTO
    // ============================================================

    if (modalCombustible) {

        modalCombustible.addEventListener(
            "hidden.bs.modal",
            function () {

                limpiarFormulario();
            }
        );
    }


    // ============================================================
    // BUSCAR
    // ============================================================

    if (btnBuscar) {

        btnBuscar.addEventListener(
            "click",
            function () {

                aplicarFiltros();
            }
        );
    }


    // ============================================================
    // LIMPIAR FILTROS
    // ============================================================

    if (btnLimpiarFiltros) {

        btnLimpiarFiltros.addEventListener(
            "click",
            function () {

                console.log(
                    "Limpiando filtros..."
                );


                // ------------------------------------------------
                // LIMPIAR FECHA DESDE
                // ------------------------------------------------

                if (fechaDesde) {

                    fechaDesde.value = "";
                }


                // ------------------------------------------------
                // LIMPIAR FECHA HASTA
                // ------------------------------------------------

                if (fechaHasta) {

                    fechaHasta.value = "";
                }


                // ------------------------------------------------
                // RESTABLECER UNIDAD
                // ------------------------------------------------

                if (filtroPlaca) {

                    filtroPlaca.value = "";
                }


                // ------------------------------------------------
                // RESTABLECER COMBUSTIBLE
                // ------------------------------------------------

                if (filtroCombustible) {

                    filtroCombustible.value = "";
                }


                // ------------------------------------------------
                // MOSTRAR TODOS LOS REGISTROS
                // ------------------------------------------------
                // IMPORTANTE:
                // abastecimientos contiene todos los registros
                // cargados desde la API.
                // No debemos llamar aplicarFiltros(),
                // porque eso volvería a filtrar la información.

                renderizarTabla(
                    abastecimientos
                );


                // ------------------------------------------------
                // RESTAURAR RESUMEN COMPLETO
                // ------------------------------------------------

                actualizarResumen(
                    abastecimientos
                );


                console.log(
                    "Filtros limpiados correctamente."
                );

                console.log(
                    "Total de registros:",
                    abastecimientos.length
                );
            }
        );
    }


    // ============================================================
    // APLICAR FILTROS
    // ============================================================

    function aplicarFiltros() {

        let resultado =
            [...abastecimientos];


        // --------------------------------------------------------
        // FILTRO FECHA DESDE
        // --------------------------------------------------------

        if (fechaDesde?.value) {

            resultado =
                resultado.filter(
                    function (registro) {

                        const fecha =
                            obtenerFechaSolo(
                                registro.fecha
                            );


                        return (
                            fecha >=
                            fechaDesde.value
                        );
                    }
                );
        }


        // --------------------------------------------------------
        // FILTRO FECHA HASTA
        // --------------------------------------------------------

        if (fechaHasta?.value) {

            resultado =
                resultado.filter(
                    function (registro) {

                        const fecha =
                            obtenerFechaSolo(
                                registro.fecha
                            );


                        return (
                            fecha <=
                            fechaHasta.value
                        );
                    }
                );
        }


        // --------------------------------------------------------
        // FILTRO PLACA
        // --------------------------------------------------------

        if (
            filtroPlaca &&
            filtroPlaca.value
        ) {

            resultado =
                resultado.filter(
                    function (registro) {

                        return (
                            normalizarTexto(
                                registro.placa
                            ) ===
                            normalizarTexto(
                                filtroPlaca.value
                            )
                        );
                    }
                );
        }


        // --------------------------------------------------------
        // FILTRO COMBUSTIBLE
        // --------------------------------------------------------

        if (
            filtroCombustible &&
            filtroCombustible.value
        ) {

            resultado =
                resultado.filter(
                    function (registro) {

                        const nombre =
                            registro.combustible?.nombre ||
                            registro.combustibleNombre ||
                            "";


                        return (
                            normalizarTexto(
                                nombre
                            ) ===
                            normalizarTexto(
                                filtroCombustible.value
                            )
                        );
                    }
                );
        }


        // --------------------------------------------------------
        // MOSTRAR RESULTADO
        // --------------------------------------------------------

        renderizarTabla(
            resultado
        );


        // --------------------------------------------------------
        // ACTUALIZAR RESUMEN
        // --------------------------------------------------------

        actualizarResumen(
            resultado
        );


        console.log(
            "Filtros aplicados.",
            "Resultados:",
            resultado.length
        );
    }


    // ============================================================
    // FILTRO PLACAS
    // ============================================================

    function actualizarFiltroPlacas() {

        if (!filtroPlaca) {
            return;
        }


        const valorActual =
            filtroPlaca.value;


        const placas =
            [
                ...new Set(
                    abastecimientos
                        .map(
                            item =>
                                item?.placa
                        )
                        .filter(Boolean)
                )
            ];


        filtroPlaca.innerHTML = `
            <option value="">
                Todas las unidades
            </option>
        `;


        placas
            .sort()
            .forEach(
                function (placa) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        placa;


                    option.textContent =
                        placa;


                    filtroPlaca.appendChild(
                        option
                    );
                }
            );


        if (
            placas.includes(
                valorActual
            )
        ) {

            filtroPlaca.value =
                valorActual;
        }
    }


    // ============================================================
    // FILTRO COMBUSTIBLES
    // ============================================================

    function actualizarFiltroCombustibles() {

        if (!filtroCombustible) {
            return;
        }


        const valorActual =
            filtroCombustible.value;


        filtroCombustible.innerHTML = `
            <option value="">
                Todos
            </option>
        `;


        combustibles.forEach(
            function (combustible) {

                if (!combustible?.nombre) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    combustible.nombre;


                option.textContent =
                    combustible.nombre;


                filtroCombustible.appendChild(
                    option
                );
            }
        );


        if (
            [
                ...filtroCombustible.options
            ]
            .some(
                option =>
                    option.value ===
                    valorActual
            )
        ) {

            filtroCombustible.value =
                valorActual;
        }
    }


    // ============================================================
    // RESUMEN
    // ============================================================

    function actualizarResumen(
        registros = abastecimientos
    ) {

        if (!Array.isArray(registros)) {

            registros = [];
        }


        const totalGalones =
            registros.reduce(
                function (total, item) {

                    return (
                        total +
                        (
                            Number(
                                item?.galonesAutorizados
                            ) || 0
                        )
                    );
                },
                0
            );


        const totalCosto =
            registros.reduce(
                function (total, item) {

                    return (
                        total +
                        (
                            Number(
                                item?.total
                            ) || 0
                        )
                    );
                },
                0
            );


        const cantidad =
            registros.length;


        const totalGalonesElemento =
            document.getElementById(
                "totalGalones"
            );


        const totalCostoElemento =
            document.getElementById(
                "totalCosto"
            );


        const totalViajesElemento =
            document.getElementById(
                "totalViajes"
            );


        if (totalGalonesElemento) {

            totalGalonesElemento.textContent =
                formatearNumero(
                    totalGalones
                );
        }


        if (totalCostoElemento) {

            totalCostoElemento.textContent =
                "L. " +
                formatearNumero(
                    totalCosto
                );
        }


        if (totalViajesElemento) {

            totalViajesElemento.textContent =
                cantidad;
        }


        actualizarFiltroPlacas();

        actualizarFiltroCombustibles();
    }


    // ============================================================
    // FOOTER
    // ============================================================

    function actualizarFooter(cantidad) {

        const footer =
            document.querySelector(
                ".table-footer"
            );


        if (!footer) {
            return;
        }


        const registroDesde =
            document.getElementById(
                "registroDesde"
            );


        const registroHasta =
            document.getElementById(
                "registroHasta"
            );


        const totalRegistros =
            document.getElementById(
                "totalRegistros"
            );


        if (registroDesde) {

            registroDesde.textContent =
                cantidad > 0
                    ? "1"
                    : "0";
        }


        if (registroHasta) {

            registroHasta.textContent =
                cantidad;
        }


        if (totalRegistros) {

            totalRegistros.textContent =
                abastecimientos.length;
        }
    }


    // ============================================================
    // FECHA ACTUAL
    // ============================================================

    function establecerFechaActual() {

        if (!fechaInput) {
            return;
        }


        const hoy =
            new Date();


        const año =
            hoy.getFullYear();


        const mes =
            String(
                hoy.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const dia =
            String(
                hoy.getDate()
            ).padStart(
                2,
                "0"
            );


        fechaInput.value =
            `${año}-${mes}-${dia}`;
    }


    // ============================================================
    // OBTENER FECHA YYYY-MM-DD
    // ============================================================

    function obtenerFechaSolo(fecha) {

        if (!fecha) {
            return "";
        }


        return String(fecha)
            .substring(
                0,
                10
            );
    }


    // ============================================================
    // FORMATEAR FECHA
    // ============================================================

    function formatearFecha(fecha) {

        if (!fecha) {

            return {
                fecha: "—",
                hora: ""
            };
        }


        const texto =
            String(fecha);


        const fechaObj =
            new Date(texto);


        if (
            isNaN(
                fechaObj.getTime()
            )
        ) {

            return {
                fecha:
                    obtenerFechaSolo(
                        texto
                    ),
                hora: ""
            };
        }


        return {

            fecha:
                fechaObj.toLocaleDateString(
                    "es-HN"
                ),

            hora:
                fechaObj.toLocaleTimeString(
                    "es-HN",
                    {
                        hour:
                            "2-digit",

                        minute:
                            "2-digit"
                    }
                )
        };
    }


    // ============================================================
    // FORMATEAR NÚMEROS
    // ============================================================

    function formatearNumero(numero) {

        const valor =
            Number(numero);


        return (
            isNaN(valor)
                ? 0
                : valor
        ).toLocaleString(
            "es-HN",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        );
    }


    // ============================================================
    // NORMALIZAR TEXTO
    // ============================================================

    function normalizarTexto(texto) {

        return String(
            texto ?? ""
        )
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim();
    }


    // ============================================================
    // CLASE COMBUSTIBLE
    // ============================================================

    function obtenerClaseCombustible(nombre) {

        const texto =
            normalizarTexto(
                nombre
            );


        if (
            texto.includes("diesel")
        ) {

            return "diesel";
        }


        if (
            texto.includes("regular")
        ) {

            return "regular";
        }


        if (
            texto.includes("super")
        ) {

            return "super";
        }


        return "";
    }


    // ============================================================
    // ESCAPAR HTML
    // ============================================================

    function escaparHTML(texto) {

        return String(
            texto ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    // ============================================================
    // RESPUESTA HTTP
    // ============================================================

    async function obtenerRespuesta(response) {

        const texto =
            await response.text();


        if (!texto) {
            return null;
        }


        try {

            return JSON.parse(
                texto
            );

        } catch {

            return {
                message: texto
            };
        }
    }


    // ============================================================
    // MENSAJES
    // ============================================================

    function mostrarExito(mensaje) {

        if (
            typeof Swal !==
            "undefined"
        ) {

            Swal.fire({

                icon:
                    "success",

                title:
                    "Operación exitosa",

                text:
                    mensaje,

                confirmButtonText:
                    "Aceptar",

                timer:
                    2500,

                timerProgressBar:
                    true
            });


            return;
        }


        mostrarToast(
            "toastExito",
            mensaje
        );
    }


    function mostrarAdvertencia(mensaje) {

        if (
            typeof Swal !==
            "undefined"
        ) {

            Swal.fire({

                icon:
                    "warning",

                title:
                    "Verifique los datos",

                text:
                    mensaje,

                confirmButtonText:
                    "Aceptar"
            });


            return;
        }


        mostrarToast(
            "toastAdvertencia",
            mensaje
        );
    }


    function mostrarError(mensaje) {

        if (
            typeof Swal !==
            "undefined"
        ) {

            Swal.fire({

                icon:
                    "error",

                title:
                    "Error",

                text:
                    mensaje,

                confirmButtonText:
                    "Aceptar"
            });


            return;
        }


        mostrarToast(
            "toastError",
            mensaje
        );
    }


    function mostrarProcesando(mensaje) {

        if (
            typeof Swal !==
            "undefined"
        ) {

            Swal.fire({

                title:
                    mensaje,

                allowOutsideClick:
                    false,

                allowEscapeKey:
                    false,

                didOpen:
                    function () {

                        Swal.showLoading();
                    }
            });
        }
    }


    function mostrarToast(
        id,
        mensaje
    ) {

        const toast =
            document.getElementById(id);


        if (!toast) {
            return;
        }


        const parrafo =
            toast.querySelector("p");


        if (parrafo) {

            parrafo.textContent =
                mensaje;
        }


        if (
            typeof bootstrap !==
            "undefined"
        ) {

            const instancia =
                bootstrap.Toast.getOrCreateInstance(
                    toast
                );


            instancia.show();
        }
    }


    // ============================================================
    // CERRAR SWEETALERT
    // ============================================================

    function cerrarSweetAlert() {

        if (
            typeof Swal !==
            "undefined"
        ) {

            Swal.close();
        }
    }


    window.addEventListener(
        "beforeunload",
        cerrarSweetAlert
    );


	// ============================================================
	// EXPORTAR REPORTE PDF
	// ============================================================

	if (btnExportar) {

	    btnExportar.addEventListener(
	        "click",
	        exportarPDF
	    );

	}

	async function exportarPDF() {

	    if (
	        typeof window.jspdf === "undefined" ||
	        typeof window.jspdf.jsPDF === "undefined"
	    ) {

	        mostrarError(
	            "No se pudo cargar la herramienta para generar el PDF."
	        );

	        return;
	    }

	    let registros = [...abastecimientos];

	    // ============================================================
	    // APLICAR FILTROS
	    // ============================================================

	    if (fechaDesde?.value) {

	        registros = registros.filter(function (registro) {

	            const fecha =
	                obtenerFechaSolo(
	                    registro.fecha
	                );

	            return fecha >= fechaDesde.value;

	        });

	    }

	    if (fechaHasta?.value) {

	        registros = registros.filter(function (registro) {

	            const fecha =
	                obtenerFechaSolo(
	                    registro.fecha
	                );

	            return fecha <= fechaHasta.value;

	        });

	    }

	    if (
	        filtroPlaca &&
	        filtroPlaca.value
	    ) {

	        registros = registros.filter(function (registro) {

	            return (
	                normalizarTexto(
	                    registro.placa
	                ) ===
	                normalizarTexto(
	                    filtroPlaca.value
	                )
	            );

	        });

	    }

	    if (
	        filtroCombustible &&
	        filtroCombustible.value
	    ) {

	        registros = registros.filter(function (registro) {

	            const nombre =
	                registro.combustible?.nombre ||
	                registro.combustibleNombre ||
	                "";

	            return (
	                normalizarTexto(
	                    nombre
	                ) ===
	                normalizarTexto(
	                    filtroCombustible.value
	                )
	            );

	        });

	    }

	    if (
	        !registros ||
	        registros.length === 0
	    ) {

	        mostrarAdvertencia(
	            "No existen registros que coincidan con los filtros seleccionados."
	        );

	        return;
	    }

	    // ============================================================
	    // CREAR PDF
	    // ============================================================

	    const { jsPDF } =
	        window.jspdf;

	    const doc =
	        new jsPDF({
	            orientation: "landscape",
	            unit: "mm",
	            format: "a4"
	        });

	    const anchoPagina =
	        doc.internal.pageSize.getWidth();

	    const altoPagina =
	        doc.internal.pageSize.getHeight();

	    const margen = 12;

	    // ============================================================
	    // PERÍODO
	    // ============================================================

	    let textoRango =
	        "Todos los registros";

	    if (
	        fechaDesde?.value &&
	        fechaHasta?.value
	    ) {

	        textoRango =
	            `${formatearFechaPDF(fechaDesde.value)} al ${formatearFechaPDF(fechaHasta.value)}`;

	    } else if (
	        fechaDesde?.value
	    ) {

	        textoRango =
	            `Desde ${formatearFechaPDF(fechaDesde.value)}`;

	    } else if (
	        fechaHasta?.value
	    ) {

	        textoRango =
	            `Hasta ${formatearFechaPDF(fechaHasta.value)}`;

	    }

	    // ============================================================
	    // FECHA DE GENERACIÓN
	    // SIN HORA
	    // ============================================================

	    const ahora =
	        new Date();

	    const fechaGeneracion =
	        ahora.toLocaleDateString(
	            "es-HN",
	            {
	                day: "2-digit",
	                month: "2-digit",
	                year: "numeric"
	            }
	        );

	    // ============================================================
	    // TOTALES
	    // ============================================================

	    const totalGalones =
	        registros.reduce(
	            function (
	                total,
	                item
	            ) {

	                return (
	                    total +
	                    (
	                        Number(
	                            item?.galonesAutorizados
	                        ) || 0
	                    )
	                );

	            },
	            0
	        );

	    const totalCosto =
	        registros.reduce(
	            function (
	                total,
	                item
	            ) {

	                return (
	                    total +
	                    (
	                        Number(
	                            item?.total
	                        ) || 0
	                    )
	                );

	            },
	            0
	        );

	    const totalKilometros =
	        registros.reduce(
	            function (
	                total,
	                item
	            ) {

	                return (
	                    total +
	                    (
	                        Number(
	                            item?.kmRuta
	                        ) || 0
	                    )
	                );

	            },
	            0
	        );

	    // ============================================================
	    // ENCABEZADO
	    // ============================================================

	    doc.setFillColor(
	        18,
	        31,
	        48
	    );

	    doc.rect(
	        0,
	        0,
	        anchoPagina,
	        34,
	        "F"
	    );

	    // ============================================================
	    // CARGAR LOGO
	    // ============================================================

	    let logo = null;

	    try {

	        logo =
	            await cargarImagenPDF(
	                "/imgs/logo.png"
	            );

	    } catch (error) {

	        console.warn(
	            "No se pudo cargar el logo:",
	            error
	        );

	    }

	    // ============================================================
	    // LOGO
	    // MÁS ANCHO
	    // ALTO: 22 MM
	    // ============================================================

	    if (logo) {

	        const logoAncho = 34;
	        const logoAlto = 22;

	        doc.addImage(
	            logo,
	            "PNG",
	            margen,
	            6,
	            logoAncho,
	            logoAlto
	        );

	    }

	    // ============================================================
	    // TEXTOS DEL ENCABEZADO
	    // ============================================================

	    const xContenido =
	        margen + 40;

	    doc.setTextColor(
	        255,
	        255,
	        255
	    );

	    doc.setFont(
	        "helvetica",
	        "bold"
	    );

	    doc.setFontSize(
	        20
	    );

	    doc.text(
	        "REPORTE DE COMBUSTIBLE",
	        xContenido,
	        14
	    );

	    doc.setFont(
	        "helvetica",
	        "normal"
	    );

	    doc.setFontSize(
	        9
	    );

	    doc.setTextColor(
	        220,
	        226,
	        232
	    );

	    doc.text(
	        "Control de abastecimientos y consumo de combustible",
	        xContenido,
	        21
	    );

	    doc.setFont(
	        "helvetica",
	        "bold"
	    );

	    doc.setFontSize(
	        10
	    );

	    doc.setTextColor(
	        255,
	        255,
	        255
	    );

	    // ============================================================
	    // PERÍODO EN EL ENCABEZADO
	    // ============================================================

	    doc.text(
	        `Período: ${textoRango}`,
	        xContenido,
	        28
	    );

	    // ============================================================
	    // INFORMACIÓN DERECHA
	    // SOLO FECHA
	    // SIN HORA
	    // ============================================================

	    doc.setFont(
	        "helvetica",
	        "normal"
	    );

	    doc.setFontSize(
	        8
	    );

	    doc.text(
	        `Generado: ${fechaGeneracion}`,
	        anchoPagina - margen,
	        13,
	        {
	            align: "right"
	        }
	    );

	    doc.text(
	        `Registros: ${registros.length}`,
	        anchoPagina - margen,
	        20,
	        {
	            align: "right"
	        }
	    );

	    // ============================================================
	    // RESUMEN
	    // ============================================================

	    const yResumen = 42;

	    const espacio = 4;

	    const anchoTarjeta =
	        (
	            anchoPagina -
	            (margen * 2) -
	            (espacio * 3)
	        ) / 4;

	    function dibujarTarjeta(
	        x,
	        titulo,
	        valor,
	        subtitulo
	    ) {

	        // --------------------------------------------------------
	        // FONDO
	        // --------------------------------------------------------

	        doc.setFillColor(
	            245,
	            247,
	            250
	        );

	        doc.roundedRect(
	            x,
	            yResumen,
	            anchoTarjeta,
	            25,
	            2,
	            2,
	            "F"
	        );

	        // --------------------------------------------------------
	        // BORDE
	        // --------------------------------------------------------

	        doc.setDrawColor(
	            220,
	            224,
	            230
	        );

	        doc.roundedRect(
	            x,
	            yResumen,
	            anchoTarjeta,
	            25,
	            2,
	            2,
	            "S"
	        );

	        // --------------------------------------------------------
	        // TÍTULO
	        // --------------------------------------------------------

	        doc.setTextColor(
	            90,
	            99,
	            110
	        );

	        doc.setFont(
	            "helvetica",
	            "bold"
	        );

	        doc.setFontSize(
	            7
	        );

	        doc.text(
	            titulo.toUpperCase(),
	            x + 5,
	            yResumen + 7
	        );

	        // --------------------------------------------------------
	        // VALOR
	        // --------------------------------------------------------

	        doc.setTextColor(
	            18,
	            31,
	            48
	        );

	        doc.setFont(
	            "helvetica",
	            "bold"
	        );

	        doc.setFontSize(
	            13
	        );

	        doc.text(
	            valor,
	            x + 5,
	            yResumen + 15
	        );

	        // --------------------------------------------------------
	        // SUBTÍTULO
	        // --------------------------------------------------------

	        doc.setTextColor(
	            120,
	            128,
	            138
	        );

	        doc.setFont(
	            "helvetica",
	            "normal"
	        );

	        doc.setFontSize(
	            6.5
	        );

	        doc.text(
	            subtitulo,
	            x + 5,
	            yResumen + 21
	        );

	    }

	    // ============================================================
	    // TARJETA 1
	    // ============================================================

	    dibujarTarjeta(
	        margen,
	        "Abastecimientos",
	        String(
	            registros.length
	        ),
	        "Registros incluidos"
	    );

	    // ============================================================
	    // TARJETA 2
	    // ============================================================

	    dibujarTarjeta(
	        margen +
	        (anchoTarjeta + espacio),
	        "Galones",
	        formatearNumeroPDF(
	            totalGalones
	        ),
	        "Total autorizado"
	    );

	    // ============================================================
	    // TARJETA 3
	    // ============================================================

	    dibujarTarjeta(
	        margen +
	        (
	            (anchoTarjeta + espacio) *
	            2
	        ),
	        "Kilómetros",
	        formatearNumeroPDF(
	            totalKilometros
	        ),
	        "Distancia registrada"
	    );

	    // ============================================================
	    // TARJETA 4
	    // TOTAL DEL REPORTE
	    // SE MUESTRA ARRIBA
	    // ============================================================

	    dibujarTarjeta(
	        margen +
	        (
	            (anchoTarjeta + espacio) *
	            3
	        ),
	        "Costo total",
	        `L. ${formatearNumeroPDF(totalCosto)}`,
	        "Valor de abastecimientos"
	    );

	    // ============================================================
	    // TABLA
	    // SIN FILTROS APLICADOS
	    // SIN COLUMNA HORA
	    // ============================================================

	    const yTabla =
	        yResumen + 32;

	    // ============================================================
	    // FILAS DE LA TABLA
	    // ============================================================

	    const filas =
	        registros.map(
	            function (item) {

	                const combustible =
	                    item.combustible?.nombre ||
	                    item.combustibleNombre ||
	                    "—";

	                const fecha =
	                    formatearFecha(
	                        item.fecha
	                    );

	                return [

	                    fecha.fecha,

	                    item.placa ||
	                    "—",

	                    item.motorista ||
	                    "—",

	                    item.destino ||
	                    "—",

	                    `${formatearNumeroPDF(
	                        item.kmRuta
	                    )} km`,

	                    `${formatearNumeroPDF(
	                        item.galonesAutorizados
	                    )} gal`,

	                    combustible,

	                    `L. ${formatearNumeroPDF(
	                        item.precioGalon
	                    )}`,

	                    `L. ${formatearNumeroPDF(
	                        item.total
	                    )}`

	                ];

	            }
	        );

	    // ============================================================
	    // TABLA PDF
	    // ============================================================

	    doc.autoTable({

	        startY:
	            yTabla,

	        margin: {
	            left: margen,
	            right: margen
	        },

	        // --------------------------------------------------------
	        // ENCABEZADOS
	        // --------------------------------------------------------

	        head: [[

	            "Fecha",

	            "Placa",

	            "Motorista",

	            "Destino",

	            "KM Ruta",

	            "Galones",

	            "Combustible",

	            "Precio/Galón",

	            "Total"

	        ]],

	        body:
	            filas,

	        theme:
	            "grid",

	        // --------------------------------------------------------
	        // ESTILOS
	        // --------------------------------------------------------

	        styles: {

	            font:
	                "helvetica",

	            fontSize:
	                7,

	            cellPadding:
	                2.2,

	            textColor: [
	                45,
	                52,
	                60
	            ],

	            lineColor: [
	                220,
	                224,
	                230
	            ],

	            lineWidth:
	                0.25,

	            valign:
	                "middle"

	        },

	        // --------------------------------------------------------
	        // ENCABEZADO DE TABLA
	        // --------------------------------------------------------

	        headStyles: {

	            fillColor: [
	                18,
	                31,
	                48
	            ],

	            textColor: [
	                255,
	                255,
	                255
	            ],

	            fontStyle:
	                "bold",

	            fontSize:
	                7,

	            halign:
	                "center",

	            cellPadding:
	                2.8

	        },

	        // --------------------------------------------------------
	        // FILAS ALTERNAS
	        // --------------------------------------------------------

	        alternateRowStyles: {

	            fillColor: [
	                248,
	                249,
	                251
	            ]

	        },

	        // --------------------------------------------------------
	        // ANCHOS DE COLUMNAS
	        // SIN HORA
	        // --------------------------------------------------------

	        columnStyles: {

	            0: {
	                halign:
	                    "center",
	                cellWidth:
	                    22
	            },

	            1: {
	                halign:
	                    "center",
	                cellWidth:
	                    20
	            },

	            2: {
	                cellWidth:
	                    42
	            },

	            3: {
	                cellWidth:
	                    45
	            },

	            4: {
	                halign:
	                    "right",
	                cellWidth:
	                    23
	            },

	            5: {
	                halign:
	                    "right",
	                cellWidth:
	                    24
	            },

	            6: {
	                halign:
	                    "center",
	                cellWidth:
	                    28
	            },

	            7: {
	                halign:
	                    "right",
	                cellWidth:
	                    34
	            },

	            8: {
	                halign:
	                    "right",
	                cellWidth:
	                    31
	            }

	        },

	        // ========================================================
	        // PIE DE PÁGINA
	        // ========================================================

	        didDrawPage:
	            function () {

	                const paginaActual =
	                    doc.internal.getNumberOfPages();

	                // ------------------------------------------------
	                // LÍNEA
	                // ------------------------------------------------

	                doc.setDrawColor(
	                    220,
	                    224,
	                    230
	                );

	                doc.line(
	                    margen,
	                    altoPagina - 13,
	                    anchoPagina - margen,
	                    altoPagina - 13
	                );

	                // ------------------------------------------------
	                // TEXTO PIE IZQUIERDO
	                // ------------------------------------------------

	                doc.setTextColor(
	                    120,
	                    128,
	                    138
	                );

	                doc.setFont(
	                    "helvetica",
	                    "normal"
	                );

	                doc.setFontSize(
	                    7
	                );

	                doc.text(
	                    "Reporte de Combustible",
	                    margen,
	                    altoPagina - 7
	                );

	                // ------------------------------------------------
	                // TEXTO PIE CENTRO
	                // ------------------------------------------------

	                doc.text(
	                    "Control de abastecimientos",
	                    anchoPagina / 2,
	                    altoPagina - 7,
	                    {
	                        align:
	                            "center"
	                    }
	                );

	                // ------------------------------------------------
	                // NÚMERO DE PÁGINA
	                // ------------------------------------------------

	                doc.text(
	                    `Página ${paginaActual}`,
	                    anchoPagina - margen,
	                    altoPagina - 7,
	                    {
	                        align:
	                            "right"
	                    }
	                );

	            }

	    });

	    // ============================================================
	    // NOMBRE DEL ARCHIVO
	    // ============================================================

	    let nombreArchivo =
	        "Reporte_de_Combustible";

	    if (
	        fechaDesde?.value &&
	        fechaHasta?.value
	    ) {

	        nombreArchivo +=
	            `_${fechaDesde.value}_${fechaHasta.value}`;

	    } else if (
	        fechaDesde?.value
	    ) {

	        nombreArchivo +=
	            `_desde_${fechaDesde.value}`;

	    } else if (
	        fechaHasta?.value
	    ) {

	        nombreArchivo +=
	            `_hasta_${fechaHasta.value}`;

	    }

	    nombreArchivo +=
	        ".pdf";

	    // ============================================================
	    // GUARDAR PDF
	    // ============================================================

	    doc.save(
	        nombreArchivo
	    );

	    mostrarExito(
	        "El reporte de combustible fue generado correctamente en PDF."
	    );

	}


	// ============================================================
	// CARGAR IMAGEN PARA EL PDF
	// ============================================================

	function cargarImagenPDF(src) {

	    return new Promise(
	        function (
	            resolve,
	            reject
	        ) {

	            const img =
	                new Image();

	            img.onload =
	                function () {

	                    resolve(
	                        img
	                    );

	                };

	            img.onerror =
	                function () {

	                    reject(
	                        new Error(
	                            "No se pudo cargar la imagen: " +
	                            src
	                        )
	                    );

	                };

	            img.src =
	                src;

	        }
	    );

	}


	// ============================================================
	// FORMATEAR FECHA PDF
	// ============================================================

	function formatearFechaPDF(fecha) {

	    if (!fecha) {

	        return "—";

	    }

	    const partes =
	        String(fecha)
	            .substring(
	                0,
	                10
	            )
	            .split("-");

	    if (
	        partes.length !== 3
	    ) {

	        return fecha;

	    }

	    return (
	        `${partes[2]}/${partes[1]}/${partes[0]}`
	    );

	}


	// ============================================================
	// FORMATEAR NÚMERO PDF
	// ============================================================

	function formatearNumeroPDF(numero) {

	    const valor =
	        Number(numero);

	    if (
	        isNaN(valor)
	    ) {

	        return "0.00";

	    }

	    return valor.toLocaleString(
	        "es-HN",
	        {
	            minimumFractionDigits:
	                2,

	            maximumFractionDigits:
	                2
	        }
	    );

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

                <td
                    colspan="10"
                    class="text-center py-5">

                    <div
                        class="spinner-border"
                        role="status">
                    </div>

                    <div class="mt-3">
                        Cargando información...
                    </div>

                </td>

            </tr>
        `;
    }

});