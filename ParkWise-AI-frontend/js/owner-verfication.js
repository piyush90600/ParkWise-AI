
document.addEventListener("DOMContentLoaded", () => {

    const API_BASE_URL =
        "http://127.0.0.1:8000";

    const form =
        document.getElementById(
            "verificationForm"
        );

    const submitButton =
        document.getElementById(
            "submitVerification"
        );

    const message =
        document.getElementById(
            "verificationMessage"
        );


    /* =====================================================
       OWNER LOGIN DATA
       ===================================================== */

    const ownerId =
        localStorage.getItem(
            "user_id"
        );

    const token =
        localStorage.getItem(
            "access_token"
        );

    const ownerName =
        localStorage.getItem(
            "user_name"
        );


    /* =====================================================
        AUTOMATIC LOCATION DETECTION
        ===================================================== */

        const addressInput =
            document.getElementById("address");

        const latitudeInput =
            document.getElementById("latitude");

        const longitudeInput =
            document.getElementById("longitude");

        const currentLocationButton =
            document.getElementById("useCurrentLocation");

        const locationStatus =
            document.getElementById("locationStatus");


        function setLocationStatus(
            text,
            type = ""
        ) {

            if (!locationStatus) {
                return;
            }

            locationStatus.className =
                `location-status ${type}`;

            locationStatus.innerHTML = `
                <i class="fa-solid fa-location-dot"></i>
                ${text}
            `;
        }


        /* =====================================================
        SET COORDINATES
        ===================================================== */

        function setCoordinates(
            latitude,
            longitude
        ) {

            latitudeInput.value =
                Number(latitude).toFixed(7);

            longitudeInput.value =
                Number(longitude).toFixed(7);

            setLocationStatus(
                "Location detected successfully",
                "success"
            );
        }


        /* =====================================================
        CURRENT GPS LOCATION
        ===================================================== */

        if (currentLocationButton) {

            currentLocationButton.addEventListener(
                "click",
                function () {

                    if (!navigator.geolocation) {

                        setLocationStatus(
                            "Geolocation is not supported by this browser.",
                            "error"
                        );

                        return;
                    }

                    currentLocationButton.disabled =
                        true;

                    currentLocationButton.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Detecting...
                    `;

                    setLocationStatus(
                        "Detecting your current location..."
                    );

                    navigator.geolocation.getCurrentPosition(

                        function (position) {

                            const lat =
                                position.coords.latitude;

                            const lng =
                                position.coords.longitude;

                            setCoordinates(
                                lat,
                                lng
                            );

                            currentLocationButton.disabled =
                                false;

                            currentLocationButton.innerHTML = `
                                <i class="fa-solid fa-circle-check"></i>
                                Location Detected
                            `;

                            /*
                            * Reverse geocode current location
                            * so address field is also populated.
                            */

                            reverseGeocode(
                                lat,
                                lng
                            );

                        },

                        function (error) {

                            console.error(
                                "Geolocation error:",
                                error
                            );

                            currentLocationButton.disabled =
                                false;

                            currentLocationButton.innerHTML = `
                                <i class="fa-solid fa-crosshairs"></i>
                                Use My Current Location
                            `;

                            setLocationStatus(
                                "Unable to access your current location.",
                                "error"
                            );

                        },

                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        }

                    );

                }
            );

        }


        /* =====================================================
        ADDRESS → LATITUDE/LONGITUDE
        ===================================================== */

        let geocodeTimer = null;

        if (addressInput) {

            addressInput.addEventListener(
                "input",
                function () {

                    clearTimeout(
                        geocodeTimer
                    );

                    const address =
                        this.value.trim();

                    if (address.length < 5) {

                        setLocationStatus(
                            "Enter a complete address to detect location."
                        );

                        return;
                    }

                    setLocationStatus(
                        "Finding address location..."
                    );

                    geocodeTimer =
                        setTimeout(
                            function () {

                                geocodeAddress(
                                    address
                                );

                            },
                            1200
                        );

                }
            );

        }


        /* =====================================================
        GEOCODE ADDRESS
        ===================================================== */

        async function geocodeAddress(
            address
        ) {

            try {

                const response =
                    await fetch(
                        "https://nominatim.openstreetmap.org/search?" +
                        new URLSearchParams({
                            q: address,
                            format: "json",
                            limit: 1,
                            countrycodes: "in"
                        }),
                        {
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );

                if (!response.ok) {

                    throw new Error(
                        "Location service unavailable."
                    );
                }

                const results =
                    await response.json();

                if (!results.length) {

                    setLocationStatus(
                        "Address location not found. Try a more complete address.",
                        "error"
                    );

                    return;
                }

                const result =
                    results[0];

                setCoordinates(
                    parseFloat(result.lat),
                    parseFloat(result.lon)
                );

            } catch (error) {

                console.error(
                    "Geocoding error:",
                    error
                );

                setLocationStatus(
                    "Could not detect coordinates from this address.",
                    "error"
                );

            }

        }


        /* =====================================================
        REVERSE GEOCODING
        ===================================================== */

        async function reverseGeocode(
            latitude,
            longitude
        ) {

            try {

                const response =
                    await fetch(
                        "https://nominatim.openstreetmap.org/reverse?" +
                        new URLSearchParams({
                            lat: latitude,
                            lon: longitude,
                            format: "json"
                        }),
                        {
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();

                if (
                    data &&
                    data.display_name &&
                    addressInput
                ) {

                    addressInput.value =
                        data.display_name;

                    setLocationStatus(
                        "Current location and address detected successfully.",
                        "success"
                    );

                }

            } catch (error) {

                console.error(
                    "Reverse geocoding error:",
                    error
                );

            }

}

    /* =====================================================
       LOGIN CHECK
       ===================================================== */

    if (
        !ownerId ||
        !token
    ) {

        window.location.replace(
            "owner_login.html"
        );

        return;
    }


    /* =====================================================
       AUTO FILL OWNER NAME
       ===================================================== */

    const ownerNameInput =
        document.getElementById(
            "ownerName"
        );

    if (
        ownerNameInput &&
        ownerName
    ) {

        ownerNameInput.value =
            ownerName;

        ownerNameInput.readOnly =
            true;
    }


    /* =====================================================
       FILE VALIDATION
       ===================================================== */

    const fileInputs =
        document.querySelectorAll(
            '.upload-box input[type="file"]'
        );


    fileInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                function () {

                    const file =
                        this.files[0];

                    if (!file) {
                        return;
                    }


                    const maxSize =
                        5 * 1024 * 1024;


                    const allowedTypes = [
                        "application/pdf",
                        "image/jpeg",
                        "image/png"
                    ];


                    if (
                        file.size >
                        maxSize
                    ) {

                        showMessage(
                            "Each document must be 5MB or smaller.",
                            "error"
                        );

                        this.value = "";

                        return;
                    }


                    if (
                        !allowedTypes.includes(
                            file.type
                        )
                    ) {

                        showMessage(
                            "Only PDF, JPG and PNG documents are allowed.",
                            "error"
                        );

                        this.value = "";

                        return;
                    }


                    const box =
                        this.closest(
                            ".upload-box"
                        );

                    const content =
                        box.querySelector(
                            ".upload-content"
                        );


                    if (content) {

                        content.querySelector(
                            "strong"
                        ).textContent =
                            "Document selected";

                        content.querySelector(
                            "p"
                        ).textContent =
                            file.name;

                        content.querySelector(
                            "span"
                        ).textContent =
                            `${(
                                file.size /
                                1024 /
                                1024
                            ).toFixed(2)} MB • Ready to upload`;
                    }

                }
            );

        }
    );


   /* =====================================================
        SUBMIT OWNER VERIFICATION
     ===================================================== */

    if (form && submitButton) {

        form.addEventListener("submit", async function (event) {

            event.preventDefault();

            // -----------------------------
            // LOGIN CHECK
            // -----------------------------

            if (!ownerId || !token) {

                showMessage(
                    "Your session has expired. Please login again.",
                    "error"
                );

                window.location.href = "owner_login.html";

                return;
            }

            // -----------------------------
            // FORM VALIDATION
            // -----------------------------

            if (!form.checkValidity()) {

                form.reportValidity();

                return;
            }

            // -----------------------------
            // LOCATION VALIDATION
            // -----------------------------

            if (
                !latitudeInput.value ||
                !longitudeInput.value
            ) {

                showMessage(
                    "Please use your current location or enter a valid parking address first.",
                    "error"
                );

                return;
            }

            // -----------------------------
            // FILE VALIDATION
            // -----------------------------

            const identity =
                document.getElementById("identity");

            const businessDoc =
                document.getElementById("businessDoc");

            const lotProof =
                document.getElementById("lotProof");

            if (
                !identity.files.length ||
                !businessDoc.files.length ||
                !lotProof.files.length
            ) {

                showMessage(
                    "Please upload all three verification documents.",
                    "error"
                );

                return;
            }

            // -----------------------------
            // CREATE FORM DATA
            // -----------------------------

            const formData =
                new FormData(form);

            /*
            * Make sure these values are explicitly
            * present in FormData.
            */

            formData.set(
                "owner_name",
                ownerNameInput.value.trim()
            );

            formData.set(
                "latitude",
                latitudeInput.value
            );

            formData.set(
                "longitude",
                longitudeInput.value
            );

            console.log(
                "Submitting parking lot:",
                Object.fromEntries(formData.entries())
            );

            // -----------------------------
            // BUTTON LOADING
            // -----------------------------

            submitButton.disabled = true;

            submitButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Submitting...
            `;

            hideMessage();

            try {

                // -----------------------------
                // SEND TO FASTAPI
                // -----------------------------

                const response = await fetch(
                    `${API_BASE_URL}/owner/${encodeURIComponent(ownerId)}/verification`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: formData
                    }
                );

                // -----------------------------
                // READ RESPONSE
                // -----------------------------

                const contentType =
                    response.headers.get("content-type") || "";

                let data;

                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    data =
                        await response.json();

                } else {

                    const text =
                        await response.text();

                    throw new Error(
                        text ||
                        `Server returned HTTP ${response.status}`
                    );
                }

                console.log(
                    "Verification response:",
                    data
                );

                // -----------------------------
                // ERROR
                // -----------------------------

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Unable to submit verification."
                    );
                }

                // -----------------------------
                // SUCCESS
                // -----------------------------

                showMessage(
                    `Parking lot submitted successfully. Parking Lot ID: ${data.parking_lot_id}. Status: Pending admin approval.`,
                    "success"
                );

                submitButton.innerHTML = `
                    <i class="fa-solid fa-circle-check"></i>
                    Application Submitted
                `;

                /*
                * Disable form after successful
                * database submission.
                */

                form.querySelectorAll(
                    "input, textarea, select, button"
                ).forEach(
                    element => {

                        element.disabled = true;

                    }
                );

                console.log(
                    "Parking lot successfully stored in database:",
                    data.parking_lot_id
                );

            } catch (error) {

                console.error(
                    "Verification submission error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Something went wrong while submitting the verification.",
                    "error"
                );

                submitButton.disabled =
                    false;

                submitButton.innerHTML = `
                    <i class="fa-solid fa-paper-plane"></i>
                    Submit for verification
                    <i class="fa-solid fa-arrow-right submit-arrow"></i>
                `;
            }

        });

}


    /* =====================================================
       MESSAGE
       ===================================================== */

    function showMessage(
        text,
        type
    ) {

        if (!message) {
            return;
        }

        message.textContent =
            text;

        message.className =
            `verification-message ${type}`;
    }


    function hideMessage() {

        if (!message) {
            return;
        }

        message.textContent = "";

        message.className =
            "verification-message";
    }

});