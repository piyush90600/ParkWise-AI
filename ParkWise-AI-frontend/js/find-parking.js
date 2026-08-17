/* =========================================================
   PARKING DATA
========================================================= */

const parkingData = {

    1: {
        name: "City Mall Parking",
        address: "City Mall, Main Road",
        spots: 24,
        price: "₹40",
        distance: "0.4 km",
        status: "available"
    },

    2: {
        name: "Metro Station Parking",
        address: "Metro Station Road",
        spots: 18,
        price: "₹30",
        distance: "0.7 km",
        status: "available"
    },

    3: {
        name: "Central Plaza Parking",
        address: "Central Plaza, Downtown",
        spots: 6,
        price: "₹50",
        distance: "0.9 km",
        status: "limited"
    },

    4: {
        name: "Market Parking",
        address: "Central Market Road",
        spots: 31,
        price: "₹35",
        distance: "1.1 km",
        status: "available"
    },

    5: {
        name: "Downtown Parking",
        address: "Downtown Business Area",
        spots: 0,
        price: "₹45",
        distance: "1.4 km",
        status: "full"
    },

    6: {
        name: "Airport Parking",
        address: "Airport Road",
        spots: 14,
        price: "₹60",
        distance: "2.1 km",
        status: "available"
    }

};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const destinationInput =
    document.getElementById("destinationInput");

const clearSearch =
    document.getElementById("clearSearch");

const parkingModal =
    document.getElementById("parkingModal");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const parkingCards =
    document.querySelectorAll(".parking-card");


/* =========================================================
   SEARCH INPUT
========================================================= */

destinationInput.addEventListener("input", function () {

    if (this.value.trim() !== "") {

        clearSearch.style.display = "block";

    } else {

        clearSearch.style.display = "none";

    }

});


/* =========================================================
   CLEAR SEARCH
========================================================= */

clearSearch.addEventListener("click", function () {

    destinationInput.value = "";

    clearSearch.style.display = "none";

    destinationInput.focus();

});


/* =========================================================
   SEARCH PARKING
========================================================= */

function searchParking() {

    const destination =
        destinationInput.value.trim();

    if (destination === "") {

        showToast(
            "Please enter a destination first."
        );

        destinationInput.focus();

        return;
    }


    showToast(
        `Searching parking near ${destination}...`
    );


    setTimeout(() => {

        showToast(
            `Parking options found near ${destination}.`
        );

    }, 1200);

}


/* =========================================================
   ENTER KEY SEARCH
========================================================= */

destinationInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        searchParking();

    }

});


/* =========================================================
   QUICK SEARCH
========================================================= */

function quickSearch(location) {

    destinationInput.value = location;

    clearSearch.style.display = "block";

    searchParking();

}


/* =========================================================
   CURRENT LOCATION
========================================================= */

function useCurrentLocation() {

    showToast("Detecting your current location...");


    if (!navigator.geolocation) {

        showToast(
            "Location services are not supported."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            destinationInput.value =
                "My Current Location";

            clearSearch.style.display =
                "block";


            showToast(
                "Current location detected."
            );

            console.log(
                "Latitude:",
                latitude,
                "Longitude:",
                longitude
            );

        },

        function () {

            showToast(
                "Unable to access your location."
            );

        }

    );

}


/* =========================================================
   FILTER PARKING
========================================================= */

function filterParking(filter, button) {

    document
        .querySelectorAll(".filter-btn")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    button.classList.add("active");


    let visibleCount = 0;


    parkingCards.forEach(card => {

        const status =
            card.dataset.status;

        const price =
            Number(card.dataset.price);

        const distance =
            Number(card.dataset.distance);


        let show = true;


        if (filter === "available") {

            show =
                status === "available";

        }


        else if (filter === "cheap") {

            show =
                price <= 40;

        }


        else if (filter === "nearby") {

            show =
                distance <= 1;

        }


        if (show) {

            card.classList.remove("hidden");

            visibleCount++;

        } else {

            card.classList.add("hidden");

        }

    });


    document.getElementById("resultCount")
        .textContent = visibleCount;


    showToast(
        `${visibleCount} parking areas found.`
    );

}


/* =========================================================
   SORT MENU
========================================================= */

function toggleSortMenu() {

    const menu =
        document.getElementById("sortMenu");

    menu.classList.toggle("show");

}


