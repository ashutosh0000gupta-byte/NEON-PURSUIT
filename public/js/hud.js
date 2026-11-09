/**
 * NEON PURSUIT - Authentic Need for Speed: Most Wanted (2005) HUD Interface
 * Recreating:
 * - Circular Tachometer & Speedometer with Needle & Redline
 * - Dual Vertical Gauges: NOS (Blue) & Speedbreaker (Orange)
 * - Most Wanted Heat Level & Police Pursuit Status Bar
 * - Cooldown / Evade Meter (Green Evading Bar)
 * - Bounty & Cost to State Counter
 * - Dynamic Ad Telemetry Panel
 * - Radar Mini-Map with Police Radar Blips
 */
class GameHUD {
  constructor() {
    this.container = null;
    this.telemetryVisible = true;

    // Elements
    this.speedText = null;
    this.gearText = null;
    this.rpmNeedle = null;
    this.rpmFillArc = null;
    this.nitroBar = null;
    this.speedbreakerBar = null;
    this.driftText = null;
    this.wantedBar = null;
    this.adNotice = null;
    this.revenueText = null;
    this.minimapCanvas = null;
    this.minimapCtx = null;

    // Pursuit elements
    this.pursuitPanel = null;
    this.pursuitStatusTxt = null;
    this.pursuitBountyTxt = null;
    this.cooldownFill = null;
    this.evadedBanner = null;

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
    const hud = document.createElement('div');
    hud.id = 'neon-hud';
    hud.innerHTML = `
      <!-- TOP STATUS: PURSUIT, HEAT LEVEL & BOUNTY -->
      <div class="hud-top-bar">
        <!-- Most Wanted Heat Level Badge -->
        <div class="wanted-meter" id="hud-heat-meter">
          <div class="heat-icon">🔥</div>
          <div class="heat-info">
            <span class="heat-title" id="hud-heat-title">HEAT LEVEL 1</span>
            <span class="heat-sub" id="hud-heat-sub">PATROL UNITS IN AREA</span>
          </div>
          <div class="heat-bars">
            <div class="hbar active" id="hbar-1"></div>
            <div class="hbar" id="hbar-2"></div>
            <div class="hbar" id="hbar-3"></div>
            <div class="hbar" id="hbar-4"></div>
            <div class="hbar" id="hbar-5"></div>
          </div>
        </div>

        <!-- Most Wanted Police Pursuit & Cooldown Bar -->
        <div class="pursuit-cooldown-panel" id="hud-cooldown-panel">
          <div class="cd-header">
            <span class="cd-status" id="hud-pursuit-status-txt">PATROL RADAR: STANDBY</span>
            <span class="cd-bounty" id="hud-bounty-txt">BOUNTY: $12,500</span>
          </div>
          <div class="cd-track">
            <div class="cd-fill" id="hud-cooldown-fill"></div>
          </div>
        </div>

        <!-- In-Game Ad Revenue & Bounty -->
        <div class="revenue-hud">
          <span class="rev-label">TOTAL AD REVENUE</span>
          <span class="rev-val" id="hud-total-rev">₹0.00</span>
        </div>

        <!-- Drift Score Box -->
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
            <span class="legend-dot cop-dot"></span> POLICE
            <span class="legend-dot bb-dot"></span> AD
          </div>
        </div>
      </div>

      <!-- BOTTOM RIGHT: MOST WANTED 2005 CIRCULAR GAUGE CLUSTER -->
      <div class="hud-bottom-right">
        <div class="mw-gauge-cluster">
          <!-- Left Vertical Bar: NOS -->
          <div class="mw-side-bar mw-nos-bar">
            <span class="side-bar-label">NOS</span>
            <div class="side-bar-track">
              <div class="side-bar-fill nos-fill" id="hud-nitro-fill"></div>
            </div>
          </div>

          <!-- Main Circular Most Wanted Dial -->
          <div class="mw-dial-face">
            <svg class="mw-dial-svg" viewBox="0 0 200 200">
              <!-- Outer Metallic Bezel -->
              <circle cx="100" cy="100" r="92" fill="none" stroke="#252b35" stroke-width="8"/>
              <circle cx="100" cy="100" r="92" fill="none" stroke="#ff8c00" stroke-width="2" stroke-dasharray="14 8" opacity="0.6"/>
              
              <!-- RPM Dial Arc (from 135 deg to 405 deg) -->
              <circle cx="100" cy="100" r="76" fill="none" stroke="#121822" stroke-width="12"/>
              <path id="hud-rpm-arc" d="M 46 154 A 76 76 0 1 1 154 154" fill="none" stroke="#ff8c00" stroke-width="10" stroke-dasharray="356" stroke-dashoffset="356"/>
              
              <!-- Redline Indicator (8000+ RPM) -->
              <path d="M 130 50 A 76 76 0 0 1 154 154" fill="none" stroke="#ff2200" stroke-width="12" opacity="0.8"/>
            </svg>

            <!-- Center Digital Speedometer & Gear -->
            <div class="mw-dial-center">
              <div class="gear-badge" id="hud-gear">1</div>
              <div class="speed-readout">
                <span class="speed-number" id="hud-speed">0</span>
                <span class="speed-unit">KM/H</span>
              </div>
            </div>

            <!-- Rotating Needle -->
            <div class="mw-needle-pivot" id="hud-needle-pivot">
              <div class="mw-needle-blade"></div>
            </div>
          </div>

          <!-- Right Vertical Bar: SPEEDBREAKER -->
          <div class="mw-side-bar mw-sb-bar">
            <span class="side-bar-label">SB</span>
            <div class="side-bar-track">
              <div class="side-bar-fill sb-fill" id="hud-sb-fill"></div>
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

      <!-- AD IMPRESSION NOTIFICATION POPUP -->
      <div class="ad-verified-toast" id="hud-ad-toast">
        <div class="toast-icon">⚡</div>
        <div class="toast-content">
          <div class="toast-title">AD IMPRESSION VERIFIED!</div>
          <div class="toast-desc" id="hud-toast-desc">APEX RACING TIRES</div>
          <div class="toast-payout" id="hud-toast-payout">+₹0.12 EARNED</div>
        </div>
      </div>

      <!-- FULLSCREEN PURSUIT EVADED VICTORY MODAL -->
      <div class="mw-evaded-modal" id="hud-evaded-modal">
        <div class="evaded-stamp">PURSUIT EVADED</div>
        <div class="evaded-sub">SUSPECT HAS BROKEN POLICE PERIMETER</div>
        <div class="evaded-stats-row">
          <div class="e-stat">
            <span class="e-lbl">BOUNTY REWARD</span>
            <span class="e-val" id="evaded-bounty-val">$15,000</span>
          </div>
          <div class="e-stat">
            <span class="e-lbl">COST TO STATE</span>
            <span class="e-val" id="evaded-cost-val">$8,400</span>
          </div>
          <div class="e-stat">
            <span class="e-lbl">NEXT HEAT</span>
            <span class="e-val" id="evaded-heat-val">HEAT 2</span>
          </div>
        </div>
      </div>

      <!-- CONTROLS HELP HINT -->
      <div class="hud-controls-hint">
        <span><b>W/▲</b> GAS</span>
        <span><b>S/▼</b> BRAKE</span>
        <span><b>A/D</b> STEER</span>
        <span><b>SPACE</b> DRIFT</span>
        <span><b>SHIFT</b> NITRO</span>
        <span><b>X</b> SPEEDBREAKER</span>
        <span><b>P</b> POLICE</span>
        <span><b>E</b> SPRINT RACE</span>
        <span><b>C</b> CAM</span>
        <span><b>R</b> RESET</span>
        <span><b>H</b> ADS</span>
      </div>
    `;

    document.body.appendChild(hud);
    this.container = hud;

    // Cache elements
    this.speedText = document.getElementById('hud-speed');
    this.gearText = document.getElementById('hud-gear');
    this.needlePivot = document.getElementById('hud-needle-pivot');
    this.rpmArc = document.getElementById('hud-rpm-arc');
    this.nitroBar = document.getElementById('hud-nitro-fill');
    this.speedbreakerBar = document.getElementById('hud-sb-fill');
    this.driftText = document.getElementById('hud-drift-score');
    this.driftBox = document.getElementById('hud-drift-box');
    this.revenueText = document.getElementById('hud-total-rev');
    this.adToast = document.getElementById('hud-ad-toast');
    this.toastDesc = document.getElementById('hud-toast-desc');
    this.toastPayout = document.getElementById('hud-toast-payout');

    // Pursuit & Heat
    this.pursuitPanel = document.getElementById('hud-cooldown-panel');
    this.pursuitStatusTxt = document.getElementById('hud-pursuit-status-txt');
    this.pursuitBountyTxt = document.getElementById('hud-bounty-txt');
    this.cooldownFill = document.getElementById('hud-cooldown-fill');
    this.evadedModal = document.getElementById('hud-evaded-modal');
    this.heatTitle = document.getElementById('hud-heat-title');
    this.heatSub = document.getElementById('hud-heat-sub');

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

  // Update speedometer, RPM, needle, and radar on every frame
  update(vehicle, billboards, police) {
    if (!vehicle) return;

    // 1. Digital Speed & Gear
    const speed = Math.round(Math.abs(vehicle.speedKmh));
    this.speedText.textContent = speed;
    this.gearText.textContent = vehicle.gear;

    // 2. Analog Needle & RPM Arc
    // Needle rotates from -125 deg (idle ~800 RPM) to +125 deg (redline ~8500 RPM)
    const rpmRatio = Math.max(0, Math.min(1, (vehicle.rpm - 900) / (vehicle.maxRpm - 900)));
    const needleAngle = -125 + rpmRatio * 250;
    if (this.needlePivot) {
      this.needlePivot.style.transform = `rotate(${needleAngle}deg)`;
    }

    // Arc stroke fill (total length 356)
    if (this.rpmArc) {
      const arcOffset = 356 - (rpmRatio * 260);
      this.rpmArc.style.strokeDashoffset = arcOffset;
    }

    // 3. Dual Vertical Sidebars: NOS & Speedbreaker
    if (this.nitroBar) {
      this.nitroBar.style.height = `${vehicle.nitroFuel}%`;
    }
    if (this.speedbreakerBar) {
      this.speedbreakerBar.style.height = `${vehicle.speedbreaker || 100}%`;
    }

    // 4. Drift Score
    if (vehicle.isDrifting) {
      this.driftBox.classList.add('active');
      this.driftText.textContent = `${vehicle.driftScore.toLocaleString()} PTS`;
    } else if (vehicle.driftScore > 0) {
      this.driftBox.classList.remove('active');
    }

    // 5. Radar Mini-Map
    this.drawRadar(vehicle, billboards, police);
  }

  // Draw 2D rotating top-down radar with player, billboards, and police
  drawRadar(vehicle, billboards, police) {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radarScale = 0.45;

    ctx.clearRect(0, 0, w, h);

    // Dark radar background with Most Wanted amber tint
    ctx.fillStyle = 'rgba(15, 18, 22, 0.88)';
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 4, 0, Math.PI * 2);
    ctx.fill();

    // Radar Range Rings
    ctx.strokeStyle = 'rgba(255, 140, 0, 0.2)';
    ctx.lineWidth = 1;
    [30, 60, 80].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    const carPos = vehicle.position;
    const carHeadingRad = (vehicle.heading + vehicle.driftAngle) * pc.math.DEG_TO_RAD;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-carHeadingRad);

