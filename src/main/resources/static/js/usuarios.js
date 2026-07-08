document.addEventListener("DOMContentLoaded", function(){


    const modal = document.getElementById("modalUsuario");

    const btnNuevo = document.getElementById("btnNuevoUsuario");

    const btnCerrar = document.getElementById("btnCerrarModal");

    const btnCancelar = document.getElementById("btnCancelarModal");



    /* ABRIR MODAL */

	/* ABRIR MODAL NUEVO USUARIO */

	if(btnNuevo){

	    btnNuevo.addEventListener("click", function(){


			let total = Number(this.dataset.total);
			let limite = Number(this.dataset.limite);


			if(total >= limite){

			    mostrarToast(
			        "Has alcanzado el límite de usuarios permitidos."
			    );

			    return;

			}

	        // limpiar formulario completo
	        document.getElementById("formUsuario").reset();


	        // quitar id para que sea creación
	        document.getElementById("idUsuario").value = "";


	        // cambiar título
	        document.getElementById("tituloModal").innerHTML =
	        '<i class="fa-solid fa-user-plus"></i> Crear Usuario';



	        // cambiar botón
	        document.getElementById("textoGuardar").innerText =
	        "Guardar Usuario";



	        // imagen por defecto
			document.getElementById("previewFoto").src =
			"/imgs/perfil.png";



	        // limpiar correo visual
	        document.getElementById("correoUsuario").value = "";



	        // abrir modal
	        modal.style.display = "flex";


	    });

	}



    /* CERRAR MODAL */

    if(btnCerrar){

        btnCerrar.addEventListener("click", function(){

            modal.style.display = "none";

        });

    }



    if(btnCancelar){

        btnCancelar.addEventListener("click", function(){

            modal.style.display = "none";

        });

    }




    /* CERRAR AL HACER CLICK AFUERA */

    window.addEventListener("click", function(event){

        if(event.target === modal){

            modal.style.display = "none";

        }

    });






    /* MOSTRAR PASSWORD TABLA */

    const botonesPassword = document.querySelectorAll(".show-pass");


    botonesPassword.forEach(function(btn){


        btn.addEventListener("click", function(){


            mostrarPassword(this);


        });


    });






    /* FOTO PERFIL */


    const fotoInput = document.getElementById("fotoPerfil");


    if(fotoInput){


        fotoInput.addEventListener("change", function(){


            const archivo = this.files[0];


            if(archivo){


                const reader = new FileReader();



                reader.onload = function(e){


                    document.getElementById("previewFoto").src =
                    e.target.result;


                }



                reader.readAsDataURL(archivo);


            }



        });



    }






	/* ==========================
	   GENERAR CORREO
	========================== */


	const correoUsuario =
	document.getElementById("correoUsuario");


	const dominio =
	document.getElementById("dominio");



	if(correoUsuario){


	    correoUsuario.addEventListener(
	        "keyup",
	        actualizarCorreo
	    );


	}



	if(dominio){


	    dominio.addEventListener(
	        "change",
	        actualizarCorreo
	    );


	}


    /* MOSTRAR PASSWORD CREAR */


    const btnMostrarCrearPassword =
    document.getElementById("btnMostrarCrearPassword");



    if(btnMostrarCrearPassword){


        btnMostrarCrearPassword.addEventListener("click", function(){


            const input =
            document.getElementById("password");



            if(input.type === "password"){


                input.type = "text";


            }else{


                input.type = "password";


            }



        });



    }






    /* GENERAR PASSWORD */


    const btnGenerarPassword =
    document.getElementById("btnGenerarPassword");



    if(btnGenerarPassword){


        btnGenerarPassword.addEventListener(
            "click",
            generarPassword
        );


    }



});









/* FUNCION MOSTRAR PASSWORD TABLA */


function mostrarPassword(btn){


    let input =
    btn.parentElement.querySelector(".pass");



    let icon =
    btn.querySelector("i");



    if(input.type === "password"){



        input.type = "text";


        icon.classList.remove("fa-eye");

        icon.classList.add("fa-eye-slash");



    }else{



        input.type = "password";


        icon.classList.remove("fa-eye-slash");

        icon.classList.add("fa-eye");



    }



}










/* GENERAR CORREO */


function actualizarCorreo(){


    let usuarioCorreo =
    document.getElementById("correoUsuario").value.trim();



    let dominio =
    document.getElementById("dominio").value;



    document.getElementById("correo").value =
    usuarioCorreo + dominio;


}








/* GENERAR PASSWORD ALEATORIA */


function generarPassword(){



    let caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";



    let password = "";



    for(let i = 0; i < 10; i++){


        password += caracteres.charAt(

            Math.floor(
                Math.random() * caracteres.length
            )

        );


    }



    document.getElementById("password").value =
    password;



}


let formularioEliminar = null;


function abrirModalEliminar(boton){


    formularioEliminar =
        boton.closest("form");


    document
    .getElementById("modalEliminar")
    .style.display = "flex";


}



