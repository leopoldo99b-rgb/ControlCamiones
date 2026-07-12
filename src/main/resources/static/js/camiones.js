// ======================================================
// VARIABLES GLOBALES
// ======================================================

let listaCamiones = [];

let paginaActual = 1;

const registrosPorPagina = 10;

let camionSeleccionadoPDF = null;

let camionSeleccionadoAccion=null;

let modoEdicion = false;

let camionEditando = null;


// ======================================================
// ELEMENTOS DOM
// ======================================================

const btnNuevoCamion =
    document.getElementById("btnNuevoCamion");


const modalNuevo =
    document.getElementById("modalNuevoCamion");


const formCamion =
    document.getElementById("formCamion");


const tbody =
    document.getElementById("tbodyCamiones");


const contador =
    document.getElementById("totalCamiones");


const btnGuardar =
    document.querySelector(".btn-save");


const inputFoto =
    document.getElementById("foto");


const previewFoto =
    document.getElementById("previewFoto");


// filtros

const buscarCamion =
    document.getElementById("buscarCamion");


const filtroEstado =
    document.getElementById("filtroEstado");


const filtroTipo =
    document.getElementById("filtroTipo");


const filtroMarca =
    document.getElementById("filtroMarca");


const modalEliminar =
    document.getElementById("modalEliminar");


const codigoGenerado =
    document.getElementById("codigoGenerado");


const codigoConfirmacion =
    document.getElementById("codigoConfirmacion");


const btnConfirmarEliminar =
    document.getElementById("confirmarEliminar");


let camionSeleccionadoEliminar = null;


let codigoEliminar = "";

const modalVerCamion =
    document.getElementById("modalVerCamion");
	
	const modalEditar =
	    document.getElementById("modalEditar");
	
	const modalAccionCamion =
	document.getElementById("modalAccionCamion");


	const modalTipoObservacion =
	document.getElementById("modalTipoObservacion");


	const modalDetalleObservacion =
	document.getElementById("modalDetalleObservacion");


	const btnEditarInfo =
	document.getElementById("btnEditarInfo");


	const btnNuevaObservacion =
	document.getElementById("btnNuevaObservacion");


	const continuarObservacion =
	document.getElementById("continuarObservacion");


	const guardarObservacion =
	document.getElementById("guardarObservacion");
	
	const btnExportar =
	    document.getElementById("btnExportar");


	const modalExportar =
	    document.getElementById("modalExportar");


	const exportarPDF =
	    document.getElementById("exportarPDF");


	const exportarExcel =
	    document.getElementById("exportarExcel");
		
		
		// MODAL SELECCIONAR ELIMINACIÓN

		const btnEliminarCamion =
		    document.getElementById("btnEliminarCamion");


		const btnEliminarObservacion =
		    document.getElementById("btnEliminarObservacion");


		const cancelarSeleccionEliminar =
		    document.getElementById("cancelarSeleccionEliminar");


		// MODAL CONFIRMAR ELIMINACIÓN CON CÓDIGO

		const modalConfirmarEliminar =
		    document.getElementById("modalConfirmarEliminar");
			
			const modalEliminarObservacion =
			    document.getElementById("modalEliminarObservacion");


			const listaObservacionesEliminar =
			    document.getElementById("listaObservacionesEliminar");


			const cancelarEliminarObservacion =
			    document.getElementById("cancelarEliminarObservacion");

// ======================================================
// ABRIR MODAL NUEVO
// ======================================================

if (btnNuevoCamion) {

    btnNuevoCamion.addEventListener("click", () => {

        modalNuevo.style.display = "flex";

    });

}


if(btnExportar){

    btnExportar.addEventListener("click",()=>{

        modalExportar.style.display="flex";

    });

}


// ======================================================
// BOTÓN EXPORTAR EXCEL
// ======================================================


if(exportarExcel){

    exportarExcel.addEventListener("click",()=>{


        exportarExcelCamiones();


        // cerrar modal después de exportar
        modalExportar.style.display="none";


    });

}


// ======================================================
// BOTÓN EXPORTAR PDF
// ======================================================

if(exportarPDF){

    exportarPDF.addEventListener("click",()=>{


        exportarTablaPDF();


        modalExportar.style.display="none";


    });

}
// ======================================================
// CERRAR MODALES
// ======================================================

document
    .querySelectorAll(".btn-close,.btn-cancel")
    .forEach(btn => {


        btn.addEventListener("click", () => {


            document
                .querySelectorAll(".modal")
                .forEach(modal => {

                    modal.style.display = "none";

                });


        });


    });


	// ======================================================
	// CERRAR FICHA CAMION
	// ======================================================

	const cerrarFichaCamion =
	    document.getElementById("cerrarFichaCamion");


	if(cerrarFichaCamion){

	    cerrarFichaCamion.addEventListener("click", () => {

	        modalVerCamion.style.display = "none";

	    });

	}

// cerrar click fuera

