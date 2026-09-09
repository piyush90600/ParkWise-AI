// ==========================================
// PARKWISE AI - AI RECOMMENDATIONS
// ==========================================

const API_BASE_URL =
    "http://127.0.0.1:8000";


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const prioritySelect =
            document.getElementById(
                "prioritySelect"
            );


        const recalculateBtn =
            document.getElementById(
                "recalculateBtn"
            );


        // Load recommendations initially

        loadRecommendations();


        // Recalculate button

        if (recalculateBtn) {

            recalculateBtn.addEventListener(
                "click",
                () => {

                    loadRecommendations();

                }
            );

        }


        // Automatically recalculate
        // when priority changes

        if (prioritySelect) {

            prioritySelect.addEventListener(
                "change",
                () => {

                    loadRecommendations();

                }
            );

        }

    }
);


// ==========================================
// GET AI WEIGHTS BASED ON USER PRIORITY
// ==========================================

function getPriorityWeights(priority) {

    // --------------------------------------
    // BEST VALUE
    // --------------------------------------

    if (priority === "balanced") {

        return {

            price_weight: 0.25,

            distance_weight: 0.25,

            rating_weight: 0.15,

            availability_weight: 0.35

        };

    }


    // --------------------------------------
    // LOWEST PRICE
    // --------------------------------------

    if (priority === "price") {

        return {

            price_weight: 0.60,

            distance_weight: 0.15,

            rating_weight: 0.05,

            availability_weight: 0.20

        };

    }


    // --------------------------------------
    // SHORTEST DISTANCE
    // --------------------------------------

    if (priority === "distance") {

        return {

            price_weight: 0.10,

            distance_weight: 0.60,

            rating_weight: 0.05,

            availability_weight: 0.25

        };

    }


    // --------------------------------------
    // HIGHEST AVAILABILITY
    // --------------------------------------

    if (priority === "availability") {

        return {

            price_weight: 0.10,

            distance_weight: 0.15,

            rating_weight: 0.05,

            availability_weight: 0.70

        };

    }


    // Default

    return {

        price_weight: 0.25,

        distance_weight: 0.25,

        rating_weight: 0.15,

        availability_weight: 0.35

    };

}


// ==========================================
// LOAD RECOMMENDATIONS
// ==========================================

async function loadRecommendations() {

    const list =
        document.getElementById(
            "recommendationsList"
        );


    const prioritySelect =
        document.getElementById(
            "prioritySelect"
        );


    if (!list) {

        console.error(
            "recommendationsList not found"
        );

        return;

    }


    // --------------------------------------
    // SHOW LOADING
    // --------------------------------------

    list.innerHTML = `

        <div class="loading-state">

            <i class="fa-solid fa-robot fa-spin"></i>

            <h3>
                AI is finding the best parking...
            </h3>

            <p>
                Comparing price, distance,
                availability and rating.
            </p>

        </div>

    `;


    // --------------------------------------
    // GET LOCATION FROM FIND PARKING PAGE
    // --------------------------------------

    let selectedLocation = null;


    try {

        selectedLocation =
            JSON.parse(

                localStorage.getItem(
                    "parkwise_selected_location"
                )

            );

    } catch (error) {

        console.error(
            "Location parsing error:",
            error
        );

    }


    // --------------------------------------
    // VALIDATE LOCATION
    // --------------------------------------

    if (

        !selectedLocation ||

        !Number.isFinite(
            Number(selectedLocation.latitude)
        ) ||

        !Number.isFinite(
            Number(selectedLocation.longitude)
        )

    ) {

        list.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-location-dot"></i>

                <h3>
                    Location not selected
                </h3>

                <p>
                    Please search a location
                    from Find Parking first.
                </p>

                <a
                    href="find-parking.html"
                    class="btn-book"
                >

                    <i class="fa-solid fa-location-dot"></i>

                    Find Parking

                </a>

            </div>

        `;

        return;

    }


    // --------------------------------------
    // GET USER PRIORITY
    // --------------------------------------

    const priority =
        prioritySelect
            ? prioritySelect.value
            : "balanced";


    // --------------------------------------
    // GET AI WEIGHTS
    // --------------------------------------

    const weights =
        getPriorityWeights(
            priority
        );


    try {

        // ----------------------------------
        // CALL BACKEND AI API
        // ----------------------------------

        const response =
            await fetch(

                `${API_BASE_URL}/recommendations`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        latitude:
                            Number(
                                selectedLocation.latitude
                            ),

                        longitude:
                            Number(
                                selectedLocation.longitude
                            ),


                        radius_km: 10,


                        price_weight:
                            weights.price_weight,


                        distance_weight:
                            weights.distance_weight,


                        rating_weight:
                            weights.rating_weight,


                        availability_weight:
                            weights.availability_weight

                    })

                }

            );


        if (!response.ok) {

            throw new Error(

                `Recommendation API failed: ${response.status}`

            );

        }


        const data =
            await response.json();


        console.log(
            "AI Recommendations:",
            data
        );


        if (

            !data.recommendations ||

            data.recommendations.length === 0

        ) {

            list.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-square-parking"></i>

                    <h3>
                        No parking found
                    </h3>

                    <p>
                        No suitable parking was found
                        near your selected location.
                    </p>

                </div>

            `;

            return;

        }


        // ----------------------------------
        // SORT DATA BASED ON USER PRIORITY
        // ----------------------------------

        const sortedParking =

            sortRecommendations(

                data.recommendations,

                priority

            );


        // ----------------------------------
        // RENDER
        // ----------------------------------

        renderRecommendations(
            sortedParking,
            priority
        );


    } catch (error) {

        console.error(
            "Recommendation error:",
            error
        );


        list.innerHTML = `

            <div class="error-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Unable to load recommendations
                </h3>

                <p>
                    Please make sure the FastAPI backend
                    and MongoDB are running.
                </p>

            </div>

        `;

    }

}