    // Roads
    ctx.fillStyle = 'rgba(255, 200, 100, 0.1)';
    ctx.fillRect((-13 - carPos.x) * radarScale, (-180 - carPos.z) * radarScale, 26 * radarScale, 360 * radarScale);
    ctx.fillRect((-180 - carPos.x) * radarScale, (-13 - carPos.z) * radarScale, 360 * radarScale, 26 * radarScale);

    // Billboards on Radar (Golden squares)
    if (billboards) {
      billboards.forEach(bb => {
        const bbPos = bb.getWorldPosition();
        const rx = (bbPos.x - carPos.x) * radarScale;
        const rz = (bbPos.z - carPos.z) * radarScale;

        if (Math.hypot(rx, rz) < cx - 8) {
          ctx.fillStyle = '#ffb703';
          ctx.beginPath();
          ctx.arc(rx, rz, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Police Cruisers on Radar (Pulsing Red & Blue circles)
    if (police && police.cruisers) {
      police.cruisers.forEach(cop => {
        const rx = (cop.pos.x - carPos.x) * radarScale;
        const rz = (cop.pos.z - carPos.z) * radarScale;

        if (Math.hypot(rx, rz) < cx - 8) {
          ctx.fillStyle = cop.isChasing ? '#ff1a1a' : '#ffffff';
          ctx.beginPath();
          ctx.arc(rx, rz, 5.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#00f7ff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    ctx.restore();

    // Player Car triangle (Silver & Blue)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx - 6, cy + 7);
    ctx.lineTo(cx, cy + 4);
    ctx.lineTo(cx + 6, cy + 7);
    ctx.closePath();
    ctx.fill();

    // Outer Bezel Ring
    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Update Pursuit & Cooldown Bar (NFS Most Wanted 2005)
  updatePursuitBar(p) {
    if (!p) return;

    if (p.active) {
      this.pursuitPanel.classList.add('active');

      if (p.inCooldown) {
        this.pursuitStatusTxt.textContent = 'EVADING POLICE PERIMETER...';
        this.pursuitStatusTxt.className = 'cd-status evading';
        this.cooldownFill.className = 'cd-fill evading-fill';
        this.cooldownFill.style.width = `${p.evadeProgress * 100}%`;
      } else {
        this.pursuitStatusTxt.textContent = `🚨 PURSUIT ENGAGED (HEAT ${p.heatLevel})`;
        this.pursuitStatusTxt.className = 'cd-status chasing';
        this.cooldownFill.className = 'cd-fill chasing-fill';
        this.cooldownFill.style.width = '100%';
      }

      this.pursuitBountyTxt.textContent = `BOUNTY: $${p.bounty.toLocaleString()} | DAMAGE: $${p.costToState.toLocaleString()}`;
    } else {
      this.pursuitPanel.classList.remove('active');
    }

    // Update Heat Level Flame Bars
    this.heatTitle.textContent = `HEAT LEVEL ${p.heatLevel}`;
    for (let i = 1; i <= 5; i++) {
      const hbar = document.getElementById(`hbar-${i}`);
      if (hbar) {
        hbar.classList.toggle('active', i <= p.heatLevel);
      }
    }
  }

  // Show Pursuit Evaded Modal
  showPursuitEvadedModal(p) {
    document.getElementById('evaded-bounty-val').textContent = `$${p.bounty.toLocaleString()}`;
    document.getElementById('evaded-cost-val').textContent = `$${p.costToState.toLocaleString()}`;
    document.getElementById('evaded-heat-val').textContent = `HEAT ${p.heatLevel}`;

    this.evadedModal.classList.add('show');
    setTimeout(() => {
      this.evadedModal.classList.remove('show');
    }, 4500);
  }

  // Update Telemetry Panel
  updateTelemetry(t) {
    if (!this.telemetryVisible || !t) return;
    this.teleBillboardName.textContent = t.campaign?.name ? t.campaign.name.slice(0, 22) : t.name.slice(0, 22);

    this.teleDistance.textContent = `${t.distance.toFixed(1)}m`;
    this.teleDistance.style.color = t.distance <= 85 ? '#39ff14' : '#ff4444';

    this.teleFrustum.textContent = t.inFrustum ? 'IN VIEWPORT' : 'OFF-SCREEN';
    this.teleFrustum.style.color = t.inFrustum ? '#39ff14' : '#ff4444';

    this.teleAngle.textContent = `${t.facingAngle.toFixed(1)}°`;
    this.teleAngle.style.color = t.facingAngle < 75 ? '#39ff14' : '#ff4444';

    const dwellRatio = Math.min(1, t.dwellTime / 1.5);
    this.teleDwellProgress.style.width = `${dwellRatio * 100}%`;
    this.teleDwellTxt.textContent = `${t.dwellTime.toFixed(1)}s / 1.5s`;

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

  // Show Toast Popup
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
