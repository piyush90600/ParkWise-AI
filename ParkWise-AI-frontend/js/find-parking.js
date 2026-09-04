let parkingMap = null;

let parkingMapMarkers = [];

function initializeParkingMap() {

    const mapElement =
        document.getElementById(
            "parkingMap"
        );


    if (!mapElement) {
        return;
    }


    if (parkingMap) {
        return;
    }


    parkingMap =
        L.map(
            mapElement
        ).setView(
            [
                20.5937,
                78.9629
            ],
            5
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            attribution:
                "&copy; OpenStreetMap contributors"

        }
    ).addTo(
        parkingMap
    );

}

// ==========================================
// PARKWISE AI - FIND PARKING
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";

let parkingData = {};
let selectedParkingId = null;
let currentParkingList = [];
let mapScale = 1;
let toastTimer = null;
let recommendedParkingId = null;


// ==========================================
// DOM ELEMENTS
// ==========================================

const destinationInput =
    document.getElementById("destinationInput");

const locationSuggestions =
    document.getElementById(
        "locationSuggestions"
    );


let suggestionTimer = null;

let suggestionController = null;

let selectedLocationSuggestion = null;

const clearSearchButton =
    document.getElementById("clearSearch");

const parkingModal =
    document.getElementById("parkingModal");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const parkingCardsContainer =
    document.getElementById("parkingCards");

const mapMarkers =
    document.getElementById("mapMarkers");

const mapEmptyState =
    document.getElementById("mapEmptyState");


// ==========================================
// USER PROFILE
// ==========================================

function loadUserProfile() {

    const userName =
        localStorage.getItem("user_name") ||
        localStorage.getItem("username") ||
        "User";

    const profileName =
        document.getElementById("profileName") ||
        document.querySelector(".profile-name");

    const profileAvatar =
        document.getElementById("profileAvatar") ||
        document.querySelector(".profile-avatar");

    if (profileName) {
        profileName.textContent = userName;
    }

    if (profileAvatar) {

        profileAvatar.textContent =
            userName
                .trim()
                .charAt(0)
                .toUpperCase();

    }
}


// ==========================================
// SEARCH PARKING
// ==========================================

async function searchParking() {

    if (!destinationInput) {
        console.error(
            "destinationInput element not found."
        );
        return;
    }

    const destination =
        destinationInput.value.trim();

    if (
        selectedLocationSuggestion
    ) {

        const latitude =
            Number(
                selectedLocationSuggestion.latitude
            );

        const longitude =
            Number(
                selectedLocationSuggestion.longitude
            );


        if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
        ) {

            hideLocationSuggestions();

            showLocationCoordinates(
                latitude,
                longitude
            );

            await loadNearbyParking(
                latitude,
                longitude
            );

            return;

        }

    }

    if (!destination && !currentLatitude && !currentLongitude) {
        showNotification("Enter destination first");
        return;
    }
    showLoadingState();

    try {

        const locationResponse =
            await fetch(
                `${API_BASE_URL}/location-search?q=${encodeURIComponent(destination)}`
            );

        if (!locationResponse.ok) {

            throw new Error(
                `Location search failed: ${locationResponse.status}`
            );
        }

        const locationData =
            await locationResponse.json();

        const locations =
            Array.isArray(
                locationData.locations
            )
                ? locationData.locations
                : [];


        if (!locations.length) {

            showToast(
                "Location could not be found."
            );

            showEmptyState();

            hideLocationSuggestions();

            return;

        }


        const selectedLocation =
            locations[0];


        const latitude =
            Number(
                selectedLocation.latitude
            );


        const longitude =
            Number(
                selectedLocation.longitude
            );

        // ==================================================
        // SAVE USER SEARCH LOCATION
        // ==================================================

        window.selectedUserLocation = {

            latitude:
                latitude,

            longitude:
                longitude

        };


        // Show coordinates in UI

        showLocationCoordinates(
            latitude,
            longitude
        );

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            showToast(
                "Location could not be found."
            );

            showEmptyState();

            return;
        }

        await loadNearbyParking(
            latitude,
            longitude
        );

    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        showToast(
            "Unable to find parking. Please try again."
        );

        showEmptyState();
    }
}


// ==========================================
// LOAD NEARBY PARKING
// ==========================================

