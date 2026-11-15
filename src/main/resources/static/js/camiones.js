// ======================================================
// VARIABLES GLOBALES
// ======================================================

let listaCamiones = [];
let paginaActual = 1;
const registrosPorPagina = 10;
let camionSeleccionadoPDF = null;
let camionSeleccionadoAccion = null;
let modoEdicion = false;
let camionEditando = null;
var camionEditandoId = null; // var: camiones-ux.js lo lee como window.camionEditandoId


// ======================================================
// ELEMENTOS DOM
// ======================================================

const btnNuevoCamion = document.getElementById("btnNuevoCamion");
const modalNuevo = document.getElementById("modalNuevoCamion");
const formCamion = document.getElementById("formCamion");
const tbody = document.getElementById("tbodyCamiones");
const contador = document.getElementById("totalCamiones");
const btnGuardar = document.querySelector(".btn-save");
const inputFoto = document.getElementById("foto");
const previewFoto = document.getElementById("previewFoto");

// filtros
const buscarCamion = document.getElementById("buscarCamion");
const filtroEstado = document.getElementById("filtroEstado");
const filtroTipo = document.getElementById("filtroTipo");
const filtroMarca = document.getElementById("filtroMarca");

const modalEliminar = document.getElementById("modalEliminar");
const codigoGenerado = document.getElementById("codigoGenerado");
const codigoConfirmacion = document.getElementById("codigoConfirmacion");
const btnConfirmarEliminar = document.getElementById("confirmarEliminar");
let camionSeleccionadoEliminar = null;
let codigoEliminar = "";

const modalVerCamion = document.getElementById("modalVerCamion");
const modalEditar = document.getElementById("modalEditar");
const modalAccionCamion = document.getElementById("modalAccionCamion");
const modalTipoObservacion = document.getElementById("modalTipoObservacion");
const modalDetalleObservacion = document.getElementById("modalDetalleObservacion");
const btnEditarInfo = document.getElementById("btnEditarInfo");
const btnNuevaObservacion = document.getElementById("btnNuevaObservacion");
const continuarObservacion = document.getElementById("continuarObservacion");
const guardarObservacion = document.getElementById("guardarObservacion");

const btnExportar = document.getElementById("btnExportar");
const modalExportar = document.getElementById("modalExportar");
const exportarPDF = document.getElementById("exportarPDF");
const exportarExcel = document.getElementById("exportarExcel");

// MODAL SELECCIONAR ELIMINACIÓN
const btnEliminarCamion = document.getElementById("btnEliminarCamion");
const btnEliminarObservacion = document.getElementById("btnEliminarObservacion");
const cancelarSeleccionEliminar = document.getElementById("cancelarSeleccionEliminar");

// MODAL CONFIRMAR ELIMINACIÓN CON CÓDIGO
const modalConfirmarEliminar = document.getElementById("modalConfirmarEliminar");
const modalEliminarObservacion = document.getElementById("modalEliminarObservacion");
const listaObservacionesEliminar = document.getElementById("listaObservacionesEliminar");
const cancelarEliminarObservacion = document.getElementById("cancelarEliminarObservacion");


// ======================================================
// ABRIR MODAL NUEVO / EXPORTAR
// ======================================================

if (btnNuevoCamion) {
    btnNuevoCamion.addEventListener("click", () => {
        modalNuevo.style.display = "flex";
    });
}

if (btnExportar) {
    btnExportar.addEventListener("click", () => {
        modalExportar.style.display = "flex";
    });
}

// Los generadores exportarExcelCamiones() y exportarTablaPDF() están en camiones-extra.js

if (exportarExcel) {
    exportarExcel.addEventListener("click", () => {
        exportarExcelCamiones();
        modalExportar.style.display = "none";
    });
}

if (exportarPDF) {
    exportarPDF.addEventListener("click", () => {
        exportarTablaPDF();
        modalExportar.style.display = "none";
    });
}


