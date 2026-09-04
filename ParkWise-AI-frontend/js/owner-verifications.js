document.addEventListener("DOMContentLoaded", () => {

    const tableBody =
        document.getElementById(
            "verificationTableBody"
        );

    const searchInput =
        document.getElementById(
            "verificationSearch"
        );

    const filterSelect =
        document.getElementById(
            "verificationStatusFilter"
        );

    const refreshButton =
        document.getElementById(
            "refreshVerifications"
        );


    // ==========================================
    // SUMMARY ELEMENTS
    // ==========================================

    const pendingCount =
        document.getElementById(
            "pendingCount"
        );

    const approvedCount =
        document.getElementById(
            "approvedCount"
        );

    const rejectedCount =
        document.getElementById(
            "rejectedCount"
        );

    const totalOwnersCount =
        document.getElementById(
            "totalOwnersCount"
        );


    // ==========================================
    // API
    // ==========================================

    const API_BASE =
        "http://127.0.0.1:8000";


    // ==========================================
    // STATE
    // ==========================================

    let verificationRequests = [];


    // ==========================================
    // TOKEN
    // ==========================================

    function getToken() {

        return localStorage.getItem(
            "access_token"
        );

    }


    // ==========================================
    // AUTH CHECK
    // ==========================================

    function checkAdminLogin() {

        const token =
            getToken();

        const role =
            localStorage.getItem(
                "user_role"
            );

        if (
            !token ||
            role !== "admin"
        ) {

            window.location.replace(
                "admin-login.html"
            );

            return false;

        }

        return true;

    }


    // ==========================================
    // LOAD ALL OWNER VERIFICATIONS
    // ==========================================

    async function loadVerifications() {

        if (!checkAdminLogin()) {
            return;
        }


        try {

            showLoading();


            const response =
                await fetch(
                    `${API_BASE}/admin/owners`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${getToken()}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            // ======================================
            // AUTH ERROR
            // ======================================

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem(
                    "access_token"
                );

                localStorage.removeItem(
                    "user_role"
                );

                localStorage.removeItem(
                    "admin_logged_in"
                );

                window.location.replace(
                    "admin-login.html"
                );

                return;

            }


            if (!response.ok) {

                throw new Error(
                    `Owner verification API error: ${response.status}`
                );

            }


            const data =
                await response.json();


            console.log(
                "Owner verification data:",
                data
            );


            verificationRequests =
                Array.isArray(data.owners)
                    ? data.owners
                    : [];


            updateSummary();


            renderRequests();


        } catch (error) {

            console.error(
                "Failed to load owner verifications:",
                error
            );


            showError();

        }

    }


    // ==========================================
    // SUMMARY COUNTS
    // ==========================================

    function updateSummary() {

        const pending =
            verificationRequests.filter(
                request =>
                    request.status ===
                    "pending"
            ).length;


        const approved =
            verificationRequests.filter(
                request =>
                    request.status ===
                    "approved"
            ).length;


        const rejected =
            verificationRequests.filter(
                request =>
                    request.status ===
                    "rejected"
            ).length;


        pendingCount.textContent =
            pending;


        approvedCount.textContent =
            approved;


        rejectedCount.textContent =
            rejected;


        totalOwnersCount.textContent =
            verificationRequests.length;

    }


    // ==========================================
    // FILTER + SEARCH
    // ==========================================

    function getFilteredRequests() {

        const search =
            (
                searchInput?.value || ""
            )
                .trim()
                .toLowerCase();


        const status =
            filterSelect?.value ||
            "all";


        return verificationRequests.filter(
            request => {

                const owner =
                    String(
                        request.owner || ""
                    ).toLowerCase();


                const business =
                    String(
                        request.businessName || ""
                    ).toLowerCase();


                const email =
                    String(
                        request.email || ""
                    ).toLowerCase();


                const parkingLot =
                    String(
                        request.parkingLot || ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    owner.includes(search) ||
                    business.includes(search) ||
                    email.includes(search) ||
                    parkingLot.includes(search);


                const matchesStatus =
                    status === "all" ||
                    request.status === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );

    }


    // ==========================================
    // RENDER
    // ==========================================

    function renderRequests() {

        if (!tableBody) {
            return;
        }


        const filtered =
            getFilteredRequests();


        if (filtered.length === 0) {

            tableBody.innerHTML = `

                <tr>

                    <td colspan="5">

                        <div class="verification-empty-state">

                            <div class="verification-empty-icon">

                                <i class="fa-solid fa-folder-open"></i>

                            </div>

                            <h3>
                                No verification requests found
                            </h3>

                            <p>
                                There are no owner verification
                                records matching your current filter.
                            </p>

                        </div>

                    </td>

                </tr>

            `;

            return;

        }


        tableBody.innerHTML =
            filtered
                .map(createRow)
                .join("");

    }


    // ==========================================
    // CREATE TABLE ROW
    // ==========================================

    function createRow(request) {

        const status =
            request.status || "pending";


        let statusClass =
            "status-pending";


        let statusIcon =
            "fa-hourglass-half";


        let statusText =
            "Pending Review";


        if (status === "approved") {

            statusClass =
                "status-approved";

            statusIcon =
                "fa-circle-check";

            statusText =
                "Approved";

        }


        if (status === "rejected") {

            statusClass =
                "status-rejected";

            statusIcon =
                "fa-circle-xmark";

            statusText =
                "Rejected";

        }


        return `

            <tr class="verification-row">

                <td>

                    <div class="owner-cell">

                        <div class="owner-avatar">

                            ${escapeHTML(
                                getInitial(
                                    request.owner
                                )
                            )}

                        </div>


                        <div class="owner-info">

                            <strong>
                                ${escapeHTML(
                                    request.owner ||
                                    "Unknown Owner"
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    request.businessName ||
                                    "ParkWise Owner"
                                )}
                            </span>

                            <small>
                                ${escapeHTML(
                                    request.email || "—"
                                )}
                            </small>

                        </div>

                    </div>

                </td>


                <td>

                    <div class="parking-cell">

                        <i class="fa-solid fa-square-parking"></i>

                        <span>
                            ${escapeHTML(
                                request.parkingLot ||
                                "—"
                            )}
                        </span>

                    </div>

                </td>


                <td>

                    <span class="submitted-date">

                        <i class="fa-regular fa-calendar"></i>

                        ${escapeHTML(
                            formatDate(
                                request.submitted
                            )
                        )}

                    </span>

                </td>


                <td>

                    <span
                        class="${statusClass}"
                    >

                        <i class="fa-solid ${statusIcon}"></i>

                        ${statusText}

                    </span>

                </td>


                <td>

                    <button
                        class="action-button"
                        type="button"
                        data-verification-id="${escapeAttribute(
                            request.id || ""
                        )}"
                    >

                        <i class="fa-solid fa-eye"></i>

                        Review

                    </button>

                </td>

            </tr>

        `;

    }


    // ==========================================
    // OPEN DETAIL
    // ==========================================

    tableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-verification-id]"
                );

            if (!button) {
                return;
            }

            const id =
                button.getAttribute(
                    "data-verification-id"
                );

            const selectedRequest =
                verificationRequests.find(
                    request =>
                        String(
                            request.id ||
                            request.owner_id
                        ) === String(id)
                );

            if (!selectedRequest) {

                alert(
                    "Verification request not found."
                );

                return;
            }

            localStorage.setItem(
                "selected_verification",
                JSON.stringify(
                    selectedRequest
                )
            );

            window.location.href =
                "verification-detail.html";
        }
    );


    // ==========================================
    // SEARCH
    // ==========================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderRequests
        );

    }


    // ==========================================
    // STATUS FILTER
    // ==========================================

    if (filterSelect) {

        filterSelect.addEventListener(
            "change",
            renderRequests
        );

    }


    // ==========================================
    // REFRESH BUTTON
    // ==========================================

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled =
                    true;

                refreshButton.innerHTML = `

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Refreshing...

                `;


                await loadVerifications();


                refreshButton.disabled =
                    false;

                refreshButton.innerHTML = `

                    <i class="fa-solid fa-rotate"></i>

                    Refresh

                `;

            }
        );

    }


    // ==========================================
    // AUTO REFRESH
    // ==========================================

    setInterval(
        loadVerifications,
        10000
    );


    // ==========================================
    // LOADING
    // ==========================================

    function showLoading() {

        tableBody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="verification-loading">

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        <span>
                            Loading owner verifications...
                        </span>

                    </div>

                </td>

            </tr>

        `;

    }


    // ==========================================
    // ERROR
    // ==========================================

    function showError() {

        tableBody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="verification-error">

                        <div class="verification-error-icon">

                            <i class="fa-solid fa-triangle-exclamation"></i>

                        </div>

                        <h3>
                            Unable to load verifications
                        </h3>

                        <p>
                            Please make sure the FastAPI backend
                            and MongoDB are running.
                        </p>

                        <button
                            type="button"
                            class="action-button"
                            onclick="location.reload()"
                        >
                            <i class="fa-solid fa-rotate"></i>
                            Try Again
                        </button>

                    </div>

                </td>

            </tr>

        `;

    }


    // ==========================================
    // DATE FORMAT
    // ==========================================

    function formatDate(value) {

        if (
            !value ||
            value === "—"
        ) {
            return "—";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    // ==========================================
    // INITIAL
    // ==========================================

    loadVerifications();


    // ==========================================
    // HELPERS
    // ==========================================

    function getInitial(name) {

        return String(
            name || "O"
        )
            .trim()
            .charAt(0)
            .toUpperCase();

    }


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


    function escapeAttribute(value) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            );

    }

});