async function loadNearbyParking(
    latitude,
    longitude
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/nearby-parking` +
                `?latitude=${encodeURIComponent(latitude)}` +
                `&longitude=${encodeURIComponent(longitude)}` +
                `&radius_km=5`
            );

        if (!response.ok) {

            throw new Error(
                `Nearby parking API failed: ${response.status}`
            );
        }

        const data =
            await response.json();

        currentParkingList =
            Array.isArray(data.parking)
                ? data.parking
                : [];

        // Reset previous data
        parkingData = {};
        selectedParkingId = null;
        recommendedParkingId = null;

        renderParkingList(
            currentParkingList
        );

        renderRealMapMarkers(
            currentParkingList,

            latitude,

            longitude
        );

        updateResultCount(
            currentParkingList.length
        );

        updateAIRecommendation(
            currentParkingList
        );

        if (currentParkingList.length === 0) {

            showToast(
                "No parking available near this location."
            );

        } else {

            showToast(
                `${currentParkingList.length} parking areas found.`
            );
        }

    } catch (error) {

        console.error(
            "Parking API error:",
            error
        );

        showToast(
            "Unable to load parking data."
        );

        showEmptyState();
    }
}


// ==========================================
// RENDER PARKING CARDS
// ==========================================

function renderParkingList(parkingList) {

    if (!parkingCardsContainer) {
        console.error(
            "parkingCards element not found."
        );
        return;
    }

    parkingCardsContainer.innerHTML = "";

    if (
        !Array.isArray(parkingList) ||
        parkingList.length === 0
    ) {

        showEmptyState();

        return;
    }

    parkingList.forEach(
        (parking, index) => {

            const id =
                parking.id ??
                parking._id ??
                index + 1;

            parkingData[id] =
                parking;

            const card =
                createParkingCard(
                    parking,
                    id
                );

            parkingCardsContainer.appendChild(
                card
            );
        }
    );
}


// ==========================================
// CREATE PARKING CARD
// ==========================================

function createParkingCard(
    parking,
    id
) {

    const card =
        document.createElement("div");

    const available =
        Number(
            parking.available_slots ??
            parking.availableSpaces ??
            parking.available ??
            0
        );

    const price =
        Number(
            parking.base_price ??
            parking.price ??
            0
        );

    const distance =
        Number(
            parking.distance_km ??
            parking.distance ??
            0
        );

    const rating =
        Number(
            parking.rating ??
            0
        );

    const status =
        available > 0
            ? "available"
            : "full";

    card.className =
        "parking-card";

    card.dataset.parkingId =
        id;

    card.dataset.status =
        status;

    card.dataset.price =
        price;

    card.dataset.distance =
        distance;

    card.dataset.availability =
        available;

    card.dataset.rating =
        rating;

    const parkingName =
        escapeHTML(
            parking.name ||
            parking.parking_name ||
            "Parking Area"
        );

    card.innerHTML = `

        <div class="parking-card-top">

            <div class="parking-type-icon">
                <i class="fa-solid fa-square-parking"></i>
            </div>

            <div class="parking-main-info">

                <h4>
                    ${parkingName}
                </h4>

                <div class="rating">

                    <i class="fa-solid fa-star"></i>

                    <strong>
                        ${
                            rating > 0
                                ? rating.toFixed(1)
                                : "N/A"
                        }
                    </strong>

                </div>

            </div>

            <span class="status ${
                status === "available"
                    ? "available-status"
                    : "full-status"
            }">

                ${
                    status === "available"
                        ? "Available"
                        : "Full"
                }

            </span>

        </div>

        <div class="parking-details">

            <span>
                <i class="fa-solid fa-location-dot"></i>

                ${
                    distance > 0
                        ? `${distance.toFixed(2)} km`
                        : "Distance unavailable"
                }
            </span>

            <span>
                <i class="fa-solid fa-car"></i>

                ${available} spots
            </span>

        </div>

        <div class="ai-prediction-box">

            <div class="prediction-header">

                <span>

                    <i class="fa-solid fa-wand-magic-sparkles"></i>

                    AI PREDICTION

                </span>

                <strong>

                    ${Math.round(
                        aiMatchScore
                    )}%

                    <small>
                        match
                    </small>

                </strong>

            </div>


            <div class="prediction-content">

                <div class="prediction-stat">

                    <span>
                        Predicted occupancy
                    </span>

                    <strong
                        class="${
                            predictedOccupancy >= 75
                                ? "prediction-high"
                                : predictedOccupancy >= 40
                                    ? "prediction-medium"
                                    : "prediction-low"
                        }">

                        ${Math.round(
                            predictedOccupancy
                        )}%

                    </strong>

                </div>


                <div class="prediction-stat">

                    <span>
                        Expected availability
                    </span>

                    <strong>

                        ${Math.round(
                            predictedAvailability
                        )}%

                    </strong>

                </div>

            </div>


            <div class="prediction-bar">

                <span
                    style="
                        width:${Math.min(
                            predictedOccupancy,
                            100
                        )}%;
                    ">
                </span>

            </div>


            <small class="prediction-status">

                <i class="fa-solid fa-chart-line"></i>

                AI forecast: ${
                    escapeHTML(
                        predictionStatus
                    )
                } congestion

            </small>

        </div>

        <div class="parking-card-bottom">

            <div class="price">

                <strong>
                    ₹${price}
                </strong>

                <span>
                    / hour
                </span>

            </div>

            ${
                available > 0

                    ? `
                        <button
                            type="button"
                            class="direction-btn"
                        >
                            Directions
                            <i class="fa-solid fa-diamond-turn-right"></i>
                        </button>
                    `

                    : `
                        <button
                            type="button"
                            class="disabled-btn"
                            disabled
                        >
                            Full
                        </button>
                    `
            }

        </div>
    `;


    // ======================================
    // CARD CLICK
    // ======================================

    card.addEventListener(
        "click",
        function (event) {

            if (
                event.target.closest("button")
            ) {
                return;
            }

            selectParking(id);
        }
    );


    // ======================================
    // DIRECTIONS BUTTON
    // ======================================

    const directionButton =
        card.querySelector(
            ".direction-btn"
        );

    if (directionButton) {

        directionButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                getDirections(
                    parking
                );
            }
        );
    }


    return card;
}


// ==========================================
// SELECT PARKING
// ==========================================

function selectParking(id) {

    const parking =
        parkingData[id];

    if (!parking) {

        console.warn(
            "Parking not found:",
            id
        );

        return;
    }

    selectedParkingId =
        id;

    const available =
        Number(
            parking.available_slots ??
            parking.availableSpaces ??
            parking.available ??
            0
        );

    const price =
        Number(
            parking.base_price ??
            parking.price ??
            0
        );

    const distance =
        Number(
            parking.distance_km ??
            parking.distance ??
            0
        );

    const statusLabel =
        available > 0
            ? "Available now"
            : "Currently full";


    const selectedStatus =
        document.getElementById(
            "selectedStatus"
        );

    const selectedName =
        document.getElementById(
            "selectedName"
        );

    const selectedSummary =
        document.getElementById(
            "selectedSummary"
        );


    if (selectedStatus) {

        selectedStatus.textContent =
            statusLabel;
    }

    if (selectedName) {

        selectedName.textContent =
            parking.name ||
            parking.parking_name ||
            "Parking Area";
    }

    if (selectedSummary) {

        selectedSummary.textContent =
            `${available} spaces · ` +
            `${distance.toFixed(2)} km · ` +
            `₹${price}/hr`;
    }


    // Highlight marker

    document
        .querySelectorAll(
            ".map-marker"
        )
        .forEach(
            marker => {

                marker.classList.toggle(
                    "selected",
                    String(
                        marker.dataset.parkingId
                    ) === String(id)
                );
            }
        );


    // Highlight card

    document
        .querySelectorAll(
            ".parking-card"
        )
        .forEach(
            card => {

                card.classList.toggle(
                    "selected",
                    String(
                        card.dataset.parkingId
                    ) === String(id)
                );
            }
        );
}


// ==========================================
// AI RECOMMENDATION
// ==========================================

function updateAIRecommendation(
    parkingList
) {

    const recommendationName =
        document.getElementById(
            "recommendationName"
        );

    const recommendationMeta =
        document.getElementById(
            "recommendationMeta"
        );

    const recommendationScore =
        document.getElementById(
            "recommendationScore"
        );

    const recommendationReasons =
        document.getElementById(
            "recommendationReasons"
        );


    if (
        !Array.isArray(parkingList) ||
        parkingList.length === 0
    ) {

        if (recommendationName) {
            recommendationName.textContent =
                "No parking available";
        }

        if (recommendationMeta) {
            recommendationMeta.textContent =
                "Try another destination.";
        }

        if (recommendationScore) {
            recommendationScore.innerHTML =
                '-- <small>match</small>';
        }

        return;
    }


    const available =
        parkingList.filter(
            parking =>
                Number(
                    parking.available_slots ??
                    parking.availableSpaces ??
                    parking.available ??
                    0
                ) > 0
        );


    if (available.length === 0) {

        if (recommendationName) {
            recommendationName.textContent =
                "No parking available";
        }

        if (recommendationMeta) {
            recommendationMeta.textContent =
                "Try another destination.";
        }

        if (recommendationScore) {
            recommendationScore.innerHTML =
                '-- <small>match</small>';
        }

        recommendedParkingId =
            null;

        return;
    }


    const recommended =
        [...available].sort(
            (a, b) => {

                const scoreA =
                    calculateParkingScore(a);

                const scoreB =
                    calculateParkingScore(b);

                return scoreB - scoreA;
            }
        )[0];


    const score =
        Math.round(
            calculateParkingScore(
                recommended
            )
        );


    const parkingId =
        recommended.id ??
        recommended._id;


    recommendedParkingId =
        parkingId;


    if (recommendationName) {

        recommendationName.textContent =
            recommended.name ||
            recommended.parking_name ||
            "Recommended Parking";
    }


    if (recommendationMeta) {

        recommendationMeta.textContent =
            `${Number(
                recommended.distance_km ??
                recommended.distance ??
                0
            ).toFixed(2)} km away`;
    }


    if (recommendationScore) {

        recommendationScore.innerHTML =
            `${Math.min(
                Math.max(score, 0),
                99
            )}% <small>match</small>`;
    }


    if (recommendationReasons) {

        const recommendationDistance =
            Number(
                recommended.distance_km ??
                recommended.distance ??
                0
            );

        const recommendationPrice =
            Number(
                recommended.base_price ??
                recommended.price ??
                0
            );

        const recommendationAvailability =
            Number(
                recommended.available_slots ??
                recommended.availableSpaces ??
                recommended.available ??
                0
            );

        recommendationReasons.innerHTML = `

            <span>
                <i class="fa-solid fa-location-dot"></i>
                ${recommendationDistance.toFixed(2)} km
            </span>

            <span>
                <i class="fa-solid fa-indian-rupee-sign"></i>
                ₹${recommendationPrice}/hr
            </span>

            <span>
                <i class="fa-solid fa-car"></i>
                ${recommendationAvailability} spots
            </span>

        `;
    }
}


// ==========================================
// VIEW RECOMMENDATION
// ==========================================

function selectRecommendedParking() {

    if (
        recommendedParkingId === null ||
        recommendedParkingId === undefined
    ) {

        showToast(
            "Search for parking first."
        );

        return;
    }

    selectParking(
        recommendedParkingId
    );
}


// ==========================================
// EMPTY STATE
// ==========================================

function showEmptyState() {

    if (parkingCardsContainer) {

        parkingCardsContainer.innerHTML = `

            <div class="empty-parking-state">

                <div class="empty-parking-icon">
                    <i class="fa-solid fa-location-crosshairs"></i>
                </div>

                <h3>
                    No parking locations found
                </h3>

                <p>
                    Search another destination or
                    try your current location.
                </p>

            </div>
        `;
    }


    if (mapMarkers) {
        mapMarkers.innerHTML = "";
    }

    if (mapEmptyState) {
        mapEmptyState.style.display =
            "flex";
    }

    updateResultCount(0);
}


// ==========================================
// LOADING STATE
// ==========================================

function showLoadingState() {

    if (!parkingCardsContainer) {
        return;
    }

    parkingCardsContainer.innerHTML = `

        <div class="parking-loading">

            <div class="loading-spinner">
                <i class="fa-solid fa-spinner fa-spin"></i>
            </div>

            <h3>
                Finding nearby parking...
            </h3>

            <p>
                ParkWise AI is checking
                available parking locations.
            </p>

        </div>
    `;
}


// ==========================================
// RESULT COUNT
// ==========================================

function updateResultCount(count) {

    const resultCount =
        document.getElementById(
            "resultCount"
        );

    if (resultCount) {
        resultCount.textContent =
            count;
    }
}


// ==========================================
// HTML SECURITY
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            character => {

                const entities = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"
                };

                return entities[character];
            }
        );
}


// ==========================================
// CLEAR SEARCH
// ==========================================

if (clearSearchButton) {

    clearSearchButton.addEventListener(
        "click",
        function () {

            if (destinationInput) {
                destinationInput.value = "";
                destinationInput.focus();
            }

            selectedLocationSuggestion =
                null;

            hideLocationSuggestions();

            const locationInfo =
                document.getElementById(
                    "selectedLocationInfo"
                );

            if (locationInfo) {

                locationInfo.classList.remove(
                    "show"
                );

            }

            clearSearchButton.style.display =
                "none";

            showEmptyState();
        }
    );
}


// ==========================================
// SEARCH INPUT
// ==========================================

if (destinationInput) {

    destinationInput.addEventListener(
        "input",
        function () {

            if (clearSearchButton) {

                clearSearchButton.style.display =
                    this.value.trim()
                        ? "block"
                        : "none";
            }
        }
    );


    destinationInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                searchParking();
            }
        }
    );
}


// ==========================================
// CURRENT LOCATION
// ==========================================

function useCurrentLocation() {

    if (!navigator.geolocation) {

        showToast(
            "Location is not supported by your browser."
        );

        return;
    }


    showToast(
        "Detecting your current location..."
    );


    navigator.geolocation.getCurrentPosition(

        async function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            window.selectedUserLocation = {

                latitude:
                    latitude,

                longitude:
                    longitude

            };


            showLocationCoordinates(
                latitude,
                longitude
            );


            await loadNearbyParking(
                latitude,
                longitude
            );
        },


        function (error) {

            console.error(
                "Geolocation error:",
                error
            );

            showToast(
                "Unable to access your location."
            );
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


// ==========================================
// FILTER
// ==========================================

function filterParking(
    filter,
    button
) {

    document
        .querySelectorAll(
            ".filter-btn"
        )
        .forEach(
            btn =>
                btn.classList.remove(
                    "active"
                )
        );


    if (button) {

        button.classList.add(
            "active"
        );
    }


    const cards =
        document.querySelectorAll(
            ".parking-card"
        );


    let visibleCount = 0;


    cards.forEach(card => {

        const status =
            card.dataset.status;

        const price =
            Number(
                card.dataset.price
            );

        const distance =
            Number(
                card.dataset.distance
            );


        let show = true;


        if (
            filter === "available"
        ) {

            show =
                status === "available";

        } else if (
            filter === "cheap"
        ) {

            show =
                price <= 40;

        } else if (
            filter === "nearby"
        ) {

            show =
                distance <= 1;
        }


        card.style.display =
            show
                ? ""
                : "none";


        if (show) {
            visibleCount++;
        }
    });


    updateResultCount(
        visibleCount
    );
}


// ==========================================
// SORT
// ==========================================

function sortParking(type) {

    const container =
        document.getElementById(
            "parkingCards"
        );

    if (!container) {
        return;
    }


    const cards =
        Array.from(
            container.querySelectorAll(
                ".parking-card"
            )
        );


    cards.sort(
        (a, b) => {

            switch (type) {

                case "distance":
                    return (
                        Number(
                            a.dataset.distance
                        ) -
                        Number(
                            b.dataset.distance
                        )
                    );

                case "price":
                    return (
                        Number(
                            a.dataset.price
                        ) -
                        Number(
                            b.dataset.price
                        )
                    );

                case "availability":
                    return (
                        Number(
                            b.dataset.availability
                        ) -
                        Number(
                            a.dataset.availability
                        )
                    );

                case "rating":
                    return (
                        Number(
                            b.dataset.rating
                        ) -
                        Number(
                            a.dataset.rating
                        )
                    );

                default:
                    return 0;
            }
        }
    );


    cards.forEach(
        card =>
            container.appendChild(
                card
            )
    );


    const sortMenu =
        document.getElementById(
            "sortMenu"
        );

    if (sortMenu) {

        sortMenu.classList.remove(
            "show"
        );
    }
}


// ==========================================
// MODAL
// ==========================================

function openSelectedParking() {

    if (
        selectedParkingId === null
    ) {

        showToast(
            "Please select a parking area first."
        );

        return;
    }

    openParkingModal(
        selectedParkingId
    );
}


function openParkingModal(id) {

    const parking =
        parkingData[id];

    if (!parking) {
        return;
    }


    const available =
        Number(
            parking.available_slots ??
            parking.availableSpaces ??
            parking.available ??
            0
        );

    const price =
        Number(
            parking.base_price ??
            parking.price ??
            0
        );

    const distance =
        Number(
            parking.distance_km ??
            parking.distance ??
            0
        );


    const modalTitle =
        document.getElementById(
            "modalTitle"
        );

    const modalAddress =
        document.getElementById(
            "modalAddress"
        );

    const modalSpots =
        document.getElementById(
            "modalSpots"
        );

    const modalPrice =
        document.getElementById(
            "modalPrice"
        );

    const modalDistance =
        document.getElementById(
            "modalDistance"
        );


    if (modalTitle) {

        modalTitle.textContent =
            parking.name ||
            parking.parking_name ||
            "Parking Area";
    }

    if (modalAddress) {

        modalAddress.textContent =
            parking.address ||
            "Address unavailable";
    }

    if (modalSpots) {
        modalSpots.textContent =
            available;
    }

    if (modalPrice) {
        modalPrice.textContent =
            `₹${price}`;
    }

    if (modalDistance) {

        modalDistance.textContent =
            `${distance.toFixed(2)} km`;
    }


    if (parkingModal) {

        parkingModal.classList.add(
            "show"
        );

        document.body.style.overflow =
            "hidden";
    }
}


function closeModal() {

    if (!parkingModal) {
        return;
    }

    parkingModal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";
}


// Modal background click

if (parkingModal) {

    parkingModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                parkingModal
            ) {

                closeModal();
            }
        }
    );
}


// ESC key

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeModal();
        }
    }
);


// ==========================================
// GOOGLE MAPS DIRECTIONS
// ==========================================

function getDirections(
    parking
) {

    let destination =
        parking;


    if (
        typeof parking === "object"
    ) {

        destination =
            parking.address ||
            parking.name ||
            parking.parking_name ||
            "";
    }


    if (!destination) {

        showToast(
            "Parking location is unavailable."
        );

        return;
    }


    const mapsURL =
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            destination
        )}`;


    window.open(
        mapsURL,
        "_blank",
        "noopener,noreferrer"
    );
}


