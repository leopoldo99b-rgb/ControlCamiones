/*==================================================
                VARIABLES GLOBALES
==================================================*/


let asignaciones = [];

let conductores = [];

let camionesDisponibles = [];

let conductoresDisponibles = [];


let paginaActual = 1;

const registrosPorPagina = 10;



/*==================================================
                INICIO
==================================================*/


document.addEventListener("DOMContentLoaded", () => {


    iniciarEventos();


    establecerFechaActual();


    cargarDatosIniciales();


});





/*==================================================
                EVENTOS
==================================================*/


function iniciarEventos() {


    const btnNueva =
        document.getElementById("btnNuevaAsignacion");


    if (btnNueva) {

        btnNueva.addEventListener("click", () => {

            abrirModal("modalAsignacion");

        });

    }



    document
        .querySelectorAll(".close-modal")
        .forEach(btn => {


            btn.addEventListener("click", () => {


                cerrarModales();


            });


        });



    const btnCancelar =
        document.querySelector(".btn-secondary");


    if (btnCancelar) {


        btnCancelar.addEventListener("click", () => {


            cerrarModales();


        });


    }



    const buscador =
        document.getElementById("buscarAsignacion");



    if (buscador) {


        buscador.addEventListener("input", () => {


            buscarAsignacion(
                buscador.value
            );


        });


    }



    const selectConductor =
        document.getElementById("selectConductores");



    if (selectConductor) {


        selectConductor.addEventListener(
            "change",
            mostrarConductorSeleccionado
        );


    }



    const selectCamion =
        document.getElementById("selectCamiones");



    if (selectCamion) {


        selectCamion.addEventListener(
            "change",
            mostrarCamionSeleccionado
        );


    }



    const guardar =
        document.getElementById("btnGuardarAsignacion");



    if (guardar) {


        guardar.addEventListener(
            "click",
            guardarAsignacion
        );


    }



    window.addEventListener(
        "click",
        (e) => {


            if (
                e.target.classList.contains("modal")
            ) {

                cerrarModales();

            }


        }
    );

}





/*==================================================
            CARGA INICIAL
==================================================*/


async function cargarDatosIniciales() {


    try {


        await cargarConductores();


        await cargarCamionesDisponibles();


        await cargarAsignaciones();

		
		filtrarConductoresDisponibles();


        cargarSelects();


        renderizarTabla();


        actualizarTarjetas();



    } catch(error){


        console.error(
            "Error cargando datos:",
            error
        );


        mostrarNotificacion(
            "error",
            "Error",
            "No se pudieron cargar los datos del sistema"
        );


    }


}





/*==================================================
        CARGAR CONDUCTORES REALES
==================================================*/


async function cargarConductores(){


    const respuesta =
    await fetch("/conductores/activos");


    conductores =
    await respuesta.json();


}






/*==================================================
        CARGAR CAMIONES DISPONIBLES
==================================================*/


async function cargarCamionesDisponibles(){


    const respuesta =
    await fetch("/camiones/disponibles");


    camionesDisponibles =
    await respuesta.json();


}






/*==================================================
        CARGAR ASIGNACIONES
==================================================*/


async function cargarAsignaciones(){


    const respuesta =
    await fetch("/asignaciones/lista");


    asignaciones =
    await respuesta.json();


}



function filtrarConductoresDisponibles(){


    const conductoresAsignados =
        asignaciones
        .filter(a => a.estado === "ACTIVA")
        .map(a => a.conductor.id);



    conductoresDisponibles =
        conductores.filter(c => 
            c.estado === "ACTIVO" &&
            !conductoresAsignados.includes(c.id)
        );


}



/*==================================================
                SELECTS
==================================================*/


function cargarSelects() {


    const selectConductores =
        document.getElementById(
            "selectConductores"
        );



    const selectCamiones =
        document.getElementById(
            "selectCamiones"
        );



    if (selectConductores) {


        selectConductores.innerHTML =
            `
        <option value="">
        Seleccione conductor
        </option>
        `;



        conductoresDisponibles.forEach(c => {


            selectConductores.innerHTML +=
                `
            <option value="${c.id}">
            
            ${c.nombre}
            - Licencia ${c.licencia}

            </option>
            `;


        });


    }




    if (selectCamiones) {


        selectCamiones.innerHTML =
            `
        <option value="">
        Seleccione camión
        </option>
        `;



        camionesDisponibles.forEach(c => {


            selectCamiones.innerHTML +=
                `
            <option value="${c.id}">
            
            ${c.placa}
            - ${c.marca}
            ${c.modelo}

            </option>
            `;


        });


    }


}

