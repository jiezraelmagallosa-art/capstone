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
let currentLogsDateFilter = 'TODAY'; // Default to Today's data!
let currentLogsCustomDate = '';
let currentLogsStatusFilter = 'ALL';
let currentLogsSiteFilter = 'ALL';
let currentStudentStatusFilter = 'ALL';
let currentStudentSiteFilter = 'ALL';
let currentAbsenceStatusFilter = 'ALL';
let currentAbsenceCourseFilter = 'ALL';
let selectedReportCourse = 'ALL';
let selectedReportStatus = 'ALL';
let selectedReportSite = 'ALL';
let cachedStudents = [];
let cachedLogs = [];
let cachedAbsences = [];
let cachedJournals = [];
let currentJournalCourseFilter = 'ALL';
let currentJournalDateFilter = 'TODAY'; // Default to Today's data!
let currentJournalCustomDate = '';
let currentJournalStatusFilter = 'ALL';
let currentJournalSiteFilter = 'ALL';
let currentActiveJournalId = null;
let cachedSites = [];
let cachedCourses = [];
let cachedLiveCaptures = [];
let currentModalPhotos = [];
let currentModalPhotoIndex = 0;
let currentLightboxGallery = null;
let currentLightboxIndex = -1;

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

  // Global Keyboard Shortcuts (ESC to close modals/lightbox, Arrow keys for photo gallery)
  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('imageLightboxModal');
    if (lightbox && lightbox.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeImageLightbox();
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key === 'ArrowLeft') {
        navigateLightbox(-1);
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') {
        navigateLightbox(1);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Escape') {
      const photoModal = document.getElementById('photoModal');
      if (photoModal && photoModal.classList.contains('active')) {
        closePhotoModal();
      }
    }
  });
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
  fetchJournals();
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
    case 'journals':
      fetchJournals();
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

  cachedLiveCaptures = captures || [];

  if (captures.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted);">
        No live verification photo captures recorded today yet.
      </div>`;
    return;
  }

  container.innerHTML = captures.map((c, idx) => `
    <div class="capture-card" onclick="openLiveCaptureLightbox(${idx})" title="Click to view whole picture (Full Size)">
      <div class="capture-img-box">
        <img src="${c.full_url}" alt="${escapeHtml(c.full_name)}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';">
        <span class="capture-badge">${c.shift_type}</span>
        <div class="capture-zoom-overlay">🔍 View Full</div>
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

function handleStudentFilterChange() {
  const courseEl = document.getElementById('courseSelectFilter');
  const statusEl = document.getElementById('studentStatusSelectFilter');
  const siteEl = document.getElementById('studentSiteSelectFilter');

  if (courseEl) currentCourseFilter = courseEl.value || 'ALL';
  if (statusEl) currentStudentStatusFilter = statusEl.value || 'ALL';
  if (siteEl) currentStudentSiteFilter = siteEl.value || 'ALL';

  applyStudentFilters();
}

function applyStudentFilters() {
  let filtered = cachedStudents || [];

  if (currentCourseFilter !== 'ALL') {
    filtered = filtered.filter(s => (s.course_code || '').toUpperCase() === currentCourseFilter.toUpperCase());
  }

  if (currentStudentStatusFilter !== 'ALL') {
    filtered = filtered.filter(s => (s.status || '').toLowerCase() === currentStudentStatusFilter.toLowerCase());
  }

  if (currentStudentSiteFilter !== 'ALL') {
    filtered = filtered.filter(s => {
      const siteMatch = (s.site_id?.toString() === currentStudentSiteFilter.toString()) ||
                        (s.site_name && s.site_name.trim().toLowerCase() === currentStudentSiteFilter.trim().toLowerCase());
      return siteMatch;
    });
  }

  renderStudentsTable(filtered);
}

function filterByCourse(courseCode, updateSelect = true) {
  currentCourseFilter = courseCode || 'ALL';

  const selectEl = document.getElementById('courseSelectFilter');
  if (selectEl && updateSelect) {
    selectEl.value = currentCourseFilter;
  }

  applyStudentFilters();
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
          <button class="btn btn-outline" onclick="openStudentDrawer('${s.student_id}')">Details</button>
        </td>
      </tr>
    `;
  }).join('');
}


// Date helper for local ISO date YYYY-MM-DD
function getLocalDateISO(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Attendance Verification Logs Fetcher
async function fetchLogs() {
  try {
    const res = await fetch(API_BASE + 'admin_get_logs.php' + getDeanQueryParam());
    const data = await res.json();
    if (data.status === 'success') {
      cachedLogs = data.data || [];
      const logDateInput = document.getElementById('logsCustomDateInput');
      if (logDateInput && !logDateInput.value) {
        logDateInput.value = getLocalDateISO();
      }
      updateLogsCourseCounts(data.course_counts || {});
      populateLogsSiteDropdown();
      applyLogsFilters();
      updateNotifications();
    }
  } catch (err) {
    console.error('Fetch logs error:', err);
  }
}

function updateLogsCourseCounts(counts) {
  populateDynamicCourseDropdowns();
}

// Populate Partner Facility dropdown dynamically across all views
function populateLogsSiteDropdown() {
  const siteSet = new Set();

  (cachedSites || []).forEach(st => {
    if (st.site_name && st.site_name.trim()) siteSet.add(st.site_name.trim());
  });

  (cachedStudents || []).forEach(s => {
    if (s.site_name && s.site_name.trim()) siteSet.add(s.site_name.trim());
  });

  (cachedLogs || []).forEach(l => {
    if (l.site_name && l.site_name.trim()) siteSet.add(l.site_name.trim());
  });

  const sortedSites = Array.from(siteSet).sort((a, b) => a.localeCompare(b));

  // 1. Logs Filter Dropdown
  const logsSiteSelect = document.getElementById('logsSiteSelectFilter');
  if (logsSiteSelect) {
    let html = `<option value="ALL">All Partner Facilities (${sortedSites.length})</option>`;
    sortedSites.forEach(name => {
      const isSelected = name === currentLogsSiteFilter ? 'selected' : '';
      html += `<option value="${escapeHtml(name)}" ${isSelected}>${escapeHtml(name)}</option>`;
    });
    logsSiteSelect.innerHTML = html;
  }

  // 2. Student Tracking Filter Dropdown
  const studentSiteSelect = document.getElementById('studentSiteSelectFilter');
  if (studentSiteSelect) {
    let html = `<option value="ALL">All Partner Facilities (${sortedSites.length})</option>`;
    sortedSites.forEach(name => {
      const isSelected = name === currentStudentSiteFilter ? 'selected' : '';
      html += `<option value="${escapeHtml(name)}" ${isSelected}>${escapeHtml(name)}</option>`;
    });
    studentSiteSelect.innerHTML = html;
  }

  // 3. Journal Filter Dropdown
  const journalSiteSelect = document.getElementById('journalSiteSelectFilter');
  if (journalSiteSelect) {
    let html = `<option value="ALL">All Partner Facilities (${sortedSites.length})</option>`;
    sortedSites.forEach(name => {
      const isSelected = name === currentJournalSiteFilter ? 'selected' : '';
      html += `<option value="${escapeHtml(name)}" ${isSelected}>${escapeHtml(name)}</option>`;
    });
    journalSiteSelect.innerHTML = html;
  }

  // 4. Report Filter Dropdown
  const reportSiteSelect = document.getElementById('reportSiteFilterSelect');
  if (reportSiteSelect) {
    let html = `<option value="ALL">All Partner Facilities (${sortedSites.length})</option>`;
    sortedSites.forEach(name => {
      const isSelected = name === selectedReportSite ? 'selected' : '';
      html += `<option value="${escapeHtml(name)}" ${isSelected}>${escapeHtml(name)}</option>`;
    });
    reportSiteSelect.innerHTML = html;
  }
}

// Attendance Logs Filter Handlers
function setLogsDateFilter(filterKey) {
  currentLogsDateFilter = filterKey;
  const customInput = document.getElementById('logsCustomDateInput');
  if (filterKey === 'TODAY') {
    if (customInput) customInput.value = getLocalDateISO();
  }
  applyLogsFilters();
}

function handleDateSelectChange(val) {
  setLogsDateFilter(val);
}

function handleCustomDateChange(val) {
  currentLogsCustomDate = val;
  if (!val) {
    currentLogsDateFilter = 'TODAY';
    const customInput = document.getElementById('logsCustomDateInput');
    if (customInput) customInput.value = getLocalDateISO();
  } else {
    currentLogsDateFilter = 'CUSTOM';
  }
  applyLogsFilters();
}

function handleLogsStatusFilterChange(val) {
  currentLogsStatusFilter = val;
  applyLogsFilters();
}

function handleLogsSiteFilterChange(val) {
  currentLogsSiteFilter = val;
  applyLogsFilters();
}

function handleLogsCourseFilterChange(val) {
  currentLogsCourseFilter = val;
  applyLogsFilters();
}

function filterLogsByCourse(courseCode, updateSelect = true) {
  currentLogsCourseFilter = courseCode || 'ALL';
  const selectEl = document.getElementById('logsCourseSelectFilter');
  if (selectEl && updateSelect) {
    selectEl.value = currentLogsCourseFilter;
  }
  applyLogsFilters();
}

function resetLogsFilters() {
  currentLogsDateFilter = 'TODAY';
  currentLogsCustomDate = '';
  currentLogsStatusFilter = 'ALL';
  currentLogsSiteFilter = 'ALL';
  currentLogsCourseFilter = 'ALL';

  const dateSelect = document.getElementById('logsDateSelectFilter');
  if (dateSelect) dateSelect.value = 'TODAY';
  const customDate = document.getElementById('logsCustomDateInput');
  if (customDate) { customDate.value = ''; customDate.style.display = 'none'; }

  const statusSelect = document.getElementById('logsStatusSelectFilter');
  if (statusSelect) statusSelect.value = 'ALL';

  const siteSelect = document.getElementById('logsSiteSelectFilter');
  if (siteSelect) siteSelect.value = 'ALL';

  const courseSelect = document.getElementById('logsCourseSelectFilter');
  if (courseSelect) courseSelect.value = 'ALL';

  const searchInput = document.getElementById('globalSearch');
  if (searchInput) searchInput.value = '';

  applyLogsFilters('');
}

function updateQuickDatePills() {
  const pills = {
    'TODAY': document.getElementById('btnQuickToday'),
    'YESTERDAY': document.getElementById('btnQuickYesterday'),
    'THIS_WEEK': document.getElementById('btnQuickWeek'),
    'ALL': document.getElementById('btnQuickAll')
  };

  Object.keys(pills).forEach(key => {
    if (pills[key]) {
      if (currentLogsDateFilter === key) {
        pills[key].classList.add('active');
      } else {
        pills[key].classList.remove('active');
      }
    }
  });

  const dateSelect = document.getElementById('logsDateSelectFilter');
  if (dateSelect && dateSelect.value !== currentLogsDateFilter) {
    dateSelect.value = currentLogsDateFilter;
  }
}

function updateFilterStatusBadge(filteredCount, totalCount) {
  const badge = document.getElementById('logsFilterCounterBadge');
  if (!badge) return;

  let label = '';
  if (currentLogsDateFilter === 'TODAY') {
    label = `Showing Today's Logs (${filteredCount})`;
    badge.style.background = '#0284c7';
  } else if (currentLogsDateFilter === 'YESTERDAY') {
    label = `Showing Yesterday's Logs (${filteredCount})`;
    badge.style.background = '#0f766e';
  } else if (currentLogsDateFilter === 'THIS_WEEK') {
    label = `Past 7 Days (${filteredCount})`;
    badge.style.background = '#4338ca';
  } else if (currentLogsDateFilter === 'CUSTOM') {
    label = `Date: ${currentLogsCustomDate} (${filteredCount})`;
    badge.style.background = '#7c3aed';
  } else {
    label = `All Historical Logs (${filteredCount} of ${totalCount})`;
    badge.style.background = 'var(--navy-primary)';
  }

  if (currentLogsStatusFilter !== 'ALL' || currentLogsSiteFilter !== 'ALL' || currentLogsCourseFilter !== 'ALL') {
    label += ` • Filtered`;
  }

  badge.textContent = label;
}

