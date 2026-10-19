'use strict';

const sites = [
  { id: 'THR-01', name: 'Tehran Central', location: 'Tehran · Telecom hub', status: 'healthy', voltage: 53.6, current: 124.8, temperature: 24.2, battery: 98, protocol: 'Modbus RTU' },
  { id: 'ISF-02', name: 'Isfahan Datacenter', location: 'Isfahan · Datacenter', status: 'healthy', voltage: 54.1, current: 186.3, temperature: 26.5, battery: 96, protocol: 'Modbus TCP' },
  { id: 'SHZ-03', name: 'Shiraz South', location: 'Shiraz · Telecom hub', status: 'warning', voltage: 52.8, current: 98.4, temperature: 34.8, battery: 82, protocol: 'Modbus RTU' },
  { id: 'MHD-04', name: 'Mashhad East', location: 'Mashhad · Telecom hub', status: 'critical', voltage: 47.2, current: 142.1, temperature: 38.6, battery: 64, protocol: 'Modbus RTU' },
  { id: 'TBZ-05', name: 'Tabriz Gateway', location: 'Tabriz · Network gateway', status: 'healthy', voltage: 53.8, current: 76.2, temperature: 22.1, battery: 95, protocol: 'SNMP' },
  { id: 'KRJ-06', name: 'Karaj West', location: 'Karaj · Datacenter', status: 'healthy', voltage: 54.0, current: 112.6, temperature: 25.3, battery: 97, protocol: 'Modbus TCP' }
];
const alerts = [
  { id: 'AL-01', title: 'DC bus voltage below threshold', site: 'Mashhad East', detail: '47.2 V · Below 48 V threshold', time: '4 min ago', status: 'critical', acknowledged: false },
  { id: 'AL-02', title: 'Battery health needs attention', site: 'Mashhad East', detail: '64% · Inspection recommended', time: '18 min ago', status: 'warning', acknowledged: false },
  { id: 'AL-03', title: 'Cabinet temperature elevated', site: 'Shiraz South', detail: '34.8 °C · Above 32 °C threshold', time: '32 min ago', status: 'warning', acknowledged: false }
];
const periods = {
  '24h': { labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'], values: [53.1,53.3,53.2,53.8,53.5,53.6,53.3,53.1,53.5,53.7,53.6,54,54.2,53.7,53.9,53.4,53.8,53.6,53.7,54.1,53.8,53.9,53.4,53.6] },
  '7d': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [52.8,53.2,53.7,53.4,53.9,53.6,53.5,53.9,54,53.7,53.5,53.9,54.2,53.8,53.7,53.9,53.4,53.7,53.5,53.8,53.7] },
  '30d': { labels: ['Sep 20', 'Sep 25', 'Sep 30', 'Oct 05', 'Oct 10', 'Oct 15', 'Oct 19'], values: [52.6,52.9,53.2,52.8,53.1,53.4,53.2,53.5,53.6,53.3,53.8,53.4,53.7,53.6,53.8,54,53.8,53.5,53.8,53.7,53.6,53.9,53.8,53.6,53.7,53.8,53.6,53.7,53.6,53.6] }
};
const statusLabel = { healthy: 'Healthy', warning: 'Warning', critical: 'Critical' };
const $ = (selector) => document.querySelector(selector);

function filterSites(query, status) {
  const normalized = query.trim().toLowerCase();
  return sites.filter(site => (status === 'all' || site.status === status) && `${site.name} ${site.location} ${site.id}`.toLowerCase().includes(normalized));
}

