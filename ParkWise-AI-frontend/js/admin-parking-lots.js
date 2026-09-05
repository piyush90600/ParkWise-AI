document.addEventListener("DOMContentLoaded", () => {


    // ==========================================
    // CONFIG
    // ==========================================

    const API_BASE =
        "http://127.0.0.1:8000";


    // ==========================================
    // ELEMENTS
    // ==========================================

    const tableBody =
        document.getElementById(
            "parkingTableBody"
        );

    const loading =
        document.getElementById(
            "parkingLoading"
        );

    const empty =
        document.getElementById(
            "parkingEmpty"
        );

    const searchInput =
        document.getElementById(
            "parkingSearch"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    const refreshButton =
        document.getElementById(
            "refreshParking"
        );

    const resultCount =
        document.getElementById(
            "resultCount"
        );

    const totalLots =
        document.getElementById(
            "totalLots"
        );

    const activeLots =
        document.getElementById(
            "activeLots"
        );

    const totalSlots =
        document.getElementById(
            "totalSlots"
        );

    const overallOccupancy =
        document.getElementById(
            "overallOccupancy"
        );

    const slotDetailsSection =
    document.getElementById(
        "slotDetailsSection"
    );

    const slotTableBody =
        document.getElementById(
            "slotTableBody"
        );

    const slotLoading =
        document.getElementById(
            "slotLoading"
        );

    const slotEmpty =
        document.getElementById(
            "slotEmpty"
        );

    const slotResultCount =
        document.getElementById(
            "slotResultCount"
        );

    const selectedLotName =
        document.getElementById(
            "selectedLotName"
        );

    // ==========================================
    // STATE
    // ==========================================

    let allParkingLots = [];


    // ==========================================
    // TOKEN
    // ==========================================

    function getToken() {

        return localStorage.getItem(
            "access_token"
        );

    }


    // ==========================================
    // ADMIN CHECK
    // ==========================================

    function isAdminLoggedIn() {

        const token =
            getToken();

        const role =
            localStorage.getItem(
                "user_role"
            );

        const adminLoggedIn =
            localStorage.getItem(
                "admin_logged_in"
            );

        return (
            !!token &&
            (
                role === "admin" ||
                adminLoggedIn === "true"
            )
        );

    }


    // ==========================================
    // LOGOUT
    // ==========================================

    function logoutAdmin() {

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "user_role"
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
            "admin_logged_in"
        );

        localStorage.removeItem(
            "admin_name"
        );

        localStorage.removeItem(
            "admin_email"
        );

        window.location.replace(
            "admin-login.html"
        );

    }


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHTML(value) {

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


    // ==========================================
    // FORMAT PRICE
    // ==========================================

    function formatPrice(value) {

        const price =
            Number(value || 0);

        return `₹${price.toFixed(2)}`;

    }


    // ==========================================
    // STATUS
    // ==========================================

   function statusClass(status) {

        const value =
            String(
                status || "unknown"
            )
                .toLowerCase()
                .trim();

        if (
            value === "active" ||
            value === "approved" ||
            value === "verified"
        ) {
            return "approved";
        }

        if (value === "rejected") {
            return "rejected";
        }

        if (value === "pending") {
            return "pending";
        }

        return "unknown";
    }


    // ==========================================
    // VEHICLE ICON
    // ==========================================

    function vehicleIcon(vehicle) {

        const value =
            String(
                vehicle || "all"
            ).toLowerCase();

        if (value === "car") {

            return "fa-car";

        }

        if (value === "bike") {

            return "fa-motorcycle";

        }

        return "fa-car-side";

    }


    // ==========================================
    // FETCH PARKING LOTS
    // ==========================================

    async function fetchParkingLots() {

        if (!isAdminLoggedIn()) {

            logoutAdmin();

            return;

        }


        try {

            // Loading sirf tab show hoga jab actual fetch ho raha hai
            loading.hidden = false;

            // Purana empty message hide rakho
            empty.hidden = true;

            // Table ko temporarily clear karo
            tableBody.innerHTML = "";

            refreshButton.classList.add(
                "loading"
            );


            const response =
                await fetch(
                    `${API_BASE}/admin/parking-lots`,
                    {
                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${getToken()}`,

                            "Content-Type":
                                "application/json",

                            "Cache-Control":
                                "no-cache"

                        },

                        cache: "no-store"

                    }
                );


            // ==================================
            // AUTH ERROR
            // ==================================

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logoutAdmin();

                return;

            }


            if (!response.ok) {

                throw new Error(
                    `API Error: ${response.status}`
                );

            }


            const data =
                await response.json();


            console.log(
                "Parking lots from database:",
                data
            );


            allParkingLots =
                Array.isArray(
                    data.parking_lots
                )
                    ? data.parking_lots
                    : [];


            updateSummary(
                allParkingLots
            );


            applyFilters();


        } catch (error) {

            console.error(
                "Parking lots fetch error:",
                error
            );

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        style="
                            text-align:center;
                            padding:50px;
                            color:#dc2626;
                        "
                    >

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        &nbsp;

                        Unable to load parking lots.

                    </td>

                </tr>

            `;

            resultCount.textContent =
                "Unable to load";


        } finally {

            // Database response aa chuka hai,
            // isliye loading message hata do
            loading.hidden = true;

            refreshButton.classList.remove(
                "loading"
            );

    }

    }


    // ==========================================
    // FETCH SLOTS FROM DATABASE
    // ==========================================

    async function fetchParkingSlots(
        lotId,
        lotName
    ) {

        if (!isAdminLoggedIn()) {

            logoutAdmin();

            return;

        }


        if (!lotId) {

            return;

        }


        try {

            slotDetailsSection.hidden = false;

            slotLoading.hidden = false;

            slotEmpty.hidden = true;

            slotTableBody.innerHTML = "";

            selectedLotName.textContent =
                `${lotName} - Parking Slots`;

            slotResultCount.textContent =
                "Loading...";


            const response =
                await fetch(
                    `${API_BASE}/admin/parking-lots/${encodeURIComponent(
                        lotId
                    )}/slots`,
                    {
                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${getToken()}`,

                            "Content-Type":
                                "application/json",

                            "Cache-Control":
                                "no-cache"

                        },

                        cache: "no-store"

                    }
                );


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logoutAdmin();

                return;

            }


            if (!response.ok) {

                throw new Error(
                    `Slots API Error: ${response.status}`
                );

            }


            const data =
                await response.json();


            console.log(
                `Slots for ${lotId}:`,
                data
            );


            const slots =
                Array.isArray(
                    data.slots
                )
                    ? data.slots
                    : [];


            slotResultCount.textContent =
                `${slots.length} slot${
                    slots.length === 1
                        ? ""
                        : "s"
                }`;


            if (!slots.length) {

                slotTableBody.innerHTML = "";

                slotEmpty.hidden = false;

                return;

            }


            slotEmpty.hidden = true;


            slotTableBody.innerHTML =
                slots.map(
                    slot => {

                        const status =
                            String(
                                slot.status ||
                                "available"
                            )
                                .toLowerCase()
                                .trim();


                        let statusIcon =
                            "fa-circle-check";


                        if (
                            status ===
                            "occupied"
                        ) {

                            statusIcon =
                                "fa-circle-xmark";

                        }
                        else if (
                            status ===
                            "reserved"
                        ) {

                            statusIcon =
                                "fa-clock";

                        }


                        return `

                            <tr>

                                <td>

                                    ${escapeHTML(
                                        slot.id ||
                                        "N/A"
                                    )}

                                </td>


                                <td>

                                    <strong>

                                        ${escapeHTML(
                                            slot.slot_number ||
                                            "N/A"
                                        )}

                                    </strong>

                                </td>


                                <td>

                                    <span class="vehicle-badge">

                                        <i
                                            class="fa-solid ${vehicleIcon(
                                                slot.vehicle_type
                                            )}"
                                        ></i>

                                        ${escapeHTML(
                                            slot.vehicle_type ||
                                            "all"
                                        )}

                                    </span>

                                </td>


                                <td>

                                    <span
                                        class="
                                            parking-status
                                            ${status}
                                        "
                                    >

                                        <i
                                            class="fa-solid ${statusIcon}"
                                        ></i>

                                        ${escapeHTML(
                                            status
                                        )}

                                    </span>

                                </td>

                            </tr>

                        `;

                    }
                )
                .join("");


        } catch (error) {

            console.error(
                "Slots fetch error:",
                error
            );


            slotResultCount.textContent =
                "Unable to load";


            slotTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        style="
                            text-align:center;
                            padding:50px;
                            color:#dc2626;
                        "
                    >

                        <i
                            class="fa-solid fa-triangle-exclamation"
                        ></i>

                        &nbsp;

                        Unable to load slots.

                    </td>

                </tr>

            `;


        } finally {

            slotLoading.hidden = true;

        }

    }
    
    // ==========================================
    // SUMMARY
    // ==========================================

    function updateSummary(lots) {

        const total =
            lots.length;


        const active =
            lots.filter(
                lot => [
                    "active",
                    "approved",
                    "verified"
                ].includes(
                    String(
                        lot.status || ""
                    ).toLowerCase()
                )
            ).length;


        const slots =
            lots.reduce(
                (
                    sum,
                    lot
                ) =>
                    sum +
                    Number(
                        lot.total_slots || 0
                    ),
                0
            );


        const occupied =
            lots.reduce(
                (
                    sum,
                    lot
                ) =>
                    sum +
                    Number(
                        lot.occupied_slots || 0
                    ),
                0
            );


        const occupancy =
            slots > 0
                ? (
                    occupied /
                    slots
                ) * 100
                : 0;


        totalLots.textContent =
            total;

        activeLots.textContent =
            active;

        totalSlots.textContent =
            slots.toLocaleString(
                "en-IN"
            );

        overallOccupancy.textContent =
            `${occupancy.toFixed(1)}%`;

    }


    // ==========================================
    // FILTER
    // ==========================================

    function applyFilters() {

        const search =
            String(
                searchInput.value || ""
            )
                .trim()
                .toLowerCase();


        const status =
            statusFilter.value;


        const filtered =
            allParkingLots.filter(
                lot => {

                    const text = [

                        lot.name,

                        lot.parking_lots_id,

                        lot.owner_name,

                        lot.owner_email,

                        lot.address,

                        lot.vehicle_type

                    ]
                        .join(" ")
                        .toLowerCase();


                    const matchesSearch =
                        !search ||
                        text.includes(
                            search
                        );


                    const lotStatus =
                        String(
                            lot.status || ""
                        )
                            .toLowerCase()
                            .trim();

                    const matchesStatus =
                        status === "all" ||
                        lotStatus === status;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );


        renderParkingLots(
            filtered
        );

    }


    // ==========================================
    // RENDER
    // ==========================================

   function renderParkingLots(lots) {

        resultCount.textContent =
            `${lots.length} parking lot${
                lots.length === 1
                    ? ""
                    : "s"
            }`;


        // ==========================================
        // IMPORTANT:
        // Database se parking lots successfully aaye hain
        // ==========================================

        if (allParkingLots.length > 0) {

            // Loading hide
            loading.hidden = true;

            // Agar search/filter ke result 0 hain
            // tab bhi database empty state mat dikhao
            if (!lots.length) {

                tableBody.innerHTML = "";

                empty.hidden = true;

                resultCount.textContent =
                    "0 parking lots";

                return;
            }

            // Parking lots available hain
            empty.hidden = true;


            tableBody.innerHTML =
                lots.map(
                    lot => {

                        const total =
                            Number(
                                lot.total_slots || 0
                            );

                        const available =
                            Number(
                                lot.available_slots || 0
                            );

                        const occupied =
                            Number(
                                lot.occupied_slots || 0
                            );

                        const occupancy =
                            total > 0
                                ? (
                                    occupied /
                                    total
                                ) * 100
                                : 0;


                        const status =
                            statusClass(
                                lot.status
                            );


                        const vehicle =
                            String(
                                lot.vehicle_type ||
                                "all"
                            );


                        return `

                            <tr>

                                <td>

                                    <div class="lot-info">

                                        <div class="lot-icon">

                                            <i
                                                class="fa-solid fa-square-parking"
                                            ></i>

                                        </div>

                                        <div>

                                            <strong>
                                                ${escapeHTML(
                                                    lot.name ||
                                                    "Unnamed Parking"
                                                )}
                                            </strong>

                                            <span class="lot-id">
                                                ID:
                                                ${escapeHTML(
                                                    lot.parking_lots_id ||
                                                    "N/A"
                                                )}
                                            </span>

                                        </div>

                                    </div>

                                </td>


                                <td>

                                    <div class="owner-info">

                                        <strong>
                                            ${escapeHTML(
                                                lot.owner_name ||
                                                "Unknown Owner"
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                lot.owner_email ||
                                                "No email"
                                            )}
                                        </span>

                                    </div>

                                </td>


                                <td>

                                    <div class="location-cell">

                                        <i
                                            class="fa-solid fa-location-dot"
                                        ></i>

                                        ${escapeHTML(
                                            lot.address ||
                                            "Location unavailable"
                                        )}

                                    </div>

                                </td>


                                <td>

                                    <span class="price-value">

                                        ${formatPrice(
                                            lot.price_per_hour
                                        )}

                                        <small>
                                            /hr
                                        </small>

                                    </span>

                                </td>


                                <td>

                                    <div class="slot-info">

                                        <div class="slot-numbers">

                                            <span class="slot-available">
                                                ${available}
                                            </span>

                                            <span>
                                                /
                                            </span>

                                            <span class="slot-total">
                                                ${total}
                                            </span>

                                        </div>

                                        <div class="slot-bar">

                                            <div
                                                class="slot-progress"
                                                style="
                                                    width:${
                                                        total > 0
                                                            ? Math.min(
                                                                (available / total) * 100,
                                                                100
                                                            )
                                                            : 0
                                                    }%;
                                                "
                                            ></div>

                                        </div>

                                    </div>

                                </td>


                                <td>

                                    <span class="vehicle-badge">

                                        <i
                                            class="fa-solid ${vehicleIcon(
                                                vehicle
                                            )}"
                                        ></i>

                                        ${escapeHTML(
                                            vehicle
                                        )}

                                    </span>

                                </td>


                                <td>

                                    <span>

                                        ${escapeHTML(
                                            lot.timing_start ||
                                            "--"
                                        )}

                                        -

                                        ${escapeHTML(
                                            lot.timing_end ||
                                            "--"
                                        )}

                                    </span>

                                </td>


                                <td>

                                    <span
                                        class="
                                            parking-status
                                            ${status}
                                        "
                                    >

                                        <i
                                            class="fa-solid ${
                                                status ===
                                                    "rejected"
                                                    ? "fa-circle-xmark"
                                                    : status ===
                                                        "pending"
                                                        ? "fa-clock"
                                                        : "fa-circle-check"
                                            }"
                                        ></i>

                                        ${escapeHTML(
                                            lot.status ||
                                            "Unknown"
                                        )}

                                    </span>

                                </td>

                                <td>

                                    <button
                                        type="button"
                                        class="view-slots-button"
                                        data-lot-id="${escapeHTML(
                                            lot.parking_lots_id || ""
                                        )}"
                                        data-lot-name="${escapeHTML(
                                            lot.name || "Parking"
                                        )}"
                                    >

                                        <i class="fa-solid fa-table-cells"></i>

                                        View Slots

                                    </button>

                                </td>

                            </tr>

                        `;

                    }
                )
                .join("");

            return;
        }


        // ==========================================
        // DATABASE SE EMPTY HAI
        // ==========================================

        tableBody.innerHTML = "";

        empty.hidden = false;

    }


    // ==========================================
    // SEARCH
    // ==========================================

    searchInput.addEventListener(
        "input",
        applyFilters
    );


    // ==========================================
    // STATUS FILTER
    // ==========================================

    statusFilter.addEventListener(
        "change",
        applyFilters
    );


    // ==========================================
    // MANUAL REFRESH
    // ==========================================

    refreshButton.addEventListener(
        "click",
        fetchParkingLots
    );

    // ==========================================
    // VIEW SLOTS
    // ==========================================

    tableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".view-slots-button"
                );


            if (!button) {

                return;

            }


            const lotId =
                button.dataset.lotId;


            const lotName =
                button.dataset.lotName ||
                "Parking";


            fetchParkingSlots(
                lotId,
                lotName
            );

        }
    );


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    fetchParkingLots();

    autoRefreshParkingLots();

    // ==========================================
    // AUTO REFRESH EVERY 3 SECONDS
    // ==========================================

    async function autoRefreshParkingLots() {

        while (true) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        10000
                    )
            );

            await fetchParkingLots();

        }

    }


});