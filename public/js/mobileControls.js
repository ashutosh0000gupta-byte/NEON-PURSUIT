/**
 * NEON PURSUIT - Mobile Touch Controls System
 * Provides intuitive, responsive on-screen touch virtual controller:
 * - Steering D-Pad (Left/Right)
 * - Gas Pedal (Accelerate)
 * - Brake/Reverse Pedal
 * - Drift / Handbrake Button
 * - Nitro (NOS) Button
 * - Quick Action Buttons (Camera, Reset, Race Event, Ads HUD)
 * - Multi-touch support with haptic feedback
 */
class MobileControlsManager {
  constructor() {
    // Shared global state for Vehicle.js and Game.js
    window.TouchControls = {
      gas: false,
      brake: false,
      left: false,
      right: false,
      drift: false,
      nitro: false,
      reset: false,
      cam: false,
      race: false,
      telemetry: false
    };

    // Auto-detect mobile device or small screen
    this.isTouchDevice = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 1024
    );

    this.container = null;
    this.enabled = this.isTouchDevice;

    this.initDOM();
  }

  initDOM() {
    // 1. Create Floating Toggle Button in Top Bar (so desktop users can test touch too)
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-touch-controls-btn';
    toggleBtn.className = 'touch-mode-toggle-btn';
    toggleBtn.innerHTML = '📱 CONTROLS: ' + (this.enabled ? 'ON' : 'OFF');
    toggleBtn.onclick = () => this.toggleTouchMode();
    document.body.appendChild(toggleBtn);

    // 2. Main Mobile Overlay Container
    const overlay = document.createElement('div');
    overlay.id = 'mobile-touch-overlay';
    overlay.className = 'mobile-touch-overlay' + (this.enabled ? ' active' : '');
    overlay.innerHTML = `
      <!-- TOP ACTION PILLS -->
      <div class="mobile-top-actions">
        <button class="m-pill-btn" id="m-btn-cam">📷 CAM</button>
        <button class="m-pill-btn" id="m-btn-garage" style="color: #ff8c00; border-color: rgba(255, 140, 0, 0.4);">🔧 GARAGE</button>
        <button class="m-pill-btn" id="m-btn-cop" style="color: #ff3333; border-color: rgba(255, 50, 50, 0.4);">🚨 POLICE</button>
        <button class="m-pill-btn" id="m-btn-reset">🔄 RESET</button>
        <button class="m-pill-btn" id="m-btn-race">🏁 RACE</button>
        <button class="m-pill-btn" id="m-btn-ads">📊 ADS</button>
      </div>

      <!-- BOTTOM LEFT: STEERING CLUSTER -->
      <div class="mobile-steer-cluster">
        <button class="m-touch-btn m-btn-steer" id="m-btn-left" aria-label="Steer Left">
          <span class="m-btn-arrow">◄</span>
          <span class="m-btn-label">LEFT</span>
        </button>
        <button class="m-touch-btn m-btn-steer" id="m-btn-right" aria-label="Steer Right">
          <span class="m-btn-arrow">►</span>
          <span class="m-btn-label">RIGHT</span>
        </button>
      </div>

      <!-- BOTTOM RIGHT: PEDALS & POWER CLUSTER -->
      <div class="mobile-pedal-cluster">
        <!-- Power row (Speedbreaker, Drift & NOS) -->
        <div class="m-power-row">
          <button class="m-touch-btn m-btn-sb" id="m-btn-sb" aria-label="Speedbreaker Slow-Mo">
            <span class="m-btn-icon">⏱️</span>
            <span class="m-btn-label">SLOW-MO</span>
          </button>
          <button class="m-touch-btn m-btn-drift" id="m-btn-drift" aria-label="Handbrake Drift">
            <span class="m-btn-icon">⚡</span>
            <span class="m-btn-label">DRIFT</span>
          </button>
          <button class="m-touch-btn m-btn-nos" id="m-btn-nos" aria-label="Nitrous Boost">
            <span class="m-btn-icon">🚀</span>
            <span class="m-btn-label">NOS</span>
          </button>
        </div>

        <!-- Pedals row (Brake & Gas) -->
        <div class="m-pedals-row">
          <button class="m-touch-btn m-btn-brake" id="m-btn-brake" aria-label="Brake and Reverse">
            <span class="m-pedal-icon">▼</span>
            <span class="m-btn-label">BRAKE</span>
          </button>
          <button class="m-touch-btn m-btn-gas" id="m-btn-gas" aria-label="Accelerate">
            <span class="m-pedal-icon">▲</span>
            <span class="m-btn-label">GAS</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.container = overlay;

    this.bindTouchEvents();
  }

  // Bind high-performance multi-touch handlers with preventDefault
  bindTouchEvents() {
    const bindBtn = (id, keyName, haptic = false) => {
      const el = document.getElementById(id);
      if (!el) return;

      const setActive = (active) => {
        window.TouchControls[keyName] = active;
        if (active) {
          el.classList.add('pressed');
          if (haptic && navigator.vibrate) {
            try { navigator.vibrate(15); } catch (e) {}
          }
        } else {
          el.classList.remove('pressed');
        }
      };

      // Touch events (Mobile)
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        setActive(true);
      }, { passive: false });

      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        setActive(false);
      }, { passive: false });

      el.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        setActive(false);
      }, { passive: false });

      // Mouse events (Desktop testing)
      el.addEventListener('mousedown', (e) => {
        setActive(true);
      });

      el.addEventListener('mouseup', (e) => {
        setActive(false);
      });

      el.addEventListener('mouseleave', (e) => {
        setActive(false);
      });
    };

    // Driving Controls
    bindBtn('m-btn-left', 'left');
    bindBtn('m-btn-right', 'right');
    bindBtn('m-btn-gas', 'gas');
    bindBtn('m-btn-brake', 'brake');
    bindBtn('m-btn-drift', 'drift', true);
    bindBtn('m-btn-nos', 'nitro', true);
    bindBtn('m-btn-sb', 'speedbreaker', true);

    // Single-tap Quick Actions
    const bindTapAction = (id, callback) => {
      const el = document.getElementById(id);
      if (!el) return;

      const trigger = (e) => {
        if (e) e.preventDefault();
        if (navigator.vibrate) {
          try { navigator.vibrate(20); } catch (err) {}
        }
        callback();
      };

      el.addEventListener('touchstart', trigger, { passive: false });
      el.addEventListener('click', trigger);
    };

    // Camera button
    bindTapAction('m-btn-cam', () => {
      // Dispatch 'C' key event
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    });

    // Garage Customization button
    bindTapAction('m-btn-garage', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    });

    // Police pursuit button
    bindTapAction('m-btn-cop', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));
    });

    // Reset button
    bindTapAction('m-btn-reset', () => {
      window.TouchControls.reset = true;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
    });

    // Race event button
    bindTapAction('m-btn-race', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true }));
    });

    // Ads Telemetry HUD toggle
    bindTapAction('m-btn-ads', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));
    });
  }

  // Toggle on-screen touch mode manually
  toggleTouchMode() {
    this.enabled = !this.enabled;
    const toggleBtn = document.getElementById('toggle-touch-controls-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = '📱 CONTROLS: ' + (this.enabled ? 'ON' : 'OFF');
      toggleBtn.classList.toggle('active', this.enabled);
    }
    if (this.container) {
      this.container.classList.toggle('active', this.enabled);
    }
    console.log(`📱 Mobile Touch Controls: ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
  }
}

window.MobileControlsManager = MobileControlsManager;

