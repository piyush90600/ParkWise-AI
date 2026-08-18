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

    function calculateAndSort() {
        const priority = prioritySelect.value;
        const sortedSpots = [...parkingLots];

        // Dynamic sorting and match score calculation based on priority
        sortedSpots.forEach(spot => {
            let score = 0;

            if (priority === "price") {
                // Lower price gives higher score
                score = Math.max(60, Math.round(100 - (spot.price * 1.5)));
            } else if (priority === "distance") {
                // Closer distance gives higher score
                score = Math.max(60, Math.round(100 - (spot.dist * 12)));
            } else if (priority === "availability") {
                // Lower occupancy gives higher score
                score = Math.max(60, Math.round(100 - spot.baseOccupancy));
            } else {
                // Balanced ML scoring (Rating + low price + short distance)
                const priceFactor = (50 - spot.price) * 0.4;
                const distFactor = (3 - spot.dist) * 8;
                const ratingFactor = spot.rating * 10;
                score = Math.min(99, Math.max(65, Math.round(ratingFactor + priceFactor + distFactor)));
            }

            spot.calculatedScore = score;
        });

        // Sort descending by calculated score
        sortedSpots.sort((a, b) => b.calculatedScore - a.calculatedScore);

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
                    <button class="btn-book" onclick="alert('Proceeding to reserve spot at ${spot.name}')">Book Now</button>
                </div>
            `;
            list.appendChild(card);
        });
    }

    // Trigger on button click and dropdown selection change
    recalculateBtn.addEventListener("click", calculateAndSort);
    prioritySelect.addEventListener("change", calculateAndSort);

    // Initial render
    calculateAndSort();
});