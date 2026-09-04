// ==========================================
// PARKWISE AI
// ROLE BASED LOGIN
// ==========================================


document.addEventListener(
    "DOMContentLoaded",
    () => {


        // ======================================
        // FORM
        // ======================================

        const form =
            document.getElementById(
                "roleLoginForm"
            );


        if (!form) {
            return;
        }


        // ======================================
        // CURRENT PAGE ROLE
        // ======================================

        const expectedRole =
            document.body.dataset.role ||
            "user";


        /*
            user_login.html

            data-role="user"


            owner_login.html

            data-role="park_owner"
        */


        // ======================================
        // INPUTS
        // ======================================

        const email =
            document.getElementById(
                "loginEmail"
            );


        const password =
            document.getElementById(
                "loginPassword"
            );


        // ======================================
        // ERRORS
        // ======================================

        const emailError =
            document.getElementById(
                "loginEmailError"
            );


        const passwordError =
            document.getElementById(
                "loginPasswordError"
            );


        const formError =
            document.getElementById(
                "formError"
            );


        const formErrorText =
            document.getElementById(
                "formErrorText"
            );


        // ======================================
        // BUTTON
        // ======================================

        const submitButton =
            document.getElementById(
                "loginSubmit"
            );


        const submitText =
            document.getElementById(
                "loginSubmitText"
            );


        // ======================================
        // PASSWORD TOGGLE
        // ======================================

        const toggle =
            document.getElementById(
                "toggleLoginPassword"
            );


        // ======================================
        // ERROR FUNCTION
        // ======================================

        function setError(
            element,
            message
        ) {

            element.textContent =
                message || "";

        }


        // ======================================
        // EMAIL VALIDATION
        // ======================================

        function validateEmail() {


            const value =
                email.value.trim();


            if (!value) {

                setError(
                    emailError,
                    "Email address is required."
                );

                return false;
            }


            const pattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!pattern.test(value)) {

                setError(
                    emailError,
                    "Please enter a valid email address."
                );

                return false;
            }


            setError(
                emailError,
                ""
            );


            return true;

        }


        // ======================================
        // PASSWORD VALIDATION
        // ======================================

        function validatePassword() {


            const value =
                password.value;


            if (!value) {

                setError(
                    passwordError,
                    "Password is required."
                );

                return false;
            }


            if (value.length < 6) {

                setError(
                    passwordError,
                    "Password must contain at least 8 characters."
                );

                return false;
            }


            setError(
                passwordError,
                ""
            );


            return true;

        }


        // ======================================
        // GENERAL ERROR
        // ======================================

        function showFormError(
            message
        ) {

            formErrorText.textContent =
                message;


            formError.classList.add(
                "show"
            );

        }


        // ======================================
        // HIDE ERROR
        // ======================================

        function hideFormError() {

            formError.classList.remove(
                "show"
            );

        }


        // ======================================
        // LIVE VALIDATION
        // ======================================

        email.addEventListener(
            "blur",
            validateEmail
        );


        password.addEventListener(
            "blur",
            validatePassword
        );


        // ======================================
        // PASSWORD SHOW / HIDE
        // ======================================

        if (toggle) {


            toggle.addEventListener(
                "click",
                () => {


                    const icon =
                        toggle.querySelector(
                            "i"
                        );


                    const isPassword =
                        password.type ===
                        "password";


                    if (isPassword) {

                        password.type =
                            "text";


                        icon.classList.remove(
                            "fa-eye"
                        );


                        icon.classList.add(
                            "fa-eye-slash"
                        );


                        toggle.setAttribute(
                            "aria-label",
                            "Hide password"
                        );

                    }

                    else {

                        password.type =
                            "password";


                        icon.classList.remove(
                            "fa-eye-slash"
                        );


                        icon.classList.add(
                            "fa-eye"
                        );


                        toggle.setAttribute(
                            "aria-label",
                            "Show password"
                        );

                    }

                }
            );

        }


        // ======================================
        // LOGIN SUBMIT
        // ======================================

        form.addEventListener(
            "submit",
            async (event) => {


                event.preventDefault();


                // Hide previous error

                hideFormError();


                // Validate

                const validEmail =
                    validateEmail();


                const validPassword =
                    validatePassword();


                if (
                    !validEmail ||
                    !validPassword
                ) {

                    return;

                }


                // Loading

                submitButton.disabled =
                    true;


                submitText.textContent =
                    "Signing in...";


                try {


                    // ==================================
                    // BACKEND LOGIN API
                    // ==================================

                    const response =
                        await fetch(
                            "http://127.0.0.1:8000/login",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        email:
                                            email.value.trim(),

                                        password:
                                            password.value

                                    })
                            }
                        );


                    // ==================================
                    // RESPONSE
                    // ==================================

                    const result =
                        await response.json();


                    // ==================================
                    // API ERROR
                    // ==================================

                    if (
                        !response.ok ||
                        result.status !==
                            "success"
                    ) {


                        showFormError(

                            result.detail ||
                            result.message ||
                            "Invalid email or password."

                        );


                        return;

                    }


                    // ==================================
                    // IMPORTANT:
                    // ROLE CHECK
                    // ==================================

                    if (result.role !== expectedRole) {

                        if (expectedRole === "park_owner") {

                            showFormError(
                                "This email belongs to a User account. Please use User Login."
                            );

                        } else {

                            showFormError(
                                "This email belongs to a Park Owner account. Please use Owner Login."
                            );

                        }

                        return;
                    }


                    // ==================================
                    // SAVE LOGIN DATA
                    // ==================================

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
                        result.name
                    );


                    localStorage.setItem(
                        "user_email",
                        result.email
                    );


                    localStorage.setItem(
                        "user_role",
                        result.role
                    );


                    // ==================================
                    // REDIRECT
                    // ==================================

                    if (result.role === "park_owner") {

                        window.location.replace(
                            "owner-dashboard.html"
                        );

                    } else if (result.role === "user") {

                        window.location.replace(
                            "user-dashboard.html"
                        );

                    }else if (result.role === "admin") {

                        window.location.replace(
                            "admin-dashboard.html"
                        );
                    }
                    else {

                        showFormError(
                            "Unknown account role. Please contact support."
                        );

                        return;
                    }


                }


                catch (error) {


                    console.error(
                        "Login error:",
                        error
                    );


                    showFormError(

                        "Unable to connect to the server. Please make sure the ParkWise backend is running."

                    );

                }


                finally {


                    submitButton.disabled =
                        false;


                    if (
                        expectedRole ===
                        "park_owner"
                    ) {

                        submitText.textContent =
                            "Sign In as Owner";

                    }

                    else {

                        submitText.textContent =
                            "Sign In";

                    }

                }

            }
        );

    }
);