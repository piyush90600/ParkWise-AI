(function () {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const page = window.location.pathname.split('/').pop() || 'user-dashboard.html';
  const items = [
    ['user-dashboard.html', 'fa-chart-pie', 'Dashboard'],
    ['find-parking.html', 'fa-location-dot', 'Find Parking'],
    ['predictive-heatmap.html', 'fa-fire', 'Predictive Heatmap'],
    ['ai-recommendations.html', 'fa-robot', 'AI Recommendations'],
    ['parking-history.html', 'fa-clock-rotate-left', 'Parking History']
  ];
  const navigation = items.map(([href, icon, label]) => `
    <a href="${href}" class="nav-link${page === href ? ' active' : ''}">
      <i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span>
    </a>`).join('');

  sidebar.classList.add('shared-sidebar');
  sidebar.innerHTML = `
    <a class="app-brand" href="landingpage.html" aria-label="ParkWise AI home">
      <span class="app-brand-icon"><i class="fa-solid fa-square-parking" aria-hidden="true"></i></span>
      <span>ParkWise <strong>AI</strong></span>
    </a>
    <nav class="nav-menu" aria-label="Main navigation">
      <p class="nav-heading">MAIN MENU</p>${navigation}
    </nav>
    <div class="sidebar-footer">
      <a href="saved-locations.html" class="nav-link${page === 'saved-locations.html' ? ' active' : ''}"><i class="fa-solid fa-bookmark" aria-hidden="true"></i><span>Saved Locations</span></a>
      <a href="profile.html" class="nav-link${page === 'profile.html' ? ' active' : ''}"><i class="fa-solid fa-user" aria-hidden="true"></i><span>Profile</span></a>
      <a href="settings.html" class="nav-link${page === 'settings.html' ? ' active' : ''}"><i class="fa-solid fa-gear" aria-hidden="true"></i><span>Settings</span></a>
      <a href="login.html" class="nav-link logout"><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i><span>Logout</span></a>
    </div>`;

  const titles = {
    'user-dashboard.html': ['Dashboard', 'Your parking overview and live availability'],
    'find-parking.html': ['Find Parking', 'Find the best parking spot near your destination'],
    'predictive-heatmap.html': ['Predictive Heatmap', 'Explore parking demand and predicted availability'],
    'ai-recommendations.html': ['AI Recommendations', 'Ranked matches based on price, distance, and availability'],
    'parking-history.html': ['Parking History', 'Review your past parking sessions and charges'],
    'saved-locations.html': ['Saved Locations', 'Your favourite destinations for faster parking searches'],
    'profile.html': ['Profile', 'Manage your ParkWise account details'],
    'settings.html': ['Settings', 'Control your parking preferences and notifications']
  };
  const header = document.querySelector('.top-header, .dashboard-topbar');
  const [title, subtitle] = titles[page] || titles['user-dashboard.html'];
  if (header) {
    header.className = 'top-header shared-header';
    header.innerHTML = `
      <div class="page-title"><button class="mobile-menu" id="mobileMenu" type="button" aria-label="Open navigation"><i class="fa-solid fa-bars" aria-hidden="true"></i></button><h1>${title}</h1><p>${subtitle}</p></div>
      <div class="shared-profile">
        <button class="notification-btn" type="button" aria-label="Notifications"><i class="fa-regular fa-bell" aria-hidden="true"></i></button>
        <span class="profile-avatar">K</span><span class="profile-name">Kalyani</span>
      </div>`;
  }
}());