function chartMarkup(period) {
  const { labels, values } = periods[period];
  const left = 40, right = 700, top = 18, bottom = 147;
  const y = value => bottom - (value - 48) / 8 * (bottom - top);
  const points = values.map((value, i) => `${(left + i * (right - left) / (values.length - 1)).toFixed(1)},${y(value).toFixed(1)}`);
  const grid = [48,50,52,54,56].map(value => `<line x1="${left}" y1="${y(value)}" x2="${right}" y2="${y(value)}" stroke="#eef0f5" stroke-dasharray="3 4"/><text x="26" y="${y(value) + 3}" text-anchor="end" fill="#a8afba" font-size="9">${value} V</text>`).join('');
  const ticks = labels.map((label, i) => `<text x="${left + i * (right - left) / (labels.length - 1)}" y="174" text-anchor="${i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}" fill="#a8afba" font-size="9">${label}</text>`).join('');
  return `<svg viewBox="0 0 720 184" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a89ae2" stop-opacity=".23"/><stop offset="100%" stop-color="#a89ae2" stop-opacity=".015"/></linearGradient></defs>${grid}<polygon points="${left},${bottom} ${points.join(' ')} ${right},${bottom}" fill="url(#chart-fill)"/><polyline points="${points.join(' ')}" fill="none" stroke="#9581d5" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="${right}" cy="${y(values.at(-1))}" r="3.5" fill="#9581d5" stroke="white" stroke-width="2"/>${ticks}</svg>`;
}

function renderMetrics() {
  const metrics = [
    { label: 'Monitored sites', value: '6', unit: '/ 6', note: 'All connected', caption: 'simulated sites', icon: '▤', spark: false },
    { label: 'Average DC voltage', value: '53.6', unit: 'V', note: '↗ 0.4 V', caption: 'vs. previous period', icon: 'ϟ', spark: true },
    { label: 'Data availability', value: '99.8', unit: '%', note: '↗ 0.3%', caption: 'vs. previous period', icon: '◈', spark: true },
    { label: 'Active alerts', value: String(alerts.filter(a => !a.acknowledged).length), unit: '', note: '1 critical', caption: 'requires attention', icon: '♧', spark: false, warning: true }
  ];
  $('#metrics').innerHTML = metrics.map(metric => `<article class="metric"><div class="metric-label">${metric.label}<span class="metric-icon" aria-hidden="true">${metric.icon}</span></div><div class="metric-value">${metric.value} <small>${metric.unit}</small></div><div class="metric-bottom"><b class="${metric.warning ? 'warning' : ''}">${metric.note}</b><span>${metric.caption}</span></div>${metric.spark ? '<svg class="metric-spark" viewBox="0 0 70 30" aria-hidden="true"><polyline points="0,26 7,22 14,24 21,14 28,19 35,11 42,16 49,7 56,12 63,5 70,3" fill="none" stroke="#8ab9a3" stroke-width="1.5"/></svg>' : ''}</article>`).join('');
  const critical = alerts.filter(a => !a.acknowledged && a.status === 'critical').length;
  $('#metrics .metric:last-child b').textContent = critical ? `${critical} critical` : 'No critical alerts';
}

function renderSites() {
  const filtered = filterSites($('#site-search').value, $('#status-filter').value);
  $('#site-rows').innerHTML = filtered.length ? filtered.map(site => `<tr><td><div class="site-name"><span class="site-icon" aria-hidden="true">▥</span><div><strong>${site.name}</strong><small>${site.location}</small></div></div></td><td><span class="status-badge ${site.status}"><i class="status-dot ${site.status === 'healthy' ? 'green' : site.status === 'warning' ? 'amber' : 'red'}"></i>${statusLabel[site.status]}</span></td><td>${site.voltage.toFixed(1)} <span>V</span></td><td>${site.current.toFixed(1)} A</td><td>${site.temperature.toFixed(1)} °C</td><td><div class="battery ${site.status}"><span class="battery-track"><span style="width:${site.battery}%"></span></span>${site.battery}%</div></td><td><button class="site-details-button" data-site="${site.id}" aria-label="View ${site.name} details">↗</button></td></tr>`).join('') : '<tr><td colspan="7" class="empty-state">No sites match your search. Try another name or status.</td></tr>';
  $('#site-result-count').textContent = `Showing ${filtered.length} of ${sites.length} sites`;
}

function renderAlerts() {
  $('#alert-list').innerHTML = alerts.map(alert => `<div class="alert-item ${alert.status} ${alert.acknowledged ? 'acknowledged' : ''}"><span class="alert-icon" aria-hidden="true">${alert.status === 'critical' ? 'ϟ' : '!'}</span><div class="alert-copy"><strong>${alert.title}</strong><p>${alert.site} <span>·</span> ${alert.detail}</p></div><time class="alert-time">${alert.time}</time><button class="ack-button" data-alert="${alert.id}" ${alert.acknowledged ? 'disabled' : ''} aria-label="${alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}: ${alert.title}">${alert.acknowledged ? '✓ Acknowledged' : 'Acknowledge'}</button></div>`).join('');
  const pending = alerts.filter(a => !a.acknowledged).length;
  $('#pending-count').textContent = pending;
  $('.alert-count').textContent = pending;
  renderMetrics();
}

