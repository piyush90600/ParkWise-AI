/* =========================================================
   PARKWISE AI
   OWNER SHARED LAYOUT
   ========================================================= */

(function () {


    const sidebar =
        document.querySelector(".sidebar");

    const header =
        document.querySelector(".top-header");


    if (!sidebar || !header) {

        return;

    }


    /* ==========================================
       OWNER LOGIN CHECK
       ========================================== */

    const ownerName =
        localStorage.getItem(
            "user_name"
        );

    const ownerEmail =
        localStorage.getItem(
            "user_email"
        );

    const ownerRole =
        localStorage.getItem(
            "user_role"
        );


    /*
        Only Park Owner can access
        owner pages.
    */

    if (
        !ownerName ||
        ownerRole !== "park_owner"
    ) {

        window.location.replace(
            "owner_login.html"
        );

        return;

    }


    /* ==========================================
       CURRENT PAGE
       ========================================== */

    const page =
        window.location.pathname
            .split("/")
            .pop();


    const active =
        file =>
            page === file
                ? " active"
                : "";


    /* ==========================================
       OWNER SIDEBAR
       ========================================== */

    sidebar.classList.add(
        "shared-sidebar"
    );


    sidebar.innerHTML = `

        <a
            class="app-brand"
            href="owner-dashboard.html"
        >

            <span class="app-brand-icon">

                <i
                    class="fa-solid fa-square-parking"
                ></i>

            </span>

            <span>

                ParkWise
                <strong>AI</strong>

            </span>

        </a>


        <nav
            class="nav-menu"
            aria-label="Owner navigation"
        >

            <p class="nav-heading">
                OWNER PORTAL
            </p>


            <a
                class="nav-link${active(
                    "owner-dashboard.html"
                )}"
                href="owner-dashboard.html"
            >

                <i
                    class="fa-solid fa-chart-line"
                ></i>

                <span>
                    Owner Dashboard
                </span>

            </a>


            <a
                class="nav-link${active(
                    "owner-verification.html"
                )}"
                href="owner-verification.html"
            >

                <i
                    class="fa-solid fa-file-shield"
                ></i>

                <span>
                    Verification
                </span>

            </a>


            <a
                class="nav-link"
                href="owner-dashboard.html#parking-lots"
            >

                <i
                    class="fa-solid fa-square-parking"
                ></i>

                <span>
                    Parking Lots
                </span>

            </a>


            <a
                class="nav-link${active(
                    "owner-bookings.html"
                )}"
                href="owner-bookings.html"
            >

                <i
                    class="fa-solid fa-calendar-check"
                ></i>

                <span>
                    Bookings
                </span>

            </a>

        </nav>


        <div class="sidebar-footer">


            <a
                class="nav-link${active(
                    "owner-profile.html"
                )}"
                href="owner-profile.html"
            >

                <i
                    class="fa-solid fa-user"
                ></i>

                <span>
                    Owner Profile
                </span>

            </a>


            <a
                class="nav-link logout"
                href="landingpage.html"
                id="ownerLogout"
            >

                <i
                    class="fa-solid fa-arrow-right-from-bracket"
                ></i>

                <span>
                    Logout
                </span>

            </a>

        </div>

    `;


    /* ==========================================
       PAGE TITLE
       ========================================== */

    const titles = {

        "owner-dashboard.html": [
            "Owner Dashboard",
            "Monitor parking performance and manage your lots."
        ],

        "owner-verification.html": [
            "Owner Verification",
            "Submit your business information for admin review."
        ],

        "owner-bookings.html": [
            "Bookings",
            "Manage reservations across your parking locations."
        ],

        "owner-profile.html": [
            "Owner Profile",
            "Manage your ParkWise owner account details."
        ]

    };


    const currentTitle =
        titles[page] ||
        titles["owner-dashboard.html"];


    const title =
        currentTitle[0];

    const subtitle =
        currentTitle[1];


    /* ==========================================
       HEADER
       ========================================== */

    header.className =
        "top-header shared-header";


    const firstLetter =
        ownerName
            .trim()
            .charAt(0)
            .toUpperCase();


    header.innerHTML = `

        <div class="page-title">

            <button
                class="owner-mobile-menu"
                id="ownerMobileMenu"
                type="button"
                aria-label="Navigation"
            >

                <i
                    class="fa-solid fa-bars"
                ></i>

            </button>


            <div class="page-heading-content">

                <span class="page-eyebrow">
                    PARKWISE AI
                </span>

                <h1>
                    ${title}
                </h1>

                <p>
                    ${subtitle}
                </p>

            </div>

        </div>


        <div class="shared-profile">


            <button
                class="notification-btn"
                type="button"
                aria-label="Notifications"
            >

                <i
                    class="fa-regular fa-bell"
                ></i>

                <span class="notification-dot"></span>

            </button>


            <span class="profile-divider"></span>


            <div
                class="profile-user"
                title="${escapeHTML(ownerEmail || "")}"
            >

                <span
                    class="profile-avatar"
                    id="ownerHeaderAvatar"
                >
                    ${escapeHTML(firstLetter)}
                </span>


                <div class="profile-details">

                    <span
                        class="profile-name"
                        id="ownerHeaderName"
                    >
                        ${escapeHTML(ownerName)}
                    </span>

                    <span class="profile-role">
                        Parking Owner
                    </span>

                </div>


                <i
                    class="fa-solid fa-chevron-down profile-arrow"
                ></i>

            </div>

        </div>

    `;


    /* ==========================================
       LOGOUT
       ========================================== */

    const logout =
        document.getElementById(
            "ownerLogout"
        );


    if (logout) {

        logout.addEventListener(
            "click",
            function () {

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

            }
        );

    }


    /* ==========================================
       MOBILE MENU
       ========================================== */

    const mobileMenu =
        document.getElementById(
            "ownerMobileMenu"
        );


    if (mobileMenu) {

        mobileMenu.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "mobile-open"
                );

            }
        );

    }


    /* ==========================================
       PROFILE CLICK
       ========================================== */

    const profileUser =
        document.querySelector(
            ".profile-user"
        );


    if (profileUser) {

        profileUser.addEventListener(
            "click",
            function () {

                window.location.href =
                    "owner-profile.html";

            }
        );

    }


    /* ==========================================
       ESCAPE HTML
       ========================================== */

    function escapeHTML(
        value
    ) {

        return String(value || "")
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


}());