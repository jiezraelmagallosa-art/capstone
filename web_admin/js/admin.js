/**
 * SBC Dean's Administrative Suite - Client Application Logic
 * Handles authentication, real-time KPI metrics, attendance logs, and site management.
 */



// Global API Base Configuration
const API_BASE = '../backend/';


// Cached Application State Variables
let currentUser = null;
let currentTab = 'overview';
let currentCourseFilter = 'ALL';
let currentLogsCourseFilter = 'ALL';
let selectedReportCourse = 'ALL';
let cachedStudents = [];
let cachedLogs = [];
let cachedAbsences = [];
let cachedSites = [];
let cachedCourses = [];

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
  fetchLogs();
  fetchAbsences();
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
    case 'courses':
      fetchCourses();
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
    await fetchCourses(false);
    const res = await fetch(API_BASE + 'admin_get_students.php' + getDeanQueryParam());
    const data = await res.json();
    if (data.status === 'success') {
      cachedStudents = data.data || [];
      updateCourseCounts(data.course_counts || {});
      filterByCourse(currentCourseFilter, false);
    }
  } catch (err) {
    console.error('Fetch students error:', err);
  }
}

function updateCourseCounts(counts) {
  populateDynamicCourseDropdowns();
}

function filterByCourse(courseCode, updateSelect = true) {
  currentCourseFilter = courseCode || 'ALL';

  const selectEl = document.getElementById('courseSelectFilter');
  if (selectEl && updateSelect) {
    selectEl.value = currentCourseFilter;
  }

  let filtered = cachedStudents;
  if (currentCourseFilter !== 'ALL') {
    filtered = cachedStudents.filter(s => (s.course_code || '').toUpperCase() === currentCourseFilter.toUpperCase());
  }

  renderStudentsTable(filtered);
}

function getCourseBadgeClass(courseCode) {
  const code = (courseCode || '').toUpperCase();
  if (code === 'BSCS') return 'badge-bscs';
  if (code === 'BSIS') return 'badge-bsis';
  if (code === 'BLIS') return 'badge-blis';
  return 'badge-navy';
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No student interns enrolled in this course category.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const statusBadgeClass = s.status === 'Completed' ? 'badge-success' : 'badge-warning';
    const courseBadge = getCourseBadgeClass(s.course_code);
    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--navy-primary);">${escapeHtml(s.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.student_number} &bull; ${s.id_no}</div>
        </td>
        <td>
          <div><span class="badge ${courseBadge}">${escapeHtml(s.course_code)}</span></div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">${escapeHtml(s.course_name)}</div>
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
        <td><span class="badge ${statusBadgeClass}">${s.progress_percentage >= 100 || s.status === 'Completed' ? '🏆 Completed 🎉' : s.status}</span></td>

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
      updateLogsCourseCounts(data.course_counts || {});
      filterLogsByCourse(currentLogsCourseFilter, false);
      updateNotifications();
    }
  } catch (err) {
    console.error('Fetch logs error:', err);
  }
}

function updateLogsCourseCounts(counts) {
  populateDynamicCourseDropdowns();
}

function filterLogsByCourse(courseCode, updateSelect = true) {
  currentLogsCourseFilter = courseCode || 'ALL';

  const selectEl = document.getElementById('logsCourseSelectFilter');
  if (selectEl && updateSelect) {
    selectEl.value = currentLogsCourseFilter;
  }

  let filtered = cachedLogs;
  if (currentLogsCourseFilter !== 'ALL') {
    filtered = cachedLogs.filter(l => (l.course_code || '').toUpperCase() === currentLogsCourseFilter.toUpperCase());
  }

  renderLogsTable(filtered);
}

