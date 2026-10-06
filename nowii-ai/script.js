'use strict';

/* =========================================================
   NOWII·AI — Enterprise AI Operations Platform
   ========================================================= */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const KEYS = {
  THEME: 'nowii_theme',
  DENSITY: 'nowii_density',
  ANIM: 'nowii_anim',
  MAGNETIC: 'nowii_magnetic',
  AUTO_REFRESH: 'nowii_auto_refresh',
  WORKSPACE: 'nowii_workspace',
  NOTIF_CRITICAL: 'nowii_notif_critical',
  NOTIF_DEPLOY: 'nowii_notif_deploy',
  NOTIF_CUSTOMER: 'nowii_notif_customer',
  NOTIF_WEEKLY: 'nowii_notif_weekly',
  ONBOARDING: 'nowii_onboarding_done'
};

/* =========================================================
   STATE
   ========================================================= */
let state = {
  currentView: 'overview',
  currentRange: '24h',
  opsFilter: { sev: 'all', search: '', sortField: 'time', sortDir: 'desc' },
  custFilter: { plan: 'all', search: '', sort: 'mrr-desc', sortField: null, sortDir: null },
  selectedOps: new Set(),
  selectedCust: new Set(),
  copilotHistory: [],
  drawerHistory: [],
  theme: localStorage.getItem(KEYS.THEME) || 'dark',
  density: localStorage.getItem(KEYS.DENSITY) || 'default',
  anim: localStorage.getItem(KEYS.ANIM) !== 'false',
  magnetic: localStorage.getItem(KEYS.MAGNETIC) !== 'false',
  autoRefresh: localStorage.getItem(KEYS.AUTO_REFRESH) === 'true',
  workspace: localStorage.getItem(KEYS.WORKSPACE) || 'acme',
  autoRefreshTimer: null,
  searchIndex: 0,
  searchResults: []
};

/* =========================================================
   ICONS
   ========================================================= */
const ICONS = {
  revenue: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>`,
  up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7h-8M17 7v8"/></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l10 10M17 17h-8M17 17V9"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H8a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V8a1.65 1.65 0 001.51 1H22a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
};

/* =========================================================
   DATA
   ========================================================= */
const DATA = {
  kpis: [
    { id: 'mrr', label: 'Monthly Recurring Revenue', value: 284320, format: 'currency', delta: 12.4, trend: 'up', icon: 'revenue', spark: 'up' },
    { id: 'users', label: 'Active Users', value: 48392, format: 'number', delta: 8.1, trend: 'up', icon: 'users', spark: 'up' },
    { id: 'latency', label: 'API Response Time', value: 142, format: 'ms', delta: -18, trend: 'up', icon: 'zap', spark: 'down' },
    { id: 'incidents', label: 'Incidents (24h)', value: 3, format: 'number', delta: -42, trend: 'up', icon: 'alert', spark: 'down' }
  ],

  services: [
    { name: 'api-gateway', status: 'ok', load: 24, region: 'eu-west-1' },
    { name: 'auth-service', status: 'ok', load: 18, region: 'eu-west-1' },
    { name: 'billing-worker', status: 'warn', load: 82, region: 'eu-west-1' },
    { name: 'notification-svc', status: 'ok', load: 31, region: 'us-east-1' },
    { name: 'analytics-engine', status: 'ok', load: 56, region: 'us-east-1' },
    { name: 'search-indexer', status: 'err', load: 0, region: 'ap-south-1' }
  ],

  events: [
    { id: 'EVT-4821', severity: 'critical', title: 'search-indexer pod crashed — OOMKilled', service: 'search-indexer', region: 'ap-south-1', time: '14:32', timestamp: Date.now() - 120000, log: `14:32:18 [WARN] Memory usage at 94%\n14:32:24 [WARN] Memory usage at 98%\n14:32:31 [ERR] Out of memory — process killed\n14:32:33 [INFO] Restarting pod...\n14:32:45 [ERR] CrashLoopBackOff` },
    { id: 'EVT-4820', severity: 'warning', title: 'billing-worker CPU above 80% for 15 min', service: 'billing-worker', region: 'eu-west-1', time: '14:18', timestamp: Date.now() - 900000, log: `14:03:00 [INFO] CPU: 82%\n14:08:00 [INFO] CPU: 85%\n14:13:00 [INFO] CPU: 88%\n14:18:00 [WARN] Sustained high CPU` },
    { id: 'EVT-4819', severity: 'success', title: 'Deployment completed: api-gateway v2.14.3', service: 'api-gateway', region: 'global', time: '14:05', timestamp: Date.now() - 1800000, log: `14:03:00 [INFO] Starting rollout\n14:03:45 [INFO] Pod 1/3 ready\n14:04:30 [INFO] Pod 2/3 ready\n14:05:00 [OK] Rollout complete` },
    { id: 'EVT-4818', severity: 'warning', title: 'Elevated 5xx rate on api-gateway', service: 'api-gateway', region: 'eu-west-1', time: '13:48', timestamp: Date.now() - 2700000, log: `13:45:00 [WARN] 5xx rate: 2.4%\n13:47:00 [WARN] 5xx rate: 3.1%\n13:48:00 [WARN] Correlated with deploy #4821` },
    { id: 'EVT-4817', severity: 'info', title: 'New customer: Pinnacle Group signed', service: 'billing', region: 'us-east-1', time: '13:22', timestamp: Date.now() - 4200000, log: `13:22:15 [INFO] New subscription created\n13:22:16 [INFO] Plan: Starter\n13:22:17 [OK] Welcome email sent` },
    { id: 'EVT-4816', severity: 'critical', title: 'Database connection pool saturated', service: 'db-primary', region: 'eu-west-1', time: '12:55', timestamp: Date.now() - 5400000, log: `12:53:00 [WARN] Pool: 90/100\n12:54:00 [WARN] Pool: 98/100\n12:55:00 [ERR] Connection timeout\n12:56:00 [INFO] Auto-scaled pool to 200` },
    { id: 'EVT-4815', severity: 'success', title: 'Analytics pipeline recovered', service: 'analytics-engine', region: 'us-east-1', time: '12:30', timestamp: Date.now() - 7200000, log: `12:28:00 [INFO] Retrying consumer...\n12:29:30 [INFO] Consumer resumed\n12:30:00 [OK] Lag: 0 messages` },
    { id: 'EVT-4814', severity: 'info', title: 'SSL certificate renewed for *.acme.com', service: 'nginx-edge', region: 'global', time: '11:50', timestamp: Date.now() - 9000000, log: `11:50:12 [INFO] Fetching certificate\n11:50:30 [INFO] Certificate renewed\n11:50:31 [OK] Reloaded nginx` },
    { id: 'EVT-4813', severity: 'warning', title: 'Slow query detected on reports DB', service: 'db-reports', region: 'us-east-1', time: '10:15', timestamp: Date.now() - 14400000, log: `10:15:00 [WARN] Query took 4.2s\n10:15:01 [WARN] Missing index on user_id` },
    { id: 'EVT-4812', severity: 'success', title: 'Nightly backup completed', service: 'backup-worker', region: 'global', time: '03:00', timestamp: Date.now() - 43200000, log: `03:00:00 [INFO] Starting backup\n03:02:14 [INFO] Snapshot complete (12.4 GB)\n03:02:15 [OK] Uploaded to S3` }
  ],

  customers: [
    { id: 'c1', name: 'Acme Industries', email: 'hello@acme-industries.com', plan: 'enterprise', mrr: 12400, users: 340, health: 92, sentiment: 'positive', lastAccess: '2 min ago', joined: '2023-04-12', region: 'EU', color: '#2563eb' },
    { id: 'c2', name: 'Vertex Labs', email: 'team@vertexlabs.io', plan: 'enterprise', mrr: 8900, users: 178, health: 78, sentiment: 'positive', lastAccess: '1 ora fa', joined: '2023-06-08', region: 'US', color: '#8b5cf6' },
    { id: 'c3', name: 'Blue Horizon', email: 'info@bluehorizon.co', plan: 'enterprise', mrr: 14200, users: 512, health: 88, sentiment: 'positive', lastAccess: '12 min ago', joined: '2022-11-30', region: 'EU', color: '#06b6d4' },
    { id: 'c4', name: 'Orion Analytics', email: 'contact@orion-analytics.ai', plan: 'pro', mrr: 4100, users: 89, health: 94, sentiment: 'positive', lastAccess: '30 min ago', joined: '2024-01-15', region: 'US', color: '#10b981' },
    { id: 'c5', name: 'Northwind Retail', email: 'support@northwind-retail.com', plan: 'pro', mrr: 3200, users: 64, health: 45, sentiment: 'negative', lastAccess: '3 giorni fa', joined: '2023-08-22', region: 'EU', color: '#f59e0b' },
    { id: 'c6', name: 'Quantum Systems', email: 'hello@quantumsys.dev', plan: 'pro', mrr: 2800, users: 47, health: 32, sentiment: 'negative', lastAccess: '8 giorni fa', joined: '2023-02-10', region: 'APAC', color: '#ef4444' },
    { id: 'c7', name: 'Pinnacle Group', email: 'admin@pinnacle-group.com', plan: 'starter', mrr: 890, users: 12, health: 65, sentiment: 'neutral', lastAccess: '2 giorni fa', joined: '2024-09-03', region: 'EU', color: '#a855f7' },
    { id: 'c8', name: 'Nova Digital', email: 'team@novadigital.com', plan: 'pro', mrr: 3600, users: 73, health: 81, sentiment: 'positive', lastAccess: '45 min ago', joined: '2023-10-19', region: 'US', color: '#ec4899' }
  ],

  team: [
    { name: 'nowii-core', initials: 'NC', role: 'Admin', dept: 'Engineering', status: 'online', lastAccess: 'Ora', perms: 'Full access', color: '#2563eb' },
    { name: 'Giulia Bianchi', initials: 'GB', role: 'Product Manager', dept: 'Product', status: 'online', lastAccess: '5 min ago', perms: 'Read/Write', color: '#ec4899' },
    { name: 'Marco Rossi', initials: 'MR', role: 'SRE Lead', dept: 'Operations', status: 'online', lastAccess: '12 min ago', perms: 'Full access', color: '#10b981' },
    { name: 'Elena Greco', initials: 'EG', role: 'Backend Engineer', dept: 'Engineering', status: 'away', lastAccess: '2 ore fa', perms: 'Read/Write', color: '#f59e0b' },
    { name: 'Luca Ferrari', initials: 'LF', role: 'Data Engineer', dept: 'Data', status: 'online', lastAccess: '1 min ago', perms: 'Read/Write', color: '#06b6d4' },
    { name: 'Sofia Marchetti', initials: 'SM', role: 'Security Engineer', dept: 'Security', status: 'offline', lastAccess: 'Ieri', perms: 'Read only', color: '#8b5cf6' },
    { name: 'Davide Riva', initials: 'DR', role: 'Frontend Engineer', dept: 'Engineering', status: 'away', lastAccess: '4 ore fa', perms: 'Read/Write', color: '#ef4444' },
    { name: 'Sara Colombo', initials: 'SC', role: 'Customer Success', dept: 'Support', status: 'offline', lastAccess: '2 giorni fa', perms: 'Read only', color: '#22d3ee' }
  ],

  reports: [
    { id: 'r1', title: 'Weekly Operations Summary', desc: 'Uptime, incidenti e deploy degli ultimi 7 giorni', date: '26 Feb 2026', size: '2.4 MB', status: 'ready', type: 'weekly' },
    { id: 'r2', title: 'Monthly Revenue Report', desc: 'Analisi MRR per segmento e piano', date: '01 Feb 2026', size: '1.8 MB', status: 'ready', type: 'monthly' },
    { id: 'r3', title: 'Customer Churn Analysis', desc: 'Cohort analysis con predizioni AI', date: '28 Gen 2026', size: '3.1 MB', status: 'ready', type: 'monthly' },
    { id: 'r4', title: 'Security Audit Log', desc: 'Eventi di autenticazione e anomalie rilevate', date: '15 Gen 2026', size: '4.2 MB', status: 'ready', type: 'incident' },
    { id: 'r5', title: 'Performance Benchmark Q4', desc: 'Latenza P50/P95/P99 per endpoint', date: '08 Gen 2026', size: '1.5 MB', status: 'ready', type: 'weekly' },
    { id: 'r6', title: 'Compliance SOC2 Report', desc: 'Controls, evidence e stato remediation', date: '20 Dic 2025', size: '5.7 MB', status: 'ready', type: 'incident' }
  ],

  notifications: [
    { type: 'critical', title: 'search-indexer down', body: 'Regione ap-south-1 · pod in CrashLoopBackOff', time: '2 min fa', read: false },
    { type: 'warning', title: 'High CPU su billing-worker', body: 'Sopra 80% da 15 minuti', time: '18 min fa', read: false },
    { type: 'success', title: 'Deploy completato', body: 'api-gateway v2.14.3 · produzione', time: '1 ora fa', read: false },
    { type: 'info', title: 'Nuovo cliente', body: 'Pinnacle Group ha attivato il piano Starter', time: '2 ore fa', read: false },
    { type: 'success', title: 'Backup notturno completato', body: 'Snapshot da 12.4 GB caricato su S3', time: '11 ore fa', read: true },
    { type: 'info', title: 'Nuovo membro nel team', body: 'Davide Riva è stato aggiunto al workspace', time: 'Ieri', read: true }
  ],

  regions: [
    { name: 'EU West (Ireland)', value: 42, pct: 42 },
    { name: 'US East (N. Virginia)', value: 28, pct: 28 },
    { name: 'US West (Oregon)', value: 15, pct: 15 },
    { name: 'AP South (Mumbai)', value: 9, pct: 9 },
    { name: 'AP Northeast (Tokyo)', value: 6, pct: 6 }
  ],

  topServices: [
    { name: 'api-gateway', value: '2.4M req', pct: 88 },
    { name: 'auth-service', value: '1.2M req', pct: 62 },
    { name: 'analytics-engine', value: '890K req', pct: 45 },
    { name: 'notification-svc', value: '412K req', pct: 28 },
    { name: 'billing-worker', value: '98K req', pct: 12 }
  ],

  audit: [
    { action: 'Marco Rossi', detail: 'ha avviato un nuovo deployment su produzione', time: '14:18' },
    { action: 'System', detail: 'auto-scaled billing-worker da 2 a 4 repliche', time: '14:12' },
    { action: 'Giulia Bianchi', detail: 'ha invitato 3 nuovi membri al workspace', time: '13:55' },
    { action: 'Elena Greco', detail: 'ha modificato le regole firewall per db-reports', time: '13:22' },
    { action: 'System', detail: 'backup automatico completato con successo', time: '03:00' },
    { action: 'Sofia Marchetti', detail: 'ha ruotato le API key di billing-service', time: '02:30' }
  ]
};

