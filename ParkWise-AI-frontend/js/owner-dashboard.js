/* =========================================================
   PARKWISE AI
   OWNER DASHBOARD
   DATABASE CONNECTED
   ========================================================= */


const API_BASE_URL =
    "http://127.0.0.1:8000";


let dashboardRefreshTimer = null;


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const ownerName =
            localStorage.getItem(
                "user_name"
            );


        const ownerRole =
            localStorage.getItem(
                "user_role"
            );


        const ownerId =
            localStorage.getItem(
                "user_id"
            );


        const token =
            localStorage.getItem(
                "access_token"
            );


        // ==========================================
        // LOGIN CHECK
        // ==========================================

        if (
            !ownerName ||
            ownerRole !== "park_owner" ||
            !ownerId ||
            !token
        ) {

            window.location.replace(
                "owner_login.html"
            );

            return;

        }


        // ==========================================
        // OWNER NAME
        // ==========================================

        const welcomeName =
            document.getElementById(
                "welcomeOwnerName"
            );


        if (welcomeName) {

            welcomeName.textContent =
                ownerName;

        }


        // ==========================================
        // FIRST LOAD
        // ==========================================

        await loadOwnerDashboard(
            ownerId,
            token
        );


        
        // ==========================================
        // LIVE DATABASE REFRESH
        // ==========================================
        //
        // Every 3 seconds:
        // MongoDB -> FastAPI -> Frontend
        //
        // Occupancy, bookings, parking lots and
        // revenue will automatically update.
        //

        if (dashboardRefreshTimer) {
            clearInterval(dashboardRefreshTimer);
        }

        dashboardRefreshTimer = setInterval(
            async function () {

                // Don't refresh when tab is hidden
                // to avoid unnecessary API requests.

                if (document.hidden) {
                    return;
                }

                try {

                    await loadOwnerDashboard(
                        ownerId,
                        token
                    );

                } catch (error) {

                    console.error(
                        "Live dashboard refresh error:",
                        error
                    );

                }

            },
            3000
        );




        // ==========================================
        // ADD LOT BUTTONS
        // ==========================================

        setupAddLotButtons();

    }
);


/* =========================================================
   LOAD OWNER DASHBOARD
   ========================================================= */

async function loadOwnerDashboard(
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


        // ==========================================
        // AUTH ERROR
        // ==========================================

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
                `Dashboard API failed: ${response.status}`
            );

        }


                
        const data =
            await response.json();

        console.log(
            "LIVE OWNER DASHBOARD DATA:",
            data
        );


        // ==========================================
        // UPDATE PARKING LOTS
        // ==========================================

        renderParkingLots(
            data.parking_lots || []
        );


        // ==========================================
        // UPDATE RECENT BOOKINGS
        // ==========================================

        renderRecentBookings(
            data.bookings || []
        );


        // ==========================================
        // UPDATE DASHBOARD STATS
        // ==========================================

        updateDashboardStats(
            data.stats || {}
        );


        // ==========================================
        // LIVE OCCUPANCY UPDATE
        // ==========================================

        updateLiveOccupancy(
            data.stats || {}
        );



    }

    catch (error) {

        console.error(
            "Owner dashboard error:",
            error
        );

    }

}


/* =========================================================
   PARKING LOTS
   ========================================================= */

function renderParkingLots(
    lots
) {

    const container =
        document.getElementById(
            "parkingLotsContainer"
        );


    if (!container) {
        return;
    }


    if (
        !Array.isArray(lots) ||
        lots.length === 0
    ) {

        container.innerHTML = `

            <div class="owner-empty-state">

                <div class="empty-icon">

                    <i class="fa-solid fa-square-parking"></i>

                </div>

                <h3>
                    No parking lots yet
                </h3>

                <p>
                    Your registered parking lots
                    will appear here.
                </p>

                <button
                    type="button"
                    class="owner-action"
                    id="emptyAddLotBtn"
                >

                    <i class="fa-solid fa-plus"></i>

                    Add your first parking lot

                </button>

            </div>

        `;


        setupAddLotButtons();

        return;

    }


    container.innerHTML =
        lots
            .map(
                createParkingLotHTML
            )
            .join("");

}


/* =========================================================
   PARKING LOT CARD
   ========================================================= */

