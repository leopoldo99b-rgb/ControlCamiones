document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       CONFIGURACIÓN
       ========================================================= */

    const API_URL = "/notas/api";


    /* =========================================================
       ELEMENTOS
       ========================================================= */

    const btnNuevaNota =
        document.getElementById("btnNuevaNota");

    const btnNuevaNotaEmpty =
        document.getElementById("btnNuevaNotaEmpty");

    const notaModal =
        document.getElementById("notaModal");

    const btnCerrarModal =
        document.getElementById("btnCerrarModal");

    const btnCancelarNota =
        document.getElementById("btnCancelarNota");

    const notaForm =
        document.getElementById("notaForm");

    const modalTitle =
        document.getElementById("modalTitle");

    const notaFecha =
        document.getElementById("notaFecha");

    const notaCategoria =
        document.getElementById("notaCategoria");

    const notaTitulo =
        document.getElementById("notaTitulo");

    const notaContenido =
        document.getElementById("notaContenido");

    const contadorCaracteres =
        document.getElementById("contadorCaracteres");

    const buscarNota =
        document.getElementById("buscarNota");

    const fechaFiltro =
        document.getElementById("fechaFiltro");

    const btnLimpiarFiltros =
        document.getElementById("btnLimpiarFiltros");

    const notesList =
        document.getElementById("notesList");

    const emptyState =
        document.getElementById("emptyState");

    const totalNotas =
        document.getElementById("totalNotas");

    const notasHoy =
        document.getElementById("notasHoy");

    const ultimaNota =
        document.getElementById("ultimaNota");

    const contadorNotas =
        document.getElementById("contadorNotas");


    /* =========================================================
       VARIABLES
       ========================================================= */

    let notas = [];

    let notaEditandoId = null;


    /* =========================================================
       FECHA LOCAL
       ========================================================= */

    function obtenerFechaLocal() {

        const ahora = new Date();

        const year =
            ahora.getFullYear();

        const month =
            String(
                ahora.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                ahora.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    /* =========================================================
       FORMATEAR FECHA
       ========================================================= */

    function formatearFecha(fecha) {

        if (!fecha) {
            return "--";
        }

        const partes =
            String(fecha).split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        const year =
            Number(partes[0]);

        const month =
            Number(partes[1]);

        const day =
            Number(partes[2]);


        const fechaObj =
            new Date(
                year,
                month - 1,
                day
            );


        return fechaObj.toLocaleDateString(
            "es-HN",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }


    /* =========================================================
       OBTENER DÍA
       ========================================================= */

    function obtenerDia(fecha) {

        if (!fecha) {
            return "--";
        }

        const partes =
            String(fecha).split("-");

        if (partes.length !== 3) {
            return "--";
        }

        return partes[2];
    }


    /* =========================================================
       OBTENER MES
       ========================================================= */

    function obtenerMes(fecha) {

        if (!fecha) {
            return "---";
        }

        const partes =
            String(fecha).split("-");

        if (partes.length !== 3) {
            return "---";
        }


        const meses = [
            "ENE",
            "FEB",
            "MAR",
            "ABR",
            "MAY",
            "JUN",
            "JUL",
            "AGO",
            "SEP",
            "OCT",
            "NOV",
            "DIC"
        ];


        const mes =
            Number(partes[1]);


        return meses[mes - 1] || "---";
    }


    /* =========================================================
       ESCAPAR HTML
       ========================================================= */

    function escaparHTML(texto) {

        if (
            texto === null ||
            texto === undefined
        ) {
            return "";
        }


        return String(texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================================================
       OBTENER CATEGORÍA DEL TÍTULO
       ========================================================= */

    function obtenerCategoria(titulo) {

        if (!titulo) {
            return "GENERAL";
        }


        const coincidencia =
            String(titulo).match(
                /^\[([^\]]+)\]/
            );


        if (coincidencia) {

            return coincidencia[1]
                .trim()
                .toUpperCase();
        }


        return "GENERAL";
    }


    /* =========================================================
       OBTENER TÍTULO SIN CATEGORÍA
       ========================================================= */

    function obtenerTituloLimpio(titulo) {

        if (!titulo) {
            return "";
        }


        return String(titulo)
            .replace(
                /^\[[^\]]+\]\s*/,
                ""
            )
            .trim();
    }


    /* =========================================================
       ABRIR MODAL
       ========================================================= */

    function abrirModal() {

        if (!notaModal) {
            return;
        }


        notaModal.classList.add("show");

        document.body.classList.add(
            "modal-open"
        );


        setTimeout(function () {

            if (notaTitulo) {

                notaTitulo.focus();

            }

        }, 100);
    }


    /* =========================================================
       CERRAR MODAL
       ========================================================= */

    function cerrarModal() {

        if (!notaModal) {
            return;
        }


        notaModal.classList.remove("show");

        document.body.classList.remove(
            "modal-open"
        );


        notaEditandoId = null;


        if (modalTitle) {

            modalTitle.textContent =
                "Nueva nota";
        }


        if (notaForm) {

            notaForm.reset();

        }


        if (notaFecha) {

            notaFecha.value =
                obtenerFechaLocal();

        }


        if (notaCategoria) {

            notaCategoria.value =
                "OPERATIVA";

        }


        actualizarContadorCaracteres();
    }


    /* =========================================================
       NUEVA NOTA
       ========================================================= */

    function nuevaNota() {

        notaEditandoId = null;


        if (modalTitle) {

            modalTitle.textContent =
                "Nueva nota";
        }


        if (notaForm) {

            notaForm.reset();

        }


        if (notaFecha) {

            notaFecha.value =
                obtenerFechaLocal();

        }


        if (notaCategoria) {

            notaCategoria.value =
                "OPERATIVA";

        }


        actualizarContadorCaracteres();

        abrirModal();
    }


    /* =========================================================
       EDITAR NOTA
       ========================================================= */

    function editarNota(id) {

        const nota =
            notas.find(function (item) {

                return String(item.id) ===
                       String(id);

            });


        if (!nota) {

            alert(
                "No se encontró la nota."
            );

            return;
        }


        notaEditandoId =
            nota.id;


        if (modalTitle) {

            modalTitle.textContent =
                "Editar nota";
        }


        if (notaFecha) {

            notaFecha.value =
                nota.fecha || "";
        }


        if (notaCategoria) {

            const categoria =
                obtenerCategoria(
                    nota.titulo
                );


            const opcionExiste =
                Array.from(
                    notaCategoria.options
                ).some(function (opcion) {

                    return opcion.value ===
                           categoria;

                });


            if (opcionExiste) {

                notaCategoria.value =
                    categoria;

            } else {

                notaCategoria.value =
                    "GENERAL";
            }
        }


        if (notaTitulo) {

            notaTitulo.value =
                obtenerTituloLimpio(
                    nota.titulo
                );
        }


        if (notaContenido) {

            notaContenido.value =
                nota.contenido || "";
        }


        actualizarContadorCaracteres();

        abrirModal();
    }


    /* =========================================================
       ELIMINAR NOTA
       ========================================================= */

    async function eliminarNota(id) {

        const nota =
            notas.find(function (item) {

                return String(item.id) ===
                       String(id);

            });


        if (!nota) {
            return;
        }


        const titulo =
            obtenerTituloLimpio(
                nota.titulo
            );


        const confirmar =
            confirm(
                `¿Deseas eliminar la nota "${titulo}"?`
            );


        if (!confirmar) {
            return;
        }


        try {

            const respuesta =
                await fetch(
                    `${API_URL}/${id}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!respuesta.ok) {

                throw new Error(
                    "No se pudo eliminar la nota."
                );
            }


            await cargarNotas();


        } catch (error) {

            console.error(
                "Error eliminando nota:",
                error
            );


            alert(
                error.message ||
                "No se pudo eliminar la nota."
            );
        }
    }


    /* =========================================================
       GUARDAR NOTA
       ========================================================= */

    async function guardarNota(event) {

        event.preventDefault();


        if (
            !notaFecha ||
            !notaTitulo ||
            !notaContenido
        ) {
            return;
        }


        const fecha =
            notaFecha.value;


        const categoria =
            notaCategoria
                ? notaCategoria.value
                : "GENERAL";


        const tituloBase =
            notaTitulo.value.trim();


        const contenido =
            notaContenido.value.trim();


        /* -----------------------------------------------------
           VALIDACIONES
           ----------------------------------------------------- */

        if (!fecha) {

            alert(
                "Selecciona una fecha."
            );

            return;
        }


        if (!tituloBase) {

            alert(
                "Escribe un título."
            );

            notaTitulo.focus();

            return;
        }


        if (!contenido) {

            alert(
                "Escribe el contenido de la nota."
            );

            notaContenido.focus();

            return;
        }


        /* -----------------------------------------------------
           CATEGORÍA DENTRO DEL TÍTULO
           ----------------------------------------------------- */

        const titulo =
            `[${categoria}] ${tituloBase}`;


        const nota = {

            fecha: fecha,

            titulo: titulo,

            contenido: contenido
        };


        try {

            let respuesta;


            /* =================================================
               ACTUALIZAR
               ================================================= */

            if (notaEditandoId !== null) {

                respuesta =
                    await fetch(
                        `${API_URL}/${notaEditandoId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(nota)
                        }
                    );

            }


            /* =================================================
               CREAR
               ================================================= */

            else {

                respuesta =
                    await fetch(
                        API_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(nota)
                        }
                    );
            }


            /* -------------------------------------------------
               ERROR DEL SERVIDOR
               ------------------------------------------------- */

            if (!respuesta.ok) {

                let mensaje =
                    "No se pudo guardar la nota.";


                try {

                    const texto =
                        await respuesta.text();


                    if (texto) {

                        mensaje =
                            texto;
                    }

                } catch (error) {

                    console.error(
                        "No se pudo leer el error:",
                        error
                    );
                }


                throw new Error(
                    mensaje
                );
            }


            /* -------------------------------------------------
               ÉXITO
               ------------------------------------------------- */

            cerrarModal();

            await cargarNotas();


        } catch (error) {

            console.error(
                "Error guardando nota:",
                error
            );


            alert(
                error.message ||
                "No se pudo guardar la nota."
            );
        }
    }


    /* =========================================================
       CARGAR NOTAS
       ========================================================= */

    async function cargarNotas() {

        try {

            const respuesta =
                await fetch(
                    API_URL,
                    {
                        method: "GET",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!respuesta.ok) {

                throw new Error(
                    `Error HTTP ${respuesta.status}`
                );
            }


            const datos =
                await respuesta.json();


            notas =
                Array.isArray(datos)
                    ? datos
                    : [];


            console.log(
                "Notas cargadas:",
                notas
            );


            mostrarNotas();

            actualizarResumen();


        } catch (error) {

            console.error(
                "Error cargando notas:",
                error
            );


            notas = [];


            if (notesList) {

                const tarjetas =
                    notesList.querySelectorAll(
                        ".note-card"
                    );


                tarjetas.forEach(
                    function (tarjeta) {

                        tarjeta.remove();

                    }
                );
            }


            if (emptyState) {

                emptyState.style.display =
                    "flex";
            }


            actualizarContadorVisible(0);

            actualizarResumen();


            /*
             * Si quieres mostrar el error
             * directamente en pantalla.
             */

            if (emptyState) {

                emptyState.innerHTML = `

                    <div class="empty-icon">

                        <i class="fas fa-triangle-exclamation"></i>

                    </div>

                    <h3>
                        No se pudieron cargar las notas
                    </h3>

                    <p>
                        Verifica la conexión con el servidor.
                    </p>

                    <button
                        type="button"
                        class="primary-button"
                        id="btnReintentarNotas">

                        <i class="fas fa-rotate"></i>

                        Reintentar

                    </button>

                `;


                const btnReintentar =
                    document.getElementById(
                        "btnReintentarNotas"
                    );


                if (btnReintentar) {

                    btnReintentar.addEventListener(
                        "click",
                        cargarNotas
                    );
                }
            }
        }
    }


    /* =========================================================
       FILTRAR NOTAS
       ========================================================= */

    function obtenerNotasFiltradas() {

        const texto =
            buscarNota
                ? buscarNota.value
                    .trim()
                    .toLowerCase()
                : "";


        const fecha =
            fechaFiltro
                ? fechaFiltro.value
                : "";


        return notas.filter(
            function (nota) {

                const titulo =
                    String(
                        nota.titulo || ""
                    ).toLowerCase();


                const contenido =
                    String(
                        nota.contenido || ""
                    ).toLowerCase();


                const coincideTexto =
                    !texto ||
                    titulo.includes(texto) ||
                    contenido.includes(texto);


                const coincideFecha =
                    !fecha ||
                    String(nota.fecha) ===
                    String(fecha);


                return (
                    coincideTexto &&
                    coincideFecha
                );
            }
        );
    }


    /* =========================================================
       MOSTRAR NOTAS
       ========================================================= */

    function mostrarNotas() {

        if (!notesList) {
            return;
        }


        const notasFiltradas =
            obtenerNotasFiltradas();


        const tarjetas =
            notesList.querySelectorAll(
                ".note-card"
            );


        tarjetas.forEach(
            function (tarjeta) {

                tarjeta.remove();

            }
        );


        /* -----------------------------------------------------
           SIN RESULTADOS
           ----------------------------------------------------- */

        if (notasFiltradas.length === 0) {

            if (emptyState) {

                emptyState.style.display =
                    "flex";

            }


            actualizarContadorVisible(0);

            return;
        }


        if (emptyState) {

            emptyState.style.display =
                "none";
        }


        /* -----------------------------------------------------
           ORDENAR POR FECHA
           ----------------------------------------------------- */

        const ordenadas =
            [...notasFiltradas].sort(
                function (a, b) {

                    const fechaA =
                        String(
                            a.fecha || ""
                        );


                    const fechaB =
                        String(
                            b.fecha || ""
                        );


                    if (fechaA !== fechaB) {

                        return fechaB.localeCompare(
                            fechaA
                        );
                    }


                    const createdA =
                        String(
                            a.createdAt || ""
                        );


                    const createdB =
                        String(
                            b.createdAt || ""
                        );


                    return createdB.localeCompare(
                        createdA
                    );
                }
            );


        /* -----------------------------------------------------
           CREAR TARJETAS
           ----------------------------------------------------- */

        ordenadas.forEach(
            function (nota) {

                const tarjeta =
                    crearTarjetaNota(nota);


                if (emptyState) {

                    notesList.insertBefore(
                        tarjeta,
                        emptyState
                    );

                } else {

                    notesList.appendChild(
                        tarjeta
                    );
                }
            }
        );


        actualizarContadorVisible(
            ordenadas.length
        );
    }


    /* =========================================================
       CREAR TARJETA
       ========================================================= */

    function crearTarjetaNota(nota) {

        const article =
            document.createElement("article");


        article.className =
            "note-card";


        const categoria =
            obtenerCategoria(
                nota.titulo
            );


        const titulo =
            obtenerTituloLimpio(
                nota.titulo
            );


        const categoriaTexto =
            escaparHTML(
                categoria
            );


        const tituloTexto =
            escaparHTML(
                titulo
            );


        const contenidoTexto =
            escaparHTML(
                nota.contenido
            );


        const fechaTexto =
            escaparHTML(
                formatearFecha(
                    nota.fecha
                )
            );


        const dia =
            escaparHTML(
                obtenerDia(
                    nota.fecha
                )
            );


        const mes =
            escaparHTML(
                obtenerMes(
                    nota.fecha
                )
            );


        let horaHTML = "";


        if (nota.createdAt) {

            horaHTML = `

                <span>

                    <i class="far fa-clock"></i>

                    ${escaparHTML(
                        formatearHora(
                            nota.createdAt
                        )
                    )}

                </span>

            `;
        }


        article.innerHTML = `

            <div class="note-date">

                <div class="date-day">
                    ${dia}
                </div>

                <div class="date-month">
                    ${mes}
                </div>

            </div>


            <div class="note-content">

                <div class="note-top">

                    <div>

                        <span class="note-label">
                            ${categoriaTexto}
                        </span>

                        <h3>
                            ${tituloTexto}
                        </h3>

                    </div>


                    <div class="note-actions">

                        <button
                            type="button"
                            class="icon-button edit"
                            title="Editar"
                            data-id="${escaparHTML(nota.id)}">

                            <i class="fas fa-pen"></i>

                        </button>


                        <button
                            type="button"
                            class="icon-button delete"
                            title="Eliminar"
                            data-id="${escaparHTML(nota.id)}">

                            <i class="fas fa-trash"></i>

                        </button>

                    </div>

                </div>


                <p>
                    ${contenidoTexto}
                </p>


                <div class="note-footer">

                    <span>

                        <i class="far fa-calendar"></i>

                        ${fechaTexto}

                    </span>

                    ${horaHTML}

                </div>

            </div>

        `;


        /* -----------------------------------------------------
           EDITAR
           ----------------------------------------------------- */

        const btnEditar =
            article.querySelector(
                ".edit"
            );


        if (btnEditar) {

            btnEditar.addEventListener(
                "click",
                function () {

                    editarNota(
                        this.dataset.id
                    );
                }
            );
        }


        /* -----------------------------------------------------
           ELIMINAR
           ----------------------------------------------------- */

        const btnEliminar =
            article.querySelector(
                ".delete"
            );


        if (btnEliminar) {

            btnEliminar.addEventListener(
                "click",
                function () {

                    eliminarNota(
                        this.dataset.id
                    );
                }
            );
        }


        return article;
    }


    /* =========================================================
       FORMATEAR HORA
       ========================================================= */

    function formatearHora(fechaHora) {

        if (!fechaHora) {
            return "--";
        }


        try {

            const fecha =
                new Date(fechaHora);


            if (
                Number.isNaN(
                    fecha.getTime()
                )
            ) {

                return "--";
            }


            return fecha.toLocaleTimeString(
                "es-HN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        } catch (error) {

            return "--";
        }
    }


    /* =========================================================
       CONTADOR VISIBLE
       ========================================================= */

    function actualizarContadorVisible(
        cantidad
    ) {

        if (!contadorNotas) {
            return;
        }


        contadorNotas.textContent =
            cantidad === 1
                ? "1 nota"
                : `${cantidad} notas`;
    }


    /* =========================================================
       ACTUALIZAR RESUMEN
       ========================================================= */

    function actualizarResumen() {

        /* -----------------------------------------------------
           TOTAL
           ----------------------------------------------------- */

        if (totalNotas) {

            totalNotas.textContent =
                notas.length;
        }


        /* -----------------------------------------------------
           NOTAS DE HOY
           ----------------------------------------------------- */

        const hoy =
            obtenerFechaLocal();


        const cantidadHoy =
            notas.filter(
                function (nota) {

                    return String(
                        nota.fecha || ""
                    ) === hoy;

                }
            ).length;


        if (notasHoy) {

            notasHoy.textContent =
                cantidadHoy;
        }


        /* -----------------------------------------------------
           ÚLTIMA NOTA
           ----------------------------------------------------- */

        if (!ultimaNota) {
            return;
        }


        if (notas.length === 0) {

            ultimaNota.textContent =
                "--";

            return;
        }


        const ordenadas =
            [...notas].sort(
                function (a, b) {

                    const fechaA =
                        String(
                            a.createdAt ||
                            a.fecha ||
                            ""
                        );


                    const fechaB =
                        String(
                            b.createdAt ||
                            b.fecha ||
                            ""
                        );


                    return fechaB.localeCompare(
                        fechaA
                    );
                }
            );


        ultimaNota.textContent =
            formatearFecha(
                ordenadas[0].fecha
            );
    }


    /* =========================================================
       CONTADOR DE CARACTERES
       ========================================================= */

    function actualizarContadorCaracteres() {

        if (
            !notaContenido ||
            !contadorCaracteres
        ) {
            return;
        }


        contadorCaracteres.textContent =
            notaContenido.value.length;
    }


    /* =========================================================
       EVENTO NUEVA NOTA
       ========================================================= */

    if (btnNuevaNota) {

        btnNuevaNota.addEventListener(
            "click",
            nuevaNota
        );
    }


    if (btnNuevaNotaEmpty) {

        btnNuevaNotaEmpty.addEventListener(
            "click",
            nuevaNota
        );
    }


    /* =========================================================
       CERRAR MODAL
       ========================================================= */

    if (btnCerrarModal) {

        btnCerrarModal.addEventListener(
            "click",
            cerrarModal
        );
    }


    if (btnCancelarNota) {

        btnCancelarNota.addEventListener(
            "click",
            cerrarModal
        );
    }


    /* =========================================================
       CLICK FUERA DEL MODAL
       ========================================================= */

    if (notaModal) {

        notaModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    notaModal
                ) {

                    cerrarModal();
                }
            }
        );
    }


    /* =========================================================
       ESC
       ========================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                notaModal &&
                notaModal.classList.contains(
                    "show"
                )
            ) {

                cerrarModal();
            }
        }
    );


    /* =========================================================
       FORMULARIO
       ========================================================= */

    if (notaForm) {

        notaForm.addEventListener(
            "submit",
            guardarNota
        );
    }


    /* =========================================================
       CONTADOR
       ========================================================= */

    if (notaContenido) {

        notaContenido.addEventListener(
            "input",
            actualizarContadorCaracteres
        );
    }


    /* =========================================================
       BUSCADOR
       ========================================================= */

    if (buscarNota) {

        buscarNota.addEventListener(
            "input",
            mostrarNotas
        );
    }


    /* =========================================================
       FILTRO FECHA
       ========================================================= */

    if (fechaFiltro) {

        fechaFiltro.addEventListener(
            "change",
            mostrarNotas
        );
    }


    /* =========================================================
       LIMPIAR FILTROS
       ========================================================= */

    if (btnLimpiarFiltros) {

        btnLimpiarFiltros.addEventListener(
            "click",
            function () {

                if (buscarNota) {

                    buscarNota.value =
                        "";
                }


                if (fechaFiltro) {

                    fechaFiltro.value =
                        "";
                }


                mostrarNotas();
            }
        );
    }


    /* =========================================================
       FECHA INICIAL
       ========================================================= */

    if (notaFecha) {

        notaFecha.value =
            obtenerFechaLocal();
    }


    /* =========================================================
       INICIAR
       ========================================================= */

    cargarNotas();


    /* =========================================================
       CONSOLA
       ========================================================= */

    console.log(
        "Sistema de notas iniciado."
    );

    console.log(
        "API:",
        API_URL
    );

});