/* =========================================================
   UTILS
   ========================================================= */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatCurrency(n) { return '€' + n.toLocaleString('it-IT'); }
function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'ora';
  if (diff < 3600) return Math.floor(diff / 60) + ' min fa';
  if (diff < 86400) return Math.floor(diff / 3600) + ' ore fa';
  return Math.floor(diff / 86400) + ' giorni fa';
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function initialsOf(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function toast(text, type = 'info') {
  const container = $('#toastContainer');
  const iconMap = {
    success: ICONS.check,
    info: ICONS.sparkle,
    warning: ICONS.alert,
    error: ICONS.x
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${iconMap[type] || ICONS.sparkle}</span><span>${escapeHtml(text)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

function generateSparkline(type) {
  const points = [];
  let v = 20;
  for (let i = 0; i < 20; i++) {
    if (type === 'up') v -= 0.6 + Math.random() * 0.4;
    else if (type === 'down') v += 0.6 + Math.random() * 0.4;
    else v += (Math.random() - 0.5) * 1.2;
    v = Math.max(4, Math.min(36, v));
    points.push([i * 4.2, v]);
  }
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
}

function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); return true; } catch { return false; }
    finally { ta.remove(); }
  }
}

/* =========================================================
   INIT
   ========================================================= */
function init() {
  applySettings();
  renderAll();
  bindEvents();
  setupMagnetic();

  if (state.autoRefresh) startAutoRefresh();

  setTimeout(() => {
    const splash = $('#splash');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(() => splash.remove(), 600);
    }
    $('#app').classList.add('ready');
    showOnboardingIfNeeded();
  }, 1600);

  setInterval(() => {
    const el = $('#lastUpdate');
    if (el) el.textContent = 'ora';
  }, 60000);

  window.addEventListener('resize', debounce(() => {
    if (state.currentView === 'overview') {
      drawRevenueChart();
      drawMap();
    }
  }, 200));
}

function renderAll() {
  renderKPIs();
  renderChartStats();
  renderServices();
  renderEvents();
  renderRegions();
  renderTopServices();
  renderAudit();
  renderOpsStats();
  renderOpsTable();
  renderCustStats();
  renderCustomers();
  renderReports();
  renderTeamStats();
  renderTeam();
  renderNotifications();
  drawRevenueChart();
  drawMap();
}

/* =========================================================
   SETTINGS PERSISTENCE
   ========================================================= */
function applySettings() {
  document.documentElement.setAttribute('data-theme', state.theme);
  document.documentElement.setAttribute('data-density', state.density);
  document.documentElement.classList.toggle('no-anim', !state.anim);
  document.documentElement.classList.toggle('no-magnetic', !state.magnetic);

  const themeSeg = $('#themeSegmented');
  if (themeSeg) $$('button', themeSeg).forEach(b => b.classList.toggle('active', b.dataset.theme === state.theme));
  const densSeg = $('#densitySegmented');
  if (densSeg) $$('button', densSeg).forEach(b => b.classList.toggle('active', b.dataset.density === state.density));
  const animT = $('#animToggle');
  if (animT) animT.checked = state.anim;
  const magT = $('#magneticToggle');
  if (magT) magT.checked = state.magnetic;
  const autoT = $('#autoRefreshToggle');
  if (autoT) autoT.checked = state.autoRefresh;

  if (state.magnetic) setupMagnetic();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(KEYS.THEME, state.theme);
  applySettings();
  drawRevenueChart();
  drawMap();
}

/* =========================================================
   AUTO REFRESH
   ========================================================= */
function startAutoRefresh() {
  stopAutoRefresh();
  state.autoRefreshTimer = setInterval(() => {
    if (!document.hidden) {
      renderKPIs();
      renderServices();
      drawRevenueChart();
    }
  }, 30000);
}
function stopAutoRefresh() {
  if (state.autoRefreshTimer) {
    clearInterval(state.autoRefreshTimer);
    state.autoRefreshTimer = null;
  }
}

/* =========================================================
   MAGNETIC BUTTONS
   ========================================================= */
function setupMagnetic() {
  if (!state.magnetic) return;
  const isTouch = window.matchMedia('(hover: none)').matches;
  if (isTouch) return;

  const magnets = $$('.qa-btn, .copilot-trigger, .btn-primary');
  magnets.forEach(el => {
    if (el.dataset.magneticInit) return;
    el.dataset.magneticInit = '1';
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

/* =========================================================
   KPI RENDERING
   ========================================================= */
function renderKPIs() {
  const el = $('#kpiGrid');
  if (!el) return;
  el.innerHTML = DATA.kpis.map(k => {
    const deltaLabel = k.delta >= 0 ? '+' + k.delta + '%' : k.delta + '%';
    return `
      <div class="kpi-card" data-kpi="${k.id}">
        <div class="kpi-head">
          <span class="kpi-label">${escapeHtml(k.label)}</span>
          <span class="kpi-icon">${ICONS[k.icon] || ICONS.sparkle}</span>
        </div>
        <div class="kpi-value" data-value="${k.value}" data-format="${k.format}">0</div>
        <div class="kpi-meta">
          <span class="kpi-delta ${k.trend}">${k.trend === 'up' ? ICONS.up : ICONS.down}${deltaLabel}</span>
          <span class="kpi-period">vs periodo prec.</span>
        </div>
        <svg class="kpi-spark" viewBox="0 0 80 40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="spark-${k.id}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#06b6d4"/>
            </linearGradient>
          </defs>
          <path d="${generateSparkline(k.spark)}" fill="none" stroke="url(#spark-${k.id})" stroke-width="1.5"/>
        </svg>
      </div>
    `;
  }).join('');

  $$('.kpi-value').forEach(el => animateNumber(el, parseFloat(el.dataset.value), el.dataset.format));

  $$('.kpi-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    card.addEventListener('click', () => {
      const id = card.dataset.kpi;
      const kpi = DATA.kpis.find(k => k.id === id);
      if (kpi) openCopilotWith(`Fammi un'analisi dettagliata di ${kpi.label}`);
    });
  });
}

function animateNumber(el, target, format) {
  const duration = 900;
  const start = performance.now();
  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const current = target * eased;
    if (format === 'currency') el.textContent = formatCurrency(Math.round(current));
    else if (format === 'ms') el.textContent = Math.round(current) + 'ms';
    else if (format === 'number') el.textContent = formatNumber(Math.round(current));
    else el.textContent = Math.round(current);
    if (p < 1) requestAnimationFrame(frame);
    else {
      if (format === 'currency') el.textContent = formatCurrency(target);
      else if (format === 'ms') el.textContent = target + 'ms';
      else if (format === 'number') el.textContent = formatNumber(target);
    }
  }
  requestAnimationFrame(frame);
}

function renderChartStats() {
  const el = $('#chartStats');
  if (!el) return;
  const totalRevenue = 284320;
  const totalSessions = 48392;
  const convRate = 3.42;
  const avgOrder = 84.5;
  el.innerHTML = `
    <div class="chart-stat"><span class="chart-stat-label">Revenue</span><span class="chart-stat-value">${formatCurrency(totalRevenue)}</span></div>
    <div class="chart-stat"><span class="chart-stat-label">Sessions</span><span class="chart-stat-value">${formatNumber(totalSessions)}</span></div>
    <div class="chart-stat"><span class="chart-stat-label">Conv. rate</span><span class="chart-stat-value">${convRate}%</span></div>
    <div class="chart-stat"><span class="chart-stat-label">Avg order</span><span class="chart-stat-value">${formatCurrency(Math.round(avgOrder))}</span></div>
  `;
}

/* =========================================================
   SERVICES
   ========================================================= */
function renderServices() {
  const el = $('#servicesList');
  if (!el) return;
  el.innerHTML = DATA.services.map(s => `
    <div class="service-item" data-service="${escapeHtml(s.name)}">
      <span class="service-dot ${s.status}"></span>
      <div class="service-info">
        <strong>${escapeHtml(s.name)}</strong>
        <div class="service-bar">
          <span class="${s.status}" style="width:${s.load}%"></span>
        </div>
      </div>
      <span class="service-value">${s.status === 'err' ? 'DOWN' : s.load + '%'}</span>
    </div>
  `).join('');

  $$('.service-item').forEach(item => {
    item.addEventListener('click', () => {
      const svc = item.dataset.service;
      toast(`Analisi di ${svc} in corso…`, 'info');
      setTimeout(() => openCopilotWith(`Analizza lo stato e le performance del servizio ${svc}`), 400);
    });
  });
}

/* =========================================================
   EVENTS TIMELINE
   ========================================================= */