/*==================================================
                RENDER TABLA
==================================================*/


function renderizarTabla(lista = asignaciones) {


    const tbody =
        document.getElementById(
            "tbodyAsignaciones"
        );



    if (!tbody) return;



    tbody.innerHTML = "";



    if (lista.length === 0) {


        tbody.innerHTML =
            `

        <tr>

            <td colspan="5">

                <div class="empty-table">


                    <i class="fa-solid fa-link-slash"></i>


                    <h3>
                    Sin asignaciones
                    </h3>


                    <p>
                    No existen registros para mostrar.
                    </p>


                </div>


            </td>

        </tr>

        `;


        return;


    }






    lista.forEach(a => {


        const fila =
            document.createElement("tr");



        fila.innerHTML =
            `


        <td>


            <div class="conductor-info">


                <div class="avatar-placeholder">

                    <i class="fa-solid fa-user"></i>

                </div>



                <div class="conductor-datos">


                    <strong>

                    ${a.conductor.nombre}

                    </strong>



                    <span>

                    Licencia:
                    ${a.conductor.licencia}

                    </span>


                </div>


            </div>


        </td>





        <td>


            <div class="camion-info">


                <strong>

                ${a.camion.placa}

                </strong>



                <span>

                ${a.camion.marca}
                ${a.camion.modelo}

                </span>


            </div>


        </td>





        <td>


            ${formatearFecha(a.fechaAsignacion)}


        </td>


		
		<td>


		    ${formatearFecha(a.fechaFinalizacion)}


		</td>



        <td>


            ${crearBadgeEstado(a.estado)}


        </td>





        <td>


            <div class="action-buttons">



                <button
                class="btn-action btn-view"
                title="Ver detalle"
                onclick="verDetalle(${a.id})">


                    <i class="fa-solid fa-eye"></i>


                </button>
				
				
				
				<button
				class="btn-action btn-delete"
				title="Eliminar"
				onclick="eliminarAsignacion(${a.id})">

				<i class="fa-solid fa-trash"></i>

				</button>




                ${a.estado === "ACTIVA"
                ?

                `

                <button
                class="btn-action btn-finish"
                title="Finalizar"
                onclick="finalizarAsignacion(${a.id})">


                    <i class="fa-solid fa-check"></i>


                </button>

                `

                :

                ""

            }



            </div>


        </td>


        `;



        tbody.appendChild(fila);



    });



}





/*==================================================
                BADGES
==================================================*/


function crearBadgeEstado(estado) {



    let clase = "badge-activa";


    if (estado === "FINALIZADA") {

        clase = "badge-finalizada";

    }


    if (estado === "PENDIENTE") {

        clase = "badge-pendiente";

    }



    return `

    <span class="badge ${clase}">

        ${estado}

    </span>

    `;


}






/*==================================================
                TARJETAS
==================================================*/


function actualizarTarjetas() {


    const disponibles =
        document.getElementById(
            "totalDisponibles"
        );



    const asignados =
        document.getElementById(
            "totalAsignados"
        );



    const conductoresActivos =
        document.getElementById(
            "totalConductores"
        );





    if (disponibles) {


        disponibles.textContent =
            camionesDisponibles.length;


    }



    if (asignados) {


        asignados.textContent =
            asignaciones.filter(
                a => a.estado === "ACTIVA"
            ).length;


    }



	if (conductoresActivos) {


	    const conductoresAsignados =
	        asignaciones
	        .filter(a => a.estado === "ACTIVA")
	        .map(a => a.conductor.id);



	    const disponibles =
	        conductores.filter(c =>
	            c.estado === "ACTIVO" &&
	            !conductoresAsignados.includes(c.id)
	        ).length;



	    conductoresActivos.textContent =
	        disponibles;


	}



}







/*==================================================
                BUSQUEDA
==================================================*/


function buscarAsignacion(texto) {


    texto =
        texto.toLowerCase();



    const filtradas =
        asignaciones.filter(a => {


            return (

                a.conductor.nombre
                    .toLowerCase()
                    .includes(texto)

                ||

                a.camion.placa
                    .toLowerCase()
                    .includes(texto)

            );


        });



    renderizarTabla(filtradas);


}







/*==================================================
                FECHAS
==================================================*/


function formatearFecha(fecha) {


    if (!fecha)
        return "";



    const partes =
        fecha.split("-");



    return `
    ${partes[2]}/${partes[1]}/${partes[0]}
    `;


}






