
/* =========================================================
   PARKWISE AI
   OWNER PROFILE
   DATABASE CONNECTED
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";


document.addEventListener("DOMContentLoaded", async function () {

    // =====================================================
    // LOGIN DATA
    // =====================================================

    const ownerId =
        localStorage.getItem("user_id");

    const token =
        localStorage.getItem("access_token");

    const role =
        localStorage.getItem("user_role");


    // =====================================================
    // LOGIN CHECK
    // =====================================================

    if (
        !ownerId ||
        !token ||
        role !== "park_owner"
    ) {

        window.location.replace(
            "owner_login.html"
        );

        return;
    }


    // =====================================================
    // LOAD EVERYTHING FROM DATABASE
    // =====================================================

    await loadOwnerProfile(
        ownerId,
        token
    );

    await loadOwnerStatistics(
        ownerId,
        token
    );

});



/* =========================================================
   LOAD OWNER PROFILE
   GET:
   /profile/{owner_id}
   ========================================================= */

async function loadOwnerProfile(
    ownerId,
    token
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/profile/${encodeURIComponent(ownerId)}`,
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


        // =================================================
        // AUTH ERROR
        // =================================================

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            logoutOwner();

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Profile API failed: ${response.status}`
            );
        }


        const owner =
            await response.json();


        console.log(
            "OWNER PROFILE FROM DATABASE:",
            owner
        );


        // =================================================
        // FULL NAME
        //
        // Backend owner document:
        // {
        //     owners_id,
        //     name,
        //     email,
        //     ...
        // }
        // =================================================

        const fullName =
            owner.name ||
            owner.full_name ||
            "Owner";


        const email =
            owner.email ||
            "Email not provided";


        const databaseOwnerId =
            owner.owners_id ||
            owner.user_id ||
            ownerId;


        // =================================================
        // UPDATE PROFILE HERO
        // =================================================

        setText(
            "ownerProfileName",
            fullName
        );


        setText(
            "ownerProfileEmail",
            email
        );


        // =================================================
        // UPDATE PERSONAL DETAILS
        // =================================================

        setInputValue(
            "ownerNameField",
            fullName
        );


        setInputValue(
            "ownerEmailField",
            email
        );


        setInputValue(
            "ownerIdField",
            databaseOwnerId
        );


        // =================================================
        // UPDATE AVATAR
        // =================================================

        const avatar =
            document.getElementById(
                "ownerProfileAvatar"
            );


        if (avatar) {

            avatar.textContent =
                fullName
                    .trim()
                    .charAt(0)
                    .toUpperCase();
        }


        // =================================================
        // UPDATE LOCAL STORAGE
        //
        // Future pages will also get correct name.
        // =================================================

        localStorage.setItem(
            "user_name",
            fullName
        );


        localStorage.setItem(
            "user_email",
            email
        );


    } catch (error) {

        console.error(
            "Owner profile loading error:",
            error
        );


        // Fallback only for displaying something.
        // Main data still comes from database.

        const savedName =
            localStorage.getItem(
                "user_name"
            ) || "Owner";


        const savedEmail =
            localStorage.getItem(
                "user_email"
            ) || "Email not provided";


        setText(
            "ownerProfileName",
            savedName
        );


        setText(
            "ownerProfileEmail",
            savedEmail
        );


        setInputValue(
            "ownerNameField",
            savedName
        );


        setInputValue(
            "ownerEmailField",
            savedEmail
        );


        setInputValue(
            "ownerIdField",
            ownerId
        );


        const avatar =
            document.getElementById(
                "ownerProfileAvatar"
            );


        if (avatar) {

            avatar.textContent =
                savedName
                    .trim()
                    .charAt(0)
                    .toUpperCase();
        }

    }

}



/* =========================================================
   LOAD OWNER STATISTICS
   GET:
   /owner/{owner_id}/dashboard
   ========================================================= */

async function loadOwnerStatistics(
    ownerId,
    token
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/owner/${encodeURIComponent(ownerId)}/dashboard`,
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


        // =================================================
        // AUTH ERROR
        // =================================================

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            logoutOwner();

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Owner dashboard API failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        console.log(
            "OWNER DASHBOARD DATA FROM DATABASE:",
            data
        );


        // =================================================
        // DATABASE DATA
        // =================================================

        const parkingLots =
            Array.isArray(data.parking_lots)
                ? data.parking_lots
                : [];


        const bookings =
            Array.isArray(data.bookings)
                ? data.bookings
                : [];


        const stats =
            data.stats || {};


        // =================================================
        // 1. PARKING LOT COUNT
        // =================================================

        const parkingLotCount =
            parkingLots.length;


        setText(
            "profileLotCount",
            parkingLotCount
        );


        // =================================================
        // 2. BOOKING COUNT
        //
        // Use total bookings from database.
        //
        // Dashboard API currently returns recent bookings
        // in "bookings". To make the profile count accurate,
        // use total_bookings if backend provides it.
        // Otherwise count returned bookings.
        // =================================================

        const bookingCount =
            Number(
                data.total_bookings ??
                stats.total_bookings ??
                bookings.length
            );


        setText(
            "profileBookingCount",
            bookingCount
        );


        // =================================================
        // 3. TOTAL REVENUE
        //
        // IMPORTANT:
        // Revenue comes from backend database calculation.
        // Do NOT calculate it from localStorage.
        // =================================================

        const totalRevenue =
            Number(
                stats.total_revenue || 0
            );


        setText(
            "profileRevenue",
            `₹${totalRevenue.toFixed(2)}`
        );


        // =================================================
        // OPTIONAL DEBUG
        // =================================================

        console.log(
            "Owner Profile Statistics:",
            {
                parkingLots: parkingLotCount,
                bookings: bookingCount,
                totalRevenue: totalRevenue
            }
        );


    } catch (error) {

        console.error(
            "Owner statistics loading error:",
            error
        );


        // Don't show fake database values.
        // Keep 0 only when API really fails.

        setText(
            "profileLotCount",
            "0"
        );


        setText(
            "profileBookingCount",
            "0"
        );


        setText(
            "profileRevenue",
            "₹0.00"
        );

    }

}



/* =========================================================
   LOGOUT OWNER
   ========================================================= */

function logoutOwner() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "user_id"
    );

    localStorage.removeItem(
        "user_name"
    );

    localStorage.removeItem(
        "user_email"
    );

    localStorage.removeItem(
        "user_role"
    );


    window.location.replace(
        "owner_login.html"
    );

}



/* =========================================================
   HELPER
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;
    }

}



/* =========================================================
   INPUT HELPER
   ========================================================= */

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value;
    }

}
