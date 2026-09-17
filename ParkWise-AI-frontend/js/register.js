document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "https://parkwise-ai-473c.onrender.com";

    const userForm = document.getElementById("userRegisterForm");
    const ownerForm = document.getElementById("ownerRegisterForm");
    const accountTypeRadios = document.querySelectorAll(
        'input[name="accountType"]'
    );

    const errorBox = document.getElementById("registerError");
    const errorText = document.getElementById("registerErrorText");

    // ==============================
    // ERROR HANDLING
    // ==============================

    function showError(message) {
        if (!errorBox || !errorText) return;

        errorText.textContent = message;
        errorBox.style.display = "flex";
    }

    function clearError() {
        if (errorBox) {
            errorBox.style.display = "none";
        }
    }

    // ==============================
    // BUTTON LOADING
    // ==============================

    function setButtonLoading(
        button,
        loading,
        loadingText,
        defaultText
    ) {
        if (!button) return;

        button.disabled = loading;

        button.innerHTML = loading
            ? `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`
            : `${defaultText} <i class="fa-solid fa-arrow-right"></i>`;
    }

    // ==============================
    // VALIDATION
    // ==============================

    function validatePhone(phone) {
        return /^[6-9]\d{9}$/.test(phone);
    }

    function validatePassword(password) {
        return password.length >= 6;
    }

    // ==============================
    // API RESPONSE
    // ==============================

    async function parseResponse(response) {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch {
            return {
                detail: text
            };
        }
    }

    // ==============================
    // ACCOUNT TYPE SWITCHER
    // ==============================

    accountTypeRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
            clearError();

            const isOwner = e.target.value === "owner";

            if (userForm) {
                userForm.style.display = isOwner ? "none" : "block";
            }

            if (ownerForm) {
                ownerForm.style.display = isOwner ? "block" : "none";
            }
        });
    });

    // ==============================
    // PASSWORD VISIBILITY
    // ==============================

    document.querySelectorAll(".password-toggle").forEach((button) => {
        button.addEventListener("click", function () {
            const targetInput = document.getElementById(
                this.dataset.target
            );

            const icon = this.querySelector("i");

            if (!targetInput || !icon) return;

            const showPassword =
                targetInput.type === "password";

            targetInput.type = showPassword
                ? "text"
                : "password";

            icon.classList.toggle(
                "fa-eye",
                !showPassword
            );

            icon.classList.toggle(
                "fa-eye-slash",
                showPassword
            );

            this.setAttribute(
                "aria-label",
                showPassword
                    ? "Hide password"
                    : "Show password"
            );
        });
    });

    // ==============================
    // PHONE INPUT
    // ==============================

    ["userPhone", "ownerPhone"].forEach((id) => {
        const input = document.getElementById(id);

        if (!input) return;

        input.addEventListener("input", () => {
            input.value = input.value
                .replace(/\D/g, "")
                .slice(0, 10);
        });
    });

    // ==============================
    // USER REGISTRATION
    // ==============================

    if (userForm) {
        userForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            clearError();

            const button =
                userForm.querySelector(
                    'button[type="submit"]'
                );

            const name =
                document
                    .getElementById("userName")
                    ?.value.trim();

            const email =
                document
                    .getElementById("userEmail")
                    ?.value.trim();

            const phone =
                document
                    .getElementById("userPhone")
                    ?.value.trim();

            const vehicleType =
                document
                    .getElementById("vehicleType")
                    ?.value;

            const password =
                document
                    .getElementById("userPassword")
                    ?.value;

            const confirmPassword =
                document
                    .getElementById("userConfirmPassword")
                    ?.value;

            // Validate phone
            if (!validatePhone(phone)) {
                showError(
                    "Please enter a valid 10-digit Indian mobile number."
                );
                return;
            }

            // Validate password
            if (!validatePassword(password)) {
                showError(
                    "Password must be at least 6 characters long."
                );
                return;
            }

            // Confirm password
            if (password !== confirmPassword) {
                showError(
                    "Passwords do not match."
                );
                return;
            }

            setButtonLoading(
                button,
                true,
                "Creating account...",
                "Create User Account"
            );

            try {
                const response = await fetch(
                    `${API_BASE_URL}/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name,
                            email,
                            phone,
                            vehicle_type: vehicleType,
                            password,
                            role: "user"
                        })
                    }
                );

                const data =
                    await parseResponse(response);

                if (!response.ok) {
                    showError(
                        data.detail ||
                        "User registration failed."
                    );
                    return;
                }

                alert(
                    "User account created successfully! Please sign in."
                );

                window.location.href =
                    "user_login.html";

            } catch (error) {

                console.error(
                    "User registration error:",
                    error
                );

                showError(
                    "Cannot connect to the server. Please try again."
                );

            } finally {

                setButtonLoading(
                    button,
                    false,
                    "",
                    "Create User Account"
                );
            }
        });
    }

    // ==============================
    // OWNER REGISTRATION
    // ==============================
    //
    // IMPORTANT:
    // Owner registration now creates ONLY
    // the owner account.
    //
    // Parking lot information is collected
    // later during owner verification.
    //
    // Removed from this request:
    // - parking_name
    // - parking_location
    // - capacity
    // - parking_type
    //
    // ==============================

    if (ownerForm) {

        ownerForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();

                clearError();

                const button =
                    document.getElementById(
                        "ownerRegisterButton"
                    );

                const name =
                    document
                        .getElementById("ownerName")
                        ?.value.trim();

                const email =
                    document
                        .getElementById("ownerEmail")
                        ?.value.trim();

                const phone =
                    document
                        .getElementById("ownerPhone")
                        ?.value.trim();

                const password =
                    document
                        .getElementById("ownerPassword")
                        ?.value;

                const confirmPassword =
                    document
                        .getElementById(
                            "ownerConfirmPassword"
                        )
                        ?.value;

                // ------------------------------
                // PHONE VALIDATION
                // ------------------------------

                if (!validatePhone(phone)) {

                    showError(
                        "Please enter a valid 10-digit Indian mobile number."
                    );

                    return;
                }

                // ------------------------------
                // PASSWORD VALIDATION
                // ------------------------------

                if (!validatePassword(password)) {

                    showError(
                        "Password must be at least 6 characters long."
                    );

                    return;
                }

                // ------------------------------
                // CONFIRM PASSWORD
                // ------------------------------

                if (password !== confirmPassword) {

                    showError(
                        "Passwords do not match."
                    );

                    return;
                }

                // ------------------------------
                // LOADING
                // ------------------------------

                setButtonLoading(
                    button,
                    true,
                    "Creating account...",
                    "Create Owner Account"
                );

                try {

                    // ------------------------------
                    // CREATE OWNER ACCOUNT
                    // ------------------------------

                    const response =
                        await fetch(
                            `${API_BASE_URL}/register`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({

                                    name,

                                    email,

                                    phone,

                                    password,

                                    // Owner role
                                    role: "park_owner"

                                })
                            }
                        );

                    const data =
                        await parseResponse(
                            response
                        );

                    // ------------------------------
                    // HANDLE ERROR
                    // ------------------------------

                    if (!response.ok) {

                        showError(
                            data.detail ||
                            "Owner registration failed."
                        );

                        return;
                    }

                    // ------------------------------
                    // SUCCESS
                    // ------------------------------

                    alert(
                        "Owner account created successfully! Please sign in to continue with parking-lot verification."
                    );

                    window.location.href =
                        "owner_login.html";

                } catch (error) {

                    console.error(
                        "Owner registration error:",
                        error
                    );

                    showError(
                        "Cannot connect to the server. Please try again."
                    );

                } finally {

                    setButtonLoading(
                        button,
                        false,
                        "",
                        "Create Owner Account"
                    );
                }
            }
        );
    }
});