// ==========================================
// MOBILE MENU
// ==========================================

const menuBtn = document.getElementById("menuBtn");

const navLinks = document.querySelector(".nav-links");
const navButtons = document.querySelector(".nav-buttons");

if (menuBtn) {

    menuBtn.addEventListener("click", () => {

        if (navLinks.style.display === "flex") {

            navLinks.style.display = "none";
            navButtons.style.display = "none";

        } else {

            navLinks.style.display = "flex";
            navButtons.style.display = "flex";

            navLinks.style.flexDirection = "column";
            navLinks.style.position = "absolute";
            navLinks.style.top = "76px";
            navLinks.style.left = "0";
            navLinks.style.width = "100%";
            navLinks.style.padding = "25px";

            navLinks.style.background = "white";

            navButtons.style.position = "absolute";
            navButtons.style.top = "280px";
            navButtons.style.left = "0";
            navButtons.style.width = "100%";
            navButtons.style.padding = "20px 25px";

            navButtons.style.background = "white";

        }

    });

}

// ==========================================
// ACTIVE NAVIGATION
// ==========================================

const sections = document.querySelectorAll("section");
const links = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop;

        if (window.scrollY >= sectionTop - 150) {

            current = section.getAttribute("id");

        }

    });

    links.forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + current) {

            link.classList.add("active");

        }

    });

});


// ==========================================
// LOCATION BASED PARKING RECOMMENDATIONS
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";


async function findNearbyParking() {

    const loading =
        document.getElementById("parkingLoading");

    const resultsContainer =
        document.getElementById("parkingResults");

    const noParking =
        document.getElementById("noParking");

    const locationTitle =
        document.getElementById("locationTitle");


    if (!navigator.geolocation) {

        locationTitle.innerText =
            "Location not supported";

        return;
    }


    loading.style.display = "block";

    resultsContainer.innerHTML = "";

    noParking.style.display = "none";


    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            locationTitle.innerText =
                "Parking near your location";


            try {

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
                                    latitude,

                                longitude:
                                    longitude,

                                radius_km:
                                    5,

                                price_weight:
                                    0.20,

                                distance_weight:
                                    0.30,

                                rating_weight:
                                    0.20,

                                availability_weight:
                                    0.30
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


                loading.style.display = "none";


                if (
                    !data.recommendations ||
                    data.recommendations.length === 0
                ) {

                    noParking.style.display =
                        "block";

                    return;
                }


                displayParkingRecommendations(
                    data.recommendations
                );

            }

            catch (error) {

                console.error(
                    "Parking recommendation error:",
                    error
                );


                loading.style.display =
                    "none";


                noParking.style.display =
                    "block";

            }

        },


        function(error) {

            loading.style.display =
                "none";


            locationTitle.innerText =
                "Location access required";


            resultsContainer.innerHTML = `

                <div class="parking-empty">

                    <i class="fa-solid fa-location-dot"></i>

                    <h4>
                        Please allow location access
                    </h4>

                    <p>
                        We need your location to find
                        nearby parking.
                    </p>

                </div>

            `;

        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0
        }

    );

}


// ==========================================
// DISPLAY AI RECOMMENDATIONS
// ==========================================

function displayParkingRecommendations(
    recommendations
) {

    const container =
        document.getElementById(
            "parkingResults"
        );


    container.innerHTML = "";


    recommendations
        .slice(0, 3)
        .forEach((parking, index) => {

            const card =
                document.createElement("div");


            card.className =
                "dynamic-parking-card";


            const isBest =
                index === 0;


            card.innerHTML = `

                <div class="dynamic-parking-icon">

                    <i class="fa-solid fa-square-parking"></i>

                </div>


                <div class="dynamic-parking-info">

                    <div class="parking-name-row">

                        <h4>
                            ${parking.name}
                        </h4>

                        ${
                            isBest
                            ?
                            `
                            <span class="ai-badge">
                                <i class="fa-solid fa-wand-magic-sparkles"></i>
                                AI Recommended
                            </span>
                            `
                            :
                            ""
                        }

                    </div>


                    <p class="parking-address">

                        <i class="fa-solid fa-location-dot"></i>

                        ${parking.address || "Nearby"}

                    </p>


                    <div class="dynamic-parking-meta">

                        <span>
                            <i class="fa-solid fa-route"></i>

                            ${parking.distance_km} km
                        </span>


                        <span>
                            <i class="fa-solid fa-star"></i>

                            ${parking.rating}
                        </span>


                        <span>
                            <i class="fa-solid fa-square-parking"></i>

                            ${parking.available_slots} spots
                        </span>

                    </div>


                    <div class="ai-score">

                        <span>
                            AI Match
                        </span>

                        <strong>
                            ${parking.ai_match_score}%
                        </strong>

                    </div>

                </div>


                <div class="dynamic-parking-price">

                    <strong>
                        ₹${parking.price}
                    </strong>

                    <span>
                        /hr
                    </span>

                </div>

            `;


            container.appendChild(card);

        });

}


// ==========================================
// AUTO FIND PARKING ON LANDING PAGE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        if (
            document.getElementById(
                "parkingResults"
            )
        ) {

            findNearbyParking();

        }

    }
);