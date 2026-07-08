document.addEventListener("DOMContentLoaded", function() {


    const modalConductor = document.getElementById("modalConductor");

    const btnNuevo = document.getElementById("btnNuevoConductor");


    let conductorSeleccionado = null;



    /* =========================
       ABRIR MODAL NUEVO
    ========================== */


    if (btnNuevo) {


        btnNuevo.addEventListener("click", function() {


            limpiarFormulario();


            document.getElementById("tituloModalConductor").innerHTML =
                '<i class="fa-solid fa-user-plus"></i> Crear Conductor';



            document.getElementById("textoGuardar").innerText =
                "Guardar Conductor";



            document.getElementById("formConductor").action =
                "/conductores/guardar";



            let modal =
                new bootstrap.Modal(modalConductor);


            modal.show();

            document.querySelector("#tituloModalConductor span").innerText =
                "Editar Conductor";






        });


    }








    /* =========================
       LIMPIAR FORMULARIO
    ========================== */


    function limpiarFormulario() {


        document.getElementById("formConductor").reset();



        document.getElementById("idConductor").value = "";



        document.getElementById("previewFoto").src =
            "/imgs/perfil.png";


    }










    /* =========================
       PREVIEW FOTO
    ========================== */


    const inputFoto =
        document.querySelector('input[name="imagen"]');



    if (inputFoto) {


        inputFoto.addEventListener("change", function(e) {


            const archivo =
                e.target.files[0];



            if (archivo) {


                const lector =
                    new FileReader();



                lector.onload = function(event) {


                    document.getElementById("previewFoto").src =
                        event.target.result;


                }



                lector.readAsDataURL(archivo);



            }



        });



    }











    /* =========================
       VER CONDUCTOR COMPLETO
    ========================== */


    document.querySelectorAll(".btnVer")
        .forEach(btn => {


            btn.addEventListener("click", function() {



                document.getElementById("nombreDetalle").innerText =
                    this.dataset.nombre + " " + this.dataset.apellido;



                document.getElementById("identidadDetalle").innerText =
                    this.dataset.identidad || "No registrado";


                document.getElementById("telefonoDetalle").innerText =
                    this.dataset.telefono || "No registrado";


                document.getElementById("correoDetalle").innerText =
                    this.dataset.correo || "No registrado";


                document.getElementById("direccionDetalle").innerText =
                    this.dataset.direccion || "No registrada";


                document.getElementById("licenciaDetalle").innerText =
                    this.dataset.licencia || "No registrada";


                document.getElementById("tipoLicenciaDetalle").innerText =
                    this.dataset.tipo || "No registrado";


                document.getElementById("fechaNacimientoDetalle").innerText =
                    this.dataset.nacimiento || "No registrada";


                document.getElementById("vencimientoDetalle").innerText =
                    this.dataset.vencimiento || "No registrado";


                document.getElementById("fechaIngresoDetalle").innerText =
                    this.dataset.ingreso || "No registrada";


                document.getElementById("estadoDetalle").innerText =
                    this.dataset.estado || "No registrado";


                document.getElementById("observacionesDetalle").innerText =
                    this.dataset.observaciones || "Sin observaciones";



                document.getElementById("fotoDetalle").src =
                    this.dataset.foto &&
                        this.dataset.foto != "null"
                        ?
                        this.dataset.foto
                        :
                        "/imgs/perfil.png";





                new bootstrap.Modal(
                    document.getElementById("modalVer")
                ).show();



            });



        });











    /* =========================
       ABRIR OPCIONES EDITAR
    ========================== */


    document.querySelectorAll(".btnEditar")
        .forEach(btn => {


            btn.addEventListener("click", function(e) {


                e.preventDefault();



                conductorSeleccionado = {

                    id: this.dataset.id,

                    nombre: this.dataset.nombre,

                    apellido: this.dataset.apellido,

                    identidad: this.dataset.identidad,

                    telefono: this.dataset.telefono,

                    correo: this.dataset.correo,

                    direccion: this.dataset.direccion,

                    licencia: this.dataset.licencia,

                    tipo: this.dataset.tipo,

                    nacimiento: this.dataset.nacimiento,

                    vencimiento: this.dataset.vencimiento,

                    ingreso: this.dataset.ingreso,

                    estado: this.dataset.estado,

                    observaciones: this.dataset.observaciones

                };




                new bootstrap.Modal(
                    document.getElementById("modalOpcionesEditar")
                ).show();



            });



        });





    /* =========================
       GUARDAR OBSERVACION
    ========================== */


    const guardarObservacion =
        document.getElementById("guardarObservacion");



    if (guardarObservacion) {


        guardarObservacion.addEventListener("click", function() {



            let texto =
                document.getElementById("nuevaObservacion").value;



            if (texto.trim() === "") {

                alert("Escriba una observación");

                return;

            }




            fetch(
                "/conductores/"
                + conductorSeleccionado.id
                + "/observacion",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body:
                        "observacion="
                        + encodeURIComponent(texto)

                }

            )

                .then(res => res.text())

                .then(data => {


                    if (data === "ok") {


                        alert(
                            "Observación guardada correctamente"
                        );


                        location.reload();


                    }


                });



        });


    }





    /* =========================
       EDITAR INFORMACION
    ========================== */


    const btnEditarInfo =
        document.getElementById("btnEditarInfo");



    if (btnEditarInfo) {


        btnEditarInfo.addEventListener("click", function() {



            bootstrap.Modal
                .getInstance(
                    document.getElementById("modalOpcionesEditar")
                )
                .hide();





            document.getElementById("tituloModalConductor").innerHTML =
                '<i class="fa-solid fa-user-pen"></i> Editar Conductor';





            document.getElementById("textoGuardar").innerText =
                "Actualizar Conductor";





            document.getElementById("formConductor").action =
                "/conductores/actualizar/"
                +
                conductorSeleccionado.id;






            document.getElementById("idConductor").value =
                conductorSeleccionado.id;





            document.querySelector('[name="nombre"]').value =
                conductorSeleccionado.nombre || "";



            document.querySelector('[name="apellido"]').value =
                conductorSeleccionado.apellido || "";



            document.querySelector('[name="identidad"]').value =
                conductorSeleccionado.identidad || "";



            document.querySelector('[name="telefono"]').value =
                conductorSeleccionado.telefono || "";



            document.querySelector('[name="correo"]').value =
                conductorSeleccionado.correo || "";



            document.querySelector('[name="direccion"]').value =
                conductorSeleccionado.direccion || "";



            document.querySelector('[name="licencia"]').value =
                conductorSeleccionado.licencia || "";



            document.querySelector('[name="tipoLicencia"]').value =
                conductorSeleccionado.tipo || "";



            document.querySelector('[name="estado"]').value =
                conductorSeleccionado.estado || "ACTIVO";






            document.querySelector('[name="fechaNacimiento"]').value =
                conductorSeleccionado.nacimiento || "";



            document.querySelector('[name="fechaVencimientoLicencia"]').value =
                conductorSeleccionado.vencimiento || "";



            document.querySelector('[name="fechaIngreso"]').value =
                conductorSeleccionado.ingreso || "";





            document.querySelector('[name="observaciones"]').value =
                conductorSeleccionado.observaciones || "";






            new bootstrap.Modal(
                modalConductor
            ).show();



        });


    }









    /* =========================
       AGREGAR OBSERVACION
    ========================== */


    const btnAgregarObservacion =
        document.getElementById("btnAgregarObservacion");



    if (btnAgregarObservacion) {


        btnAgregarObservacion.addEventListener("click", function() {



            bootstrap.Modal
                .getInstance(
                    document.getElementById("modalOpcionesEditar")
                )
                .hide();




            document.getElementById("nuevaObservacion").value = "";



            new bootstrap.Modal(
                document.getElementById("modalObservacion")
            ).show();



        });



    }




});

