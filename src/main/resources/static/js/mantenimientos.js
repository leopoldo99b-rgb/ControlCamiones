// =====================================================
// VARIABLES GLOBALES
// =====================================================

let modalMantenimiento;
let formMantenimiento;

let idMantenimiento;
let tituloModalMantenimiento;

let btnNuevoMantenimiento;
let btnPrimerRegistro;

let selectCamion;
let selectTipo;

let modalVerMantenimiento;
let modalEditarEstado;

let modalEliminarMantenimiento;

let btnFiltrar;
let btnLimpiarFiltros;


let contadorRegistros;
let paginaActual;
let btnAnterior;
let btnSiguiente;

let paginaActualTabla = 1;
let registrosPorPagina = 12;
let listaMantenimientosCompleta = [];

let modalAuditoria;
let btnAbrirAuditoria;

// =====================================================
// REPUESTOS VARIABLES GLOBALES
// =====================================================

let tbodyRepuestos;
let totalRepuestos;
let totalMantenimiento;

let listaRepuestos = [];


// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        inicializarVariables();

        inicializarEventos();

        cargarMantenimientos();

        cargarFiltroCamiones();

        cargarFiltroTipos();

    }
);


// =====================================================
// CARGAR ELEMENTOS DEL DOM
// =====================================================

function inicializarVariables(){


    btnNuevoMantenimiento =
        document.getElementById(
            "btnNuevoMantenimiento"
        );


    btnPrimerRegistro =
        document.getElementById(
            "btnPrimerRegistro"
        );



    formMantenimiento =
        document.getElementById(
            "formMantenimiento"
        );



    idMantenimiento =
        document.getElementById(
            "idMantenimiento"
        );



    tituloModalMantenimiento =
        document.getElementById(
            "tituloModalMantenimiento"
        );



    selectCamion =
        document.getElementById(
            "selectCamion"
        );



    selectTipo =
        document.getElementById(
            "tipo"
        );



    tbodyRepuestos =
        document.getElementById(
            "tbodyRepuestos"
        );



    totalRepuestos =
        document.getElementById(
            "totalRepuestos"
        );



    totalMantenimiento =
        document.getElementById(
            "totalMantenimiento"
        );



    let modal1 =
        document.getElementById(
            "modalMantenimiento"
        );


    if(modal1){

        modalMantenimiento =
            new bootstrap.Modal(modal1);

    }



    let modal2 =
        document.getElementById(
            "modalVerMantenimiento"
        );


    if(modal2){

        modalVerMantenimiento =
            new bootstrap.Modal(modal2);

    }



    let modal3 =
        document.getElementById(
            "modalEditarEstado"
        );


    if(modal3){

        modalEditarEstado =
            new bootstrap.Modal(modal3);

    }



    let modal4 =
        document.getElementById(
            "modalEliminarMantenimiento"
        );


    if(modal4){

        modalEliminarMantenimiento =
            new bootstrap.Modal(modal4);

    }



    btnFiltrar =
        document.getElementById(
            "btnFiltrar"
        );



    btnLimpiarFiltros =
        document.getElementById(
            "btnLimpiarFiltros"
        );
	
		contadorRegistros =
		document.getElementById(
		    "contadorRegistros"
		);


		paginaActual =
		document.getElementById(
		    "paginaActual"
		);


		btnAnterior =
		document.getElementById(
		    "btnAnterior"
		);


		btnSiguiente =
		document.getElementById(
		    "btnSiguiente"
		);
		
		btnAbrirAuditoria =
		    document.getElementById(
		        "btnAbrirAuditoria"
		    );

		let modal5 =
		    document.getElementById(
		        "modalAuditoria"
		    );

		if(modal5){

		    modalAuditoria =
		        new bootstrap.Modal(modal5);

		}


}



// =====================================================
// EVENTOS
// =====================================================