// ==========================================
// TOAST
// ==========================================

function showToast(
    message
) {

    if (
        !toast ||
        !toastMessage
    ) {

        console.log(
            message
        );

        return;
    }


    toastMessage.textContent =
        message;

    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );
}


// ==========================================
// MAP ZOOM
// ==========================================

function zoomMap(
    direction
) {

    const map =
        document.getElementById(
            "parkingMap"
        );

    if (!map) {
        return;
    }


    mapScale +=
        direction === "in"
            ? 0.1
            : -0.1;


    mapScale =
        Math.min(
            1.4,
            Math.max(
                0.8,
                mapScale
            )
        );


    const gridSize =
        55 * mapScale;


    map.style.backgroundSize =
        `${gridSize}px ${gridSize}px`;
}


// ==========================================
// MOBILE MENU
// ==========================================

/*
 * IMPORTANT:
 * Use different variable names here.
 * Do not declare "sidebar" if your shared
 * sidebar JavaScript already uses that name.
 */

const mobileMenuButton =
    document.getElementById(
        "mobileMenu"
    );

const mobileSidebar =
    document.querySelector(
        ".sidebar"
    );


if (
    mobileMenuButton &&
    mobileSidebar
) {

    mobileMenuButton.addEventListener(
        "click",
        function () {

            mobileSidebar.classList.toggle(
                "open"
            );
        }
    );
}