function cerrarModalEliminar(){


    formularioEliminar = null;


    document
    .getElementById("modalEliminar")
    .style.display = "none";


}



function confirmarEliminar(){


    if(formularioEliminar){

        formularioEliminar.submit();

    }


}

function abrirEditar(boton){


    document.getElementById("modalUsuario").style.display="flex";



    document.getElementById("tituloModal").innerHTML =
    '<i class="fa-solid fa-user-pen"></i> Editar Usuario';



    document.getElementById("textoGuardar").innerText =
    "Actualizar Usuario";



    document.getElementById("idUsuario").value =
    boton.dataset.id;



    document.querySelector('[name="nombre"]').value =
    boton.dataset.nombre || "";



    document.querySelector('[name="usuario"]').value =
    boton.dataset.usuario || "";



    document.querySelector('[name="password"]').value =
    boton.dataset.password || "";



    document.querySelector('[name="telefono"]').value =
    boton.dataset.telefono || "";



    document.querySelector('[name="rol"]').value =
    boton.dataset.rol || "";




    // ==========================
    // CORREO
    // ==========================


    let correoCompleto =
    boton.dataset.correo || "";



    document.getElementById("correo").value =
    correoCompleto;



    if(correoCompleto.includes("@")){


        let partes =
        correoCompleto.split("@");



        document.getElementById("correoUsuario").value =
        partes[0];



        document.getElementById("dominio").value =
        "@" + partes[1];


    }





    // ==========================
    // IMAGEN
    // ==========================


	const preview =
	document.getElementById("previewFoto");


	if(boton.dataset.imagen 
	    && boton.dataset.imagen.trim() !== ""){


	    preview.src =
	    boton.dataset.imagen;


	}else{


	    preview.src =
	    "/imgs/perfil.png";


	}


}

let usuarioPermisosActual = null;

async function abrirPermisos(boton){

    usuarioPermisosActual =
        boton.dataset.id;


    document.getElementById(
        "modalPermisos"
    ).style.display = "flex";


    const todos =
        await fetch("/usuarios/permisos")
        .then(r => r.json());


    const usuario =
        await fetch(
            "/usuarios/permisos/" +
            usuarioPermisosActual
        ).then(r => r.json());


    const idsUsuario =
        usuario.map(p => p.id);


    let html = "";


    todos.forEach(p => {

        html += `

            <label class="permiso-item">

                <input
                    type="checkbox"
                    value="${p.id}"

                    ${idsUsuario.includes(p.id)
                        ? "checked"
                        : ""}

                >

                ${p.nombre}

            </label>

        `;

    });


    document.getElementById(
        "listaPermisos"
    ).innerHTML = html;

}



function cerrarModalPermisos(){

    document.getElementById(
        "modalPermisos"
    ).style.display = "none";

}


async function guardarPermisos(){

    const seleccionados =
    [...document.querySelectorAll(
        "#listaPermisos input:checked"
    )]
    .map(c => Number(c.value));


    await fetch(

        "/usuarios/permisos/" +
        usuarioPermisosActual,

        {

            method:"POST",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify(
                seleccionados
            )

        }

    );


	cerrarModalPermisos();

	mostrarToast(
	    "Permisos actualizados correctamente"
	);
}


function mostrarToast(mensaje){

    const toast =
    document.getElementById("mensajeToast");

    const texto =
    document.getElementById("textoToast");


    texto.innerText = mensaje;


    toast.classList.add("mostrar");


    setTimeout(function(){

        toast.classList.remove("mostrar");

    },3000);

}


/* ==========================
   BUSCADOR DE USUARIOS
========================== */


document.addEventListener("DOMContentLoaded", function(){


    const buscador =
    document.getElementById("buscadorUsuarios");



    if(buscador){


        buscador.addEventListener("keyup", function(){


            let texto =
            this.value.toLowerCase();



            let filas =
            document.querySelectorAll(
                "tbody tr"
            );



            filas.forEach(function(fila){


                let contenido =
                fila.textContent.toLowerCase();



                if(contenido.includes(texto)){


                    fila.style.display = "";

                }else{


                    fila.style.display = "none";

                }



            });



        });



    }


});

/* ==========================
   VER IMAGEN GRANDE
========================== */


const imagenes =
document.querySelectorAll(".ver-imagen");


const modalImagen =
document.getElementById("modalImagenPerfil");


const imagenGrande =
document.getElementById("imagenGrande");


const cerrarImagen =
document.getElementById("cerrarImagen");



imagenes.forEach(img => {


    img.addEventListener("click", function(){


        imagenGrande.src =
        this.dataset.imagen;


        modalImagen.style.display =
        "flex";


    });


});




cerrarImagen.addEventListener("click", function(){


    modalImagen.style.display =
    "none";


});




modalImagen.addEventListener("click", function(e){


    if(e.target === modalImagen){


        modalImagen.style.display =
        "none";


    }


});