// ======================================================
// CERRAR MODALES
// ======================================================

document.querySelectorAll(".btn-close,.btn-cancel").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".modal").forEach(modal => {
            modal.style.display = "none";
        });
    });
});

// CERRAR FICHA CAMION
const cerrarFichaCamion = document.getElementById("cerrarFichaCamion");

if (cerrarFichaCamion) {
    cerrarFichaCamion.addEventListener("click", () => {
        modalVerCamion.style.display = "none";
    });
}

// cerrar click fuera
window.addEventListener("click", (e) => {
    document.querySelectorAll(".modal").forEach(modal => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});


// ======================================================
// PREVISUALIZAR FOTO
// ======================================================

if (inputFoto) {
    inputFoto.addEventListener("change", () => {
        const archivo = inputFoto.files[0];
        if (!archivo) return;

        const lector = new FileReader();
        lector.onload = (e) => {
            previewFoto.src = e.target.result;
        };
        lector.readAsDataURL(archivo);
    });
}


// ======================================================
// CARGAR CAMIONES DESDE JAVA
// ======================================================

async function cargarCamiones() {
    try {
        const respuesta = await fetch("/camiones/lista");

        if (!respuesta.ok) {
            throw new Error("El servidor respondió " + respuesta.status + " en " + respuesta.url);
        }

        const tipoRespuesta = respuesta.headers.get("content-type") || "";

        if (!tipoRespuesta.includes("json")) {
            // llegó una página (login, error o vista) en lugar de los datos
            throw new Error(
                "Se esperaba JSON pero llegó '" + tipoRespuesta + "' desde " + respuesta.url +
                (respuesta.redirected ? " (hubo redirección: ¿sesión vencida?)" : "")
            );
        }

        listaCamiones = await respuesta.json();
        paginaActual = 1;

        // ACTUALIZAR FILTRO MARCAS
        cargarFiltroMarcas();

        aplicarFiltros();
    }
    catch (error) {
        console.error("Error cargando camiones:", error);

        tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align:center">
                Error al cargar datos<br><small class="detalle-error"></small>
            </td>
        </tr>
        `;

        tbody.querySelector(".detalle-error").textContent = error.message;
    }
}


// ======================================================
// APLICAR FILTROS
// ======================================================

function aplicarFiltros() {
    let resultado = [...listaCamiones];

    const texto = buscarCamion?.value.toLowerCase() || "";
    const estado = filtroEstado?.value || "";
    const tipo = filtroTipo?.value || "";
    const marca = filtroMarca?.value || "";

    if (texto) {
        resultado = resultado.filter(c => (
            (c.placa || "").toLowerCase().includes(texto) ||
            (c.marca || "").toLowerCase().includes(texto) ||
            (c.modelo || "").toLowerCase().includes(texto)
        ));
    }

    if (estado) {
        resultado = resultado.filter(c => c.estado === estado);
    }

    if (tipo) {
        resultado = resultado.filter(c => c.tipo === tipo);
    }

    if (marca && marca !== "Todas") {
        resultado = resultado.filter(c => c.marca === marca);
    }

    renderTabla(resultado);
    actualizarContador(resultado.length);
}


// ======================================================
// RENDER TABLA
// ======================================================

function renderTabla(camiones) {
    tbody.innerHTML = "";

    if (camiones.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align:center">
                No existen camiones registrados
            </td>
        </tr>
        `;
        crearPaginacion(0);
        return;
    }

    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const pagina = camiones.slice(inicio, fin);

    pagina.forEach(c => {
        const img = (c.imgcamion && c.imgcamion.trim() !== "")
            ? c.imgcamion
            : "/imgs/stock.jpg";

        const kilometraje = c.kilometrajeActual ?? 0;

        const fila = document.createElement("tr");

        fila.innerHTML = `
        <td class="img-cell">
            <img class="camion-img" src="${img}" data-img="${img}" onerror="this.src='/imgs/stock.jpg'">
        </td>

        <td>
            <div class="vehiculo-info">
                <strong>${c.marca || ""}</strong>
                <span>${c.modelo || ""}</span>
            </div>
        </td>

        <td>${c.placa || ""}</td>
        <td>${c.marca || ""}</td>
        <td>${c.modelo || ""}</td>
        <td>${c.tipo || ""}</td>
        <td>${kilometraje}</td>

        <td>
            <span class="estado ${claseEstado(c.estado)}">${c.estado || ""}</span>
        </td>

        <td>
            <div class="acciones">
                <button class="btn-action btn-ver" data-id="${c.id}">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button class="btn-action btn-editar" data-id="${c.id}">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-action btn-delete" data-id="${c.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </td>
        `;

        tbody.appendChild(fila);
    });

    crearPaginacion(camiones.length);
}


// ======================================================
// PAGINACIÓN
// ======================================================

function crearPaginacion(total) {
    const contenedor = document.querySelector(".pagination");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const totalPaginas = Math.ceil(total / registrosPorPagina);
    if (totalPaginas <= 1) return;

    const anterior = document.createElement("button");
    anterior.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
    anterior.onclick = () => {
        if (paginaActual > 1) {
            paginaActual--;
            aplicarFiltros();
        }
    };
    contenedor.appendChild(anterior);

    for (let i = 1; i <= totalPaginas; i++) {
        const boton = document.createElement("button");
        boton.textContent = i;
        if (i === paginaActual) boton.classList.add("active");
        boton.onclick = () => {
            paginaActual = i;
            aplicarFiltros();
        };
        contenedor.appendChild(boton);
    }

    const siguiente = document.createElement("button");
    siguiente.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
    siguiente.onclick = () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            aplicarFiltros();
        }
    };
    contenedor.appendChild(siguiente);
}


