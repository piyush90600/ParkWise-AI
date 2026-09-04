// ==========================================================
// PARKWISE AI
// PARKING HISTORY
// DATABASE DRIVEN
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadUserProfile();

        loadParkingHistory();

    }
);


// ==========================================================
// CONFIG
// ==========================================================

const API_BASE_URL =
    "http://127.0.0.1:8000";


// ==========================================================
// USER PROFILE
// ==========================================================

function loadUserProfile() {

    const name =
        localStorage.getItem(
            "user_name"
        ) || "User";


    const profileName =
        document.getElementById(
            "profileName"
        );


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (profileName) {

        profileName.textContent =
            name;

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();

    }

}


// ==========================================================
// LOAD HISTORY
// ==========================================================

async function loadParkingHistory() {

    const userId =
        localStorage.getItem("user_id");

    const token =
        localStorage.getItem("access_token");

    const historyBody =
        document.getElementById("historyBody");


    // ==========================================
    // CHECK USER LOGIN
    // ==========================================

    if (!userId || !token) {

        showEmptyHistory(
            "Please login to view your parking history."
        );

        return;

    }


    // ==========================================
    // LOADING
    // ==========================================

    historyBody.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="history-loading"
            >

                <div class="history-loader">

                    <div class="loader-circle">

                        <i class="fa-solid fa-car"></i>

                    </div>

                    <strong>
                        Loading your parking history...
                    </strong>

                    <span>
                        Fetching your bookings
                    </span>

                </div>

            </td>

        </tr>

    `;


    try {

        console.log(
            "Loading booking history for:",
            userId
        );


        // ==========================================
        // API REQUEST
        // ==========================================

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


        // ==========================================
        // TOKEN EXPIRED / INVALID
        // ==========================================

        if (response.status === 401) {

            console.error(
                "Authentication failed."
            );

            localStorage.removeItem(
                "access_token"
            );

            showEmptyHistory(
                "Your login session has expired. Please login again."
            );

            return;

        }


        // ==========================================
        // FORBIDDEN
        // ==========================================

        if (response.status === 403) {

            showEmptyHistory(
                "You are not allowed to view this booking history."
            );

            return;

        }


        // ==========================================
        // OTHER API ERROR
        // ==========================================

        if (!response.ok) {

            throw new Error(
                `History API failed: ${response.status}`
            );

        }


        // ==========================================
        // RESPONSE
        // ==========================================

        const data =
            await response.json();


        console.log(
            "Booking history response:",
            data
        );


        const bookings =
            Array.isArray(
                data.bookings
            )
                ? data.bookings
                : [];


        // ==========================================
        // NO BOOKINGS
        // ==========================================

        if (
            bookings.length === 0
        ) {

            showEmptyHistory(
                "You haven't made any parking bookings yet."
            );

            return;

        }


        // ==========================================
        // CLEAR TABLE
        // ==========================================

        historyBody.innerHTML =
            "";


        // ==========================================
        // SHOW BOOKINGS
        // ==========================================

        bookings.forEach(
            booking => {

                const row =
                    createHistoryRow(
                        booking
                    );

                historyBody.appendChild(
                    row
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Parking history error:",
            error
        );


        showEmptyHistory(
            "Unable to load parking history. Please try again."
        );

    }

}

// ==========================================================
// CREATE HISTORY ROW
// ==========================================================

function createHistoryRow(booking) {

    const row = document.createElement("tr");

    // ------------------------------------------
    // PARKING NAME
    // ------------------------------------------

    const parkingName =
        booking.lot_name ||
        booking.parking_lot ||
        booking.parking_name ||
        "Parking Area";


    // ------------------------------------------
    // BOOKING ID
    // ------------------------------------------

    const bookingId =
        booking.bookings_id ||
        booking.booking_id ||
        booking.id ||
        "N/A";


    // ------------------------------------------
    // DATE & TIME
    // ------------------------------------------

    const startTime =
        booking.start_time ||
        booking.booking_time;


    const date =
        formatDate(startTime);


    // ------------------------------------------
    // DURATION
    // ------------------------------------------

    const duration =
        calculateDuration(
            booking.start_time,
            booking.end_time
        );


    // ------------------------------------------
    // PRICE
    // ------------------------------------------

    const price =
        Number(
            booking.price_at_booking ??
            booking.price ??
            booking.amount ??
            0
        );


    // ------------------------------------------
    // STATUS
    // ------------------------------------------

    const status =
        booking.status ||
        "confirmed";


    // ------------------------------------------
    // HTML
    // ------------------------------------------

    row.innerHTML = `

        <td>

            <strong>
                ${escapeHTML(parkingName)}
            </strong>

            <span class="sub-location">

                Booking ID:
                ${escapeHTML(bookingId)}

            </span>

        </td>


        <td>
            ${date}
        </td>


        <td>

            <span class="duration-text">

                ${escapeHTML(duration)}

            </span>

        </td>


        <td>

            <strong class="history-price">

                ₹${price.toFixed(2)}

            </strong>

        </td>


        <td>

            <span class="badge ${getStatusClass(status)}">

                ${escapeHTML(status)}

            </span>

        </td>

    `;


    return row;
}


// ==========================================================
// CALCULATE DURATION
// ==========================================================

function calculateDuration(startTime, endTime) {

    if (!startTime || !endTime) {
        return "Duration not recorded";
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return "Duration not recorded";
    }

    const minutes =
        Math.max(
            0,
            Math.round(
                (end - start) / (1000 * 60)
            )
        );


    if (minutes < 60) {

        return `${minutes} min`;

    }


    const hours =
        Math.floor(minutes / 60);


    const remainingMinutes =
        minutes % 60;


    if (remainingMinutes === 0) {

        return `${hours} hr`;

    }


    return `${hours} hr ${remainingMinutes} min`;
}


// ==========================================================
// DATE FORMAT
// ==========================================================

function formatDate(
    value
) {

    if (!value) {

        return "Date unavailable";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date unavailable";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ==========================================================
// STATUS
// ==========================================================

function getStatusClass(
    status
) {

    const value =
        String(
            status
        ).toLowerCase();


    if (
        value.includes(
            "cancel"
        )
    ) {

        return "cancelled";

    }


    if (
        value.includes(
            "pending"
        )
    ) {

        return "pending";

    }


    return "completed";

}


// ==========================================================
// EMPTY STATE
// ==========================================================

function showEmptyHistory(
    message
) {

    const historyBody =
        document.getElementById(
            "historyBody"
        );


    historyBody.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="history-empty">

                <div class="empty-history-icon">

                    <i class="fa-solid fa-clock-rotate-left"></i>

                </div>

                <h3>
                    No parking history yet
                </h3>

                <p>
                    ${
                        message ||
                        "Your completed and confirmed parking bookings will appear here."
                    }
                </p>

                <a
                    href="find-parking.html"
                    class="history-action">

                    <i class="fa-solid fa-location-dot"></i>

                    Find Parking

                </a>

            </td>

        </tr>

    `;

}


// ==========================================================
// SECURITY
// ==========================================================

function escapeHTML(
    value
) {

    return String(
        value || ""
    ).replace(
        /[&<>"']/g,
        character => ({

            "&":
                "&amp;",

            "<":
                "&lt;",

            ">":
                "&gt;",

            '"':
                "&quot;",

            "'":
                "&#039;"

        }[character])
    );

}