// Unified Multi-Criteria Logs Filter Engine
function applyLogsFilters(searchQuery = null) {
  const globalSearchInput = document.getElementById('globalSearch');
  const q = searchQuery !== null ? searchQuery : (globalSearchInput ? globalSearchInput.value.trim().toLowerCase() : '');

  const todayISO = getLocalDateISO();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = getLocalDateISO(yesterday);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  let filtered = (cachedLogs || []).filter(l => {
    // 1. Date Filter
    const cleanDate = (l.raw_date || '').substring(0, 10);
    if (currentLogsDateFilter === 'TODAY') {
      if (cleanDate !== todayISO) return false;
    } else if (currentLogsDateFilter === 'YESTERDAY') {
      if (cleanDate !== yesterdayISO) return false;
    } else if (currentLogsDateFilter === 'THIS_WEEK') {
      const logD = new Date(l.raw_date || l.date);
      if (isNaN(logD.getTime()) || logD < sevenDaysAgo) return false;
    } else if (currentLogsDateFilter === 'CUSTOM') {
      if (currentLogsCustomDate && cleanDate !== currentLogsCustomDate) return false;
    }

    // 2. Verification Status Filter
    if (currentLogsStatusFilter === 'Pending') {
      const isPending = l.status === 'Pending' || l.status === 'Partial' || l.morning_status === 'Pending' || l.afternoon_status === 'Pending';
      if (!isPending) return false;
    } else if (currentLogsStatusFilter === 'Confirmed') {
      if (l.status !== 'Confirmed' && l.morning_status !== 'Confirmed' && l.afternoon_status !== 'Confirmed') return false;
    } else if (currentLogsStatusFilter === 'Rejected') {
      if (l.status !== 'Rejected' && l.morning_status !== 'Rejected' && l.afternoon_status !== 'Rejected') return false;
    }

    // 3. Partner Facility Filter
    if (currentLogsSiteFilter !== 'ALL') {
      if (!l.site_name || l.site_name.trim().toLowerCase() !== currentLogsSiteFilter.trim().toLowerCase()) {
        return false;
      }
    }

    // 4. Academic Program / Course Filter
    if (currentLogsCourseFilter !== 'ALL') {
      if ((l.course_code || '').toUpperCase() !== currentLogsCourseFilter.toUpperCase()) {
        return false;
      }
    }

    // 5. Search Query Filter
    if (q) {
      const match = (l.full_name && l.full_name.toLowerCase().includes(q)) ||
                    (l.student_number && l.student_number.toLowerCase().includes(q)) ||
                    (l.date && l.date.toLowerCase().includes(q)) ||
                    (l.course_code && l.course_code.toLowerCase().includes(q)) ||
                    (l.site_name && l.site_name.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  updateQuickDatePills();
  updateFilterStatusBadge(filtered.length, cachedLogs.length);
  renderLogsTable(filtered);
}

function renderLogsTable(logs) {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  if (logs.length === 0) {
    let emptyMsg = '';
    if (currentLogsDateFilter === 'TODAY') {
      const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      emptyMsg = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem 1.5rem;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📅</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--navy-primary); margin-bottom: 0.35rem;">
              No Attendance Logs Recorded for Today (${todayFormatted})
            </div>
            <p style="font-size: 0.85rem; color: #64748b; max-width: 450px; margin: 0 auto 1.25rem auto;">
              Interns may not have clocked in yet today, or may be assigned to afternoon shifts.
            </p>
            <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn btn-navy" style="font-size: 0.82rem; padding: 0.45rem 1rem;" onclick="setLogsDateFilter('ALL')">
                🗓️ View All Historical Logs
              </button>
              <button type="button" class="btn btn-outline" style="font-size: 0.82rem; padding: 0.45rem 1rem;" onclick="setLogsDateFilter('YESTERDAY')">
                View Yesterday's Logs
              </button>
            </div>
          </td>
        </tr>`;
    } else {
      emptyMsg = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem 1.5rem;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--navy-primary); margin-bottom: 0.35rem;">
              No Logs Match Current Filter Criteria
            </div>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem;">
              Try adjusting your Date, Verification Status, Partner Facility, or Program filters.
            </p>
            <button type="button" class="btn btn-outline" style="font-size: 0.82rem; padding: 0.45rem 1rem;" onclick="resetLogsFilters()">
              ↺ Reset All Filters
            </button>
          </td>
        </tr>`;
    }
    tbody.innerHTML = emptyMsg;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const hasPhotos = l.photos && l.photos.length > 0;
    const photoBtn = hasPhotos ? `
      <button class="btn btn-navy" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;" onclick='openPhotoModal(${JSON.stringify(l.photos).replace(/'/g, "&apos;")}, ${l.attendance_id})'>
        View (${l.photos.length})
      </button>` : `<span style="color: var(--text-light); font-size: 0.8rem;">No Photo</span>`;
    const courseBadge = getCourseBadgeClass(l.course_code);

    // Morning shift badge & remarks: remove 'Confirmed' badge if confirmed; display badge only if Rejected or Pending
    let mBadgeHtml = '';
    if (l.morning_status === 'Rejected') {
      mBadgeHtml = `<div style="margin-top: 0.2rem;"><span class="badge badge-danger" style="font-size: 0.68rem;">Rejected</span></div>`;
    } else if (l.morning_status === 'Pending' || (!l.morning_status && hasMorning)) {
      mBadgeHtml = `<div style="margin-top: 0.2rem;"><span class="badge badge-warning" style="font-size: 0.68rem;">Pending</span></div>`;
    }

    const mRemarksHtml = (l.morning_status === 'Rejected' && l.morning_remarks)
      ? `<div style="font-size: 0.72rem; color: #b91c1c; font-style: italic; margin-top: 2px;">${escapeHtml(l.morning_remarks)}</div>`
      : '';

    // Afternoon shift badge & remarks: remove 'Confirmed' badge if confirmed; display badge only if Rejected or Pending
    let aBadgeHtml = '';
    if (l.afternoon_status === 'Rejected') {
      aBadgeHtml = `<div style="margin-top: 0.2rem;"><span class="badge badge-danger" style="font-size: 0.68rem;">Rejected</span></div>`;
    } else if (l.afternoon_status === 'Pending' || (!l.afternoon_status && hasAfternoon)) {
      aBadgeHtml = `<div style="margin-top: 0.2rem;"><span class="badge badge-warning" style="font-size: 0.68rem;">Pending</span></div>`;
    }

    const aRemarksHtml = (l.afternoon_status === 'Rejected' && l.afternoon_remarks)
      ? `<div style="font-size: 0.72rem; color: #b91c1c; font-style: italic; margin-top: 2px;">${escapeHtml(l.afternoon_remarks)}</div>`
      : '';

    // Overall status badge
    let overallBadge = 'badge-warning';
    if (l.status === 'Confirmed') overallBadge = 'badge-success';
    if (l.status === 'Rejected')  overallBadge = 'badge-danger';
    if (l.status === 'Partial')   overallBadge = 'badge-warning';

    const hasMorning = (l.time_in_morning && l.time_in_morning !== '--:--') || (l.time_out_morning && l.time_out_morning !== '--:--');
    const hasAfternoon = (l.time_in_afternoon && l.time_in_afternoon !== '--:--') || (l.time_out_afternoon && l.time_out_afternoon !== '--:--');
    const isMorningPending = (!l.morning_status || l.morning_status === 'Pending');

    let evalControls = '';

    if (hasMorning && !hasAfternoon) {
      // 1. Morning shift only
      evalControls = `
        <div class="dean-action-cell">
          <button class="dean-btn-confirm" onclick="reviewAttendanceLog(${l.attendance_id}, 'Confirmed', 'morning')">Confirm</button>
          <button class="dean-btn-reject" onclick="reviewAttendanceLog(${l.attendance_id}, 'Rejected', 'morning')">Reject</button>
        </div>
      `;
    } else if (hasMorning && hasAfternoon && isMorningPending) {
      // 2. Both shifts, morning not yet reviewed
      evalControls = `
        <div class="dean-action-cell">
          <button class="dean-btn-confirm" onclick="reviewAttendanceLog(${l.attendance_id}, 'Confirmed', 'both')">Confirm</button>
          <button class="dean-btn-reject" onclick="reviewAttendanceLog(${l.attendance_id}, 'Rejected', 'both')">Reject</button>
        </div>
      `;
    } else if (hasMorning && hasAfternoon && !isMorningPending) {
      // 3. Morning already reviewed, afternoon pending
      evalControls = `
        <div class="dean-action-cell">
          <button class="dean-btn-confirm" onclick="reviewAttendanceLog(${l.attendance_id}, 'Confirmed', 'afternoon')">Confirm</button>
          <button class="dean-btn-reject" onclick="reviewAttendanceLog(${l.attendance_id}, 'Rejected', 'afternoon')">Reject</button>
        </div>
      `;
    } else if (!hasMorning && hasAfternoon) {
      // 4. Afternoon shift only
      evalControls = `
        <div class="dean-action-cell">
          <button class="dean-btn-confirm" onclick="reviewAttendanceLog(${l.attendance_id}, 'Confirmed', 'afternoon')">Confirm</button>
          <button class="dean-btn-reject" onclick="reviewAttendanceLog(${l.attendance_id}, 'Rejected', 'afternoon')">Reject</button>
        </div>
      `;
    } else {
      evalControls = `
        <div style="font-size: 0.75rem; color: var(--text-light); text-align: center;">
          No logs recorded
        </div>
      `;
    }


    const morningShiftHtml = hasMorning ? `
      <div style="font-size: 0.82rem; font-weight: 600;">${l.time_in_morning} &ndash; ${l.time_out_morning}</div>
      ${mBadgeHtml}
      ${mRemarksHtml}
    ` : `
      <div style="font-size: 0.82rem; color: var(--text-light);">--:-- &ndash; --:--</div>
      <div style="margin-top: 0.2rem;"><span class="badge" style="font-size: 0.68rem; background: #f1f5f9; color: #94a3b8;">Not Logged In</span></div>
    `;

    const afternoonShiftHtml = hasAfternoon ? `
      <div style="font-size: 0.82rem; font-weight: 600;">${l.time_in_afternoon} &ndash; ${l.time_out_afternoon}</div>
      ${aBadgeHtml}
      ${aRemarksHtml}
    ` : `
      <div style="font-size: 0.82rem; color: var(--text-light);">--:-- &ndash; --:--</div>
      <div style="margin-top: 0.2rem;"><span class="badge" style="font-size: 0.68rem; background: #f1f5f9; color: #94a3b8;">Not Logged In</span></div>
    `;

    return `
      <tr>
        <td style="font-weight: 700; color: var(--navy-primary); white-space: nowrap;">${l.date}</td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(l.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">${l.student_number} &bull; <span class="badge ${courseBadge}">${l.course_code}</span></div>
          <div style="font-size: 0.72rem; color: #64748b;">${escapeHtml(l.site_name || '')}</div>
        </td>
        <td>${morningShiftHtml}</td>
        <td>${afternoonShiftHtml}</td>
        <td><span class="badge ${overallBadge}">${l.status}</span></td>
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
      applyAbsenceFilters();
      updateNotifications();
    }
  } catch (err) {
    console.error('Fetch absences error:', err);
  }
}

function applyAbsenceFilters() {
  const statusEl = document.getElementById('absenceStatusSelectFilter');
  const courseEl = document.getElementById('absenceCourseSelectFilter');

  if (statusEl) currentAbsenceStatusFilter = statusEl.value || 'ALL';
  if (courseEl) currentAbsenceCourseFilter = courseEl.value || 'ALL';

  let filtered = cachedAbsences || [];

  if (currentAbsenceStatusFilter !== 'ALL') {
    filtered = filtered.filter(a => (a.status || '').toLowerCase() === currentAbsenceStatusFilter.toLowerCase());
  }

  if (currentAbsenceCourseFilter !== 'ALL') {
    filtered = filtered.filter(a => (a.course_code || '').toUpperCase() === currentAbsenceCourseFilter.toUpperCase());
  }

  renderAbsencesTable(filtered);
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

// ─── DAILY STUDENT JOURNALS & NARRATIVE REPORTS LOGIC ────────────────────────

async function fetchJournals() {
  try {
    const deanParam = currentUser && currentUser.user_id ? `?dean_id=${currentUser.user_id}` : '';
    const res = await fetch(API_BASE + 'admin_get_journals.php' + deanParam);
    const data = await res.json();

    if (data.status === 'success') {
      cachedJournals = data.data || [];
      const journalDateInput = document.getElementById('journalCustomDateInput');
      if (journalDateInput && !journalDateInput.value) {
        journalDateInput.value = getLocalDateISO();
      }
      populateJournalSiteDropdown();
      populateJournalCourseDropdown();
      applyJournalFilters();
    }
  } catch (err) {
    console.error('Fetch journals error:', err);
  }
}

function populateJournalSiteDropdown() {
  const select = document.getElementById('journalSiteSelectFilter');
  if (!select) return;

  const currentVal = select.value;
  const sitesSet = new Set();
  (cachedSites || []).forEach(s => { if (s.site_name) sitesSet.add(s.site_name); });
  (cachedJournals || []).forEach(j => { if (j.site_name) sitesSet.add(j.site_name); });

  const sortedSites = Array.from(sitesSet).sort();
  let html = `<option value="ALL">All Partner Facilities (${sortedSites.length})</option>`;
  sortedSites.forEach(name => {
    html += `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
  });
  select.innerHTML = html;
  if (currentVal && (currentVal === 'ALL' || sitesSet.has(currentVal))) {
    select.value = currentVal;
  }
}

function populateJournalCourseDropdown() {
  const select = document.getElementById('journalCourseSelectFilter');
  if (!select) return;

  const currentVal = select.value;
  const coursesSet = new Set();
  (cachedCourses || []).forEach(c => { if (c.course_code) coursesSet.add(c.course_code.toUpperCase()); });
  (cachedJournals || []).forEach(j => { if (j.course_code) coursesSet.add(j.course_code.toUpperCase()); });

  const sorted = Array.from(coursesSet).sort();
  let html = `<option value="ALL">All Programs (${sorted.length})</option>`;
  sorted.forEach(code => {
    html += `<option value="${code}">${code}</option>`;
  });
  select.innerHTML = html;
  if (currentVal && (currentVal === 'ALL' || coursesSet.has(currentVal.toUpperCase()))) {
    select.value = currentVal;
  }
}

function setJournalDateFilter(type) {
  currentJournalDateFilter = type;
  const customInput = document.getElementById('journalCustomDateInput');
  if (type === 'TODAY') {
    if (customInput) customInput.value = getLocalDateISO();
  }
  applyJournalFilters();
}

function handleJournalDateSelectChange(val) {
  setJournalDateFilter(val);
}

function handleJournalCustomDateChange(val) {
  currentJournalCustomDate = val;
  if (!val) {
    currentJournalDateFilter = 'TODAY';
    const customInput = document.getElementById('journalCustomDateInput');
    if (customInput) customInput.value = getLocalDateISO();
  } else {
    currentJournalDateFilter = 'CUSTOM';
  }
  applyJournalFilters();
}

function handleJournalStatusFilterChange(val) {
  currentJournalStatusFilter = val;
  applyJournalFilters();
}

function handleJournalSiteFilterChange(val) {
  currentJournalSiteFilter = val;
  applyJournalFilters();
}

function handleJournalCourseFilterChange(val) {
  currentJournalCourseFilter = val;
  applyJournalFilters();
}

function resetJournalFilters() {
  currentJournalDateFilter = 'TODAY';
  currentJournalCustomDate = '';
  currentJournalStatusFilter = 'ALL';
  currentJournalSiteFilter = 'ALL';
  currentJournalCourseFilter = 'ALL';

  const customInput = document.getElementById('journalCustomDateInput');
  if (customInput) customInput.value = getLocalDateISO();
  const statusSelect = document.getElementById('journalStatusSelectFilter');
  if (statusSelect) statusSelect.value = 'ALL';
  const siteSelect = document.getElementById('journalSiteSelectFilter');
  if (siteSelect) siteSelect.value = 'ALL';
  const courseSelect = document.getElementById('journalCourseSelectFilter');
  if (courseSelect) courseSelect.value = 'ALL';
  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch && currentTab === 'journals') globalSearch.value = '';

  applyJournalFilters();
}

function updateJournalQuickDatePills() {
  const pills = {
    'TODAY': document.getElementById('btnJournalQuickToday'),
    'YESTERDAY': document.getElementById('btnJournalQuickYesterday'),
    'THIS_WEEK': document.getElementById('btnJournalQuickWeek'),
    'ALL': document.getElementById('btnJournalQuickAll'),
  };

  Object.entries(pills).forEach(([key, btn]) => {
    if (!btn) return;
    if (currentJournalDateFilter === key) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateJournalFilterStatusBadge(filteredCount, totalCount) {
  const badge = document.getElementById('journalsFilterCounterBadge');
  if (!badge) return;

  let label = '';
  if (currentJournalDateFilter === 'TODAY') {
    label = `Today's Submissions (${filteredCount})`;
    badge.style.background = '#0284c7';
  } else if (currentJournalDateFilter === 'YESTERDAY') {
    label = `Yesterday's Submissions (${filteredCount})`;
    badge.style.background = '#d97706';
  } else if (currentJournalDateFilter === 'THIS_WEEK') {
    label = `Past 7 Days (${filteredCount})`;
    badge.style.background = '#4338ca';
  } else if (currentJournalDateFilter === 'CUSTOM') {
    label = `Date: ${currentJournalCustomDate} (${filteredCount})`;
    badge.style.background = '#7c3aed';
  } else {
    label = `All Historical Entries (${filteredCount} of ${totalCount})`;
    badge.style.background = 'var(--navy-primary)';
  }

  if (currentJournalStatusFilter !== 'ALL' || currentJournalSiteFilter !== 'ALL' || currentJournalCourseFilter !== 'ALL') {
    label += ` • Filtered`;
  }

  badge.textContent = label;
}

function applyJournalFilters(searchQuery = null) {
  const globalSearchInput = document.getElementById('globalSearch');
  const q = searchQuery !== null ? searchQuery : (globalSearchInput ? globalSearchInput.value.trim().toLowerCase() : '');

  const todayISO = getLocalDateISO();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = getLocalDateISO(yesterday);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  let filtered = (cachedJournals || []).filter(j => {
    // 1. Date Filter
    const cleanDate = (j.raw_date || '').substring(0, 10);
    if (currentJournalDateFilter === 'TODAY') {
      if (cleanDate !== todayISO) return false;
    } else if (currentJournalDateFilter === 'YESTERDAY') {
      if (cleanDate !== yesterdayISO) return false;
    } else if (currentJournalDateFilter === 'THIS_WEEK') {
      const entryD = new Date(j.raw_date || j.date);
      if (isNaN(entryD.getTime()) || entryD < sevenDaysAgo) return false;
    } else if (currentJournalDateFilter === 'CUSTOM') {
      if (currentJournalCustomDate && cleanDate !== currentJournalCustomDate) return false;
    }

    // 2. Status Filter
    if (currentJournalStatusFilter !== 'ALL') {
      if ((j.dean_status || 'Pending') !== currentJournalStatusFilter) return false;
    }

    // 3. Site Filter
    if (currentJournalSiteFilter !== 'ALL') {
      if ((j.site_name || '').toLowerCase() !== currentJournalSiteFilter.toLowerCase()) return false;
    }

    // 4. Course Filter
    if (currentJournalCourseFilter !== 'ALL') {
      if ((j.course_code || '').toUpperCase() !== currentJournalCourseFilter.toUpperCase()) return false;
    }

    // 5. Global Search Text Filter
    if (q) {
      const matchName = (j.full_name || '').toLowerCase().includes(q);
      const matchNumber = (j.student_number || '').toLowerCase().includes(q);
      const matchTasks = (j.tasks_completed || '').toLowerCase().includes(q);
      const matchLearnings = (j.learnings_reflection || '').toLowerCase().includes(q);
      const matchSite = (j.site_name || '').toLowerCase().includes(q);
      if (!matchName && !matchNumber && !matchTasks && !matchLearnings && !matchSite) return false;
    }

    return true;
  });

  updateJournalQuickDatePills();
  updateJournalFilterStatusBadge(filtered.length, cachedJournals.length);
  renderJournalsTable(filtered);
}

function renderJournalsTable(journals) {
  const tbody = document.getElementById('journalsTableBody');
  if (!tbody) return;

  if (journals.length === 0) {
    let emptyMsg = '';
    if (currentJournalDateFilter === 'TODAY') {
      const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      emptyMsg = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem 1.5rem;">
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--navy-primary); margin-bottom: 0.35rem;">
              No Daily Journals Submitted for Today (${todayFormatted})
            </div>
            <p style="font-size: 0.85rem; color: #64748b; max-width: 450px; margin: 0 auto;">
              Students typically submit their narrative reports at the end of their shift.
            </p>
          </td>
        </tr>`;
    } else {
      emptyMsg = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem 1.5rem;">
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--navy-primary); margin-bottom: 0.35rem;">
              No Daily Journals Match Filter Criteria
            </div>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem;">
              Try adjusting your Date, Review Status, Partner Facility, or Program filters.
            </p>
            <button type="button" class="btn btn-outline" style="font-size: 0.82rem; padding: 0.45rem 1rem;" onclick="resetJournalFilters()">
              Reset All Filters
            </button>
          </td>
        </tr>`;
    }
    tbody.innerHTML = emptyMsg;
    return;
  }

  tbody.innerHTML = journals.map(j => {
    let statusBadge = `<span class="journal-badge-pending">⏳ Pending Review</span>`;
    if (j.dean_status === 'Reviewed') {
      statusBadge = `<span class="journal-badge-reviewed">✓ Reviewed</span>`;
    } else if (j.dean_status === 'Commended') {
      statusBadge = `<span class="journal-badge-commended">⭐ Commended</span>`;
    }

    const courseBadge = getCourseBadgeClass(j.course_code);
    const feedbackHtml = j.dean_feedback ? `
      <div class="journal-feedback-quote">
        <strong>Dean:</strong> "${escapeHtml(j.dean_feedback)}"
      </div>` : `<span style="font-size: 0.78rem; color: #94a3b8; font-style: italic;">No feedback entered</span>`;

    return `
      <tr>
        <td style="font-weight: 700; color: var(--navy-primary); white-space: nowrap;">
          ${escapeHtml(j.date)}
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(j.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
            ${escapeHtml(j.student_number)} • <span class="badge ${courseBadge}" style="font-size: 0.68rem;">${escapeHtml(j.course_code)}</span>
          </div>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.82rem; color: var(--navy-primary);">${escapeHtml(j.site_name)}</div>
          <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
            AM: ${j.time_in_morning} - ${j.time_out_morning} | PM: ${j.time_in_afternoon} - ${j.time_out_afternoon}
          </div>
        </td>
        <td>
          <div class="journal-excerpt-box" title="${escapeHtml(j.tasks_completed)}">
            ${escapeHtml(j.tasks_completed)}
          </div>
        </td>
        <td>
          <div class="journal-excerpt-box" title="${escapeHtml(j.learnings_reflection || 'None')}">
            ${escapeHtml(j.learnings_reflection || 'None')}
          </div>
        </td>
        <td>
          <div>${statusBadge}</div>
          ${feedbackHtml}
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            <button type="button" class="btn btn-navy" style="font-size: 0.72rem; padding: 0.3rem 0.65rem;" onclick="openJournalModal(${j.journal_id})">
              📖 Read & Feedback
            </button>
            <button type="button" class="btn btn-danger" style="font-size: 0.72rem; padding: 0.3rem 0.55rem;" title="Permanently Delete Journal from Database" onclick="deleteJournal(${j.journal_id})">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openJournalModal(journalId) {
  const j = (cachedJournals || []).find(item => item.journal_id === journalId);
  if (!j) return;

  currentActiveJournalId = journalId;

  const modal = document.getElementById('journalModal');
  const title = document.getElementById('journalModalTitle');
  const subtitle = document.getElementById('journalModalSubtitle');
  const content = document.getElementById('journalModalContent');

  if (!modal || !content) return;

  title.textContent = `Daily Journal: ${j.full_name}`;
  subtitle.textContent = `${j.date} • ${j.student_number} • ${j.course_code} • ${j.site_name}`;

  content.innerHTML = `
    <!-- Intern & Shift Information Banner -->
    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-canvas); border: 1px solid var(--border-light); padding: 0.75rem 1rem; border-radius: var(--radius-sm); flex-wrap: wrap; gap: 0.5rem;">
      <div>
        <div style="font-size: 0.88rem; font-weight: 800; color: var(--navy-primary);">${escapeHtml(j.full_name)} (${escapeHtml(j.student_number)})</div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(j.course_name)} &bull; ${escapeHtml(j.site_name)}</div>
      </div>
      <div style="text-align: right; font-size: 0.75rem; color: #475569;">
        <div><strong>Entry Date:</strong> ${escapeHtml(j.date)}</div>
        <div><strong>Attendance:</strong> AM: ${j.time_in_morning} - ${j.time_out_morning} | PM: ${j.time_in_afternoon} - ${j.time_out_afternoon}</div>
      </div>
    </div>

    <!-- Section 1: Tasks Accomplished -->
    <div class="journal-section-card">
      <div class="journal-section-title">
        <span>📋</span> Daily Activities &amp; Tasks Accomplished
      </div>
      <div class="journal-section-text">${escapeHtml(j.tasks_completed)}</div>
    </div>

    <!-- Section 2: Learnings & Reflections -->
    <div class="journal-section-card">
      <div class="journal-section-title">
        <span>💡</span> Key Learnings &amp; Reflections
      </div>
      <div class="journal-section-text">${escapeHtml(j.learnings_reflection || 'No specific reflections noted for this shift.')}</div>
    </div>

    <!-- Section 3: Challenges Encountered -->
    ${j.challenges_encountered ? `
      <div class="journal-section-card">
        <div class="journal-section-title">
          <span>⚠️</span> Challenges Encountered &amp; Resolutions
        </div>
        <div class="journal-section-text">${escapeHtml(j.challenges_encountered)}</div>
      </div>
    ` : ''}

    <!-- Section 4: Dean Evaluation & Feedback Input -->
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); padding: 1rem;">
      <div style="font-size: 0.84rem; font-weight: 800; color: #1e3a8a; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.35rem;">
        Dean Evaluation &amp; Feedback Remarks
      </div>

      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.75rem; margin-bottom: 0.65rem;">
        <div>
          <label style="display: block; font-size: 0.74rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.25rem;">Evaluation Status:</label>
          <select id="modalJournalStatusSelect" class="form-control" style="font-size: 0.82rem; height: 36px; border-color: #93c5fd;">
            <option value="Reviewed" ${j.dean_status === 'Reviewed' ? 'selected' : ''}>✓ Reviewed &amp; Noted</option>
            <option value="Commended" ${j.dean_status === 'Commended' ? 'selected' : ''}>⭐ Commended (Exemplary)</option>
            <option value="Pending" ${j.dean_status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
          </select>
        </div>
        <div>
          <label style="display: block; font-size: 0.74rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.25rem;">Last Evaluation Timestamp:</label>
          <div style="font-size: 0.78rem; color: #475569; padding-top: 0.45rem;">
            ${j.reviewed_at ? `Evaluated on ${j.reviewed_at}` : 'Not evaluated yet'}
          </div>
        </div>
      </div>

      <div>
        <label style="display: block; font-size: 0.74rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.25rem;">Dean Feedback / Guidance for Student:</label>
        <textarea id="modalJournalFeedbackText" class="form-control" rows="3" placeholder="Type constructive feedback, guidance, or words of encouragement for this intern..." style="font-size: 0.82rem; border-color: #93c5fd; resize: vertical;">${escapeHtml(j.dean_feedback || '')}</textarea>
        <small style="display: block; color: #64748b; font-size: 0.72rem; margin-top: 0.25rem;">
          💡 This feedback is immediately visible to the intern inside their mobile app.
        </small>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeJournalModal() {
  const modal = document.getElementById('journalModal');
  if (modal) modal.classList.remove('active');
  currentActiveJournalId = null;
}

async function saveJournalEvaluation() {
  if (!currentActiveJournalId) return;

  const statusSelect = document.getElementById('modalJournalStatusSelect');
  const feedbackText = document.getElementById('modalJournalFeedbackText');

  const deanStatus = statusSelect ? statusSelect.value : 'Reviewed';
  const deanFeedback = feedbackText ? feedbackText.value.trim() : '';

  try {
    const res = await fetch(API_BASE + 'admin_review_journal.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        journal_id: currentActiveJournalId,
        dean_status: deanStatus,
        dean_feedback: deanFeedback
      })
    });

    const data = await res.json();
    if (data.status === 'success') {
      alert('✓ Journal evaluation and feedback saved successfully.');
      closeJournalModal();
      fetchJournals();
    } else {
      alert(data.message || 'Failed to save evaluation.');
    }
  } catch (err) {
    console.error('Save journal evaluation error:', err);
    alert('Server error saving evaluation.');
  }
}

async function deleteJournal(journalId) {
  if (!confirm('⚠️ PERMANENT DATABASE DELETION:\nAre you sure you want to delete this daily student journal from the database? This cannot be undone.')) {
    return;
  }

  try {
    const res = await fetch(API_BASE + 'admin_delete_journal.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_one',
        journal_id: journalId,
        dean_id: currentUser ? currentUser.user_id : 0
      })
    });

    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message);
      if (currentActiveJournalId === journalId) {
        closeJournalModal();
      }
      cachedJournals = (cachedJournals || []).filter(j => j.journal_id !== journalId);
      applyJournalFilters();
    } else {
      alert(data.message || 'Failed to delete journal entry.');
    }
  } catch (err) {
    console.error('Delete journal error:', err);
    alert('Server error processing deletion.');
  }
}