// ======================================================
// ESTADOS
// ======================================================

function claseEstado(estado) {
    switch (estado) {
        case "DISPONIBLE": return "disponible";
        case "EN VIAJE": return "viaje";
        case "MANTENIMIENTO": return "mantenimiento";
        default: return "";
    }
}


// ======================================================
// EVENTOS BUSQUEDA Y FILTROS
// ======================================================

if (buscarCamion) {
    buscarCamion.addEventListener("input", () => {
        paginaActual = 1;
        aplicarFiltros();
    });
}

[filtroEstado, filtroTipo, filtroMarca].forEach(filtro => {
    if (filtro) {
        filtro.addEventListener("change", () => {
            paginaActual = 1;
            aplicarFiltros();
        });
    }
});


// ======================================================
// NUEVO CAMIÓN
// ======================================================

btnNuevoCamion.onclick = function () {
    modoEdicion = false;
    camionEditandoId = null;

    formCamion.reset();
    previewFoto.src = "/imgs/stock.jpg";

    document.querySelector("#modalNuevoCamion h2").innerHTML = `
    <i class="fa-solid fa-truck-front"></i>
    Registrar Nuevo Camión
    `;

    modalNuevo.style.display = "flex";
};


// ======================================================
// GUARDAR / ACTUALIZAR CAMIÓN
// ======================================================

