// ==========================================================
// PARKWISE AI
// PREDICTIVE HEATMAP
// DATABASE POWERED
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    const API_BASE_URL = "https://parkwise-ai-473c.onrender.com";
    const ML_HEATMAP_URL = "./heatmap_predictions.json";
    const AUTO_REFRESH_MS = 60000; // refresh predictions every 60s

    // ==================================================
    // ELEMENTS
    // ==================================================

    const refreshBtn = document.getElementById("refreshHeatmapBtn");
    const mapSkeleton = document.getElementById("mapSkeleton");
const timeRangeSelect = document.getElementById("timeRangeSelect");
    let heatLayer = null;
    let markers = [];
    let heatmapData = [];
    let autoRefreshTimer = null;

    // ==================================================
    // MAP
    // ==================================================

    const map = L.map("heatmapMap", {
        zoomControl: true
    });

    // No hardcoded city/location — default to a wide India view
    // until real data narrows the bounds.
    map.setView([20.5937, 78.9629], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);

    // Leaflet needs a resize nudge once its container is
    // actually laid out (fixes blank/gray tiles on load).
    setTimeout(() => map.invalidateSize(), 200);

    // ==================================================
    // USER PROFILE
    // ==================================================

    function loadUserProfile() {

        const name = localStorage.getItem("user_name") || "User";
        const role = localStorage.getItem("user_role") || "User";

        const profileName = document.getElementById("profileName");
        const profileAvatar = document.getElementById("profileAvatar");
        const profileRole = document.getElementById("profileRole");

        if (profileName) profileName.textContent = name;
        if (profileAvatar) profileAvatar.textContent = name.trim().charAt(0).toUpperCase();
        if (profileRole) profileRole.textContent = role;
    }

    // ==================================================
    // OCCUPANCY -> COLOR (kept in sync with the legend)
    // ==================================================

    function getColor(occupancy) {
        if (occupancy >= 75) return "#ef4444"; // high
        if (occupancy >= 40) return "#eab308"; // moderate
        return "#22c55e";                       // low
    }

    // Intensity 0..1 for the heat layer, weighted so high-occupancy
    // spots dominate the gradient more than a linear scale would.
    function getIntensity(occupancy) {
        return Math.min(Math.max(occupancy / 100, 0.08), 1) ** 0.8;
    }

    // ==================================================
    // MAP STATE HELPERS
    // ==================================================

    function showSkeleton() {
        if (mapSkeleton) mapSkeleton.classList.remove("hidden");
    }

    function hideSkeleton() {
        if (mapSkeleton) mapSkeleton.classList.add("hidden");
    }

    function clearMap() {

        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        if (heatLayer) {
            map.removeLayer(heatLayer);
            heatLayer = null;
        }
    }

    // ==================================================
    // LOAD HEATMAP FROM BACKEND
    // ==================================================

    async function loadHeatmap() {

    refreshBtn.classList.add("loading");
    refreshBtn.disabled = true;
    showSkeleton();

    clearMap();

    try {

        // ==============================================
        // LOAD DATABASE PARKING INFORMATION
        // ==============================================

        const response = await fetch(`${API_BASE_URL}/heatmap`);

        if (!response.ok) {
            throw new Error("Heatmap API failed");
        }

        const apiData = await response.json();

        const databaseLocations =
            Array.isArray(apiData.locations)
                ? apiData.locations
                : [];


        // ==============================================
        // LOAD ML PREDICTIONS
        // ==============================================

        const mlResponse = await fetch(
            `${ML_HEATMAP_URL}?t=${Date.now()}`
        );

        if (!mlResponse.ok) {
            throw new Error("ML heatmap JSON failed to load");
        }

        const mlData = await mlResponse.json();


        // ==============================================
        // CREATE ML LOOKUP BY LOT ID
        // ==============================================

        const mlLookup = {};

        mlData.forEach(lot => {

            if (!lot.lot_id) return;

            mlLookup[lot.lot_id] = {
                predicted_occupancy:
                    Number(lot.predicted_occupancy) || 0,

                latitude:
                    Number(lot.latitude),

                longitude:
                    Number(lot.longitude),

                name:
                    lot.name || "Parking Area"
            };
        });


        // ==============================================
        // MERGE DATABASE + ML DATA
        // ==============================================

        const mergedLocations = databaseLocations.map(location => {

            const lotId =
                location.lot_id ||
                location.parking_lots_id;

            const prediction = mlLookup[lotId];

            if (!prediction) {
                return location;
            }

            return {

                ...location,

                // Keep existing database coordinates
                // unless they are missing.
                lat:
                    Number(location.lat) ||
                    prediction.latitude,

                lng:
                    Number(location.lng) ||
                    prediction.longitude,

                // IMPORTANT:
                // Use ML prediction for heatmap occupancy.
                occupancy:
                    prediction.predicted_occupancy,

                predicted_occupancy:
                    prediction.predicted_occupancy
            };
        });


        // ==============================================
        // FINAL DATA
        // ==============================================

        heatmapData = mergedLocations;

        const validLocations = heatmapData.filter(location =>
            Number.isFinite(Number(location.lat)) &&
            Number.isFinite(Number(location.lng))
        );


        if (validLocations.length === 0) {

            showEmptyHeatmap();
            updateInsights([]);

            return;
        }


        // ==============================================
        // RENDER
        // ==============================================

        renderHeatLayer(validLocations);

        renderMarkers(validLocations);


        const bounds = validLocations.map(location => [
            Number(location.lat),
            Number(location.lng)
        ]);


        map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 15
        });


        updateInsights(validLocations);


        console.log(
            "ML heatmap locations:",
            validLocations.length
        );

        console.log(
            "ML heatmap data:",
            validLocations
        );


    } catch (error) {

        console.error("Heatmap error:", error);

        showErrorHeatmap();

        updateInsights([]);

    } finally {

        refreshBtn.classList.remove("loading");
        refreshBtn.disabled = false;

        hideSkeleton();
    }
}

    // ==================================================
    // TRUE HEAT-GRADIENT LAYER
    // (weighted glow instead of flat translucent circles)
    // ==================================================

    function renderHeatLayer(locations) {

        if (typeof L.heatLayer !== "function") {
            // leaflet.heat failed to load (e.g. offline) — degrade
            // gracefully to markers-only, still fully functional.
            return;
        }

        const points = locations.map(location => {

            const occupancy = Number(
                location.occupancy ?? location.current_occupancy ?? 0
            );

            return [
                Number(location.lat),
                Number(location.lng),
                getIntensity(occupancy)
            ];
        });

        heatLayer = L.heatLayer(points, {
            radius: 45,
            blur: 35,
            maxZoom: 17,
            minOpacity: 0.35,
            gradient: {
                0.0: "#22c55e",
                0.4: "#eab308",
                0.75: "#ef4444"
            }
        }).addTo(map);
    }

    // ==================================================
    // PRECISE CLICKABLE MARKERS (sit on top of the heat glow)
    // ==================================================

    function renderMarkers(locations) {

        locations.forEach(location => {

            const lat = Number(location.lat);
            const lng = Number(location.lng);

            const occupancy = Number(
                location.occupancy ?? location.current_occupancy ?? 0
            );

            const color = getColor(occupancy);

            const marker = L.circleMarker([lat, lng], {
                radius: 9,
                color: "#ffffff",
                weight: 2,
                fillColor: color,
                fillOpacity: 0.95,
                className: "heat-marker"
            }).addTo(map);

            marker.bindPopup(buildPopup(location, occupancy, color));

            markers.push(marker);
        });
    }

    function buildPopup(location, occupancy, color) {

        const rating = Number(location.rating || 0);
        const price = Number(location.price || 0);

        return `
            <div class="heatmap-popup">
                <strong>${escapeHTML(location.name || "Parking Area")}</strong>
                <hr>
                <div>Occupancy: <b style="color:${color};">${Math.round(occupancy)}%</b></div>
                <div>Available Slots: <b>${Number(location.available_slots || 0)}</b></div>
                <div>Total Slots: <b>${Number(location.total_slots || 0)}</b></div>
                <div>Price: <b>₹${price}/hr</b></div>
                <div>Rating: <b>⭐ ${rating.toFixed(1)}</b></div>
                <div>Status: <b>${escapeHTML(location.status || "Unknown")}</b></div>
            </div>
        `;
    }

    // ==================================================
    // AI INSIGHTS
    // ==================================================

    function updateInsights(locations) {

        const highName = document.getElementById("highCongestionName");
        const highValue = document.getElementById("highCongestionValue");
        const bestName = document.getElementById("bestAvailabilityName");
        const bestValue = document.getElementById("bestAvailabilityValue");
        const aiText = document.getElementById("aiInsightText");

        if (!highName || !highValue || !bestName || !bestValue || !aiText) return;

        if (!locations || locations.length === 0) {

            highName.textContent = "No parking data";
            highValue.textContent = "--";
            bestName.textContent = "No parking data";
            bestValue.textContent = "--";
            aiText.textContent = "No parking locations are currently available in the database.";
            return;
        }

        const sorted = [...locations].sort(
            (a, b) => Number(a.occupancy || 0) - Number(b.occupancy || 0)
        );

        const lowest = sorted[0];
        const highest = sorted[sorted.length - 1];

        highName.textContent = highest.name || "Parking Area";
        highValue.textContent = `${Math.round(Number(highest.occupancy || 0))}%`;

        bestName.textContent = lowest.name || "Parking Area";
        bestValue.textContent = `${Math.round(Number(lowest.occupancy || 0))}%`;

        const available = Number(lowest.available_slots || 0);

        aiText.textContent =
            `${lowest.name || "This parking"} has the lowest occupancy ` +
            `of ${Math.round(Number(lowest.occupancy || 0))}%. ` +
            `It currently has ${available} available slot(s), making it ` +
            `a better availability option.`;
    }

    // ==================================================
    // EMPTY / ERROR STATES
    // ==================================================

    function showEmptyHeatmap() {
        map.setView([20.5937, 78.9629], 5);
        showToast("No parking data found in database.");
    }

    function showErrorHeatmap() {
        showToast("Unable to load parking data.");
    }

    // ==================================================
    // HTML SECURITY
    // ==================================================

    function escapeHTML(value) {
        return String(value || "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character]));
    }

    // ==================================================
    // TOAST
    // ==================================================

    function showToast(message) {

        let toast = document.getElementById("heatmapToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "heatmapToast";
            toast.className = "heatmap-toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add("show");

        setTimeout(() => toast.classList.remove("show"), 3000);
    }

    // ==================================================
    // AUTO-REFRESH
    // ==================================================

    function startAutoRefresh() {

        stopAutoRefresh();

        autoRefreshTimer = setInterval(() => {
            // Skip a tick if a manual refresh is already in flight.
            if (!refreshBtn.disabled) loadHeatmap();
        }, AUTO_REFRESH_MS);
    }

    function stopAutoRefresh() {
        if (autoRefreshTimer) clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }

    // Pause polling when the tab is hidden, resume when it's back —
    // avoids wasted requests and needless map redraws in background tabs.
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            loadHeatmap();
            startAutoRefresh();
        }
    });

    // ==================================================
    // EVENTS
    // ==================================================

    refreshBtn.addEventListener("click", loadHeatmap);

    // ==================================================
    // INITIAL LOAD
    // ==================================================
if (timeRangeSelect) {
    timeRangeSelect.addEventListener("change", () => {
        loadHeatmap();
    });
}
    loadUserProfile();
    loadHeatmap();
    startAutoRefresh();

});