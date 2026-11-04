document.addEventListener("DOMContentLoaded", function () {

    /* ===== MENÚ RESPONSIVE ===== */
    const menuBtn = document.getElementById("menu-btn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const MOBILE_BREAKPOINT = 1000;

    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

    function setMenu(open) {
        if (!sidebar || !menuBtn) return;

        sidebar.classList.toggle("show", open);
        if (overlay) overlay.classList.toggle("show", open);
        document.body.classList.toggle("menu-open", open);

        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");

        const icon = menuBtn.querySelector("i");
        if (icon) {
            icon.classList.toggle("fa-xmark", open);
            icon.classList.toggle("fa-bars", !open);
        }
    }

    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            setMenu(!sidebar.classList.contains("show"));
        });
    }

    if (overlay) overlay.addEventListener("click", () => setMenu(false));

    document.addEventListener("click", function (e) {
        if (!isMobile() || !sidebar || !menuBtn) return;
        if (!sidebar.classList.contains("show")) return;
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setMenu(false);
    });

    if (sidebar) {
        sidebar.querySelectorAll(".nav-item").forEach(function (link) {
            link.addEventListener("click", function () {
                if (isMobile()) setMenu(false);
            });
        });
    }

    let resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (!isMobile()) setMenu(false);
        }, 100);
    });

    setMenu(false);


    /* ===== FECHA ACTUAL ===== */
    const fecha = document.getElementById("fechaActual");
    if (fecha) {
        fecha.textContent = new Date().toLocaleDateString("es-HN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }


    /* ===== GRÁFICA DE VIAJES ===== */
    const canvas = document.getElementById("graficaViajes");

    if (canvas && typeof Chart !== "undefined") {

        const datos = (Array.isArray(window.viajesData) ? window.viajesData : [])
            .map(v => Number(v) || 0);

        let labels = Array.isArray(window.viajesLabels) ? window.viajesLabels : [];

        // Si el backend no envía fechas, se generan los últimos 7 días
        if (labels.length === 0) {
            const hoy = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(hoy);
                d.setDate(hoy.getDate() - i);
                labels.push(
                    String(d.getDate()).padStart(2, "0") + "/" +
                    String(d.getMonth() + 1).padStart(2, "0")
                );
            }
        }

        const datosFinales = datos.length === 7 ? datos : [0, 0, 0, 0, 0, 0, 0];
        const labelsFinales = labels.length === 7
            ? labels
            : ["Día 1", "Día 2", "Día 3", "Día 4", "Día 5", "Día 6", "Día 7"];

        const existente = Chart.getChart(canvas);
        if (existente) existente.destroy();

        const ACCENT = "#d97706";
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(245, 158, 11, 0.22)");
        gradient.addColorStop(1, "rgba(245, 158, 11, 0)");

        new Chart(canvas, {
            type: "line",
            data: {
                labels: labelsFinales,
                datasets: [{
                    label: "Viajes registrados",
                    data: datosFinales,
                    borderColor: ACCENT,
                    backgroundColor: gradient,
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: true,
                    pointBackgroundColor: "#fff",
                    pointBorderColor: ACCENT,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointHitRadius: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: "index" },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#121821",
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: ctx => " Viajes: " + ctx.parsed.y
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        border: { display: false },
                        ticks: { precision: 0, color: "#8a95a5" },
                        grid: { color: "#eef0f3" }
                    },
                    x: {
                        border: { display: false },
                        ticks: { color: "#8a95a5" },
                        grid: { display: false }
                    }
                }
            }
        });
    }


    /* ===== DONA DE INVENTARIO ===== */
    const canvasInv = document.getElementById("graficaInventario");

    if (canvasInv && typeof Chart !== "undefined") {

        const nombresInv = ["Disponible", "Stock bajo", "Agotado"];
        const coloresInv = ["#16a34a", "#f59e0b", "#dc2626"];
        const fmtEntero = new Intl.NumberFormat("en-US");
        const fmtValor = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        let datosInv = [0, 0, 0];   // disponible, stock bajo, agotado

        const sumar = d => d.reduce((a, b) => a + b, 0);
        const porcentaje = i => { const t = sumar(datosInv); return t ? Math.round(datosInv[i] * 100 / t) : 0; };
        const poner = (id, texto) => { const el = document.getElementById(id); if (el) el.textContent = texto; };

        const existenteInv = Chart.getChart(canvasInv);
        if (existenteInv) existenteInv.destroy();

        const graficaInv = new Chart(canvasInv, {
            type: "doughnut",
            data: {
                labels: nombresInv,
                datasets: [{
                    data: [1],
                    backgroundColor: ["#e3e6eb"],
                    borderWidth: 0,
                    spacing: 3,
                    borderRadius: 6,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "74%",
                layout: { padding: 8 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: false,
                        backgroundColor: "#121821",
                        padding: 10,
                        callbacks: {
                            label: c => " " + c.label + ": " + c.parsed + " (" + porcentaje(c.dataIndex) + "%)"
                        }
                    }
                }
            }
        });

        // Pinta la dona, la leyenda y el resumen con los datos recibidos
        function pintarInventario(r) {
            datosInv = [Number(r.disponibles) || 0, Number(r.bajos) || 0, Number(r.agotados) || 0];
            const total = sumar(datosInv);

            const ds = graficaInv.data.datasets[0];
            ds.data = total ? datosInv : [1];                      // sin piezas: anillo gris
            ds.backgroundColor = total ? coloresInv : ["#e3e6eb"];
            graficaInv.options.plugins.tooltip.enabled = total > 0;
            graficaInv.update();

            poner("inv-total", String(total));
            poner("inv-disponibles", String(datosInv[0]));
            poner("inv-bajos", String(datosInv[1]));
            poner("inv-agotados", String(datosInv[2]));
            poner("inv-valor", "L " + fmtValor.format(Number(r.valor) || 0));
            poner("inv-unidades", fmtEntero.format(Number(r.unidades) || 0));
            poner("inv-reponer", String(datosInv[1] + datosInv[2]));

            document.querySelectorAll("[data-inv-pct]").forEach(function (el) {
                el.textContent = porcentaje(Number(el.dataset.invPct)) + "%";
            });
            document.querySelectorAll("[data-inv-bar]").forEach(function (el) {
                const i = Number(el.dataset.invBar);
                el.style.width = (total ? datosInv[i] * 100 / total : 0) + "%";
            });
        }

        // 1) Datos que la página trae desde el servidor
        const inicial = Array.isArray(window.inventarioData) ? window.inventarioData : [];
        pintarInventario({
            disponibles: inicial[0], bajos: inicial[1], agotados: inicial[2],
            valor: 0, unidades: 0
        });

        // 2) Datos frescos: así se actualiza aunque la página venga de la caché del navegador
        async function actualizarInventario() {
            try {
                const resp = await fetch("/api/inventario/resumen", {
                    cache: "no-store",
                    headers: { "Accept": "application/json" }
                });
                if (!resp.ok) return;
                pintarInventario(await resp.json());
            } catch (e) { /* si falla, se queda con lo que ya se muestra */ }
        }

        actualizarInventario();
        window.addEventListener("pageshow", function (e) { if (e.persisted) actualizarInventario(); });
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") actualizarInventario();
        });
        setInterval(actualizarInventario, 30000);
    }
});