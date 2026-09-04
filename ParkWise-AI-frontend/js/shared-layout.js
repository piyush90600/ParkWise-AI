(function () {
    const sidebar = document.querySelector('.sidebar');

    if (!sidebar) return;

    // Get current page
    const page =
        window.location.pathname.split('/').pop() || 'user-dashboard.html';

    // Sidebar navigation items
    const items = [
        ['user-dashboard.html', 'fa-chart-pie', 'Dashboard'],
        ['find-parking.html', 'fa-location-dot', 'Find Parking'],
        ['predictive-heatmap.html', 'fa-fire', 'Predictive Heatmap'],
        ['ai-recommendations.html', 'fa-robot', 'AI Recommendations'],
        ['parking-history.html', 'fa-clock-rotate-left', 'Parking History']
    ];

    // Generate main navigation
    const navigation = items
        .map(
            ([href, icon, label]) => `
                <a href="${href}" class="nav-link${page === href ? ' active' : ''}">
                    <i class="fa-solid ${icon}" aria-hidden="true"></i>
                    <span>${label}</span>
                </a>
            `
        )
        .join('');

    // Add shared sidebar class
    sidebar.classList.add('shared-sidebar');

    // Sidebar HTML
    sidebar.innerHTML = `
        <a
            class="app-brand"
            href="landingpage.html"
            aria-label="ParkWise AI home"
        >
            <span class="app-brand-icon">
                <i class="fa-solid fa-square-parking" aria-hidden="true"></i>
            </span>

            <span>
                ParkWise <strong>AI</strong>
            </span>
        </a>

        <nav class="nav-menu" aria-label="Main navigation">
            <p class="nav-heading">MAIN MENU</p>

            ${navigation}
        </nav>

        <div class="sidebar-footer">

            <a
                href="user-profile.html"
                class="nav-link${page === 'user-profile.html' ? ' active' : ''}"
            >
                <i class="fa-solid fa-user" aria-hidden="true"></i>
                <span>Profile</span>
            </a>

            <a
                href="settings.html"
                class="nav-link${page === 'settings.html' ? ' active' : ''}"
            >
                <i class="fa-solid fa-gear" aria-hidden="true"></i>
                <span>Settings</span>
            </a>

            <a
                href="landingpage.html"
                class="nav-link logout"
                onclick="localStorage.clear()"
            >
                <i
                    class="fa-solid fa-arrow-right-from-bracket"
                    aria-hidden="true"
                ></i>

                <span>Logout</span>
            </a>

        </div>
    `;

    // Page titles and subtitles
    const titles = {
        'user-dashboard.html': [
            'Dashboard',
            'Your parking overview and live availability'
        ],

        'find-parking.html': [
            'Find Parking',
            'Find the best parking spot near your destination'
        ],

        'predictive-heatmap.html': [
            'Predictive Heatmap',
            'Explore parking demand and predicted availability'
        ],

        'ai-recommendations.html': [
            'AI Recommendations',
            'Ranked matches based on price, distance, and availability'
        ],

        'parking-history.html': [
            'Parking History',
            'Review your past parking sessions and charges'
        ],

        'user-profile.html': [
            'Profile',
            'Manage your ParkWise account details'
        ],

        'settings.html': [
            'Settings',
            'Control your parking preferences and notifications'
        ]
    };

    // Get header
    const header = document.querySelector(
        '.top-header, .dashboard-topbar'
    );

    // Get title and subtitle
    const [title, subtitle] =
        titles[page] || titles['user-dashboard.html'];

    // Create shared header
    if (header) {

        header.className = 'top-header shared-header';

        header.innerHTML = `
            <div class="page-title">

                <button
                    class="mobile-menu"
                    id="mobileMenu"
                    type="button"
                    aria-label="Open navigation"
                >
                    <i
                        class="fa-solid fa-bars"
                        aria-hidden="true"
                    ></i>
                </button>

                <div class="page-heading-content">
                    <span class="page-eyebrow">
                        PARKWISE AI
                    </span>

                    <h1>${title}</h1>

                    <p>${subtitle}</p>
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
                        aria-hidden="true"
                    ></i>

                    <span class="notification-dot"></span>
                </button>

                <div class="profile-divider"></div>

                <div class="profile-user">

                    <span
                        class="profile-avatar"
                        id="profileAvatar"
                    >
                        U
                    </span>

                    <div class="profile-details">

                        <span
                            class="profile-name"
                            id="profileName"
                        >
                            User
                        </span>

                        <span class="profile-role">
                            Parking User
                        </span>

                    </div>

                    <i
                        class="fa-solid fa-chevron-down profile-arrow"
                    ></i>

                </div>

            </div>
        `;

        // ==========================================
        // GET LOGGED-IN USER NAME
        // ==========================================

        const savedUserName =
            localStorage.getItem("user_name") || "User";

        const profileName =
            document.getElementById("profileName");

        const profileAvatar =
            document.getElementById("profileAvatar");


        // ==========================================
        // SHOW USER NAME
        // ==========================================

        if (profileName) {

            profileName.textContent =
                savedUserName;

        }


        // ==========================================
        // SHOW FIRST LETTER
        // ==========================================

        if (profileAvatar) {

            profileAvatar.textContent =
                savedUserName
                    .trim()
                    .charAt(0)
                    .toUpperCase();

        }
    }
}());


// ==========================================
// LOAD LOGGED-IN USER PROFILE
// ==========================================

const savedUserName =
    localStorage.getItem("user_name") || "User";

const profileName =
    document.getElementById("profileName");

const profileAvatar =
    document.getElementById("profileAvatar");

if (profileName) {
    profileName.textContent = savedUserName;
}

if (profileAvatar) {
    profileAvatar.textContent =
        savedUserName.charAt(0).toUpperCase();
}