// ==========================================
// NOTIFICATIONS
// ==========================================

function toggleNotifications() {

    showToast(
        "No new notifications."
    );
}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadUserProfile();

        showEmptyState();

        console.log(
            "ParkWise AI - Find Parking ready."
        );
    }
);


// ==========================================================
// USER LOCATION DISPLAY
// ==========================================================

function showLocationCoordinates(
    latitude,
    longitude
) {

    let locationInfo =
        document.getElementById(
            "selectedLocationInfo"
        );


    if (!locationInfo) {

        const searchSection =
            document.querySelector(
                ".search-section"
            );


        if (!searchSection) {
            return;
        }


        locationInfo =
            document.createElement(
                "div"
            );


        locationInfo.id =
            "selectedLocationInfo";


        locationInfo.className =
            "selected-location-info";


        searchSection.appendChild(
            locationInfo
        );

    }


    locationInfo.innerHTML = `

        <div class="location-success-icon">

            <i class="fa-solid fa-location-dot"></i>

        </div>

        <div class="location-success-content">

            <span>
                SEARCH LOCATION DETECTED
            </span>

            <strong>
                Nearby parking based on your location
            </strong>

            <small>

                Latitude:
                ${latitude.toFixed(6)}

                &nbsp;&nbsp;•&nbsp;&nbsp;

                Longitude:
                ${longitude.toFixed(6)}

            </small>

        </div>

        <div class="location-ai-badge">

            <i class="fa-solid fa-wand-magic-sparkles"></i>

            LIVE LOCATION

        </div>

    `;


    locationInfo.classList.add(
        "show"
    );

}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeParkingMap();

        loadUserProfile();

        showEmptyState();

    }
);