window.addEventListener("click", (e) => {


    document
        .querySelectorAll(".modal")
        .forEach(modal => {


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


        const archivo =
            inputFoto.files[0];


        if (!archivo) return;



        const lector =
            new FileReader();



        lector.onload = (e) => {


            previewFoto.src =
                e.target.result;


        };



        lector.readAsDataURL(archivo);



    });


}






// ======================================================
// CARGAR CAMIONES DESDE JAVA
// ======================================================


async function cargarCamiones() {


    try {


        const respuesta =
            await fetch("/camiones/lista");



        if (!respuesta.ok) {


            throw new Error(
                "Error al consultar camiones"
            );


        }




        listaCamiones =
            await respuesta.json();



        paginaActual = 1;
		
		// ===============================
		       // ACTUALIZAR FILTRO MARCAS
		       // ===============================

		       cargarFiltroMarcas();



        aplicarFiltros();



        controlarLimite();



    }
    catch (error) {


        console.error(
            "Error cargando camiones:",
            error
        );



        tbody.innerHTML = `

        <tr>

            <td colspan="9"
            style="text-align:center">

            Error al cargar datos

            </td>

        </tr>

        `;


    }


}






// ======================================================
// APLICAR FILTROS
// ======================================================


function aplicarFiltros() {


    let resultado =
        [...listaCamiones];



    const texto =
        buscarCamion?.value
            .toLowerCase()
        || "";



    const estado =
        filtroEstado?.value
        || "";



    const tipo =
        filtroTipo?.value
        || "";



    const marca =
        filtroMarca?.value
        || "";





    if (texto) {


        resultado =
            resultado.filter(c => {


                return (

                    (c.placa || "")
                        .toLowerCase()
                        .includes(texto)


                    ||

                    (c.marca || "")
                        .toLowerCase()
                        .includes(texto)


                    ||

                    (c.modelo || "")
                        .toLowerCase()
                        .includes(texto)


                );


            });


    }






    if (estado) {


        resultado =
            resultado.filter(
                c => c.estado === estado
            );


    }





    if (tipo) {


        resultado =
            resultado.filter(
                c => c.tipo === tipo
            );


    }





    if (marca && marca !== "Todas") {


        resultado =
            resultado.filter(
                c => c.marca === marca
            );


    }





    renderTabla(resultado);


    actualizarContador(
        resultado.length
    );


}





// ======================================================
// CONTROL LIMITE 30 CAMIONES
// ======================================================


function controlarLimite() {


    if (!btnGuardar)
        return;



    if (listaCamiones.length >= 30) {


        btnGuardar.disabled = true;


        btnGuardar.innerHTML =
            "🚫 Límite de 30 camiones";


    }
    else {


        btnGuardar.disabled = false;


        btnGuardar.innerHTML =

            `
        <i class="fa-solid fa-floppy-disk"></i>
        Guardar Camión
        `;


    }



}

// ======================================================
// RENDER TABLA
// ======================================================

function renderTabla(camiones) {


    tbody.innerHTML = "";



    if (camiones.length === 0) {


        tbody.innerHTML = `

        <tr>

            <td colspan="9"
            style="text-align:center">

                No existen camiones registrados

            </td>

        </tr>

        `;


        crearPaginacion(0);

        return;

    }



    const inicio =
        (paginaActual - 1) *
        registrosPorPagina;



    const fin =
        inicio +
        registrosPorPagina;



    const pagina =
        camiones.slice(inicio, fin);





    pagina.forEach(c => {



        const img =

            (c.imgcamion &&
                c.imgcamion.trim() !== "")
                ?

                c.imgcamion

                :

                "/imgs/stock.jpg";




        const kilometraje =

            c.kilometrajeActual
            ??
            0;





        const fila =
            document.createElement("tr");




        fila.innerHTML = `

		<td class="img-cell">

		    <img 
		        class="camion-img"
		        src="${img}"
		        data-img="${img}"
		        onerror="this.src='/imgs/stock.jpg'">

		</td>



        <td>

            <div class="vehiculo-info">

                <strong>
                    ${c.marca || ""}
                </strong>

                <span>
                    ${c.modelo || ""}
                </span>

            </div>

        </td>




        <td>
            ${c.placa || ""}
        </td>



        <td>
            ${c.marca || ""}
        </td>



        <td>
            ${c.modelo || ""}
        </td>



        <td>
            ${c.tipo || ""}
        </td>



        <td>
            ${kilometraje}
        </td>




        <td>

            <span class="estado ${claseEstado(c.estado)}">

                ${c.estado || ""}

            </span>

        </td>



        <td>

            <div class="acciones">


			<button 
			class="btn-action btn-ver"
			data-id="${c.id}">

			    <i class="fa-solid fa-eye"></i>

			</button>



			<button 
			class="btn-action btn-editar"
			data-id="${c.id}">

			<i class="fa-solid fa-pen"></i>

			</button>



				<button 
				class="btn-action btn-delete"
				data-id="${c.id}">

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


    const contenedor =
        document.querySelector(".pagination");


    if (!contenedor)
        return;



    contenedor.innerHTML = "";



    const totalPaginas =
        Math.ceil(
            total / registrosPorPagina
        );



    if (totalPaginas <= 1)
        return;




    const anterior =
        document.createElement("button");


    anterior.innerHTML =
        '<i class="fa-solid fa-angle-left"></i>';



    anterior.onclick = () => {


        if (paginaActual > 1) {

            paginaActual--;

            aplicarFiltros();

        }

    };



    contenedor.appendChild(anterior);







    for (let i = 1;i <= totalPaginas;i++) {



        const boton =
            document.createElement("button");


        boton.textContent = i;



        if (i === paginaActual) {

            boton.classList.add("active");

        }




        boton.onclick = () => {


            paginaActual = i;


            aplicarFiltros();


        };



        contenedor.appendChild(boton);



    }






    const siguiente =
        document.createElement("button");



    siguiente.innerHTML =
        '<i class="fa-solid fa-angle-right"></i>';



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


        case "DISPONIBLE":

            return "disponible";


        case "EN VIAJE":

            return "viaje";


        case "MANTENIMIENTO":

            return "mantenimiento";


        default:

            return "";

    }


}







// ======================================================
// EVENTOS BUSQUEDA
// ======================================================


if (buscarCamion) {


    buscarCamion.addEventListener(
        "input",
        () => {


            paginaActual = 1;


            aplicarFiltros();


        });


}




// ======================================================
// EVENTOS FILTROS
// ======================================================


[filtroEstado, filtroTipo, filtroMarca]
    .forEach(filtro => {


        if (filtro) {


            filtro.addEventListener(
                "change",
                () => {


                    paginaActual = 1;


                    aplicarFiltros();


                });


        }


    });






	// ======================================================
	// GUARDAR / EDITAR CAMIÓN
	// ======================================================


	// ======================================================
	// ABRIR MODAL EDITAR USANDO EL MISMO FORMULARIO
	// ======================================================

	function abrirModalEditar(camion) {

	    if (!camion)
	        return;


	    console.log("EDITANDO CAMION:", camion);


	    modoEdicion = true;
	    camionEditandoId = camion.id;


	    modalNuevo.style.display = "flex";


	    // Cambiar título
	    document.querySelector("#modalNuevoCamion h2").innerHTML =
	        `
	        <i class="fa-solid fa-pen-to-square"></i>
	        Editar Camión
	        `;


	    // Cargar datos

	    document.getElementById("placa").value =
	        camion.placa || "";


	    document.getElementById("marca").value =
	        camion.marca || "";


	    document.getElementById("modelo").value =
	        camion.modelo || "";


	    document.getElementById("anio").value =
	        camion.anio || "";


	    document.getElementById("color").value =
	        camion.color || "";


	    document.getElementById("tipo").value =
	        camion.tipo || "";


	    document.getElementById("capacidad").value =
	        camion.capacidadCarga || "";


	    document.getElementById("kilometraje").value =
	        camion.kilometrajeActual || "";


	    document.getElementById("motor").value =
	        camion.numeroMotor || "";


	    document.getElementById("chasis").value =
	        camion.numeroChasis || "";


	    document.getElementById("estado").value =
	        camion.estado || "";


	    document.getElementById("fechaCompra").value =
	        camion.fechaCompra || "";


	    document.getElementById("valorCompra").value =
	        camion.valorCompra || "";


	    document.getElementById("observaciones").value =
	        camion.observaciones || "";


	    if(camion.imgcamion){

	        previewFoto.src =
	            camion.imgcamion;

	    }

	}



	// ======================================================
	// NUEVO CAMIÓN
	// ======================================================

	btnNuevoCamion.onclick = function(){

	    modoEdicion = false;
	    camionEditandoId = null;


	    formCamion.reset();


	    previewFoto.src =
	        "/imgs/stock.jpg";


	    document.querySelector("#modalNuevoCamion h2").innerHTML =
	    `
	    <i class="fa-solid fa-truck-front"></i>
	    Registrar Nuevo Camión
	    `;


	    modalNuevo.style.display="flex";

	};




	// ======================================================
	// GUARDAR / ACTUALIZAR CAMIÓN
	// ======================================================


	if(formCamion){


	formCamion.addEventListener(
	"submit",
	async function(e){


	e.preventDefault();



	const estabaEditando = modoEdicion;



	const datos = new FormData();



	// FOTO SOLO SI CAMBIA
	if(inputFoto &&
	   inputFoto.files.length > 0){


	    datos.append(
	        "foto",
	        inputFoto.files[0]
	    );

	}



	// CAMPOS

	datos.append(
	"placa",
	document.getElementById("placa").value
	);


	datos.append(
	"marca",
	document.getElementById("marca").value
	);


	datos.append(
	"modelo",
	document.getElementById("modelo").value
	);


	datos.append(
	"anio",
	document.getElementById("anio").value
	);


	datos.append(
	"color",
	document.getElementById("color").value
	);


	datos.append(
	"tipo",
	document.getElementById("tipo").value
	);


	datos.append(
	"capacidad",
	document.getElementById("capacidad").value
	);


	datos.append(
	"kilometraje",
	document.getElementById("kilometraje").value
	);


	datos.append(
	"motor",
	document.getElementById("motor").value
	);


	datos.append(
	"chasis",
	document.getElementById("chasis").value
	);


	datos.append(
	"estado",
	document.getElementById("estado").value
	);


	datos.append(
	"fechaCompra",
	document.getElementById("fechaCompra").value
	);


	datos.append(
	"valorCompra",
	document.getElementById("valorCompra").value
	);


	datos.append(
	"observaciones",
	document.getElementById("observaciones").value
	);





	try{


	btnGuardar.disabled=true;


	btnGuardar.innerHTML=
	`
	<i class="fa-solid fa-spinner fa-spin"></i>
	Guardando...
	`;





	let respuesta;





	// ==================================================
	// EDITAR
	// ==================================================

	if(modoEdicion){



	    if(!camionEditandoId){


			mostrarNotificacion(
			    "error",
			    "Error",
			    "No hay un camión seleccionado para editar"
			);


	        return;

	    }

	    console.log(
	        "EDITANDO ID:",
	        camionEditandoId
	    );



	    respuesta = await fetch(
		    "/camiones/editar/" + camionEditandoId,
		    {
		        method: "PUT",
		        body: datos
		    }
		);


	}





	// ==================================================
	// NUEVO
	// ==================================================

	else{


	    respuesta =
	    await fetch(

	        "/camiones/guardar",

	        {

	            method:"POST",

	            body:datos

	        }

	    );


	}







	if(!respuesta.ok){


	    const error =
	    await respuesta.text();


	    console.error(error);


		mostrarNotificacion(
		    "error",
		    "Error",
		    "No se pudo guardar el camión"
		);


	    return;


	}






	// LIMPIAR

	formCamion.reset();


	if(previewFoto){

	    previewFoto.src =
	    "/imgs/stock.jpg";

	}



	modalNuevo.style.display="none";



	modoEdicion=false;

	camionEditandoId=null;



	await cargarCamiones();




	mostrarNotificacion(
	    "success",
	    estabaEditando 
	        ? "Camión actualizado"
	        : "Camión guardado",
	    estabaEditando
	        ? "El camión fue actualizado correctamente"
	        : "El camión fue registrado correctamente"
	);




	}
	catch(error){


	console.error(error);


	mostrarNotificacion(
	    "error",
	    "Sin conexión",
	    "No se pudo conectar con el servidor"
	);



	}
	finally{


	btnGuardar.disabled=false;


	btnGuardar.innerHTML=
	`
	<i class="fa-solid fa-floppy-disk"></i>
	Guardar Camión
	`;



	}



	});


	}

// ======================================================
// INICIO ÚNICO
// ======================================================


document.addEventListener(
    "DOMContentLoaded",
    () => {


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


// ======================================================
// OPCIÓN ELIMINAR CAMIÓN
// ======================================================

if(btnEliminarCamion){

    btnEliminarCamion.onclick = function(){


        modalEliminar.style.display = "none";


        codigoEliminar =
            Math.floor(100000 + Math.random() * 900000);


        codigoGenerado.textContent =
            codigoEliminar;


        codigoConfirmacion.value = "";


        btnConfirmarEliminar.disabled = true;


        modalConfirmarEliminar.style.display = "flex";


    };

}



// ======================================================
// OPCIÓN ELIMINAR OBSERVACIÓN
// ======================================================

if(btnEliminarObservacion){

    btnEliminarObservacion.onclick = function(){


        modalEliminar.style.display = "none";


        abrirEliminarObservacion();


    };

}


// ======================================================
// ABRIR ELIMINAR OBSERVACIÓN
// ======================================================

function abrirEliminarObservacion(){


    const camion =
        listaCamiones.find(
            c => c.id == camionSeleccionadoEliminar
        );



    if(!camion){

        mostrarNotificacion(
            "error",
            "Error",
            "No se encontró el camión"
        );

        return;

    }



    if(!camion.observaciones ||
       camion.observaciones.trim() === ""){


        mostrarNotificacion(
            "warning",
            "Sin observaciones",
            "Este camión no tiene observaciones para eliminar"
        );


        return;

    }



	mostrarObservacionesEliminar(
	    camion.observaciones
	);


}



// ======================================================
// CANCELAR SELECCIÓN
// ======================================================

if(cancelarSeleccionEliminar){

    cancelarSeleccionEliminar.onclick = function(){


        modalEliminar.style.display = "none";


    };

}


// ======================================================
// CONFIRMAR ELIMINACIÓN
// ======================================================

function eliminarCamion() {



    fetch(`/camiones/eliminar/${camionSeleccionadoEliminar}`, {

        method: "DELETE"

    })


        .then(res => res.text())


        .then(data => {


			mostrarNotificacion(
			    "success",
			    "Camión eliminado",
			    data
			);


            modalEliminar.style.display = "none";


            cargarCamiones();


        })


        .catch(error => {


            console.error(error);


			mostrarNotificacion(
			    "error",
			    "Error",
			    "Error Eliminando Camion"
			);


        });



}

// ======================================================
// EVENTO BOTON ELIMINAR
// ======================================================

document.addEventListener("click", function(e) {


    const boton =
        e.target.closest(".btn-delete");



    if (!boton)
        return;



    const id =
        boton.dataset.id;



    abrirModalEliminar(id);



});

// ======================================================
// VER IMAGEN GRANDE
// ======================================================


const modalImagen =
    document.getElementById("modalImagen");


const imagenGrande =
    document.getElementById("imagenGrande");




// abrir imagen desde tabla o ficha

document.addEventListener("click", function(e) {



    const imagen =
        e.target.closest(
            ".camion-img, #fotoCamionDetalle"
        );



    if (!imagen)
        return;



    if (!modalImagen || !imagenGrande)
        return;




    imagenGrande.src =
        imagen.src;




    modalImagen.style.display =
        "flex";



});




// cerrar boton X

document.addEventListener("click", function(e) {


    if (
        e.target.closest(
            ".btn-close-img"
        )
    ) {


        modalImagen.style.display =
            "none";


        imagenGrande.src =
            "";


    }


});




// cerrar afuera

if (modalImagen) {


    modalImagen.addEventListener(
        "click",
        function(e) {


            if (e.target === modalImagen) {


                modalImagen.style.display =
                    "none";


                imagenGrande.src =
                    "";


            }


        }
    );


}

// ======================================================
// VALIDAR CODIGO SEGURIDAD
// ======================================================

if (codigoConfirmacion) {


    codigoConfirmacion.addEventListener("input", () => {


        btnConfirmarEliminar.disabled =
            codigoConfirmacion.value != codigoEliminar;



    });


}




// ======================================================
// CONFIRMAR BOTON ELIMINAR
// ======================================================

if (btnConfirmarEliminar) {


    btnConfirmarEliminar.addEventListener("click", () => {


        eliminarCamion();


    });


}






// CANCELAR ELIMINAR

document
    .getElementById("cancelarEliminar")
    ?.addEventListener("click", () => {


        modalEliminar.style.display = "none";


    });

// ======================================================
// ABRIR FICHA CAMION
// ======================================================

function abrirFichaCamion(id) {


    const camion =
        listaCamiones.find(
            c => c.id == id
        );


    if (!camion)
        return;



    camionSeleccionadoPDF = camion;



    console.log(
        "CAMION SELECCIONADO:",
        camion
    );



    document.getElementById("fotoCamionDetalle").src =
        camion.imgcamion ||
        "/imgs/stock.jpg";



    document.getElementById("vehiculoDetalle").textContent =
        camion.marca + " " + camion.modelo;



    document.getElementById("placaDetalle").textContent =
        camion.placa || "";

    document.getElementById("marcaDetalle").textContent =
        camion.marca || "";

    document.getElementById("modeloDetalle").textContent =
        camion.modelo || "";

    document.getElementById("anioDetalle").textContent =
        camion.anio || "";

    document.getElementById("tipoDetalle").textContent =
        camion.tipo || "";

    document.getElementById("estadoDetalle").textContent =
        camion.estado || "";

    document.getElementById("kmDetalle").textContent =
        camion.kilometrajeActual || "";

    document.getElementById("capacidadDetalle").textContent =
        camion.capacidadCarga || "";

    document.getElementById("motorDetalle").textContent =
        camion.numeroMotor || "";

    document.getElementById("chasisDetalle").textContent =
        camion.numeroChasis || "";



    document.getElementById("observacionesDetalle").textContent =

        camion.observaciones ||
        "Sin observaciones";



    console.log(
        "OBSERVACIONES:",
        camion.observaciones
    );



    modalVerCamion.style.display = "flex";

}
// ======================================================
// EVENTO VER CAMION
// ======================================================

document.addEventListener("click", function(e) {


    const boton =
        e.target.closest(".btn-ver");



    if (!boton)
        return;



    abrirFichaCamion(
        boton.dataset.id
    );


});

// ======================================================
// GENERAR PDF FICHA CAMIÓN PROFESIONAL
// ======================================================


document
    .getElementById("btnImprimirCamion")
    .addEventListener("click", () => {


		if (!camionSeleccionadoPDF) {

		    mostrarNotificacion(
		        "warning",
		        "Sin selección",
		        "No hay un camión seleccionado para generar la ficha"
		    );

		    return;

		}

        const { jsPDF } = window.jspdf;


        const pdf = new jsPDF(
            "p",
            "mm",
            "a4"
        );



        const c = camionSeleccionadoPDF;



        const ancho =
            pdf.internal.pageSize.width;



        const alto =
            pdf.internal.pageSize.height;




        // ===============================
        // COLORES
        // ===============================


        const azul = [15, 23, 42];

        const azulClaro = [37, 99, 235];

        const gris = [241, 245, 249];

        const texto = [30, 41, 59];





        // ===============================
        // HEADER
        // ===============================


        function header(titulo) {


            pdf.setFillColor(
                ...azul
            );


            pdf.roundedRect(
                10,
                10,
                190,
                25,
                5,
                5,
                "F"
            );



            pdf.setTextColor(
                255,
                255,
                255
            );


            pdf.setFontSize(18);


            pdf.text(
                titulo,
                105,
                26,
                {
                    align: "center"
                }
            );



        }





        // ===============================
        // FOOTER
        // ===============================


        function footer() {


            pdf.setDrawColor(
                220
            );


            pdf.line(
                10,
                285,
                200,
                285
            );


            pdf.setFontSize(8);


            pdf.setTextColor(
                120
            );


            pdf.text(

                "Sistema de Gestión de Flota - Ficha Vehicular",

                105,

                292,

                {
                    align: "center"
                }

            );


        }






        // ===============================
        // PRIMERA PAGINA
        // ===============================


        header(
            "FICHA DEL CAMIÓN"
        );




        // TITULO VEHICULO


        pdf.setTextColor(
            ...texto
        );


        pdf.setFontSize(22);


        pdf.text(

            `${c.marca || ""} ${c.modelo || ""}`,

            105,

            55,

            {
                align: "center"
            }

        );




        pdf.setFontSize(12);


        pdf.setTextColor(
            100
        );


        pdf.text(

            "Documento oficial del vehículo",

            105,

            63,

            {
                align: "center"
            }

        );






        // ===============================
        // FOTO
        // ===============================


        if (c.imgcamion) {


            try {


                pdf.addImage(

                    c.imgcamion,

                    "JPEG",

                    75,

                    75,

                    60,

                    45

                );


            }
            catch (e) {

                console.log(
                    "No se pudo cargar imagen"
                );

            }


        }







        // ===============================
        // TARJETAS DATOS
        // ===============================


        function tarjeta(
            x,
            y,
            titulo,
            valor
        ) {


            pdf.setFillColor(
                ...gris
            );


            pdf.roundedRect(

                x,

                y,

                85,

                18,

                3,

                3,

                "F"

            );



            pdf.setFontSize(8);


            pdf.setTextColor(
                100
            );


            pdf.text(

                titulo,

                x + 5,

                y + 6

            );



            pdf.setFontSize(11);


            pdf.setTextColor(
                ...texto
            );


            pdf.text(

                String(valor || "No registrado"),

                x + 5,

                y + 14

            );


        }






        let y = 140;



        const datos = [

            ["Placa", c.placa],

            ["Marca", c.marca],

            ["Modelo", c.modelo],

            ["Año", c.anio],

            ["Tipo", c.tipo],

            ["Estado", c.estado],

            ["Kilometraje", c.kilometrajeActual + " km"],

            ["Motor", c.numeroMotor],

            ["Chasis", c.numeroChasis],

            ["Capacidad", c.capacidadCarga]

        ];



        datos.forEach((d, i) => {


            let columna =
                i % 2 === 0
                    ? 15
                    : 110;



            let fila =
                Math.floor(i / 2);



            tarjeta(

                columna,

                y + (fila * 23),

                d[0],

                d[1]

            );


        });




        footer();





		// ===============================
		// PAGINA OBSERVACIONES
		// ===============================


		pdf.addPage();



		header(
		    "OBSERVACIONES DEL VEHÍCULO"
		);



		// ===============================
		// OBSERVACIONES INDIVIDUALES
		// ===============================


		let observaciones =
		    c.observaciones
		    ?
		    c.observaciones.split("\n\n\n")
		    :
		    [];



		let posY = 50;



		if(observaciones.length === 0){


		    pdf.setFontSize(12);

		    pdf.setTextColor(
		        80
		    );


		    pdf.text(

		        "Sin observaciones",

		        30,

		        posY

		    );


		}
		else{


		    observaciones.forEach((obs,index)=>{


		        const lineas =
		            obs.split("\n");



		        let altura =
		            (lineas.length * 6) + 25;



		        // Si no hay espacio crea otra página

		        if(posY + altura > 270){


		            pdf.addPage();


		            header(
		                "OBSERVACIONES DEL VEHÍCULO"
		            );


		            posY = 50;

		        }




		        // RECUADRO OBSERVACION


		        pdf.setFillColor(
		            248,
		            250,
		            252
		        );


		        pdf.roundedRect(

		            20,

		            posY,

		            170,

		            altura,

		            5,

		            5,

		            "F"

		        );



		        // TITULO


		        pdf.setFontSize(11);


		        pdf.setTextColor(
		            15,
		            23,
		            42
		        );


		        pdf.setFont(undefined,"bold");


		        pdf.text(

		            "Observación " + (index + 1),

		            30,

		            posY + 10

		        );



		        let yTexto =
		            posY + 20;



					        // CONTENIDO


					        lineas.forEach((linea, i)=>{


					            // Si viene "Detalle:" solo, tomar la siguiente línea

					            if(linea.trim() === "Detalle:"){


					                pdf.setFont(undefined,"bold");


					                pdf.text(

					                    "Detalle:",

					                    35,

					                    yTexto

					                );



					                pdf.setFont(undefined,"normal");


					                if(lineas[i + 1]){


					                    pdf.text(

					                        lineas[i + 1].trim(),

					                        75,

					                        yTexto

					                    );


					                }



					                yTexto += 6;


					                return;


					            }





					            let partes =
					                linea.split(":");




					            if(partes.length > 1){


					                const etiqueta =
					                    partes[0].trim() + ":";


					                const valor =
					                    partes.slice(1)
					                    .join(":")
					                    .trim();




					                // ETIQUETA EN NEGRITA


					                pdf.setFont(undefined,"bold");


					                pdf.text(

					                    etiqueta,

					                    35,

					                    yTexto

					                );




					                // VALOR


					                pdf.setFont(undefined,"normal");


					                pdf.text(

					                    valor,

					                    75,

					                    yTexto

					                );



					            }



					            yTexto += 6;



					        });




					        posY += altura + 8;



					    });



					}


		// ===============================
		// DATOS PIE OBSERVACION
		// ===============================


		pdf.setFontSize(10);


		pdf.setTextColor(
		    100
		);



		pdf.text(

		    "Vehículo: " + c.placa,

		    20,

		    250

		);



		pdf.text(

		    "Fecha emisión: " +
		    new Date().toLocaleDateString(),

		    20,

		    258

		);



		footer();





		pdf.save(

		    "Ficha_" + c.placa + ".pdf"

		);
		
		});
	
	// ======================================================
	// ABRIR MODAL ACCIONES
	// ======================================================


	document.addEventListener(
	"click",
	function(e){


	    const boton =
	    e.target.closest(".btn-editar");


	    if(!boton)
	    return;



	    camionSeleccionadoAccion =
	    listaCamiones.find(
	        c => c.id == boton.dataset.id
	    );



	    console.log(
	        "CAMION SELECCIONADO:",
	        camionSeleccionadoAccion
	    );



	    if(!camionSeleccionadoAccion)
	    return;



	    modalAccionCamion.style.display="flex";


	});




	// ======================================================
	// EDITAR INFORMACION
	// ======================================================


	btnEditarInfo.onclick=function(){


	    modalAccionCamion.style.display="none";


	    abrirModalEditar(
	        camionSeleccionadoAccion
	    );


	};





	// ======================================================
	// NUEVA OBSERVACION
	// ======================================================


	btnNuevaObservacion.onclick=function(){


	    modalAccionCamion.style.display="none";


	    modalTipoObservacion.style.display="flex";


	};






	// ======================================================
	// CONTINUAR OBSERVACION
	// ======================================================


	continuarObservacion.onclick=function(){


	    modalTipoObservacion.style.display="none";


	    modalDetalleObservacion.style.display="flex";


	};






	// ======================================================
	// GUARDAR OBSERVACION
	// ======================================================

	guardarObservacion.onclick = async function () {


	    const tipo =
	        document.getElementById("tipoObservacion").value;


	    const detalle =
	        document.getElementById("detalleObservacion").value;



	    if (!detalle.trim()) {


	        mostrarNotificacion(
	            "warning",
	            "Campo requerido",
	            "Debe escribir un detalle para guardar la observación"
	        );


	        return;

	    }




	    const fecha = new Date();



		const texto = 
		`Tipo: ${tipo}
		Fecha: ${fecha.toLocaleDateString()}
		Hora: ${fecha.toLocaleTimeString()}

		Detalle:
		${detalle}`;



	    console.log(
	        "ID:",
	        camionSeleccionadoAccion.id
	    );


	    console.log(
	        "OBSERVACION:",
	        texto
	    );




	    try {


	        const respuesta = await fetch(

	            "/camiones/observacion/" 
	            + 
	            camionSeleccionadoAccion.id,

	            {

	                method: "PUT",

	                headers: {

	                    "Content-Type":
	                    "text/plain"

	                },

	                body: texto

	            }

	        );





	        console.log(
	            "STATUS:",
	            respuesta.status
	        );



	        const resultado =
	            await respuesta.text();




	        console.log(
	            "RESPUESTA:",
	            resultado
	        );






	        if (!respuesta.ok) {



	            mostrarNotificacion(
	                "error",
	                "Error al guardar",
	                resultado
	            );



	            return;


	        }







	        mostrarNotificacion(
	            "success",
	            "Observación guardada",
	            "La observación fue registrada correctamente"
	        );





	        modalDetalleObservacion.style.display =
	            "none";



	        document.getElementById(
	            "detalleObservacion"
	        ).value = "";




	        await cargarCamiones();





	    } catch (e) {



	        console.error(e);



	        mostrarNotificacion(
	            "error",
	            "Error de conexión",
	            "No fue posible comunicarse con el servidor"
	        );


	    }



	};





	// ======================================================
	// CERRAR MODAL ACCION
	// ======================================================


	document
	.querySelector(".cerrarAccion")
	.addEventListener(
	"click",
	()=>{


	    modalAccionCamion.style.display="none";


	});







	// ======================================================
	// ABRIR MODAL EDITAR USANDO EL FORMULARIO NUEVO
	// ======================================================

	function abrirModalEditar(camion){


	    if(!camion)
	    return;



	    // Guardamos el objeto completo
	    camionEditando = camion;


	    // Guardamos el ID para el PUT
	    camionEditandoId = camion.id;


	    // Activamos modo edición
	    modoEdicion = true;



	    console.log(
	        "CAMION EDITANDO:",
	        camionEditando
	    );


	    console.log(
	        "ID EDITANDO:",
	        camionEditandoId
	    );



	    // Abrimos el mismo modal de crear

	    modalNuevo.style.display="flex";



	    // Cambiamos título si quieres

	    const titulo =
	    document.querySelector(
	        "#modalNuevoCamion .modal-header h2"
	    );


	    if(titulo){

	        titulo.innerHTML =
	        `
	        <i class="fa-solid fa-pen-to-square"></i>
	        Editar Camión
	        `;

	    }





	    // ===============================
	    // CARGAR DATOS
	    // ===============================


	    document.getElementById("placa").value =
	        camion.placa || "";



	    document.getElementById("marca").value =
	        camion.marca || "";



	    document.getElementById("modelo").value =
	        camion.modelo || "";



	    document.getElementById("anio").value =
	        camion.anio || "";



	    document.getElementById("color").value =
	        camion.color || "";



	    document.getElementById("tipo").value =
	        camion.tipo || "";



	    document.getElementById("capacidad").value =
	        camion.capacidadCarga || "";



	    document.getElementById("kilometraje").value =
	        camion.kilometrajeActual || "";



	    document.getElementById("motor").value =
	        camion.numeroMotor || "";



	    document.getElementById("chasis").value =
	        camion.numeroChasis || "";



	    document.getElementById("estado").value =
	        camion.estado || "";



	    document.getElementById("fechaCompra").value =
	        camion.fechaCompra || "";



	    document.getElementById("valorCompra").value =
	        camion.valorCompra || ""; 



	    document.getElementById("observaciones").value =
	        camion.observaciones || "";



	    // Imagen

	    if(previewFoto){


	        previewFoto.src =
	        camion.imgcamion
	        ?
	        camion.imgcamion
	        :
	        "/imgs/stock.jpg";


	    }



	}
	
	function mostrarNotificacion(tipo, titulo, mensaje){


	    const notificacion =
	        document.getElementById("notificacion");


	    const icono =
	        document.getElementById("iconoNotificacion");


	    const tituloEl =
	        document.getElementById("tituloNotificacion");


	    const mensajeEl =
	        document.getElementById("mensajeNotificacion");



	    if(!notificacion){

	        console.error(
	            "No existe el elemento #notificacion en HTML"
	        );

	        return;

	    }



	    notificacion.className =
	        "notificacion " + tipo;



	    if(icono){

	        if(tipo === "success"){

	            icono.className =
	            "fa-solid fa-circle-check";

	        }
	        else if(tipo === "error"){

	            icono.className =
	            "fa-solid fa-circle-xmark";

	        }
	        else{

	            icono.className =
	            "fa-solid fa-triangle-exclamation";

	        }

	    }



	    if(tituloEl)
	        tituloEl.textContent = titulo;



	    if(mensajeEl)
	        mensajeEl.textContent = mensaje;



	    setTimeout(()=>{

	        notificacion.classList.add("show");

	    },100);



	    setTimeout(()=>{

	        notificacion.classList.remove("show");

	    },3500);



	}
	
	function cargarFiltroMarcas(){

	    const select = document.getElementById("filtroMarca");

	    if(!select) return;


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
	// EXPORTAR CAMIONES A EXCEL PROFESIONAL
	// ======================================================

	function exportarExcelCamiones(){


	    if(!listaCamiones || listaCamiones.length === 0){

	        mostrarNotificacion(
	            "warning",
	            "Sin datos",
	            "No existen camiones para exportar"
	        );

	        return;

	    }



	    const fecha = new Date();



	    const datos = [

	        [
	            "CONTROL DE FLOTA VEHICULAR"
	        ],

	        [
	            "Reporte general de camiones registrados"
	        ],

	        [
	            "Fecha de generación:",
	            fecha.toLocaleDateString()
	        ],

	        [],


	        [
	            "Imagen",
	            "Placa",
	            "Marca",
	            "Modelo",
	            "Año",
	            "Tipo",
	            "Color",
	            "Capacidad",
	            "Kilometraje",
	            "Estado",
	            "Número Motor",
	            "Número Chasis",
	            "Fecha Compra",
	            "Valor Compra"
	        ]

	    ];





	    listaCamiones.forEach(c=>{


	        datos.push([

	            "Consultar sistema",

	            String(c.placa || ""),

	            String(c.marca || ""),

	            String(c.modelo || ""),

	            String(c.anio || ""),

	            String(c.tipo || ""),

	            String(c.color || ""),

	            String(c.capacidadCarga || ""),

	            Number(c.kilometrajeActual || 0),

	            String(c.estado || ""),

	            String(c.numeroMotor || ""),

	            String(c.numeroChasis || ""),

	            String(c.fechaCompra || ""),

	            Number(c.valorCompra || 0)

	        ]);


	    });






	    const hoja =
	        XLSX.utils.aoa_to_sheet(datos);






	    // ==========================================
	    // COMBINAR TITULOS
	    // ==========================================


	    hoja["!merges"]=[

	        {
	            s:{r:0,c:0},
	            e:{r:0,c:13}
	        },

	        {
	            s:{r:1,c:0},
	            e:{r:1,c:13}
	        }

	    ];







	    // ==========================================
	    // ANCHO COLUMNAS
	    // ==========================================


	    hoja["!cols"]=[

	        {wch:20},
	        {wch:14},
	        {wch:18},
	        {wch:18},
	        {wch:10},
	        {wch:16},
	        {wch:15},
	        {wch:16},
	        {wch:16},
	        {wch:18},
	        {wch:20},
	        {wch:22},
	        {wch:16},
	        {wch:18}

	    ];







	    // ==========================================
	    // ESTILOS
	    // ==========================================


	    const titulo = {


	        fill:{
	            fgColor:{
	                rgb:"0F172A"
	            }
	        },


	        font:{
	            bold:true,
	            color:{
	                rgb:"FFFFFF"
	            },
	            sz:18
	        },


	        alignment:{
	            horizontal:"center",
	            vertical:"center"
	        }

	    };





	    const subtitulo = {


	        fill:{
	            fgColor:{
	                rgb:"2563EB"
	            }
	        },


	        font:{
	            bold:true,
	            color:{
	                rgb:"FFFFFF"
	            }
	        },


	        alignment:{
	            horizontal:"center"
	        }


	    };





	    const encabezado = {


	        fill:{
	            fgColor:{
	                rgb:"1E40AF"
	            }
	        },


	        font:{
	            bold:true,
	            color:{
	                rgb:"FFFFFF"
	            }
	        },


	        alignment:{
	            horizontal:"center",
	            vertical:"center",
	            wrapText:true
	        }

	    };






	    const cuerpo = {


	        border:{


	            top:{
	                style:"thin",
	                color:{
	                    rgb:"D1D5DB"
	                }
	            },


	            bottom:{
	                style:"thin",
	                color:{
	                    rgb:"D1D5DB"
	                }
	            }


	        },


	        alignment:{
	            vertical:"center"
	        }

	    };









	    // TITULOS


	    hoja["A1"].s = titulo;

	    hoja["A2"].s = subtitulo;






	    // ENCABEZADOS FILA 5


	    for(let col=0; col<14; col++){


	        const celda =
	        XLSX.utils.encode_cell({

	            r:4,

	            c:col

	        });


	        hoja[celda].s =
	            encabezado;


	    }







	    // CUERPO


	    for(let fila=5; fila<datos.length; fila++){


	        for(let col=0; col<14; col++){


	            const celda =
	            XLSX.utils.encode_cell({

	                r:fila,

	                c:col

	            });



	            if(hoja[celda]){


	                hoja[celda].s =
	                    cuerpo;


	            }


	        }


	    }








	    // ==========================================
	    // FORMATOS CORRECTOS
	    // ==========================================


	    for(let fila=5; fila<datos.length; fila++){



	        // AÑO TEXTO
	        hoja["E"+(fila+1)].t = "s";



	        // CAPACIDAD TEXTO
	        hoja["H"+(fila+1)].t = "s";



	        // KILOMETRAJE
	        hoja["I"+(fila+1)].z =
	        '#,##0 "km"';



	        // VALOR COMPRA LPS
	        hoja["N"+(fila+1)].z =
	        '"LPS " #,##0.00';



	    }









	    // ==========================================
	    // FILTRO
	    // ==========================================


	    hoja["!autofilter"]={

	        ref:
	        "A5:N"+datos.length

	    };







	    // ==========================================
	    // CONGELAR ENCABEZADO
	    // ==========================================


	    hoja["!freeze"]={

	        xSplit:0,

	        ySplit:5

	    };







	    const libro =
	        XLSX.utils.book_new();




	    XLSX.utils.book_append_sheet(

	        libro,

	        hoja,

	        "Camiones"

	    );







	    XLSX.writeFile(

	        libro,

	        "Reporte_Camiones.xlsx"

	    );


	}
	
	// ======================================================
	// MOSTRAR OBSERVACIONES PARA ELIMINAR
	// ======================================================

	function mostrarObservacionesEliminar(texto){


	    listaObservacionesEliminar.innerHTML = "";



		const observaciones =
		    texto.split("\n\n\n")
		    .filter(o => o.trim() !== "");
			
			console.log("TEXTO RECIBIDO:", texto);
			console.log("OBSERVACIONES SEPARADAS:", observaciones);



	    observaciones.forEach((obs,index)=>{


	        const div =
	            document.createElement("div");


	        div.className =
	            "observacion-eliminar-card";



	        div.innerHTML = `

	            <div class="numero-observacion">

	                Observación ${index + 1}

	            </div>


	            <p>

	                ${obs}

	            </p>


	            <button
	                class="btn-eliminar-obs"
	                data-index="${index}">

	                <i class="fa-solid fa-trash"></i>
	                Eliminar

	            </button>

	        `;


	        listaObservacionesEliminar.appendChild(div);


	    });



	    modalEliminarObservacion.style.display="flex";


	}
	
	// ======================================================
	// ELIMINAR OBSERVACIÓN INDIVIDUAL
	// ======================================================

	document.addEventListener("click", function(e){


	    const boton =
	        e.target.closest(".btn-eliminar-obs");


	    if(!boton)
	        return;



	    const indice =
	        boton.dataset.index;



	    eliminarObservacion(indice);


	});
	
	async function eliminarObservacion(indice){


	    const camion =
	        listaCamiones.find(
	            c => c.id == camionSeleccionadoEliminar
	        );



	    if(!camion)
	        return;



		const observaciones =
		    camion.observaciones
		    .split("\n\n\n")
		    .map(o => o.trim())
		    .filter(o => o.length > 0);




	    observaciones.splice(indice,1);




		const nuevasObservaciones =
		    observaciones.length > 0
		    ?
		    observaciones.join("\n\n\n")
		    :
		    "";




	    try{


	        const respuesta =
	        await fetch(
	            "/camiones/observaciones/actualizar/"
	            +
	            camionSeleccionadoEliminar,
	            {

	                method:"PUT",

	                headers:{
	                    "Content-Type":"text/plain"
	                },

	                body:nuevasObservaciones

	            }
	        );




	        if(!respuesta.ok){

	            throw new Error(
	                "Error actualizando observaciones"
	            );

	        }




	        mostrarNotificacion(
	            "success",
	            "Observación eliminada",
	            "La observación fue eliminada correctamente"
	        );




	        modalEliminarObservacion.style.display="none";



	        await cargarCamiones();




	    }
	    catch(error){


	        mostrarNotificacion(
	            "error",
	            "Error",
	            "No se pudo eliminar la observación"
	        );


	    }


	}
	
	// ======================================================
	// EXPORTAR TABLA CAMIONES A PDF
	// ======================================================


	async function exportarTablaPDF(){


	    const tabla =
	        document.getElementById("tablaCamionesPDF");



	    if(!tabla){


	        mostrarNotificacion(
	            "error",
	            "Error",
	            "No se encontró la tabla para exportar"
	        );


	        return;


	    }





	    mostrarNotificacion(
	        "success",
	        "Generando PDF",
	        "Preparando reporte de camiones..."
	    );





	    // ==========================================
	    // OCULTAR COLUMNA ACCIONES
	    // ==========================================


	    const columnasAcciones =
	        tabla.querySelectorAll(
	            "th:last-child, td:last-child"
	        );



	    columnasAcciones.forEach(celda=>{

	        celda.style.display = "none";

	    });







	    // ==========================================
	    // CAPTURAR TABLA SIN ACCIONES
	    // ==========================================


	    const canvas =
	        await html2canvas(
	            tabla,
	            {

	                scale:2,

	                useCORS:true,

	                backgroundColor:"#ffffff"

	            }
	        );






	    const imagen =
	        canvas.toDataURL(
	            "image/png"
	        );






	    // ==========================================
	    // CREAR PDF
	    // ==========================================


	    const { jsPDF } =
	        window.jspdf;





	    const pdf =
	        new jsPDF(
	            "l",
	            "mm",
	            "a4"
	        );






	    const anchoPDF =
	        pdf.internal.pageSize.getWidth();





	    const altoImagen =
	        (canvas.height * anchoPDF)
	        /
	        canvas.width;







	    pdf.addImage(

	        imagen,

	        "PNG",

	        10,

	        10,

	        anchoPDF - 20,

	        altoImagen

	    );








	    // ==========================================
	    // RESTAURAR COLUMNA ACCIONES
	    // ==========================================


	    columnasAcciones.forEach(celda=>{

	        celda.style.display = "";

	    });








	    pdf.save(

	        "Reporte_Flota_Camiones.pdf"

	    );



	}