function renderLogsTable(logs) {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">No attendance verification logs recorded for this course category.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const hasPhotos = l.photos && l.photos.length > 0;
    const photoBtn = hasPhotos ? `
      <button class="btn btn-navy" onclick='openPhotoModal(${JSON.stringify(l.photos).replace(/'/g, "&apos;")}, ${l.attendance_id})'>
        📷 View (${l.photos.length})
      </button>` : `<span style="color: var(--text-light); font-size: 0.8rem;">No Photo</span>`;
    const courseBadge = getCourseBadgeClass(l.course_code);

    // Match absence request badge pattern exactly
    let badgeClass = 'badge-warning';
    if (l.status === 'Confirmed') badgeClass = 'badge-success';
    if (l.status === 'Rejected') badgeClass = 'badge-danger';

    const isPending = l.status !== 'Confirmed' && l.status !== 'Rejected';
    const evalControls = isPending
      ? `<div style="display: flex; flex-direction: column; gap: 0.4rem; min-width: 90px;">
           <button class="btn-action btn-action-confirm" onclick="reviewAttendanceLog(${l.attendance_id}, 'Confirmed')">Confirm</button>
           <button class="btn-action btn-action-reject"  onclick="reviewAttendanceLog(${l.attendance_id}, 'Rejected')">Reject</button>
         </div>`
      : `<span style="font-size: 0.8rem; color: var(--text-muted);">Evaluated</span>`;

    return `
      <tr>
        <td style="font-weight: 700; color: var(--navy-primary);">${l.date}</td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(l.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">${l.student_number} &bull; <span class="badge ${courseBadge}">${l.course_code}</span></div>
        </td>
        <td>${l.time_in_morning}</td>
        <td>${l.time_out_morning}</td>
        <td>${l.time_in_afternoon}</td>
        <td>${l.time_out_afternoon}</td>
        <td><span class="badge ${badgeClass}">${l.status}</span></td>
        <td>${photoBtn}</td>
        <td>${evalControls}</td>
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
      updateNotifications();
    }
  } catch (err) {
    console.error('Fetch absences error:', err);
  }
}

function renderAbsencesTable(absences) {
  const tbody = document.getElementById('absencesTableBody');
  if (!tbody) return;

  if (absences.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No absence requests submitted.</td></tr>`;
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
        <button class="btn btn-danger" style="margin-left: 0.35rem; padding: 0.4rem 0.75rem; font-size: 0.8rem;" onclick="deletePartnerSite(${st.site_id}, '${escapeHtml(st.site_name).replace(/'/g, "\\'")}', ${st.assigned_interns})">Delete</button>
      </td>
    </tr>
  `).join('');
}

let activeEditingSite = null;

function openAddSiteModal() {
  activeEditingSite = null;
  document.getElementById('siteModalTitle').textContent = 'Add Partner Training Facility';
  document.getElementById('siteIdInput').value = '';
  document.getElementById('siteCodeInput').value = '';
  document.getElementById('siteNameInput').value = '';
  document.getElementById('siteLocationInput').value = '';
  const delBtn = document.getElementById('deleteSiteModalBtn');
  if (delBtn) delBtn.style.display = 'none';
  document.getElementById('siteModal').classList.add('active');
}

function openEditSiteModal(site) {
  activeEditingSite = site;
  document.getElementById('siteModalTitle').textContent = 'Edit Partner Training Facility';
  document.getElementById('siteIdInput').value = site.site_id;
  document.getElementById('siteCodeInput').value = site.site_code;
  document.getElementById('siteNameInput').value = site.site_name;
  document.getElementById('siteLocationInput').value = site.location;
  const delBtn = document.getElementById('deleteSiteModalBtn');
  if (delBtn) delBtn.style.display = 'inline-block';
  document.getElementById('siteModal').classList.add('active');
}

function closeSiteModal() {
  document.getElementById('siteModal').classList.remove('active');
}

async function handleModalDeleteSite() {
  if (!activeEditingSite) return;
  closeSiteModal();
  await deletePartnerSite(activeEditingSite.site_id, activeEditingSite.site_name, activeEditingSite.assigned_interns);
}

async function deletePartnerSite(siteId, siteName, assignedInterns) {
  if (assignedInterns > 0) {
    alert(`Cannot delete '${siteName}' because it currently has ${assignedInterns} active assigned intern(s). Please reassign those interns to another facility first.`);
    return;
  }

  if (!confirm(`Are you sure you want to permanently remove '${siteName}' from partner facilities?`)) {
    return;
  }

  try {
    const res = await fetch(API_BASE + 'admin_sites.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', site_id: siteId })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message);
      fetchSites();
    } else {
      alert(data.message || 'Failed to delete partner facility.');
    }
  } catch (err) {
    console.error('Delete site error:', err);
  }
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

function filterReportByCourse(courseCode) {
  selectedReportCourse = courseCode || 'ALL';
  renderComplianceSummary();
}

function getReportStudents() {
  if (selectedReportCourse === 'ALL') {
    return cachedStudents;
  }
  return cachedStudents.filter(s => (s.course_code || '').toUpperCase() === selectedReportCourse.toUpperCase());
}

function renderComplianceSummary() {
  const container = document.getElementById('reportsContainer');
  if (!container) return;

  const targetStudents = getReportStudents();
  const total = targetStudents.length;
  const completed = targetStudents.filter(s => s.status === 'Completed').length;
  const inProgress = targetStudents.filter(s => s.status === 'In Progress').length;
  const totalHours = targetStudents.reduce((acc, s) => acc + s.rendered_hours, 0);

  container.innerHTML = `
    <!-- Course Filter & Action Controls Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; background: #ffffff; padding: 1rem 1.25rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <label for="reportCourseFilterSelect" style="font-size: 0.88rem; font-weight: 700; color: var(--navy-primary); display: flex; align-items: center; gap: 0.4rem;">
          <span>🎓</span> Select Program / Course for Report:
        </label>
        <select id="reportCourseFilterSelect" class="form-control course-select-dropdown" style="max-width: 340px;" onchange="filterReportByCourse(this.value)">
          <option value="ALL" ${selectedReportCourse === 'ALL' ? 'selected' : ''}>All Academic Programs</option>
          <option value="BSCS" ${selectedReportCourse === 'BSCS' ? 'selected' : ''}>BSCS - Bachelor of Science in Computer Science</option>
          <option value="BSIS" ${selectedReportCourse === 'BSIS' ? 'selected' : ''}>BSIS - Bachelor of Science in Information Systems</option>
          <option value="BLIS" ${selectedReportCourse === 'BLIS' ? 'selected' : ''}>BLIS - Bachelor of Library & Info Science</option>
        </select>
      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button class="btn btn-navy" onclick="generatePDFReport()" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1.25rem;">
          <span>📄</span> Generate PDF Report
        </button>
        <button class="btn btn-outline" onclick="exportCSVReport()" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem;">
          <span>📊</span> Export CSV
        </button>
      </div>
    </div>

    <!-- Executive KPI Grid -->
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="kpi-card">
        <div class="kpi-title">Selected Program Interns</div>
        <div class="kpi-value-row">
          <div class="kpi-value">${total}</div>
          <span class="kpi-badge gold">${selectedReportCourse === 'ALL' ? 'All Programs' : selectedReportCourse}</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Completed (Goal Hours)</div>
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
    </div>

    <!-- Report Table Card -->
    <div class="card mt-3">
      <div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">
        <h3>Institutional Compliance Summary Report ${selectedReportCourse !== 'ALL' ? `(${selectedReportCourse})` : ''}</h3>
        <span class="badge badge-navy" style="font-size: 0.8rem;">${total} Student Record(s)</span>
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
            ${targetStudents.length === 0 ? `
              <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No student interns enrolled in this course category.</td></tr>
            ` : targetStudents.map(s => {
    const courseBadge = getCourseBadgeClass(s.course_code);
    return `
                <tr>
                  <td style="font-weight:700;">${escapeHtml(s.full_name)}</td>
                  <td>${s.student_number}</td>
                  <td><span class="badge ${courseBadge}">${s.course_code}</span></td>
                  <td>${escapeHtml(s.site_name)}</td>
                  <td style="font-weight:700;">${s.rendered_hours}h ${s.rendered_minutes}m</td>
                  <td>${s.required_hours}h</td>
                  <td>${s.progress_percentage}%</td>
                  <td><span class="badge ${s.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${s.status}</span></td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function generatePDFReport() {
  const targetStudents = getReportStudents();
  if (targetStudents.length === 0) return alert('No student records found to generate PDF report.');

  const total = targetStudents.length;
  const completed = targetStudents.filter(s => s.status === 'Completed').length;
  const inProgress = targetStudents.filter(s => s.status === 'In Progress').length;
  const totalHours = targetStudents.reduce((acc, s) => acc + s.rendered_hours, 0);

  let programTitle = 'All Academic Programs (BSCS, BSIS, BLIS)';
  if (selectedReportCourse === 'BSCS') programTitle = 'BSCS - Bachelor of Science in Computer Science';
  if (selectedReportCourse === 'BSIS') programTitle = 'BSIS - Bachelor of Science in Information Systems';
  if (selectedReportCourse === 'BLIS') programTitle = 'BLIS - Bachelor of Library & Information Science';

  const deanName = currentUser ? currentUser.full_name : 'Dean Admin';
  const deanEmail = currentUser ? currentUser.email : 'dean@sbc.edu.ph';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>SBC OJT Compliance Report - ${selectedReportCourse}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 12px; }
        .header-box { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #002d56; padding-bottom: 15px; margin-bottom: 20px; }
        .header-left { display: flex; align-items: center; gap: 15px; }
        .header-logo { width: 65px; height: 65px; border-radius: 50%; }
        .header-title h1 { font-size: 18px; font-weight: 800; color: #002d56; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .header-title h2 { font-size: 12px; font-weight: 600; color: #475569; margin: 3px 0 0 0; }
        .header-title h3 { font-size: 13px; font-weight: 700; color: #d97706; margin: 4px 0 0 0; text-transform: uppercase; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 6px; margin-bottom: 20px; }
        .meta-item { font-size: 11px; }
        .meta-item strong { color: #002d56; }
        .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .kpi-box { background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; }
        .kpi-box-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .kpi-box-value { font-size: 16px; font-weight: 800; color: #002d56; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
        th { background-color: #002d56; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 700; text-transform: uppercase; font-size: 10px; }
        td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; color: #334155; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; }
        .badge-success { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .badge-warning { background-color: #fef3c7; color: #b45309; border: 1px solid #fde047; }
        .sig-container { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-box { width: 42%; text-align: center; }
        .sig-line { border-bottom: 1.5px solid #002d56; height: 40px; margin-bottom: 6px; }
        .sig-name { font-weight: 700; font-size: 12px; color: #002d56; margin: 0; }
        .sig-title { font-size: 10px; color: #64748b; margin: 2px 0 0 0; }
        .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header-box">
        <div class="header-left">
          <img src="assets/images/sbc_logo.png" class="header-logo" alt="SBC Logo" onerror="this.style.display='none';">
          <div class="header-title">
            <h1>Southern Baptist College</h1>
            <h2>Office of Student Affairs & Internship Coordination</h2>
            <h3>Institutional OJT Compliance & Attendance Report</h3>
          </div>
        </div>
        <div style="text-align: right; font-size: 10px; color: #64748b;">
          <strong>Date Generated:</strong><br>${dateStr}
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><strong>Target Program Scope:</strong> ${escapeHtml(programTitle)}</div>
        <div class="meta-item"><strong>Issued By:</strong> ${escapeHtml(deanName)} (${escapeHtml(deanEmail)})</div>
        <div class="meta-item"><strong>Required Target Goal:</strong> Per-course defined hours</div>
        <div class="meta-item"><strong>Report Type:</strong> Official Institutional Verification Summary</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-box-title">Total Interns</div>
          <div class="kpi-box-value">${total}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-box-title">Completed (Goal Hrs)</div>
          <div class="kpi-box-value">${completed}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-box-title">In-Progress</div>
          <div class="kpi-box-value">${inProgress}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Student #</th>
            <th>Course</th>
            <th>Partner Facility Placement</th>
            <th>Hours Rendered</th>
            <th>Target Goal</th>
            <th>Progress %</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${targetStudents.map(s => `
            <tr>
              <td style="font-weight: 700;">${escapeHtml(s.full_name)}</td>
              <td>${s.student_number}</td>
              <td style="font-weight: 700; color: #002d56;">${s.course_code}</td>
              <td>${escapeHtml(s.site_name)}</td>
              <td style="font-weight: 700;">${s.rendered_hours}h ${s.rendered_minutes}m</td>
              <td>${s.required_hours}h</td>
              <td>${s.progress_percentage}%</td>
              <td><span class="badge ${s.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${s.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="sig-container">
        <div class="sig-box">
          <div class="sig-line"></div>
          <p class="sig-name">${escapeHtml(deanName)}</p>
          <p class="sig-title">Dean of Student Affairs / Department Head</p>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <p class="sig-name">Institutional OJT Placement Coordinator</p>
          <p class="sig-title">Office of Industrial Placement & Verification</p>
        </div>
      </div>

      <div class="footer">
        &copy; ${new Date().getFullYear()} Southern Baptist College &bull; Official Computer Generated OJT Compliance Document
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=900,height=750');
  if (printWin) {
    printWin.document.write(printHtml);
    printWin.document.close();
  } else {
    alert('Please allow popups for this site to generate the PDF report.');
  }
}

function exportCSVReport() {
  const targetStudents = getReportStudents();
  if (targetStudents.length === 0) return alert('No data to export.');
  let csv = 'Student Name,Student Number,Course,Partner Facility,Hours Rendered,Target Goal,Progress %,Status\n';
  targetStudents.forEach(s => {
    csv += `"${s.full_name}","${s.student_number}","${s.course_code}","${s.site_name}","${s.rendered_hours}h ${s.rendered_minutes}m","${s.required_hours}h","${s.progress_percentage}%","${s.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SBC_Compliance_Report_${selectedReportCourse}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}


// Facial Verification Photo Modal Viewer
function openPhotoModal(photos, attendanceId = null) {
  const container = document.getElementById('photoModalContent');
  const confirmContainer = document.getElementById('photoModalConfirmContainer');
  if (!container) return;

  if (!photos || photos.length === 0) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No facial verification photos recorded for this log.</div>`;
  } else {
    container.innerHTML = photos.map(p => `
      <div style="margin-bottom: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); overflow: hidden;">
        <div style="padding: 0.5rem 0.85rem; background-color: var(--bg-canvas); font-weight: 700; font-size: 0.8rem; color: var(--navy-primary);">
          Shift: ${p.shift_type} &bull; Captured at ${p.captured_at}
        </div>
        <img src="${p.full_url}" style="width: 100%; height: 260px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';">
      </div>
    `).join('');
  }

  if (confirmContainer) {
    if (attendanceId && photos && photos.length > 0) {
      confirmContainer.innerHTML = `
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-success" onclick="reviewAttendanceLog(${attendanceId}, 'Confirmed'); closePhotoModal();">
            \u2713 Confirm Log
          </button>
          <button class="btn btn-danger" onclick="reviewAttendanceLog(${attendanceId}, 'Rejected'); closePhotoModal();">
            \u2715 Reject Log
          </button>
        </div>`;
    } else {
      confirmContainer.innerHTML = '';
    }
  }

  document.getElementById('photoModal').classList.add('active');
}

function closePhotoModal() {
  document.getElementById('photoModal').classList.remove('active');
}

async function reviewAttendanceLog(attendanceId, action) {
  const defaultRemark = action === 'Confirmed'
    ? 'Attendance log confirmed by Dean of Student Affairs'
    : 'Attendance log requires follow-up verification';
  const remarks = prompt(`Enter administrative remarks for ${action} decision:`, defaultRemark);
  if (remarks === null) return;

  try {
    const res = await fetch(API_BASE + 'admin_confirm_attendance.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attendance_id: attendanceId,
        dean_id: currentUser ? currentUser.user_id : 0,
        action: action,
        remarks: remarks
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message);
      fetchLogs();
      fetchOverview();
    } else {
      alert(data.message || 'Operation failed.');
    }
  } catch (err) {
    console.error('Review attendance log error:', err);
    alert('Server error processing request.');
  }
}

function openStudentDrawer(studentId) {
  const s = cachedStudents.find(st => st.student_id === studentId);
  if (!s) return;

  const container = document.getElementById('studentDetailsContent');
  if (!container) return;

  const courseBadge = getCourseBadgeClass(s.course_code);
  const statusBadgeClass = s.status === 'Completed' ? 'badge-success' : 'badge-warning';

  container.innerHTML = `
    <div style="padding: 1rem; background-color: var(--bg-canvas); border-radius: var(--radius-sm); border: 1px solid var(--border-light); margin-bottom: 1.25rem;">
      <div style="font-size: 1.15rem; font-weight: 800; color: var(--navy-primary);">${escapeHtml(s.full_name)}</div>
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">
        Student Number: <strong>${escapeHtml(s.student_number)}</strong> &bull; National ID: <strong>${escapeHtml(s.id_no)}</strong>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.15rem;">Email Address: <strong>${escapeHtml(s.email)}</strong></div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
      <div style="border: 1px solid var(--border-light); padding: 0.85rem; border-radius: var(--radius-sm);">
        <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.3rem;">Academic Program</div>
        <div><span class="badge ${courseBadge}">${escapeHtml(s.course_code)}</span></div>
        <div style="font-size: 0.8rem; font-weight: 600; color: var(--navy-primary); margin-top: 0.3rem;">${escapeHtml(s.course_name)}</div>
      </div>

      <div style="border: 1px solid var(--border-light); padding: 0.85rem; border-radius: var(--radius-sm);">
        <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.3rem;">Partner Training Facility</div>
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--navy-primary);">${escapeHtml(s.site_name)}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">${escapeHtml(s.ojt_no)} &bull; ${escapeHtml(s.site_location)}</div>
      </div>
    </div>

    <div style="border: 1px solid var(--border-light); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem;">
      <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">${s.required_hours}-Hour Internship Progress</div>
      <div class="progress-container" style="margin-bottom: 0.6rem;">
        <div class="progress-bar-bg" style="height: 10px; background-color: var(--border-light);">
          <div class="progress-bar-fill" style="width: ${s.progress_percentage}%; height: 100%; background-color: ${s.progress_percentage >= 100 ? '#2e7d32' : 'var(--gold-accent)'};"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.4rem;">
        <span>Hours Rendered: <strong style="color: var(--navy-primary);">${s.formatted_time}</strong></span>
        <span>Target Goal: <strong>${s.required_hours} hrs</strong> (${s.progress_percentage}%)</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-light); padding-top: 0.5rem; margin-top: 0.4rem;">
        <span>Total Attendance Days: <strong>${s.total_days} days</strong></span>
        <span>Completion Status: <span class="badge ${statusBadgeClass}">${s.progress_percentage >= 100 ? '🏆 Completed 🎉' : s.status}</span></span>
      </div>
      ${s.progress_percentage >= 100 || s.status === 'Completed' ? `
        <div style="background: #fffdf0; border: 1.5px solid #ffb800; padding: 0.85rem; border-radius: var(--radius-sm); margin-top: 0.75rem; display: flex; align-items: flex-start; gap: 0.75rem;">
          <div style="font-size: 1.4rem; line-height: 1;">🎉</div>
          <div>
            <div style="font-weight: 700; color: var(--navy-primary); font-size: 0.88rem;">Goal Hours Completed! 🏆</div>
            <div style="font-size: 0.78rem; color: #4a5568; margin-top: 0.2rem; line-height: 1.35;">
              Congratulations! This intern has successfully completed their required ${s.required_hours}-hour internship goal requirement with dedication and excellence.
            </div>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Dean Controls: Reassign Course -->
    <div style="border: 1px solid var(--border-light); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem; background: var(--bg-canvas);">
      <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem;">🎓 Reassign Academic Program</div>
      <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <select id="drawerCourseSelect" style="flex: 1; min-width: 180px; padding: 0.5rem 0.75rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 0.85rem; background: #fff; color: var(--navy-primary); font-weight: 600;">
          ${cachedCourses.map(c => `<option value="${c.course_id}" ${c.course_id == s.course_id ? 'selected' : ''}>${c.course_code} — ${c.course_name} (${c.required_hours}h)</option>`).join('')}
        </select>
        <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.82rem; white-space: nowrap;" onclick="saveStudentAssignedCourse(${s.student_id})">Save Program</button>
      </div>
    </div>

    <!-- Dean Controls: Custom Hours -->
    <div style="border: 1px solid var(--border-light); padding: 1rem; border-radius: var(--radius-sm); background: var(--bg-canvas);">
      <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem;">⏱️ Override Required Internship Hours</div>
      <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.6rem;">
        ${[240,300,480,500,600].map(h => `<button class="btn-preset-chip ${s.required_hours == h ? 'active' : ''}" onclick="setDrawerPresetHours(${h})">${h}h</button>`).join('')}
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="number" id="drawerHoursInput" value="${s.required_hours}" min="1" max="9999" style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 700; color: var(--navy-primary); background: #fff; max-width: 130px;">
        <span style="font-size: 0.82rem; color: var(--text-muted);">hours total</span>
        <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.82rem; white-space: nowrap;" onclick="saveStudentCustomHours(${s.student_id})">Save Hours</button>
      </div>
    </div>
  `;


  document.getElementById('studentDetailsModal').classList.add('active');
}

function closeStudentDetailsModal() {
  document.getElementById('studentDetailsModal').classList.remove('active');
}

function filterActiveTable(query) {
  if (!query) {
    if (currentTab === 'students') filterByCourse(currentCourseFilter, false);
    if (currentTab === 'logs') filterLogsByCourse(currentLogsCourseFilter, false);
    if (currentTab === 'absences') renderAbsencesTable(cachedAbsences);
    if (currentTab === 'sites') renderSitesTable(cachedSites);
    return;
  }

  if (currentTab === 'students') {
    let baseStudents = cachedStudents;
    if (currentCourseFilter !== 'ALL') {
      baseStudents = cachedStudents.filter(s => (s.course_code || '').toUpperCase() === currentCourseFilter.toUpperCase());
    }
    const filtered = baseStudents.filter(s => s.full_name.toLowerCase().includes(query) || s.student_number.toLowerCase().includes(query) || s.course_code.toLowerCase().includes(query) || s.site_name.toLowerCase().includes(query));
    renderStudentsTable(filtered);
  } else if (currentTab === 'logs') {
    let baseLogs = cachedLogs;
    if (currentLogsCourseFilter !== 'ALL') {
      baseLogs = cachedLogs.filter(l => (l.course_code || '').toUpperCase() === currentLogsCourseFilter.toUpperCase());
    }
    const filtered = baseLogs.filter(l => l.full_name.toLowerCase().includes(query) || l.student_number.toLowerCase().includes(query) || l.date.toLowerCase().includes(query) || (l.course_code && l.course_code.toLowerCase().includes(query)));
    renderLogsTable(filtered);
  } else if (currentTab === 'absences') {
    const filtered = cachedAbsences.filter(a => a.full_name.toLowerCase().includes(query) || a.student_number.toLowerCase().includes(query) || a.reason.toLowerCase().includes(query));
    renderAbsencesTable(filtered);
  } else if (currentTab === 'sites') {
    const filtered = cachedSites.filter(st => st.site_name.toLowerCase().includes(query) || st.site_code.toLowerCase().includes(query) || st.location.toLowerCase().includes(query));
    renderSitesTable(filtered);
  }
}

// ─── Course Management Functions ─────────────────────────────────────────────

async function fetchCourses(render = true) {
  try {
    const res = await fetch(API_BASE + 'admin_courses.php');
    const data = await res.json();
    if (data.status === 'success') {
      cachedCourses = data.data || [];
      if (render) renderCoursesTable(cachedCourses);
      populateDynamicCourseDropdowns();
    }
  } catch (err) {
    console.error('Fetch courses error:', err);
  }
}

function renderCoursesTable(courses) {
  const tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;

  if (courses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No academic programs registered yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = courses.map(c => {
    const badgeClass = getCourseBadgeClass(c.course_code);
    return `
      <tr>
        <td><span class="badge ${badgeClass}">${escapeHtml(c.course_code)}</span></td>
        <td style="font-weight:600;color:var(--navy-primary);">${escapeHtml(c.course_name)}</td>
        <td>
          <span class="badge-hours" style="background:var(--bg-canvas);border:1px solid var(--border-light);padding:0.3rem 0.7rem;border-radius:var(--radius-sm);font-weight:700;color:var(--navy-primary);font-size:0.88rem;">
            ⏱ ${c.required_hours} hrs
          </span>
        </td>
        <td><span class="badge badge-success">${c.enrolled_students} Intern(s)</span></td>
        <td>
          <button class="btn btn-outline" style="margin-right:0.4rem;" onclick='openEditCourseModal(${JSON.stringify(c).replace(/'/g,"&apos;")})'>Edit</button>
          <button class="btn btn-danger" style="padding:0.4rem 0.75rem;font-size:0.8rem;" onclick="deleteCourse(${c.course_id}, '${escapeHtml(c.course_code)}', ${c.enrolled_students})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

