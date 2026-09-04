/* =========================================================
   PARKWISE AI
   OWNER BOOKINGS
   DATABASE CONNECTED
   ========================================================= */


const API_BASE_URL =
    "http://127.0.0.1:8000";


let allOwnerBookings = [];


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {


        // ==============================================
        // CURRENT LOGGED-IN OWNER
        // ==============================================

        const ownerId =
            localStorage.getItem(
                "user_id"
            );


        const token =
            localStorage.getItem(
                "access_token"
            );


        const role =
            localStorage.getItem(
                "user_role"
            );


        // ==============================================
        // LOGIN CHECK
        // ==============================================

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


        // ==============================================
        // LOAD DATABASE BOOKINGS
        // ==============================================

        await loadOwnerBookings(
            ownerId,
            token
        );


        // ==============================================
        // SEARCH
        // ==============================================

        const search =
            document.getElementById(
                "bookingSearch"
            );


        if (search) {

            search.addEventListener(
                "input",
                function () {

                    applyFilters();

                }
            );

        }


        // ==============================================
        // STATUS FILTER
        // ==============================================

        const status =
            document.getElementById(
                "bookingStatus"
            );


        if (status) {

            status.addEventListener(
                "change",
                function () {

                    applyFilters();

                }
            );

        }

    }
);


/* =========================================================
   LOAD OWNER BOOKINGS FROM DATABASE
   ========================================================= */

async function loadOwnerBookings(
    ownerId,
    token
) {

    try {


        const response =
            await fetch(
                `${API_BASE_URL}/owner/${encodeURIComponent(ownerId)}/bookings`,
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


        // ==============================================
        // AUTH ERROR
        // ==============================================

        if (
            response.status === 401 ||
            response.status === 403
        ) {

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

            return;

        }


        if (!response.ok) {

            throw new Error(
                `API Error: ${response.status}`
            );

        }


        // ==============================================
        // JSON RESPONSE
        // ==============================================

        const data =
            await response.json();


        allOwnerBookings =
            Array.isArray(
                data.bookings
            )
                ? data.bookings
                : [];


        // ==============================================
        // DISPLAY ALL BOOKINGS
        // ==============================================

        renderBookings(
            allOwnerBookings
        );


    }

    catch (error) {

        console.error(
            "Owner bookings error:",
            error
        );


        allOwnerBookings = [];


        renderBookings(
            []
        );

    }

}


/* =========================================================
   FILTER
   ========================================================= */

function applyFilters() {


    const searchInput =
        document.getElementById(
            "bookingSearch"
        );


    const statusInput =
        document.getElementById(
            "bookingStatus"
        );


    const searchValue =
        String(
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    const statusValue =
        statusInput?.value ||
        "all";


    const filtered =
        allOwnerBookings.filter(
            function (booking) {


                const driver =
                    String(
                        booking.driver_name ||
                        booking.user_name ||
                        ""
                    )
                    .toLowerCase();


                const email =
                    String(
                        booking.email ||
                        ""
                    )
                    .toLowerCase();


                const lot =
                    String(
                        booking.parking_lot ||
                        booking.lot_name ||
                        ""
                    )
                    .toLowerCase();


                const bookingStatus =
                    String(
                        booking.status ||
                        ""
                    )
                    .toLowerCase();


                // ======================================
                // SEARCH MATCH
                // ======================================

                const matchesSearch =
                    !searchValue ||
                    driver.includes(
                        searchValue
                    ) ||
                    email.includes(
                        searchValue
                    ) ||
                    lot.includes(
                        searchValue
                    );


                // ======================================
                // STATUS MATCH
                // ======================================

                const matchesStatus =
                    statusValue === "all" ||
                    bookingStatus ===
                        statusValue;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderBookings(
        filtered
    );

}


/* =========================================================
   RENDER BOOKINGS
   ========================================================= */

function renderBookings(
    bookings
) {


    const container =
        document.getElementById(
            "bookingTableContainer"
        );


    const countText =
        document.getElementById(
            "bookingCountText"
        );


    if (!container) {
        return;
    }


    // ==============================================
    // COUNT
    // ==============================================

    if (countText) {

        countText.textContent =
            bookings.length === 0

                ? "No bookings available"

                : `${bookings.length} booking${
                    bookings.length === 1
                        ? ""
                        : "s"
                } found`;

    }


    // ==============================================
    // EMPTY
    // ==============================================

    if (!bookings.length) {

        container.innerHTML = `

            <div class="booking-empty">

                <div class="booking-empty-icon">

                    <i
                        class="fa-solid fa-calendar-xmark"
                    ></i>

                </div>

                <h3>
                    No bookings found
                </h3>

                <p>
                    Bookings will appear here when
                    customers reserve your parking spaces.
                </p>

            </div>

        `;

        return;

    }


    // ==============================================
    // TABLE
    // ==============================================

    container.innerHTML = `

        <table class="owner-booking-table">

            <thead>

                <tr>

                    <th>
                        DRIVER
                    </th>

                    <th>
                        PARKING LOT
                    </th>

                    <th>
                        DATE
                    </th>

                    <th>
                        TIME
                    </th>

                    <th>
                        AMOUNT
                    </th>

                    <th>
                        STATUS
                    </th>

                </tr>

            </thead>


            <tbody>

                ${bookings
                    .map(
                        createBookingRow
                    )
                    .join("")}

            </tbody>

        </table>

    `;

}


/* =========================================================
   CREATE BOOKING ROW
   ========================================================= */

function createBookingRow(
    booking
) {


    // ==============================================
    // DRIVER
    // ==============================================

    const driver =
        escapeHTML(
            booking.driver_name ||
            booking.user_name ||
            "Unknown"
        );


    const email =
        escapeHTML(
            booking.email ||
            ""
        );


    // ==============================================
    // PARKING LOT
    // ==============================================

    const lot =
        escapeHTML(
            booking.parking_lot ||
            booking.lot_name ||
            "—"
        );


    // ==============================================
    // DATE
    // ==============================================

    const date =
        escapeHTML(
            booking.date ||
            booking.booking_date ||
            "—"
        );


    // ==============================================
    // TIME
    // ==============================================

    const time =
        escapeHTML(
            booking.time ||
            booking.booking_time ||
            "—"
        );


    // ==============================================
    // AMOUNT
    // ==============================================

    const amount =
        Number(
            booking.amount ??
            booking.price ??
            booking.price_at_booking ??
            0
        );


    // ==============================================
    // STATUS
    // ==============================================

    const rawStatus =
        String(
            booking.status ||
            "Pending"
        );


    const status =
        escapeHTML(
            rawStatus
        );


    const statusClass =
        rawStatus
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );


    // ==============================================
    // RETURN ROW
    // ==============================================

    return `

        <tr>

            <td>

                <div class="driver-cell">

                    <span class="driver-avatar">

                        ${driver
                            .charAt(0)
                            .toUpperCase()}

                    </span>


                    <div>

                        <strong>
                            ${driver}
                        </strong>


                        <small>
                            ${email}
                        </small>

                    </div>

                </div>

            </td>


            <td>
                ${lot}
            </td>


            <td>
                ${date}
            </td>


            <td>
                ${time}
            </td>


            <td>
                ₹${amount.toFixed(0)}
            </td>


            <td>

                <span
                    class="booking-status ${statusClass}"
                >

                    ${status}

                </span>

            </td>

        </tr>

    `;

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}