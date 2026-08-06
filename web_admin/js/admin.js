/**
 * SBC Dean's Administrative Suite - Client Application Logic
 * Handles authentication, real-time KPI metrics, attendance logs, and site management.
 */



// Global API Base Configuration
const API_BASE = '../backend/';


// Cached Application State Variables
let currentUser = null;
let currentTab = 'overview';
let cachedStudents = [];
let cachedLogs = [];
let cachedAbsences = [];
let cachedSites = [];

// UI Initialization & Main Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  setupEventListeners();
});

function checkSession() {
  const savedUser = localStorage.getItem('sbc_admin_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showAppShell();
    loadTabContent('overview');
  } else {
    showAuthScreen();
  }
}

function setupEventListeners() {

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }


  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }


  const showRegisterBtn = document.getElementById('showRegisterBtn');
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('loginView').classList.add('hidden');
      document.getElementById('registerView').classList.remove('hidden');
    });
  }

  const showLoginBtn = document.getElementById('showLoginBtn');
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('registerView').classList.add('hidden');
      document.getElementById('loginView').classList.remove('hidden');
    });
  }


  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute('data-tab');
      if (targetTab) {
        switchTab(targetTab);
      }
    });
  });


  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
      filterActiveTable(e.target.value.trim().toLowerCase());
    });
  }
}

// Administrative Login Handler
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const loginError = document.getElementById('loginError');

  loginError.classList.add('hidden');

  try {
    const res = await fetch(API_BASE + 'admin_login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.status === 'success') {
      currentUser = data.user;
      localStorage.setItem('sbc_admin_user', JSON.stringify(currentUser));
      showAppShell();
      loadTabContent('overview');
    } else {
      loginError.textContent = data.message || 'Invalid credentials';
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Login error:', err);
    loginError.textContent = 'Server connection error. Please try again.';
    loginError.classList.remove('hidden');
  }
}

// Account Registration Handler
async function handleRegister(e) {
  e.preventDefault();
  const full_name = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const role = document.getElementById('regRole').value;
  const password = document.getElementById('regPassword').value.trim();
  const registerMsg = document.getElementById('registerMsg');

  registerMsg.classList.add('hidden');

  try {
    const res = await fetch(API_BASE + 'admin_register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, role, password })
    });
    const data = await res.json();

    if (data.status === 'success') {
      registerMsg.textContent = data.message;
      registerMsg.className = 'badge badge-success';
      registerMsg.classList.remove('hidden');

      document.getElementById('adminEmail').value = email;
      document.getElementById('adminPassword').value = password;
      setTimeout(() => {
        document.getElementById('registerView').classList.add('hidden');
        document.getElementById('loginView').classList.remove('hidden');
      }, 1500);
    } else {
      registerMsg.textContent = data.message || 'Registration failed.';
      registerMsg.className = 'badge badge-danger';
      registerMsg.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Registration error:', err);
    registerMsg.textContent = 'Server connection error. Please try again.';
    registerMsg.className = 'badge badge-danger';
    registerMsg.classList.remove('hidden');
  }
}

function logout() {
  if (confirm("Are you sure you want to sign out of the Dean's Administrative Suite?")) {
    localStorage.removeItem('sbc_admin_user');
    currentUser = null;
    const emailField = document.getElementById('adminEmail');
    const passField = document.getElementById('adminPassword');
    if (emailField) emailField.value = '';
    if (passField) passField.value = '';
    showAuthScreen();
  }
}

function showAuthScreen() {
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appShell').classList.add('hidden');
}

function showAppShell() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
  if (currentUser) {
    document.getElementById('adminNameDisplay').textContent = currentUser.full_name || 'Dean Admin';
  }
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.view-pane').forEach(pane => {
    pane.classList.add('hidden');
  });

  const activePane = document.getElementById(`view-${tabId}`);
  if (activePane) {
    activePane.classList.remove('hidden');
  }

  loadTabContent(tabId);
}