let activeEditingCourse = null;

function openAddCourseModal() {
  activeEditingCourse = null;
  document.getElementById('courseModalTitle').textContent = 'Add Academic Program';
  document.getElementById('courseIdInput').value = '';
  document.getElementById('courseCodeInput').value = '';
  document.getElementById('courseNameInput').value = '';
  document.getElementById('courseRequiredHoursInput').value = '480';
  const delBtn = document.getElementById('deleteCourseModalBtn');
  if (delBtn) delBtn.style.display = 'none';
  document.getElementById('courseModal').classList.add('active');
}

function openEditCourseModal(course) {
  activeEditingCourse = course;
  document.getElementById('courseModalTitle').textContent = 'Edit Academic Program';
  document.getElementById('courseIdInput').value = course.course_id;
  document.getElementById('courseCodeInput').value = course.course_code;
  document.getElementById('courseNameInput').value = course.course_name;
  document.getElementById('courseRequiredHoursInput').value = course.required_hours;
  const delBtn = document.getElementById('deleteCourseModalBtn');
  if (delBtn) delBtn.style.display = 'inline-block';
  document.getElementById('courseModal').classList.add('active');
}

function closeCourseModal() {
  document.getElementById('courseModal').classList.remove('active');
}

function setPresetHours(hours) {
  const input = document.getElementById('courseRequiredHoursInput');
  if (input) input.value = hours;
}