function setView(view) {
  const views = {
    overview: ['Operations overview', 'A clear picture of your DC infrastructure. All in one place.'],
    sites: ['Sites & assets', 'Explore the status and measurements of every simulated site.'],
    alerts: ['Alert center', 'Review and acknowledge simulated events across your fleet.']
  };
  const [title, description] = views[view];
  $('#page-title').textContent = `${title}.`;
  $('#page-description').textContent = description;
  $('#breadcrumb-title').textContent = view === 'overview' ? 'Overview' : title;
  $('#overview-panel').hidden = view !== 'overview';
  $('#sites-panel').hidden = view === 'alerts';
  $('#alerts-panel').hidden = view === 'sites';
  document.querySelectorAll('[data-view]').forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  $('#sidebar').classList.remove('open');
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
}

let toastTimer;
function notify(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200);
}

function reportCsv() {
  const rows = [['SIMULATED DEMO DATA — not live equipment measurements'], ['Site ID', 'Site', 'Status', 'Voltage (V)', 'Current (A)', 'Temperature (C)', 'Battery health (%)'], ...sites.map(site => [site.id, site.name, site.status, site.voltage, site.current, site.temperature, site.battery])];
  return rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
}

if (typeof document !== 'undefined') {
  renderSites();
  renderAlerts();
  $('#power-chart').innerHTML = chartMarkup('24h');
  $('[data-view="overview"]').setAttribute('aria-current', 'page');
  $('#site-search').addEventListener('input', renderSites);
  $('#status-filter').addEventListener('change', renderSites);
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-period]').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    $('#power-chart').innerHTML = chartMarkup(button.dataset.period);
    $('#power-chart').setAttribute('aria-label', `Simulated fleet voltage chart for ${button.dataset.period}`);
    const values = periods[button.dataset.period].values;
    $('#voltage-value').innerHTML = `${(values.reduce((a,b) => a+b, 0) / values.length).toFixed(1)} <span>V</span>`;
  }));
  $('#show-alerts').addEventListener('click', () => setView('alerts'));
  $('#alert-list').addEventListener('click', event => {
    const button = event.target.closest('[data-alert]');
    if (!button) return;
    const alert = alerts.find(item => item.id === button.dataset.alert);
    alert.acknowledged = true;
    renderAlerts();
    $(`[data-alert="${alert.id}"]`).focus();
    notify('Alert acknowledged in this demo session.');
  });
  $('#site-rows').addEventListener('click', event => {
    const button = event.target.closest('[data-site]');
    if (!button) return;
    const site = sites.find(item => item.id === button.dataset.site);
    $('#dialog-title').textContent = site.name;
    const details = [['DC voltage', `${site.voltage} V`], ['Load current', `${site.current} A`], ['Temperature', `${site.temperature} °C`], ['Battery health', `${site.battery}%`], ['Protocol', site.protocol], ['Health status', statusLabel[site.status]]];
    $('#dialog-content').innerHTML = `<div class="dialog-grid">${details.map(([label,value]) => `<div class="dialog-stat"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
    $('#site-dialog').showModal();
  });
  $('#close-dialog').addEventListener('click', () => $('#site-dialog').close());
  $('#site-dialog').addEventListener('click', event => {
    if (event.target !== $('#site-dialog')) return;
    const bounds = event.target.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close();
  });
  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#sidebar').classList.toggle('open');
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      $('#sidebar').classList.remove('open');
      $('#menu-toggle').setAttribute('aria-expanded', 'false');
    }
  });
  $('#export-button').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob(['\uFEFF', reportCsv()], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rakhsha-demo-report.csv';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Demo fleet report exported.');
  });
}
if (typeof module !== 'undefined') module.exports = { sites, alerts, periods, filterSites, chartMarkup, reportCsv };