function loadTabContent(tabId) {
  switch (tabId) {
    case 'overview':
      fetchOverview();
      break;
    case 'students':
      fetchStudents();
      break;
    case 'logs':
      fetchLogs();
      break;
    case 'absences':
      fetchAbsences();
      break;
    case 'sites':
      fetchSites();
      break;
    case 'reports':
      fetchReports();
      break;
  }
}

function getDeanQueryParam() {
  if (currentUser && currentUser.role === 'Dean' && currentUser.user_id) {
    return '?dean_id=' + currentUser.user_id;
  }
  return '';
}


async function fetchOverview() {
  try {
    const res = await fetch(API_BASE + 'admin_get_overview.php' + getDeanQueryParam());
    const data = await res.json();
    if (data.status === 'success') {
      const kpis = data.kpis;
      document.getElementById('kpiActiveShifts').textContent = kpis.active_shifts_today || '0';
      document.getElementById('kpiTotalInterns').textContent = kpis.total_interns || '0';
      document.getElementById('kpiCompletionRate').textContent = `${kpis.completion_rate}%`;
      document.getElementById('kpiPendingAbsences').textContent = kpis.pending_absences || '0';
      document.getElementById('kpiTotalHours').textContent = `${kpis.total_rendered_hours} hrs`;

      renderLiveCaptures(data.recent_captures || []);
    }
  } catch (err) {
    console.error('Fetch overview error:', err);
  }
}

function renderLiveCaptures(captures) {
  const container = document.getElementById('liveCaptureFeed');
  if (!container) return;

  if (captures.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted);">
        No live verification photo captures recorded today yet.
      </div>`;
    return;
  }

  container.innerHTML = captures.map(c => `
    <div class="capture-card">
      <div class="capture-img-box">
        <img src="${c.full_url}" alt="${c.full_name}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';">
        <span class="capture-badge">${c.shift_type}</span>
      </div>
      <div class="capture-info">
        <h4>${escapeHtml(c.full_name)}</h4>
        <p>${c.student_number} &bull; ${c.course_code}</p>
        <p style="margin-top: 0.2rem; font-weight: 600; color: var(--navy-primary);">${c.captured_time} (${c.date})</p>
      </div>
    </div>
  `).join('');
}


// Student Tracking Data Loader
async function fetchStudents() {
  try {
    const res = await fetch(API_BASE + 'admin_get_students.php' + getDeanQueryParam());
    const data = await res.json();
    if (data.status === 'success') {
      cachedStudents = data.data || [];
      renderStudentsTable(cachedStudents);
    }
  } catch (err) {
    console.error('Fetch students error:', err);
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No student interns found.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const badgeClass = s.status === 'Completed' ? 'badge-success' : 'badge-warning';
    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--navy-primary);">${escapeHtml(s.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.student_number} &bull; ${s.id_no}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(s.course_code)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(s.course_name)}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--navy-primary);">${escapeHtml(s.dean_name || 'Unassigned')}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(s.dean_email || '')}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(s.site_name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.ojt_no} &bull; ${escapeHtml(s.site_location)}</div>
        </td>
        <td style="width: 180px;">
          <div class="progress-container">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${s.progress_percentage}%;"></div>
            </div>
            <div class="progress-text">${s.formatted_time} / ${s.required_hours}h (${s.progress_percentage}%)</div>
          </div>
        </td>
        <td><span class="badge ${badgeClass}">${s.status}</span></td>
        <td>
          <button class="btn btn-outline" onclick="openStudentDrawer(${s.student_id})">Details</button>
        </td>
      </tr>
    `;
  }).join('');
}


// Attendance Verification Logs Fetcher
async function fetchLogs() {
  try {
    const res = await fetch(API_BASE + 'admin_get_logs.php' + getDeanQueryParam());
    const data = await res.json();
    if (data.status === 'success') {
      cachedLogs = data.data || [];
      renderLogsTable(cachedLogs);
    }
  } catch (err) {
    console.error('Fetch logs error:', err);
  }
}

