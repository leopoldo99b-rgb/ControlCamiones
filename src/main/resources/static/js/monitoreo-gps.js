
"use strict";

/**
 * Transportes CHC - Monitoreo GPS
 *
 * Fuente de datos:
 *   GET /gps/vehiculos
 *
 * Respuesta esperada:
 *   { status: "ok", trackers: [...] }
 *
 * Requisitos:
 *   - Leaflet cargado en el HTML.
 *   - Un contenedor con id="mapaMonitoreo" o id="fleetMap".
 *   - No utiliza vehículos ni coordenadas ficticias.
 */
(() => {
    // =========================================================
    // 1. CONFIGURACIÓN
    // =========================================================

    const CONFIG = Object.freeze({
        apiUrl: "/gps/vehiculos",
        refreshIntervalMs: 60_000,
        locale: "es-HN",
        timeZone: "America/Tegucigalpa",

        map: Object.freeze({
            center: [14.6000, -87.8333],
            zoom: 9,
            maxFitZoom: 15,
            maxZoom: 19,

            darkTiles:
                "https://basemap.queeniemella.cc/tiles/countries/{z}/{x}/{y}.png",

            lightTiles:
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

            darkAttribution:
                '&copy; <a href="https://queeniemella.cc" target="_blank" rel="noopener noreferrer">queeniemella.cc</a> | ' +
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',

            lightAttribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        })
    });

    const STATUS = Object.freeze({
        MOVING: "moving",
        STOPPED: "stopped",
        UNKNOWN: "unknown"
    });

    // =========================================================
    // 2. ESTADO DE LA APLICACIÓN
    // =========================================================

    const state = {
        map: null,
        tileLayers: {},
        activeTile: "dark",
        markerLayer: null,
        markers: new Map(),
        vehicles: [],
        selectedId: null,
        loading: false,
        initialized: false,
        destroyed: false,
        refreshTimer: null,
        lastUpdated: null,
        lastError: null
    };

    // Función pública opcional para actualizar el monitoreo
    // desde otros scripts de la aplicación.
    window.TransportesCHCGPS = {
        refresh: () => loadVehicles(),
        fitFleet: () => fitFleet(),
        selectVehicle: id => selectVehicle(id),
        getVehicles: () => state.vehicles.map(vehicle => ({ ...vehicle })),
        getLastUpdated: () => state.lastUpdated
    };

    // =========================================================
    // 3. UTILIDADES
    // =========================================================

    const $ = id => document.getElementById(id);

    function setText(id, value) {
        const element = $(id);

        if (element) {
            element.textContent = String(value ?? "");
        }
    }

    function setConnectionStatus(message, isError = false) {
        const element = $("connectionLabel");

        if (element) {
            element.textContent = message;
            element.classList.toggle("error-text", isError);
        }

        setText("mapStatus", message);
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function toNumber(value) {
        if (
            value === null ||
            value === undefined ||
            value === "" ||
            typeof value === "boolean"
        ) {
            return null;
        }

        const number = Number(value);

        return Number.isFinite(number) ? number : null;
    }

    function firstValue(object, keys) {
        if (!object || typeof object !== "object") {
            return null;
        }

        for (const key of keys) {
            const value = object[key];

            if (
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
            ) {
                return value;
            }
        }

        return null;
    }

    function isValidCoordinates(latitude, longitude) {
        return (
            latitude !== null &&
            longitude !== null &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180 &&
            !(latitude === 0 && longitude === 0)
        );
    }

    function normalizeText(value, fallback) {
        const text = String(value ?? "").trim();

        if (
            !text ||
            text.toLowerCase() === "null" ||
            text.toLowerCase() === "undefined" ||
            text === "-"
        ) {
            return fallback;
        }

        return text;
    }

    // =========================================================
    // 4. FECHAS
    // =========================================================

    function parseDate(value) {
        if (value === null || value === undefined || value === "") {
            return null;
        }

        // Unix timestamp en segundos o milisegundos.
        if (
            typeof value === "number" ||
            /^\d{10,13}$/.test(String(value).trim())
        ) {
            let timestamp = Number(value);

            if (timestamp > 0 && timestamp < 100_000_000_000) {
                timestamp *= 1000;
            }

            const date = new Date(timestamp);

            return Number.isNaN(date.getTime()) ? null : date;
        }

        const text = String(value).trim();

        // La fecha de VTracker suele llegar sin zona horaria:
        // "2026-10-17 13:18:18".
        // Se interpretan sus componentes como hora local del navegador.
        const match = text.match(
            /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
        );

        let date;

        if (match) {
            date = new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3]),
                Number(match[4]),
                Number(match[5]),
                Number(match[6])
            );
        } else {
            date = new Date(text);
        }

        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(value) {
        const date = parseDate(value);

        if (!date) {
            return "No disponible";
        }

        return new Intl.DateTimeFormat(CONFIG.locale, {
            timeZone: CONFIG.timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(date);
    }

    function formatTime(date) {
        return new Intl.DateTimeFormat(CONFIG.locale, {
            timeZone: CONFIG.timeZone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(date);
    }

    function getDateKey(value) {
        const date = parseDate(value);

        if (!date) {
            return null;
        }

        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: CONFIG.timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(date);

        const result = {};

        parts.forEach(part => {
            if (part.type !== "literal") {
                result[part.type] = part.value;
            }
        });

        return `${result.year}-${result.month}-${result.day}`;
    }

    // =========================================================
    // 5. INTERPRETACIÓN DE LOS VEHÍCULOS REALES
    // =========================================================

    function getDriverName(raw) {
        const value = firstValue(raw, [
            "Driver_Name",
            "DriverName",
            "Driver",
            "driver_name",
            "driverName",
            "driver",
            "Conductor",
            "conductor",
            "Nombre_Conductor",
            "NombreConductor",
            "Assigned_Driver",
            "AssignedDriver",
            "assigned_driver",
            "assignedDriver"
        ]);

        if (value && typeof value === "object") {
            return normalizeText(
                firstValue(value, [
                    "name",
                    "Name",
                    "nombre",
                    "Nombre",
                    "fullName",
                    "Full_Name"
                ]),
                "Sin conductor asignado"
            );
        }

        return normalizeText(value, "Sin conductor asignado");
    }

    function determineStatus(speed, ignition, motionStop, hasCoordinates) {
        if (!hasCoordinates) {
            return STATUS.UNKNOWN;
        }

        // Una velocidad positiva indica movimiento.
        if (speed !== null && speed > 0) {
            return STATUS.MOVING;
        }

        // Si el GPS informa velocidad cero, se considera detenido.
        if (speed !== null && speed === 0) {
            return STATUS.STOPPED;
        }

        // Si no hay velocidad, se usan datos complementarios.
        if (ignition === 0 || (motionStop !== null && motionStop > 0)) {
            return STATUS.STOPPED;
        }

        if (ignition === 1) {
            return STATUS.MOVING;
        }

        return STATUS.UNKNOWN;
    }

    function normalizeVehicle(raw, index) {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
            return null;
        }

        const id = firstValue(raw, [
            "Vehicle_ID",
            "vehicle_id",
            "vehicleId",
            "id"
        ]);

        const name = firstValue(raw, [
            "Vehicle_Name",
            "vehicle_name",
            "vehicleName",
            "name"
        ]);

        const plate = firstValue(raw, [
            "Vehicle_Plate",
            "vehicle_plate",
            "plate",
            "registration"
        ]);

        const latitude = toNumber(firstValue(raw, [
            "Tracker_Latitude",
            "latitude",
            "lat"
        ]));

        const longitude = toNumber(firstValue(raw, [
            "Tracker_Longitude",
            "longitude",
            "lng",
            "lon"
        ]));

        const speed = toNumber(firstValue(raw, [
            "Tracker_Speed",
            "speed",
            "velocity"
        ]));

        const ignition = toNumber(firstValue(raw, [
            "Tracker_Ignition",
            "ignition"
        ]));

        const motionStop = toNumber(firstValue(raw, [
            "Tracker_MotionStop",
            "motionStop"
        ]));

        const course = toNumber(firstValue(raw, [
            "Tracker_Course",
            "course"
        ]));

        const timestamp = firstValue(raw, [
            "Tracker_Datetime",
            "datetime",
            "timestamp"
        ]);

        const lastUpdate = firstValue(raw, [
            "Tracker_LastUpdate",
            "lastUpdate"
        ]);

        const address = firstValue(raw, [
            "Tracker_Location",
            "address",
            "location"
        ]);

        const group = firstValue(raw, [
            "Group_Name",
            "group_name",
            "group"
        ]);

        const hasCoordinates = isValidCoordinates(latitude, longitude);

        const vehicleId = normalizeText(
            id,
            `unidad-${index + 1}`
        );

        const vehicle = {
            id: vehicleId,
            name: normalizeText(name, normalizeText(plate, `Vehículo ${index + 1}`)),
            plate: normalizeText(plate, "Sin placa"),
            driver: getDriverName(raw),
            latitude,
            longitude,
            speed,
            ignition,
            motionStop,
            course,
            timestamp: timestamp ?? lastUpdate,
            lastUpdate,
            address: normalizeText(address, "Ubicación no disponible"),
            group: normalizeText(group, "Sin grupo"),
            odometer: toNumber(raw.Vehicle_Odometer),
            engineHours: toNumber(raw.Vehicle_Engine_Hours),
            hasCoordinates,
            status: STATUS.UNKNOWN
        };

        vehicle.status = determineStatus(
            vehicle.speed,
            vehicle.ignition,
            vehicle.motionStop,
            vehicle.hasCoordinates
        );

        return vehicle;
    }

    function extractVehicles(payload) {
        if (Array.isArray(payload)) {
            return payload;
        }

        if (!payload || typeof payload !== "object") {
            throw new Error("La API no devolvió un objeto JSON válido.");
        }

        if (
            payload.status &&
            String(payload.status).toLowerCase() !== "ok"
        ) {
            throw new Error(
                payload.message ||
                payload.error ||
                `VTracker devolvió el estado: ${payload.status}`
            );
        }

        // Estructura que compartiste desde VTracker.
        if (Array.isArray(payload.trackers)) {
            return payload.trackers;
        }

        // Compatibilidad con otras estructuras.
        for (const key of ["vehicles", "vehiculos", "data", "results", "items"]) {
            if (Array.isArray(payload[key])) {
                return payload[key];
            }

            if (payload[key] && typeof payload[key] === "object") {
                const nested = extractVehicles(payload[key]);

                if (nested.length > 0) {
                    return nested;
                }
            }
        }

        throw new Error(
            'No se encontró la lista de vehículos en la respuesta. Se esperaba "trackers".'
        );
    }

    // =========================================================
    // 6. ESTADOS Y FORMATO
    // =========================================================

    function statusText(status) {
        const labels = {
            [STATUS.MOVING]: "En movimiento",
            [STATUS.STOPPED]: "Detenido",
            [STATUS.UNKNOWN]: "Sin información"
        };

        return labels[status] || labels[STATUS.UNKNOWN];
    }

    function statusClass(status) {
        return Object.values(STATUS).includes(status)
            ? status
            : STATUS.UNKNOWN;
    }

    function formatSpeed(speed) {
        return speed === null ? "—" : `${speed} km/h`;
    }

    function formatNumber(value, decimals = 2) {
        if (value === null || value === undefined || !Number.isFinite(value)) {
            return "—";
        }

        return new Intl.NumberFormat(CONFIG.locale, {
            maximumFractionDigits: decimals
        }).format(value);
    }

    // =========================================================
    // 7. MAPA LEAFLET: UNA SOLA INSTANCIA
    // =========================================================

    function getMapElement() {
        return $("mapaMonitoreo") || $("fleetMap");
    }

    function initializeMap() {
        const element = getMapElement();

        if (!element) {
            console.error(
                'No se encontró el mapa. Se necesita id="mapaMonitoreo" o id="fleetMap".'
            );
            return false;
        }

        if (typeof L === "undefined") {
            setConnectionStatus("No se pudo cargar Leaflet", true);
            console.error("Leaflet no está cargado en el HTML.");
            return false;
        }

        // Evita inicializar un segundo mapa si ya existe.
        if (state.map) {
            return true;
        }

        state.map = L.map(element, {
            zoomControl: false,
            preferCanvas: true
        }).setView(CONFIG.map.center, CONFIG.map.zoom);

        state.tileLayers.dark = L.tileLayer(CONFIG.map.darkTiles, {
            maxZoom: CONFIG.map.maxZoom,
            attribution: CONFIG.map.darkAttribution
        });

        state.tileLayers.light = L.tileLayer(CONFIG.map.lightTiles, {
            subdomains: ["a", "b", "c"],
            maxZoom: CONFIG.map.maxZoom,
            attribution: CONFIG.map.lightAttribution
        });

        state.tileLayers.dark.addTo(state.map);
        state.activeTile = "dark";

        L.control.zoom({
            position: "topright"
        }).addTo(state.map);

        state.markerLayer = L.layerGroup().addTo(state.map);

        window.setTimeout(() => {
            state.map?.invalidateSize();
        }, 200);

        return true;
    }

    function markerIcon(status, course) {
        const rotation = Number.isFinite(course) ? course : 0;

        return L.divIcon({
            className: "gps-marker-wrapper",
            html: `
                <div
                    class="gps-truck-icon ${statusClass(status)}"
                    style="--truck-course: ${rotation}deg"
                    title="${escapeHtml(statusText(status))}"
                >
                    <i class="bi bi-truck-front-fill" aria-hidden="true"></i>
                </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -18]
        });
    }

    function buildPopup(vehicle) {
        const ignitionText =
            vehicle.ignition === 1 ? "Encendido" :
            vehicle.ignition === 0 ? "Apagado" :
            "Sin información";

        return `
            <div class="gps-popup">
                <div class="gps-popup-title">
                    <i class="bi bi-truck-front-fill" aria-hidden="true"></i>
                    ${escapeHtml(vehicle.plate)}
                </div>

                <div class="gps-popup-line">
                    <strong>${escapeHtml(vehicle.name)}</strong>
                </div>

                <div class="gps-popup-line">
                    <i class="bi bi-person" aria-hidden="true"></i>
                    Conductor: ${escapeHtml(vehicle.driver)}
                </div>

                <div class="gps-popup-line">
                    <i class="bi bi-activity" aria-hidden="true"></i>
                    Estado: ${escapeHtml(statusText(vehicle.status))}
                </div>

                <div class="gps-popup-line">
                    <i class="bi bi-speedometer2" aria-hidden="true"></i>
                    Velocidad: ${escapeHtml(formatSpeed(vehicle.speed))}
                </div>

                <div class="gps-popup-line">
                    <i class="bi bi-power" aria-hidden="true"></i>
                    Motor: ${escapeHtml(ignitionText)}
                </div>

                <div class="gps-popup-line">
                    <i class="bi bi-geo-alt" aria-hidden="true"></i>
                    ${escapeHtml(vehicle.address)}
                </div>

                <div class="gps-popup-line">
                    <small>Último reporte: ${escapeHtml(formatDate(vehicle.timestamp))}</small>
                </div>
            </div>
        `;
    }

    function renderMap(vehicles) {
        if (!state.map || !state.markerLayer) {
            return;
        }

        state.markerLayer.clearLayers();
        state.markers.clear();

        const validVehicles = vehicles.filter(vehicle => vehicle.hasCoordinates);

        validVehicles.forEach(vehicle => {
            const marker = L.marker(
                [vehicle.latitude, vehicle.longitude],
                {
                    icon: markerIcon(vehicle.status, vehicle.course),
                    title: vehicle.name,
                    alt: vehicle.plate
                }
            );

            marker.bindPopup(buildPopup(vehicle));

            marker.on("click", () => {
                state.selectedId = vehicle.id;
                renderFleet();
                renderSelectedVehicle();
            });

            marker.addTo(state.markerLayer);
            state.markers.set(vehicle.id, marker);
        });

        setText(
            "mapStatus",
            `${validVehicles.length} unidad(es) con coordenadas GPS válidas`
        );
    }

    function fitFleet() {
        if (!state.map) {
            return;
        }

        const points = state.vehicles
            .filter(vehicle => vehicle.hasCoordinates)
            .map(vehicle => [vehicle.latitude, vehicle.longitude]);

        if (points.length === 1) {
            state.map.setView(points[0], CONFIG.map.maxFitZoom);
        } else if (points.length > 1) {
            state.map.fitBounds(points, {
                padding: [35, 35],
                maxZoom: CONFIG.map.maxFitZoom
            });
        } else {
            state.map.setView(CONFIG.map.center, CONFIG.map.zoom);
        }
    }

    function selectVehicle(id) {
        const vehicle = state.vehicles.find(item => item.id === String(id));

        if (!vehicle) {
            return;
        }

        state.selectedId = vehicle.id;

        renderFleet();
        renderSelectedVehicle();

        const marker = state.markers.get(vehicle.id);

        if (marker && state.map) {
            state.map.setView(
                marker.getLatLng(),
                Math.max(state.map.getZoom(), 14)
            );

            marker.openPopup();
        }
    }

    function toggleMapView() {
        if (!state.map) {
            return;
        }

        const button = $("btnVistaMapa");

        if (state.activeTile === "dark") {
            state.map.removeLayer(state.tileLayers.dark);
            state.tileLayers.light.addTo(state.map);
            state.activeTile = "light";

            if (button) {
                button.innerHTML =
                    '<i class="bi bi-moon-stars me-1" aria-hidden="true"></i> Vista oscura';
            }
        } else {
            state.map.removeLayer(state.tileLayers.light);
            state.tileLayers.dark.addTo(state.map);
            state.activeTile = "dark";

            if (button) {
                button.innerHTML =
                    '<i class="bi bi-sun me-1" aria-hidden="true"></i> Vista clara';
            }
        }

        window.setTimeout(() => state.map?.invalidateSize(), 100);
    }

    // =========================================================
    // 8. FILTROS
    // =========================================================

    function getFilteredVehicles() {
        const search = (
            $("fleetSearch")?.value ||
            $("mapSearch")?.value ||
            document.querySelector('.search-box input[type="search"]')?.value ||
            ""
        ).trim().toLocaleLowerCase("es");

        const selectedStatus = $("statusFilter")?.value || "all";

        return state.vehicles.filter(vehicle => {
            const text = [
                vehicle.name,
                vehicle.id,
                vehicle.plate,
                vehicle.driver,
                vehicle.address,
                vehicle.group
            ].join(" ").toLocaleLowerCase("es");

            const matchesSearch = !search || text.includes(search);

            const matchesStatus =
                selectedStatus === "all" ||
                vehicle.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }

    function getTableVehicles() {
        const from = $("dateFrom")?.value || "";
        const to = $("dateTo")?.value || "";
        const vehicleId = $("vehicleFilter")?.value || "all";

        return state.vehicles.filter(vehicle => {
            if (vehicleId !== "all" && vehicle.id !== vehicleId) {
                return false;
            }

            if (from || to) {
                const dateKey = getDateKey(vehicle.timestamp);

                if (!dateKey) {
                    return false;
                }

                if (from && dateKey < from) {
                    return false;
                }

                if (to && dateKey > to) {
                    return false;
                }
            }

            return true;
        });
    }

    // =========================================================
    // 9. INDICADORES
    // =========================================================

    function renderMetrics() {
        setText("totalVehicles", state.vehicles.length);
        setText("fleetCount", state.vehicles.length);

        setText(
            "movingVehicles",
            state.vehicles.filter(v => v.status === STATUS.MOVING).length
        );

        setText(
            "stoppedVehicles",
            state.vehicles.filter(v => v.status === STATUS.STOPPED).length
        );

        setText(
            "unknownVehicles",
            state.vehicles.filter(v => v.status === STATUS.UNKNOWN).length
        );
    }

    // =========================================================
    // 10. LISTA DE VEHÍCULOS
    // =========================================================

    function renderFleet() {
        const list = $("fleetList");

        if (!list) {
            return;
        }

        const vehicles = getFilteredVehicles();

        if (!vehicles.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-truck" aria-hidden="true"></i>
                    <strong>No hay unidades para mostrar</strong>
                    <span>Revisa los filtros o la información recibida de la API.</span>
                </div>
            `;
            return;
        }

        list.innerHTML = vehicles.map(vehicle => {
            const selected = vehicle.id === state.selectedId;
            const cls = statusClass(vehicle.status);

            return `
                <button
                    type="button"
                    class="fleet-item ${selected ? "selected" : ""}"
                    data-vehicle-id="${escapeHtml(vehicle.id)}"
                    aria-pressed="${selected}"
                >
                    <span class="fleet-item-icon ${cls}">
                        <i class="fa-solid fa-truck" aria-hidden="true"></i>
                    </span>

                    <span class="fleet-item-info">
                        <span class="fleet-item-name">
                            ${escapeHtml(vehicle.name)}
                        </span>

                        <span class="fleet-item-meta">
                            ${escapeHtml(vehicle.plate)}
                            · ${escapeHtml(vehicle.driver)}
                        </span>

                        <span class="status-label ${cls}">
                            ${escapeHtml(statusText(vehicle.status))}
                        </span>
                    </span>

                    <span class="fleet-item-right">
                        <span class="fleet-speed">
                            ${escapeHtml(vehicle.speed ?? "—")}
                            <small>${vehicle.speed === null ? "" : "km/h"}</small>
                        </span>
                    </span>
                </button>
            `;
        }).join("");
    }

    // =========================================================
    // 11. DETALLE DE LA UNIDAD SELECCIONADA
    // =========================================================

    function renderSelectedVehicle() {
        const container = $("selectedVehicle");

        if (!container) {
            return;
        }

        const vehicle = state.vehicles.find(
            item => item.id === state.selectedId
        );

        if (!vehicle) {
            container.innerHTML = `
                <div class="selected-empty">
                    <i class="fa-solid fa-location-arrow" aria-hidden="true"></i>
                    Selecciona una unidad para consultar sus detalles.
                </div>
            `;
            return;
        }

        const ignitionText =
            vehicle.ignition === 1 ? "Encendido" :
            vehicle.ignition === 0 ? "Apagado" :
            "Sin información";

        container.innerHTML = `
            <div class="selected-heading">
                <span class="selected-heading-icon">
                    <i class="fa-solid fa-truck" aria-hidden="true"></i>
                </span>

                <div>
                    <strong>${escapeHtml(vehicle.name)}</strong>
                    <small>${escapeHtml(statusText(vehicle.status))}</small>
                </div>
            </div>

            <div class="vehicle-detail-grid">
                <div class="detail-cell">
                    <span>Placa</span>
                    <strong>${escapeHtml(vehicle.plate)}</strong>
                </div>

                <div class="detail-cell">
                    <span>Conductor</span>
                    <strong>${escapeHtml(vehicle.driver)}</strong>
                </div>

                <div class="detail-cell">
                    <span>Velocidad</span>
                    <strong>${escapeHtml(formatSpeed(vehicle.speed))}</strong>
                </div>

                <div class="detail-cell">
                    <span>Motor</span>
                    <strong>${escapeHtml(ignitionText)}</strong>
                </div>

                <div class="detail-cell">
                    <span>Odómetro</span>
                    <strong>${escapeHtml(formatNumber(vehicle.odometer))}</strong>
                </div>

                <div class="detail-cell">
                    <span>Horas de motor</span>
                    <strong>${escapeHtml(formatNumber(vehicle.engineHours))}</strong>
                </div>

                <div class="detail-cell">
                    <span>Último reporte GPS</span>
                    <strong>${escapeHtml(formatDate(vehicle.timestamp))}</strong>
                </div>

                <div class="detail-cell">
                    <span>Latitud</span>
                    <strong>${escapeHtml(vehicle.latitude ?? "—")}</strong>
                </div>

                <div class="detail-cell">
                    <span>Longitud</span>
                    <strong>${escapeHtml(vehicle.longitude ?? "—")}</strong>
                </div>

                <div class="detail-cell">
                    <span>Grupo</span>
                    <strong>${escapeHtml(vehicle.group)}</strong>
                </div>

                <div class="detail-cell">
                    <span>Ubicación</span>
                    <strong>${escapeHtml(vehicle.address)}</strong>
                </div>
            </div>
        `;
    }

    // =========================================================
    // 12. TABLA DE VEHÍCULOS
    // =========================================================

    function renderTable() {
        const table = $("vehicleTable");

        if (table) {
            const vehicles = getTableVehicles();

            if (!vehicles.length) {
                table.innerHTML = `
                    <tr>
                        <td colspan="5" class="table-empty">
                            No hay unidades que coincidan con los filtros.
                        </td>
                    </tr>
                `;
            } else {
                table.innerHTML = vehicles.map(vehicle => {
                    const cls = statusClass(vehicle.status);

                    return `
                        <tr data-vehicle-id="${escapeHtml(vehicle.id)}">
                            <td class="table-vehicle">
                                ${escapeHtml(vehicle.name)}
                                <br>
                                <small>
                                    Placa: ${escapeHtml(vehicle.plate)}
                                    · Conductor: ${escapeHtml(vehicle.driver)}
                                </small>
                            </td>

                            <td>
                                <span class="status-label ${cls}">
                                    ${escapeHtml(statusText(vehicle.status))}
                                </span>
                            </td>

                            <td>${escapeHtml(formatSpeed(vehicle.speed))}</td>
                            <td>${escapeHtml(vehicle.address)}</td>
                            <td>${escapeHtml(formatDate(vehicle.timestamp))}</td>
                        </tr>
                    `;
                }).join("");
            }

            setText(
                "tableSummary",
                `${vehicles.length} unidad(es) en este resumen`
            );
        }

        // Compatibilidad con la tabla del diseño anterior.
        const legacyRows = document.querySelectorAll(
            ".vehicle-table tbody tr[data-vehicle-id]"
        );

        legacyRows.forEach(row => {
            row.style.cursor = "pointer";

            row.onclick = () => {
                selectVehicle(row.dataset.vehicleId);
            };
        });
    }

    function renderVehicleFilter() {
        const select = $("vehicleFilter");

        if (!select) {
            return;
        }

        const previousValue = select.value;

        select.replaceChildren();

        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "Todos los vehículos";
        select.appendChild(allOption);

        state.vehicles.forEach(vehicle => {
            const option = document.createElement("option");
            option.value = vehicle.id;
            option.textContent = `${vehicle.name} (${vehicle.plate})`;
            select.appendChild(option);
        });

        if ([...select.options].some(option => option.value === previousValue)) {
            select.value = previousValue;
        }
    }

    function renderAll() {
        renderMetrics();
        renderMap(state.vehicles);
        renderFleet();
        renderSelectedVehicle();
        renderTable();
    }

    // =========================================================
    // 13. CONSULTA A SPRING BOOT
    // =========================================================

    async function loadVehicles() {
        if (state.loading || state.destroyed) {
            return;
        }

        state.loading = true;

        const refreshButton = $("refreshButton");

        if (refreshButton) {
            refreshButton.disabled = true;
            refreshButton.classList.add("is-loading");
        }

        try {
            const response = await fetch(CONFIG.apiUrl, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                },
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(
                    `El servidor respondió con HTTP ${response.status}.`
                );
            }

            const payload = await response.json();
            const rawVehicles = extractVehicles(payload);

            const vehicles = rawVehicles
                .map((raw, index) => normalizeVehicle(raw, index))
                .filter(Boolean);

            // No reemplazar los datos anteriores hasta terminar
            // correctamente la lectura de la respuesta.
            state.vehicles = vehicles;
            state.lastUpdated = new Date();
            state.lastError = null;
			cargarSelectUnidadesGPS();

            if (!state.vehicles.some(v => v.id === state.selectedId)) {
                state.selectedId = state.vehicles[0]?.id ?? null;
            }

            setConnectionStatus("API conectada");

            setText("lastUpdate", formatTime(state.lastUpdated));

            renderVehicleFilter();
            renderAll();

            if (state.vehicles.length === 0) {
                setConnectionStatus("API conectada; no hay vehículos");
            } else if (!state.vehicles.some(v => v.hasCoordinates)) {
                setText(
                    "mapStatus",
                    "Hay vehículos, pero no tienen coordenadas GPS válidas."
                );
            }
        } catch (error) {
            state.lastError = error;

            console.error("Error consultando /gps/vehiculos:", error);

            setConnectionStatus("Error de conexión con la API", true);

            // Mantener los últimos datos válidos en pantalla.
            if (state.vehicles.length === 0) {
                const list = $("fleetList");

                if (list) {
                    list.innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                            <strong>No fue posible cargar la flota</strong>
                            <span>Comprueba el endpoint ${escapeHtml(CONFIG.apiUrl)} y la consola del navegador.</span>
                        </div>
                    `;
                }

                const table = $("vehicleTable");

                if (table) {
                    table.innerHTML = `
                        <tr>
                            <td colspan="5" class="table-empty">
                                Error al consultar los datos GPS.
                            </td>
                        </tr>
                    `;
                }
            }
        } finally {
            state.loading = false;

            if (refreshButton) {
                refreshButton.disabled = false;
                refreshButton.classList.remove("is-loading");
            }
        }
    }

	
	function cargarSelectUnidadesGPS() {
	    const select = document.getElementById("conductorUnidad");

	    if (!select) {
	        console.warn("No se encontró el campo conductorUnidad.");
	        return;
	    }

	    const valorAnterior = select.value;

	    select.replaceChildren();

	    const opcionInicial = document.createElement("option");
	    opcionInicial.value = "";
	    opcionInicial.textContent = state.vehicles.length
	        ? "Selecciona una unidad GPS"
	        : "No hay unidades GPS disponibles";

	    select.appendChild(opcionInicial);

	    state.vehicles.forEach(vehicle => {
	        const opcion = document.createElement("option");

	        // Identificador real del vehículo en la API GPS.
	        opcion.value = String(vehicle.id);

	        // Mostrar vehículo, placa y conductor.
	        opcion.textContent =
	            `${vehicle.name} | ${vehicle.plate} | ${vehicle.driver}`;

	        select.appendChild(opcion);
	    });

	    // Conservar la selección si la unidad todavía existe.
	    if (
	        valorAnterior &&
	        [...select.options].some(
	            opcion => opcion.value === valorAnterior
	        )
	    ) {
	        select.value = valorAnterior;
	    }
	}
    // =========================================================
    // 14. EXPORTACIÓN CSV
    // =========================================================

    function exportCsv() {
        const vehicles = getTableVehicles();

        if (!vehicles.length) {
            window.alert("No hay datos para exportar con los filtros actuales.");
            return;
        }

        const rows = [
            [
                "Vehículo",
                "Placa",
                "Conductor",
                "Identificador",
                "Estado",
                "Velocidad km/h",
                "Latitud",
                "Longitud",
                "Ubicación",
                "Grupo",
                "Odómetro",
                "Horas de motor",
                "Último reporte"
            ],
            ...vehicles.map(vehicle => [
                vehicle.name,
                vehicle.plate,
                vehicle.driver,
                vehicle.id,
                statusText(vehicle.status),
                vehicle.speed ?? "",
                vehicle.latitude ?? "",
                vehicle.longitude ?? "",
                vehicle.address,
                vehicle.group,
                vehicle.odometer ?? "",
                vehicle.engineHours ?? "",
                formatDate(vehicle.timestamp)
            ])
        ];

        const csv = "\uFEFF" + rows.map(row =>
            row.map(value =>
                `"${String(value ?? "").replace(/"/g, '""')}"`
            ).join(";")
        ).join("\r\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `reporte-gps-${getDateKey(new Date()) || "actual"}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

	

	// =========================================================
	// 14-B. ORÍGENES Y DESTINOS DEL MAPA
	// Utiliza el panel y los botones existentes en el HTML.
	// =========================================================


	// =========================================================
	// 14-B. ORÍGENES Y DESTINOS DEL MAPA
	// Integración real con PuntoPlantaController
	// =========================================================

	const PUNTOS_CONFIG = Object.freeze({
	    apiUrl: "/api/puntos-planta"
	});

	const puntosState = {
	    puntos: [],
	    marcadores: [],
	    marcadorTemporal: null,
	    seleccionando: false,
	    guardando: false
	};

	
	
	// ---------------------------------------------------------
	// MENSAJES
	// ---------------------------------------------------------

	function puntosMensaje(texto) {
	    const elemento = $("mensajePunto");

	    if (elemento) {
	        elemento.textContent = texto;
	    } else {
	        console.info("[Puntos GPS]", texto);
	    }
	}

	// ---------------------------------------------------------
	// TOKEN CSRF
	// Compatible con Spring Security cuando el HTML publica
	// los metadatos csrfParameterName / csrfHeaderName.
	// ---------------------------------------------------------

	function obtenerHeadersCSRF() {
	    const headers = {};

	    const tokenMeta = document.querySelector(
	        'meta[name="_csrf"]'
	    );

	    const headerMeta = document.querySelector(
	        'meta[name="_csrf_header"]'
	    );

	    if (tokenMeta && headerMeta) {
	        headers[headerMeta.content] = tokenMeta.content;
	    }

	    return headers;
	}

	// ---------------------------------------------------------
	// PETICIONES HTTP
	// ---------------------------------------------------------

	async function peticionPuntos(url, opciones = {}) {
	    const headers = {
	        Accept: "application/json",
	        ...obtenerHeadersCSRF(),
	        ...(opciones.headers || {})
	    };

	    const respuesta = await fetch(url, {
	        ...opciones,
	        headers,
	        cache: "no-store"
	    });

	    if (!respuesta.ok) {
	        let detalle = "";

	        try {
	            const texto = await respuesta.text();

	            if (texto) {
	                try {
	                    const json = JSON.parse(texto);
	                    detalle =
	                        json.message ||
	                        json.mensaje ||
	                        json.error ||
	                        texto;
	                } catch {
	                    detalle = texto;
	                }
	            }
	        } catch {
	            // La respuesta puede no contener un cuerpo legible.
	        }

	        throw new Error(
	            `Error HTTP ${respuesta.status}` +
	            (detalle ? `: ${detalle}` : "")
	        );
	    }

	    // DELETE puede responder correctamente con HTTP 204.
	    if (respuesta.status === 204) {
	        return null;
	    }

	    const texto = await respuesta.text();

	    if (!texto.trim()) {
	        return null;
	    }

	    try {
	        return JSON.parse(texto);
	    } catch {
	        return texto;
	    }
	}

	// ---------------------------------------------------------
		// CARGAR COMBOS
		// ---------------------------------------------------------
	
	function cargarSelectsOrigenDestino() {
	    const selectOrigen = document.getElementById("origen");
	    const selectDestino = document.getElementById("destino");

	    if (!selectOrigen || !selectDestino) {
	        console.warn("No se encontraron los campos de origen y destino.");
	        return;
	    }

	    // Separar los puntos según su tipo.
	    const origenes = puntosState.puntos.filter(
	        punto => punto.tipo === "ORIGEN"
	    );

	    const destinos = puntosState.puntos.filter(
	        punto => punto.tipo === "DESTINO"
	    );

	    // Función para llenar cada select.
	    function llenarSelect(select, puntos, textoInicial) {
	        const valorAnterior = select.value;

	        select.replaceChildren();

	        const opcionInicial = document.createElement("option");
	        opcionInicial.value = "";
	        opcionInicial.textContent = textoInicial;
	        select.appendChild(opcionInicial);

	        puntos.forEach(punto => {
	            const opcion = document.createElement("option");

	            // Se envía el ID real del punto guardado en la BD.
	            opcion.value = String(punto.id);
	            opcion.textContent = punto.nombre;

	            select.appendChild(opcion);
	        });

	        // Mantener la selección anterior si todavía existe.
	        if (
	            valorAnterior &&
	            [...select.options].some(
	                opcion => opcion.value === valorAnterior
	            )
	        ) {
	            select.value = valorAnterior;
	        }
	    }

	    llenarSelect(
	        selectOrigen,
	        origenes,
	        origenes.length
	            ? "Selecciona un origen"
	            : "No hay orígenes registrados"
	    );

	    llenarSelect(
	        selectDestino,
	        destinos,
	        destinos.length
	            ? "Selecciona un destino"
	            : "No hay destinos registrados"
	    );
	}
	
	// ---------------------------------------------------------
	// NORMALIZAR RESPUESTAS DEL CONTROLADOR
	// ---------------------------------------------------------

	function normalizarPuntoGPS(p) {
	    if (!p || typeof p !== "object") {
	        throw new Error("El servidor devolvió un punto inválido.");
	    }

	    const latitud = Number(
	        p.latitud ?? p.latitude ?? p.Latitud
	    );

	    const longitud = Number(
	        p.longitud ?? p.longitude ?? p.Longitud
	    );

	    return {
	        id: p.id ??
	            p.ID ??
	            p.puntoId ??
	            p.puntoPlantaId ??
	            p.idPunto ??
	            null,

	        nombre: String(
	            p.nombre ??
	            p.nombrePunto ??
	            p.Nombre ??
	            "Punto sin nombre"
	        ),

	        tipo: String(
	            p.tipo ??
	            p.tipoPunto ??
	            p.Tipo ??
	            "ORIGEN"
	        ).toUpperCase(),

	        latitud,
	        longitud,

	        activo: p.activo ?? p.Activo ?? true
	    };
	}

	function coordenadasValidasPunto(p) {
	    return Number.isFinite(p.latitud) &&
	        Number.isFinite(p.longitud) &&
	        p.latitud >= -90 &&
	        p.latitud <= 90 &&
	        p.longitud >= -180 &&
	        p.longitud <= 180 &&
	        (p.tipo === "ORIGEN" || p.tipo === "DESTINO");
	}

	// ---------------------------------------------------------
	// ICONOS
	// ---------------------------------------------------------

	function iconoPuntoGPS(tipo) {
	    const esDestino = tipo === "DESTINO";
	    const color = esDestino ? "#a855f7" : "#ef4444";
	    const letra = esDestino ? "D" : "O";

	    return L.divIcon({
	        className: "chc-punto-marcador",

	        html: `
	            <div style="
	                width:32px;
	                height:32px;
	                border-radius:50% 50% 50% 0;
	                transform:rotate(-45deg);
	                background:${color};
	                border:3px solid #fff;
	                box-shadow:0 2px 8px #0006;
	                display:flex;
	                align-items:center;
	                justify-content:center;
	            ">
	                <span style="
	                    transform:rotate(45deg);
	                    color:#fff;
	                    font-weight:800;
	                    font-size:13px;
	                ">${letra}</span>
	            </div>
	        `,

	        iconSize: [32, 32],
	        iconAnchor: [16, 32],
	        popupAnchor: [0, -30]
	    });
	}

	// ---------------------------------------------------------
	// DIBUJAR PUNTOS EN EL MAPA
	// ---------------------------------------------------------

	function dibujarPuntosGPS() {
	    if (!state.map) {
	        return;
	    }

	    puntosState.marcadores.forEach(marcador => {
	        state.map.removeLayer(marcador);
	    });

	    puntosState.marcadores = [];

	    puntosState.puntos.forEach(punto => {
	        if (!coordenadasValidasPunto(punto)) {
	            return;
	        }

	        const marcador = L.marker(
	            [punto.latitud, punto.longitud],
	            {
	                icon: iconoPuntoGPS(punto.tipo),
	                title: punto.nombre,
	                alt: punto.tipo
	            }
	        );

	        const etiquetaTipo = punto.tipo === "DESTINO"
	            ? "Destino"
	            : "Origen";

	        const botonDesactivar = punto.id !== null
	            ? `
	                <button
	                    type="button"
	                    class="btn-desactivar-punto"
	                    data-desactivar-punto="${escapeHtml(punto.id)}"
	                    style="
	                        margin-top:10px;
	                        padding:6px 10px;
	                        border:0;
	                        border-radius:6px;
	                        background:#dc2626;
	                        color:#fff;
	                        cursor:pointer;
	                    "
	                >
	                    Desactivar punto
	                </button>
	            `
	            : "";

	        marcador.bindPopup(`
	            <div class="gps-popup">
	                <strong>${escapeHtml(punto.nombre)}</strong>
	                <br>
	                <span>${etiquetaTipo}</span>
	                <br>
	                <small>
	                    ${punto.latitud.toFixed(6)},
	                    ${punto.longitud.toFixed(6)}
	                </small>
	                ${botonDesactivar}
	            </div>
	        `);

	        // Conectar el botón del popup con el DELETE del controlador.
	        marcador.on("popupopen", evento => {
	            const popupElement = evento.popup.getElement();

	            if (!popupElement) {
	                return;
	            }

	            const boton = popupElement.querySelector(
	                "[data-desactivar-punto]"
	            );

	            if (!boton) {
	                return;
	            }

	            boton.addEventListener("click", async () => {
	                await desactivarPuntoGPS(punto.id);
	            }, { once: true });
	        });

	        marcador.addTo(state.map);

	        puntosState.marcadores.push(marcador);
	    });
	}

	// ---------------------------------------------------------
	// CARGAR PUNTOS DESDE LA BASE DE DATOS
	// GET /api/puntos-planta
	// ---------------------------------------------------------

	async function cargarPuntosGPS() {
	    try {
	        puntosMensaje("Consultando puntos en la base de datos...");

	        const datos = await peticionPuntos(
	            PUNTOS_CONFIG.apiUrl
	        );

	        if (!Array.isArray(datos)) {
	            throw new Error(
	                "La API no devolvió una lista de puntos."
	            );
	        }

			puntosState.puntos = datos
			    .map(normalizarPuntoGPS)
			    .filter(punto =>
			        punto.activo !== false &&
			        coordenadasValidasPunto(punto)
			    );

			// Dibujar los puntos en el mapa.
			dibujarPuntosGPS();

			// Llenar los campos del formulario.
			cargarSelectsOrigenDestino();

	        puntosMensaje(
	            `${puntosState.puntos.length} punto(s) cargado(s) desde el servidor.`
	        );

	    } catch (error) {
	        console.error(
	            "Error cargando puntos de planta:",
	            error
	        );

	        puntosMensaje(
	            "No se pudieron cargar los puntos desde la base de datos. " +
	            error.message
	        );
	    }
	}

	// ---------------------------------------------------------
	// INICIAR SELECCIÓN DE COORDENADAS
	// ---------------------------------------------------------

	function iniciarSeleccionPuntoGPS() {
	    const nombre = $("nombrePunto");
	    const tipo = $("tipoPunto");

	    if (!state.map) {
	        puntosMensaje("El mapa todavía no está disponible.");
	        return;
	    }

	    if (!nombre || !nombre.value.trim()) {
	        puntosMensaje("Escribí el nombre del origen o destino.");
	        nombre?.focus();
	        return;
	    }

	    const tipoSeleccionado = tipo?.value || "ORIGEN";

	    if (!["ORIGEN", "DESTINO"].includes(tipoSeleccionado)) {
	        puntosMensaje("Seleccioná un tipo válido: ORIGEN o DESTINO.");
	        return;
	    }

	    puntosState.seleccionando = true;

	    state.map.getContainer().style.cursor = "crosshair";

	    puntosMensaje(
	        `Hacé clic en el mapa para colocar el ${tipoSeleccionado.toLowerCase()}.`
	    );
	}

	// ---------------------------------------------------------
	// GUARDAR PUNTO
	// POST /api/puntos-planta
	// ---------------------------------------------------------

	async function guardarPuntoGPS(punto) {
	    if (puntosState.guardando) {
	        return;
	    }

	    puntosState.guardando = true;

	    try {
	        puntosMensaje("Guardando punto en la base de datos...");

	        const datos = await peticionPuntos(
	            PUNTOS_CONFIG.apiUrl,
	            {
	                method: "POST",

	                headers: {
	                    "Content-Type": "application/json"
	                },

	                body: JSON.stringify({
	                    nombre: punto.nombre,
	                    tipo: punto.tipo,
	                    latitud: punto.latitud,
	                    longitud: punto.longitud
	                })
	            }
	        );

	        // Si el POST devuelve el registro creado, verificamos
	        // que tenga identificador y coordenadas válidas.
	        if (datos && typeof datos === "object") {
	            const objeto = datos.punto ?? datos;

	            if (
	                objeto.id !== undefined ||
	                objeto.puntoId !== undefined ||
	                objeto.puntoPlantaId !== undefined
	            ) {
	                normalizarPuntoGPS(objeto);
	            }
	        }

	        // Volvemos a consultar el servidor para usar el registro
	        // persistido y su ID real, no un objeto local inventado.
	        await cargarPuntosGPS();

	        if (puntosState.puntos.some(p =>
	            p.nombre === punto.nombre &&
	            p.tipo === punto.tipo &&
	            Math.abs(p.latitud - punto.latitud) < 0.00001 &&
	            Math.abs(p.longitud - punto.longitud) < 0.00001
	        )) {
	            puntosMensaje("Punto guardado correctamente en el servidor.");
	        }

	        if (
	            puntosState.marcadorTemporal &&
	            state.map
	        ) {
	            state.map.removeLayer(puntosState.marcadorTemporal);
	            puntosState.marcadorTemporal = null;
	        }

	        const panel = $("panelCrearPunto");
	        const nombre = $("nombrePunto");

	        if (nombre) {
	            nombre.value = "";
	        }

	        if (panel) {
	            panel.hidden = true;
	        }

	    } catch (error) {
	        console.error("Error guardando punto:", error);

	        puntosMensaje(
	            "No se pudo guardar el punto. " +
	            "La base de datos no ha sido confirmada. " +
	            error.message
	        );

	        if (puntosState.marcadorTemporal && state.map) {
	            state.map.removeLayer(puntosState.marcadorTemporal);
	            puntosState.marcadorTemporal = null;
	        }

	    } finally {
	        puntosState.guardando = false;
	    }
	}

	// ---------------------------------------------------------
	// DESACTIVAR PUNTO
	// DELETE /api/puntos-planta/{id}
	// ---------------------------------------------------------

	async function desactivarPuntoGPS(id) {
	    if (id === null || id === undefined || id === "") {
	        puntosMensaje(
	            "Este punto no tiene un ID válido del servidor."
	        );
	        return;
	    }

	    const confirmado = window.confirm(
	        "¿Deseás desactivar este origen o destino?"
	    );

	    if (!confirmado) {
	        return;
	    }

	    try {
	        puntosMensaje("Desactivando punto en el servidor...");

	        await peticionPuntos(
	            `${PUNTOS_CONFIG.apiUrl}/${encodeURIComponent(id)}`,
	            {
	                method: "DELETE"
	            }
	        );

	        // El controlador desactiva el registro.
	        // Consultamos nuevamente para actualizar el mapa.
	        await cargarPuntosGPS();

	        puntosMensaje("Solicitud de desactivación completada.");

	    } catch (error) {
	        console.error("Error desactivando punto:", error);

	        puntosMensaje(
	            "No se pudo desactivar el punto. " +
	            error.message
	        );
	    }
	}

	// ---------------------------------------------------------
	// CLIC EN EL MAPA PARA DEFINIR UN PUNTO
	// ---------------------------------------------------------

	function manejarClicMapaPunto(evento) {
	    if (!puntosState.seleccionando) {
	        return;
	    }

	    puntosState.seleccionando = false;

	    state.map.getContainer().style.cursor = "";

	    const nombre = $("nombrePunto")?.value.trim();
	    const tipo = $("tipoPunto")?.value || "ORIGEN";

	    if (!nombre) {
	        puntosMensaje("Escribí el nombre del punto.");
	        return;
	    }

	    if (!["ORIGEN", "DESTINO"].includes(tipo)) {
	        puntosMensaje("El tipo de punto no es válido.");
	        return;
	    }

	    const punto = {
	        id: null,
	        nombre,
	        tipo,
	        latitud: Number(evento.latlng.lat.toFixed(6)),
	        longitud: Number(evento.latlng.lng.toFixed(6))
	    };

	    if (!coordenadasValidasPunto(punto)) {
	        puntosMensaje("Las coordenadas seleccionadas no son válidas.");
	        return;
	    }

	    if (puntosState.marcadorTemporal) {
	        state.map.removeLayer(puntosState.marcadorTemporal);
	    }

	    puntosState.marcadorTemporal = L.marker(
	        [punto.latitud, punto.longitud],
	        { icon: iconoPuntoGPS(punto.tipo) }
	    ).addTo(state.map);

	    puntosState.marcadorTemporal.bindPopup(`
	        <strong>${escapeHtml(punto.nombre)}</strong>
	        <br>
	        ${punto.tipo === "DESTINO" ? "Destino" : "Origen"}
	        <br>
	        <small>Esperando confirmación del servidor...</small>
	    `).openPopup();

	    guardarPuntoGPS(punto);
	}

	// ---------------------------------------------------------
	// INICIALIZAR CONTROLES DE ORÍGENES Y DESTINOS
	// ---------------------------------------------------------

	function inicializarPuntosGPS() {
	    const btnCrear = $("btnCrearPunto");
	    const btnElegir = $("btnSeleccionarUbicacion");
	    const btnCancelar = $("btnCancelarPunto");
	    const panel = $("panelCrearPunto");

	    if (!btnCrear || !btnElegir || !btnCancelar || !panel) {
	        console.warn(
	            "No se encontraron los controles de puntos del HTML."
	        );
	        return;
	    }

	    btnCrear.addEventListener("click", () => {
	        panel.hidden = !panel.hidden;

	        if (!panel.hidden) {
	            puntosMensaje(
	                "Elegí el tipo, escribí el nombre y seleccioná el mapa."
	            );

	            $("nombrePunto")?.focus();

	        } else {
	            puntosState.seleccionando = false;

	            if (state.map) {
	                state.map.getContainer().style.cursor = "";
	            }

	            if (puntosState.marcadorTemporal && state.map) {
	                state.map.removeLayer(puntosState.marcadorTemporal);
	                puntosState.marcadorTemporal = null;
	            }
	        }
	    });

	    btnElegir.addEventListener(
	        "click",
	        iniciarSeleccionPuntoGPS
	    );

	    btnCancelar.addEventListener("click", () => {
	        puntosState.seleccionando = false;

	        if (state.map) {
	            state.map.getContainer().style.cursor = "";
	        }

	        if (puntosState.marcadorTemporal && state.map) {
	            state.map.removeLayer(puntosState.marcadorTemporal);
	            puntosState.marcadorTemporal = null;
	        }

	        panel.hidden = true;

	        puntosMensaje("Creación de punto cancelada.");
	    });

	    state.map.on("click", manejarClicMapaPunto);

	    cargarPuntosGPS();
	}


    // =========================================================
    // 15. EVENTOS DE LA INTERFAZ
    // =========================================================

    function initializeEvents() {
        const on = (id, eventName, callback) => {
            const element = $(id);

            if (element) {
                element.addEventListener(eventName, callback);
            }
        };

        on("refreshButton", "click", loadVehicles);
        on("fitMapButton", "click", fitFleet);
        on("locateFleetButton", "click", fitFleet);
        on("btnCentrarMapa", "click", fitFleet);
        on("btnVistaMapa", "click", toggleMapView);

        on("clearSelectionButton", "click", () => {
            state.selectedId = null;
            renderFleet();
            renderSelectedVehicle();
        });

        on("fleetSearch", "input", renderFleet);
        on("mapSearch", "input", renderFleet);
        on("statusFilter", "change", renderFleet);

        on("applyFiltersButton", "click", renderTable);
        on("dateFrom", "change", renderTable);
        on("dateTo", "change", renderTable);
        on("vehicleFilter", "change", renderTable);

        on("exportButton", "click", exportCsv);

        on("printButton", "click", () => {
            window.print();
        });

        const legacySearch = document.querySelector(
            '.search-box input[type="search"]'
        );

        if (legacySearch) {
            legacySearch.addEventListener("input", () => {
                renderFleet();
                renderTable();
            });
        }

        document.querySelectorAll(".activity-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".activity-tab").forEach(item => {
                    const active = item === tab;
                    item.classList.toggle("active", active);
                    item.setAttribute("aria-selected", String(active));
                });

                renderTable();
            });
        });

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                state.map?.invalidateSize();
            }
        });
    }

    // =========================================================
    // 16. INICIALIZACIÓN Y LIMPIEZA
    // =========================================================

    function start() {
        if (state.initialized || state.destroyed) {
            return;
        }

        state.initialized = true;

        if (!initializeMap()) {
            return;
        }

		initializeEvents();
		inicializarPuntosGPS();

		loadVehicles();

        state.refreshTimer = window.setInterval(
            loadVehicles,
            CONFIG.refreshIntervalMs
        );
    }

    function destroy() {
        state.destroyed = true;

        if (state.refreshTimer !== null) {
            window.clearInterval(state.refreshTimer);
            state.refreshTimer = null;
        }

        state.map?.remove();
        state.map = null;
        state.markers.clear();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

    window.addEventListener("pagehide", destroy, { once: true });
})();