function inicializarEventos(){



    if(btnNuevoMantenimiento){

        btnNuevoMantenimiento.addEventListener(
            "click",
            abrirNuevoMantenimiento
        );

    }



    if(btnPrimerRegistro){

        btnPrimerRegistro.addEventListener(
            "click",
            abrirNuevoMantenimiento
        );

    }




    let btnAgregarRepuesto =
        document.getElementById(
            "btnAgregarRepuesto"
        );



    if(btnAgregarRepuesto){

        btnAgregarRepuesto.addEventListener(
            "click",
            agregarRepuesto
        );

    }




    if(formMantenimiento){

        formMantenimiento.addEventListener(
            "submit",
            guardarMantenimiento
        );

    }





    if(btnFiltrar){

        btnFiltrar.addEventListener(
            "click",
            aplicarFiltros
        );

    }




    if(btnLimpiarFiltros){

        btnLimpiarFiltros.addEventListener(
            "click",
            limpiarFiltros
        );

    }





    let codigoUsuario =
        document.getElementById(
            "codigoUsuario"
        );



    if(codigoUsuario){


        codigoUsuario.addEventListener(
            "input",
            function(){


                let codigoGenerado =
                    document.getElementById(
                        "codigoGenerado"
                    ).textContent;



                let boton =
                    document.getElementById(
                        "btnConfirmarEliminar"
                    );



                if(boton){

                    boton.disabled =
                        this.value.trim().toUpperCase()
                        !== codigoGenerado;

                }


            }
        );
		
		}
	
		if(btnAnterior){

		    btnAnterior.addEventListener(
		        "click",
		        function(){

		            if(paginaActualTabla > 1){

		                paginaActualTabla--;

		                mostrarPaginaMantenimientos();

		            }

		        }
		    );

		}



		if(btnSiguiente){

		    btnSiguiente.addEventListener(
		        "click",
		        function(){

		            let totalPaginas =
		                Math.ceil(
		                    listaMantenimientosCompleta.length /
		                    registrosPorPagina
		                );

		            if(paginaActualTabla < totalPaginas){

		                paginaActualTabla++;

		                mostrarPaginaMantenimientos();

		            }

		        }
		    );

		}




    let btnConfirmarEliminar =
        document.getElementById(
            "btnConfirmarEliminar"
        );



    if(btnConfirmarEliminar){


        btnConfirmarEliminar.addEventListener(
            "click",
            confirmarEliminarMantenimiento
        );


    }

	if(btnAbrirAuditoria){

	    btnAbrirAuditoria.addEventListener(
	        "click",
	        abrirAuditoria
	    );

	}



}


// =====================================================
// ABRIR MODAL NUEVO MANTENIMIENTO
// =====================================================

function abrirNuevoMantenimiento(){



    if(formMantenimiento){

        formMantenimiento.reset();

    }



    if(idMantenimiento){

        idMantenimiento.value = "";

    }



    if(tituloModalMantenimiento){

        tituloModalMantenimiento.innerHTML =
        `
            <i class="fa-solid fa-screwdriver-wrench"></i>
            Nuevo mantenimiento
        `;

    }



    if(tbodyRepuestos){

        tbodyRepuestos.innerHTML = "";

    }



    cargarCamiones();

    cargarTiposMantenimiento();



    if(modalMantenimiento){

        modalMantenimiento.show();

    }


}



// =====================================================
// CARGAR CAMIONES
// =====================================================

async function cargarCamiones(){


    try{


        const respuesta =
            await fetch(
                "/camiones/lista"
            );



        const camiones =
            await respuesta.json();



        if(!selectCamion){

            return;

        }



        selectCamion.innerHTML =
        `
            <option value="">
                Seleccione un camión
            </option>
        `;




        camiones.forEach(
            camion => {


                let option =
                    document.createElement(
                        "option"
                    );



                option.value =
                    camion.id;



                option.textContent =
                    camion.placa +
                    " - " +
                    camion.marca +
                    " " +
                    camion.modelo;



                selectCamion.appendChild(
                    option
                );


            }
        );



    }catch(error){


        console.error(
            "Error cargando camiones:",
            error
        );


    }


}



// =====================================================
// CARGAR TIPOS DE MANTENIMIENTO
// =====================================================