function renderLogsTable(logs) {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No attendance verification logs recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const hasPhotos = l.photos && l.photos.length > 0;
    const photoBtn = hasPhotos ? `
      <button class="btn btn-navy" onclick='openPhotoModal(${JSON.stringify(l.photos).replace(/'/g, "&apos;")})'>
        📷 View (${l.photos.length})
      </button>` : `<span style="color: var(--text-light); font-size: 0.8rem;">No Photo</span>`;

    return `
      <tr>
        <td style="font-weight: 700; color: var(--navy-primary);">${l.date}</td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(l.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${l.student_number} &bull; ${l.course_code}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(l.dean_name || 'Unassigned')}</div>
        </td>
        <td>${l.time_in_morning}</td>
        <td>${l.time_out_morning}</td>
        <td>${l.time_in_afternoon}</td>
        <td>${l.time_out_afternoon}</td>
        <td><span class="badge badge-success">${l.status}</span></td>
        <td>${photoBtn}</td>
      </tr>
    `;
  }).join('');
}


async function fetchAbsences() {
  try {
    const res = await fetch(API_BASE + 'admin_get_absences.php' + getDeanQueryParam());
    const data = await res.json();
    if (data.status === 'success') {
      cachedAbsences = data.data || [];
      renderAbsencesTable(cachedAbsences);
    }
  } catch (err) {
    console.error('Fetch absences error:', err);
  }
}

function renderAbsencesTable(absences) {
  const tbody = document.getElementById('absencesTableBody');
  if (!tbody) return;

  if (absences.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No absence requests submitted.</td></tr>`;
    return;
  }

  tbody.innerHTML = absences.map(a => {
    let badgeClass = 'badge-warning';
    if (a.status === 'Approved') badgeClass = 'badge-success';
    if (a.status === 'Rejected') badgeClass = 'badge-danger';

    const docLink = a.doc_url ? `<a href="${a.doc_url}" target="_blank" style="color: var(--navy-primary); font-weight: 600;">📄 View Document</a>` : '<span style="color: var(--text-light);">None</span>';
    const isPending = a.status === 'Pending';

    return `
      <tr>
        <td style="font-weight: 700; color: var(--navy-primary);">${a.date_absent}</td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(a.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${a.student_number} &bull; ${a.course_code}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(a.dean_name || 'Unassigned')}</div>
        </td>
        <td style="max-width: 250px;">${escapeHtml(a.reason)}</td>
        <td>${docLink}</td>
        <td><span class="badge ${badgeClass}">${a.status}</span></td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(a.remarks || '--')}</td>
        <td>
          ${isPending ? `
            <button class="btn btn-success" onclick="reviewAbsence(${a.absence_id}, 'Approved')">Approve</button>
            <button class="btn btn-danger" onclick="reviewAbsence(${a.absence_id}, 'Rejected')">Reject</button>
          ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">Evaluated</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

async function reviewAbsence(absenceId, status) {
  const remarks = prompt(`Enter administrative remarks for ${status} decision:`, status === 'Approved' ? 'Approved by Dean of Student Affairs' : 'Medical certificate / supporting document missing');
  if (remarks === null) return;

  try {
    const res = await fetch(API_BASE + 'admin_review_absence.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        absence_id: absenceId,
        status: status,
        remarks: remarks,
        reviewed_by: currentUser ? currentUser.user_id : 1
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message);
      fetchAbsences();
      fetchOverview();
    } else {
      alert(data.message || 'Operation failed');
    }
  } catch (err) {
    console.error('Review absence error:', err);
    alert('Server error processing request.');
  }
}


async function fetchSites() {
  try {
    const res = await fetch(API_BASE + 'admin_sites.php');
    const data = await res.json();
    if (data.status === 'success') {
      cachedSites = data.data || [];
      renderSitesTable(cachedSites);
    }
  } catch (err) {
    console.error('Fetch sites error:', err);
  }
}

function renderSitesTable(sites) {
  const tbody = document.getElementById('sitesTableBody');
  if (!tbody) return;

  if (sites.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No training partner facilities registered.</td></tr>`;
    return;
  }

  tbody.innerHTML = sites.map(st => `
    <tr>
      <td style="font-weight: 700; color: var(--navy-primary);">${st.site_code}</td>
      <td style="font-weight: 700;">${escapeHtml(st.site_name)}</td>
      <td>${escapeHtml(st.location)}</td>
      <td><span class="badge badge-success">${st.assigned_interns} Active Interns</span></td>
      <td>
        <button class="btn btn-outline" onclick='openEditSiteModal(${JSON.stringify(st).replace(/'/g, "&apos;")})'>Edit Partner</button>
      </td>
    </tr>
  `).join('');
}