function renderRealMapMarkers(
    parkingList,
    userLatitude,
    userLongitude
) {

    if (!parkingMap) {
        return;
    }


    // Remove old markers

    parkingMapMarkers.forEach(
        marker => {

            parkingMap.removeLayer(
                marker
            );

        }
    );


    parkingMapMarkers = [];


    const bounds = [];


    // ==================================================
    // USER LOCATION
    // ==================================================

    const userMarker =
        L.marker(
            [
                userLatitude,
                userLongitude
            ]
        )
        .addTo(
            parkingMap
        )
        .bindPopup(
            `
            <strong>
                Your Location
            </strong>

            <br>

            ${userLatitude.toFixed(6)},
            ${userLongitude.toFixed(6)}
            `
        );


    parkingMapMarkers.push(
        userMarker
    );


    bounds.push([
        userLatitude,
        userLongitude
    ]);


    // ==================================================
    // PARKING LOCATIONS
    // ==================================================

    parkingList.forEach(
        parking => {

            const lat =
                Number(
                    parking.latitude
                );

            const lng =
                Number(
                    parking.longitude
                );


            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng)
            ) {

                return;

            }


            const occupancy =
                Number(
                    parking.occupancy ||
                    0
                );


            const color =

                occupancy >= 75
                    ? "#ef4444"

                    : occupancy >= 40
                        ? "#eab308"

                        : "#22c55e";


            const icon =
                L.divIcon({

                    className:
                        "parking-map-marker",

                    html: `

                        <div
                            class="parking-marker"
                            style="
                                background:${color};
                            "
                        >

                            <i class="
                                fa-solid
                                fa-square-parking
                            "></i>

                        </div>

                    `,

                    iconSize:
                        [
                            38,
                            38
                        ],

                    iconAnchor:
                        [
                            19,
                            19
                        ]

                });


            const marker =
                L.marker(
                    [
                        lat,
                        lng
                    ],
                    {
                        icon:
                            icon
                    }
                )
                .addTo(
                    parkingMap
                );


            marker.bindPopup(`

                <div class="parking-map-popup">

                    <strong>
                        ${escapeHTML(
                            parking.name ||
                            "Parking Area"
                        )}
                    </strong>

                    <hr>

                    <div>

                        Distance:
                        <b>
                            ${Number(
                                parking.distance_km ||
                                0
                            ).toFixed(2)} km
                        </b>

                    </div>

                    <div>

                        Occupancy:
                        <b>
                            ${Math.round(
                                occupancy
                            )}%
                        </b>

                    </div>

                    <div>

                        Available:
                        <b>
                            ${Number(
                                parking.available_slots ||
                                0
                            )} slots
                        </b>

                    </div>

                    <div>

                        Rating:
                        <b>
                            ⭐ ${Number(
                                parking.rating ||
                                0
                            ).toFixed(1)}
                        </b>

                    </div>

                    <div>

                        Price:
                        <b>
                            ₹${Number(
                                parking.price ||
                                0
                            )}/hr
                        </b>

                    </div>

                </div>

            `);


            marker.on(
                "click",
                function () {

                    const id =
                        parking.id;

                    selectParking(
                        id
                    );

                }
            );


            parkingMapMarkers.push(
                marker
            );


            bounds.push([
                lat,
                lng
            ]);

        }
    );


    if (
        bounds.length > 0
    ) {

        parkingMap.fitBounds(
            bounds,
            {
                padding:
                    [
                        40,
                        40
                    ]
            }
        );

    }

}