if (formCamion) {

    formCamion.addEventListener("submit", async function (e) {

        e.preventDefault();

        const estabaEditando = modoEdicion;
        const datos = new FormData();

        // FOTO SOLO SI CAMBIA
        if (inputFoto && inputFoto.files.length > 0) {
            datos.append("foto", inputFoto.files[0]);
        }

        // CAMPOS
        datos.append("placa", document.getElementById("placa").value);
        datos.append("marca", document.getElementById("marca").value);
        datos.append("modelo", document.getElementById("modelo").value);
        datos.append("anio", document.getElementById("anio").value);
        datos.append("color", document.getElementById("color").value);
        datos.append("tipo", document.getElementById("tipo").value);
        datos.append("capacidad", document.getElementById("capacidad").value);
        datos.append("kilometraje", document.getElementById("kilometraje").value);
        datos.append("motor", document.getElementById("motor").value);
        datos.append("chasis", document.getElementById("chasis").value);
        datos.append("estado", "DISPONIBLE"); // el estado ya no se maneja: todo camión queda disponible
        datos.append("fechaCompra", document.getElementById("fechaCompra").value);
        datos.append("valorCompra", document.getElementById("valorCompra").value);
        datos.append("observaciones", document.getElementById("observaciones").value);

        try {

            btnGuardar.disabled = true;
            btnGuardar.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Guardando...
            `;

            let respuesta;

            if (modoEdicion) {

                // EDITAR
                if (!camionEditandoId) {
                    mostrarNotificacion("error", "Error", "No hay un camión seleccionado para editar");
                    return;
                }

                respuesta = await fetch("/camiones/editar/" + camionEditandoId, {
                    method: "PUT",
                    body: datos
                });

            } else {

                // NUEVO
                respuesta = await fetch("/camiones/guardar", {
                    method: "POST",
                    body: datos
                });

            }

            if (!respuesta.ok) {
                const error = await respuesta.text();
                console.error(error);
                mostrarNotificacion("error", "Error", "No se pudo guardar el camión");
                return;
            }

            // LIMPIAR
            formCamion.reset();
            if (previewFoto) previewFoto.src = "/imgs/stock.jpg";

            modalNuevo.style.display = "none";
            modoEdicion = false;
            camionEditandoId = null;

            await cargarCamiones();

            mostrarNotificacion(
                "success",
                estabaEditando ? "Camión actualizado" : "Camión guardado",
                estabaEditando
                    ? "El camión fue actualizado correctamente"
                    : "El camión fue registrado correctamente"
            );

        }
        catch (error) {
            console.error(error);
            mostrarNotificacion("error", "Sin conexión", "No se pudo conectar con el servidor");
        }
        finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Guardar Camión
            `;
        }

    });

}


// ======================================================
// INICIO ÚNICO
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    cargarCamiones();
});


// ======================================================
// ACTUALIZAR CONTADOR
// ======================================================

function actualizarContador(total) {
    if (contador) {
        contador.textContent = total;
    }
}


// ======================================================
// ABRIR MODAL ELIMINAR
// ======================================================

function abrirModalEliminar(id) {
    camionSeleccionadoEliminar = id;
    modalEliminar.style.display = "flex";
}

// OPCIÓN ELIMINAR CAMIÓN
if (btnEliminarCamion) {
    btnEliminarCamion.onclick = function () {
        modalEliminar.style.display = "none";

        codigoEliminar = Math.floor(100000 + Math.random() * 900000);
        codigoGenerado.textContent = codigoEliminar;
        codigoConfirmacion.value = "";
        btnConfirmarEliminar.disabled = true;

        modalConfirmarEliminar.style.display = "flex";
    };
}

// OPCIÓN ELIMINAR OBSERVACIÓN
if (btnEliminarObservacion) {
    btnEliminarObservacion.onclick = function () {
        modalEliminar.style.display = "none";
        abrirEliminarObservacion();
    };
}

function abrirEliminarObservacion() {
    const camion = listaCamiones.find(c => c.id == camionSeleccionadoEliminar);

    if (!camion) {
        mostrarNotificacion("error", "Error", "No se encontró el camión");
        return;
    }

    if (!camion.observaciones || camion.observaciones.trim() === "") {
        mostrarNotificacion("warning", "Sin observaciones", "Este camión no tiene observaciones para eliminar");
        return;
    }

    mostrarObservacionesEliminar(camion.observaciones);
}

// CANCELAR SELECCIÓN
if (cancelarSeleccionEliminar) {
    cancelarSeleccionEliminar.onclick = function () {
        modalEliminar.style.display = "none";
    };
}