function openAddSiteModal() {
  document.getElementById('siteModalTitle').textContent = 'Add Partner Training Facility';
  document.getElementById('siteIdInput').value = '';
  document.getElementById('siteCodeInput').value = '';
  document.getElementById('siteNameInput').value = '';
  document.getElementById('siteLocationInput').value = '';
  document.getElementById('siteModal').classList.add('active');
}

function openEditSiteModal(site) {
  document.getElementById('siteModalTitle').textContent = 'Edit Partner Training Facility';
  document.getElementById('siteIdInput').value = site.site_id;
  document.getElementById('siteCodeInput').value = site.site_code;
  document.getElementById('siteNameInput').value = site.site_name;
  document.getElementById('siteLocationInput').value = site.location;
  document.getElementById('siteModal').classList.add('active');
}

function closeSiteModal() {
  document.getElementById('siteModal').classList.remove('active');
}

async function savePartnerSite(e) {
  e.preventDefault();
  const site_id = document.getElementById('siteIdInput').value;
  const site_code = document.getElementById('siteCodeInput').value.trim();
  const site_name = document.getElementById('siteNameInput').value.trim();
  const location = document.getElementById('siteLocationInput').value.trim();

  try {
    const res = await fetch(API_BASE + 'admin_sites.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id, site_code, site_name, location })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message);
      closeSiteModal();
      fetchSites();
    } else {
      alert(data.message || 'Failed to save site.');
    }
  } catch (err) {
    console.error('Save site error:', err);
  }
}


async function fetchReports() {
  await fetchStudents();
  renderComplianceSummary();
}