async function cargarTiposMantenimiento(){



    try{


        const respuesta =
            await fetch(
                "/api/tipos-mantenimiento"
            );



        const tipos =
            await respuesta.json();



        if(!selectTipo){

            return;

        }




        selectTipo.innerHTML =
        `
            <option value="">
                Seleccione tipo
            </option>
        `;



        tipos.forEach(
            tipo => {


                let option =
                    document.createElement(
                        "option"
                    );



                option.value =
                    tipo.id;



                option.textContent =
                    tipo.nombre;



                selectTipo.appendChild(
                    option
                );


            }
        );



    }catch(error){


        console.error(
            "Error cargando tipos:",
            error
        );


    }



}
// =====================================================
// AGREGAR REPUESTOS
// =====================================================

function agregarRepuesto(){


    if(!tbodyRepuestos){

        return;

    }



    let fila =
        document.createElement("tr");



    fila.innerHTML =
    `

        <td>

            <input 
            class="form-control repuestoNombre"
            placeholder="Nombre">

        </td>


        <td>

            <input 
            type="number"
            class="form-control repuestoCantidad"
            value="1"
            min="1">

        </td>


        <td>

            <input 
            type="number"
            step="0.01"
            class="form-control repuestoPrecio"
            value="0">

        </td>


        <td class="subtotal">

            L 0.00

        </td>



        <td>


            <button 
            type="button"
            class="btn btn-danger btn-sm"
            onclick="eliminarRepuesto(this)">


                <i class="fa-solid fa-trash"></i>


            </button>


        </td>


    `;



    tbodyRepuestos.appendChild(
        fila
    );




    fila.querySelectorAll("input")
        .forEach(
            input => {


                input.addEventListener(
                    "input",
                    calcularRepuestos
                );


            }
        );



}



// =====================================================
// CALCULAR TOTALES DE REPUESTOS
// =====================================================

function calcularRepuestos(){



    if(!tbodyRepuestos){

        return;

    }



    let filas =
        tbodyRepuestos.querySelectorAll(
            "tr"
        );



    let total = 0;




    filas.forEach(
        fila => {



            let cantidad =
                Number(
                    fila.querySelector(
                        ".repuestoCantidad"
                    ).value
                ) || 0;



            let precio =
                Number(
                    fila.querySelector(
                        ".repuestoPrecio"
                    ).value
                ) || 0;




            let subtotal =
                cantidad * precio;



            fila.querySelector(
                ".subtotal"
            ).innerHTML =
                "L " +
                subtotal.toFixed(2);




            total += subtotal;



        }
    );




    if(totalRepuestos){

        totalRepuestos.innerHTML =
            "L " +
            total.toFixed(2);

    }




    if(totalMantenimiento){

        totalMantenimiento.innerHTML =
            "L " +
            total.toFixed(2);

    }



}



// =====================================================
// ELIMINAR REPUESTOS
// =====================================================

function eliminarRepuesto(btn){


    if(btn){


        let fila =
            btn.closest("tr");



        if(fila){

            fila.remove();

        }


    }



    calcularRepuestos();



}



// =====================================================
// OBTENER REPUESTOS
// =====================================================

function obtenerRepuestos(){



    let repuestos = [];



    if(!tbodyRepuestos){

        return repuestos;

    }




    let filas =
        tbodyRepuestos.querySelectorAll(
            "tr"
        );




    filas.forEach(
        fila => {



            let nombre =
                fila.querySelector(
                    ".repuestoNombre"
                ).value;



            let cantidad =
                Number(
                    fila.querySelector(
                        ".repuestoCantidad"
                    ).value
                ) || 0;




            let precio =
                Number(
                    fila.querySelector(
                        ".repuestoPrecio"
                    ).value
                ) || 0;



            repuestos.push({

                nombre:nombre,

                cantidad:cantidad,

                precio:precio,

                subtotal:
                    cantidad * precio

            });



        }
    );



    return repuestos;



}



// =====================================================
// CARGAR TABLA DE MANTENIMIENTOS
// =====================================================