/* Close sort menu */

document.addEventListener("click", function (event) {

    const sortMenu =
        document.getElementById("sortMenu");

    const sortButton =
        document.querySelector(".sort-btn");


    if (
        !sortMenu.contains(event.target) &&
        !sortButton.contains(event.target)
    ) {

        sortMenu.classList.remove("show");

    }

});


/* =========================================================
   SORT PARKING
========================================================= */

function sortParking(type) {

    const container =
        document.getElementById("parkingCards");

    const cards =
        Array.from(
            container.querySelectorAll(".parking-card")
        );


    cards.sort((a, b) => {

        if (type === "distance") {

            return (
                Number(a.dataset.distance) -
                Number(b.dataset.distance)
            );

        }


        if (type === "price") {

            return (
                Number(a.dataset.price) -
                Number(b.dataset.price)
            );

        }


        if (type === "availability") {

            return (
                Number(b.dataset.availability) -
                Number(a.dataset.availability)
            );

        }


        if (type === "rating") {

            return (
                Number(b.dataset.rating) -
                Number(a.dataset.rating)
            );

        }

    });


    cards.forEach(card => {

        container.appendChild(card);

    });


    document
        .getElementById("sortMenu")
        .classList.remove("show");


    showToast(
        "Parking list sorted successfully."
    );

}


/* =========================================================
   SELECT PARKING
========================================================= */

function selectParking(id) {

    const parking =
        parkingData[id];


    if (!parking) {

        return;

    }


    document.getElementById("modalTitle")
        .textContent = parking.name;


    document.getElementById("modalAddress")
        .textContent = parking.address;


    document.getElementById("modalSpots")
        .textContent = parking.spots;


    document.getElementById("modalPrice")
        .textContent = parking.price;


    document.getElementById("modalDistance")
        .textContent = parking.distance;


    parkingModal.classList.add("show");


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    parkingModal.classList.remove("show");

    document.body.style.overflow =
        "";

}


/* Close modal by clicking outside */

parkingModal.addEventListener("click", function (event) {

    if (event.target === parkingModal) {

        closeModal();

    }

});


/* ESC key */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeModal();

    }

});


/* =========================================================
   DIRECTIONS
========================================================= */

function getDirections(destination) {

    showToast(
        `Opening directions to ${destination}...`
    );


    /*
       For the final project you can replace this
       with Google Maps / Mapbox / Leaflet routing.
    */

    setTimeout(() => {

        const encodedDestination =
            encodeURIComponent(destination);


        const mapsURL =
            `https://www.google.com/maps/search/?api=1&query=${encodedDestination}`;


        window.open(
            mapsURL,
            "_blank"
        );

    }, 800);

}


/* =========================================================
   MAP ZOOM
========================================================= */

let mapScale = 1;


function zoomMap(direction) {

    const map =
        document.getElementById("parkingMap");


    if (direction === "in") {

        mapScale += 0.1;

    }

    else {

        mapScale -= 0.1;

    }


    if (mapScale < 0.8) {

        mapScale = 0.8;

    }


    if (mapScale > 1.4) {

        mapScale = 1.4;

    }


    map.style.backgroundSize =
        `${55 * mapScale}px ${55 * mapScale}px`;


    showToast(
        direction === "in"
            ? "Map zoomed in."
            : "Map zoomed out."
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    toastMessage.textContent =
        message;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* =========================================================
   SIDEBAR MOBILE
========================================================= */

const mobileMenu =
    document.getElementById("mobileMenu");

const sidebar =
    document.getElementById("sidebar");


mobileMenu.addEventListener("click", function () {

    sidebar.classList.toggle("open");

});


/* Close sidebar after navigation */

document
    .querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener("click", function () {

            if (
                window.innerWidth <= 800
            ) {

                sidebar.classList.remove("open");

            }

        });

    });


/* =========================================================
   NOTIFICATIONS
========================================================= */

function toggleNotifications() {

    showToast(
        "You have 3 new notifications."
    );

}


/* =========================================================
   OTHER NAVIGATION
========================================================= */

function showMessage(message) {

    showToast(message);

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );


    if (confirmLogout) {

        /*
           Change this to your actual
           login page filename if needed.
        */

        window.location.href =
            "login.html";

    }

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log(
        "ParkWise AI - Find Parking loaded successfully."
    );

});