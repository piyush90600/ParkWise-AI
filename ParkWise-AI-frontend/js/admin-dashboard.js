document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ELEMENTS
    // ==========================================

    const pendingOwners =
        document.getElementById("pendingOwners");

    const verifiedOwners =
        document.getElementById("verifiedOwners");

    const activeParkingLots =
        document.getElementById("activeParkingLots");

    const openReports =
        document.getElementById("openReports");

    const verificationQueue =
        document.getElementById("verificationQueue");

    const recentlyApprovedList =
        document.getElementById("recentlyApprovedList");


    // ==========================================
    // CONFIG
    // ==========================================

    const API_BASE =
        "http://127.0.0.1:8000";


    // ==========================================
    // AUTH
    // ==========================================

    function getToken() {

        return localStorage.getItem(
            "access_token"
        );
    }


    function isAdminLoggedIn() {

        const token =
            getToken();

        const role =
            localStorage.getItem(
                "user_role"
            );

        return (
            !!token &&
            role === "admin"
        );
    }


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

        window.location.replace(
            "admin-login.html"
        );
    }


    // ==========================================
    // AUTH CHECK
    // ==========================================

    if (!isAdminLoggedIn()) {

        window.location.replace(
            "admin-login.html"
        );

        return;
    }


    // ==========================================
    // FORMAT DATE
    // ==========================================

    function formatDate(value) {

        if (!value) {
            return "Recently";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Recently";
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

    function getInitial(name) {

        return String(
            name || "O"
        )
            .trim()
            .charAt(0)
            .toUpperCase();
    }


    // ==========================================
    // LOAD DASHBOARD
    // ==========================================

    async function loadDashboardData() {

        if (!isAdminLoggedIn()) {
            return;
        }

        try {

            const response =
                await fetch(
                    `${API_BASE}/admin/dashboard`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${getToken()}`,

                            "Content-Type":
                                "application/json",

                            "Cache-Control":
                                "no-cache"
                        }
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
                    `Dashboard API error: ${response.status}`
                );
            }


            const data =
                await response.json();


            console.log(
                "Live admin dashboard:",
                data
            );


            // ==================================
            // STATS
            // ==================================

            const stats =
                data.stats || {};


            if (pendingOwners) {

                pendingOwners.textContent =
                    Number(
                        stats.pending_owners ?? 0
                    );
            }


            if (verifiedOwners) {

                verifiedOwners.textContent =
                    Number(
                        stats.verified_owners ?? 0
                    );
            }


            if (activeParkingLots) {

                activeParkingLots.textContent =
                    Number(
                        stats.active_lots ?? 0
                    );
            }


            if (openReports) {

                openReports.textContent =
                    Number(
                        stats.open_reports ?? 0
                    );
            }


            // ==================================
            // QUEUE
            // ==================================

            renderVerificationQueue(
                Array.isArray(
                    data.verification_queue
                )
                    ? data.verification_queue
                    : []
            );


            // ==================================
            // RECENT APPROVED
            // ==================================

            renderRecentlyApproved(
                Array.isArray(
                    data.recently_approved
                )
                    ? data.recently_approved
                    : []
            );


        } catch (error) {

            console.error(
                "Admin dashboard error:",
                error
            );

            showDashboardError();

        }

    }


    // ==========================================
    // VERIFICATION QUEUE
    // ==========================================

    function renderVerificationQueue(items) {

        if (!verificationQueue) {
            return;
        }


        // --------------------------------------
        // EMPTY
        // --------------------------------------

        if (!items.length) {

            verificationQueue.innerHTML = `

                <div class="admin-empty-state">

                    <div class="admin-empty-icon">

                        <i class="fa-solid fa-circle-check"></i>

                    </div>

                    <h3>
                        All caught up
                    </h3>

                    <p>
                        There are currently no pending
                        owner verification requests.
                    </p>

                    <a
                        href="owner-verifications.html"
                        class="admin-empty-button"
                    >

                        <i class="fa-solid fa-users"></i>

                        View All Owners

                    </a>

                </div>

            `;

            return;
        }


        // --------------------------------------
        // QUEUE ITEMS
        // --------------------------------------

        verificationQueue.innerHTML =
            items.map(
                owner => {

                    const name =
                        owner.owner ||
                        "Unknown Owner";

                    const business =
                        owner.businessName ||
                        "Parking Business";

                    const email =
                        owner.email ||
                        "No email";

                    const id =
                        owner.owner_id ||
                        owner.id ||
                        "";

                    return `

                        <div class="verification">

                            <div class="verification-icon">

                                <i class="fa-solid fa-user-clock"></i>

                            </div>


                            <div>

                                <h3>
                                    ${escapeHtml(name)}
                                </h3>

                                <p>
                                    ${escapeHtml(business)}
                                    •
                                    ${escapeHtml(email)}
                                </p>

                                <small
                                    class="verification-id"
                                >
                                    ID: ${escapeHtml(id)}
                                </small>

                            </div>


                            <time>
                                ${formatDate(
                                    owner.submitted
                                )}
                            </time>


                            <a
                                href="verification-detail.html?id=${encodeURIComponent(id)}"
                                class="queue-review-btn"
                            >

                                Review

                                <i class="fa-solid fa-arrow-right"></i>

                            </a>

                        </div>

                    `;

                }
            ).join("");
    }


    // ==========================================
    // RECENTLY APPROVED
    // ==========================================

    function renderRecentlyApproved(items) {

        if (!recentlyApprovedList) {
            return;
        }


        if (!items.length) {

            recentlyApprovedList.innerHTML = `

                <div class="admin-empty-small">

                    <i class="fa-solid fa-clock-rotate-left"></i>

                    <span>
                        No approved owners yet.
                    </span>

                </div>

            `;

            return;
        }


        recentlyApprovedList.innerHTML =
            items.map(
                owner => {

                    const name =
                        owner.owner ||
                        "Unknown Owner";

                    const business =
                        owner.businessName ||
                        "Parking Business";

                    return `

                        <div class="approved-owner-item">

                            <div class="approved-avatar">

                                ${getInitial(name)}

                            </div>


                            <div class="approved-owner-info">

                                <strong>
                                    ${escapeHtml(name)}
                                </strong>

                                <span>
                                    ${escapeHtml(business)}
                                </span>

                            </div>


                            <span class="status-approved">

                                <i class="fa-solid fa-check"></i>

                                Verified

                            </span>

                        </div>

                    `;

                }
            ).join("");
    }


    // ==========================================
    // HTML ESCAPE
    // ==========================================

    function escapeHtml(value) {

        return String(value ?? "")
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
    // ERROR STATE
    // ==========================================

    function showDashboardError() {

        if (verificationQueue) {

            verificationQueue.innerHTML = `

                <div class="admin-empty-state">

                    <div
                        class="admin-empty-icon"
                        style="background:#fef2f2;color:#dc2626;"
                    >

                        <i class="fa-solid fa-triangle-exclamation"></i>

                    </div>

                    <h3>
                        Unable to load dashboard
                    </h3>

                    <p>
                        Please make sure FastAPI and
                        MongoDB are running.
                    </p>

                    <button
                        class="admin-empty-button"
                        onclick="location.reload()"
                    >

                        <i class="fa-solid fa-rotate"></i>

                        Retry

                    </button>

                </div>

            `;
        }
    }


    // ==========================================
    // FIRST LOAD
    // ==========================================

    loadDashboardData();


    // ==========================================
    // LIVE DATABASE UPDATE
    // EVERY 3 SECONDS
    // ==========================================

    setInterval(
        loadDashboardData,
        10000
    );

});