async function cargarMantenimientos(
    camion = "",
    tipo = "",
    estado = "",
    fechaInicio = "",
    fechaFin = ""
){

    try{

        let parametros =
            new URLSearchParams();

        if(camion){

            parametros.append(
                "camion",
                camion
            );

        }

        if(tipo){

            parametros.append(
                "tipo",
                tipo
            );

        }

        if(estado){

            parametros.append(
                "estado",
                estado
            );

        }

        if(fechaInicio){

            parametros.append(
                "fechaInicio",
                fechaInicio
            );

        }

        if(fechaFin){

            parametros.append(
                "fechaFin",
                fechaFin
            );

        }

        let url =
            "/mantenimiento/lista";

        if(parametros.toString() !== ""){

            url +=
                "?" +
                parametros.toString();

        }

        const respuesta =
            await fetch(url);

        if(!respuesta.ok){

            throw new Error(
                "Error al cargar mantenimientos"
            );

        }

        const mantenimientos =
            await respuesta.json();

        // Guardar todos los registros obtenidos
        listaMantenimientosCompleta =
            mantenimientos;

        // Volver siempre a la primera página
        paginaActualTabla = 1;

        // Actualizar tabla
        mostrarPaginaMantenimientos();

        // Actualizar dashboard
        actualizarDashboard();

    }
    catch(error){

        console.error(
            "Error cargando mantenimientos:",
            error
        );

        // Vaciar lista
        listaMantenimientosCompleta = [];

        // Limpiar tabla
        mostrarPaginaMantenimientos();

        // Limpiar dashboard
        actualizarDashboard();

    }

}
// =====================================================
// GUARDAR MANTENIMIENTO
// =====================================================

async function guardarMantenimiento(e){


    e.preventDefault();



    let datos = {


        camion:{
            id:Number(
                selectCamion.value
            )
        },



        fecha:
            document.getElementById(
                "fecha"
            ).value,



        tipo:
            selectTipo.options[
                selectTipo.selectedIndex
            ]?.text || "",



        estado:
            document.getElementById(
                "estado"
            ).value,



        kilometraje:
            Number(
                document.getElementById(
                    "kilometraje"
                ).value
            ),



        costo:
            Number(
                document.getElementById(
                    "costo"
                ).value
            ),



        taller:
            document.getElementById(
                "taller"
            ).value,



        proximoMantenimiento:
            Number(
                document.getElementById(
                    "proximoMantenimiento"
                ).value
            ),



        proximaFecha:
            document.getElementById(
                "proximaFecha"
            ).value,



        descripcion:
            document.getElementById(
                "descripcion"
            ).value,



        observaciones:
            document.getElementById(
                "observaciones"
            ).value,



        repuestos:
            obtenerRepuestos()


    };





    try{


        let respuesta =
            await fetch(
                "/mantenimiento/guardar",
                {


                    method:"POST",


                    headers:{


                        "Content-Type":
                            "application/json"


                    },


                    body:
                        JSON.stringify(datos)


                }
            );





        if(respuesta.ok){



            alert(
                "Mantenimiento guardado correctamente"
            );



            if(modalMantenimiento){

                modalMantenimiento.hide();

            }



            formMantenimiento.reset();



            if(tbodyRepuestos){

                tbodyRepuestos.innerHTML="";

            }



            cargarMantenimientos();



        }else{



            let error =
                await respuesta.text();



            console.error(
                error
            );



            alert(
                "Error guardando mantenimiento"
            );


        }





    }catch(error){


        console.error(
            "Error guardando:",
            error
        );


    }



}



// =====================================================
// VER DETALLE MANTENIMIENTO
// =====================================================

