(function () {
  const sidebar = document.querySelector('.sidebar');
  const header = document.querySelector('.top-header');
  if (!sidebar || !header) return;
  sidebar.classList.add('shared-sidebar');
  sidebar.innerHTML = `<a class="app-brand" href="landingpage.html"><span class="app-brand-icon"><i class="fa-solid fa-square-parking"></i></span><span>ParkWise <strong>AI</strong></span></a><nav class="nav-menu"><p class="nav-heading">OWNER PORTAL</p><a class="nav-link active" href="owner-dashboard.html"><i class="fa-solid fa-chart-line"></i><span>Owner Dashboard</span></a><a class="nav-link" href="#parking-lots"><i class="fa-solid fa-square-parking"></i><span>Parking Lots</span></a><a class="nav-link" href="#bookings"><i class="fa-solid fa-calendar-check"></i><span>Bookings</span></a><a class="nav-link" href="#analytics"><i class="fa-solid fa-chart-pie"></i><span>Analytics</span></a></nav><div class="sidebar-footer"><a class="nav-link" href="profile.html"><i class="fa-solid fa-user"></i><span>Profile</span></a><a class="nav-link logout" href="login.html"><i class="fa-solid fa-arrow-right-from-bracket"></i><span>Logout</span></a></div>`;
  header.className = 'top-header shared-header';
  header.innerHTML = `<div class="page-title"><button class="owner-mobile-menu" type="button" aria-label="Navigation"><i class="fa-solid fa-bars"></i></button><h1>Owner Dashboard</h1><p>Monitor parking performance and manage your lots.</p></div><div class="shared-profile"><button class="notification-btn" type="button" aria-label="Notifications"><i class="fa-regular fa-bell"></i></button><span class="profile-avatar">O</span><span class="profile-name">Owner</span></div>`;
}());
