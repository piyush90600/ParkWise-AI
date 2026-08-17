// ==========================================
// ACCOUNT TYPE SWITCHING
// ==========================================

const accountTypes =
    document.querySelectorAll(
        'input[name="accountType"]'
    );

const userForm =
    document.getElementById(
        "userRegisterForm"
    );

const ownerForm =
    document.getElementById(
        "ownerRegisterForm"
    );


accountTypes.forEach((radio) => {

    radio.addEventListener("change", () => {

        if (radio.value === "user") {

            userForm.style.display = "block";

            ownerForm.style.display = "none";

        }


        if (radio.value === "owner") {

            userForm.style.display = "none";

            ownerForm.style.display = "block";

        }

    });

});


// ==========================================
// PASSWORD VISIBILITY
// ==========================================

const passwordButtons =
    document.querySelectorAll(
        ".password-toggle"
    );


passwordButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const targetId =
            button.dataset.target;

        const input =
            document.getElementById(targetId);

        const icon =
            button.querySelector("i");


        if (input.type === "password") {

            input.type = "text";

            icon.classList.remove(
                "fa-eye"
            );

            icon.classList.add(
                "fa-eye-slash"
            );

        } else {

            input.type = "password";

            icon.classList.remove(
                "fa-eye-slash"
            );

            icon.classList.add(
                "fa-eye"
            );

        }

    });

});


// ==========================================
// EMAIL VALIDATION
// ==========================================

function validEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


// ==========================================
// PHONE VALIDATION
// ==========================================

function validPhone(phone) {

    return /^[6-9][0-9]{9}$/
        .test(phone);

}


// ==========================================
// USER REGISTRATION
// ==========================================

userForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const name =
            document.getElementById(
                "userName"
            ).value.trim();

        const email =
            document.getElementById(
                "userEmail"
            ).value.trim();

        const phone =
            document.getElementById(
                "userPhone"
            ).value.trim();

        const vehicle =
            document.getElementById(
                "vehicleType"
            ).value;

        const password =
            document.getElementById(
                "userPassword"
            ).value;

        const confirmPassword =
            document.getElementById(
                "userConfirmPassword"
            ).value;

        const terms =
            document.getElementById(
                "userTerms"
            ).checked;


        // Validation

        if (name.length < 3) {

            alert(
                "Please enter your full name."
            );

            return;

        }


        if (!validEmail(email)) {

            alert(
                "Please enter a valid email."
            );

            return;

        }


        if (!validPhone(phone)) {

            alert(
                "Please enter a valid phone number."
            );

            return;

        }


        if (!vehicle) {

            alert(
                "Please select your vehicle type."
            );

            return;

        }


        if (password.length < 8) {

            alert(
                "Password must contain at least 8 characters."
            );

            return;

        }


        if (password !== confirmPassword) {

            alert(
                "Passwords do not match."
            );

            return;

        }


        if (!terms) {

            alert(
                "Please accept the terms and conditions."
            );

            return;

        }


        // Data for backend

        const userData = {

            name: name,

            email: email,

            phone: phone,

            vehicle_type: vehicle,

            password: password,

            role: "user"

        };


        console.log(
            "User Registration:",
            userData
        );


        // Temporary

        alert(
            "User account created successfully!"
        );


        window.location.href =
            "login.html";

    }
);


// ==========================================
// PARK OWNER REGISTRATION
// ==========================================

ownerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const ownerName =
            document.getElementById(
                "ownerName"
            ).value.trim();

        const email =
            document.getElementById(
                "ownerEmail"
            ).value.trim();

        const phone =
            document.getElementById(
                "ownerPhone"
            ).value.trim();

        const parkingName =
            document.getElementById(
                "parkingName"
            ).value.trim();

        const location =
            document.getElementById(
                "parkingLocation"
            ).value.trim();

        const capacity =
            document.getElementById(
                "parkingCapacity"
            ).value;

        const parkingType =
            document.getElementById(
                "parkingType"
            ).value;

        const password =
            document.getElementById(
                "ownerPassword"
            ).value;

        const confirmPassword =
            document.getElementById(
                "ownerConfirmPassword"
            ).value;

        const terms =
            document.getElementById(
                "ownerTerms"
            ).checked;


        // Validation

        if (ownerName.length < 3) {

            alert(
                "Please enter the owner or business name."
            );

            return;

        }


        if (!validEmail(email)) {

            alert(
                "Please enter a valid email."
            );

            return;

        }


        if (!validPhone(phone)) {

            alert(
                "Please enter a valid phone number."
            );

            return;

        }


        if (parkingName === "") {

            alert(
                "Please enter the parking area name."
            );

            return;

        }


        if (location === "") {

            alert(
                "Please enter the parking location."
            );

            return;

        }


        if (!capacity || capacity < 1) {

            alert(
                "Please enter a valid parking capacity."
            );

            return;

        }


        if (!parkingType) {

            alert(
                "Please select the parking type."
            );

            return;

        }


        if (password.length < 8) {

            alert(
                "Password must contain at least 8 characters."
            );

            return;

        }


        if (password !== confirmPassword) {

            alert(
                "Passwords do not match."
            );

            return;

        }


        if (!terms) {

            alert(
                "Please accept the terms and conditions."
            );

            return;

        }


        // Data for backend

        const ownerData = {

            owner_name: ownerName,

            email: email,

            phone: phone,

            parking_name: parkingName,

            parking_location: location,

            capacity: Number(capacity),

            parking_type: parkingType,

            password: password,

            role: "park_owner"

        };


        console.log(
            "Park Owner Registration:",
            ownerData
        );


        // Temporary

        alert(
            "Park Owner account created successfully!"
        );


        window.location.href =
            "login.html";

    }
);