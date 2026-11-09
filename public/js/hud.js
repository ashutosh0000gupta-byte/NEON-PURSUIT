/**
 * NEON PURSUIT - In-Game HUD & Ad Telemetry Display
 * Inspired by Need for Speed: Most Wanted (2005)
 */
class GameHUD {
  constructor() {
    this.container = null;
    this.telemetryVisible = true;

    // Elements
    this.speedText = null;
    this.gearText = null;
    this.rpmBar = null;
    this.nitroBar = null;
    this.driftText = null;
    this.wantedBar = null;
    this.adNotice = null;
    this.revenueText = null;
    this.minimapCanvas = null;
    this.minimapCtx = null;

    // Telemetry Elements
    this.teleBillboardName = null;
    this.teleDistance = null;
    this.teleFrustum = null;
    this.teleAngle = null;
    this.teleDwellProgress = null;
    this.teleStatus = null;

    this.initDOM();
  }

  initDOM() {
    // 1. Main HUD Wrapper
    const hud = document.createElement('div');
    hud.id = 'neon-hud';
    hud.innerHTML = `
      <!-- TOP STATUS: PURSUIT & DRIFT -->
      <div class="hud-top-bar">
        <div class="wanted-meter">
          <div class="heat-icon">🔥</div>
          <div class="heat-info">
            <span class="heat-title">HEAT LEVEL 1</span>
            <span class="heat-sub">CITY PATROL ACTIVE</span>
          </div>
          <div class="heat-bars">
            <div class="hbar active"></div>
            <div class="hbar"></div>
            <div class="hbar"></div>
            <div class="hbar"></div>
            <div class="hbar"></div>
          </div>
        </div>

        <div class="revenue-hud">
          <span class="rev-label">TOTAL AD REVENUE</span>
          <span class="rev-val" id="hud-total-rev">₹0.00</span>
        </div>

        <div class="drift-box" id="hud-drift-box">
          <span class="drift-label">DRIFT SCORE</span>
          <span class="drift-score" id="hud-drift-score">0 PTS</span>
        </div>
      </div>

      <!-- BOTTOM LEFT: MINIMAP RADAR -->
      <div class="hud-bottom-left">
        <div class="radar-container">
          <canvas id="radar-canvas" width="180" height="180"></canvas>
          <div class="radar-legend">
            <span class="legend-dot car-dot"></span> CAR
            <span class="legend-dot bb-dot"></span> BILLBOARD
          </div>
        </div>
      </div>

      <!-- BOTTOM RIGHT: SPEEDOMETER & TACHOMETER -->
      <div class="hud-bottom-right">
        <div class="speedo-cluster">
          <div class="gear-badge" id="hud-gear">1</div>
          <div class="speed-readout">
            <span class="speed-number" id="hud-speed">0</span>
            <span class="speed-unit">KM/H</span>
          </div>
          <div class="rpm-meter">
            <div class="rpm-fill" id="hud-rpm-fill"></div>
          </div>
          <div class="nitro-meter">
            <span class="nitro-label">NOS</span>
            <div class="nitro-track">
              <div class="nitro-fill" id="hud-nitro-fill"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- TOP RIGHT: LIVE AD IMPRESSION TELEMETRY -->
      <div class="hud-telemetry-panel" id="hud-telemetry">
        <div class="tele-header">
          <span class="tele-dot"></span>
          <span>DYNAMIC AD VERIFIER</span>
          <span class="tele-toggle-hint">[H] HIDE</span>
        </div>
        <div class="tele-body">
          <div class="tele-row">
            <span class="t-key">TARGET:</span>
            <span class="t-val" id="tele-bb-name">SCANNING...</span>
          </div>
          <div class="tele-row">
            <span class="t-key">DISTANCE:</span>
            <span class="t-val" id="tele-distance">-- m</span>
          </div>
          <div class="tele-row">
            <span class="t-key">VIEWPORT:</span>
            <span class="t-val" id="tele-frustum">--</span>
          </div>
          <div class="tele-row">
            <span class="t-key">FACE ANGLE:</span>
            <span class="t-val" id="tele-angle">--°</span>
          </div>
          <div class="tele-progress-wrapper">
            <div class="tele-prog-label">
              <span>DWELL TIME (MIN 1.5s):</span>
              <span id="tele-dwell-txt">0.0s / 1.5s</span>
            </div>
            <div class="tele-bar-track">
              <div class="tele-bar-fill" id="tele-bar-fill"></div>
            </div>
          </div>
          <div class="tele-status-tag" id="tele-status">OUT OF RANGE</div>
        </div>
      </div>

      <!-- CENTER AD IMPRESSION NOTIFICATION POPUP -->
      <div class="ad-verified-toast" id="hud-ad-toast">
        <div class="toast-icon">⚡</div>
        <div class="toast-content">
          <div class="toast-title">AD IMPRESSION VERIFIED!</div>
          <div class="toast-desc" id="hud-toast-desc">APEX RACING TIRES</div>
          <div class="toast-payout" id="hud-toast-payout">+₹0.12 EARNED</div>
        </div>
      </div>

      <!-- CONTROLS HELP HINT -->
      <div class="hud-controls-hint">
        <span><b>W/▲</b> GAS</span>
        <span><b>S/▼</b> BRAKE</span>
        <span><b>A/D</b> STEER</span>
        <span><b>SPACE</b> DRIFT</span>
        <span><b>SHIFT</b> NITRO</span>
        <span><b>E</b> RACE EVENT</span>
        <span><b>C</b> CAMERA</span>
        <span><b>R</b> RESET</span>
        <span><b>H</b> TELEMETRY</span>
      </div>
    `;

    document.body.appendChild(hud);
    this.container = hud;

    // Cache elements
    this.speedText = document.getElementById('hud-speed');
    this.gearText = document.getElementById('hud-gear');
    this.rpmBar = document.getElementById('hud-rpm-fill');
    this.nitroBar = document.getElementById('hud-nitro-fill');
    this.driftText = document.getElementById('hud-drift-score');
    this.driftBox = document.getElementById('hud-drift-box');
    this.revenueText = document.getElementById('hud-total-rev');
    this.adToast = document.getElementById('hud-ad-toast');
    this.toastDesc = document.getElementById('hud-toast-desc');
    this.toastPayout = document.getElementById('hud-toast-payout');

    // Telemetry
    this.teleBillboardName = document.getElementById('tele-bb-name');
    this.teleDistance = document.getElementById('tele-distance');
    this.teleFrustum = document.getElementById('tele-frustum');
    this.teleAngle = document.getElementById('tele-angle');
    this.teleDwellProgress = document.getElementById('tele-bar-fill');
    this.teleDwellTxt = document.getElementById('tele-dwell-txt');
    this.teleStatus = document.getElementById('tele-status');

    // Radar canvas
    this.minimapCanvas = document.getElementById('radar-canvas');
    if (this.minimapCanvas) {
      this.minimapCtx = this.minimapCanvas.getContext('2d');
    }

    // Key listener for toggle telemetry
    window.addEventListener('keydown', (e) => {
      if (e.key === 'h' || e.key === 'H') {
        this.toggleTelemetry();
      }
    });
  }

