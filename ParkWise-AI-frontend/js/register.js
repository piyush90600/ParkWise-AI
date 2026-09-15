document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://127.0.0.1:8000";

    const userForm = document.getElementById("userRegisterForm");
    const ownerForm = document.getElementById("ownerRegisterForm");
    const accountTypeRadios = document.querySelectorAll('input[name="accountType"]');
    const errorBox = document.getElementById("registerError");
    const errorText = document.getElementById("registerErrorText");

    function showError(message) {
        if (errorBox && errorText) {
            errorText.innerText = message;
            errorBox.style.display = "flex";
        }
    }

    function clearError() {
        if (errorBox) {
            errorBox.style.display = "none";
        }
    }

    // Role switcher
    accountTypeRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
            clearError();
            if (e.target.value === "owner") {
                userForm.style.display = "none";
                ownerForm.style.display = "block";
            } else {
                userForm.style.display = "block";
                ownerForm.style.display = "none";
            }
        });
    });

    // Password visibility toggle
    document.querySelectorAll(".password-toggle").forEach((btn) => {
        btn.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const targetInput = document.getElementById(targetId);
            const icon = this.querySelector("i");

            if (!targetInput) return;

            if (targetInput.type === "password") {
                targetInput.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                targetInput.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    });

    // USER REGISTRATION
    if (userForm) {
        userForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearError();

            const name = document.getElementById("userName")?.value.trim();
            const email = document.getElementById("userEmail")?.value.trim();
            const phone = document.getElementById("userPhone")?.value.trim();
            const vehicleType = document.getElementById("vehicleType")?.value;
            const password = document.getElementById("userPassword")?.value;
            const confirmPassword = document.getElementById("userConfirmPassword")?.value;

            if (password !== confirmPassword) {
                showError("Passwords do not match.");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        phone: phone,
                        vehicle_type: vehicleType,
                        password: password,
                        role: "user"
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    showError(data.detail || "User registration failed.");
                    return;
                }

                alert("User account created successfully! Please sign in.");
                window.location.href = "user_login.html";
            } catch (err) {
                console.error(err);
                showError("Cannot connect to server. Ensure FastAPI backend is running.");
            }
        });
    }

    // OWNER REGISTRATION
    if (ownerForm) {
        ownerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearError();

            const name = document.getElementById("ownerName")?.value.trim();
            const email = document.getElementById("ownerEmail")?.value.trim();
            const phone = document.getElementById("ownerPhone")?.value.trim();
            const parkingName = document.getElementById("parkingName")?.value.trim();
            const parkingLocation = document.getElementById("parkingLocation")?.value.trim();
            const parkingCapacity = document.getElementById("parkingCapacity")?.value;
            const parkingType = document.getElementById("parkingType")?.value;
            const password = document.getElementById("ownerPassword")?.value;
            const confirmPassword = document.getElementById("ownerConfirmPassword")?.value;

            if (password !== confirmPassword) {
                showError("Passwords do not match.");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        phone: phone,
                        parking_name: parkingName,
                        parking_location: parkingLocation,
                        capacity: parkingCapacity ? Number(parkingCapacity) : null,
                        parking_type: parkingType,
                        password: password,
                        role: "park_owner"
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    showError(data.detail || "Owner registration failed.");
                    return;
                }

                alert("Owner account created successfully! Please sign in.");
                window.location.href = "owner_login.html";
            } catch (err) {
                console.error(err);
                showError("Cannot connect to server. Ensure FastAPI backend is running.");
            }
        });
    }
});