function renderEvents() {
  const el = $('#eventTimeline');
  if (!el) return;
  const recent = DATA.events.slice(0, 6);
  el.innerHTML = recent.map(e => `
    <div class="tl-item" data-event="${e.id}">
      <span class="tl-icon ${e.severity}">${ICONS[e.severity === 'success' ? 'check' : e.severity === 'info' ? 'sparkle' : 'alert']}</span>
      <div class="tl-body">
        <div class="tl-title">${escapeHtml(e.title)}</div>
        <div class="tl-meta">
          <span>${escapeHtml(e.time)}</span>
          <span class="service-tag">${escapeHtml(e.service)}</span>
          <span>${escapeHtml(e.region)}</span>
        </div>
      </div>
    </div>
  `).join('');

  $$('.tl-item').forEach(item => {
    item.addEventListener('click', () => openEventModal(item.dataset.event));
  });
}

/* =========================================================
   REGIONS & TOP SERVICES
   ========================================================= */
function renderRegions() {
  const el = $('#regionsList');
  if (!el) return;
  el.innerHTML = DATA.regions.map(r => `
    <div class="region-row">
      <span class="region-name">${escapeHtml(r.name)}</span>
      <div class="region-bar"><span style="width:${r.pct}%"></span></div>
      <span class="region-value">${r.value}%</span>
    </div>
  `).join('');
}

function renderTopServices() {
  const el = $('#topServices');
  if (!el) return;
  el.innerHTML = DATA.topServices.map(s => `
    <div class="ts-row">
      <span class="ts-name">${escapeHtml(s.name)}</span>
      <div class="ts-bar"><span style="width:${s.pct}%"></span></div>
      <span class="ts-value">${escapeHtml(s.value)}</span>
    </div>
  `).join('');
}

function renderAudit() {
  const el = $('#auditList');
  if (!el) return;
  el.innerHTML = DATA.audit.map(a => `
    <div class="audit-row">
      <span class="audit-action"><strong>${escapeHtml(a.action)}</strong> ${escapeHtml(a.detail)}</span>
      <span class="audit-time">${escapeHtml(a.time)}</span>
    </div>
  `).join('');
}

/* =========================================================
   OPS TABLE
   ========================================================= */
function renderOpsStats() {
  const el = $('#opsStats');
  if (!el) return;
  const critical = DATA.events.filter(e => e.severity === 'critical').length;
  const warning = DATA.events.filter(e => e.severity === 'warning').length;
  const success = DATA.events.filter(e => e.severity === 'success').length;
  const total = DATA.events.length;

  el.innerHTML = `
    <div class="stat-card" data-stat="ops-total">
      <div class="stat-card-label">Eventi totali</div>
      <div class="stat-card-value">${total}</div>
      <div class="stat-card-meta">Ultime 24 ore</div>
    </div>
    <div class="stat-card" data-stat="ops-critical">
      <div class="stat-card-label">Incidenti critici</div>
      <div class="stat-card-value" style="color:var(--danger)">${critical}</div>
      <div class="stat-card-meta">Richiedono attenzione</div>
    </div>
    <div class="stat-card" data-stat="ops-warning">
      <div class="stat-card-label">Warning</div>
      <div class="stat-card-value" style="color:var(--warning)">${warning}</div>
      <div class="stat-card-meta">Da monitorare</div>
    </div>
    <div class="stat-card" data-stat="ops-success">
      <div class="stat-card-label">Operazioni OK</div>
      <div class="stat-card-value" style="color:var(--success)">${success}</div>
      <div class="stat-card-meta">Deploy e recovery</div>
    </div>
  `;

  $$('#opsStats .stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const stat = card.dataset.stat;
      const map = { 'ops-total': 'all', 'ops-critical': 'critical', 'ops-warning': 'warning', 'ops-success': 'success' };
      state.opsFilter.sev = map[stat] || 'all';
      $$('#severityFilter .chip').forEach(c => c.classList.toggle('active', c.dataset.sev === state.opsFilter.sev));
      renderOpsTable();
      toast(`Filtro applicato: ${state.opsFilter.sev}`, 'info');
    });
  });
}

function getFilteredOps() {
  let list = [...DATA.events];
  if (state.opsFilter.sev !== 'all') list = list.filter(e => e.severity === state.opsFilter.sev);
  if (state.opsFilter.search) {
    const q = state.opsFilter.search.toLowerCase();
    list = list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.service.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.region.toLowerCase().includes(q)
    );
  }
  const { sortField, sortDir } = state.opsFilter;
  list.sort((a, b) => {
    let va = a[sortField], vb = b[sortField];
    if (sortField === 'time') { va = a.timestamp; vb = b.timestamp; }
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  });
  return list;
}

function renderOpsTable() {
  renderOpsStats();
  const tbody = $('#opsTableBody');
  if (!tbody) return;
  const list = getFilteredOps();

  updateSortHeaders('#opsTable', state.opsFilter.sortField, state.opsFilter.sortDir);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">Nessun evento trovato</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr data-event="${e.id}" class="${state.selectedOps.has(e.id) ? 'selected' : ''}">
      <td class="col-check"><input type="checkbox" ${state.selectedOps.has(e.id) ? 'checked' : ''} data-check-ops="${e.id}" /></td>
      <td class="mono">${escapeHtml(e.id)}</td>
      <td><span class="sev-pill ${e.severity}">${e.severity}</span></td>
      <td>${escapeHtml(e.title)}</td>
      <td class="mono">${escapeHtml(e.service)}</td>
      <td class="mono muted">${escapeHtml(e.region)}</td>
      <td class="mono muted">${escapeHtml(e.time)}</td>
      <td>
        <div class="row-actions">
          <button class="row-action" data-action="view" title="Vedi">${ICONS.eye}</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Row click
  $$('#opsTableBody tr').forEach(row => {
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('input[type="checkbox"]') || ev.target.closest('.row-action')) return;
      openEventModal(row.dataset.event);
    });
  });

  // Checkbox click
  $$('[data-check-ops]').forEach(cb => {
    cb.addEventListener('change', (ev) => {
      const id = ev.target.dataset.checkOps;
      if (ev.target.checked) state.selectedOps.add(id);
      else state.selectedOps.delete(id);
      updateOpsBulk();
      const row = ev.target.closest('tr');
      if (row) row.classList.toggle('selected', ev.target.checked);
    });
  });

  // Row action
  $$('#opsTableBody .row-action').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const row = btn.closest('tr');
      openEventModal(row.dataset.event);
    });
  });

  updateOpsBulk();
}

function updateOpsBulk() {
  const bulk = $('#opsBulkActions');
  const count = state.selectedOps.size;
  if (!bulk) return;
  bulk.hidden = count === 0;
  const c = $('#opsSelectedCount');
  if (c) c.textContent = count;

  const selectAll = $('#opsSelectAll');
  if (selectAll) {
    const list = getFilteredOps();
    selectAll.checked = list.length > 0 && list.every(e => state.selectedOps.has(e.id));
    selectAll.indeterminate = count > 0 && !selectAll.checked;
  }
}

/* =========================================================
   CUSTOMERS
   ========================================================= */
function renderCustStats() {
  const el = $('#custStats');
  if (!el) return;
  const total = DATA.customers.length;
  const totalMRR = DATA.customers.reduce((s, c) => s + c.mrr, 0);
  const avgHealth = Math.round(DATA.customers.reduce((s, c) => s + c.health, 0) / total);
  const atRisk = DATA.customers.filter(c => c.health < 50).length;

  el.innerHTML = `
    <div class="stat-card" data-stat="cust-total">
      <div class="stat-card-label">Clienti attivi</div>
      <div class="stat-card-value">${total}</div>
      <div class="stat-card-meta">+2 questo mese</div>
    </div>
    <div class="stat-card" data-stat="cust-mrr">
      <div class="stat-card-label">MRR totale</div>
      <div class="stat-card-value">${formatCurrency(totalMRR)}</div>
      <div class="stat-card-meta">+12.4% MoM</div>
    </div>
    <div class="stat-card" data-stat="cust-health">
      <div class="stat-card-label">Health medio</div>
      <div class="stat-card-value">${avgHealth}</div>
      <div class="stat-card-meta">Su 100</div>
    </div>
    <div class="stat-card" data-stat="cust-risk">
      <div class="stat-card-label">A rischio churn</div>
      <div class="stat-card-value" style="color:var(--danger)">${atRisk}</div>
      <div class="stat-card-meta">Health &lt; 50</div>
    </div>
  `;

  $$('#custStats .stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const stat = card.dataset.stat;
      if (stat === 'cust-risk') {
        state.custFilter.plan = 'all';
        state.custFilter.search = '';
        state.custFilter.sort = 'health-desc';
        const sel = $('#custSort');
        if (sel) sel.value = 'health-desc';
        $$('#planFilter .chip').forEach(c => c.classList.toggle('active', c.dataset.plan === 'all'));
        const search = $('#custSearch');
        if (search) search.value = '';
        renderCustomers();
        toast('Mostrati i clienti a rischio', 'info');
      } else {
        openCopilotWith(`Analizza le metriche clienti: ${stat.replace('cust-', '')}`);
      }
    });
  });
}

function getFilteredCust() {
  let list = [...DATA.customers];

  if (state.custFilter.plan !== 'all') list = list.filter(c => c.plan === state.custFilter.plan);
  if (state.custFilter.search) {
    const q = state.custFilter.search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }

  const sort = state.custFilter.sort;
  if (sort === 'mrr-desc') list.sort((a, b) => b.mrr - a.mrr);
  else if (sort === 'mrr-asc') list.sort((a, b) => a.mrr - b.mrr);
  else if (sort === 'health-desc') list.sort((a, b) => b.health - a.health);
  else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'recent') list.sort((a, b) => new Date(b.joined) - new Date(a.joined));

  return list;
}

