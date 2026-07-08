// ======================================================
// VARIABLES GLOBALES
// ======================================================

let listaCamiones = [];

let paginaActual = 1;

const registrosPorPagina = 10;

let camionActualFicha = null;

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


// ======================================================
// ABRIR MODAL NUEVO
// ======================================================

if (btnNuevoCamion) {

    btnNuevoCamion.addEventListener("click", () => {

        modalNuevo.style.display = "flex";

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



                <button class="btn-action">

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
// GUARDAR CAMIÓN
// ======================================================


if (formCamion) {


    formCamion.addEventListener(
        "submit",
        async (e) => {


            e.preventDefault();



            const datos =
                new FormData();




            if (inputFoto &&
                inputFoto.files.length > 0) {


                datos.append(
                    "foto",
                    inputFoto.files[0]
                );


            }





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
                "estado",
                document.getElementById("estado").value
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





            try {


                btnGuardar.disabled = true;



                btnGuardar.innerHTML =
                    `
<i class="fa-solid fa-spinner fa-spin"></i>
Guardando...
`;





                const respuesta =
                    await fetch(
                        "/camiones/guardar",
                        {

                            method: "POST",

                            body: datos

                        }

                    );





                if (!respuesta.ok) {


                    alert(
                        "Error al guardar camión"
                    );


                    return;


                }





                formCamion.reset();



                previewFoto.src =
                    "/imgs/stock.jpg";



                modalNuevo.style.display = "none";



                await cargarCamiones();



                alert(
                    "Camión guardado correctamente"
                );



            }
            catch (error) {


                console.error(error);


                alert(
                    "Error de conexión"
                );


            }
            finally {


                btnGuardar.disabled = false;



                btnGuardar.innerHTML =
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


    codigoEliminar =
        Math.floor(100000 + Math.random() * 900000);



    codigoGenerado.textContent =
        codigoEliminar;



    codigoConfirmacion.value = "";


    btnConfirmarEliminar.disabled = true;



    modalEliminar.style.display = "flex";


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


            alert(data);


            modalEliminar.style.display = "none";


            cargarCamiones();


        })


        .catch(error => {


            console.error(error);


            alert("Error eliminando camión");


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


	    camionActualFicha =
	        listaCamiones.find(c => c.id == id);



	    const camion = camionActualFicha;



	    if (!camion)
	        return;



	    const imagenCamion =
	        camion.imgcamion &&
	        camion.imgcamion.trim() !== ""
	        ?
	        camion.imgcamion
	        :
	        "/imgs/stock.jpg";



	    const fotoDetalle =
	        document.getElementById(
	            "fotoCamionDetalle"
	        );


	    if (fotoDetalle) {

	        fotoDetalle.src = imagenCamion;

	        fotoDetalle.onerror = function(){

	            this.src="/imgs/stock.jpg";

	        };

	    }



	    document.getElementById("vehiculoDetalle").textContent =
	        `${camion.marca || ""} ${camion.modelo || ""}`;



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
	        camion.kilometrajeActual || 0;



	    document.getElementById("capacidadDetalle").textContent =
	        camion.capacidadCarga || "";



	    document.getElementById("motorDetalle").textContent =
	        camion.numeroMotor || "";



	    document.getElementById("chasisDetalle").textContent =
	        camion.numeroChasis || "";



	    // ===============================
	    // OBSERVACIONES
	    // ===============================


	    let textoObservaciones = "";


	    if(camion.observaciones){

	        textoObservaciones =
	            camion.observaciones;

	    }
	    else{

	        textoObservaciones =
	            "Sin observaciones";

	    }



	    document.getElementById(
	        "observacionesDetalle"
	    ).textContent = textoObservaciones;



	    console.log(
	        "OBSERVACIONES RECIBIDAS:",
	        textoObservaciones
	    );



	    modalVerCamion.style.display="flex";


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
// GENERAR PDF FICHA CAMIÓN
// ======================================================


const btnImprimirCamion =
    document.getElementById("btnImprimirCamion");



if (btnImprimirCamion) {


    btnImprimirCamion.addEventListener("click", async function() {



        const { jsPDF } = window.jspdf;



        let pdf = new jsPDF(
            "p",
            "mm",
            "a4"
        );



        let azul = [
            31,
            41,
            55
        ];




        // ======================================================
        // ENCABEZADO
        // ======================================================


        function encabezado(texto) {


            pdf.setFillColor(...azul);


            pdf.roundedRect(
                10,
                10,
                190,
                25,
                4,
                4,
                "F"
            );



            pdf.setTextColor(
                255,
                255,
                255
            );



            pdf.setFontSize(
                20
            );



            pdf.text(
                texto,
                105,
                26,
                {
                    align: "center"
                }
            );


        }



        // ======================================================
        // PRIMERA HOJA
        // ======================================================


        encabezado(
            "FICHA DEL CAMIÓN"
        );




        // ======================================================
        // CARGAR IMAGEN
        // ======================================================


        async function cargarImagen(url) {


            return new Promise(resolve => {


                let img =
                    new Image();



                img.crossOrigin =
                    "Anonymous";



                img.onload = function() {


                    let canvas =
                        document.createElement(
                            "canvas"
                        );



                    canvas.width =
                        this.width;


                    canvas.height =
                        this.height;



                    let ctx =
                        canvas.getContext(
                            "2d"
                        );



                    ctx.drawImage(
                        this,
                        0,
                        0
                    );



                    resolve(
                        canvas.toDataURL(
                            "image/jpeg"
                        )
                    );


                }



                img.onerror = function() {

                    resolve(null);

                }



                img.src = url;


            });


        }





        let foto =
            camionActualFicha &&
                camionActualFicha.imgcamion &&
                camionActualFicha.imgcamion.trim() !== ""
                ?
                camionActualFicha.imgcamion
                :
                "/imgs/stock.jpg";



        let imagen =
            await cargarImagen(
                foto
            );



        if (imagen) {


            pdf.addImage(

                imagen,

                "JPEG",

                82,

                42,

                45,

                45

            );


        }




        // ======================================================
        // NOMBRE VEHICULO
        // ======================================================


        pdf.setTextColor(
            20,
            20,
            20
        );



        pdf.setFontSize(
            18
        );



        pdf.text(

            document.getElementById(
                "vehiculoDetalle"
            ).innerText,

            105,

            98,

            {
                align: "center"
            }

        );





        // ======================================================
        // FUNCIONES
        // ======================================================


        function titulo(texto, y) {


            pdf.setFillColor(
                241,
                245,
                249
            );



            pdf.roundedRect(
                15,
                y,
                180,
                8,
                2,
                2,
                "F"
            );



            pdf.setTextColor(
                31,
                41,
                55
            );



            pdf.setFontSize(
                11
            );



            pdf.text(
                texto,
                20,
                y + 6
            );


        }





        function dato(
            label,
            valor,
            x,
            y
        ) {


            pdf.setTextColor(
                100,
                116,
                139
            );



            pdf.setFontSize(
                8
            );



            pdf.text(
                label,
                x,
                y
            );



            pdf.setTextColor(
                20,
                20,
                20
            );



            pdf.setFontSize(
                10
            );



            pdf.text(
                valor || "No registrado",
                x,
                y + 5
            );


        }





        // ======================================================
        // DATOS CAMIÓN
        // ======================================================


        titulo(
            "DATOS DEL VEHÍCULO",
            115
        );



        dato(
            "Placa",
            document.getElementById(
                "placaDetalle"
            ).innerText,
            20,
            135
        );



        dato(
            "Marca",
            document.getElementById(
                "marcaDetalle"
            ).innerText,
            110,
            135
        );



        dato(
            "Modelo",
            document.getElementById(
                "modeloDetalle"
            ).innerText,
            20,
            155
        );



        dato(
            "Año",
            document.getElementById(
                "anioDetalle"
            ).innerText,
            110,
            155
        );



        dato(
            "Tipo",
            document.getElementById(
                "tipoDetalle"
            ).innerText,
            20,
            175
        );



        dato(
            "Estado",
            document.getElementById(
                "estadoDetalle"
            ).innerText,
            110,
            175
        );



        dato(
            "Kilometraje",
            document.getElementById(
                "kmDetalle"
            ).innerText,
            20,
            195
        );



        dato(
            "Capacidad",
            document.getElementById(
                "capacidadDetalle"
            ).innerText,
            110,
            195
        );



        dato(
            "Número Motor",
            document.getElementById(
                "motorDetalle"
            ).innerText,
            20,
            215
        );



        dato(
            "Número Chasis",
            document.getElementById(
                "chasisDetalle"
            ).innerText,
            110,
            215
        );


        // ======================================================
        // OBSERVACIONES PARA PDF
        // ======================================================


		let observaciones =
		    camionActualFicha &&
		    camionActualFicha.observaciones
		    ?
		    camionActualFicha.observaciones.trim()
		    :
		    "Sin observaciones";

       


        if (!observaciones) {

            observaciones =
                "Sin observaciones";

        }




        // SIEMPRE SEGUNDA HOJA


        pdf.addPage();



        encabezado(
            "OBSERVACIONES DEL CAMIÓN"
        );



        let y = 50;



        let listaObservaciones;



        if (
            observaciones.includes(
                "------------------------------------------------------------------------------------------------"
            )
        ) {

            listaObservaciones =
                observaciones.split(
                    "------------------------------------------------------------------------------------------------"
                );


        }
        else {


            listaObservaciones =
                [
                    observaciones
                ];

        }





        listaObservaciones.forEach(obs => {


            obs =
                obs.trim();



            if (obs === "")
                return;




            let lineas =
                obs.split("\n");



            let fecha =
                new Date().toLocaleDateString();



            let hora =
                new Date().toLocaleTimeString();



            let detalle = [];




            lineas.forEach(l => {


                if (
                    l.startsWith("Fecha:")
                ) {


                    fecha =
                        l.replace(
                            "Fecha:",
                            ""
                        )
                            .trim();


                }


                else if (
                    l.includes(
                        "Hora de Registro de Observación:"
                    )
                ) {


                    hora =
                        l.replace(
                            "Hora de Registro de Observación:",
                            ""
                        )
                            .trim();


                }


                else if (
                    l.startsWith(
                        "Detalle"
                    )
                ) {



                }


                else if (
                    l.trim() != ""
                ) {


                    detalle.push(l);


                }


            });





            let contenidoObservacion;


            if (detalle.length > 0) {

                contenidoObservacion =
                    detalle.join("\n");

            }
            else {

                contenidoObservacion =
                    obs;

            }

            console.log(
                "2 - CONTENIDO QUE VA AL PDF:",
                contenidoObservacion
            );

            let textoDetalle =
                pdf.splitTextToSize(
                    contenidoObservacion,
                    165
                );



            console.log(
                "3 - TEXTO DIVIDIDO PDF:",
                textoDetalle
            );

            let altura =
                35 +
                (
                    textoDetalle.length * 5
                );






            if (
                y + altura > 275
            ) {


                pdf.addPage();


                encabezado(
                    "OBSERVACIONES DEL CAMIÓN"
                );


                y = 50;


            }





            pdf.setDrawColor(
                210
            );



            pdf.roundedRect(
                15,
                y,
                180,
                altura,
                3,
                3
            );



            let pos =
                y + 10;





            pdf.setFont(
                "helvetica",
                "bold"
            );



            pdf.setFontSize(
                10
            );



            pdf.text(
                "Fecha:",
                20,
                pos
            );



            pdf.setFont(
                "helvetica",
                "normal"
            );



            pdf.text(
                fecha,
                38,
                pos
            );





            pdf.setFont(
                "helvetica",
                "bold"
            );



            pdf.text(
                "Hora:",
                100,
                pos
            );



            pdf.setFont(
                "helvetica",
                "normal"
            );



            pdf.text(
                hora,
                118,
                pos
            );





            pos += 10;




            pdf.setFont(
                "helvetica",
                "bold"
            );



            pdf.text(
                "Detalle de la Observación:",
                20,
                pos
            );



            pos += 7;



            pdf.setFont(
                "helvetica",
                "normal"
            );



            pdf.text(
                textoDetalle,
                20,
                pos
            );



            y += altura + 10;



        });





        // ======================================================
        // PIE
        // ======================================================


        pdf.setPage(
            pdf.getNumberOfPages()
        );



        pdf.setFontSize(
            8
        );



        pdf.setTextColor(
            120,
            120,
            120
        );



        pdf.text(
            "Sistema de Gestión de Camiones",
            105,
            290,
            {
                align: "center"
            }
        );





        pdf.save(

            "Ficha_Camion_" +

            document.getElementById(
                "vehiculoDetalle"
            ).innerText

            +

            ".pdf"

        );



    });


}