/* ══════════════════════════════════════════════════
   LEEDS ALCHEMY — Admin Panel Scripts
══════════════════════════════════════════════════ */

// Keys loaded from config.js (gitignored)
let supabaseClient = null;
try {
  if (typeof CONFIG !== 'undefined') {
    supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  } else {
    console.error('config.js not found. Copy config.example.js to config.js and add your keys.');
  }
} catch (e) {
  console.error('Failed to initialize Supabase:', e);
}

/* ──────────────────────────────────────
   DETECT WHICH PAGE WE'RE ON
────────────────────────────────────── */

const isLoginPage = document.body.classList.contains('login-page');
const isDashboardPage = document.body.classList.contains('dashboard-page');
const isContentPage = document.body.classList.contains('content-page');

if (isLoginPage) initLoginPage();
if (isDashboardPage) initDashboardPage();
if (isContentPage) initContentPage();


/* ══════════════════════════════════════════════════
   LOGIN PAGE
══════════════════════════════════════════════════ */

async function initLoginPage() {
  // If already logged in, redirect to dashboard
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = '/admin/dashboard/';
    return;
  }

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const togglePassword = document.getElementById('togglePassword');

  // Toggle password visibility
  togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
    togglePassword.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
  });

  // Handle login
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    loginBtn.disabled = true;
    loginBtn.innerHTML = 'Signing in...';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      loginError.textContent = 'Invalid email or password. Please try again.';
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Sign In <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      return;
    }

    window.location.href = '/admin/dashboard/';
  });
}


/* ══════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════ */

let allMessages = [];
let messagesChart = null;

async function initDashboardPage() {
  // Check auth - redirect if not logged in
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = '/admin/';
    return;
  }

  // Show admin email
  const adminEmailEl = document.getElementById('adminEmail');
  if (adminEmailEl) {
    adminEmailEl.textContent = session.user.email;
  }

  // Set today's date
  const dateEl = document.getElementById('dashboardDate');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/admin/';
  });

  // Refresh handler
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadDashboardData();
  });

  // Search handler
  document.getElementById('tableSearch').addEventListener('input', (e) => {
    filterTable(e.target.value.trim().toLowerCase());
  });

  // Chart filter handlers
  document.querySelectorAll('.chart-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const range = parseInt(btn.dataset.range);
      renderChart(range);
    });
  });

  // Load data
  await loadDashboardData();
}


/* ─── Load Dashboard Data ─── */

async function loadDashboardData() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.classList.add('spinning');

  try {
    const { data, error } = await supabaseClient
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
      document.getElementById('messagesBody').innerHTML =
        '<tr class="empty-row"><td colspan="8">Failed to load messages. Check your database permissions.</td></tr>';
      return;
    }

    allMessages = data || [];
    updateStats();
    renderChart(7);
    renderTable(allMessages);

  } catch (err) {
    console.error('Dashboard error:', err);
  } finally {
    if (refreshBtn) refreshBtn.classList.remove('spinning');
  }
}


/* ─── Update Stats Cards ─── */

function updateStats() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const total = allMessages.length;
  const today = allMessages.filter(m => m.created_at && m.created_at.startsWith(todayStr)).length;
  const week = allMessages.filter(m => m.created_at && new Date(m.created_at) >= weekAgo).length;
  const uniqueEmails = new Set(allMessages.map(m => m.email)).size;

  animateValue('totalMessages', total);
  animateValue('todayMessages', today);
  animateValue('weekMessages', week);
  animateValue('uniqueEmails', uniqueEmails);
}

function animateValue(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const duration = 800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}


/* ─── Render Chart ─── */

function renderChart(days) {
  const ctx = document.getElementById('messagesChart');
  if (!ctx) return;

  // Build date labels and counts
  const labels = [];
  const counts = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    labels.push(date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
    counts.push(
      allMessages.filter(m => m.created_at && m.created_at.startsWith(dateStr)).length
    );
  }

  if (messagesChart) {
    messagesChart.destroy();
  }

  messagesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Messages',
        data: counts,
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        borderColor: '#2563EB',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(37, 99, 235, 0.3)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          titleFont: { family: "'DM Sans', sans-serif", size: 13 },
          bodyFont: { family: "'DM Sans', sans-serif", size: 13 },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context) => `${context.parsed.y} message${context.parsed.y !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'DM Sans', sans-serif", size: 12 },
            color: '#8896AB',
            maxRotation: 45
          },
          border: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: { family: "'DM Sans', sans-serif", size: 12 },
            color: '#8896AB',
            stepSize: 1,
            precision: 0
          },
          grid: {
            color: 'rgba(15, 23, 42, 0.05)',
            drawBorder: false
          },
          border: { display: false }
        }
      }
    }
  });
}


/* ─── Render Table ─── */

function renderTable(messages) {
  const tbody = document.getElementById('messagesBody');
  const countEl = document.getElementById('tableCount');
  if (!tbody) return;

  if (messages.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No messages found.</td></tr>';
    if (countEl) countEl.textContent = '0 messages';
    return;
  }

  if (countEl) countEl.textContent = `${messages.length} message${messages.length !== 1 ? 's' : ''}`;

  tbody.innerHTML = messages.map(m => {
    const date = m.created_at
      ? new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';
    const time = m.created_at
      ? new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '';

    const serviceClass = getServiceClass(m.service_type);
    const serviceLabel = m.service_type || '—';

    return `
      <tr>
        <td>${date}<br><span style="font-size:12px;color:var(--t3)">${time}</span></td>
        <td>${escapeHtml(m.name || '—')}</td>
        <td><a href="mailto:${escapeHtml(m.email || '')}" style="color:var(--accent);text-decoration:none">${escapeHtml(m.email || '—')}</a></td>
        <td>${escapeHtml(m.phone || '—')}</td>
        <td><span class="service-badge ${serviceClass}">${escapeHtml(serviceLabel)}</span></td>
        <td>${escapeHtml(m.budget_range || '—')}</td>
        <td>${escapeHtml(m.timeline || '—')}</td>
        <td class="message-cell" onclick="this.classList.toggle('expanded')">
          <div class="msg-text">${escapeHtml(m.message || '—')}</div>
        </td>
      </tr>
    `;
  }).join('');
}

function getServiceClass(serviceType) {
  if (!serviceType) return 'other';
  const s = serviceType.toLowerCase();
  if (s.includes('ai')) return 'ai';
  if (s.includes('automation')) return 'automation';
  if (s.includes('app')) return 'app';
  if (s.includes('full') || s.includes('package')) return 'full';
  return 'other';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


/* ══════════════════════════════════════════════════
   CONTENT PAGE
══════════════════════════════════════════════════ */

async function initContentPage() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = '/admin/';
    return;
  }

  const adminEmailEl = document.getElementById('adminEmail');
  if (adminEmailEl) adminEmailEl.textContent = session.user.email;

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/admin/';
  });
}


/* ─── Filter Table ─── */

function filterTable(query) {
  if (!query) {
    renderTable(allMessages);
    return;
  }

  const filtered = allMessages.filter(m => {
    return (
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.email && m.email.toLowerCase().includes(query)) ||
      (m.phone && m.phone.toLowerCase().includes(query)) ||
      (m.service_type && m.service_type.toLowerCase().includes(query)) ||
      (m.message && m.message.toLowerCase().includes(query)) ||
      (m.budget_range && m.budget_range.toLowerCase().includes(query))
    );
  });

  renderTable(filtered);
}
