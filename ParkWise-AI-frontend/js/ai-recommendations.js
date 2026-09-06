document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("recommendationsList");
    const prioritySelect = document.getElementById("prioritySelect");
    const recalculateBtn = document.getElementById("recalculateBtn");


    const API_BASE_URL = "http://127.0.0.1:8000";

async function loadRecommendations() {

    const list = document.getElementById("recommendationsList");

    list.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-robot fa-spin"></i>
            <h3>Finding the best parking...</h3>
            <p>Comparing availability, price, distance and ratings.</p>
        </div>
    `;

    const selectedLocation =
        JSON.parse(
            localStorage.getItem("parkwise_selected_location")
        );

    if (
        !selectedLocation ||
        !Number.isFinite(selectedLocation.latitude) ||
        !Number.isFinite(selectedLocation.longitude)
    ) {

        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-location-dot"></i>
                <h3>Location not selected</h3>
                <p>Please select a destination from Find Parking first.</p>

                <a href="find-parking.html" class="btn-book">
                    Find Parking
                </a>
            </div>
        `;

        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/recommendations`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    latitude:
                        selectedLocation.latitude,

                    longitude:
                        selectedLocation.longitude,

                    radius_km: 5,

                    price_weight: 0.20,

                    distance_weight: 0.25,

                    rating_weight: 0.20,

                    availability_weight: 0.35

                })
            }
        );

        if (!response.ok) {
            throw new Error(
                "Recommendation API failed"
            );
        }

        const data =
            await response.json();

        if (
            !data.recommendations ||
            data.recommendations.length === 0
        ) {

            list.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-car"></i>
                    <h3>No parking found</h3>
                    <p>
                        No suitable parking was found
                        within 5 km.
                    </p>
                </div>
            `;

            return;
        }

        renderRecommendations(
            data.recommendations
        );

    } catch (error) {

        console.error(
            "Recommendation error:",
            error
        );

        list.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Unable to load recommendations</h3>

                <p>
                    Please make sure the FastAPI backend
                    and MongoDB are running.
                </p>
            </div>
        `;
    }
}
    // Calculate recommendation score
    sortedSpots.forEach((spot) => {
        let score = 0;

        if (priority === "price") {

            // Lower price gives higher score
            score = Math.max(
                60,
                Math.round(100 - (spot.price * 1.5))
            );

        } else if (priority === "distance") {

            // Closer distance gives higher score
            score = Math.max(
                60,
                Math.round(100 - (spot.dist * 12))
            );

        } else if (priority === "availability") {

            // Actual availability based score
            score = Math.max(
                60,
                Math.round((Number(spot.available_slots || 0) / Math.max(1, Number(spot.total_slots || 1))) * 100)
            );

        } else {

            // Balanced recommendation
            const priceFactor = (50 - spot.price) * 0.4;
            const distFactor = (3 - spot.dist) * 8;
            const ratingFactor = spot.rating * 10;

            // Include actual availability
            const availabilityFactor =
                (Number(spot.available_slots || 0) / Math.max(1, Number(spot.total_slots || 1))) * 15;

            score = Math.min(
                99,
                Math.max(
                    65,
                    Math.round(
                        ratingFactor +
                        priceFactor +
                        distFactor +
                        availabilityFactor
                    )
                )
            );
        }

        spot.calculatedScore = score;
    });

    // Sort highest score first
    sortedSpots.sort(
        (a, b) => b.calculatedScore - a.calculatedScore
    );

    renderCards(sortedSpots);


    function renderCards(spots) {
        list.innerHTML = "";

        spots.forEach((spot, idx) => {
            const card = document.createElement("div");
            card.className = "rec-card";
            card.innerHTML = `
                <div class="rec-main">
                    <div class="rec-badge">#${idx + 1}</div>
                    <div class="rec-details">
                        <h3>${spot.name}</h3>
                        <div class="rec-tags">
                            <span><i class="fa-solid fa-indian-rupee-sign"></i> ₹${spot.price}/hr</span>
                            <span><i class="fa-solid fa-route"></i> ${spot.dist} km away</span>
                            <span><i class="fa-solid fa-star"></i> ${spot.rating}</span>
                        </div>
                    </div>
                </div>
                <div class="rec-actions">
                    <div class="match-score">
                        <span class="score">${spot.calculatedScore}%</span>
                        <span class="label">Match Score Score</span>
                    </div>
                    <button class="btn-book" onclick="bookParking('${spot.name}')">Book Now</button>
                </div>
            `;
            list.appendChild(card);
        });
    }


async function bookParking(spotName) {

    const userId =
        localStorage.getItem("user_id");

    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/book",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        spot_name:
                            spotName,

                        user_id:
                            userId

                    })
                }
            );

        const result =
            await response.json();

        if (response.ok) {

            alert(
                result.message ||
                "Parking booked successfully!"
            );

        } else {

            alert(
                result.detail ||
                "Booking failed"
            );

        }

    } catch (error) {

        console.error(error);

        alert(
            "Backend connection failed"
        );
    }
}

function renderRecommendations(spots) {

    const list =
        document.getElementById(
            "recommendationsList"
        );

    list.innerHTML = "";

    spots.slice(0, 5).forEach(
        (spot, index) => {

            const occupancy =
                Number(
                    spot.predicted_occupancy || 0
                );

            const availability =
                Number(
                    spot.predicted_availability ||
                    (100 - occupancy)
                );

            const score =
                Number(
                    spot.recommendation_score || 0
                );

            const card =
                document.createElement("div");

            card.className =
                "rec-card";

            card.innerHTML = `

                <div class="rank-badge">
                    #${index + 1}
                </div>

                <div class="rec-main">

                    <div class="rec-details">

                        <div class="title-row">

                            <h3>
                                ${spot.name}
                            </h3>

                            ${
                                index === 0
                                ?
                                `<span class="best-badge">
                                    <i class="fa-solid fa-crown"></i>
                                    Best Match
                                </span>`
                                :
                                ""
                            }

                        </div>

                        <p class="address">
                            <i class="fa-solid fa-location-dot"></i>
                            ${spot.address || "Location available"}
                        </p>

                        <div class="rec-tags">

                            <span>
                                <i class="fa-solid fa-indian-rupee-sign"></i>
                                ₹${Number(spot.price).toFixed(0)}/hr
                            </span>

                            <span>
                                <i class="fa-solid fa-route"></i>
                                ${Number(spot.distance_km).toFixed(2)} km
                            </span>

                            <span>
                                <i class="fa-solid fa-star"></i>
                                ${Number(spot.rating).toFixed(1)}
                            </span>

                        </div>

                        <div class="ml-section">

                            <div class="ml-header">

                                <span>
                                    <i class="fa-solid fa-brain"></i>
                                    Current Occupancy
                                </span>

                                <strong>
                                    ${occupancy.toFixed(1)}%
                                </strong>

                            </div>

                            <div class="progress-bar">

                                <div
                                    class="progress-fill"
                                    style="width:${occupancy}%">
                                </div>

                            </div>

                            <div class="availability-text">

                                <span>
                                    Current Availability
                                </span>

                                <strong>
                                    ${availability.toFixed(1)}%
                                </strong>

                            </div>

                        </div>

                    </div>

                </div>

                <div class="rec-actions">

                    <div class="match-score">

                        <span class="score">
                            ${score.toFixed(0)}%
                        </span>

                        <span class="label">
                            Match Score
                        </span>

                    </div>

                    <div class="slot-info">

                        <i class="fa-solid fa-square-parking"></i>

                        ${spot.available_slots}
                        /
                        ${spot.total_slots}
                        slots available

                    </div>

                    <button
                        class="btn-book"
                        onclick="bookParking('${spot.name}')">

                        <i class="fa-solid fa-calendar-check"></i>
                        Book Now

                    </button>

                </div>

            `;

            list.appendChild(card);
        }
    );
}
});