function renderCustomers() {
  const tbody = $('#custTableBody');
  if (!tbody) return;
  const list = getFilteredCust();

  updateSortHeaders('#custTable', state.custFilter.sortField, state.custFilter.sortDir);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">Nessun cliente trovato</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr data-cust="${c.id}" class="${state.selectedCust.has(c.id) ? 'selected' : ''}">
      <td class="col-check"><input type="checkbox" ${state.selectedCust.has(c.id) ? 'checked' : ''} data-check-cust="${c.id}" /></td>
      <td>
        <div class="cust-cell">
          <span class="cust-avatar" style="background:${c.color}">${initialsOf(c.name)}</span>
          <div class="cust-info">
            <strong>${escapeHtml(c.name)}</strong>
            <small>${escapeHtml(c.email)}</small>
          </div>
        </div>
      </td>
      <td><span class="plan-pill ${c.plan}">${c.plan}</span></td>
      <td class="mono">${formatCurrency(c.mrr)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="ts-bar" style="min-width:60px"><span style="width:${c.health}%;background:${c.health > 70 ? 'var(--success)' : c.health > 40 ? 'var(--warning)' : 'var(--danger)'}"></span></div>
          <span class="mono">${c.health}</span>
        </div>
      </td>
      <td class="mono muted">${escapeHtml(c.lastAccess)}</td>
      <td>
        <span class="sentiment ${c.sentiment}">
          ${c.sentiment === 'positive' ? ICONS.up : c.sentiment === 'negative' ? ICONS.down : ICONS.sparkle}
          ${c.sentiment}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button class="row-action" data-action="view" title="Dettagli">${ICONS.eye}</button>
          <button class="row-action" data-action="ask" title="Chiedi al Copilot">${ICONS.sparkle}</button>
        </div>
      </td>
    </tr>
  `).join('');

  $$('#custTableBody tr').forEach(row => {
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('input[type="checkbox"]') || ev.target.closest('.row-action')) return;
      openCustModal(row.dataset.cust);
    });
  });

  $$('[data-check-cust]').forEach(cb => {
    cb.addEventListener('change', (ev) => {
      const id = ev.target.dataset.checkCust;
      if (ev.target.checked) state.selectedCust.add(id);
      else state.selectedCust.delete(id);
      const row = ev.target.closest('tr');
      if (row) row.classList.toggle('selected', ev.target.checked);
      updateCustBulk();
    });
  });

  $$('#custTableBody .row-action').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const row = btn.closest('tr');
      const cust = DATA.customers.find(c => c.id === row.dataset.cust);
      if (!cust) return;
      if (btn.dataset.action === 'ask') {
        openCopilotWith(`Analizza il cliente ${cust.name} (${cust.plan}) e suggerisci azioni`);
      } else {
        openCustModal(cust.id);
      }
    });
  });

  updateCustBulk();
}

function updateCustBulk() {
  const selectAll = $('#custSelectAll');
  if (!selectAll) return;
  const list = getFilteredCust();
  selectAll.checked = list.length > 0 && list.every(c => state.selectedCust.has(c.id));
  selectAll.indeterminate = state.selectedCust.size > 0 && !selectAll.checked;
}

/* =========================================================
   TEAM
   ========================================================= */
function renderTeamStats() {
  const el = $('#teamStats');
  if (!el) return;
  const total = DATA.team.length;
  const online = DATA.team.filter(t => t.status === 'online').length;
  const away = DATA.team.filter(t => t.status === 'away').length;

  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-label">Membri totali</div>
      <div class="stat-card-value">${total}</div>
      <div class="stat-card-meta">Workspace Acme Corp</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-label">Online ora</div>
      <div class="stat-card-value" style="color:var(--success)">${online}</div>
      <div class="stat-card-meta">Attivi nel workspace</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-label">Assenti</div>
      <div class="stat-card-value" style="color:var(--warning)">${away}</div>
      <div class="stat-card-meta">Tornano a breve</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-label">Posti disponibili</div>
      <div class="stat-card-value">34</div>
      <div class="stat-card-meta">Su 42 totali</div>
    </div>
  `;
}

function renderTeam() {
  const tbody = $('#teamTableBody');
  if (!tbody) return;
  tbody.innerHTML = DATA.team.map(t => `
    <tr>
      <td>
        <div class="cust-cell">
          <span class="cust-avatar" style="background:${t.color}">${t.initials}</span>
          <div class="cust-info"><strong>${escapeHtml(t.name)}</strong></div>
        </div>
      </td>
      <td>${escapeHtml(t.role)}</td>
      <td class="muted">${escapeHtml(t.dept)}</td>
      <td>
        <span class="sentiment ${t.status === 'online' ? 'positive' : t.status === 'away' ? 'neutral' : 'negative'}">
          <span class="status-dot ${t.status === 'online' ? '' : t.status === 'away' ? 'warning' : 'danger'}" style="margin-right:4px"></span>
          ${t.status === 'online' ? 'Online' : t.status === 'away' ? 'Assente' : 'Offline'}
        </span>
      </td>
      <td class="mono muted">${escapeHtml(t.lastAccess)}</td>
      <td class="mono">${escapeHtml(t.perms)}</td>
      <td>
        <div class="row-actions">
          <button class="row-action" data-action="ask" title="Chiedi al Copilot">${ICONS.sparkle}</button>
        </div>
      </td>
    </tr>
  `).join('');

  $$('#teamTableBody .row-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tr = btn.closest('tr');
      const name = tr.querySelector('.cust-info strong').textContent;
      openCopilotWith(`Cosa sta facendo ${name} questa settimana?`);
    });
  });
}

/* =========================================================
   REPORTS
   ========================================================= */
let currentReportsFilter = 'all';

function renderReports() {
  const el = $('#reportsGrid');
  if (!el) return;
  const list = currentReportsFilter === 'all'
    ? DATA.reports
    : DATA.reports.filter(r => r.type === currentReportsFilter);

  el.innerHTML = list.map((r, i) => `
    <div class="report-card" data-report="${r.id}" style="animation-delay:${i * 50}ms">
      <div class="report-icon">${ICONS.file}</div>
      <div class="report-body">
        <div class="report-title">${escapeHtml(r.title)}</div>
        <div class="report-desc">${escapeHtml(r.desc)}</div>
      </div>
      <div class="report-meta">
        <span>${escapeHtml(r.date)}</span>
        <span class="report-status ${r.status}">${r.status === 'ready' ? 'Pronto' : 'In corso'}</span>
        <span>${escapeHtml(r.size)}</span>
      </div>
    </div>
  `).join('');

  $$('.report-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.report;
      const report = DATA.reports.find(r => r.id === id);
      if (!report) return;
      toast(`Download di "${report.title}" avviato`, 'info');
      setTimeout(() => {
        const csv = `Report,DATA,DESC,Size\n"${report.title}","${report.date}","${report.desc}","${report.size}"`;
        downloadFile(`${report.title.replace(/[^\w-]+/g, '_')}.csv`, csv, 'text/csv');
        toast(`Report scaricato`, 'success');
      }, 900);
    });
  });
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */
function renderNotifications() {
  const list = $('#notifList');
  if (!list) return;
  list.innerHTML = DATA.notifications.map((n, i) => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-i="${i}">
      <span class="notif-icon ${n.type}">${ICONS[n.type === 'critical' ? 'alert' : n.type === 'warning' ? 'alert' : n.type === 'success' ? 'check' : 'sparkle']}</span>
      <div class="notif-body">
        <strong>${escapeHtml(n.title)}</strong>
        <small>${escapeHtml(n.body)}</small>
        <span class="notif-time">${escapeHtml(n.time)}</span>
      </div>
    </div>
  `).join('');

  const unread = DATA.notifications.filter(n => !n.read).length;
  const badge = $('#notifBadge');
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread ? 'grid' : 'none';
  }

  $$('.notif-item').forEach(el => {
    el.addEventListener('click', () => {
      const i = Number(el.dataset.i);
      if (!DATA.notifications[i].read) {
        DATA.notifications[i].read = true;
        renderNotifications();
      }
    });
  });
}

/* =========================================================
   REVENUE CHART
   ========================================================= */
function drawRevenueChart() {
  const canvas = $('#revenueChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width;
  const H = rect.height;
  const P = { top: 16, right: 16, bottom: 26, left: 48 };

  ctx.clearRect(0, 0, W, H);

  let points = 24;
  if (state.currentRange === '7d') points = 7;
  else if (state.currentRange === '30d') points = 30;
  else if (state.currentRange === '90d') points = 40;

  const revenue = [];
  const sessions = [];
  let rv = 8000, ss = 22000;
  for (let i = 0; i < points; i++) {
    rv += (Math.random() - 0.42) * 1200;
    ss += (Math.random() - 0.42) * 1800;
    rv = Math.max(4000, rv);
    ss = Math.max(10000, ss);
    revenue.push(rv);
    sessions.push(ss);
  }

  const maxV = Math.max(...revenue, ...sessions) * 1.15;
  const cw = W - P.left - P.right;
  const ch = H - P.top - P.bottom;

  const css = getComputedStyle(document.body);
  const borderC = css.getPropertyValue('--border').trim();
  const mutedC = css.getPropertyValue('--text-muted').trim();
  const brandC = css.getPropertyValue('--brand').trim();
  const infoC = css.getPropertyValue('--info').trim();
  const bg2C = css.getPropertyValue('--bg-2').trim();

  ctx.font = '11px JetBrains Mono, monospace';
  ctx.fillStyle = mutedC;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = borderC;
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = P.top + (ch / 4) * i;
    ctx.beginPath();
    ctx.moveTo(P.left, y);
    ctx.lineTo(W - P.right, y);
    ctx.stroke();
    const val = maxV - ((maxV / 4) * i);
    const label = val >= 1000 ? '€' + Math.round(val / 1000) + 'k' : '€' + Math.round(val);
    ctx.fillText(label, P.left - 8, y);
  }

  // Sessions area
  ctx.beginPath();
  sessions.forEach((v, i) => {
    const x = P.left + (cw / (points - 1)) * i;
    const y = P.top + ch - (v / maxV) * ch;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(P.left + cw, P.top + ch);
  ctx.lineTo(P.left, P.top + ch);
  ctx.closePath();
  const gradS = ctx.createLinearGradient(0, P.top, 0, P.top + ch);
  gradS.addColorStop(0, hexAlpha(infoC, 0.18));
  gradS.addColorStop(1, hexAlpha(infoC, 0));
  ctx.fillStyle = gradS;
  ctx.fill();

  // Sessions line
  ctx.beginPath();
  sessions.forEach((v, i) => {
    const x = P.left + (cw / (points - 1)) * i;
    const y = P.top + ch - (v / maxV) * ch;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = infoC;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Revenue area
  ctx.beginPath();
  revenue.forEach((v, i) => {
    const x = P.left + (cw / (points - 1)) * i;
    const y = P.top + ch - (v / maxV) * ch;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(P.left + cw, P.top + ch);
  ctx.lineTo(P.left, P.top + ch);
  ctx.closePath();
  const gradR = ctx.createLinearGradient(0, P.top, 0, P.top + ch);
  gradR.addColorStop(0, hexAlpha(brandC, 0.28));
  gradR.addColorStop(1, hexAlpha(brandC, 0));
  ctx.fillStyle = gradR;
  ctx.fill();

  // Revenue line
  ctx.beginPath();
  revenue.forEach((v, i) => {
    const x = P.left + (cw / (points - 1)) * i;
    const y = P.top + ch - (v / maxV) * ch;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = brandC;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Points
  revenue.forEach((v, i) => {
    const x = P.left + (cw / (points - 1)) * i;
    const y = P.top + ch - (v / maxV) * ch;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = bg2C;
    ctx.fill();
    ctx.strokeStyle = brandC;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function hexAlpha(hex, alpha) {
  hex = hex.trim();
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (hex.startsWith('rgb')) {
    const m = hex.match(/\d+/g);
    if (m) return `rgba(${m[0]},${m[1]},${m[2]},${alpha})`;
  }
  return hex;
}

/* =========================================================
   MAP
   ========================================================= */
function drawMap() {
  const canvas = $('#mapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width;
  const H = rect.height;

  const css = getComputedStyle(document.body);
  const borderC = css.getPropertyValue('--border').trim();
  const brandC = css.getPropertyValue('--brand').trim();
  const textMuted = css.getPropertyValue('--text-muted').trim();

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = borderC;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const nodes = [
    { x: 0.46, y: 0.34, active: true },
    { x: 0.22, y: 0.38, active: true },
    { x: 0.12, y: 0.42, active: true },
    { x: 0.68, y: 0.52, active: true },
    { x: 0.82, y: 0.44, active: true },
    { x: 0.55, y: 0.72, active: false },
    { x: 0.30, y: 0.65, active: true },
    { x: 0.35, y: 0.22, active: false },
    { x: 0.60, y: 0.30, active: true },
    { x: 0.75, y: 0.68, active: true }
  ];

  nodes.forEach((n1, i) => {
    nodes.forEach((n2, j) => {
      if (i >= j) return;
      if (!n1.active || !n2.active) return;
      const x1 = n1.x * W, y1 = n1.y * H;
      const x2 = n2.x * W, y2 = n2.y * H;
      const dist = Math.hypot(x2 - x1, y2 - y1);
      if (dist > 280) return;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = hexAlpha(brandC, 0.05 + Math.random() * 0.05);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  });

  const t = Date.now() / 1000;
  nodes.forEach((n, i) => {
    const x = n.x * W;
    const y = n.y * H;
    const pulse = 1 + Math.sin(t * 2 + i) * 0.15;

    if (n.active) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 24 * pulse);
      grad.addColorStop(0, hexAlpha(brandC, 0.4));
      grad.addColorStop(1, hexAlpha(brandC, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 24 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, n.active ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = n.active ? brandC : hexAlpha(textMuted, 0.4);
    ctx.fill();

    if (n.active) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  });

  const activeNodes = $('#mapActiveNodes');
  if (activeNodes) activeNodes.textContent = nodes.filter(n => n.active).length;
  const reqEl = $('#mapRequests');
  if (reqEl) reqEl.textContent = Math.floor(45000 + Math.random() * 8000).toLocaleString('it-IT');

  requestAnimationFrame(drawMap);
}

/* =========================================================
   VIEW SWITCHING
   ========================================================= */
function switchView(view) {
  state.currentView = view;

  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));

  const titles = {
    overview: 'Overview',
    operations: 'Operations',
    customers: 'Customers',
    copilot: 'AI Copilot',
    reports: 'Reports',
    team: 'Team',
    settings: 'Settings',
    help: 'Help & Support'
  };
  const bc = $('#bcCurrent');
  if (bc) bc.textContent = titles[view] || 'Overview';

  const vc = $('#viewContainer');
  if (vc) vc.scrollTop = 0;

  if (view === 'overview') {
    requestAnimationFrame(() => {
      drawRevenueChart();
      drawMap();
    });
  }
}

/* =========================================================
   COPILOT RESPONSES
   ========================================================= */
const COPILOT_RESPONSES = {
  'incidenti': () => {
    const critical = DATA.events.filter(e => e.severity === 'critical');
    return `Ho analizzato gli eventi delle ultime 24 ore. Ecco cosa ho trovato:\n\n**Incidenti critici: ${critical.length}**\n\n${critical.map(e => `• **${e.time}** — ${e.title} (${e.service})`).join('\n')}\n\nSuggerisco di dare priorità al crash del **search-indexer** in ap-south-1. Cause probabili: memory leak o limiti di memoria troppo bassi.`;
  },
  'top clienti': () => {
    const top = [...DATA.customers].sort((a, b) => b.mrr - a.mrr).slice(0, 5);
    const totalTop = top.reduce((s, c) => s + c.mrr, 0);
    const totalAll = DATA.customers.reduce((s, c) => s + c.mrr, 0);
    return `Ecco i **top 5 clienti per MRR**:\n\n${top.map((c, i) => `${i + 1}. **${c.name}** — ${formatCurrency(c.mrr)}/mese (${c.plan})`).join('\n')}\n\nIl MRR totale dei top 5 è **${formatCurrency(totalTop)}**, che rappresenta il **${Math.round(totalTop / totalAll * 100)}%** del totale.`;
  },
  'stato sistemi': () => {
    const ok = DATA.services.filter(s => s.status === 'ok').length;
    const warn = DATA.services.filter(s => s.status === 'warn').length;
    const err = DATA.services.filter(s => s.status === 'err').length;
    return `**Stato dei sistemi:**\n\n• ✅ Operativi: **${ok}**\n• ⚠️ Warning: **${warn}**\n• ❌ Down: **${err}**\n\n${err > 0 ? `Attenzione: **${DATA.services.filter(s => s.status === 'err').map(s => s.name).join(', ')}** è in stato critico.` : 'Tutti i sistemi funzionano regolarmente.'}`;
  },
  'anomalie': () => `Ho confrontato il traffico delle ultime 24h con la media delle 7 precedenti. Ecco cosa ho rilevato:\n\n**Anomalie rilevate:**\n• 📈 Picco di richieste **+18%** tra le 13:00 e le 14:00\n• 📉 Calo **-12%** delle sessioni APAC dopo le 22:00\n• ⚠️ **Latenza P95** su api-gateway salita a 340ms\n\nTi consiglio di monitorare il P95 nelle prossime 2 ore.`,
  'report': () => `Ecco il **report settimanale**:\n\n📊 **Weekly Summary**\n\n• **MRR**: €284,320 (+12.4% MoM)\n• **Nuovi clienti**: 2\n• **Churn**: 0\n• **Uptime**: 99.98%\n• **Incidenti**: 3 critici, 12 warning\n• **Deploy**: 24\n\n✅ Latenza API migliorata del 18%\n⚠️ Client Quantum Systems a rischio (health 32%)`,
  'servizi lenti': () => `**Servizi con latenza elevata:**\n\n1. **analytics-engine** — P95: 890ms (soglia 500ms) 🔴\n2. **api-gateway** — P95: 340ms (soglia 250ms) 🟡\n3. **search-indexer** — DOWN\n\n**Raccomandazioni:**\n• Scaler analytics-engine\n• Investigare query lente su search-indexer\n• Verificare regressioni su api-gateway`,
  'default': () => {
    const opts = [
      `Ho analizzato i tuoi dati. Ecco i punti chiave:\n\n• **MRR**: €284,320 (+12.4%)\n• **Utenti attivi**: 48,392 (+8.1%)\n• **3 incidenti** nelle ultime 24h\n• **2 clienti** a rischio churn\n\nVuoi che approfondisca uno di questi aspetti?`,
      `Ecco un riepilogo operativo:\n\n✅ Sistemi al 99.98% di uptime\n⚠️ 1 servizio down (search-indexer)\n📈 Revenue in crescita del 12.4% MoM\n👥 Team al completo\n\nCosa vuoi sapere in dettaglio?`,
      `Dati aggiornati: 3 incidenti, 2 clienti nuovi, 24 deploy questa settimana. Il sistema è stabile. Chiedimi un'analisi specifica.`
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }
};

function getCopilotResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('incident') || p.includes('critic') || p.includes('down')) return COPILOT_RESPONSES['incidenti']();
  if (p.includes('cliente') || p.includes('clienti') || p.includes('mrr') || p.includes('top')) return COPILOT_RESPONSES['top clienti']();
  if (p.includes('sistema') || p.includes('stato') || p.includes('health')) return COPILOT_RESPONSES['stato sistemi']();
  if (p.includes('anomal') || p.includes('traffic') || p.includes('trend')) return COPILOT_RESPONSES['anomalie']();
  if (p.includes('report') || p.includes('riepilog')) return COPILOT_RESPONSES['report']();
  if (p.includes('lent') || p.includes('latenc') || p.includes('slow') || p.includes('perform')) return COPILOT_RESPONSES['servizi lenti']();
  return COPILOT_RESPONSES['default']();
}

/* =========================================================
   COPILOT VIEW
   ========================================================= */
function sendCopilotMessage(prompt) {
  if (!prompt.trim()) return;
  const messages = $('#copilotMessages');
  if (!messages) return;

  const welcome = messages.querySelector('.copilot-welcome');
  if (welcome) welcome.remove();

  const userMsg = document.createElement('div');
  userMsg.className = 'copilot-msg user';
  userMsg.innerHTML = `
    <div class="copilot-msg-avatar">TU</div>
    <div class="copilot-msg-body">
      <div class="copilot-msg-author">Tu</div>
      <div class="copilot-msg-content">${escapeHtml(prompt)}</div>
    </div>
  `;
  messages.appendChild(userMsg);
  messages.scrollTop = messages.scrollHeight;

  const typing = document.createElement('div');
  typing.className = 'copilot-msg assistant';
  typing.innerHTML = `
    <div class="copilot-msg-avatar">${ICONS.sparkle}</div>
    <div class="copilot-msg-body">
      <div class="copilot-msg-author">Copilot</div>
      <div class="copilot-msg-content"><div class="copilot-typing"><span></span><span></span><span></span></div></div>
    </div>
  `;
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    const response = getCopilotResponse(prompt);
    typing.remove();

    const aiMsg = document.createElement('div');
    aiMsg.className = 'copilot-msg assistant';
    aiMsg.innerHTML = `
      <div class="copilot-msg-avatar">${ICONS.sparkle}</div>
      <div class="copilot-msg-body">
        <div class="copilot-msg-author">Copilot</div>
        <div class="copilot-msg-content"></div>
      </div>
    `;
    messages.appendChild(aiMsg);
    const contentEl = aiMsg.querySelector('.copilot-msg-content');

    streamMarkdown(contentEl, response, () => {
      messages.scrollTop = messages.scrollHeight;
    });
  }, 700 + Math.random() * 600);
}

function streamMarkdown(el, text, onDone) {
  let i = 0;
  const step = 3;
  function tick() {
    i += step;
    const partial = text.slice(0, i);
    el.innerHTML = renderSimpleMarkdown(partial) + '<span class="stream-cursor"></span>';
    if (i < text.length) setTimeout(tick, 12);
    else {
      el.innerHTML = renderSimpleMarkdown(text);
      if (onDone) onDone();
    }
  }
  tick();
}

function renderSimpleMarkdown(md) {
  let s = escapeHtml(md);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/^[•\-\*]\s+(.+)$/gm, '<div style="padding-left:16px;position:relative"><span style="position:absolute;left:0;color:var(--brand)">•</span>$1</div>');
  s = s.replace(/\n/g, '<br>');
  s = s.replace(/<br>(<div)/g, '$1');
  return s;
}

function openCopilotWith(prompt) {
  switchView('copilot');
  setTimeout(() => {
    sendCopilotMessage(prompt);
    const inp = $('#copilotInput');
    if (inp) inp.value = '';
  }, 300);
}

/* =========================================================
   COPILOT DRAWER
   ========================================================= */
function openDrawer() {
  $('#copilotDrawer').classList.add('open');
  $('#drawerOverlay').classList.add('open');
  setTimeout(() => $('#drawerInput').focus(), 300);
}

function closeDrawer() {
  $('#copilotDrawer').classList.remove('open');
  $('#drawerOverlay').classList.remove('open');
}

function sendDrawerMessage(prompt) {
  if (!prompt.trim()) return;
  const messages = $('#drawerMessages');
  if (!messages) return;

  const welcome = messages.querySelector('.drawer-welcome');
  if (welcome) welcome.remove();

  const userMsg = document.createElement('div');
  userMsg.className = 'copilot-msg user';
  userMsg.innerHTML = `
    <div class="copilot-msg-avatar">TU</div>
    <div class="copilot-msg-body">
      <div class="copilot-msg-author">Tu</div>
      <div class="copilot-msg-content">${escapeHtml(prompt)}</div>
    </div>
  `;
  messages.appendChild(userMsg);
  messages.scrollTop = messages.scrollHeight;

  const typing = document.createElement('div');
  typing.className = 'copilot-msg assistant';
  typing.innerHTML = `
    <div class="copilot-msg-avatar">${ICONS.sparkle}</div>
    <div class="copilot-msg-body">
      <div class="copilot-msg-author">Copilot</div>
      <div class="copilot-msg-content"><div class="copilot-typing"><span></span><span></span><span></span></div></div>
    </div>
  `;
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    const response = getCopilotResponse(prompt);
    typing.remove();

    const aiMsg = document.createElement('div');
    aiMsg.className = 'copilot-msg assistant';
    aiMsg.innerHTML = `
      <div class="copilot-msg-avatar">${ICONS.sparkle}</div>
      <div class="copilot-msg-body">
        <div class="copilot-msg-author">Copilot</div>
        <div class="copilot-msg-content"></div>
      </div>
    `;
    messages.appendChild(aiMsg);
    const contentEl = aiMsg.querySelector('.copilot-msg-content');
    streamMarkdown(contentEl, response, () => {
      messages.scrollTop = messages.scrollHeight;
    });
  }, 600 + Math.random() * 500);
}

/* =========================================================
   MODALS
   ========================================================= */
function openModal(id) { const el = $(`#${id}`); if (el) el.classList.add('open'); }
function closeModal(id) { const el = $(`#${id}`); if (el) el.classList.remove('open'); }