async function verMantenimiento(id){

    try{

        let respuesta =
            await fetch(
                "/mantenimiento/ver/" + id
            );

        let m =
            await respuesta.json();

        // ==========================================
        // ESTADO
        // ==========================================

        let claseEstado = "";

        switch(m.estado){

            case "FINALIZADO":

                claseEstado =
                    "estado-finalizado";

                break;

            case "EN_PROCESO":

                claseEstado =
                    "estado-en-proceso";

                break;

            case "PENDIENTE":

                claseEstado =
                    "estado-pendiente";

                break;

            default:

                claseEstado =
                    "estado-cancelado";

        }

        // ==========================================
        // PRÓXIMA FECHA
        // ==========================================

        let claseFecha =
            "fecha-normal";

        if(m.proximaFecha){

            let hoy =
                new Date();

            hoy.setHours(
                0,
                0,
                0,
                0
            );

            let fechaProxima =
                new Date(
                    m.proximaFecha +
                    "T00:00:00"
                );

            if(fechaProxima < hoy){

                claseFecha =
                    "fecha-vencida";

            }

        }

        // ==========================================
        // INFORMACIÓN GENERAL
        // ==========================================

        document.getElementById(
            "verPlaca"
        ).innerHTML =
            m.placa || "No registrado";

        document.getElementById(
            "verFecha"
        ).innerHTML =
            m.fecha || "No registrada";

        document.getElementById(
            "verEstado"
        ).innerHTML =

        `
            <span class="badge-estado ${claseEstado}">
                ${(m.estado || "SIN ESTADO")
                    .replaceAll("_"," ")}
            </span>
        `;

        document.getElementById(
            "verTipo"
        ).innerHTML =
            m.tipo || "No registrado";

        document.getElementById(
            "verTaller"
        ).innerHTML =
            m.taller || "No registrado";

        document.getElementById(
            "verKilometraje"
        ).innerHTML =

        `
            <span class="valor-km">
                ${Number(
                    m.kilometraje ?? 0
                ).toLocaleString()} km
            </span>
        `;

        document.getElementById(
            "verCosto"
        ).innerHTML =

        `
            <span class="valor-costo">
                L ${Number(
                    m.costo ?? 0
                ).toFixed(2)}
            </span>
        `;

        document.getElementById(
            "verProximo"
        ).innerHTML =
            m.proximoMantenimiento ||
            "No definido";

        document.getElementById(
            "verProximaFecha"
        ).innerHTML =

        `
            <span class="${claseFecha}">
                ${m.proximaFecha || "No definida"}
            </span>
        `;

        document.getElementById(
            "verDescripcion"
        ).innerHTML =
            m.descripcion ||
            "Sin descripción.";

        document.getElementById(
            "verObservaciones"
        ).innerHTML =
            m.observaciones ||
            "Sin observaciones.";

        // ==========================================
        // REPUESTOS
        // ==========================================

        let tbody =
            document.getElementById(
                "tbodyVerRepuestos"
            );

        tbody.innerHTML = "";

        if(
            m.repuestos &&
            m.repuestos.length > 0
        ){

            m.repuestos.forEach(
                r => {

                    tbody.innerHTML +=

                    `
                    <tr>

                        <td>
                            ${r.nombre}
                        </td>

                        <td class="text-center">
                            ${r.cantidad}
                        </td>

                        <td class="text-end">
                            L ${Number(
                                r.precio ?? 0
                            ).toFixed(2)}
                        </td>

                        <td class="text-end fw-bold text-success">
                            L ${Number(
                                r.subtotal ?? 0
                            ).toFixed(2)}
                        </td>

                    </tr>
                    `;

                }
            );

        }else{

            tbody.innerHTML =

            `
            <tr>

                <td colspan="4" class="text-center text-muted py-4">

                    <i class="fa-solid fa-box-open me-2"></i>

                    No se registraron repuestos para este mantenimiento.

                </td>

            </tr>
            `;

        }

        // ==========================================
        // ABRIR MODAL
        // ==========================================

        if(modalVerMantenimiento){

            modalVerMantenimiento.show();

        }

    }catch(error){

        console.error(
            "Error viendo mantenimiento:",
            error
        );

    }

}
// =====================================================
// EDITAR ESTADO
// =====================================================