function establecerFechaActual() {


    const input =
        document.getElementById(
            "fechaAsignacion"
        );



    if (input) {


        const hoy =
            new Date()
                .toISOString()
                .split("T")[0];



        input.value = hoy;


    }


}

/*==================================================
                MODALES
==================================================*/


function abrirModal(id) {


    const modal =
        document.getElementById(id);



    if (modal) {

        modal.classList.add("active");

    }


}





function cerrarModales() {


    document
        .querySelectorAll(".modal")
        .forEach(modal => {


            modal.classList.remove("active");


        });


}






/*==================================================
        PREVISUALIZAR CONDUCTOR
==================================================*/


function mostrarConductorSeleccionado() {


    const id =
        Number(
            document.getElementById(
                "selectConductores"
            ).value
        );



    const conductor =
        conductores.find(
            c => c.id === id
        );



    if (!conductor)
        return;



    console.log(
        "Conductor seleccionado:",
        conductor
    );


}






/*==================================================
        PREVISUALIZAR CAMION
==================================================*/


function mostrarCamionSeleccionado() {


    const id =
        Number(
            document.getElementById(
                "selectCamiones"
            ).value
        );



    const camion =
        camionesDisponibles.find(
            c => c.id === id
        );



    if (!camion)
        return;



    console.log(
        "Camión seleccionado:",
        camion
    );


}







/*==================================================
            GUARDAR ASIGNACION
==================================================*/


async function guardarAsignacion(){


    const conductorId =
        Number(
            document.getElementById("selectConductores").value
        );


    const camionId =
        Number(
            document.getElementById("selectCamiones").value
        );


    const fecha =
        document.getElementById("fechaAsignacion").value;


    const observacion =
        document.getElementById("observacion").value;



    if(!conductorId || !camionId){

        alert("Seleccione conductor y camión");

        return;

    }




    const asignacion = {


        conductor:{
            id: conductorId
        },


        camion:{
            id: camionId
        },


        fechaAsignacion: fecha,


        observacion: observacion


    };





    const respuesta =
        await fetch(
            "/asignaciones/guardar",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:
                JSON.stringify(asignacion)

            }
        );





    if(respuesta.ok){


        alert(
            "Asignación creada correctamente"
        );


        cerrarModales();


        cargarDatosIniciales();


    }else{


        alert(
            "Error al guardar asignación"
        );


    }


}
/*==================================================
        FINALIZAR ASIGNACION
==================================================*/


function finalizarAsignacion(id) {


    const confirmar =
        confirm(
            "¿Desea finalizar esta asignación?"
        );


    if(!confirmar)
        return;



    fetch(
        `/asignaciones/finalizar/${id}`,
        {
            method:"PUT"
        }
    )
    .then(res => {

        if(res.ok){

            alert(
                "Asignación finalizada correctamente"
            );


            cargarDatosIniciales();

        }else{

            alert(
                "Error al finalizar asignación"
            );

        }

    })
    .catch(error=>{

        console.error(error);

        alert(
            "Error de conexión"
        );

    });


}







/*==================================================
                DETALLE
==================================================*/


function verDetalle(id) {



    const asignacion =
        asignaciones.find(
            a => a.id === id
        );



    if (!asignacion)
        return;





    document.getElementById(
        "detalleConductor"
    ).textContent =
        asignacion.conductor.nombre;




    document.getElementById(
        "detalleCamion"
    ).textContent =
        asignacion.camion.placa;



    document.getElementById(
        "detalleFecha"
    ).textContent =
	formatearFecha(
	    asignacion.fechaAsignacion
	)



    document.getElementById(
        "detalleEstado"
    ).textContent =
        asignacion.estado;



    document.getElementById(
        "detalleObservacion"
    ).textContent =
        asignacion.observacion ||
        "Sin observaciones";




    abrirModal(
        "modalDetalle"
    );


}






/*==================================================
            NOTIFICACIONES
==================================================*/


function mostrarNotificacion(
    tipo,
    titulo,
    mensaje
) {



    console.log(
        tipo,
        titulo,
        mensaje
    );



    alert(
        titulo +
        "\n\n" +
        mensaje
    );


}


/*==================================================
            eliminar asignacion
==================================================*/


async function eliminarAsignacion(id){


    const confirmar =
        confirm(
            "¿Desea eliminar esta asignación?"
        );


    if(!confirmar)
        return;



    const respuesta =
        await fetch(
            `/asignaciones/eliminar/${id}`,
            {
                method:"DELETE"
            }
        );



    if(respuesta.ok){


        alert(
            "Asignación eliminada"
        );


        cargarDatosIniciales();


    }else{


        alert(
            "Error eliminando asignación"
        );

    }


}