/* Event detail */
function openEventModal(eventId) {
  const event = DATA.events.find(e => e.id === eventId);
  if (!event) return;

  const head = $('#eventModalHead');
  const body = $('#eventModalBody');
  if (!head || !body) return;

  head.innerHTML = `
    <div class="event-modal-head">
      <span class="sev-pill ${event.severity}">${event.severity}</span>
      <div>
        <div class="event-modal-title">${escapeHtml(event.title)}</div>
        <div class="event-modal-sub">${event.id} · ${event.time} · ${event.region}</div>
      </div>
    </div>
  `;

  body.innerHTML = `
    <div class="event-detail-grid">
      <div class="event-detail-item"><label>Servizio</label><span class="mono">${escapeHtml(event.service)}</span></div>
      <div class="event-detail-item"><label>Regione</label><span class="mono">${escapeHtml(event.region)}</span></div>
      <div class="event-detail-item"><label>Severity</label><span class="sev-pill ${event.severity}">${event.severity}</span></div>
      <div class="event-detail-item"><label>Timestamp</label><span class="mono">${new Date(event.timestamp).toLocaleString('it-IT')}</span></div>
    </div>
    <div class="cust-section">
      <div class="cust-section-title">Log evento</div>
      <div class="event-log">${escapeHtml(event.log)
        .replace(/\[WARN\]/g, '<span class="log-warn">[WARN]</span>')
        .replace(/\[ERR\]/g, '<span class="log-err">[ERR]</span>')
        .replace(/\[OK\]/g, '<span class="log-ok">[OK]</span>')
        .replace(/(\d{2}:\d{2}:\d{2})/g, '<span class="log-time">$1</span>')}</div>
    </div>
    <div class="cust-section">
      <div class="cust-section-title">Analisi AI</div>
      <p style="font-size:.86rem;color:var(--text-muted);line-height:1.7">${getAIAnalysis(event)}</p>
    </div>
  `;

  const resolveBtn = $('#resolveEventBtn');
  if (resolveBtn) {
    resolveBtn.onclick = () => {
      toast(`Evento ${event.id} marcato come risolto`, 'success');
      closeModal('eventBackdrop');
    };
  }

  const copyBtn = $('#copyEventBtn');
  if (copyBtn) {
    copyBtn.onclick = async () => {
      const text = `[${event.severity.toUpperCase()}] ${event.title}\nID: ${event.id}\nService: ${event.service}\nRegion: ${event.region}\nTime: ${event.time}\n\n${event.log}`;
      const ok = await copyToClipboard(text);
      toast(ok ? 'Dettagli copiati' : 'Errore copia', ok ? 'success' : 'error');
    };
  }

  openModal('eventBackdrop');
}

function getAIAnalysis(event) {
  if (event.severity === 'critical') return `Evento critico che richiede attenzione immediata. Il pattern suggerisce un problema di risorse sul servizio <strong>${event.service}</strong>. Consiglio: verificare i limiti di memoria del pod e considerare uno scale-up orizzontale.`;
  if (event.severity === 'warning') return `Warning da monitorare. Il valore è sopra la soglia ma non compromette il servizio. Suggerisco di osservare l'andamento per i prossimi 30 minuti.`;
  if (event.severity === 'success') return `Operazione completata con successo. Il servizio <strong>${event.service}</strong> è operativo e stabile.`;
  return `Evento informativo registrato. Nessuna azione richiesta.`;
}

/* Customer detail */
function openCustModal(custId) {
  const c = DATA.customers.find(x => x.id === custId);
  if (!c) return;

  const head = $('#custModalHead');
  const body = $('#custModalBody');
  if (!head || !body) return;

  head.innerHTML = `
    <div class="cust-modal-head">
      <span class="cust-avatar cust-avatar-lg" style="background:${c.color}">${initialsOf(c.name)}</span>
      <div>
        <div class="cust-modal-name">${escapeHtml(c.name)}</div>
        <div class="cust-modal-sub">${escapeHtml(c.email)} · Cliente dal ${c.joined}</div>
      </div>
    </div>
  `;

  body.innerHTML = `
    <div class="cust-metrics">
      <div class="cust-metric"><div class="cust-metric-label">MRR</div><div class="cust-metric-value">${formatCurrency(c.mrr)}</div></div>
      <div class="cust-metric"><div class="cust-metric-label">Health score</div><div class="cust-metric-value" style="color:${c.health > 70 ? 'var(--success)' : c.health > 40 ? 'var(--warning)' : 'var(--danger)'}">${c.health}</div></div>
      <div class="cust-metric"><div class="cust-metric-label">Utenti attivi</div><div class="cust-metric-value">${c.users}</div></div>
    </div>
    <div class="cust-section">
      <div class="cust-section-title">Informazioni account</div>
      <div class="event-detail-grid" style="grid-template-columns:1fr 1fr">
        <div class="event-detail-item"><label>Piano</label><span><span class="plan-pill ${c.plan}">${c.plan}</span></span></div>
        <div class="event-detail-item"><label>Regione</label><span class="mono">${c.region}</span></div>
        <div class="event-detail-item"><label>Ultimo accesso</label><span class="mono">${c.lastAccess}</span></div>
        <div class="event-detail-item"><label>Sentiment</label><span class="sentiment ${c.sentiment}">${c.sentiment}</span></div>
      </div>
    </div>
    <div class="cust-section">
      <div class="cust-section-title">Analisi AI</div>
      <p style="font-size:.86rem;color:var(--text-muted);line-height:1.7">${
        c.health > 70 ? `Cliente <strong>in ottima salute</strong>. Ottimo candidato per upsell.` :
        c.health > 40 ? `Cliente <strong>da monitorare</strong>. Contattare per check-in.` :
        `⚠️ <strong>Cliente a rischio churn</strong>. Intervento immediato del customer success.`
      }</p>
    </div>
  `;

  openModal('custBackdrop');
}

/* =========================================================
   QUICK SEARCH
   ========================================================= */
function openQuickSearch() {
  const qs = $('#quickSearch');
  if (!qs) return;
  qs.classList.add('open');
  const inp = $('#quickSearchInput');
  if (inp) {
    inp.value = '';
    setTimeout(() => inp.focus(), 50);
  }
  renderQuickSearch('');
  closeDrawer();
}

function closeQuickSearch() {
  const qs = $('#quickSearch');
  if (qs) qs.classList.remove('open');
}

function renderQuickSearch(query) {
  const el = $('#quickSearchResults');
  if (!el) return;
  const q = query.trim().toLowerCase();

  const results = { events: [], customers: [], team: [], actions: [] };

  if (q) {
    results.events = DATA.events.filter(e =>
      e.title.toLowerCase().includes(q) || e.service.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
    ).slice(0, 4);

    results.customers = DATA.customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    ).slice(0, 4);

    results.team = DATA.team.filter(t =>
      t.name.toLowerCase().includes(q) || t.role.toLowerCase().includes(q)
    ).slice(0, 3);
  } else {
    results.actions = [
      { label: 'Vai a Overview', desc: 'Dashboard principale', action: () => switchView('overview') },
      { label: 'Nuovo report', desc: 'Genera un report', action: () => openModal('reportBackdrop') },
      { label: 'Nuovo incidente', desc: 'Crea un ticket', action: () => openModal('incidentBackdrop') },
      { label: 'Invita membro', desc: 'Aggiungi al team', action: () => openModal('inviteBackdrop') }
    ];
  }

  const total = results.events.length + results.customers.length + results.team.length + results.actions.length;
  if (total === 0) {
    el.innerHTML = `<div class="qs-empty">Nessun risultato per "<b>${escapeHtml(query)}</b>"</div>`;
    return;
  }

  let html = '';
  if (results.actions.length) {
    html += `<div class="qs-section">Azioni</div>`;
    results.actions.forEach((a, i) => {
      html += `<button class="qs-item" data-qs-action="${i}">
        ${ICONS.bolt}
        <div class="qs-item-text"><strong>${escapeHtml(a.label)}</strong><small>${escapeHtml(a.desc)}</small></div>
      </button>`;
    });
  }
  if (results.events.length) {
    html += `<div class="qs-section">Eventi</div>`;
    results.events.forEach(e => {
      html += `<button class="qs-item" data-qs-event="${e.id}">
        ${ICONS.alert}
        <div class="qs-item-text"><strong>${escapeHtml(e.title)}</strong><small>${e.id} · ${e.service}</small></div>
      </button>`;
    });
  }
  if (results.customers.length) {
    html += `<div class="qs-section">Clienti</div>`;
    results.customers.forEach(c => {
      html += `<button class="qs-item" data-qs-cust="${c.id}">
        ${ICONS.users}
        <div class="qs-item-text"><strong>${escapeHtml(c.name)}</strong><small>${c.plan} · ${formatCurrency(c.mrr)}/mese</small></div>
      </button>`;
    });
  }
  if (results.team.length) {
    html += `<div class="qs-section">Team</div>`;
    results.team.forEach(t => {
      html += `<button class="qs-item" data-qs-team="${t.name}">
        ${ICONS.users}
        <div class="qs-item-text"><strong>${escapeHtml(t.name)}</strong><small>${escapeHtml(t.role)}</small></div>
      </button>`;
    });
  }

  el.innerHTML = html;

  el.querySelectorAll('[data-qs-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.qsAction);
      const action = results.actions[i];
      closeQuickSearch();
      setTimeout(() => action.action(), 150);
    });
  });
  el.querySelectorAll('[data-qs-event]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeQuickSearch();
      setTimeout(() => openEventModal(btn.dataset.qsEvent), 150);
    });
  });
  el.querySelectorAll('[data-qs-cust]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeQuickSearch();
      setTimeout(() => openCustModal(btn.dataset.qsCust), 150);
    });
  });
  el.querySelectorAll('[data-qs-team]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeQuickSearch();
      setTimeout(() => openCopilotWith(`Cosa sta facendo ${btn.dataset.qsTeam}?`), 150);
    });
  });
}

/* =========================================================
   SORT HEADERS
   ========================================================= */
function updateSortHeaders(tableSel, field, dir) {
  const table = $(tableSel);
  if (!table) return;
  $$('th.sortable', table).forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === field) th.classList.add(dir === 'asc' ? 'sort-asc' : 'sort-desc');
  });
}

/* =========================================================
   EXPORT CSV
   ========================================================= */
