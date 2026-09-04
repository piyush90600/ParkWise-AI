// ==========================================================
// PARKWISE AI
// PROFILE
// DATABASE DRIVEN
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const API_BASE_URL =
            "http://127.0.0.1:8000";


        const userId =
            localStorage.getItem(
                "user_id"
            );


        // ==============================================
        // LOGIN CHECK
        // ==============================================

        if (!userId) {

            window.location.href =
                "user_login.html";

            return;

        }


        try {

            // ==========================================
            // FETCH PROFILE
            // ==========================================

            const token =
                localStorage.getItem(
                    "access_token"
                );


            if (!token) {

                window.location.href =
                    "user_login.html";

                return;

            }


            const profileResponse =
                await fetch(

                    `${API_BASE_URL}/profile/${encodeURIComponent(userId)}`,

                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        }
                    }

                );


            if (!profileResponse.ok) {

                throw new Error(
                    "Profile fetch failed"
                );

            }


            const profileData =
                await profileResponse.json();

            const profile =
                profileData;


            // ==========================================
            // NAME
            // ==========================================

            const name =
                profile.name ||
                profile.username ||
                localStorage.getItem("user_name") ||
                "User";

            document.getElementById(
                "profileName"
            ).textContent = name;

            // ==========================================
            // AVATAR
            // ==========================================

            const firstLetter =
                name.trim().charAt(0).toUpperCase();

            document.getElementById(
                "profileAvatar"
            ).textContent =
                firstLetter || "U";


            // ==========================================
            // NAME SPLIT
            // ==========================================

            const nameParts =
                name.trim().split(
                    /\s+/
                );


            document.getElementById(
                "firstName"
            ).value =
                nameParts[0] || "";


            document.getElementById(
                "lastName"
            ).value =

                nameParts
                    .slice(1)
                    .join(" ");


            // ==========================================
            // EMAIL
            // ==========================================

            document.getElementById(
                "email"
            ).value =
                profile.email || "";


            // ==========================================
            // PHONE
            // ==========================================

            document.getElementById(
                "phone"
            ).value =
                profile.phone || "";


            // ==========================================
            // VEHICLE
            // ==========================================

            document.getElementById(
                "vehicleType"
            ).value =
                profile.vehicle_type || "";


            // ==========================================
            // FETCH BOOKING SUMMARY
            // ==========================================

            await loadBookingSummary(
                userId,
                token
            );


        }

        catch (error) {

            console.error(
                "Profile error:",
                error
            );

            showProfileError();

        }

    }
);


// ==========================================================
// BOOKING SUMMARY
// ==========================================================

async function loadBookingSummary(
    userId,
    token
) {

    const API_BASE_URL =
        "http://127.0.0.1:8000";


    try {

        const response =
        await fetch(

            `${API_BASE_URL}/bookings/${encodeURIComponent(userId)}`,

            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json"
                }
            }

        );


        if (!response.ok) {

            throw new Error(
                "Booking history failed"
            );

        }


        const data =
            await response.json();


        const bookings =
            Array.isArray(
                data.bookings
            )
                ? data.bookings
                : [];


        // ==========================================
        // SESSION COUNT
        // ==========================================

        document.getElementById(
            "sessionCount"
        ).textContent =
            bookings.length;


        // ==========================================
        // TOTAL SPENT
        // ==========================================

        const total =
            bookings.reduce(
                (
                    sum,
                    booking
                ) => {

                    return (
                        sum +
                        Number(
                            booking.price ||
                            0
                        )
                    );

                },
                0
            );


        document.getElementById(
            "totalSpent"
        ).textContent =
            `₹${total.toFixed(0)}`;


        // ==========================================
        // SAVED LOCATIONS
        // ==========================================
        //
        // Current backend doesn't expose a
        // saved-count endpoint.
        //
        // Keep it database-driven by showing
        // only when backend provides it.
        //

        const savedCount =
            document.getElementById(
                "savedCount"
            );


        if (savedCount) {

            savedCount.textContent =
                data.saved_count ?? 0;

        }

    }

    catch (error) {

        console.error(
            "Summary error:",
            error
        );

    }

}


// ==========================================================
// ERROR
// ==========================================================

function showProfileError() {

    const name =
        document.getElementById(
            "profileName"
        );


    if (name) {

        name.textContent =
            "Unable to load profile";

    }

}