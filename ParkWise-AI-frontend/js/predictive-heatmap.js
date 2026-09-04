// ==========================================================
// PARKWISE AI
// PREDICTIVE HEATMAP
// DATABASE POWERED
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const API_BASE_URL =
            "http://127.0.0.1:8000";


        // ==================================================
        // MAP
        // ==================================================

        const map =
            L.map("heatmapMap");


        // No hardcoded city/location
        map.setView(
            [20.5937, 78.9629],
            5
        );


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);


        // ==================================================
        // ELEMENTS
        // ==================================================

        const refreshBtn =
            document.getElementById(
                "refreshHeatmapBtn"
            );


        let circles = [];

        let heatmapData = [];


        // ==================================================
        // USER PROFILE
        // ==================================================

        function loadUserProfile() {

            const name =
                localStorage.getItem(
                    "user_name"
                ) || "User";


            const role =
                localStorage.getItem(
                    "user_role"
                ) || "User";


            const profileName =
                document.getElementById(
                    "profileName"
                );


            const profileAvatar =
                document.getElementById(
                    "profileAvatar"
                );


            const profileRole =
                document.getElementById(
                    "profileRole"
                );


            if (profileName) {

                profileName.textContent =
                    name;

            }


            if (profileAvatar) {

                profileAvatar.textContent =
                    name
                        .trim()
                        .charAt(0)
                        .toUpperCase();

            }


            if (profileRole) {

                profileRole.textContent =
                    role;

            }

        }


        // ==================================================
        // OCCUPANCY COLOR
        // ==================================================

        function getColor(
            occupancy
        ) {

            if (occupancy >= 75) {

                return "#ef4444";

            }


            if (occupancy >= 40) {

                return "#eab308";

            }


            return "#22c55e";

        }


        // ==================================================
        // CLEAR MAP
        // ==================================================

        function clearMap() {

            circles.forEach(
                circle => {

                    map.removeLayer(
                        circle
                    );

                }
            );


            circles = [];

        }


        // ==================================================
        // LOAD HEATMAP FROM BACKEND
        // ==================================================

        async function loadHeatmap() {

            refreshBtn.classList.add(
                "loading"
            );

            refreshBtn.disabled = true;


            clearMap();


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/heatmap`
                    );


                if (!response.ok) {

                    throw new Error(
                        "Heatmap API failed"
                    );

                }


                const data =
                    await response.json();


                heatmapData =
                    Array.isArray(
                        data.locations
                    )
                        ? data.locations
                        : [];


                if (
                    heatmapData.length === 0
                ) {

                    showEmptyHeatmap();

                    updateInsights([]);

                    return;

                }


                const validLocations =
                    heatmapData.filter(
                        location =>

                            Number.isFinite(
                                Number(
                                    location.lat
                                )
                            )

                            &&

                            Number.isFinite(
                                Number(
                                    location.lng
                                )
                            )
                    );


                if (
                    validLocations.length === 0
                ) {

                    showEmptyHeatmap();

                    updateInsights([]);

                    return;

                }


                // ==========================================
                // MAP BOUNDS
                // ==========================================

                const bounds = [];


                validLocations.forEach(
                    location => {

                        const lat =
                            Number(
                                location.lat
                            );

                        const lng =
                            Number(
                                location.lng
                            );


                        const occupancy =
                            Number(
                                location.occupancy ||
                                location.current_occupancy ||
                                0
                            );


                        const color =
                            getColor(
                                occupancy
                            );


                        // ==================================
                        // HEAT CIRCLE
                        // ==================================

                        const circle =
                            L.circle(
                                [
                                    lat,
                                    lng
                                ],
                                {

                                    color:
                                        color,

                                    fillColor:
                                        color,

                                    fillOpacity:
                                        0.40,

                                    weight:
                                        2,

                                    radius:
                                        450

                                }
                            ).addTo(map);


                        // ==================================
                        // POPUP
                        // ==================================

                        circle.bindPopup(`

                            <div class="heatmap-popup">

                                <strong>
                                    ${escapeHTML(
                                        location.name ||
                                        "Parking Area"
                                    )}
                                </strong>

                                <hr>

                                <div>
                                    Occupancy:
                                    <b style="
                                        color:${color};
                                    ">
                                        ${Math.round(
                                            occupancy
                                        )}%
                                    </b>
                                </div>

                                <div>
                                    Available Slots:
                                    <b>
                                        ${
                                            Number(
                                                location.available_slots ||
                                                0
                                            )
                                        }
                                    </b>
                                </div>

                                <div>
                                    Total Slots:
                                    <b>
                                        ${
                                            Number(
                                                location.total_slots ||
                                                0
                                            )
                                        }
                                    </b>
                                </div>

                                <div>
                                    Price:
                                    <b>
                                        ₹${
                                            Number(
                                                location.price ||
                                                0
                                            )
                                        }/hr
                                    </b>
                                </div>

                                <div>
                                    Rating:
                                    <b>
                                        ⭐ ${
                                            Number(
                                                location.rating ||
                                                0
                                            ).toFixed(1)
                                        }
                                    </b>
                                </div>

                                <div>
                                    Status:
                                    <b>
                                        ${
                                            escapeHTML(
                                                location.status ||
                                                "Unknown"
                                            )
                                        }
                                    </b>
                                </div>

                            </div>

                        `);


                        circles.push(
                            circle
                        );


                        bounds.push([
                            lat,
                            lng
                        ]);

                    }
                );


                // ==========================================
                // FIT MAP
                // ==========================================

                if (
                    bounds.length > 0
                ) {

                    map.fitBounds(
                        bounds,
                        {
                            padding: [
                                30,
                                30
                            ]
                        }
                    );

                }


                // ==========================================
                // UPDATE AI INSIGHTS
                // ==========================================

                updateInsights(
                    heatmapData
                );


            }

            catch (error) {

                console.error(
                    "Heatmap error:",
                    error
                );


                showErrorHeatmap();


                updateInsights([]);

            }

            finally {

                refreshBtn.classList.remove(
                    "loading"
                );

                refreshBtn.disabled =
                    false;

            }

        }


        // ==================================================
        // AI INSIGHTS
        // ==================================================

        function updateInsights(
            locations
        ) {

            const highName =
                document.getElementById(
                    "highCongestionName"
                );


            const highValue =
                document.getElementById(
                    "highCongestionValue"
                );


            const bestName =
                document.getElementById(
                    "bestAvailabilityName"
                );


            const bestValue =
                document.getElementById(
                    "bestAvailabilityValue"
                );


            const aiText =
                document.getElementById(
                    "aiInsightText"
                );


            if (
                !locations ||
                locations.length === 0
            ) {

                highName.textContent =
                    "No parking data";


                highValue.textContent =
                    "--";


                bestName.textContent =
                    "No parking data";


                bestValue.textContent =
                    "--";


                aiText.textContent =
                    "No parking locations are currently available in the database.";

                return;

            }


            // ==========================================
            // HIGHEST OCCUPANCY
            // ==========================================

            const highest =
                [...locations].sort(
                    (a, b) =>

                        Number(
                            b.occupancy || 0
                        )

                        -

                        Number(
                            a.occupancy || 0
                        )
                )[0];


            // ==========================================
            // LOWEST OCCUPANCY
            // ==========================================

            const lowest =
                [...locations].sort(
                    (a, b) =>

                        Number(
                            a.occupancy || 0
                        )

                        -

                        Number(
                            b.occupancy || 0
                        )
                )[0];


            highName.textContent =
                highest.name ||
                "Parking Area";


            highValue.textContent =
                `${Math.round(
                    Number(
                        highest.occupancy ||
                        0
                    )
                )}%`;


            bestName.textContent =
                lowest.name ||
                "Parking Area";


            bestValue.textContent =
                `${Math.round(
                    Number(
                        lowest.occupancy ||
                        0
                    )
                )}%`;


            // ==========================================
            // AI MESSAGE
            // ==========================================

            const available =
                Number(
                    lowest.available_slots ||
                    0
                );


            aiText.textContent =

                `${lowest.name || "This parking"} ` +

                `has the lowest occupancy ` +

                `of ${Math.round(
                    Number(
                        lowest.occupancy ||
                        0
                    )
                )}%. ` +

                `It currently has ${available} ` +

                `available slot(s), making it ` +

                `a better availability option.`;

        }


        // ==================================================
        // EMPTY MAP
        // ==================================================

        function showEmptyHeatmap() {

            map.setView(
                [20.5937, 78.9629],
                5
            );


            showToast(
                "No parking data found in database."
            );

        }


        // ==================================================
        // ERROR
        // ==================================================

        function showErrorHeatmap() {

            showToast(
                "Unable to load parking data."
            );

        }


        // ==================================================
        // HTML SECURITY
        // ==================================================

        function escapeHTML(
            value
        ) {

            return String(
                value || ""
            ).replace(
                /[&<>"']/g,
                character => ({

                    "&":
                        "&amp;",

                    "<":
                        "&lt;",

                    ">":
                        "&gt;",

                    '"':
                        "&quot;",

                    "'":
                        "&#039;"

                }[character])
            );

        }


        // ==================================================
        // TOAST
        // ==================================================

        function showToast(
            message
        ) {

            let toast =
                document.getElementById(
                    "heatmapToast"
                );


            if (!toast) {

                toast =
                    document.createElement(
                        "div"
                    );

                toast.id =
                    "heatmapToast";

                toast.className =
                    "heatmap-toast";

                document.body.appendChild(
                    toast
                );

            }


            toast.textContent =
                message;


            toast.classList.add(
                "show"
            );


            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                3000
            );

        }


        // ==================================================
        // EVENTS
        // ==================================================

        refreshBtn.addEventListener(
            "click",
            loadHeatmap
        );


        // ==================================================
        // INITIAL LOAD
        // ==================================================

        loadUserProfile();

        loadHeatmap();

    }
);