// CONFIRMAR ELIMINACIÓN
function eliminarCamion() {
    fetch(`/camiones/eliminar/${camionSeleccionadoEliminar}`, {
        method: "DELETE"
    })
        .then(res => res.text())
        .then(data => {
            mostrarNotificacion("success", "Camión eliminado", data);
            modalEliminar.style.display = "none";
            cargarCamiones();
        })
        .catch(error => {
            console.error(error);
            mostrarNotificacion("error", "Error", "Error Eliminando Camion");
        });
}

// EVENTO BOTON ELIMINAR
document.addEventListener("click", function (e) {
    const boton = e.target.closest(".btn-delete");
    if (!boton) return;
    abrirModalEliminar(boton.dataset.id);
});


// ======================================================
// VER IMAGEN GRANDE
// ======================================================

const modalImagen = document.getElementById("modalImagen");
const imagenGrande = document.getElementById("imagenGrande");

// abrir imagen desde tabla o ficha (las fotos de galería las maneja camiones-extra.js)
document.addEventListener("click", function (e) {
    const imagen = e.target.closest(".camion-img, #fotoCamionDetalle");
    if (!imagen) return;
    if (!modalImagen || !imagenGrande) return;

    imagenGrande.src = imagen.src;
    modalImagen.style.display = "flex";
});

// cerrar boton X
document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-close-img")) {
        modalImagen.style.display = "none";
        imagenGrande.src = "";
    }
});

// cerrar afuera
if (modalImagen) {
    modalImagen.addEventListener("click", function (e) {
        if (e.target === modalImagen) {
            modalImagen.style.display = "none";
            imagenGrande.src = "";
        }
    });
}


// ======================================================
// VALIDAR CODIGO SEGURIDAD
// ======================================================

if (codigoConfirmacion) {
    codigoConfirmacion.addEventListener("input", () => {
        btnConfirmarEliminar.disabled = codigoConfirmacion.value != codigoEliminar;
    });
}

// CONFIRMAR BOTON ELIMINAR
if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener("click", () => {
        eliminarCamion();
    });
}

// CANCELAR ELIMINAR
document.getElementById("cancelarEliminar")?.addEventListener("click", () => {
    modalEliminar.style.display = "none";
});


// ======================================================
// ABRIR FICHA CAMION
// ======================================================

function abrirFichaCamion(id) {
    const camion = listaCamiones.find(c => c.id == id);
    if (!camion) return;

    camionSeleccionadoPDF = camion;

    document.getElementById("fotoCamionDetalle").src = camion.imgcamion || "/imgs/stock.jpg";
    document.getElementById("vehiculoDetalle").textContent = camion.marca + " " + camion.modelo;
    document.getElementById("placaDetalle").textContent = camion.placa || "";
    document.getElementById("marcaDetalle").textContent = camion.marca || "";
    document.getElementById("modeloDetalle").textContent = camion.modelo || "";
    document.getElementById("anioDetalle").textContent = camion.anio || "";
    document.getElementById("colorDetalle").textContent = camion.color || "";
    document.getElementById("tipoDetalle").textContent = camion.tipo || "";
    document.getElementById("estadoDetalle").textContent = camion.estado || "";
    document.getElementById("kmDetalle").textContent = camion.kilometrajeActual || "";
    document.getElementById("capacidadDetalle").textContent = camion.capacidadCarga || "";
    document.getElementById("motorDetalle").textContent = camion.numeroMotor || "";
    document.getElementById("chasisDetalle").textContent = camion.numeroChasis || "";
    document.getElementById("observacionesDetalle").textContent = camion.observaciones || "Sin observaciones";

    modalVerCamion.style.display = "flex";
}

// EVENTO VER CAMION
document.addEventListener("click", function (e) {
    const boton = e.target.closest(".btn-ver");
    if (!boton) return;
    abrirFichaCamion(boton.dataset.id);
});

// El PDF de la ficha (con selección de información) está en camiones-extra.js


// ======================================================
// ABRIR MODAL ACCIONES
// ======================================================

