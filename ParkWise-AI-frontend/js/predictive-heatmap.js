document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       MAP INITIALIZATION
       ===================================================== */

    const map = L.map("heatmapMap").setView(
        [28.6692, 77.4538],
        13
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const refreshBtn =
        document.getElementById("refreshHeatmapBtn");

    const timeSelect =
        document.getElementById("timeRangeSelect");


    /* =====================================================
       PARKING DATA
       ===================================================== */

    const locations = [

        {
            name: "City Center Plaza",
            lat: 28.6720,
            lng: 77.4480,
            price: 40,
            rating: 4.6,
            distance: 0.8,
            baseOcc: 89
        },

        {
            name: "Metro Hub P2",
            lat: 28.6650,
            lng: 77.4580,
            price: 20,
            rating: 4.1,
            distance: 1.4,
            baseOcc: 24
        },

        {
            name: "Central Market Zone",
            lat: 28.6750,
            lng: 77.4600,
            price: 50,
            rating: 4.7,
            distance: 2.1,
            baseOcc: 70
        },

        {
            name: "Grand Vista Parking",
            lat: 28.6620,
            lng: 77.4500,
            price: 25,
            rating: 4.4,
            distance: 1.7,
            baseOcc: 48
        }

    ];


    /* =====================================================
       MAP CIRCLES
       ===================================================== */

    let circles = [];


    /* =====================================================
       OCCUPANCY COLOR
       ===================================================== */

    function getColor(occupancy) {

        if (occupancy > 75) {
            return "#ef4444";
        }

        if (occupancy > 40) {
            return "#eab308";
        }

        return "#22c55e";
    }


    /* =====================================================
       SIMULATED TIME FORECAST
       ===================================================== */

    function applyTimeForecast(baseOccupancy) {

        const selectedTime = timeSelect.value;

        let occupancy = baseOccupancy;


        if (selectedTime === "1hr") {

            occupancy += 5;

        } else if (selectedTime === "3hr") {

            occupancy += 10;

        } else if (selectedTime === "peak") {

            occupancy += 15;

        }


        /* Keep value between 5 and 98 */

        occupancy = Math.max(
            5,
            Math.min(98, occupancy)
        );


        return occupancy;
    }


    /* =====================================================
       LOAD HEATMAP
       ===================================================== */

    async function loadHeatmap() {

        /* Button animation */

        refreshBtn.classList.add("loading");

        refreshBtn.disabled = true;


        /* Remove old circles */

        circles.forEach(circle => {

            map.removeLayer(circle);

        });

        circles = [];


        /* Process locations */

        for (const location of locations) {

            let occupancy =
                applyTimeForecast(location.baseOcc);


            /* =================================================
               FASTAPI ML PREDICTION
               ================================================= */

            try {

                const response = await fetch(
                    "http://127.0.0.1:8000/predict",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            price: location.price,

                            avg_rating: location.rating,

                            distance_km: location.distance

                        })
                    }
                );


                if (response.ok) {

                    const data =
                        await response.json();


                    if (
                        data.predicted_occupancy !==
                        undefined
                    ) {

                        occupancy =
                            Number(
                                data.predicted_occupancy
                            );

                        /* Apply forecast */

                        occupancy =
                            applyTimeForecast(
                                occupancy
                            );
                    }
                }

            } catch (error) {

                /*
                    If FastAPI is not running,
                    the frontend uses the sample
                    occupancy values automatically.
                */

                console.log(
                    "ML API unavailable. Using sample prediction."
                );
            }


            /* =================================================
               CREATE CIRCLE
               ================================================= */

            const color =
                getColor(occupancy);


            const circle =
                L.circle(
                    [
                        location.lat,
                        location.lng
                    ],
                    {

                        color: color,

                        fillColor: color,

                        fillOpacity: 0.40,

                        weight: 2,

                        radius: 450

                    }
                ).addTo(map);


            /* =================================================
               POPUP
               ================================================= */

            circle.bindPopup(`

                <div style="
                    min-width:180px;
                    font-family:Inter,sans-serif;
                ">

                    <strong style="
                        font-size:14px;
                        color:#17243d;
                    ">
                        ${location.name}
                    </strong>

                    <br><br>

                    <span>
                        Occupancy:
                    </span>

                    <strong style="
                        color:${color};
                    ">
                        ${Math.round(occupancy)}%
                    </strong>

                    <br>

                    <span>
                        Parking Rate:
                    </span>

                    <strong>
                        ₹${location.price}/hr
                    </strong>

                    <br>

                    <span>
                        Rating:
                    </span>

                    <strong>
                        ⭐ ${location.rating}
                    </strong>

                </div>

            `);


            circles.push(circle);

        }


        /* Button animation off */

        setTimeout(() => {

            refreshBtn.classList.remove("loading");

            refreshBtn.disabled = false;

        }, 400);

    }


    /* =====================================================
       REFRESH BUTTON
       ===================================================== */

    refreshBtn.addEventListener(
        "click",
        loadHeatmap
    );


    /* =====================================================
       TIME WINDOW CHANGE
       ===================================================== */

    timeSelect.addEventListener(
        "change",
        loadHeatmap
    );


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    loadHeatmap();

});