/* ============================
   GENERAR PDF UNA HOJA
============================= */


const btnImprimir =
    document.getElementById("btnImprimirConductor");


if (btnImprimir) {


    btnImprimir.addEventListener("click", async function() {


        const { jsPDF } = window.jspdf;


        let pdf = new jsPDF("p", "mm", "a4");



        /* COLORES */

        let azul = [31, 41, 55];





        /* ======================
           ENCABEZADO
        ====================== */


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



        pdf.setFontSize(20);


        pdf.text(
            "FICHA DEL CONDUCTOR",
            105,
            26,
            {
                align: "center"
            }
        );







        /* ======================
           CARGAR FOTO CORRECTO
        ====================== */


        async function cargarImagen(url) {


            return new Promise((resolve) => {


                let img = new Image();


                img.crossOrigin = "Anonymous";


                img.onload = function() {


                    let canvas = document.createElement("canvas");


                    canvas.width = this.width;

                    canvas.height = this.height;



                    let ctx = canvas.getContext("2d");


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
            document.getElementById(
                "fotoDetalle"
            ).src;




        let imagenBase64 =
            await cargarImagen(foto);




        if (imagenBase64) {


            pdf.addImage(

                imagenBase64,

                "JPEG",

                82,

                42,

                45,

                45

            );


        }








        /* ======================
         NOMBRE
        ====================== */


        pdf.setTextColor(
            20,
            20,
            20
        );



        pdf.setFontSize(18);


        pdf.text(

            document.getElementById(
                "nombreDetalle"
            ).innerText,

            105,

            98,

            {
                align: "center"
            }

        );









        /* ======================
         TITULO SECCION
        ====================== */


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



            pdf.setFontSize(11);



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


            pdf.setFontSize(8);



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



            pdf.setFontSize(10);



            pdf.text(
                valor || "No registrado",
                x,
                y + 5
            );



        }








        /* ======================
         DATOS
        ====================== */


        titulo(
            "DATOS PERSONALES",
            110
        );



        dato(
            "Identidad",
            document.getElementById(
                "identidadDetalle"
            ).innerText,
            20,
            130
        );



        dato(
            "Telefono",
            document.getElementById(
                "telefonoDetalle"
            ).innerText,
            110,
            130
        );



        dato(
            "Correo",
            document.getElementById(
                "correoDetalle"
            ).innerText,
            20,
            150
        );



        dato(
            "Direccion",
            document.getElementById(
                "direccionDetalle"
            ).innerText,
            110,
            150
        );







        titulo(
            "DATOS DE LICENCIA",
            170
        );




        dato(
            "Licencia",
            document.getElementById(
                "licenciaDetalle"
            ).innerText,
            20,
            190
        );



        dato(
            "Tipo licencia",
            document.getElementById(
                "tipoLicenciaDetalle"
            ).innerText,
            110,
            190
        );



        dato(
            "Fecha nacimiento",
            document.getElementById(
                "fechaNacimientoDetalle"
            ).innerText,
            20,
            210
        );



        dato(
            "Vencimiento",
            document.getElementById(
                "vencimientoDetalle"
            ).innerText,
            110,
            210
        );



        dato(
            "Fecha ingreso",
            document.getElementById(
                "fechaIngresoDetalle"
            ).innerText,
            20,
            230
        );



        dato(
            "Estado",
            document.getElementById(
                "estadoDetalle"
            ).innerText,
            110,
            230
        );







        /* ======================
           OBSERVACIONES
        ====================== */


        let observaciones =
            document.getElementById("observacionesDetalle").innerText ||
            "Sin observaciones";


        /*
           SIEMPRE SEGUNDA PAGINA
        */
        pdf.addPage();



        function encabezadoObservaciones() {


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


            pdf.setFontSize(20);


            pdf.text(
                "OBSERVACIONES DEL CONDUCTOR",
                105,
                26,
                {
                    align: "center"
                }
            );


        }



        encabezadoObservaciones();



        let y = 50;



        let listaObservaciones =
            observaciones.split(
                "------------------------------------------------------------------------------------------------"
            );



        listaObservaciones.forEach(obs => {


            obs = obs.trim();



            if (obs === "") {
                return;
            }




            let lineas =
                obs.split("\n");



            let fecha = "";
            let hora = "";
            let detalle = [];




            lineas.forEach(l => {


                if (l.startsWith("Fecha:")) {


                    let partes =
                        l.split(
                            "Hora de Registro de Observación:"
                        );


                    fecha =
                        partes[0]
                            .replace("Fecha:", "")
                            .trim();



                    hora =
                        partes.length > 1
                            ?
                            partes[1].trim()
                            :
                            "";

                }


                else if (
                    l.startsWith("Detalle")
                ) {

                }


                else if (
                    l.trim() != ""
                ) {

                    detalle.push(l);

                }


            });




            let textoDetalle =
                pdf.splitTextToSize(
                    detalle.join("\n"),
                    165
                );




            /*
               ALTURA DINAMICA DEL CUADRO
            */


            let altura =
                35 +
                (textoDetalle.length * 5);





            /*
               SI NO CABE CREA PAGINA
            */


            if (y + altura > 275) {


                pdf.addPage();


                encabezadoObservaciones();


                y = 50;


            }






            /*
               DIBUJAR CUADRO
            */


            pdf.setDrawColor(210);


            pdf.roundedRect(

                15,

                y,

                180,

                altura,

                3,

                3

            );



            let posicionY =
                y + 10;





            /*
               FECHA
            */


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(10);


            pdf.setTextColor(
                30,
                30,
                30
            );



            pdf.text(
                "Fecha:",
                20,
                posicionY
            );



            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.text(
                fecha,
                38,
                posicionY
            );






            /*
               HORA
            */


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.text(
                "Hora:",
                100,
                posicionY
            );



            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.text(
                hora,
                118,
                posicionY
            );





            posicionY += 10;




            /*
               DETALLE
            */


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.text(
                "Detalle de la Observación:",
                20,
                posicionY
            );



            posicionY += 7;



            pdf.setFont(
                "helvetica",
                "normal"
            );



            pdf.text(
                textoDetalle,
                20,
                posicionY
            );




            /*
               SEPARACION ENTRE CUADROS
            */


            y += altura + 10;



        });




        /*
           PIE ULTIMA PAGINA
        */


        pdf.setPage(
            pdf.getNumberOfPages()
        );



        pdf.setFontSize(8);


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





        console.log("GENERANDO PDF");

        pdf.save(

            "Ficha_Conductor_" +

            document.getElementById(
                "nombreDetalle"
            ).innerText

            + ".pdf"

        );



    });


}

document.getElementById("guardarObservacion")
    .addEventListener("click", async function() {


        let texto =
            document.getElementById("nuevaObservacion").value;


        if (!texto.trim()) {

            alert("Escriba una observación");

            return;
        }



        let respuesta = await fetch(

            "/conductores/" +
            conductorSeleccionado.id +
            "/observacion",

            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    "observacion=" +
                    encodeURIComponent(texto)

            }

        );



        if (respuesta.ok) {

            location.reload();

        }

    });


let idEliminar = null;
let observacionesEliminar = "";
let accionConfirmada = null;



/* ABRIR MODAL PRINCIPAL */

document.querySelectorAll(".btnEliminar")
    .forEach(btn => {


        btn.addEventListener("click", function() {


            idEliminar = this.dataset.id;


            observacionesEliminar =
                this.dataset.observaciones || "";



            document.getElementById(
                "modalEliminar"
            ).style.display = "flex";



            document.getElementById(
                "opcionesEliminar"
            ).style.display = "block";


            document.getElementById(
                "listaObservacionesEliminar"
            ).style.display = "none";


        });


    });






/* ELIMINAR CONDUCTOR */


document.getElementById(
    "btnEliminarConductor"
)
    .onclick = function() {



        abrirConfirmacion(

            `
	¿Está seguro que desea eliminar este conductor?

	<br><br>

	Se eliminará:

	<br>
	✔ Datos del conductor
	<br>
	✔ Imagen de Cloudinary

	<br><br>

	<b>Esta acción no se puede deshacer.</b>
	`,

            function() {


				console.log("Eliminando ID:", idEliminar);


				fetch(
				"/conductores/eliminar/" + idEliminar,
				{
				    method:"DELETE"
				}
				)
				.then(res=>{

				console.log("Respuesta servidor:",res.status);


				if(res.ok){

				location.reload();

				}else{

				alert("Error servidor");

				}


				})
                    .then(res => {

                        if (res.ok) {

                            location.reload();

                        }

                        else {

                            alert("Error eliminando");

                        }


                    });


            }


        );


    };









/* ELIMINAR OBSERVACION */


document.getElementById(
    "btnEliminarObservacion"
)
    .onclick = function() {


        let contenedor =
            document.getElementById(
                "listaObservacionesEliminar"
            );



        contenedor.innerHTML = "";



        let lista =
            observacionesEliminar.split(
                "------------------------------------------------------------------------------------------------"
            );



        lista.forEach((obs, index) => {


            if (obs.trim() != "") {


                let boton =
                    document.createElement("button");


                boton.className =
                    "observacion-opcion";


					let textoObs = obs.trim();


					let lineas = textoObs.split("\n");


					let fecha = "";
					let hora = "";
					let detalle = [];



					lineas.forEach(l=>{


					    if(l.startsWith("Fecha:")){


					        let partes =
					            l.split(
					            "Hora de Registro de Observación:"
					            );


					        fecha =
					            partes[0]
					            .replace("Fecha:","")
					            .trim();


					        hora =
					            partes.length > 1
					            ? partes[1].trim()
					            : "";

					    }



					    else if(
					        l.startsWith("Detalle de la Observación")
					    ){

					        // ignorar titulo

					    }



					    else if(
					        l.trim() !== ""
					    ){

					        detalle.push(l);

					    }


					});



					boton.innerHTML = `

					<b>Observación ${index + 1}</b>

					<br><br>

					<b>Fecha:</b> ${fecha}

					<br>

					<b>Hora:</b> ${hora}

					<br><br>

					<b>Detalle:</b>

					<br>

					${detalle.join("<br>")}

					`;


                boton.onclick = function() {



                    abrirConfirmacion(

                        `
	¿Está seguro que desea eliminar esta observación?

	<br><br>

	<b>No podrá recuperarse después.</b>
	`,

                        function() {



                            fetch(

                                "/conductores/"
                                +
                                idEliminar
                                +
                                "/eliminar-observacion/"
                                +
                                index,

                                {

                                    method: "DELETE"

                                }

                            )

                                .then(res => {

                                    if (res.ok) {

                                        location.reload();

                                    }

                                });


                        }



                    );



                };



                contenedor.appendChild(boton);



            }


        });




        document.getElementById(
            "opcionesEliminar"
        )
            .style.display = "none";


        contenedor.style.display = "block";



    };









/* CERRAR MODAL */


document.getElementById(
    "btnCancelarEliminar"
)
    .onclick = function() {


        document.getElementById(
            "modalEliminar"
        )
            .style.display = "none";


    };









/* MODAL CONFIRMACION */


function abrirConfirmacion(
    mensaje,
    funcion
) {


    document.getElementById(
        "textoConfirmacion"
    )
        .innerHTML = mensaje;



    accionConfirmada = funcion;



    document.getElementById(
        "modalConfirmacion"
    )
        .style.display = "flex";




    document.getElementById(
        "btnConfirmarAccion"
    )
        .onclick = function() {



            if (accionConfirmada) {

                accionConfirmada();

            }


            document.getElementById(
                "modalConfirmacion"
            )
                .style.display = "none";


        };





    document.getElementById(
        "btnCancelarConfirmacion"
    )
        .onclick = function() {


            document.getElementById(
                "modalConfirmacion"
            )
                .style.display = "none";


            accionConfirmada = null;


        };



}


/* =========================
   BUSCADOR CONDUCTORES
========================= */


const buscador =
document.getElementById(
    "buscarConductor"
);



if(buscador){


    buscador.addEventListener(
        "keyup",
        function(){


            let texto =
            this.value
            .toLowerCase();



            let filas =
            document.querySelectorAll(
                ".tabla-conductores tbody tr"
            );



            filas.forEach(fila=>{


                let contenido =
                fila.innerText
                .toLowerCase();



                if(
                    contenido.includes(texto)
                ){

                    fila.style.display="";

                }

                else{

                    fila.style.display="none";

                }


            });


        }
    );


}