async function editarEstado(id){



    document.getElementById(
        "idEditarEstado"
    ).value=id;





    try{


        let respuesta =
            await fetch(
                "/mantenimiento/lista"
            );



        let lista =
            await respuesta.json();




        let mantenimiento =
            lista.find(
                m=>m.id==id
            );




        if(mantenimiento){



            document.getElementById(
                "nuevoEstado"
            ).value =
                mantenimiento.estado;



        }





        if(modalEditarEstado){

            modalEditarEstado.show();

        }




    }catch(error){


        console.error(error);


    }



}




// =====================================================
// GUARDAR ESTADO
// =====================================================

async function guardarEstado(){



    let id =
        document.getElementById(
            "idEditarEstado"
        ).value;




    let estado =
        document.getElementById(
            "nuevoEstado"
        ).value;




    let respuesta =
        await fetch(
            "/mantenimiento/estado/"+id,
            {


                method:"PUT",


                headers:{


                    "Content-Type":
                    "application/json"


                },


                body:
                    JSON.stringify({
                        estado:estado
                    })


            }
        );





    if(respuesta.ok){


        alert(
            "Estado actualizado correctamente"
        );



        modalEditarEstado.hide();



        cargarMantenimientos();



    }else{


        alert(
            "Error actualizando estado"
        );


    }



}



// =====================================================
// ELIMINAR MANTENIMIENTO
// =====================================================

function eliminarMantenimiento(id){



    document.getElementById(
        "idEliminarMantenimiento"
    ).value=id;




    document.getElementById(
        "codigoUsuario"
    ).value="";




    document.getElementById(
        "btnConfirmarEliminar"
    ).disabled=true;





    let codigo =
        Math.random()
        .toString(36)
        .substring(2,8)
        .toUpperCase();




    document.getElementById(
        "codigoGenerado"
    ).textContent=codigo;





    modalEliminarMantenimiento.show();



}



// =====================================================
// CONFIRMAR ELIMINACIÓN
// =====================================================

async function confirmarEliminarMantenimiento(){



    let id =
        document.getElementById(
            "idEliminarMantenimiento"
        ).value;





    let respuesta =
        await fetch(
            "/mantenimiento/eliminar/"+id,
            {

                method:"DELETE"

            }
        );





    if(respuesta.ok){


        modalEliminarMantenimiento.hide();


        cargarMantenimientos();


        alert(
            "Mantenimiento eliminado correctamente"
        );



    }else{


        alert(
            "No se pudo eliminar"
        );


    }



}



// =====================================================
// CARGAR FILTRO CAMIONES
// =====================================================

async function cargarFiltroCamiones(){



    let respuesta =
        await fetch(
            "/camiones/lista"
        );



    let camiones =
        await respuesta.json();




    let select =
        document.getElementById(
            "filtroCamion"
        );




    if(!select){

        return;

    }




    select.innerHTML =
    `
        <option value="">
            Todos
        </option>
    `;




    camiones.forEach(
        c=>{


            select.innerHTML +=
            `
            <option value="${c.id}">
                ${c.placa}
            </option>
            `;


        }
    );



}



// =====================================================
// CARGAR FILTRO TIPOS
// =====================================================

async function cargarFiltroTipos(){



    let respuesta =
        await fetch(
            "/api/tipos-mantenimiento"
        );



    let tipos =
        await respuesta.json();




    let select =
        document.getElementById(
            "filtroTipo"
        );




    if(!select){

        return;

    }





    select.innerHTML =
    `
        <option value="">
            Todos
        </option>
    `;




    tipos.forEach(
        t=>{


            select.innerHTML +=
            `
            <option value="${t.nombre}">
                ${t.nombre}
            </option>
            `;


        }
    );



}



// =====================================================
// APLICAR FILTROS
// =====================================================

function aplicarFiltros(){



    cargarMantenimientos(


        document.getElementById(
            "filtroCamion"
        ).value,



        document.getElementById(
            "filtroTipo"
        ).value,



        document.getElementById(
            "filtroEstado"
        ).value,



        document.getElementById(
            "fechaInicio"
        ).value,



        document.getElementById(
            "fechaFin"
        ).value


    );



}