function setDrawerPresetHours(hours) {
  const input = document.getElementById('drawerHoursInput');
  if (input) input.value = hours;
}

async function handleModalDeleteCourse() {
  if (!activeEditingCourse) return;
  closeCourseModal();
  await deleteCourse(activeEditingCourse.course_id, activeEditingCourse.course_code, activeEditingCourse.enrolled_students);
}

async function deleteCourse(courseId, courseCode, enrolledCount) {
  if (enrolledCount > 0) {
    alert(`Cannot delete '${courseCode}' — it currently has ${enrolledCount} active intern(s) enrolled. Please reassign all students first.`);
    return;
  }
  if (!confirm(`Permanently delete the '${courseCode}' academic program?`)) return;

  try {
    const res = await fetch(API_BASE + 'admin_courses.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', course_id: courseId })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message);
      fetchCourses();
    } else {
      alert(data.message || 'Failed to delete program.');
    }
  } catch (err) {
    console.error('Delete course error:', err);
  }
}

async function saveCourse(e) {
  e.preventDefault();
  const course_id   = document.getElementById('courseIdInput').value;
  const course_code = document.getElementById('courseCodeInput').value.trim().toUpperCase();
  const course_name = document.getElementById('courseNameInput').value.trim();
  const required_hours = parseInt(document.getElementById('courseRequiredHoursInput').value, 10);

  if (!course_code || !course_name || isNaN(required_hours) || required_hours < 1) {
    alert('Please fill in all fields. Required hours must be a positive number.');
    return;
  }

  try {
    const res = await fetch(API_BASE + 'admin_courses.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', course_id, course_code, course_name, required_hours })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message);
      closeCourseModal();
      fetchCourses();
    } else {
      alert(data.message || 'Failed to save program.');
    }
  } catch (err) {
    console.error('Save course error:', err);
  }
}

