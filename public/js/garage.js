/**
 * NEON PURSUIT - 3D Visual Tuning & Customization Garage
 * Inspired by Need for Speed: Most Wanted (2005) Safehouse / Tuning Shop:
 * - Live Body Paint Customization (M3 GTR Silver/Blue, Gloss Black, Gold, Crimson Red, Toxic Green, Purple)
 * - Neon Underglow Color Selector
 * - Performance Handling Presets (Street Balanced, Pro Drift, Drag Rocket)
 * - Real-time in-game updates with instant preview
 */
class TuningGarageManager {
  constructor(vehicle) {
    this.vehicle = vehicle;
    this.isOpen = false;
    this.container = null;

    this.initDOM();
  }

  initDOM() {
    // 1. Garage Modal Overlay
    const modal = document.createElement('div');
    modal.id = 'garage-modal-overlay';
    modal.className = 'garage-modal-overlay';
    modal.innerHTML = `
      <div class="garage-panel">
        <div class="garage-header">
          <div class="g-title-group">
            <span class="g-eyebrow">// PERFORMANCE TUNING & SAFEHOUSE</span>
            <h2 class="g-title">VEHICLE CUSTOMIZATION</h2>
          </div>
          <button class="g-close-btn" id="garage-close-btn">&times;</button>
        </div>

        <div class="garage-body">
          <!-- 1. BODY PAINT SELECTION -->
          <div class="g-section">
            <span class="g-section-label">BODY PAINT & VINYL LIVERY</span>
            <div class="g-color-grid">
              <button class="g-color-chip active" data-paint="m3-hero" style="background: linear-gradient(135deg, #c4ccd6 50%, #0d3ca6 50%);">
                <span class="chip-label">HERO M3 GTR</span>
              </button>
              <button class="g-color-chip" data-paint="midnight-black" style="background: #08080a;">
                <span class="chip-label">MIDNIGHT BLACK</span>
              </button>
              <button class="g-color-chip" data-paint="razor-gold" style="background: linear-gradient(135deg, #ffb703, #fb8500);">
                <span class="chip-label">RAZOR GOLD</span>
              </button>
              <button class="g-color-chip" data-paint="crimson-red" style="background: linear-gradient(135deg, #d90429, #ef233c);">
                <span class="chip-label">CRIMSON CANDY</span>
              </button>
              <button class="g-color-chip" data-paint="toxic-green" style="background: linear-gradient(135deg, #39ff14, #00b4d8);">
                <span class="chip-label">TOXIC LIME</span>
              </button>
              <button class="g-color-chip" data-paint="cyber-purple" style="background: linear-gradient(135deg, #7209b7, #f72585);">
                <span class="chip-label">NEO PURPLE</span>
              </button>
            </div>
          </div>

          <!-- 2. NEON UNDERGLOW SELECTION -->
          <div class="g-section">
            <span class="g-section-label">NEON GROUND UNDERGLOW</span>
            <div class="g-color-grid">
              <button class="g-glow-chip active" data-glow="cyan" style="background: #00f7ff; box-shadow: 0 0 12px #00f7ff;">
                <span>ELECTRIC CYAN</span>
              </button>
              <button class="g-glow-chip" data-glow="amber" style="background: #ffb703; box-shadow: 0 0 12px #ffb703;">
                <span>STREET AMBER</span>
              </button>
              <button class="g-glow-chip" data-glow="green" style="background: #39ff14; box-shadow: 0 0 12px #39ff14;">
                <span>ACID GREEN</span>
              </button>
              <button class="g-glow-chip" data-glow="pink" style="background: #ff007f; box-shadow: 0 0 12px #ff007f;">
                <span>HOT PINK</span>
              </button>
              <button class="g-glow-chip" data-glow="red" style="background: #ff1a1a; box-shadow: 0 0 12px #ff1a1a;">
                <span>PURSUIT RED</span>
              </button>
              <button class="g-glow-chip" data-glow="off" style="background: #222230;">
                <span>STEALTH (OFF)</span>
              </button>
            </div>
          </div>

          <!-- 3. PERFORMANCE HANDLING TUNING -->
          <div class="g-section">
            <span class="g-section-label">HANDLING & TRANSMISSION TUNE</span>
            <div class="g-tune-grid">
              <button class="g-tune-card active" data-tune="street">
                <span class="t-name">STREET SPEC</span>
                <span class="t-desc">Balanced grip, 260 km/h top speed, smooth cornering.</span>
              </button>
              <button class="g-tune-card" data-tune="drift">
                <span class="t-name">PRO DRIFT SPEC</span>
                <span class="t-desc">Low lateral friction, 45° steering slip angle, rapid point multiplier.</span>
              </button>
              <button class="g-tune-card" data-tune="drag">
                <span class="t-name">DRAG ROCKET SPEC</span>
                <span class="t-desc">Extreme 310 km/h top speed, instant torque, heavy high-speed stability.</span>
              </button>
            </div>
          </div>
        </div>

        <div class="garage-footer">
          <span class="g-hint">PRESS [G] ANYTIME TO TOGGLE GARAGE</span>
          <button class="g-apply-btn" id="garage-apply-btn">APPLY & RETURN TO STREETS →</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.container = modal;

    this.bindEvents();
  }

  bindEvents() {
    // Close button
    document.getElementById('garage-close-btn').onclick = () => this.toggleGarage(false);
    document.getElementById('garage-apply-btn').onclick = () => this.toggleGarage(false);

    // Paint chips
    const paintChips = this.container.querySelectorAll('.g-color-chip');
    paintChips.forEach(chip => {
      chip.onclick = () => {
        paintChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const paintType = chip.getAttribute('data-paint');
        this.applyBodyPaint(paintType);
      };
    });

    // Underglow chips
    const glowChips = this.container.querySelectorAll('.g-glow-chip');
    glowChips.forEach(chip => {
      chip.onclick = () => {
        glowChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const glowType = chip.getAttribute('data-glow');
        this.applyUnderglow(glowType);
      };
    });

    // Tune presets
    const tuneCards = this.container.querySelectorAll('.g-tune-card');
    tuneCards.forEach(card => {
      card.onclick = () => {
        tuneCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const tuneType = card.getAttribute('data-tune');
        this.applyTuningPreset(tuneType);
      };
    });

    // Keyboard toggle on 'G'
    window.addEventListener('keydown', (e) => {
      if (e.key === 'g' || e.key === 'G') {
        this.toggleGarage();
      }
    });
  }

  toggleGarage(forceState) {
    this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
    this.container.classList.toggle('active', this.isOpen);
  }

  // Apply Paint Colors
  applyBodyPaint(type) {
    if (!this.vehicle || !this.vehicle.materials) return;
    const paintMat = this.vehicle.materials.paint;
    const stripeMat = this.vehicle.materials.stripe;

    if (type === 'm3-hero') {
      paintMat.diffuse = new pc.Color(0.82, 0.85, 0.90); // M3 Silver
      paintMat.shininess = 95;
      if (stripeMat) {
        stripeMat.diffuse = new pc.Color(0.05, 0.22, 0.75); // Blue
        stripeMat.update();
      }
    } else if (type === 'midnight-black') {
      paintMat.diffuse = new pc.Color(0.04, 0.04, 0.05); // Deep Black
      paintMat.shininess = 80;
      if (stripeMat) {
        stripeMat.diffuse = new pc.Color(0.08, 0.08, 0.09);
        stripeMat.update();
      }
    } else if (type === 'razor-gold') {
      paintMat.diffuse = new pc.Color(0.95, 0.75, 0.1); // Razor Gold
      paintMat.shininess = 90;
      if (stripeMat) {
        stripeMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
        stripeMat.update();
      }
    } else if (type === 'crimson-red') {
      paintMat.diffuse = new pc.Color(0.85, 0.05, 0.12); // Crimson Red
      paintMat.shininess = 90;
      if (stripeMat) {
        stripeMat.diffuse = new pc.Color(0.95, 0.95, 0.95); // White Stripe
        stripeMat.update();
      }
    } else if (type === 'toxic-green') {
      paintMat.diffuse = new pc.Color(0.12, 0.85, 0.15); // Lime Green
      paintMat.shininess = 85;
      if (stripeMat) {
        stripeMat.diffuse = new pc.Color(0.05, 0.05, 0.06);
        stripeMat.update();
      }
    } else if (type === 'cyber-purple') {
      paintMat.diffuse = new pc.Color(0.45, 0.05, 0.75); // Cyber Purple
      paintMat.shininess = 90;
      if (stripeMat) {
        stripeMat.diffuse = new pc.Color(0, 0.9, 1); // Cyan Stripe
        stripeMat.update();
      }
    }
    paintMat.update();
  }

  // Apply Neon Underglow
  applyUnderglow(type) {
    if (!this.vehicle || !this.vehicle.underglowLight) return;
    const light = this.vehicle.underglowLight.light;

    if (type === 'off') {
      light.enabled = false;
      return;
    }

    light.enabled = true;
    if (type === 'cyan') light.color = new pc.Color(0, 0.9, 1);
    else if (type === 'amber') light.color = new pc.Color(1, 0.7, 0);
    else if (type === 'green') light.color = new pc.Color(0.2, 1, 0.2);
    else if (type === 'pink') light.color = new pc.Color(1, 0, 0.5);
    else if (type === 'red') light.color = new pc.Color(1, 0.1, 0.1);
  }

  // Apply Handling & Performance Tune
  applyTuningPreset(tune) {
    if (!this.vehicle) return;

    if (tune === 'drift') {
      this.vehicle.maxSteeringAngle = 40;
      console.log('🏎️ TUNED FOR PRO DRIFT: Increased Slip Angle!');
    } else if (tune === 'drag') {
      this.vehicle.maxSteeringAngle = 28;
      console.log('🏎️ TUNED FOR DRAG ROCKET: Maximum Top Speed!');
    } else {
      this.vehicle.maxSteeringAngle = 32;
      console.log('🏎️ TUNED FOR BALANCED STREET SPEC!');
    }
  }
}

window.TuningGarageManager = TuningGarageManager;