// ==========================================================
// LIVE LOCATION SUGGESTIONS
// ==========================================================

function setupLocationSuggestions() {

    if (!destinationInput) {
        return;
    }


    destinationInput.addEventListener(
        "input",
        function () {

            const query =
                this.value.trim();


            selectedLocationSuggestion =
                null;


            if (clearSearchButton) {

                clearSearchButton.style.display =
                    query
                        ? "block"
                        : "none";

            }


            clearTimeout(
                suggestionTimer
            );


            if (query.length < 2) {

                hideLocationSuggestions();

                return;

            }


            suggestionTimer =
                setTimeout(
                    () => {

                        fetchLocationSuggestions(
                            query
                        );

                    },
                    350
                );

        }
    );


    destinationInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                hideLocationSuggestions();

            }

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                !event.target.closest(
                    ".search-input-wrapper"
                ) &&
                !event.target.closest(
                    ".location-suggestions"
                )
            ) {

                hideLocationSuggestions();

            }

        }
    );

}


// ==========================================================
// FETCH LOCATION SUGGESTIONS
// ==========================================================

async function fetchLocationSuggestions(
    query
) {

    if (!locationSuggestions) {
        return;
    }


    if (
        suggestionController
    ) {

        suggestionController.abort();

    }


    suggestionController =
        new AbortController();


    locationSuggestions.innerHTML = `

        <div class="location-searching">

            <i class="
                fa-solid
                fa-spinner
                fa-spin
            "></i>

            <span>
                Finding locations...
            </span>

        </div>

    `;


    locationSuggestions.classList.add(
        "show"
    );


    try {

        const response =
            await fetch(

                `${API_BASE_URL}/location-search?q=${
                    encodeURIComponent(
                        query
                    )
                }`,

                {
                    signal:
                        suggestionController
                            .signal
                }

            );


        if (!response.ok) {

            throw new Error(
                "Location API failed"
            );

        }


        const data =
            await response.json();


        const locations =
            Array.isArray(
                data.locations
            )
                ? data.locations
                : [];


        renderLocationSuggestions(
            locations
        );


    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            return;

        }


        console.error(
            "Suggestion error:",
            error
        );


        locationSuggestions.innerHTML = `

            <div class="location-empty">

                <i class="
                    fa-solid
                    fa-location-dot
                "></i>

                <span>
                    Unable to find locations
                </span>

            </div>

        `;

    }

}


