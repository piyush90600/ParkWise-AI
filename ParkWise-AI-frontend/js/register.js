// ==========================================
// PARKWISE AI
// REGISTER ACCOUNT TYPE SWITCHING
// ==========================================

const accountTypes = document.querySelectorAll(
    'input[name="accountType"]'
);

const userForm = document.getElementById(
    "userRegisterForm"
);

const ownerForm = document.getElementById(
    "ownerRegisterForm"
);


// ==========================================
// SHOW SELECTED ACCOUNT FORM
// ==========================================

function showRegistrationForm(type) {

    if (!userForm || !ownerForm) {
        return;
    }

    const userRadio = document.querySelector(
        'input[name="accountType"][value="user"]'
    );

    const ownerRadio = document.querySelector(
        'input[name="accountType"][value="owner"]'
    );


    if (type === "owner") {

        userForm.style.display = "none";
        ownerForm.style.display = "block";

        if (ownerRadio) {
            ownerRadio.checked = true;
        }

        document.body.classList.add("owner-register-mode");

    } else {

        userForm.style.display = "block";
        ownerForm.style.display = "none";

        if (userRadio) {
            userRadio.checked = true;
        }

        document.body.classList.remove("owner-register-mode");
    }
}


// ==========================================
// ACCOUNT TYPE CLICK
// ==========================================

accountTypes.forEach((radio) => {

    radio.addEventListener("change", () => {

        showRegistrationForm(
            radio.value
        );

    });

});


// ==========================================
// OPEN CORRECT FORM FROM URL
//
// register.html#user
// register.html#owner
// ==========================================

function openFormFromHash() {

    const hash =
        window.location.hash
            .replace("#", "")
            .toLowerCase();


    if (hash === "owner") {

        showRegistrationForm("owner");

    } else {

        showRegistrationForm("user");

    }

}


// Run when page loads

openFormFromHash();


// Also handle browser back/forward

window.addEventListener(
    "hashchange",
    openFormFromHash
);


// ==========================================
// PASSWORD VISIBILITY
// ==========================================

const passwordButtons = document.querySelectorAll(
    ".password-toggle"
);

passwordButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const icon = button.querySelector("i");

        if (input.type === "password") {

            input.type = "text";

            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");

        } else {

            input.type = "password";

            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
});


// ==========================================
// EMAIL VALIDATION
// ==========================================

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// ==========================================
// PHONE VALIDATION
// ==========================================

function validPhone(phone) {
    return /^[6-9][0-9]{9}$/.test(phone);
}


// ==========================================
// USER REGISTRATION
// ==========================================

if (userForm) {

    userForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name = document.getElementById(
            "userName"
        ).value.trim();

        const email = document.getElementById(
            "userEmail"
        ).value.trim();

        const phone = document.getElementById(
            "userPhone"
        ).value.trim();

        const vehicle = document.getElementById(
            "vehicleType"
        ).value;

        const password = document.getElementById(
            "userPassword"
        ).value;

        const confirmPassword = document.getElementById(
            "userConfirmPassword"
        ).value;

        const terms = document.getElementById(
            "userTerms"
        ).checked;


        // -----------------------------
        // VALIDATION
        // -----------------------------

        if (name.length < 3) {
            alert("Please enter your full name.");
            return;
        }

        if (!validEmail(email)) {
            alert("Please enter a valid email.");
            return;
        }

        if (!validPhone(phone)) {
            alert("Please enter a valid phone number.");
            return;
        }

        if (!vehicle) {
            alert("Please select your vehicle type.");
            return;
        }

        if (password.length < 8) {
            alert(
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (!terms) {
            alert(
                "Please accept the terms and conditions."
            );
            return;
        }


        // -----------------------------
        // USER DATA
        // -----------------------------

        const userData = {
            name: name,
            email: email,
            phone: phone,
            vehicle_type: vehicle,
            password: password,
            role: "user"
        };


        console.log("User Registration:", userData);


        // -----------------------------
        // REGISTER API
        // -----------------------------

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(userData)
                }
            );

            const result = await response.json();

            if (
                response.ok &&
                result.status === "success"
            ) {

                alert(
                    "Account created successfully! Please sign in."
                );

                window.location.replace(
                    "./user_login.html"
                );

            } else {

                alert(
                    result.message ||
                    "Registration failed"
                );
            }

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            alert(
                "Unable to connect to server. Please try again."
            );
        }

    });
}


// ==========================================
// PARK OWNER REGISTRATION
// ==========================================

if (ownerForm) {

    ownerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const ownerName = document.getElementById(
            "ownerName"
        ).value.trim();

        const email = document.getElementById(
            "ownerEmail"
        ).value.trim();

        const phone = document.getElementById(
            "ownerPhone"
        ).value.trim();

        const parkingName = document.getElementById(
            "parkingName"
        ).value.trim();

        const location = document.getElementById(
            "parkingLocation"
        ).value.trim();

        const capacity = document.getElementById(
            "parkingCapacity"
        ).value;

        const parkingType = document.getElementById(
            "parkingType"
        ).value;

        const password = document.getElementById(
            "ownerPassword"
        ).value;

        const confirmPassword = document.getElementById(
            "ownerConfirmPassword"
        ).value;

        const terms = document.getElementById(
            "ownerTerms"
        ).checked;


        // -----------------------------
        // VALIDATION
        // -----------------------------

        if (ownerName.length < 3) {
            alert(
                "Please enter the owner or business name."
            );
            return;
        }

        if (!validEmail(email)) {
            alert("Please enter a valid email.");
            return;
        }

        if (!validPhone(phone)) {
            alert("Please enter a valid phone number.");
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

        if (!capacity || Number(capacity) < 1) {
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
            alert("Passwords do not match.");
            return;
        }

        if (!terms) {
            alert(
                "Please accept the terms and conditions."
            );
            return;
        }


        // -----------------------------
        // OWNER DATA
        // -----------------------------

        const ownerData = {

            name: ownerName,
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


        // -----------------------------
        // REGISTER API
        // -----------------------------

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(ownerData)
                }
            );

            const result = await response.json();

            if (
                response.ok &&
                result.status === "success"
            ) {

                alert(
                    "Park Owner account created successfully! Please sign in."
                );

                window.location.replace(
                    "./owner_login.html"
                );

            } else {

                alert(
                    result.message ||
                    "Registration failed"
                );
            }

        } catch (error) {

            console.error(
                "Owner registration error:",
                error
            );

            alert(
                "Unable to connect to server. Please try again."
            );
        }

    });
}