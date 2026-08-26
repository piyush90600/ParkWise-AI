document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("recommendationsList");
    const prioritySelect = document.getElementById("prioritySelect");
    const recalculateBtn = document.getElementById("recalculateBtn");

    // Sample parking dataset with key ML features
    const parkingLots = [
        { name: "City Mall Underpark", price: 30, dist: 0.6, rating: 4.8, baseOccupancy: 45 },
        { name: "Central Station Plaza", price: 20, dist: 1.1, rating: 4.5, baseOccupancy: 30 },
        { name: "Sector 18 Commercial Lot", price: 40, dist: 1.5, rating: 4.2, baseOccupancy: 75 },
        { name: "Grand Vista Parking Deck", price: 25, dist: 2.4, rating: 4.0, baseOccupancy: 20 },
        { name: "Metro Hub Express Lot", price: 15, dist: 1.8, rating: 4.6, baseOccupancy: 15 }
    ];

    async function calculateAndSort() {
    const priority = prioritySelect.value;
    const sortedSpots = [...parkingLots];

    // Get ML predicted occupancy for every parking spot
    await Promise.all(
        sortedSpots.map(async (spot) => {
            try {
                const response = await fetch("http://127.0.0.1:8000/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        price: spot.price,
                        avg_rating: spot.rating,
                        distance_km: spot.dist
                    })
                });

                if (!response.ok) {
                    throw new Error("Prediction API failed");
                }

                const data = await response.json();

                spot.predictedOccupancy = Number(data.predicted_occupancy);

            } catch (error) {
                console.error("ML prediction error:", error);

                // Fallback to existing value if backend is unavailable
                spot.predictedOccupancy = spot.baseOccupancy;
            }
        })
    );

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

            // ML predicted lower occupancy = better availability
            score = Math.max(
                60,
                Math.round(100 - spot.predictedOccupancy)
            );

        } else {

            // Balanced recommendation
            const priceFactor = (50 - spot.price) * 0.4;
            const distFactor = (3 - spot.dist) * 8;
            const ratingFactor = spot.rating * 10;

            // Include ML predicted availability
            const availabilityFactor =
                (100 - spot.predictedOccupancy) * 0.15;

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
}

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
                        <span class="label">AI Match Score</span>
                    </div>
                    <button class="btn-book" onclick="bookParking('${spot.name}')">Book Now</button>
                </div>
            `;
            list.appendChild(card);
        });
    }
    // Real-time parking availability
async function refreshParkingAvailability() {
    try {
        const response = await fetch("http://127.0.0.1:8000/parking-spots");

        if (!response.ok) {
            throw new Error("Parking availability API failed");
        }

        const data = await response.json();

        if (data.status === "success") {
            parkingLots.forEach((spot) => {
                if (data.spots[spot.name]) {
                    spot.availableSlots =
                        data.spots[spot.name].available_slots;

                    spot.totalSlots =
                        data.spots[spot.name].total_slots;
                }
            });

            // Refresh recommendations/cards
            await calculateAndSort();
        }
    } catch (error) {
        console.error("Real-time availability error:", error);
    }
}

// Refresh every 5 seconds
setInterval(refreshParkingAvailability, 5000);

    // Trigger on button click and dropdown selection change
    recalculateBtn.addEventListener("click", calculateAndSort);
    prioritySelect.addEventListener("change", calculateAndSort);

    // Initial render
    calculateAndSort();
});
async function bookParking(spotName) {
    try {
        const response = await fetch("http://127.0.0.1:8000/book", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                spot_name: spotName
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
        } else {
            alert("Booking failed");
        }

    } catch (error) {
        console.error(error);
        alert("Backend connection failed");
    }
}