// ==========================================================
// RENDER SUGGESTIONS
// ==========================================================

function renderLocationSuggestions(
    locations
) {

    if (
        !locationSuggestions
    ) {

        return;

    }


    if (
        !locations.length
    ) {

        locationSuggestions.innerHTML = `

            <div class="location-empty">

                <i class="
                    fa-regular
                    fa-compass
                "></i>

                <span>
                    No matching locations found
                </span>

            </div>

        `;

        locationSuggestions.classList.add(
            "show"
        );

        return;

    }


    locationSuggestions.innerHTML =
        locations
            .slice(0, 5)
            .map(
                (location, index) => {

                   const title =
                        getSuggestionTitle(location);

                    const address =
                        location.display_name ||
                        location.address ||
                        location.name ||
                        "Unknown location";

                    return `

                        <button
                            type="button"
                            class="location-suggestion"
                            data-index="${index}"
                        >

                            <div
                                class="suggestion-icon"
                            >

                                <i class="
                                    fa-solid
                                    fa-location-dot
                                "></i>

                            </div>


                            <div
                                class="suggestion-content"
                            >

                                <span
                                    class="suggestion-title"
                                >
                                    ${escapeHTML(
                                        title
                                    )}
                                </span>

                                <span
                                    class="suggestion-address"
                                >
                                    ${escapeHTML(
                                        address
                                    )}
                                </span>

                            </div>


                            <i class="
                                fa-solid
                                fa-chevron-right
                                suggestion-arrow
                            "></i>

                        </button>

                    `;

                }
            )
            .join("");


    locationSuggestions
        .querySelectorAll(
            ".location-suggestion"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                this.dataset.index
                            );


                        selectLocationSuggestion(
                            locations[index]
                        );

                    }
                );

            }
        );


    locationSuggestions.classList.add(
        "show"
    );

}


