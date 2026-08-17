/* =========================================================
   PARKWISE AI
   USER DASHBOARD JAVASCRIPT
   ========================================================= */


/* =========================================================
   SIDEBAR MOBILE
   ========================================================= */

const menuBtn = document.getElementById("menuBtn");

const sidebar = document.getElementById("sidebar");


if (menuBtn) {

    menuBtn.addEventListener("click", function () {

        sidebar.classList.toggle("open");

    });

}


/* =========================================================
   SEARCH PARKING
   ========================================================= */

const searchBtn = document.getElementById("searchBtn");

const locationInput =
    document.getElementById("locationInput");


if (searchBtn) {

    searchBtn.addEventListener("click", function () {

        const location =
            locationInput.value.trim();


        if (location === "") {

            alert("Please enter a parking location.");

            locationInput.focus();

            return;

        }


        /*
         * Later we will connect this to:
         *
         * Recommendation Model API
         *
         * Example:
         *
         * fetch("http://127.0.0.1:8000/recommend", {
         *     method: "POST",
         *     headers: {
         *         "Content-Type": "application/json"
         *     },
         *     body: JSON.stringify({
         *         location: location
         *     })
         * })
         */


        console.log(
            "Searching parking near:",
            location
        );


        window.location.href =
            "find-parking.html?location=" +
            encodeURIComponent(location);

    });

}


/* =========================================================
   ENTER KEY SEARCH
   ========================================================= */

if (locationInput) {

    locationInput.addEventListener(
        "keypress",
        function (event) {

            if (event.key === "Enter") {

                searchBtn.click();

            }

        }
    );

}


/* =========================================================
   TIME FILTER
   ========================================================= */

const timeSelect =
    document.getElementById("timeSelect");


if (timeSelect) {

    timeSelect.addEventListener(
        "change",
        function () {

            console.log(
                "Prediction period:",
                this.value
            );

            /*
             * Later:
             *
             * Call your occupancy prediction API
             * based on selected period.
             */

        }
    );

}


/* =========================================================
   PARKING BUTTONS
   ========================================================= */

const parkingButtons =
    document.querySelectorAll(".card-btn");


parkingButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const card =
                this.closest(".parking-card");

            const parkingName =
                card.querySelector("h4").textContent;


            console.log(
                "Selected parking:",
                parkingName
            );


            /*
             * Later this will open:
             *
             * parking-details.html
             *
             * with the selected parking ID.
             */

            alert(
                "Opening details for " +
                parkingName
            );

        }
    );

});


/* =========================================================
   RECOMMENDED PARKING
   ========================================================= */

const viewParkingBtn =
    document.querySelector(".view-parking-btn");


if (viewParkingBtn) {

    viewParkingBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "parking-details.html";

        }
    );

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

const notificationBtn =
    document.querySelector(".notification-btn");


if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        function () {

            alert(
                "No new notifications."
            );

        }
    );

}