function handleModalDeleteJournal() {
  if (currentActiveJournalId) {
    deleteJournal(currentActiveJournalId);
  }
}

async function deleteAllFilteredJournals() {
  const currentCount = document.querySelectorAll('#journalsTableBody tr').length;
  if (currentCount === 0 || cachedJournals.length === 0) {
    alert('No journal entries currently available to delete.');
    return;
  }

  let promptMsg = `⚠️ PERMANENT BULK DATABASE DELETION:\n\nAre you sure you want to permanently delete all journal entries from the database?`;
  if (currentJournalDateFilter === 'TODAY') {
    promptMsg = `⚠️ PERMANENT DELETION: Delete all of TODAY's journal entries from the database?`;
  } else if (currentJournalDateFilter === 'YESTERDAY') {
    promptMsg = `⚠️ PERMANENT DELETION: Delete all of YESTERDAY's journal entries from the database?`;
  }

  if (!confirm(promptMsg)) return;

  try {
    const bodyPayload = {
      action: 'delete_all',
      dean_id: currentUser ? currentUser.user_id : 0
    };

    if (currentJournalDateFilter === 'TODAY') {
      bodyPayload.date = getLocalDateISO();
    } else if (currentJournalDateFilter === 'YESTERDAY') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      bodyPayload.date = getLocalDateISO(yesterday);
    } else if (currentJournalDateFilter === 'CUSTOM' && currentJournalCustomDate) {
      bodyPayload.date = currentJournalCustomDate;
    }

    const res = await fetch(API_BASE + 'admin_delete_journal.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message);
      fetchJournals();
    } else {
      alert(data.message || 'Bulk deletion failed.');
    }
  } catch (err) {
    console.error('Delete all journals error:', err);
    alert('Server error executing bulk deletion.');
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

function filterReportByStatus(status) {
  selectedReportStatus = status || 'ALL';
  renderComplianceSummary();
}

function filterReportBySite(siteName) {
  selectedReportSite = siteName || 'ALL';
  renderComplianceSummary();
}

function getReportSiteOptionsHtml() {
  const siteSet = new Set();
  (cachedSites || []).forEach(st => {
    if (st.site_name && st.site_name.trim()) siteSet.add(st.site_name.trim());
  });
  (cachedStudents || []).forEach(s => {
    if (s.site_name && s.site_name.trim()) siteSet.add(s.site_name.trim());
  });
  const sorted = Array.from(siteSet).sort((a, b) => a.localeCompare(b));
  return sorted.map(name => {
    const isSel = name === selectedReportSite ? 'selected' : '';
    return `<option value="${escapeHtml(name)}" ${isSel}>${escapeHtml(name)}</option>`;
  }).join('');
}

function getReportStudents() {
  let filtered = cachedStudents || [];

  if (selectedReportCourse !== 'ALL') {
    filtered = filtered.filter(s => (s.course_code || '').toUpperCase() === selectedReportCourse.toUpperCase());
  }

  if (selectedReportStatus !== 'ALL') {
    filtered = filtered.filter(s => (s.status || '').toLowerCase() === selectedReportStatus.toLowerCase());
  }

  if (selectedReportSite !== 'ALL') {
    filtered = filtered.filter(s => (s.site_name && s.site_name.trim().toLowerCase() === selectedReportSite.trim().toLowerCase()));
  }

  return filtered;
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
    <!-- Multi-Criteria Report Filters Header -->
    <div class="card" style="padding: 1.15rem 1.4rem; margin-bottom: 1.25rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: var(--radius-sm); box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <div class="report-filter-grid">
        <!-- Program -->
        <div>
          <label for="reportCourseFilterSelect" style="display: block; font-size: 0.73rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.35rem;">
            Academic Program
          </label>
          <select id="reportCourseFilterSelect" class="form-control" style="width: 100%; height: 38px; font-size: 0.83rem; font-weight: 600; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 0.75rem;" onchange="filterReportByCourse(this.value)">
            <option value="ALL" ${selectedReportCourse === 'ALL' ? 'selected' : ''}>All Academic Programs</option>
            <option value="BSCS" ${selectedReportCourse === 'BSCS' ? 'selected' : ''}>BSCS - Computer Science</option>
            <option value="BSIS" ${selectedReportCourse === 'BSIS' ? 'selected' : ''}>BSIS - Information Systems</option>
            <option value="BLIS" ${selectedReportCourse === 'BLIS' ? 'selected' : ''}>BLIS - Library &amp; Info Science</option>
          </select>
        </div>

        <!-- Status -->
        <div>
          <label for="reportStatusFilterSelect" style="display: block; font-size: 0.73rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.35rem;">
            Compliance Status
          </label>
          <select id="reportStatusFilterSelect" class="form-control" style="width: 100%; height: 38px; font-size: 0.83rem; font-weight: 600; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 0.75rem;" onchange="filterReportByStatus(this.value)">
            <option value="ALL" ${selectedReportStatus === 'ALL' ? 'selected' : ''}>All Statuses</option>
            <option value="In Progress" ${selectedReportStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${selectedReportStatus === 'Completed' ? 'selected' : ''}>Completed (Goal Met)</option>
            <option value="Not Started" ${selectedReportStatus === 'Not Started' ? 'selected' : ''}>Not Started (0h)</option>
          </select>
        </div>

        <!-- Partner Facility -->
        <div>
          <label for="reportSiteFilterSelect" style="display: block; font-size: 0.73rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.35rem;">
            Partner Facility
          </label>
          <select id="reportSiteFilterSelect" class="form-control" style="width: 100%; height: 38px; font-size: 0.83rem; font-weight: 600; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 0.75rem;" onchange="filterReportBySite(this.value)">
            <option value="ALL">All Partner Facilities</option>
            ${getReportSiteOptionsHtml()}
          </select>
        </div>

        <!-- Actions -->
        <div class="report-filter-actions">
          <button type="button" class="btn btn-outline" onclick="exportCSVReport()" style="height: 38px; padding: 0 1rem; font-size: 0.82rem; font-weight: 700; border-radius: 6px; white-space: nowrap; color: var(--navy-primary); border-color: #cbd5e1;">
            Export CSV
          </button>
          <button type="button" class="btn btn-navy" onclick="generatePDFReport()" style="height: 38px; padding: 0 1.25rem; font-size: 0.82rem; font-weight: 700; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0, 45, 86, 0.15);">
            Generate PDF Report
          </button>
        </div>
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

function getLogoDataUrl() {
  try {
    const sidebarLogo = document.querySelector('.sidebar-logo img') || document.querySelector('.auth-hero-logo img');
    if (sidebarLogo && sidebarLogo.complete && sidebarLogo.naturalWidth > 0) {
      const c = document.createElement('canvas');
      c.width = sidebarLogo.naturalWidth;
      c.height = sidebarLogo.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(sidebarLogo, 0, 0);
      return c.toDataURL('image/png');
    }
  } catch (e) {
    console.warn('Could not extract logo data URL:', e);
  }
  return 'assets/images/sbc_logo.png';
}

async function generatePDFReport() {
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
  const dateTag = new Date().toISOString().slice(0, 10);
  const pdfFilename = `SBC_OJT_Compliance_Report_${selectedReportCourse}_${dateTag}.pdf`;
  const logoUrl = getLogoDataUrl();

  const offscreenContainer = document.createElement('div');
  offscreenContainer.style.position = 'fixed';
  offscreenContainer.style.top = '0';
  offscreenContainer.style.left = '0';
  offscreenContainer.style.width = '695px';
  offscreenContainer.style.opacity = '0';
  offscreenContainer.style.pointerEvents = 'none';
  offscreenContainer.style.zIndex = '-9999';
  offscreenContainer.style.overflow = 'visible';

  const reportWrapper = document.createElement('div');
  reportWrapper.style.boxSizing = 'border-box';
  reportWrapper.style.width = '695px';
  reportWrapper.style.padding = '14px 16px';
  reportWrapper.style.backgroundColor = '#ffffff';
  reportWrapper.style.color = '#1e293b';
  reportWrapper.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  reportWrapper.style.fontSize = '10px';
  reportWrapper.style.lineHeight = '1.35';

  reportWrapper.innerHTML = `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #002d56; padding-bottom: 8px; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${logoUrl}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: contain; flex-shrink: 0;" alt="SBC Logo" onerror="this.style.display='none';">
        <div>
          <div style="font-size: 14px; font-weight: 800; color: #002d56; text-transform: uppercase; letter-spacing: 0.3px; margin: 0;">Southern Baptist College</div>
          <div style="font-size: 9.5px; font-weight: 600; color: #475569; margin-top: 2px;">Office of Student Affairs &amp; Internship Coordination</div>
          <div style="font-size: 10.5px; font-weight: 700; color: #d97706; text-transform: uppercase; margin-top: 2px;">Institutional OJT Compliance &amp; Attendance Report</div>
        </div>
      </div>
      <div style="text-align: right; font-size: 9px; color: #64748b; flex-shrink: 0; padding-left: 10px;">
        <strong style="color: #1e293b;">Date Generated:</strong><br>
        <span style="white-space: nowrap;">${dateStr}</span>
      </div>
    </div>

    <div style="display: flex; gap: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 7px 10px; border-radius: 5px; margin-bottom: 10px;">
      <div style="flex: 1; font-size: 9.5px;">
        <div><strong style="color: #002d56;">Target Program Scope:</strong> ${escapeHtml(programTitle)}</div>
        <div style="margin-top: 2px;"><strong style="color: #002d56;">Required Target Goal:</strong> Per-course defined hours</div>
      </div>
      <div style="flex: 1; font-size: 9.5px;">
        <div><strong style="color: #002d56;">Issued By:</strong> ${escapeHtml(deanName)} (${escapeHtml(deanEmail)})</div>
        <div style="margin-top: 2px;"><strong style="color: #002d56;">Report Type:</strong> Official Institutional Verification Summary</div>
      </div>
    </div>

    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <div style="flex: 1; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 5px; padding: 6px; text-align: center;">
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Interns</div>
        <div style="font-size: 15px; font-weight: 800; color: #002d56; margin-top: 1px;">${total}</div>
      </div>
      <div style="flex: 1; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 5px; padding: 6px; text-align: center;">
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Completed (Goal Hrs)</div>
        <div style="font-size: 15px; font-weight: 800; color: #15803d; margin-top: 1px;">${completed}</div>
      </div>
      <div style="flex: 1; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 5px; padding: 6px; text-align: center;">
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">In-Progress</div>
        <div style="font-size: 15px; font-weight: 800; color: #002d56; margin-top: 1px;">${inProgress}</div>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 8.5px;">
      <thead>
        <tr style="background-color: #002d56; color: #ffffff;">
          <th style="width: 22%; padding: 6px 4px; text-align: left; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Student Name</th>
          <th style="width: 12%; padding: 6px 4px; text-align: left; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Student #</th>
          <th style="width: 8%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Course</th>
          <th style="width: 20%; padding: 6px 4px; text-align: left; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Facility Placement</th>
          <th style="width: 13%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Hours Rendered</th>
          <th style="width: 11%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Target Goal</th>
          <th style="width: 7%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Progress</th>
          <th style="width: 7%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${targetStudents.length === 0 ? `
          <tr><td colspan="8" style="text-align: center; padding: 15px; color: #64748b; font-size: 9px; border: 1px solid #cbd5e1;">No student records found.</td></tr>
        ` : targetStudents.map((s, idx) => `
          <tr style="background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; font-weight: 700; color: #1e293b; font-size: 8px; word-break: break-word;">${escapeHtml(s.full_name)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; color: #475569; font-size: 8px;">${escapeHtml(s.student_number)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; font-weight: 700; color: #002d56; font-size: 8px; text-align: center;">${escapeHtml(s.course_code)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; color: #475569; font-size: 8px; word-break: break-word;">${escapeHtml(s.site_name || 'Unassigned')}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; font-weight: 700; color: #002d56; font-size: 8px; text-align: center;">${s.rendered_hours || 0}h ${s.rendered_minutes || 0}m</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; color: #475569; font-size: 8px; text-align: center;">${s.required_hours || 0}h</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; font-weight: 700; font-size: 8px; text-align: center;">${s.progress_percentage || 0}%</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center;">
              <span style="display: inline-block; padding: 2px 4px; border-radius: 3px; font-size: 7.5px; font-weight: 700; background-color: ${s.status === 'Completed' ? '#dcfce7' : '#fef3c7'}; color: ${s.status === 'Completed' ? '#15803d' : '#b45309'}; border: 1px solid ${s.status === 'Completed' ? '#86efac' : '#fde047'};">
                ${escapeHtml(s.status || 'In Progress')}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="margin-top: 20px; display: flex; justify-content: space-between;">
      <div style="width: 44%; text-align: center;">
        <div style="border-bottom: 1.5px solid #002d56; height: 26px; margin-bottom: 5px;"></div>
        <p style="font-weight: 700; font-size: 10px; color: #002d56; margin: 0;">${escapeHtml(deanName)}</p>
        <p style="font-size: 8.5px; color: #64748b; margin: 2px 0 0 0;">Dean of Student Affairs / Department Head</p>
      </div>
      <div style="width: 44%; text-align: center;">
        <div style="border-bottom: 1.5px solid #002d56; height: 26px; margin-bottom: 5px;"></div>
        <p style="font-weight: 700; font-size: 10px; color: #002d56; margin: 0;">Institutional OJT Placement Coordinator</p>
        <p style="font-size: 8.5px; color: #64748b; margin: 2px 0 0 0;">Office of Industrial Placement &amp; Verification</p>
      </div>
    </div>

    <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 5px; text-align: center; font-size: 7.5px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} Southern Baptist College &bull; Official Computer Generated OJT Compliance Document
    </div>
  `;

  offscreenContainer.appendChild(reportWrapper);
  document.body.appendChild(offscreenContainer);

  // Ensure all images in the document are fully loaded before converting
  const reportImgs = Array.from(reportWrapper.querySelectorAll('img'));
  await Promise.all(reportImgs.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));

  // Check if html2pdf is loaded and download automatically
  if (typeof html2pdf !== 'undefined') {
    const btn = document.querySelector('button[onclick="generatePDFReport()"]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = 'Downloading PDF...';

    const opt = {
      margin: [10, 8, 10, 8],
      filename: pdfFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: [] }
    };

    try {
      await html2pdf().set(opt).from(reportWrapper).save();
    } catch (err) {
      console.error('html2pdf direct export failed:', err);
      openPrintWindowFallback(reportWrapper.innerHTML, pdfFilename);
    } finally {
      if (offscreenContainer && offscreenContainer.parentNode) {
        offscreenContainer.parentNode.removeChild(offscreenContainer);
      }
      if (btn) btn.innerHTML = originalText;
    }
  } else {
    openPrintWindowFallback(reportWrapper.innerHTML, pdfFilename);
    if (offscreenContainer && offscreenContainer.parentNode) {
      offscreenContainer.parentNode.removeChild(offscreenContainer);
    }
  }
}

async function downloadStudentDtrPdf(studentId) {
  const s = (cachedStudents || []).find(st => String(st.student_id) === String(studentId));
  if (!s) return alert('Student details not found.');

  const btn = document.getElementById('drawerDownloadDtrBtn');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = 'Downloading DTR PDF...';

  // Retrieve attendance logs for this student
  let studentLogs = (cachedLogs || []).filter(l => String(l.student_id) === String(studentId));
  if (studentLogs.length === 0) {
    try {
      const res = await fetch(API_BASE + 'admin_get_logs.php' + getDeanQueryParam());
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        cachedLogs = data.data;
        studentLogs = cachedLogs.filter(l => String(l.student_id) === String(studentId));
      }
    } catch (_) { }
  }

  // Sort logs by date descending
  studentLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

  const deanName = currentUser ? currentUser.full_name : 'Dean Admin';
  const dateTag = new Date().toISOString().slice(0, 10);
  const cleanName = (s.full_name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `DTR_${cleanName}_${s.student_number || 'Record'}_${dateTag}.pdf`;
  const logoUrl = getLogoDataUrl();

  const offscreenContainer = document.createElement('div');
  offscreenContainer.style.position = 'fixed';
  offscreenContainer.style.top = '0';
  offscreenContainer.style.left = '0';
  offscreenContainer.style.width = '695px';
  offscreenContainer.style.opacity = '0';
  offscreenContainer.style.pointerEvents = 'none';
  offscreenContainer.style.zIndex = '-9999';
  offscreenContainer.style.overflow = 'visible';

  const dtrWrapper = document.createElement('div');
  dtrWrapper.style.boxSizing = 'border-box';
  dtrWrapper.style.width = '695px';
  dtrWrapper.style.padding = '14px 16px';
  dtrWrapper.style.backgroundColor = '#ffffff';
  dtrWrapper.style.color = '#1e293b';
  dtrWrapper.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  dtrWrapper.style.fontSize = '10px';
  dtrWrapper.style.lineHeight = '1.35';

  dtrWrapper.innerHTML = `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #002d56; padding-bottom: 8px; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${logoUrl}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: contain; flex-shrink: 0;" alt="SBC Logo" onerror="this.style.display='none';">
        <div>
          <div style="font-size: 14px; font-weight: 800; color: #002d56; text-transform: uppercase; letter-spacing: 0.3px; margin: 0;">Southern Baptist College</div>
          <div style="font-size: 9.5px; font-weight: 600; color: #475569; margin-top: 2px;">Office of Student Affairs &amp; Internship Coordination</div>
          <div style="font-size: 10.5px; font-weight: 700; color: #047857; text-transform: uppercase; margin-top: 2px;">Official Daily Time Record (DTR)</div>
        </div>
      </div>
      <div style="text-align: right; font-size: 9px; color: #64748b; flex-shrink: 0; padding-left: 10px;">
        <strong style="color: #1e293b;">Date Issued:</strong><br>
        <span style="white-space: nowrap;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>

    <!-- Student Credentials Box -->
    <div style="display: flex; gap: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 7px 10px; border-radius: 5px; margin-bottom: 10px;">
      <div style="flex: 1; font-size: 9.5px;">
        <div><strong style="color: #002d56;">Intern Name:</strong> ${escapeHtml(s.full_name)}</div>
        <div style="margin-top: 2px;"><strong style="color: #002d56;">Student Number:</strong> ${escapeHtml(s.student_number)}</div>
        <div style="margin-top: 2px;"><strong style="color: #002d56;">Academic Program:</strong> ${escapeHtml(s.course_code)} — ${escapeHtml(s.course_name)}</div>
      </div>
      <div style="flex: 1; font-size: 9.5px;">
        <div><strong style="color: #002d56;">Active Facility:</strong> ${escapeHtml(s.site_name)} (${escapeHtml(s.site_location || '')})</div>
        <div style="margin-top: 2px;"><strong style="color: #002d56;">Total Rendered:</strong> ${s.formatted_time}</div>
        <div style="margin-top: 2px;"><strong style="color: #002d56;">Required Goal:</strong> ${s.required_hours} hours (${s.progress_percentage}%)</div>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 8.5px;">
      <thead>
        <tr style="background-color: #002d56; color: #ffffff;">
          <th style="width: 22%; padding: 6px 4px; text-align: left; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Date</th>
          <th style="width: 16%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Morning In</th>
          <th style="width: 16%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Morning Out</th>
          <th style="width: 16%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Afternoon In</th>
          <th style="width: 16%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Afternoon Out</th>
          <th style="width: 14%; padding: 6px 4px; text-align: center; font-weight: 700; font-size: 8px; text-transform: uppercase; border: 1px solid #002d56;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${studentLogs.length === 0 ? `
          <tr><td colspan="6" style="padding: 15px; text-align: center; color: #64748b; font-size: 9px; border: 1px solid #cbd5e1;">No attendance logs recorded yet.</td></tr>
        ` : studentLogs.map((l, idx) => `
          <tr style="background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; font-weight: 700; color: #1e293b; font-size: 8px;">${l.date}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; color: #475569; font-size: 8px; text-align: center;">${l.time_in_morning || '—'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; color: #475569; font-size: 8px; text-align: center;">${l.time_out_morning || '—'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; color: #475569; font-size: 8px; text-align: center;">${l.time_in_afternoon || '—'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; color: #475569; font-size: 8px; text-align: center;">${l.time_out_afternoon || '—'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center;">
              <span style="display: inline-block; padding: 2px 4px; border-radius: 3px; font-size: 7.5px; font-weight: 700; background-color: #dcfce7; color: #15803d; border: 1px solid #86efac;">
                ${l.attendance_status || 'Verified'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="margin-top: 20px; display: flex; justify-content: space-between;">
      <div style="width: 44%; text-align: center;">
        <div style="border-bottom: 1.5px solid #002d56; height: 26px; margin-bottom: 5px;"></div>
        <p style="font-weight: 700; font-size: 10px; color: #002d56; margin: 0;">${escapeHtml(s.full_name)}</p>
        <p style="font-size: 8.5px; color: #64748b; margin: 2px 0 0 0;">Student Intern Signature</p>
      </div>
      <div style="width: 44%; text-align: center;">
        <div style="border-bottom: 1.5px solid #002d56; height: 26px; margin-bottom: 5px;"></div>
        <p style="font-weight: 700; font-size: 10px; color: #002d56; margin: 0;">${escapeHtml(deanName)}</p>
        <p style="font-size: 8.5px; color: #64748b; margin: 2px 0 0 0;">Dean / OJT Coordinator</p>
      </div>
    </div>

    <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 5px; text-align: center; font-size: 7.5px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} Southern Baptist College &bull; Official Computer Generated Daily Time Record
    </div>
  `;

  offscreenContainer.appendChild(dtrWrapper);
  document.body.appendChild(offscreenContainer);

  const dtrImgs = Array.from(dtrWrapper.querySelectorAll('img'));
  await Promise.all(dtrImgs.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));

  try {
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: [10, 8, 10, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: [] }
      };
      await html2pdf().set(opt).from(dtrWrapper).save();
    } else {
      openPrintWindowFallback(dtrWrapper.innerHTML, filename);
    }
  } catch (err) {
    console.error('Error exporting student DTR PDF:', err);
    openPrintWindowFallback(dtrWrapper.innerHTML, filename);
  } finally {
    if (offscreenContainer && offscreenContainer.parentNode) {
      offscreenContainer.parentNode.removeChild(offscreenContainer);
    }
    if (btn) btn.innerHTML = originalText;
  }
}

function openPrintWindowFallback(innerHtml, title) {
  const printWin = window.open('', '_blank', 'width=900,height=750');
  if (printWin) {
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 10px; }
        </style>
      </head>
      <body>
        ${innerHtml}
        <script>
          window.onload = function() {
            window.print();
          };
        <\/script>
      </body>
      </html>
    `);
    printWin.document.close();
  } else {
    alert('Please allow popups to view and print the document.');
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

  currentModalPhotos = Array.isArray(photos) ? photos : [];
  currentModalPhotoIndex = 0;

  if (currentModalPhotos.length === 0) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No facial verification photos recorded for this log.</div>`;
  } else {
    container.innerHTML = currentModalPhotos.map((p, idx) => `
      <div style="margin-bottom: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); overflow: hidden; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
        <div style="padding: 0.55rem 0.85rem; background-color: var(--bg-canvas); font-weight: 700; font-size: 0.8rem; color: var(--navy-primary); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light);">
          <span>Shift: ${escapeHtml(p.shift_type)} &bull; Captured at ${escapeHtml(p.captured_at)}</span>
          <button type="button" class="btn-view-full-pill" onclick="openModalPhotoByIndex(${idx})" title="Click to view whole picture">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            View Whole Picture
          </button>
        </div>
        <div class="photo-preview-wrapper" onclick="openModalPhotoByIndex(${idx})" title="Click to view whole picture (Full Size)">
          <img src="${p.full_url}" class="verification-preview-img" alt="Shift: ${escapeHtml(p.shift_type)}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';">
          <div class="photo-hover-overlay">
            <span class="photo-hover-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
              Click to view whole picture
            </span>
          </div>
        </div>
      </div>
    `).join('');
  }

  if (confirmContainer) {
    if (attendanceId) {
      const logRecord = (cachedLogs || []).find(x => x.attendance_id == attendanceId);
      const hasM = logRecord ? ((logRecord.time_in_morning && logRecord.time_in_morning !== '--:--') || (logRecord.time_out_morning && logRecord.time_out_morning !== '--:--')) : true;
      const hasA = logRecord ? ((logRecord.time_in_afternoon && logRecord.time_in_afternoon !== '--:--') || (logRecord.time_out_afternoon && logRecord.time_out_afternoon !== '--:--')) : true;

      let modalActionsHtml = '';
      if (hasM) {
        modalActionsHtml += `
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem; flex: 1; min-width: 160px; background: #f8fafc;">
            <div style="font-weight: 700; font-size: 0.78rem; margin-bottom: 0.35rem; color: #1e293b;">Morning Shift</div>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-success" style="font-size: 0.75rem; padding: 0.35rem 0.7rem; font-weight: 700;" onclick="reviewAttendanceLog(${attendanceId}, 'Confirmed', 'morning'); closePhotoModal();">Confirm</button>
              <button class="btn btn-danger" style="font-size: 0.75rem; padding: 0.35rem 0.7rem; font-weight: 700;" onclick="reviewAttendanceLog(${attendanceId}, 'Rejected', 'morning'); closePhotoModal();">Reject</button>
            </div>
          </div>
        `;
      }
      if (hasA) {
        modalActionsHtml += `
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem; flex: 1; min-width: 160px; background: #f8fafc;">
            <div style="font-weight: 700; font-size: 0.78rem; margin-bottom: 0.35rem; color: #1e293b;">Afternoon Shift</div>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-success" style="font-size: 0.75rem; padding: 0.35rem 0.7rem; font-weight: 700;" onclick="reviewAttendanceLog(${attendanceId}, 'Confirmed', 'afternoon'); closePhotoModal();">Confirm</button>
              <button class="btn btn-danger" style="font-size: 0.75rem; padding: 0.35rem 0.7rem; font-weight: 700;" onclick="reviewAttendanceLog(${attendanceId}, 'Rejected', 'afternoon'); closePhotoModal();">Reject</button>
            </div>
          </div>
        `;
      }
      if (hasM && hasA) {
        modalActionsHtml += `
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem; flex: 1; min-width: 160px; background: #f8fafc;">
            <div style="font-weight: 700; font-size: 0.78rem; margin-bottom: 0.35rem; color: #1e293b;">Entire Day</div>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-success" style="font-size: 0.75rem; padding: 0.35rem 0.7rem; font-weight: 700;" onclick="reviewAttendanceLog(${attendanceId}, 'Confirmed', 'both'); closePhotoModal();">Confirm Both</button>
              <button class="btn btn-danger" style="font-size: 0.75rem; padding: 0.35rem 0.7rem; font-weight: 700;" onclick="reviewAttendanceLog(${attendanceId}, 'Rejected', 'both'); closePhotoModal();">Reject Both</button>
            </div>
          </div>
        `;
      }

      confirmContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.6rem; width: 100%;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--navy-primary);">Evaluate Shift Verification:</div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${modalActionsHtml}
          </div>
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

function openModalPhotoByIndex(idx) {
  if (!currentModalPhotos || !currentModalPhotos[idx]) return;
  currentModalPhotoIndex = idx;
  const p = currentModalPhotos[idx];
  const shiftLabel = p.shift_type ? `Shift: ${p.shift_type}` : 'Verification Photo';
  const timeLabel = p.captured_at ? `Captured at ${p.captured_at}` : '';
  openImageLightbox(p.full_url, shiftLabel, timeLabel, currentModalPhotos, idx);
}

function openLiveCaptureLightbox(idx) {
  if (!cachedLiveCaptures || !cachedLiveCaptures[idx]) return;
  const c = cachedLiveCaptures[idx];
  const title = `${c.full_name} (${c.student_number}) • Shift: ${c.shift_type}`;
  const subtitle = `Captured at ${c.captured_time} (${c.date}) • Facility: ${c.site_name || 'Assigned Site'}`;
  openImageLightbox(c.full_url, title, subtitle);
}

// Lightbox Core Functions
function openImageLightbox(imageUrl, title = 'Facial Verification Photo', subtitle = '', galleryItems = null, activeIndex = -1) {
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('imageLightboxImg');
  const titleEl = document.getElementById('imageLightboxTitle');
  const subtitleEl = document.getElementById('imageLightboxSubtitle');
  const externalBtn = document.getElementById('imageLightboxExternalBtn');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');
  const counterEl = document.getElementById('lightboxCounter');

  if (!modal || !img) return;

  currentLightboxGallery = Array.isArray(galleryItems) && galleryItems.length > 1 ? galleryItems : null;
  currentLightboxIndex = activeIndex;

  img.src = imageUrl;
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
  if (externalBtn) externalBtn.href = imageUrl;

  if (currentLightboxGallery && currentLightboxIndex >= 0) {
    if (prevBtn) prevBtn.style.display = 'inline-flex';
    if (nextBtn) nextBtn.style.display = 'inline-flex';
    if (counterEl) {
      counterEl.style.display = 'inline-block';
      counterEl.textContent = `${currentLightboxIndex + 1} / ${currentLightboxGallery.length}`;
    }
  } else {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (counterEl) counterEl.style.display = 'none';
  }

  modal.classList.add('active');
}

function navigateLightbox(direction) {
  if (!currentLightboxGallery || currentLightboxGallery.length <= 1) return;
  let newIdx = currentLightboxIndex + direction;
  if (newIdx < 0) newIdx = currentLightboxGallery.length - 1;
  if (newIdx >= currentLightboxGallery.length) newIdx = 0;

  openModalPhotoByIndex(newIdx);
}

function closeImageLightbox() {
  const modal = document.getElementById('imageLightboxModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function handleLightboxBackdropClick(event) {
  if (event.target.id === 'imageLightboxModal' || event.target.classList.contains('image-lightbox-body')) {
    closeImageLightbox();
  }
}

async function reviewAttendanceLog(attendanceId, action, shift = 'both') {
  let shiftLabel = 'Entire Day';
  if (shift === 'morning') shiftLabel = 'Morning Shift';
  if (shift === 'afternoon') shiftLabel = 'Afternoon Shift';

  const defaultPrompt = action === 'Rejected'
    ? (shift === 'morning' ? 'Morning Time-Out taken off-site / in car' : (shift === 'afternoon' ? 'Afternoon photo invalid / off-site' : 'Selfie photo invalid / not on-site'))
    : (shift === 'morning' ? 'Morning shift verified and confirmed' : (shift === 'afternoon' ? 'Afternoon shift verified and confirmed' : 'Attendance log confirmed by Dean of Student Affairs'));

  const remarks = prompt(`[${shiftLabel}] Enter Dean Administrative Remarks (${action}):\n(Type the exact remark you want to record and show to the student intern)`, defaultPrompt);
  if (remarks === null) return; // Dean clicked cancel

  try {
    const res = await fetch(API_BASE + 'admin_confirm_attendance.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attendance_id: attendanceId,
        dean_id: currentUser ? currentUser.user_id : 0,
        action: action,
        shift: shift,
        remarks: remarks.trim()
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message);
      fetchLogs();
      fetchOverview();
      fetchStudents();
    } else {
      alert(data.message || 'Operation failed.');
    }
  } catch (err) {
    console.error('Review attendance log error:', err);
    alert('Server error processing request.');
  }
}

async function openStudentDrawer(studentId) {
  // 1. Ensure student is found regardless of string vs int ID
  let s = (cachedStudents || []).find(st => String(st.student_id) === String(studentId));

  // If not found in memory cache, try fetching student list once
  if (!s) {
    try {
      const res = await fetch(API_BASE + 'admin_get_students.php' + getDeanQueryParam());
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        cachedStudents = data.data;
        s = cachedStudents.find(st => String(st.student_id) === String(studentId));
      }
    } catch (e) {
      console.error('Error fetching student for drawer:', e);
    }
  }

  if (!s) {
    alert('Student record could not be loaded. Please refresh the page.');
    return;
  }

  // 2. Ensure partner sites and courses are loaded for dropdowns
  if (!cachedSites || cachedSites.length === 0) {
    try {
      const resSites = await fetch(API_BASE + 'admin_sites.php');
      const dataSites = await resSites.json();
      if (dataSites.status === 'success' && dataSites.data) {
        cachedSites = dataSites.data;
      }
    } catch (_) { }
  }
  if (!cachedCourses || cachedCourses.length === 0) {
    try {
      await fetchCourses(false);
    } catch (_) { }
  }

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
        <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.3rem;">Active Partner Facility</div>
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

    <!-- Multi-Site Facilities Breakdown -->
    <div style="border: 1px solid var(--border-light); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--navy-primary);">🏢 Training Facilities & Logged Hours</div>
        <span style="font-size: 0.72rem; background: #fff8e1; color: #b7791f; padding: 2px 8px; border-radius: 12px; font-weight: 700;">
          ${(s.site_breakdown || []).length} ${(s.site_breakdown || []).length === 1 ? 'Site' : 'Sites'}
        </span>
      </div>
      <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.75rem;">
        Hours from earlier training sites remain recorded with their location label. Cumulative time continues at the active site.
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${(s.site_breakdown && s.site_breakdown.length > 0 ? s.site_breakdown : [{
      site_name: s.site_name,
      location: s.site_location,
      is_current: true,
      label: 'Current Location',
      formatted_time: s.formatted_time,
      total_days: s.total_days
    }]).map(st => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; border-radius: 6px; background: ${st.is_current ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${st.is_current ? '#86efac' : 'var(--border-light)'};">
            <div>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span style="font-weight: 700; font-size: 0.84rem; color: ${st.is_current ? 'var(--navy-primary)' : '#475569'};">${escapeHtml(st.site_name)}</span>
                <span style="font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 10px; background: ${st.is_current ? '#2e7d32' : '#64748b'}; color: #fff;">
                  ${st.is_current ? 'CURRENT LOCATION' : 'PREVIOUS LOCATION'}
                </span>
              </div>
              <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(st.location || '')} &bull; ${st.total_days || 0} attendance day(s)</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.85rem; font-weight: 800; color: ${st.is_current ? '#166534' : '#334155'};">${st.formatted_time || '0 hrs 0 mins'}</div>
              <div style="font-size: 0.68rem; color: var(--text-muted);">${st.is_current ? 'Active Site Hours' : 'Hours from earlier site'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Dean Controls: Reassign Course -->
    <div style="border: 1px solid var(--border-light); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem; background: var(--bg-canvas);">
      <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem;">🎓 Reassign Academic Program</div>
      <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <select id="drawerCourseSelect" style="flex: 1; min-width: 180px; padding: 0.5rem 0.75rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 0.85rem; background: #fff; color: var(--navy-primary); font-weight: 600;">
          ${(cachedCourses || []).map(c => `<option value="${c.course_id}" ${c.course_id == s.course_id ? 'selected' : ''}>${escapeHtml(c.course_code)} — ${escapeHtml(c.course_name)} (${c.required_hours}h)</option>`).join('')}
        </select>
        <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.82rem; white-space: nowrap;" onclick="saveStudentAssignedCourse(${s.student_id})">Save Program</button>
      </div>
    </div>

    <!-- Dean Controls: Transfer Training Facility -->
    <div style="border: 1px solid var(--border-light); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem; background: var(--bg-canvas);">
      <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem;">🏢 Transfer Partner Training Facility</div>
      <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <select id="drawerSiteSelect" style="flex: 1; min-width: 180px; padding: 0.5rem 0.75rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 0.85rem; background: #fff; color: var(--navy-primary); font-weight: 600;">
          ${(cachedSites || []).map(st => `<option value="${st.site_id}" ${st.site_id == s.site_id ? 'selected' : ''}>${escapeHtml(st.site_name)} (${escapeHtml(st.location || '')})</option>`).join('')}
        </select>
        <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.82rem; white-space: nowrap;" onclick="saveStudentAssignedSite(${s.student_id})">Transfer Site</button>
      </div>
    </div>

    <!-- Dean Controls: Custom Hours -->
    <div style="border: 1px solid var(--border-light); padding: 1rem; border-radius: var(--radius-sm); background: var(--bg-canvas);">
      <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem;">⏱️ Override Required Internship Hours</div>
      <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.6rem;">
        ${[240, 300, 480, 500, 600].map(h => `<button class="btn-preset-chip ${s.required_hours == h ? 'active' : ''}" onclick="setDrawerPresetHours(${h})">${h}h</button>`).join('')}
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="number" id="drawerHoursInput" value="${s.required_hours}" min="1" max="9999" style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 700; color: var(--navy-primary); background: #fff; max-width: 130px;">
        <span style="font-size: 0.82rem; color: var(--text-muted);">hours total</span>
        <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.82rem; white-space: nowrap;" onclick="saveStudentCustomHours(${s.student_id})">Save Hours</button>
      </div>
    </div>
  `;

  const modal = document.getElementById('studentDetailsModal');
  if (modal) {
    modal.classList.add('active');
  }

  const dtrBtn = document.getElementById('drawerDownloadDtrBtn');
  if (dtrBtn) {
    dtrBtn.onclick = () => downloadStudentDtrPdf(s.student_id);
  }
}

function setDrawerPresetHours(hours) {
  const input = document.getElementById('drawerHoursInput');
  if (input) input.value = hours;
  document.querySelectorAll('.btn-preset-chip').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.textContent, 10) === hours);
  });
}