function populateDynamicCourseDropdowns() {
  const allCount  = cachedStudents.length;
  const allLogs   = cachedLogs.length;

  // Build options HTML for student and logs filters
  const studentOptions = `<option value="ALL">All Programs (${allCount})</option>` +
    cachedCourses.map(c => {
      const cnt = cachedStudents.filter(s => (s.course_code || '').toUpperCase() === c.course_code.toUpperCase()).length;
      return `<option value="${c.course_code}">${c.course_code} — ${c.course_name} (${cnt})</option>`;
    }).join('');

  const logsOptions = `<option value="ALL">All Programs (${allLogs})</option>` +
    cachedCourses.map(c => {
      const cnt = cachedLogs.filter(l => (l.course_code || '').toUpperCase() === c.course_code.toUpperCase()).length;
      return `<option value="${c.course_code}">${c.course_code} — ${c.course_name} (${cnt})</option>`;
    }).join('');

  const reportOptions = `<option value="ALL">All Programs</option>` +
    cachedCourses.map(c => `<option value="${c.course_code}">${c.course_code} — ${c.course_name}</option>`).join('');

  const sf = document.getElementById('courseSelectFilter');
  if (sf) { const cur = sf.value; sf.innerHTML = studentOptions; sf.value = cachedCourses.some(c=>c.course_code===cur) || cur==='ALL' ? cur : 'ALL'; }

  const lf = document.getElementById('logsCourseSelectFilter');
  if (lf) { const cur = lf.value; lf.innerHTML = logsOptions; lf.value = cachedCourses.some(c=>c.course_code===cur) || cur==='ALL' ? cur : 'ALL'; }

  const rf = document.getElementById('reportCourseFilterSelect');
  if (rf) { const cur = rf.value; rf.innerHTML = reportOptions; rf.value = cachedCourses.some(c=>c.course_code===cur) || cur==='ALL' ? cur : 'ALL'; }
}

