document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       ELEMENTOS DEL MENU
       ========================================================= */

    const menuBtn = document.getElementById("menu-btn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    const MOBILE_BREAKPOINT = 1000;


    /* =========================================================
       MENU RESPONSIVE
       ========================================================= */

    function isMobile() {

        return window.innerWidth <= MOBILE_BREAKPOINT;

    }


    function openMenu() {

        if (!sidebar || !menuBtn) {
            return;
        }

        sidebar.classList.add("show");

        if (overlay) {
            overlay.classList.add("show");
        }

        document.body.classList.add("menu-open");

        menuBtn.setAttribute(
            "aria-expanded",
            "true"
        );

        menuBtn.setAttribute(
            "aria-label",
            "Cerrar menú"
        );


        const icon = menuBtn.querySelector("i");

        if (icon) {

            icon.classList.remove("fa-bars");

            icon.classList.add("fa-xmark");

        }

    }


    function closeMenu() {

        if (!sidebar || !menuBtn) {
            return;
        }

        sidebar.classList.remove("show");

        if (overlay) {
            overlay.classList.remove("show");
        }

        document.body.classList.remove("menu-open");

        menuBtn.setAttribute(
            "aria-expanded",
            "false"
        );

        menuBtn.setAttribute(
            "aria-label",
            "Abrir menú"
        );


        const icon = menuBtn.querySelector("i");

        if (icon) {

            icon.classList.remove("fa-xmark");

            icon.classList.add("fa-bars");

        }

    }


    function toggleMenu() {

        if (!sidebar) {
            return;
        }


        if (sidebar.classList.contains("show")) {

            closeMenu();

        } else {

            openMenu();

        }

    }


    /* =========================================================
       BOTON HAMBURGUESA
       ========================================================= */

    if (menuBtn && sidebar) {

        menuBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                toggleMenu();

            }
        );

    }


    /* =========================================================
       OVERLAY
       ========================================================= */

    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                closeMenu();

            }
        );

    }


    /* =========================================================
       CERRAR AL HACER CLICK FUERA
       ========================================================= */

    document.addEventListener(
        "click",
        function (event) {

            if (!isMobile()) {
                return;
            }

            if (!sidebar || !menuBtn) {
                return;
            }


            const menuAbierto =
                sidebar.classList.contains("show");


            if (!menuAbierto) {
                return;
            }


            const clickDentroSidebar =
                sidebar.contains(event.target);


            const clickEnBoton =
                menuBtn.contains(event.target);


            if (
                !clickDentroSidebar &&
                !clickEnBoton
            ) {

                closeMenu();

            }

        }
    );


    /* =========================================================
       CERRAR AL PRESIONAR ESC
       ========================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeMenu();

            }

        }
    );


    /* =========================================================
       CERRAR AL SELECCIONAR UNA OPCION
       ========================================================= */

    if (sidebar) {

        const links =
            sidebar.querySelectorAll(
                ".nav-item"
            );


        links.forEach(function (link) {

            link.addEventListener(
                "click",
                function () {

                    if (isMobile()) {

                        closeMenu();

                    }

                }
            );

        });

    }


    /* =========================================================
       CAMBIO DE TAMAÑO DE PANTALLA
       ========================================================= */

    let resizeTimer;


    window.addEventListener(
        "resize",
        function () {

            clearTimeout(resizeTimer);


            resizeTimer =
                setTimeout(
                    function () {

                        /*
                         * Si pasamos de móvil
                         * a escritorio, limpiamos
                         * completamente el estado.
                         */

                        if (!isMobile()) {

                            closeMenu();

                        }

                    },
                    100
                );

        }
    );


    /* =========================================================
       ESTADO INICIAL
       ========================================================= */

    closeMenu();



    /* =========================================================
       FECHA ACTUAL
       ========================================================= */

    const fecha =
        document.getElementById(
            "fechaActual"
        );


    if (fecha) {

        const ahora =
            new Date();


        fecha.textContent =
            ahora.toLocaleDateString(
                "es-HN",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    }



    /* =========================================================
       DATOS DEL DASHBOARD
       ========================================================= */

    const viajesLabels =
        Array.isArray(window.viajesLabels)
            ? window.viajesLabels
            : [];


    const viajesData =
        Array.isArray(window.viajesData)
            ? window.viajesData
            : [];



    /* =========================================================
       GRAFICA DE VIAJES
       ========================================================= */

    const viajesCanvas =
        document.getElementById(
            "graficaViajes"
        );


    if (
        viajesCanvas &&
        typeof Chart !== "undefined"
    ) {

        const datos =
            viajesData.map(
                function (valor) {

                    return Number(valor) || 0;

                }
            );


        let labels =
            viajesLabels;


        /* =====================================================
           GENERAR FECHAS SI NO VIENEN DEL BACKEND
           ===================================================== */

        if (
            !Array.isArray(labels) ||
            labels.length === 0
        ) {

            labels = [];

            const hoy =
                new Date();


            for (
                let i = 6;
                i >= 0;
                i--
            ) {

                const fechaGrafica =
                    new Date(hoy);


                fechaGrafica.setDate(
                    hoy.getDate() - i
                );


                const dia =
                    String(
                        fechaGrafica.getDate()
                    ).padStart(2, "0");


                const mes =
                    String(
                        fechaGrafica.getMonth() + 1
                    ).padStart(2, "0");


                labels.push(
                    dia + "/" + mes
                );

            }

        }


        /* =====================================================
           ASEGURAR 7 DATOS
           ===================================================== */

        const datosFinales =
            datos.length === 7
                ? datos
                : [0, 0, 0, 0, 0, 0, 0];


        const labelsFinales =
            labels.length === 7
                ? labels
                : [
                    "Día 1",
                    "Día 2",
                    "Día 3",
                    "Día 4",
                    "Día 5",
                    "Día 6",
                    "Día 7"
                ];



        /* =====================================================
           EVITAR GRAFICAS DUPLICADAS
           ===================================================== */

        const graficaExistente =
            Chart.getChart(
                viajesCanvas
            );


        if (graficaExistente) {

            graficaExistente.destroy();

        }



        /* =====================================================
           CREAR GRAFICA
           ===================================================== */

        new Chart(
            viajesCanvas,
            {

                type: "line",


                data: {

                    labels:
                        labelsFinales,


                    datasets: [

                        {

                            label:
                                "Viajes registrados",

                            data:
                                datosFinales,

                            borderWidth:
                                3,

                            tension:
                                0.4,

                            fill:
                                true,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                7,

                            pointHitRadius:
                                15

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        intersect:
                            false,

                        mode:
                            "index"

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        },


                        tooltip: {

                            enabled:
                                true,


                            callbacks: {

                                label:
                                    function (context) {

                                        return (
                                            " Viajes: " +
                                            context.parsed.y
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            },

                            grid: {

                                color:
                                    "#edf0f5"

                            }

                        },


                        x: {

                            grid: {

                                display:
                                    false

                            }

                        }

                    }

                }

            }
        );


        console.log(
            "Labels de viajes:",
            labelsFinales
        );


        console.log(
            "Datos de viajes:",
            datosFinales
        );

    }



    /* =========================================================
       ANIMACION DE TARJETAS
       ========================================================= */

    const cards =
        document.querySelectorAll(
            ".kpi-card"
        );


    cards.forEach(
        function (card, index) {

            card.style.animationDelay =
                `${index * 80}ms`;

        }
    );



    /* =========================================================
       ANIMACION DE PANELES
       ========================================================= */

    const panels =
        document.querySelectorAll(
            ".dashboard-panel"
        );


    panels.forEach(
        function (panel, index) {

            panel.style.animationDelay =
                `${index * 100}ms`;

        }
    );

});