function renderComplianceSummary() {
  const container = document.getElementById('reportsContainer');
  if (!container) return;

  const total = cachedStudents.length;
  const completed = cachedStudents.filter(s => s.status === 'Completed').length;
  const inProgress = cachedStudents.filter(s => s.status === 'In Progress').length;
  const totalHours = cachedStudents.reduce((acc, s) => acc + s.rendered_hours, 0);

  container.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Total Enrolled Interns</div>
        <div class="kpi-value-row">
          <div class="kpi-value">${total}</div>
          <span class="kpi-badge gold">100% Registered</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Completed (480 Hours)</div>
        <div class="kpi-value-row">
          <div class="kpi-value">${completed}</div>
          <span class="kpi-badge green">Fulfilled</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Active In-Progress</div>
        <div class="kpi-value-row">
          <div class="kpi-value">${inProgress}</div>
          <span class="kpi-badge gold">Tracking</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Cumulative Hours Rendered</div>
        <div class="kpi-value-row">
          <div class="kpi-value">${totalHours} hrs</div>
          <span class="kpi-badge green">Verified</span>
        </div>
      </div>
    </div>

    <div class="card mt-3">
      <div class="card-header">
        <h3>Institutional Compliance Summary Report</h3>
        <button class="btn btn-navy" onclick="exportCSVReport()">Export Institutional CSV Report</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Student #</th>
              <th>Course</th>
              <th>Partner Facility</th>
              <th>Hours Rendered</th>
              <th>Required Goal</th>
              <th>Compliance %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${cachedStudents.map(s => `
              <tr>
                <td style="font-weight:700;">${escapeHtml(s.full_name)}</td>
                <td>${s.student_number}</td>
                <td>${s.course_code}</td>
                <td>${escapeHtml(s.site_name)}</td>
                <td style="font-weight:700;">${s.rendered_hours}h ${s.rendered_minutes}m</td>
                <td>480h</td>
                <td>${s.progress_percentage}%</td>
                <td><span class="badge ${s.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${s.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function exportCSVReport() {
  if (cachedStudents.length === 0) return alert('No data to export.');
  let csv = 'Student Name,Student Number,Course,Partner Facility,Hours Rendered,Target Goal,Progress %,Status\n';
  cachedStudents.forEach(s => {
    csv += `"${s.full_name}","${s.student_number}","${s.course_code}","${s.site_name}","${s.rendered_hours}h ${s.rendered_minutes}m","480h","${s.progress_percentage}%","${s.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SBC_Internship_Compliance_Report_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}


// Facial Verification Photo Modal Viewer
function openPhotoModal(photos) {
  const container = document.getElementById('photoModalContent');
  if (!container) return;

  container.innerHTML = photos.map(p => `
    <div style="margin-bottom: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); overflow: hidden;">
      <div style="padding: 0.5rem 0.85rem; background-color: var(--bg-canvas); font-weight: 700; font-size: 0.8rem; color: var(--navy-primary);">
        Shift: ${p.shift_type} &bull; Captured at ${p.captured_at}
      </div>
      <img src="${p.full_url}" style="width: 100%; height: 260px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';">
    </div>
  `).join('');

  document.getElementById('photoModal').classList.add('active');
}

function closePhotoModal() {
  document.getElementById('photoModal').classList.remove('active');
}

function openStudentDrawer(studentId) {
  const s = cachedStudents.find(st => st.student_id === studentId);
  if (!s) return;
  alert(`Student Profile & Allocation Details:\nName: ${s.full_name}\nStudent ID: ${s.student_number}\nCourse: ${s.course_name}\nSite: ${s.site_name} (${s.site_location})\nHours Rendered: ${s.formatted_time} / 480 hrs\nCompletion Status: ${s.status}`);
}

function filterActiveTable(query) {
  if (!query) {
    if (currentTab === 'students') renderStudentsTable(cachedStudents);
    if (currentTab === 'logs') renderLogsTable(cachedLogs);
    if (currentTab === 'absences') renderAbsencesTable(cachedAbsences);
    if (currentTab === 'sites') renderSitesTable(cachedSites);
    return;
  }

  if (currentTab === 'students') {
    const filtered = cachedStudents.filter(s => s.full_name.toLowerCase().includes(query) || s.student_number.toLowerCase().includes(query) || s.course_code.toLowerCase().includes(query) || s.site_name.toLowerCase().includes(query));
    renderStudentsTable(filtered);
  } else if (currentTab === 'logs') {
    const filtered = cachedLogs.filter(l => l.full_name.toLowerCase().includes(query) || l.student_number.toLowerCase().includes(query) || l.date.toLowerCase().includes(query));
    renderLogsTable(filtered);
  } else if (currentTab === 'absences') {
    const filtered = cachedAbsences.filter(a => a.full_name.toLowerCase().includes(query) || a.student_number.toLowerCase().includes(query) || a.reason.toLowerCase().includes(query));
    renderAbsencesTable(filtered);
  } else if (currentTab === 'sites') {
    const filtered = cachedSites.filter(st => st.site_name.toLowerCase().includes(query) || st.site_code.toLowerCase().includes(query) || st.location.toLowerCase().includes(query));
    renderSitesTable(filtered);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