function closeStudentDetailsModal() {
  const modal = document.getElementById('studentDetailsModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

window.openStudentDrawer = openStudentDrawer;
window.closeStudentDetailsModal = closeStudentDetailsModal;
window.setDrawerPresetHours = setDrawerPresetHours;
window.downloadStudentDtrPdf = downloadStudentDtrPdf;
window.generatePDFReport = generatePDFReport;
window.openJournalModal = openJournalModal;
window.closeJournalModal = closeJournalModal;
window.saveJournalEvaluation = saveJournalEvaluation;
window.deleteJournal = deleteJournal;
window.deleteAllFilteredJournals = deleteAllFilteredJournals;
window.setJournalDateFilter = setJournalDateFilter;
window.handleJournalDateSelectChange = handleJournalDateSelectChange;
window.handleJournalCustomDateChange = handleJournalCustomDateChange;
window.handleJournalStatusFilterChange = handleJournalStatusFilterChange;
window.handleJournalSiteFilterChange = handleJournalSiteFilterChange;
window.handleJournalCourseFilterChange = handleJournalCourseFilterChange;
window.resetJournalFilters = resetJournalFilters;
window.handleModalDeleteJournal = handleModalDeleteJournal;

function filterActiveTable(query) {
  if (!query) {
    if (currentTab === 'students') filterByCourse(currentCourseFilter, false);
    if (currentTab === 'logs') filterLogsByCourse(currentLogsCourseFilter, false);
    if (currentTab === 'absences') renderAbsencesTable(cachedAbsences);
    if (currentTab === 'journals') applyJournalFilters('');
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
    applyLogsFilters(query);
  } else if (currentTab === 'absences') {
    const filtered = cachedAbsences.filter(a => a.full_name.toLowerCase().includes(query) || a.student_number.toLowerCase().includes(query) || a.reason.toLowerCase().includes(query));
    renderAbsencesTable(filtered);
  } else if (currentTab === 'journals') {
    applyJournalFilters(query);
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
          <button class="btn btn-outline" style="margin-right:0.4rem;" onclick='openEditCourseModal(${JSON.stringify(c).replace(/'/g, "&apos;")})'>Edit</button>
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
  const course_id = document.getElementById('courseIdInput').value;
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
  const allCount = cachedStudents.length;
  const allLogs = cachedLogs.length;

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
  if (sf) { const cur = sf.value; sf.innerHTML = studentOptions; sf.value = cachedCourses.some(c => c.course_code === cur) || cur === 'ALL' ? cur : 'ALL'; }

  const lf = document.getElementById('logsCourseSelectFilter');
  if (lf) { const cur = lf.value; lf.innerHTML = logsOptions; lf.value = cachedCourses.some(c => c.course_code === cur) || cur === 'ALL' ? cur : 'ALL'; }

  const rf = document.getElementById('reportCourseFilterSelect');
  if (rf) { const cur = rf.value; rf.innerHTML = reportOptions; rf.value = cachedCourses.some(c => c.course_code === cur) || cur === 'ALL' ? cur : 'ALL'; }
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

async function saveStudentAssignedSite(studentId) {
  const sel = document.getElementById('drawerSiteSelect');
  if (!sel) return;
  const new_site_id = parseInt(sel.value, 10);
  if (!new_site_id) return;

  try {
    const res = await fetch(API_BASE + 'update_student_site.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        new_site_id: new_site_id,
        remarks: 'Transferred by Dean of Student Affairs'
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(data.message || 'Training site transferred successfully. Previous hours preserved.');
      await fetchStudents();
      openStudentDrawer(studentId);
    } else {
      alert(data.message || 'Failed to transfer site.');
    }
  } catch (err) {
    console.error('Save student site error:', err);
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

// ─── ACADEMIC YEAR-END BATCH ARCHIVE & STORAGE RESET ─────────────────────────

function downloadBatchArchive() {
  // 1. Export CSV
  exportCSVReport();

  // 2. Generate PDF Report after brief delay
  setTimeout(() => {
    generatePDFReport();
  }, 600);

  alert('📥 School-Year Archive is downloading!\n\nPlease save both the CSV Spreadsheet and PDF Report to the SBC Dean\'s Google Drive or local archive folder before executing a batch purge.');
}

function openBatchResetModal() {
  const modal = document.getElementById('batchResetModal');
  const chk = document.getElementById('chkBackupDownloaded');
  const txt = document.getElementById('txtResetConfirmation');
  const btn = document.getElementById('btnExecuteBatchReset');

  if (chk) chk.checked = false;
  if (txt) txt.value = '';
  if (btn) btn.disabled = true;

  if (modal) modal.classList.add('active');
}

function closeBatchResetModal() {
  const modal = document.getElementById('batchResetModal');
  if (modal) modal.classList.remove('active');
}

function validateBatchResetForm() {
  const chk = document.getElementById('chkBackupDownloaded');
  const txt = document.getElementById('txtResetConfirmation');
  const btn = document.getElementById('btnExecuteBatchReset');

  const isChecked = chk ? chk.checked : false;
  const isConfirmed = txt ? (txt.value.trim().toUpperCase() === 'RESET') : false;

  if (btn) {
    btn.disabled = !(isChecked && isConfirmed);
  }
}

async function executeBatchReset() {
  const chk = document.getElementById('chkBackupDownloaded');
  const txt = document.getElementById('txtResetConfirmation');

  if (!chk || !chk.checked || !txt || txt.value.trim().toUpperCase() !== 'RESET') {
    alert('Please confirm that you have saved the archive backup and type RESET.');
    return;
  }

  const btn = document.getElementById('btnExecuteBatchReset');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Purging Cohort & Freeing Storage...';
  }

  try {
    const res = await fetch(API_BASE + 'admin_year_end_reset.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmation_code: 'RESET',
        dean_id: currentUser ? currentUser.user_id : 0,
        scope: 'all_students'
      })
    });

    const data = await res.json();
    if (data.status === 'success') {
      closeBatchResetModal();
      alert(`✓ ${data.message}`);
      fetchAllData();
    } else {
      alert(`⚠️ ${data.message || 'Batch reset failed.'}`);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  } catch (err) {
    console.error('Batch reset error:', err);
    alert('Server error executing annual batch reset.');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
}

window.downloadBatchArchive = downloadBatchArchive;
window.openBatchResetModal = openBatchResetModal;
window.closeBatchResetModal = closeBatchResetModal;
window.validateBatchResetForm = validateBatchResetForm;
window.executeBatchReset = executeBatchReset;
window.handleStudentFilterChange = handleStudentFilterChange;
window.applyStudentFilters = applyStudentFilters;
window.applyAbsenceFilters = applyAbsenceFilters;
window.filterReportByCourse = filterReportByCourse;
window.filterReportByStatus = filterReportByStatus;
window.filterReportBySite = filterReportBySite;