  toggleTelemetry() {
    this.telemetryVisible = !this.telemetryVisible;
    const panel = document.getElementById('hud-telemetry');
    if (panel) {
      panel.style.display = this.telemetryVisible ? 'block' : 'none';
    }
  }

  // Update speedometer, RPM, radar on every frame
  update(vehicle, billboards) {
    if (!vehicle) return;

    // 1. Speed & Gear
    const speed = Math.round(Math.abs(vehicle.speedKmh));
    this.speedText.textContent = speed;
    this.gearText.textContent = vehicle.gear;

    // 2. RPM Bar (0% to 100%)
    const rpmRatio = Math.max(0, Math.min(1, (vehicle.rpm - 900) / (vehicle.maxRpm - 900)));
    this.rpmBar.style.width = `${rpmRatio * 100}%`;
    if (rpmRatio > 0.85) {
      this.rpmBar.classList.add('redline');
    } else {
      this.rpmBar.classList.remove('redline');
    }

    // 3. Nitro Bar
    this.nitroBar.style.width = `${vehicle.nitroFuel}%`;

    // 4. Drift Score
    if (vehicle.isDrifting) {
      this.driftBox.classList.add('active');
      this.driftText.textContent = `${vehicle.driftScore.toLocaleString()} PTS`;
    } else if (vehicle.driftScore > 0) {
      this.driftBox.classList.remove('active');
    }

    // 5. Radar Mini-Map
    this.drawRadar(vehicle, billboards);
  }