document.addEventListener("click", function (e) {
    const boton = e.target.closest(".btn-editar");
    if (!boton) return;

    camionSeleccionadoAccion = listaCamiones.find(c => c.id == boton.dataset.id);
    if (!camionSeleccionadoAccion) return;

    modalAccionCamion.style.display = "flex";
});

// EDITAR INFORMACION
btnEditarInfo.onclick = function () {
    modalAccionCamion.style.display = "none";
    abrirModalEditar(camionSeleccionadoAccion);
};

// NUEVA OBSERVACION
btnNuevaObservacion.onclick = function () {
    modalAccionCamion.style.display = "none";
    modalTipoObservacion.style.display = "flex";
};

// CONTINUAR OBSERVACION
continuarObservacion.onclick = function () {
    modalTipoObservacion.style.display = "none";
    modalDetalleObservacion.style.display = "flex";
};

// GUARDAR OBSERVACION
guardarObservacion.onclick = async function () {

    const tipo = document.getElementById("tipoObservacion").value;
    const detalle = document.getElementById("detalleObservacion").value;

    if (!detalle.trim()) {
        mostrarNotificacion("warning", "Campo requerido", "Debe escribir un detalle para guardar la observación");
        return;
    }

    const fecha = new Date();

    const texto =
`Tipo: ${tipo}
Fecha: ${fecha.toLocaleDateString()}
Hora: ${fecha.toLocaleTimeString()}

Detalle:
${detalle}`;

    try {

        const respuesta = await fetch("/camiones/observacion/" + camionSeleccionadoAccion.id, {
            method: "PUT",
            headers: { "Content-Type": "text/plain" },
            body: texto
        });

        const resultado = await respuesta.text();

        if (!respuesta.ok) {
            mostrarNotificacion("error", "Error al guardar", resultado);
            return;
        }

        mostrarNotificacion("success", "Observación guardada", "La observación fue registrada correctamente");

        modalDetalleObservacion.style.display = "none";
        document.getElementById("detalleObservacion").value = "";

        await cargarCamiones();

    } catch (e) {
        console.error(e);
        mostrarNotificacion("error", "Error de conexión", "No fue posible comunicarse con el servidor");
    }

};

// CERRAR MODAL ACCION
document.querySelector(".cerrarAccion").addEventListener("click", () => {
    modalAccionCamion.style.display = "none";
});


// ======================================================
// ABRIR MODAL EDITAR USANDO EL FORMULARIO NUEVO
// ======================================================

function abrirModalEditar(camion) {

    if (!camion) return;

    camionEditando = camion;          // objeto completo
    camionEditandoId = camion.id;     // ID para el PUT
    modoEdicion = true;

    modalNuevo.style.display = "flex";

    const titulo = document.querySelector("#modalNuevoCamion .modal-header h2");
    if (titulo) {
        titulo.innerHTML = `
        <i class="fa-solid fa-pen-to-square"></i>
        Editar Camión
        `;
    }

    // CARGAR DATOS
    document.getElementById("placa").value = camion.placa || "";
    document.getElementById("marca").value = camion.marca || "";
    document.getElementById("modelo").value = camion.modelo || "";
    document.getElementById("anio").value = camion.anio || "";
    document.getElementById("color").value = camion.color || "";
    document.getElementById("tipo").value = camion.tipo || "";
    document.getElementById("capacidad").value = camion.capacidadCarga || "";
    document.getElementById("kilometraje").value = camion.kilometrajeActual || "";
    document.getElementById("motor").value = camion.numeroMotor || "";
    document.getElementById("chasis").value = camion.numeroChasis || "";
    document.getElementById("fechaCompra").value = camion.fechaCompra || "";
    document.getElementById("valorCompra").value = camion.valorCompra || "";
    document.getElementById("observaciones").value = camion.observaciones || "";

    // Imagen
    if (previewFoto) {
        previewFoto.src = camion.imgcamion ? camion.imgcamion : "/imgs/stock.jpg";
    }
}


