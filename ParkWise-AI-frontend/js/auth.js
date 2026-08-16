// ==========================================
// LOGIN FORM
// ==========================================

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

const loginError = document.getElementById("loginError");
const errorText = document.getElementById("errorText");

const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");


// ==========================================
// PASSWORD VISIBILITY
// ==========================================

const togglePassword =
    document.getElementById("togglePassword");

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const icon =
            togglePassword.querySelector("i");

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");

            togglePassword.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");

            togglePassword.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    });

}


// ==========================================
// EMAIL VALIDATION
// ==========================================

function validateEmail() {

    const email = emailInput.value.trim();

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (email === "") {

        emailError.textContent =
            "Email address is required.";

        return false;

    }


    if (!emailPattern.test(email)) {

        emailError.textContent =
            "Please enter a valid email address.";

        return false;

    }


    emailError.textContent = "";

    return true;
}


// ==========================================
// PASSWORD VALIDATION
// ==========================================

function validatePassword() {

    const password = passwordInput.value;


    if (password === "") {

        passwordError.textContent =
            "Password is required.";

        return false;

    }


    if (password.length < 6) {

        passwordError.textContent =
            "Password must contain at least 6 characters.";

        return false;

    }


    passwordError.textContent = "";

    return true;
}


// ==========================================
// LIVE VALIDATION
// ==========================================

emailInput.addEventListener(
    "blur",
    validateEmail
);

passwordInput.addEventListener(
    "blur",
    validatePassword
);


// ==========================================
// LOGIN SUBMIT
// ==========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    // Validate

    const validEmail =
        validateEmail();

    const validPassword =
        validatePassword();


    if (!validEmail || !validPassword) {
        return;
    }


    // Hide previous error

    loginError.style.display = "none";


    // Loading state

    loginButton.disabled = true;

    loginButtonText.textContent =
        "Signing in...";


    try {

        /*
         * ======================================
         * FUTURE FASTAPI CONNECTION
         * ======================================
         *
         * const response = await fetch(
         *     "http://localhost:8000/login",
         *     {
         *         method: "POST",
         *         headers: {
         *             "Content-Type":
         *                 "application/json"
         *         },
         *         body: JSON.stringify({
         *             email:
         *                 emailInput.value,
         *             password:
         *                 passwordInput.value
         *         })
         *     }
         * );
         *
         * const data =
         *     await response.json();
         *
         */


        // Temporary demo delay

        await new Promise(resolve =>
            setTimeout(resolve, 1000)
        );


        /*
         * TEMPORARY DEMO
         *
         * We will remove this when
         * your backend is connected.
         */

        const email =
            emailInput.value.trim();


        if (email) {

            window.location.href =
                "user-dashboard.html";

        }


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        errorText.textContent =
            "Unable to sign in. Please try again.";

        loginError.style.display =
            "flex";


    } finally {

        loginButton.disabled = false;

        loginButtonText.textContent =
            "Sign In";

    }

});