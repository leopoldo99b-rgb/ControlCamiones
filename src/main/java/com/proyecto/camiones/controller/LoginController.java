package com.proyecto.camiones.controller;

import java.time.LocalDateTime;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.proyecto.camiones.model.Usuario;
import com.proyecto.camiones.repository.UsuarioRepository;

import jakarta.servlet.http.HttpSession;


@Controller
public class LoginController {


    private final UsuarioRepository usuarioRepository;

    private final DashboardController dashboardController;


    public LoginController(
            UsuarioRepository usuarioRepository,
            DashboardController dashboardController
    ) {

        this.usuarioRepository =
                usuarioRepository;

        this.dashboardController =
                dashboardController;

    }


    /* =====================================================
     * LOGIN
     * ===================================================== */

    @GetMapping("/")
    public String login() {

        return "login";

    }


    /* =====================================================
     * DASHBOARD
     *
     * IMPORTANTE:
     *
     * Este es el ÚNICO lugar donde se define:
     *
     * GET /dashboard
     *
     * DashboardController NO debe tener
     * @GetMapping("/dashboard").
     * ===================================================== */

    @GetMapping("/dashboard")
    public String dashboard(
            HttpSession session,
            Model model
    ) {


        /* =================================================
         * USUARIO DE SESIÓN
         * ================================================= */

        Usuario usuarioSesion =
                (Usuario) session.getAttribute(
                        "usuarioLogueado"
                );


        /*
         * Si no existe usuario en sesión,
         * regresar al login.
         */

        if (
                usuarioSesion == null ||
                usuarioSesion.getId() == null
        ) {

            session.invalidate();

            return "redirect:/";

        }


        /* =================================================
         * RECUPERAR USUARIO ACTUALIZADO
         * DESDE BASE DE DATOS
         * ================================================= */

        Usuario usuarioActualizado =
                usuarioRepository
                        .findById(
                                usuarioSesion.getId()
                        )
                        .orElse(null);


        /*
         * Si el usuario ya no existe,
         * cerrar sesión.
         */

        if (usuarioActualizado == null) {

            session.invalidate();

            return "redirect:/";

        }


        /* =================================================
         * CARGAR PERMISOS
         *
         * Esto evita problemas de LazyInitialization
         * cuando Thymeleaf acceda a los permisos.
         * ================================================= */

        if (
                usuarioActualizado.getPermisos() != null
        ) {

            usuarioActualizado
                    .getPermisos()
                    .size();

        }


        /* =================================================
         * ACTUALIZAR USUARIO EN SESIÓN
         * ================================================= */

        session.setAttribute(
                "usuarioLogueado",
                usuarioActualizado
        );


        /* =================================================
         * USUARIO PARA THYMELEAF
         * ================================================= */

        model.addAttribute(
                "usuario",
                usuarioActualizado
        );


        /* =================================================
         * CARGAR DATOS DEL DASHBOARD
         *
         * Aquí DashboardController solamente prepara
         * las estadísticas. NO maneja ninguna URL.
         * ================================================= */

        dashboardController
                .cargarDatosDashboard(
                        model
                );


        /* =================================================
         * MOSTRAR DASHBOARD
         * ================================================= */

        return "dashboard";

    }


    /* =====================================================
     * LOGIN
     * ===================================================== */

    @PostMapping("/login")
    public String ingresar(

            @RequestParam("usuario")
            String username,

            @RequestParam("password")
            String password,

            HttpSession session,

            Model model

    ) {


        /* =================================================
         * BUSCAR USUARIO
         * ================================================= */

        Usuario usuario =
                usuarioRepository
                        .findByUsuarioAndPassword(
                                username,
                                password
                        );


        /* =================================================
         * USUARIO ENCONTRADO
         * ================================================= */

        if (usuario != null) {


            /* =============================================
             * REGISTRAR ÚLTIMA ACTIVIDAD
             * ============================================= */

            usuario.setUltimaActividad(
                    LocalDateTime.now()
            );


            usuarioRepository.save(
                    usuario
            );


            /* =============================================
             * INICIALIZAR PERMISOS
             *
             * Evita problemas al acceder a los permisos
             * posteriormente desde Thymeleaf.
             * ============================================= */

            if (
                    usuario.getPermisos() != null
            ) {

                usuario
                        .getPermisos()
                        .size();

            }


            /* =============================================
             * GUARDAR USUARIO EN SESIÓN
             * ============================================= */

            session.setAttribute(
                    "usuarioLogueado",
                    usuario
            );


            /* =============================================
             * IR AL DASHBOARD
             * ============================================= */

            return "redirect:/dashboard";

        }


        /* =================================================
         * LOGIN INCORRECTO
         * ================================================= */

        model.addAttribute(
                "error",
                "Usuario o contraseña incorrectos"
        );


        return "login";

    }


    /* =====================================================
     * CERRAR SESIÓN
     * ===================================================== */

    @GetMapping("/logout")
    public String cerrarSesion(
            HttpSession session
    ) {


        /* =================================================
         * RECUPERAR USUARIO
         * ================================================= */

        Usuario usuario =
                (Usuario) session.getAttribute(
                        "usuarioLogueado"
                );


        /* =================================================
         * REGISTRAR ÚLTIMA ACTIVIDAD
         * ================================================= */

        if (usuario != null) {


            usuario.setUltimaActividad(
                    LocalDateTime.now()
            );


            usuarioRepository.save(
                    usuario
            );

        }


        /* =================================================
         * INVALIDAR SESIÓN
         * ================================================= */

        session.invalidate();


        /* =================================================
         * REGRESAR AL LOGIN
         * ================================================= */

        return "redirect:/";

    }

}