(function () {

    const adminLoggedIn =
    localStorage.getItem("admin_logged_in");

    if (
    adminLoggedIn !== "true" &&
    !location.pathname.endsWith("admin-login.html")
    ) {
    window.location.replace("admin-login.html");
    return;
    }

    const sidebar = document.querySelector(".sidebar");
    const header = document.querySelector(".top-header");

    if (!sidebar || !header) {
        return;
    }


    // ==========================================
    // CURRENT PAGE
    // ==========================================

    const page = location.pathname
        .split("/")
        .pop();

    const active = (file) => {
        return page === file ? " active" : "";
    };


    // ==========================================
    // ADMIN LOGIN DATA
    // ==========================================

    const adminName =
        localStorage.getItem("admin_name") ||
        "Admin";

    const adminEmail =
        localStorage.getItem("admin_email") ||
        "";


    // ==========================================
    // ADMIN INITIAL
    // ==========================================

    const adminInitial =
        adminName
            .trim()
            .charAt(0)
            .toUpperCase() || "A";


    // ==========================================
    // SIDEBAR
    // ==========================================

    sidebar.classList.add("shared-sidebar");

    sidebar.innerHTML = `

        <a class="app-brand" href="admin-dashboard.html">

            <span class="app-brand-icon">
                <i class="fa-solid fa-shield-halved"></i>
            </span>

            <span>
                ParkWise <strong>Admin</strong>
            </span>

        </a>


        <nav class="nav-menu">

            <p class="nav-heading">
                ADMIN PORTAL
            </p>


            <!-- Dashboard -->
            <a
                class="nav-link${active("admin-dashboard.html")}"
                href="admin-dashboard.html"
            >
                <i class="fa-solid fa-chart-pie"></i>

                <span>
                    Dashboard
                </span>
            </a>


            <!-- Owner Verifications -->
            <a
                class="nav-link${active("owner-verifications.html")}"
                href="owner-verifications.html"
            >
                <i class="fa-solid fa-user-check"></i>

                <span>
                    Owner Verifications
                </span>
            </a>


            <!-- Parking Lots -->
            <a
                class="nav-link${active("admin-parking-lots.html")}"
                href="admin-parking-lots.html"
            >
                <i class="fa-solid fa-square-parking"></i>

                <span>
                    Parking Lots
                </span>
            </a>


            <!-- Reports -->
            <a
                class="nav-link"
                href="#"
            >
                <i class="fa-solid fa-flag"></i>

                <span>
                    Reports
                </span>
            </a>

        </nav>


        <!-- Sidebar Footer -->
        <div class="sidebar-footer">

            <button
                class="nav-link logout"
                id="adminLogout"
                type="button"
            >

                <i class="fa-solid fa-arrow-right-from-bracket"></i>

                <span>
                    Logout
                </span>

            </button>

        </div>

    `;


    // ==========================================
    // PAGE TYPE
    // ==========================================

    const isQueue =
        page === "owner-verifications.html";

    const isDetail =
        page === "verification-detail.html";

    const isParkingLots =
        page === "admin-parking-lots.html";

    // ==========================================
    // HEADER
    // ==========================================

    header.className =
        "top-header shared-header";

    header.innerHTML = `

    <!-- PAGE TITLE -->
    <div class="page-title">

        <div class="admin-welcome-label">
            <i class="fa-solid fa-shield-halved"></i>
            ADMIN PANEL
        </div>

       <h1>
            ${
                isDetail
                    ? "Verification Review"
                    : isQueue
                        ? "Owner Verifications"
                        : isParkingLots
                            ? "Parking Lots"
                            : "Admin Dashboard"
            }
        </h1>

        <p>
            ${
                isDetail
                    ? "Review the owner and business documents before making a decision."
                    : isQueue
                        ? "Review documents and approve eligible parking owners."
                        : isParkingLots
                            ? "View and monitor all parking lots registered on ParkWise AI."
                            : "Monitor your ParkWise AI platform activity."
            }
        </p>
    </div>


    <!-- ADMIN PROFILE -->
    <div class="shared-profile">

        <!-- Notification -->
        <button
            class="notification-btn"
            type="button"
            aria-label="Notifications"
        >
            <i class="fa-regular fa-bell"></i>
            <span class="notification-dot"></span>
        </button>


        <!-- Divider -->
        <div class="profile-divider"></div>


        <!-- Admin User -->
        <div class="admin-profile">

            <!-- First Letter -->
            <span class="profile-avatar">
                ${adminInitial}
            </span>


            <!-- Name + Email -->
            <div class="admin-profile-info">

                <strong>
                    ${escapeHTML(adminName)}
                </strong>

                ${
                    adminEmail
                        ? `<span>${escapeHTML(adminEmail)}</span>`
                        : `<span>Administrator</span>`
                }

            </div>


            <i class="fa-solid fa-chevron-down admin-profile-arrow"></i>

        </div>

    </div>

`;


    // ==========================================
    // LOGOUT
    // ==========================================

    const logoutButton =
        document.getElementById("adminLogout");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                localStorage.removeItem("admin_name");
                localStorage.removeItem("admin_email");
                localStorage.removeItem("admin_logged_in");

                window.location.replace("landingpage.html");

            }
        );

    }


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

})();