  // Draw 2D rotating top-down radar
  drawRadar(vehicle, billboards) {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radarScale = 0.45; // pixels per world meter

    ctx.clearRect(0, 0, w, h);

    // Dark radar background
    ctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 4, 0, Math.PI * 2);
    ctx.fill();

    // Radar Range Rings
    ctx.strokeStyle = 'rgba(0, 247, 255, 0.18)';
    ctx.lineWidth = 1;
    [30, 60, 80].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.strokeStyle = 'rgba(0, 247, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, 4); ctx.lineTo(cx, h - 4);
    ctx.moveTo(4, cy); ctx.lineTo(w - 4, cy);
    ctx.stroke();

    // Transform world to car-relative coordinates
    const carPos = vehicle.position;
    const carHeadingRad = (vehicle.heading + vehicle.driftAngle) * pc.math.DEG_TO_RAD;

    // Draw City Roads on radar
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-carHeadingRad);

    // North-South Expressway
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect((-13 - carPos.x) * radarScale, (-180 - carPos.z) * radarScale, 26 * radarScale, 360 * radarScale);
    // East-West Boulevard
    ctx.fillRect((-180 - carPos.x) * radarScale, (-13 - carPos.z) * radarScale, 360 * radarScale, 26 * radarScale);

    // Draw Billboards on Radar (pulsing yellow/cyan blips)
    if (billboards) {
      billboards.forEach(bb => {
        const bbPos = bb.getWorldPosition();
        const rx = (bbPos.x - carPos.x) * radarScale;
        const rz = (bbPos.z - carPos.z) * radarScale;

        // Check if within radar circle radius
        if (Math.hypot(rx, rz) < cx - 8) {
          ctx.fillStyle = '#ffb703';
          ctx.beginPath();
          ctx.arc(rx, rz, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }

    ctx.restore();

    // Draw Player Car triangle (always pointing straight UP on radar)
    ctx.fillStyle = '#00f7ff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx - 5, cy + 6);
    ctx.lineTo(cx, cy + 3);
    ctx.lineTo(cx + 5, cy + 6);
    ctx.closePath();
    ctx.fill();

    // Outer Neon Ring
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Update Telemetry Panel with live data from AdTracker
  updateTelemetry(t) {
    if (!this.telemetryVisible || !t) return;

    this.teleBillboardName.textContent = t.campaign?.name ? t.campaign.name.slice(0, 22) : t.name.slice(0, 22);

    // Distance
    const distText = `${t.distance.toFixed(1)}m`;
    this.teleDistance.textContent = distText;
    this.teleDistance.style.color = t.distance <= 85 ? '#39ff14' : '#ff4444';

    // Frustum
    this.teleFrustum.textContent = t.inFrustum ? 'IN VIEWPORT' : 'OFF-SCREEN';
    this.teleFrustum.style.color = t.inFrustum ? '#39ff14' : '#ff4444';

    // Angle
    this.teleAngle.textContent = `${t.facingAngle.toFixed(1)}°`;
    this.teleAngle.style.color = t.facingAngle < 75 ? '#39ff14' : '#ff4444';

    // Dwell Progress (0 to 1.5s)
    const dwellRatio = Math.min(1, t.dwellTime / 1.5);
    this.teleDwellProgress.style.width = `${dwellRatio * 100}%`;
    this.teleDwellTxt.textContent = `${t.dwellTime.toFixed(1)}s / 1.5s`;

    // Status Tag
    if (t.cooldown > 0) {
      this.teleStatus.textContent = `COOLDOWN (${t.cooldown}s)`;
      this.teleStatus.className = 'tele-status-tag warning';
    } else if (t.isEligible) {
      this.teleStatus.textContent = dwellRatio >= 0.99 ? 'IMPRESSION VERIFIED!' : 'TRACKING VIEWABILITY...';
      this.teleStatus.className = 'tele-status-tag tracking';
    } else {
      this.teleStatus.textContent = 'STANDBY / OUT OF VIEW';
      this.teleStatus.className = 'tele-status-tag standby';
    }
  }

  // Show Toast Popup when impression is verified
  showImpressionToast(data) {
    this.toastDesc.textContent = `${data.campaign?.name || 'Billboard Ad'} (${data.billboard?.id})`;
    this.toastPayout.textContent = `+₹${data.revenue.toFixed(2)} EARNED`;
    this.revenueText.textContent = `₹${data.totalRevenue.toFixed(2)}`;

    this.adToast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.adToast.classList.remove('show');
    }, 4200);
  }
}

window.GameHUD = GameHUD;