// ==========================================================
// SELECT LOCATION
// ==========================================================

function selectLocationSuggestion(
    location
) {

    if (!location) {
        return;
    }


    selectedLocationSuggestion =
        location;


    const displayName =
        location.name ||
        location.address ||
        "";


    destinationInput.value =
        displayName;


    const latitude =
        Number(
            location.latitude
        );


    const longitude =
        Number(
            location.longitude
        );


    window.selectedUserLocation = {

        latitude:
            latitude,

        longitude:
            longitude

    };


    hideLocationSuggestions();


    showLocationCoordinates(
        latitude,
        longitude
    );


    // Automatically search

    loadNearbyParking(
        latitude,
        longitude
    );

}


// ==========================================================
// SUGGESTION TITLE
// ==========================================================

function getSuggestionTitle(location) {

    return (
        location.address ||
        location.display_name ||
        location.name ||
        "Unknown location"
    );

}


// ==========================================================
// HIDE SUGGESTIONS
// ==========================================================

function hideLocationSuggestions() {

    if (!locationSuggestions) {
        return;
    }

    locationSuggestions.classList.remove("show");

    /*
     * Dropdown completely close
     * Search section apne normal size
     * mein automatically aa jayega.
     */
    locationSuggestions.innerHTML = "";

}


// ==========================================================
// START AUTOCOMPLETE
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupLocationSuggestions();

    }
);