// ==========================================
// SORT RECOMMENDATIONS
// ==========================================

function sortRecommendations(
    parking,
    priority
) {

    const sorted =
        [...parking];


    // --------------------------------------
    // LOWEST PRICE
    // --------------------------------------

    if (priority === "price") {

        return sorted.sort(

            (a, b) =>

                Number(a.price_per_hour || 0)

                -

                Number(b.price_per_hour || 0)

        );

    }


    // --------------------------------------
    // SHORTEST DISTANCE
    // --------------------------------------

    if (priority === "distance") {

        return sorted.sort(

            (a, b) =>

                Number(a.distance_km || 999)

                -

                Number(b.distance_km || 999)

        );

    }


    // --------------------------------------
    // HIGHEST AVAILABILITY
    // --------------------------------------

    if (priority === "availability") {

        return sorted.sort(

            (a, b) => {

                const availabilityA =

                    Number(a.available_slots || 0) /

                    Math.max(
                        1,
                        Number(a.total_slots || 1)
                    );


                const availabilityB =

                    Number(b.available_slots || 0) /

                    Math.max(
                        1,
                        Number(b.total_slots || 1)
                    );


                return (
                    availabilityB -
                    availabilityA
                );

            }

        );

    }


    // --------------------------------------
    // BEST VALUE
    // --------------------------------------

    return sorted.sort(

        (a, b) =>

            Number(
                b.recommendation_score || 0
            )

            -

            Number(
                a.recommendation_score || 0
            )

    );

}


// ==========================================
// GET PRIORITY LABEL
// ==========================================

function getPriorityLabel(priority) {

    const labels = {

        balanced:
            "Best Value",

        price:
            "Lowest Price",

        distance:
            "Shortest Distance",

        availability:
            "Highest Availability"

    };


    return labels[priority] ||
        "Best Value";

}


// ==========================================
// RENDER RECOMMENDATIONS
// ==========================================

function renderRecommendations(
    spots,
    priority
) {

    const list =
        document.getElementById(
            "recommendationsList"
        );


    list.innerHTML = "";


    spots
        .slice(0, 5)
        .forEach(

            (spot, index) => {


                // ----------------------------------
                // DATA
                // ----------------------------------

                const price =
                    Number(
                        spot.price_per_hour || 0
                    );


                const distance =
                    Number(
                        spot.distance_km || 0
                    );


                const rating =
                    Number(
                        spot.avg_rating || 0
                    );


                const totalSlots =
                    Number(
                        spot.total_slots || 0
                    );


                const availableSlots =
                    Number(
                        spot.available_slots || 0
                    );


                const predictedOccupancy =
                    Number(
                        spot.predicted_occupancy_pct || 0
                    );


                const availabilityPercent =

                    totalSlots > 0

                    ?

                    (
                        availableSlots /
                        totalSlots
                    ) * 100

                    :

                    Number(
                        spot.predicted_available_pct || 0
                    );


                const score =
                    Number(
                        spot.recommendation_score || 0
                    );


                // ----------------------------------
                // CREATE CARD
                // ----------------------------------

                const card =
                    document.createElement(
                        "div"
                    );


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
                                    ${spot.name || "Parking Area"}
                                </h3>


                                ${

                                    index === 0

                                    ?

                                    `

                                    <span class="best-badge">

                                        <i class="fa-solid fa-crown"></i>

                                        ${getPriorityLabel(priority)}

                                    </span>

                                    `

                                    :

                                    ""

                                }

                            </div>


                            <p class="address">

                                <i class="fa-solid fa-location-dot"></i>

                                ${
                                    spot.address ||
                                    "Address not available"
                                }

                            </p>


                            <div class="rec-tags">


                                <span>

                                    <i class="fa-solid fa-indian-rupee-sign"></i>

                                    ₹${price.toFixed(0)}/hr

                                </span>


                                <span>

                                    <i class="fa-solid fa-route"></i>

                                    ${distance.toFixed(2)} km away

                                </span>


                                <span>

                                    <i class="fa-solid fa-star"></i>

                                    ${rating.toFixed(1)}

                                </span>


                            </div>


                            <div class="ml-section">


                                <div class="ml-header">

                                    <span>

                                        <i class="fa-solid fa-brain"></i>

                                        Predicted Occupancy

                                    </span>


                                    <strong>

                                        ${predictedOccupancy.toFixed(1)}%

                                    </strong>

                                </div>


                                <div class="progress-bar">

                                    <div

                                        class="progress-fill"

                                        style="
                                            width:
                                            ${Math.min(
                                                100,
                                                predictedOccupancy
                                            )}%
                                        "

                                    >

                                    </div>

                                </div>


                                <div class="availability-text">

                                    <span>

                                        <i class="fa-solid fa-square-parking"></i>

                                        Available Slots

                                    </span>


                                    <strong>

                                        ${availableSlots}
                                        /
                                        ${totalSlots}

                                        (${availabilityPercent.toFixed(0)}%)

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

                                AI Match Score

                            </span>

                        </div>


                        <button

                            class="btn-book"

                            onclick="
                                bookParking(
                                    '${spot.parking_lots_id}'
                                )
                            "

                        >

                            <i class="fa-solid fa-calendar-check"></i>

                            Book Now

                        </button>


                    </div>

                `;


                list.appendChild(
                    card
                );

            }

        );

}


// ==========================================
// BOOK PARKING
// ==========================================

function bookParking(lotId) {

    localStorage.setItem(
        "selected_parking_lot_id",
        lotId
    );


    alert(
        "Parking selected successfully!"
    );


    // You can redirect to booking page here

    // window.location.href = "booking.html";

}