// ======================================================
// NOTIFICACIONES
// ======================================================

function mostrarNotificacion(tipo, titulo, mensaje) {

    const notificacion = document.getElementById("notificacion");
    const icono = document.getElementById("iconoNotificacion");
    const tituloEl = document.getElementById("tituloNotificacion");
    const mensajeEl = document.getElementById("mensajeNotificacion");

    if (!notificacion) {
        console.error("No existe el elemento #notificacion en HTML");
        return;
    }

    notificacion.className = "notificacion " + tipo;

    if (icono) {
        if (tipo === "success") {
            icono.className = "fa-solid fa-circle-check";
        } else if (tipo === "error") {
            icono.className = "fa-solid fa-circle-xmark";
        } else {
            icono.className = "fa-solid fa-triangle-exclamation";
        }
    }

    if (tituloEl) tituloEl.textContent = titulo;
    if (mensajeEl) mensajeEl.textContent = mensaje;

    setTimeout(() => { notificacion.classList.add("show"); }, 100);
    setTimeout(() => { notificacion.classList.remove("show"); }, 3500);
}


// ======================================================
// FILTRO DE MARCAS
// ======================================================

function cargarFiltroMarcas() {

    const select = document.getElementById("filtroMarca");
    if (!select) return;

    // limpiar opciones actuales
    select.innerHTML = `
        <option value="">Todas</option>
    `;

    const marcas = [
        ...new Set(
            listaCamiones
                .map(camion => camion.marca)
                .filter(marca => marca)
        )
    ];

    marcas.sort();

    marcas.forEach(marca => {
        const option = document.createElement("option");
        option.value = marca;
        option.textContent = marca;
        select.appendChild(option);
    });
}


// ======================================================
// MOSTRAR OBSERVACIONES PARA ELIMINAR
// ======================================================

function mostrarObservacionesEliminar(texto) {

    listaObservacionesEliminar.innerHTML = "";

    const observaciones = texto.split("\n\n\n").filter(o => o.trim() !== "");

    observaciones.forEach((obs, index) => {

        const div = document.createElement("div");
        div.className = "observacion-eliminar-card";

        div.innerHTML = `
            <div class="numero-observacion">
                Observación ${index + 1}
            </div>

            <p>
                ${obs}
            </p>

            <button class="btn-eliminar-obs" data-index="${index}">
                <i class="fa-solid fa-trash"></i>
                Eliminar
            </button>
        `;

        listaObservacionesEliminar.appendChild(div);
    });

    modalEliminarObservacion.style.display = "flex";
}


// ======================================================
// ELIMINAR OBSERVACIÓN INDIVIDUAL
// ======================================================

document.addEventListener("click", function (e) {
    const boton = e.target.closest(".btn-eliminar-obs");
    if (!boton) return;
    eliminarObservacion(boton.dataset.index);
});

async function eliminarObservacion(indice) {

    const camion = listaCamiones.find(c => c.id == camionSeleccionadoEliminar);
    if (!camion) return;

    const observaciones = camion.observaciones
        .split("\n\n\n")
        .map(o => o.trim())
        .filter(o => o.length > 0);

    observaciones.splice(indice, 1);

    const nuevasObservaciones = observaciones.length > 0
        ? observaciones.join("\n\n\n")
        : "";

    try {

        const respuesta = await fetch(
            "/camiones/observaciones/actualizar/" + camionSeleccionadoEliminar,
            {
                method: "PUT",
                headers: { "Content-Type": "text/plain" },
                body: nuevasObservaciones
            }
        );

        if (!respuesta.ok) {
            throw new Error("Error actualizando observaciones");
        }

        mostrarNotificacion("success", "Observación eliminada", "La observación fue eliminada correctamente");

        modalEliminarObservacion.style.display = "none";

        await cargarCamiones();

    }
    catch (error) {
        mostrarNotificacion("error", "Error", "No se pudo eliminar la observación");
    }
}