async function saveStudentAssignedCourse(studentId) {
  const sel = document.getElementById('drawerCourseSelect');
  if (!sel) return;
  const course_id = sel.value;
  try {
    const res = await fetch(API_BASE + 'admin_student_manage.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_course', student_id: studentId, course_id })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert('Academic program updated successfully.');
      closeStudentDetailsModal();
      fetchStudents();
    } else {
      alert(data.message || 'Failed to update program.');
    }
  } catch (err) {
    console.error('Save student course error:', err);
  }
}

async function saveStudentCustomHours(studentId) {
  const input = document.getElementById('drawerHoursInput');
  if (!input) return;
  const required_hours = parseInt(input.value, 10);
  if (isNaN(required_hours) || required_hours < 1) {
    alert('Please enter a valid number of hours (minimum 1).');
    return;
  }
  try {
    const res = await fetch(API_BASE + 'admin_student_manage.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_required_hours', student_id: studentId, required_hours })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(`Required hours updated to ${required_hours}h successfully.`);
      closeStudentDetailsModal();
      fetchStudents();
    } else {
      alert(data.message || 'Failed to update hours.');
    }
  } catch (err) {
    console.error('Save student hours error:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Global Search Handler across active tab tables
function handleGlobalSearch(query) {
  const q = (query || '').trim().toLowerCase();
  if (q.length > 0 && currentTab === 'overview') {
    switchTab('students');
  }
  filterActiveTable(q);
}

// Notifications Bell System
function updateNotifications() {
  const pendingLogs = cachedLogs.filter(l => l.status === 'Pending' || l.status === 'Pending Verification');
  const pendingAbsences = cachedAbsences.filter(a => a.status === 'Pending');
  const totalPending = pendingLogs.length + pendingAbsences.length;

  const badgeDot = document.getElementById('notifBadgeDot');
  const countBadge = document.getElementById('notifCountBadge');
  const notifList = document.getElementById('notifList');

  if (badgeDot) {
    badgeDot.style.display = totalPending > 0 ? 'block' : 'none';
  }

  if (countBadge) {
    countBadge.textContent = `${totalPending} Pending`;
    countBadge.className = totalPending > 0 ? 'badge badge-danger' : 'badge badge-warning';
  }

  if (notifList) {
    if (totalPending === 0) {
      notifList.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.82rem;">🎉 All caught up! No pending verifications or requests.</div>`;
    } else {
      let itemsHtml = '';

      pendingLogs.forEach(l => {
        itemsHtml += `
          <div class="notif-item" onclick="switchTab('logs'); toggleNotifDropdown();">
            <div class="notif-item-title">
              <span>📸 Attendance Log</span>
              <span class="badge badge-warning" style="font-size: 0.65rem;">Pending</span>
            </div>
            <div class="notif-item-desc">
              <strong>${escapeHtml(l.full_name)}</strong> logged attendance on ${l.date}. Verification photo ready for review.
            </div>
          </div>`;
      });

      pendingAbsences.forEach(a => {
        itemsHtml += `
          <div class="notif-item" onclick="switchTab('absences'); toggleNotifDropdown();">
            <div class="notif-item-title">
              <span>📄 Absence Request</span>
              <span class="badge badge-danger" style="font-size: 0.65rem;">Action Required</span>
            </div>
            <div class="notif-item-desc">
              <strong>${escapeHtml(a.full_name)}</strong> requested absence for ${a.date_absent}: "${escapeHtml(a.reason)}".
            </div>
          </div>`;
      });

      notifList.innerHTML = itemsHtml;
    }
  }
}

function toggleNotifDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('notifDropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('notifDropdown');
  const notifBtn = document.getElementById('notifBtn');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (!dropdown.contains(e.target) && (!notifBtn || !notifBtn.contains(e.target))) {
      dropdown.classList.add('hidden');
    }
  }
});

// Help & Documentation Modal Handlers
function openHelpModal() {
  const modal = document.getElementById('helpModal');
  if (modal) modal.classList.add('active');
}

function closeHelpModal() {
  const modal = document.getElementById('helpModal');
  if (modal) modal.classList.remove('active');
}