// =====================================================
// LIMPIAR FILTROS
// =====================================================

function limpiarFiltros(){



    document.getElementById(
        "filtroCamion"
    ).value="";



    document.getElementById(
        "filtroTipo"
    ).value="";



    document.getElementById(
        "filtroEstado"
    ).value="";



    document.getElementById(
        "fechaInicio"
    ).value="";



    document.getElementById(
        "fechaFin"
    ).value="";



    cargarMantenimientos();



}

// =====================================================
// MOSTRAR PÁGINA DE MANTENIMIENTOS
// =====================================================

function mostrarPaginaMantenimientos(){

    let tbody =
        document.getElementById(
            "tbodyMantenimientos"
        );

    if(!tbody){

        return;

    }

    tbody.innerHTML = "";

    // Si no hay registros
    if(listaMantenimientosCompleta.length === 0){

        tbody.innerHTML = `

            <tr>

                <td colspan="8">

                    <div class="empty-table">

                        <div class="empty-icon">

                            <i class="fa-solid fa-screwdriver-wrench"></i>

                        </div>

                        <h3>

                            Sin mantenimientos registrados

                        </h3>

                        <p>

                            No existen mantenimientos con los filtros seleccionados.

                        </p>

                    </div>

                </td>

            </tr>

        `;

        if(contadorRegistros){

            contadorRegistros.innerHTML =
                "No hay registros";

        }

        if(paginaActual){

            paginaActual.innerHTML = "0";

        }

        if(btnAnterior){

            btnAnterior.disabled = true;

        }

        if(btnSiguiente){

            btnSiguiente.disabled = true;

        }

        return;

    }

    // ==========================================
    // PAGINACIÓN
    // ==========================================

    let inicio =
        (paginaActualTabla - 1) *
        registrosPorPagina;

    let fin =
        inicio +
        registrosPorPagina;

    let registrosPagina =
        listaMantenimientosCompleta.slice(
            inicio,
            fin
        );

    // ==========================================
    // PINTAR FILAS
    // ==========================================

    registrosPagina.forEach(
        m => {

            let fila =
                document.createElement(
                    "tr"
                );

            // ----------------------------
            // Verificar si está vencido
            // ----------------------------

            let vencido = false;

            if(m.proximaFecha){

                let hoy =
                    new Date();

                hoy.setHours(
                    0,
                    0,
                    0,
                    0
                );

                let fechaProxima =
                    new Date(
                        m.proximaFecha +
                        "T00:00:00"
                    );

                if(fechaProxima < hoy){

                    vencido = true;

                }

            }

            if(vencido){

                fila.classList.add(
                    "fila-vencida"
                );

            }

            // ----------------------------
            // Color del estado
            // ----------------------------

            let claseEstado = "";

            switch(m.estado){

                case "FINALIZADO":

                    claseEstado =
                        "estado-finalizado";

                    break;

                case "EN_PROCESO":

                    claseEstado =
                        "estado-en-proceso";

                    break;

                case "PENDIENTE":

                    claseEstado =
                        "estado-pendiente";

                    break;

                default:

                    claseEstado =
                        "estado-cancelado";

            }

            fila.innerHTML = `

                <td>

                    ${m.placa ?? ""}

                </td>

                <td>

                    ${m.fecha ?? ""}

                </td>

                <td>

                    ${m.tipo ?? ""}

                </td>

                <td>

                    ${m.taller ?? ""}

                </td>

                <td>

                    ${m.kilometraje ?? ""}

                </td>

                <td>

                    L ${Number(
                        m.costo ?? 0
                    ).toFixed(2)}

                </td>

                <td>

                    <span class="badge-estado ${claseEstado}">

                        ${(m.estado ?? "")
                            .replaceAll("_"," ")}

                    </span>

                </td>

				<td>

				    <div class="acciones-tabla">

				        <button
				            class="btn btn-info"
				            title="Ver mantenimiento"
				            onclick="verMantenimiento(${m.id})">

				            <i class="fa-solid fa-eye"></i>

				        </button>

				        <button
				            class="btn btn-warning"
				            title="Editar estado"
				            onclick="editarEstado(${m.id})">

				            <i class="fa-solid fa-pen"></i>

				        </button>

				        <button
				            class="btn btn-danger"
				            title="Eliminar mantenimiento"
				            onclick="eliminarMantenimiento(${m.id})">

				            <i class="fa-solid fa-trash"></i>

				        </button>

				    </div>

				</td>

            `;

            tbody.appendChild(
                fila
            );

        }
    );

    // ==========================================
    // TOTAL PÁGINAS
    // ==========================================

    let totalPaginas =
        Math.max(
            1,
            Math.ceil(
                listaMantenimientosCompleta.length /
                registrosPorPagina
            )
        );

    // ==========================================
    // CONTADOR
    // ==========================================

    if(contadorRegistros){

        let desde =
            inicio + 1;

        let hasta =
            Math.min(
                fin,
                listaMantenimientosCompleta.length
            );

        let total =
            listaMantenimientosCompleta.length;

        if(total <= registrosPorPagina){

            contadorRegistros.innerHTML =
                `Mostrando ${total} registro${total !== 1 ? "s" : ""}`;

        }else{

            contadorRegistros.innerHTML =
                `Mostrando ${desde} a ${hasta} de ${total} registros`;

        }

    }

    // ==========================================
    // NÚMERO DE PÁGINA
    // ==========================================

    if(paginaActual){

        paginaActual.innerHTML =
            `${paginaActualTabla} / ${totalPaginas}`;

    }

    // ==========================================
    // BOTONES PAGINACIÓN
    // ==========================================

    if(btnAnterior){

        btnAnterior.disabled =
            paginaActualTabla === 1;

    }

    if(btnSiguiente){

        btnSiguiente.disabled =
            paginaActualTabla === totalPaginas;

    }

}

