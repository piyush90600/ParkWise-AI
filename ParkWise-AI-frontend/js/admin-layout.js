(function () {
  const sidebar = document.querySelector('.sidebar');
  const header = document.querySelector('.top-header');
  if (!sidebar || !header) return;
  const page = location.pathname.split('/').pop();
  const active = file => page === file ? ' active' : '';
  sidebar.classList.add('shared-sidebar');
  sidebar.innerHTML = `<a class="app-brand" href="landingpage.html"><span class="app-brand-icon"><i class="fa-solid fa-shield-halved"></i></span><span>ParkWise <strong>Admin</strong></span></a><nav class="nav-menu"><p class="nav-heading">ADMIN PORTAL</p><a class="nav-link${active('admin-dashboard.html')}" href="admin-dashboard.html"><i class="fa-solid fa-chart-pie"></i><span>Dashboard</span></a><a class="nav-link${active('owner-verifications.html')}" href="owner-verifications.html"><i class="fa-solid fa-user-check"></i><span>Owner Verifications</span></a><a class="nav-link" href="#"><i class="fa-solid fa-square-parking"></i><span>Parking Lots</span></a><a class="nav-link" href="#"><i class="fa-solid fa-flag"></i><span>Reports</span></a></nav><div class="sidebar-footer"><a class="nav-link logout" href="login.html"><i class="fa-solid fa-arrow-right-from-bracket"></i><span>Logout</span></a></div>`;
  const isQueue = page === 'owner-verifications.html';
  header.className = 'top-header shared-header';
  header.innerHTML = `<div class="page-title"><h1>${isQueue ? 'Owner Verifications' : 'Admin Dashboard'}</h1><p>${isQueue ? 'Review documents and approve eligible parking owners.' : 'Review owner applications and monitor platform activity.'}</p></div><div class="shared-profile"><button class="notification-btn" type="button" aria-label="Notifications"><i class="fa-regular fa-bell"></i></button><span class="profile-avatar">A</span><span class="profile-name">Admin</span></div>`;
}());
