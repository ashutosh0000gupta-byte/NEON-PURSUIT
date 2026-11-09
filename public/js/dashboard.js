/**
 * NEON PURSUIT - Dynamic Ad Operations & Analytics Controller
 */
(function () {
  let analyticsData = null;
  let autoRefreshTimer = null;

  document.addEventListener('DOMContentLoaded', initDashboard);

  function initDashboard() {
    console.log('📊 Initializing Ad Operations Dashboard...');

    fetchAnalytics();

    // Auto refresh every 2.5 seconds
    autoRefreshTimer = setInterval(fetchAnalytics, 2500);

    // Event listeners
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', fetchAnalytics);

    const resetBtn = document.getElementById('btn-reset-stats');
    if (resetBtn) resetBtn.addEventListener('click', confirmResetStats);
  }

  // Fetch real-time analytics from server
  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      analyticsData = data;
      renderDashboard(data);
    } catch (err) {
      console.warn('Dashboard fetch failed (check server):', err.message);
    }
  }

  // Render complete dashboard
  function renderDashboard(data) {
    if (!data) return;

    const m = data.metrics;

    // 1. KPI Cards
    document.getElementById('kpi-total-impressions').textContent = m.totalImpressions.toLocaleString();
    document.getElementById('kpi-valid-impressions').textContent = m.validImpressions.toLocaleString();
    document.getElementById('kpi-view-rate').textContent = `${m.verificationRate}%`;
    document.getElementById('kpi-total-revenue').textContent = `₹${m.totalRevenue.toFixed(2)}`;

    // 2. Billboards Inventory Grid
    renderBillboardGrid(data.billboardStats, data.campaigns);

    // 3. Recent Impressions Table
    renderImpressionsTable(data.recentImpressions);
  }

  // Render Billboard Inventory Cards
  function renderBillboardGrid(billboards, campaigns) {
    const container = document.getElementById('billboard-grid-container');
    if (!container || !billboards) return;

    // Preserve selected elements to avoid flickering on auto-refresh
    container.innerHTML = billboards.map(bb => {
      // Find matching campaign options
      const campaignOptions = (campaigns || []).map(c => {
        const isSelected = c.name === bb.activeCampaign ? 'selected' : '';
        return `<option value="${c.id}" ${isSelected}>${c.name} (CPM ₹${c.cpm})</option>`;
      }).join('');

      return `
        <div class="bb-card" id="card-${bb.id}">
          <div class="bb-preview-container">
            <span class="bb-badge">${bb.id}</span>
            <img src="${bb.image}" alt="${bb.name}" class="bb-preview-img" onerror="this.src='/assets/ads/default_ad.svg'">
          </div>
          <div class="bb-content">
            <h4 class="bb-name">${bb.name}</h4>
            <div class="bb-loc">📍 ${bb.location}</div>

            <div class="bb-metrics-row">
              <div class="bb-metric">
                <span class="bb-m-label">VALID VIEWS</span>
                <span class="bb-m-val">${bb.validImpressions}</span>
              </div>
              <div class="bb-metric">
                <span class="bb-m-label">CPM RATE</span>
                <span class="bb-m-val">₹${bb.cpm}</span>
              </div>
              <div class="bb-metric">
                <span class="bb-m-label">REVENUE</span>
                <span class="bb-m-val rev">₹${bb.revenueGenerated.toFixed(2)}</span>
              </div>
            </div>

            <label class="bb-select-label">ACTIVE ADVERTISER CAMPAIGN:</label>
            <select class="bb-select" data-billboard-id="${bb.id}" onchange="switchCampaign(this)">
              ${campaignOptions}
            </select>
          </div>
        </div>
      `;
    }).join('');
  }

  // Handle Dynamic Campaign Switching
  window.switchCampaign = async function (selectElem) {
    const billboardId = selectElem.getAttribute('data-billboard-id');
    const campaignId = selectElem.value;

    console.log(`[Switch Campaign] Billboard ${billboardId} -> ${campaignId}`);

    try {
      const res = await fetch('/api/admin/campaigns/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billboardId, campaignId })
      });
      const result = await res.json();
      console.log('Switch Result:', result);
      fetchAnalytics();
    } catch (e) {
      alert('Failed to switch campaign: ' + e.message);
    }
  };

  // Render Live Impression Stream Table
  function renderImpressionsTable(impressions) {
    const tbody = document.getElementById('impressions-tbody');
    if (!tbody) return;

    if (!impressions || impressions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: #64748b; padding: 30px;">
            No impressions recorded yet. Start driving in the 3D City to generate real-time viewability beacons!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = impressions.map(imp => {
      const date = new Date(imp.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const statusBadge = imp.valid
        ? `<span class="badge badge-valid">✓ VERIFIED</span>`
        : `<span class="badge badge-invalid" title="${imp.reason}">✕ REJECTED</span>`;
      const revStr = imp.valid ? `<span class="rev-plus">+₹${imp.revenueEarned.toFixed(3)}</span>` : `<span style="color:#64748b">₹0.00</span>`;

      return `
        <tr>
          <td class="time-stamp">${timeStr}</td>
          <td><code style="color:#00f7ff">${imp.id}</code></td>
          <td><b>${imp.billboardId}</b></td>
          <td>${imp.campaignName || 'Ad'} <span style="color:#64748b">(${imp.advertiser || 'Network'})</span></td>
          <td>${imp.distance}m</td>
          <td>${imp.dwellTime}s</td>
          <td>${imp.facingAngle}°</td>
          <td>${statusBadge}</td>
          <td>${revStr}</td>
        </tr>
      `;
    }).join('');
  }

  // Reset Stats confirmation
  async function confirmResetStats() {
    if (!confirm('Are you sure you want to reset all impression logs and ad revenue stats?')) return;

    try {
      await fetch('/api/admin/reset-stats', { method: 'POST' });
      fetchAnalytics();
    } catch (e) {
      alert('Failed to reset: ' + e.message);
    }
  }
})();

