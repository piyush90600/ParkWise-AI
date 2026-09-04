document.addEventListener("DOMContentLoaded", function () {


const form = document.getElementById("adminLoginForm");

const nameInput = document.getElementById("adminName");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");

const passwordToggle = document.getElementById("adminPasswordToggle");
const errorBox = document.getElementById("adminLoginError");

// ==========================================
// PASSWORD SHOW / HIDE
// ==========================================

if (passwordToggle) {

    passwordToggle.addEventListener("click", function () {

        const icon = passwordToggle.querySelector("i");

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");

            passwordToggle.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");

            passwordToggle.setAttribute(
                "aria-label",
                "Show password"
            );
        }

    });

}


// ==========================================
// LOGIN
// ==========================================

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    errorBox.textContent = "";
    errorBox.classList.remove("show");


    // ==========================================
    // VALIDATION
    // ==========================================

    if (name.length < 2) {

        showError("Please enter a valid admin name.");

        return;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        showError("Please enter a valid email address.");

        return;
    }


    if (password.length < 6) {

        showError(
            "Password must contain at least 6 characters."
        );

        return;
    }


    // ==========================================
    // LOGIN BUTTON
    // ==========================================

    const loginButton =
        form.querySelector("button[type='submit']");

    const originalText =
        loginButton
            ? loginButton.innerHTML
            : "";

    if (loginButton) {

        loginButton.disabled = true;

        loginButton.innerHTML =
            `<span>Signing in...</span>
             <i class="fa-solid fa-spinner fa-spin"></i>`;
    }


    try {

        // ==========================================
        // ADMIN BACKEND LOGIN
        // ==========================================

        const response = await fetch(
            "http://127.0.0.1:8000/admin/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const result = await response.json();


        // ==========================================
        // LOGIN ERROR
        // ==========================================

        if (!response.ok) {

            showError(
                result.detail ||
                result.message ||
                "Invalid admin email or password."
            );

            return;
        }


        // ==========================================
        // VERIFY ADMIN ROLE
        // ==========================================

        if (result.role !== "admin") {

            showError(
                "This account does not have admin access."
            );

            return;
        }


        // ==========================================
        // SAVE AUTHENTICATION DATA
        // ==========================================

        localStorage.setItem(
            "access_token",
            result.access_token
        );

        localStorage.setItem(
            "user_id",
            result.user_id
        );

        localStorage.setItem(
            "user_name",
            result.name || name
        );

        localStorage.setItem(
            "user_email",
            result.email || email
        );

        localStorage.setItem(
            "user_role",
            result.role
        );

        localStorage.setItem(
            "admin_logged_in",
            "true"
        );

        // Old frontend-only values
        localStorage.setItem(
            "admin_name",
            result.name || name
        );

        localStorage.setItem(
            "admin_email",
            result.email || email
        );


        // ==========================================
        // REDIRECT
        // ==========================================

        window.location.replace(
            "admin-dashboard.html"
        );


    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        showError(
            "Unable to connect to the server. Please make sure the ParkWise backend is running."
        );

    } finally {

        if (loginButton) {

            loginButton.disabled = false;

            loginButton.innerHTML =
                originalText;
        }
    }

});


// ==========================================
// ERROR FUNCTION
// ==========================================

function showError(message) {

    errorBox.textContent = message;

    errorBox.classList.add("show");
}

});