// =====================================================
// ACTUALIZAR DASHBOARD
// =====================================================

function actualizarDashboard(){

    let cardTotal =
        document.getElementById(
            "cardTotal"
        );

    let cardCosto =
        document.getElementById(
            "cardCosto"
        );

    let cardProximos =
        document.getElementById(
            "cardProximos"
        );

    let cardVencidos =
        document.getElementById(
            "cardVencidos"
        );

    if(
        !cardTotal ||
        !cardCosto ||
        !cardProximos ||
        !cardVencidos
    ){
        return;
    }

    let total =
        listaMantenimientosCompleta.length;

    let gastoMensual = 0;

    let proximos = 0;

    let vencidos = 0;

    let hoy =
        new Date();

    // Comparar únicamente la fecha
    hoy.setHours(
        0,
        0,
        0,
        0
    );

    let mesActual =
        hoy.getMonth();

    let anioActual =
        hoy.getFullYear();

    listaMantenimientosCompleta.forEach(
        mantenimiento => {

            // ==========================
            // GASTO DEL MES ACTUAL
            // ==========================

            if(mantenimiento.fecha){

                let fecha =
                    new Date(
                        mantenimiento.fecha + "T00:00:00"
                    );

                if(
                    fecha.getMonth() === mesActual &&
                    fecha.getFullYear() === anioActual
                ){

                    gastoMensual +=
                        Number(
                            mantenimiento.costo
                        ) || 0;

                }

            }

            // ==========================
            // PRÓXIMOS Y VENCIDOS
            // ==========================

            if(mantenimiento.proximaFecha){

                let fechaProxima =
                    new Date(
                        mantenimiento.proximaFecha + "T00:00:00"
                    );

                if(fechaProxima < hoy){

                    vencidos++;

                }else{

                    proximos++;

                }

            }

        }
    );

    cardTotal.textContent =
        total;

    cardCosto.textContent =
        "L. " +
        gastoMensual.toFixed(2);

    cardProximos.textContent =
        proximos;

    cardVencidos.textContent =
        vencidos;

}

// =====================================================
// ABRIR MODAL AUDITORÍA
// =====================================================

function abrirAuditoria(){

    if(modalAuditoria){

        modalAuditoria.show();

    }

}