function exportOpsCSV() {
  const list = getFilteredOps();
  const headers = ['ID', 'Severity', 'Title', 'Service', 'Region', 'Time'];
  const rows = list.map(e => [e.id, e.severity, e.title, e.service, e.region, e.time]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadFile(`ops-events-${Date.now()}.csv`, csv, 'text/csv');
  toast(`Esportati ${list.length} eventi`, 'success');
}

function exportCustCSV() {
  const list = getFilteredCust();
  const headers = ['Name', 'Email', 'Plan', 'MRR', 'Health', 'Sentiment', 'Last access'];
  const rows = list.map(c => [c.name, c.email, c.plan, c.mrr, c.health, c.sentiment, c.lastAccess]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadFile(`customers-${Date.now()}.csv`, csv, 'text/csv');
  toast(`Esportati ${list.length} clienti`, 'success');
}

/* =========================================================
   ONBOARDING
   ========================================================= */
function showOnboardingIfNeeded() {
  if (localStorage.getItem(KEYS.ONBOARDING)) return;
  localStorage.setItem(KEYS.ONBOARDING, '1');
  setTimeout(() => {
    toast('👋 Benvenuto! Premi ⌘K per i comandi veloci', 'info');
    setTimeout(() => toast('Prova a chiedere qualcosa all\'AI Copilot (⌘J)', 'info'), 2000);
  }, 500);
}

/* =========================================================
   BIND EVENTS
   ========================================================= */
function bindEvents() {
  /* Nav */
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  /* View jump */
  $$('[data-view-jump]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.viewJump));
  });

  /* Sidebar mobile */
  const menuBtn = $('#menuBtn');
  if (menuBtn) menuBtn.addEventListener('click', () => {
    $('#sidebar').classList.add('open');
    $('#sidebarOverlay').classList.add('active');
  });
  const sidebarClose = $('#sidebarClose');
  if (sidebarClose) sidebarClose.addEventListener('click', () => {
    $('#sidebar').classList.remove('open');
    $('#sidebarOverlay').classList.remove('active');
  });
  const sidebarOverlay = $('#sidebarOverlay');
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => {
    $('#sidebar').classList.remove('open');
    $('#sidebarOverlay').classList.remove('active');
  });

  /* Workspace switcher */
  const wsSwitcher = $('#workspaceSwitcher');
  if (wsSwitcher) wsSwitcher.addEventListener('click', () => {
    renderWorkspaceList();
    openModal('wsBackdrop');
  });

  /* Theme toggle */
  const themeToggleBtn = $('#themeToggleBtn');
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => {
    toggleTheme();
    closeModal('userBackdrop');
  });

  /* User menu */
  const userMenuBtn = $('#userMenuBtn');
  if (userMenuBtn) userMenuBtn.addEventListener('click', () => openModal('userBackdrop'));
  const logoutBtn = $('#logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (confirm('Vuoi uscire dal workspace?')) {
      toast('Logout effettuato', 'success');
      closeModal('userBackdrop');
    }
  });
  const kbBtn = $('#kbBtn');
  if (kbBtn) kbBtn.addEventListener('click', () => {
    switchView('help');
    closeModal('userBackdrop');
  });
  const userProfile = $('#userProfile');
  if (userProfile) userProfile.addEventListener('click', () => {
    closeModal('userBackdrop');
    toast('Profilo utente — feature in arrivo', 'info');
  });
  const userSettings = $('#userSettings');
  if (userSettings) userSettings.addEventListener('click', () => {
    closeModal('userBackdrop');
    switchView('settings');
  });

  /* Notifications */
  const notifBtn = $('#notifBtn');
  if (notifBtn) notifBtn.addEventListener('click', () => {
    renderNotifications();
    openModal('notifBackdrop');
  });
  const markAllRead = $('#markAllRead');
  if (markAllRead) markAllRead.addEventListener('click', () => {
    DATA.notifications.forEach(n => n.read = true);
    renderNotifications();
    toast('Tutte le notifiche lette', 'success');
  });

  /* Refresh */
  const refreshBtn = $('#refreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    setTimeout(() => refreshBtn.classList.remove('spinning'), 800);
    renderKPIs();
    renderServices();
    drawRevenueChart();
    toast('Dati aggiornati', 'success');
  });

  const servicesRefresh = $('#servicesRefresh');
  if (servicesRefresh) servicesRefresh.addEventListener('click', () => {
    servicesRefresh.classList.add('spinning');
    setTimeout(() => servicesRefresh.classList.remove('spinning'), 800);
    renderServices();
    toast('Sistemi aggiornati', 'info');
  });

  /* Timeframe */
  $$('#timeframeControl button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentRange = btn.dataset.range;
      $$('#timeframeControl button').forEach(b => b.classList.toggle('active', b === btn));
      drawRevenueChart();
      const sub = $('#revenueSub');
      if (sub) {
        const labels = { '24h': 'Ultime 24h', '7d': 'Ultimi 7 giorni', '30d': 'Ultimi 30 giorni', '90d': 'Ultimi 90 giorni' };
        sub.textContent = labels[state.currentRange] + ' · EUR';
      }
    });
  });

  /* Ops filters */
  $$('#severityFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.opsFilter.sev = chip.dataset.sev;
      $$('#severityFilter .chip').forEach(c => c.classList.toggle('active', c === chip));
      renderOpsTable();
    });
  });
  const opsSearch = $('#opsSearch');
  if (opsSearch) opsSearch.addEventListener('input', debounce(e => {
    state.opsFilter.search = e.target.value;
    renderOpsTable();
  }, 200));

  /* Ops select all */
  const opsSelectAll = $('#opsSelectAll');
  if (opsSelectAll) opsSelectAll.addEventListener('change', e => {
    const list = getFilteredOps();
    if (e.target.checked) list.forEach(x => state.selectedOps.add(x.id));
    else list.forEach(x => state.selectedOps.delete(x.id));
    renderOpsTable();
  });

  /* Ops bulk actions */
  $$('#opsBulkActions [data-bulk]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.bulk;
      const count = state.selectedOps.size;
      if (!count) return;
      if (action === 'delete') {
        if (!confirm(`Eliminare ${count} eventi?`)) return;
        DATA.events = DATA.events.filter(e => !state.selectedOps.has(e.id));
        state.selectedOps.clear();
        renderOpsTable();
        renderEvents();
        toast(`${count} eventi eliminati`, 'warning');
      } else if (action === 'resolve') {
        toast(`${count} eventi marcati come risolti`, 'success');
        state.selectedOps.clear();
        renderOpsTable();
      } else if (action === 'snooze') {
        toast(`${count} eventi silenziati per 1 ora`, 'info');
        state.selectedOps.clear();
        renderOpsTable();
      }
    });
  });

  /* Ops sort */
  $$('#opsTable th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.opsFilter.sortField === field) {
        state.opsFilter.sortDir = state.opsFilter.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.opsFilter.sortField = field;
        state.opsFilter.sortDir = 'asc';
      }
      renderOpsTable();
    });
  });

  /* Cust filters */
  $$('#planFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.custFilter.plan = chip.dataset.plan;
      $$('#planFilter .chip').forEach(c => c.classList.toggle('active', c === chip));
      renderCustomers();
    });
  });
  const custSearch = $('#custSearch');
  if (custSearch) custSearch.addEventListener('input', debounce(e => {
    state.custFilter.search = e.target.value;
    renderCustomers();
  }, 200));
  const custSort = $('#custSort');
  if (custSort) custSort.addEventListener('change', e => {
    state.custFilter.sort = e.target.value;
    renderCustomers();
  });
  const custSelectAll = $('#custSelectAll');
  if (custSelectAll) custSelectAll.addEventListener('change', e => {
    const list = getFilteredCust();
    if (e.target.checked) list.forEach(x => state.selectedCust.add(x.id));
    else list.forEach(x => state.selectedCust.delete(x.id));
    renderCustomers();
  });

  /* Cust sort */
  $$('#custTable th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.custFilter.sortField === field) {
        state.custFilter.sortDir = state.custFilter.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.custFilter.sortField = field;
        state.custFilter.sortDir = 'asc';
      }
      // Map to legacy sort values
      if (field === 'name') state.custFilter.sort = 'name';
      else if (field === 'mrr') state.custFilter.sort = state.custFilter.sortDir === 'asc' ? 'mrr-asc' : 'mrr-desc';
      else if (field === 'health') state.custFilter.sort = 'health-desc';
      renderCustomers();
    });
  });

  /* Export buttons */
  const exportOpsBtn = $('#exportOpsBtn');
  if (exportOpsBtn) exportOpsBtn.addEventListener('click', exportOpsCSV);
  const exportCustBtn = $('#exportCustBtn');
  if (exportCustBtn) exportCustBtn.addEventListener('click', exportCustCSV);

  /* New incident / report / customer / invite */
  const newIncidentBtn = $('#newIncidentBtn');
  if (newIncidentBtn) newIncidentBtn.addEventListener('click', () => openModal('incidentBackdrop'));
  const newReportBtn = $('#newReportBtn');
  if (newReportBtn) newReportBtn.addEventListener('click', () => openModal('reportBackdrop'));
  const newCustBtn = $('#newCustBtn');
  if (newCustBtn) newCustBtn.addEventListener('click', () => openModal('newCustBackdrop'));
  const inviteBtn = $('#inviteBtn');
  if (inviteBtn) inviteBtn.addEventListener('click', () => openModal('inviteBackdrop'));

  /* Create incident */
  const createIncidentBtn = $('#createIncidentBtn');
  if (createIncidentBtn) createIncidentBtn.addEventListener('click', () => {
    const title = $('#incTitle').value.trim();
    if (!title) { toast('Inserisci un titolo', 'error'); return; }
    const severity = $('#incSeverity').value;
    const service = $('#incService').value;
    const desc = $('#incDesc').value.trim();
    const id = 'EVT-' + Math.floor(Math.random() * 9000 + 1000);
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    DATA.events.unshift({
      id, severity, title, service, region: 'eu-west-1', time, timestamp: Date.now(),
      log: `${time} [INFO] ${title}\n${time} [INFO] ${desc || 'Nessuna descrizione'}`
    });
    closeModal('incidentBackdrop');
    $('#incTitle').value = '';
    $('#incDesc').value = '';
    renderOpsTable();
    renderEvents();
    toast(`Incidente ${id} creato`, 'success');
  });

  /* Create customer */
  const createCustomerBtn = $('#createCustomerBtn');
  if (createCustomerBtn) createCustomerBtn.addEventListener('click', () => {
    const name = $('#custNameInput').value.trim();
    const email = $('#custEmailInput').value.trim();
    const plan = $('#custPlanInput').value;
    const mrr = parseInt($('#custMrrInput').value) || 0;
    if (!name) { toast('Inserisci un nome', 'error'); return; }
    const colors = ['#2563eb','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#a855f7'];
    DATA.customers.push({
      id: 'c' + Date.now(),
      name, email: email || 'hello@' + name.toLowerCase().replace(/\s+/g, '-') + '.com',
      plan, mrr, users: 1, health: 70, sentiment: 'neutral',
      lastAccess: 'ora', joined: new Date().toISOString().slice(0, 10),
      region: 'EU', color: colors[Math.floor(Math.random() * colors.length)]
    });
    closeModal('newCustBackdrop');
    $('#custNameInput').value = '';
    $('#custEmailInput').value = '';
    $('#custMrrInput').value = '';
    renderCustomers();
    renderCustStats();
    toast(`Cliente ${name} creato`, 'success');
  });

  /* Send invite */
  const sendInviteBtn = $('#sendInviteBtn');
  if (sendInviteBtn) sendInviteBtn.addEventListener('click', () => {
    const email = $('#inviteEmail').value.trim();
    if (!email || !email.includes('@')) { toast('Email non valida', 'error'); return; }
    closeModal('inviteBackdrop');
    $('#inviteEmail').value = '';
    $('#inviteMessage').value = '';
    toast(`Invito inviato a ${email}`, 'success');
  });

  /* Generate report */
  const generateReportBtn = $('#generateReportBtn');
  if (generateReportBtn) generateReportBtn.addEventListener('click', () => {
    const type = $('#reportType').value;
    const period = $('#reportPeriod').value;
    closeModal('reportBackdrop');
    toast('Report in generazione…', 'info');
    setTimeout(() => {
      DATA.reports.unshift({
        id: 'r' + Date.now(),
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report — ${period}`,
        desc: 'Generato automaticamente',
        date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
        size: (1 + Math.random() * 4).toFixed(1) + ' MB',
        status: 'ready',
        type
      });
      renderReports();
      toast('Report generato', 'success');
    }, 900);
  });

  /* Reports filter */
  $$('#reportsFilter button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentReportsFilter = btn.dataset.type;
      $$('#reportsFilter button').forEach(b => b.classList.toggle('active', b === btn));
      renderReports();
    });
  });

  /* Copilot main */
  const copilotInput = $('#copilotInput');
  if (copilotInput) {
    copilotInput.addEventListener('input', () => {
      copilotInput.style.height = 'auto';
      copilotInput.style.height = Math.min(copilotInput.scrollHeight, 140) + 'px';
    });
    copilotInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCopilotMessage(copilotInput.value);
        copilotInput.value = '';
        copilotInput.style.height = 'auto';
      }
    });
  }
  const copilotSend = $('#copilotSend');
  if (copilotSend) copilotSend.addEventListener('click', () => {
    if (copilotInput) {
      sendCopilotMessage(copilotInput.value);
      copilotInput.value = '';
      copilotInput.style.height = 'auto';
    }
  });
  const clearCopilot = $('#clearCopilot');
  if (clearCopilot) clearCopilot.addEventListener('click', () => {
    const messages = $('#copilotMessages');
    if (!messages) return;
    messages.innerHTML = `
      <div class="copilot-welcome">
        <div class="copilot-logo">
          <svg viewBox="0 0 32 32" fill="none"><path d="M8 24V8l8 10 8-10v16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26" cy="8" r="2.5" fill="currentColor"/></svg>
        </div>
        <h2>Ciao, sono il tuo Copilot</h2>
        <p>Posso analizzare dati, generare report, trovare anomalie e rispondere a domande sui tuoi sistemi.</p>
        <div class="copilot-suggestions">
          <button data-prompt="Quanti incidenti critici ci sono stati oggi?">Incidenti critici oggi</button>
          <button data-prompt="Mostrami i top 5 clienti per MRR">Top 5 clienti per MRR</button>
          <button data-prompt="Riassumi lo stato dei sistemi">Stato sistemi</button>
          <button data-prompt="Ci sono anomalie nel traffico recente?">Anomalie traffico</button>
          <button data-prompt="Genera un report settimanale">Report settimanale</button>
          <button data-prompt="Quali servizi hanno latenza alta?">Servizi lenti</button>
        </div>
      </div>
    `;
    bindCopilotSuggestions();
    toast('Nuova sessione avviata', 'info');
  });
  const copilotAttach = $('#copilotAttach');
  if (copilotAttach) copilotAttach.addEventListener('click', () => toast('Allegati in arrivo', 'info'));
  const copilotVoice = $('#copilotVoice');
  if (copilotVoice) copilotVoice.addEventListener('click', () => toast('Input vocale in arrivo', 'info'));

  bindCopilotSuggestions();

  /* Drawer */
  const copilotTrigger = $('#copilotTrigger');
  if (copilotTrigger) copilotTrigger.addEventListener('click', openDrawer);
  const copilotClose = $('#copilotClose');
  if (copilotClose) copilotClose.addEventListener('click', closeDrawer);
  const drawerOverlay = $('#drawerOverlay');
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  const drawerInput = $('#drawerInput');
  if (drawerInput) {
    drawerInput.addEventListener('input', () => {
      drawerInput.style.height = 'auto';
      drawerInput.style.height = Math.min(drawerInput.scrollHeight, 100) + 'px';
    });
    drawerInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendDrawerMessage(drawerInput.value);
        drawerInput.value = '';
        drawerInput.style.height = 'auto';
      }
    });
  }
  const drawerSend = $('#drawerSend');
  if (drawerSend) drawerSend.addEventListener('click', () => {
    if (drawerInput) {
      sendDrawerMessage(drawerInput.value);
      drawerInput.value = '';
      drawerInput.style.height = 'auto';
    }
  });
  bindDrawerSuggestions();

  /* Close modals */
  $$('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  $$('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });

  /* Search trigger */
  const searchTrigger = $('#searchTrigger');
  if (searchTrigger) searchTrigger.addEventListener('click', openQuickSearch);

  const quickSearchInput = $('#quickSearchInput');
  if (quickSearchInput) {
    quickSearchInput.addEventListener('input', debounce(e => renderQuickSearch(e.target.value), 120));
    quickSearchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeQuickSearch();
    });
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('.global-search-wrap')) closeQuickSearch();
  });

  /* Settings toggles */
  const themeSegmented = $('#themeSegmented');
  if (themeSegmented) $$('button', themeSegmented).forEach(btn => {
    btn.addEventListener('click', () => {
      state.theme = btn.dataset.theme;
      localStorage.setItem(KEYS.THEME, state.theme);
      applySettings();
      drawRevenueChart();
      drawMap();
    });
  });

  const densitySegmented = $('#densitySegmented');
  if (densitySegmented) $$('button', densitySegmented).forEach(btn => {
    btn.addEventListener('click', () => {
      state.density = btn.dataset.density;
      localStorage.setItem(KEYS.DENSITY, state.density);
      applySettings();
    });
  });

  const animToggle = $('#animToggle');
  if (animToggle) animToggle.addEventListener('change', e => {
    state.anim = e.target.checked;
    localStorage.setItem(KEYS.ANIM, state.anim);
    applySettings();
    toast(`Animazioni ${state.anim ? 'attivate' : 'disattivate'}`, 'info');
  });

  const magneticToggle = $('#magneticToggle');
  if (magneticToggle) magneticToggle.addEventListener('change', e => {
    state.magnetic = e.target.checked;
    localStorage.setItem(KEYS.MAGNETIC, state.magnetic);
    applySettings();
    toast(`Effetti magnetici ${state.magnetic ? 'attivati' : 'disattivati'}`, 'info');
  });

  const autoRefreshToggle = $('#autoRefreshToggle');
  if (autoRefreshToggle) autoRefreshToggle.addEventListener('change', e => {
    state.autoRefresh = e.target.checked;
    localStorage.setItem(KEYS.AUTO_REFRESH, state.autoRefresh);
    if (state.autoRefresh) { startAutoRefresh(); toast('Auto-refresh attivato', 'success'); }
    else { stopAutoRefresh(); toast('Auto-refresh disattivato', 'info'); }
  });

  /* Notif settings */
  ['notifCritical', 'notifDeploy', 'notifCustomer', 'notifWeekly'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const key = KEYS[id.replace(/[A-Z]/g, m => '_' + m.toUpperCase()).replace('NOTIF_', 'NOTIF_')] || id;
    const saved = localStorage.getItem('nowii_' + id);
    if (saved !== null) el.checked = saved === 'true';
    el.addEventListener('change', () => {
      localStorage.setItem('nowii_' + id, el.checked);
      toast(`Preferenza ${id} aggiornata`, 'success');
    });
  });

  /* API key */
  const apiKeyInput = $('#apiKeyInput');
  if (apiKeyInput) {
    apiKeyInput.value = localStorage.getItem('nowii_api_key') || '';
    apiKeyInput.addEventListener('change', () => {
      localStorage.setItem('nowii_api_key', apiKeyInput.value);
      toast('API key salvata', 'success');
    });
  }

  /* Export all data */
  const exportAllBtn = $('#exportAllBtn');
  if (exportAllBtn) exportAllBtn.addEventListener('click', () => {
    const dump = { events: DATA.events, customers: DATA.customers, team: DATA.team, reports: DATA.reports };
    downloadFile(`nowii-export-${Date.now()}.json`, JSON.stringify(dump, null, 2), 'application/json');
    toast('Dati esportati', 'success');
  });

  /* Reset all */
  const resetAllBtn = $('#resetAllBtn');
  if (resetAllBtn) resetAllBtn.addEventListener('click', () => {
    if (!confirm('Ripristinare tutte le impostazioni ai valori di default?')) return;
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    state.theme = 'dark';
    state.density = 'default';
    state.anim = true;
    state.magnetic = true;
    state.autoRefresh = false;
    stopAutoRefresh();
    applySettings();
    toast('Impostazioni ripristinate', 'success');
  });

  /* Help guides & contacts */
  $$('.guide-item').forEach(item => {
    item.addEventListener('click', () => {
      const guide = item.dataset.guide;
      const prompts = {
        'getting-started': 'Come inizio con nowii·ai? Dammi una guida rapida in 3 punti',
        'copilot': 'Come uso al meglio l\'AI Copilot? Esempi pratici',
        'incidents': 'Come gestisco un incidente P1? Workflow passo-passo',
        'billing': 'Come funziona il billing e i piani?',
        'api': 'Come integro nowii·ai con le mie app via API?'
      };
      openCopilotWith(prompts[guide] || `Aiutami con ${guide}`);
    });
  });

  $$('.contact-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.contact;
      if (type === 'chat') {
        openDrawer();
        setTimeout(() => sendDrawerMessage('Ciao, ho bisogno di supporto'), 400);
      } else if (type === 'email') {
        window.location.href = 'mailto:support@nowii.ai';
      } else if (type === 'call') {
        toast('Chiamata in corso: +39 02 1234 5678', 'info');
      } else if (type === 'docs') {
        toast('Apertura documentazione…', 'info');
      }
    });
  });

  /* Quick actions floating */
  $$('.qa-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.qa;
      if (action === 'new-report') openModal('reportBackdrop');
      else if (action === 'ask-copilot') openDrawer();
      else if (action === 'invite') openModal('inviteBackdrop');
      else if (action === 'top') {
        const vc = $('#viewContainer');
        if (vc) vc.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  /* Help button */
  const helpBtn = $('#helpBtn');
  if (helpBtn) helpBtn.addEventListener('click', () => switchView('help'));

  /* Keyboard shortcuts */
  document.addEventListener('keydown', e => {
    const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openQuickSearch();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
      e.preventDefault();
      openDrawer();
      return;
    }
    if (e.key === 'Escape') {
      $$('.modal-backdrop.open').forEach(b => b.classList.remove('open'));
      closeDrawer();
      closeQuickSearch();
      return;
    }
    if (inInput) return;

    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      refreshBtn && refreshBtn.click();
    }
    if (e.key === '/') {
      e.preventDefault();
      openQuickSearch();
    }
    const num = parseInt(e.key);
    if (num >= 1 && num <= 6) {
      const views = ['overview', 'operations', 'customers', 'copilot', 'reports', 'team'];
      switchView(views[num - 1]);
    }
  });
}

function bindCopilotSuggestions() {
  $$('.copilot-suggestions button').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      if (prompt) sendCopilotMessage(prompt);
    });
  });
}

function bindDrawerSuggestions() {
  $$('.drawer-suggestions button').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      if (prompt) sendDrawerMessage(prompt);
    });
  });
}

/* =========================================================
   WORKSPACE SWITCHER
   ========================================================= */
const WORKSPACES = [
  { id: 'acme', name: 'Acme Corp', plan: 'Enterprise · 42 seats', color: '#8b5cf6', initials: 'AC' },
  { id: 'northwind', name: 'Northwind Inc.', plan: 'Pro · 12 seats', color: '#10b981', initials: 'NI' },
  { id: 'globex', name: 'Globex Labs', plan: 'Starter · 5 seats', color: '#f59e0b', initials: 'GL' }
];

function renderWorkspaceList() {
  const el = $('#wsList');
  if (!el) return;
  el.innerHTML = WORKSPACES.map(w => `
    <button class="ws-item ${w.id === state.workspace ? 'active' : ''}" data-ws="${w.id}">
      <span class="cust-avatar" style="background:${w.color}">${w.initials}</span>
      <div class="ws-item-info">
        <strong>${escapeHtml(w.name)}</strong>
        <small>${escapeHtml(w.plan)}</small>
      </div>
      <span class="ws-item-check">${ICONS.check}</span>
    </button>
  `).join('');

  $$('.ws-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.ws;
      const w = WORKSPACES.find(x => x.id === id);
      if (!w) return;
      state.workspace = id;
      localStorage.setItem(KEYS.WORKSPACE, id);
      $('#wsName').textContent = w.name;
      $('#wsPlan').textContent = w.plan;
      $('#wsAvatar').textContent = w.initials;
      closeModal('wsBackdrop');
      toast(`Workspace: ${w.name}`, 'success');
      renderWorkspaceList();
    });
  });
}

/* =========================================================
   SPLASH STEPS ANIMATION
   ========================================================= */
function animateSplashSteps() {
  const steps = $$('#splashSteps .splash-step');
  if (!steps.length) return;
  let i = 0;
  const timer = setInterval(() => {
    if (i > 0) steps[i - 1].classList.remove('active');
    if (i > 0) steps[i - 1].classList.add('done');
    if (i >= steps.length) { clearInterval(timer); return; }
    steps[i].classList.add('active');
    i++;
  }, 500);
}

/* =========================================================
   BOOT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  animateSplashSteps();
  init();
});