function createParkingLotHTML(
    lot
) {

    const name =
        escapeHTML(
            lot.name ||
            "Unnamed parking lot"
        );


    const address =
        escapeHTML(
            lot.address ||
            "Address not provided"
        );


    const total =
        Number(
            lot.total_spaces ||
            lot.total_slots ||
            0
        );


    const occupied =
        Number(
            lot.occupied_spaces ||
            0
        );


    const available =
        Number(
            lot.available_spaces ??
            Math.max(
                total - occupied,
                0
            )
        );


    const percentage =
        total > 0
            ? Math.round(
                (occupied / total) * 100
            )
            : 0;


    return `

        <article class="owner-lot">

            <span class="lot-icon">

                <i class="fa-solid fa-square-parking"></i>

            </span>


            <div class="lot-info">

                <h3>
                    ${name}
                </h3>

                <p>

                    <i class="fa-solid fa-location-dot"></i>

                    ${address}

                </p>

            </div>


            <div class="lot-progress">

                <div>

                    <strong>
                        ${occupied}
                        occupied
                    </strong>

                    <span>
                        ${available}
                        available
                    </span>

                </div>


                <div class="mini-progress">

                    <span
                        style="width:${percentage}%"
                    ></span>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   RECENT BOOKINGS
   ========================================================= */

function renderRecentBookings(
    bookings
) {

    const container =
        document.getElementById(
            "recentBookingsContainer"
        );


    if (!container) {
        return;
    }


    if (
        !Array.isArray(bookings) ||
        bookings.length === 0
    ) {

        container.innerHTML = `

            <div class="owner-empty-state compact">

                <div class="empty-icon">

                    <i class="fa-solid fa-calendar-xmark"></i>

                </div>

                <h3>
                    No bookings yet
                </h3>

                <p>
                    New bookings will appear here.
                </p>

            </div>

        `;

        return;

    }


    // Backend already returns latest first.
    // Only show latest 5.

    const recent =
        bookings.slice(
            0,
            5
        );


    container.innerHTML = `

        <div class="booking-table-head">

            <span>DRIVER</span>

            <span>LOT</span>

            <span>STATUS</span>

        </div>


        ${recent
            .map(
                createBookingRow
            )
            .join("")}

    `;

}


/* =========================================================
   BOOKING ROW
   ========================================================= */

function createBookingRow(
    booking
) {

    const driver =
        escapeHTML(
            booking.driver_name ||
            booking.user_name ||
            "Unknown"
        );


    const lot =
        escapeHTML(
            booking.lot_name ||
            booking.parking_lot ||
            "—"
        );


    const status =
        escapeHTML(
            booking.status ||
            "Pending"
        );


    return `

        <div class="booking-row">

            <div class="booking-driver">

                <span class="booking-avatar">

                    ${driver
                        .charAt(0)
                        .toUpperCase()}

                </span>

                <strong>
                    ${driver}
                </strong>

            </div>


            <span>
                ${lot}
            </span>


            <span class="booking-badge">
                ${status}
            </span>

        </div>

    `;

}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

function updateDashboardStats(
    stats
) {

    const totalSpaces =
        Number(
            stats.total_spaces ||
            0
        );


    const occupiedSpaces =
        Number(
            stats.occupied_spaces ||
            0
        );


    const activeBookings =
        Number(
            stats.active_bookings ||
            0
        );


    const totalRevenue =
        Number(
            stats.total_revenue ||
            0
        );


    const availableSpaces =
        Number(
            stats.available_spaces ??
            Math.max(
                totalSpaces -
                occupiedSpaces,
                0
            )
        );


    // ==========================================
    // TOP STAT CARDS
    // ==========================================

    setText(
        "totalSpaces",
        totalSpaces
    );


    setText(
        "occupiedSpaces",
        occupiedSpaces
    );


    setText(
        "activeBookings",
        activeBookings
    );


    setText(
        "todayRevenue",
        `₹${totalRevenue.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        )}`
    );


    // ==========================================
    // OCCUPANCY
    // ==========================================

    const percentage =
        totalSpaces > 0
            ? Math.round(
                (
                    occupiedSpaces /
                    totalSpaces
                ) * 100
            )
            : 0;


    setText(
        "occupancyPercent",
        `${percentage}%`
    );


    setText(
        "occupancyText",

        totalSpaces > 0

            ? `${occupiedSpaces} of ${totalSpaces} parking spaces are occupied.`

            : "No parking space data available."
    );


    const progress =
        document.getElementById(
            "occupancyProgress"
        );


    if (progress) {

        progress.style.width =
            `${percentage}%`;

    }

}


/* =========================================================
   LIVE OCCUPANCY
   ========================================================= */

function updateLiveOccupancy(
    stats
) {

    const totalSpaces =
        Number(
            stats.total_spaces ?? 0
        );


    const occupiedSpaces =
        Number(
            stats.occupied_spaces ?? 0
        );


    const availableSpaces =
        Number(
            stats.available_spaces ??
            Math.max(
                totalSpaces -
                occupiedSpaces,
                0
            )
        );


    // ==========================================
    // OCCUPANCY PERCENTAGE
    // ==========================================

    const percentage =
        totalSpaces > 0
            ? Math.round(
                (
                    occupiedSpaces /
                    totalSpaces
                ) * 100
            )
            : 0;


    // ==========================================
    // OCCUPANCY %
    // ==========================================

    setText(
        "occupancyPercent",
        `${percentage}%`
    );


    // ==========================================
    // OCCUPANCY DESCRIPTION
    // ==========================================

    setText(
        "occupancyText",

        totalSpaces > 0

            ? `${occupiedSpaces} of ${totalSpaces} parking spaces are occupied. ${availableSpaces} spaces available.`

            : "No parking space data available."
    );


    // ==========================================
    // PROGRESS BAR
    // ==========================================

    const progress =
        document.getElementById(
            "occupancyProgress"
        );


    if (progress) {

        progress.style.width =
            `${percentage}%`;

    }


    // ==========================================
    // OPTIONAL LIVE STATUS
    // ==========================================

    const liveIndicator =
        document.querySelector(
            ".live-indicator"
        );


    if (liveIndicator) {

        liveIndicator.title =
            `Updated from database • ${new Date().toLocaleTimeString()}`;

    }


    console.log(
        "LIVE OCCUPANCY:",
        {
            total: totalSpaces,
            occupied: occupiedSpaces,
            available: availableSpaces,
            percentage: percentage
        }
    );

}



/* =========================================================
   ADD LOT BUTTONS
   ========================================================= */

function setupAddLotButtons() {

    const buttons =
        document.querySelectorAll(
            "#addParkingLotBtn, #emptyAddLotBtn"
        );


    buttons.forEach(
        button => {

            button.onclick =
                function () {

                    window.location.href =
                        "owner-verification.html";

                };

        }
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
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

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

