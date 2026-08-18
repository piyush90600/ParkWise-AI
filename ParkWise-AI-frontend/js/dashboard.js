const menuBtn = document.getElementById("menuBtn");

const sidebar = document.getElementById("sidebar");

if (menuBtn) {

    menuBtn.addEventListener("click", function () {

        sidebar.classList.toggle("open");

    });

}

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

        console.log(
            "Searching parking near:",
            location
        );

        window.location.href =
            "find-parking.html?location=" +
            encodeURIComponent(location);

    });

}

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

            }
    );

}

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

            alert(
                "Opening details for " +
                parkingName
            );

        }
    );

});

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