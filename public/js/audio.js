/**
 * NEON PURSUIT - Enhanced Procedural Web Audio Engine (Phase 2)
 * Generates realistic sports car engine sounds, turbo blow-off, tire screeches,
 * nitro boost, exhaust backfire pops, checkpoint chimes, and race countdown beeps.
 */
class GameAudio {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;

    // Engine Audio Nodes
    this.engineMaster = null;
    this.osc1 = null;
    this.osc2 = null;
    this.osc3 = null;
    this.engineGain = null;
    this.engineFilter = null;

    // Screech Audio Nodes
    this.screechGain = null;
    this.screechFilter = null;
    this.screechSource = null;

    // Nitro Node
    this.nitroGain = null;

    // Exhaust Pop Timer
    this.lastThrottle = 0;
    this.noiseBuffer = null;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output
      const master = this.ctx.createGain();
      master.gain.value = 0.8;
      master.connect(this.ctx.destination);
      this.master = master;

      // Noise buffer for tire screeches, pops, and nitro
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // --- 1. ENGINE SYNTHESIZER ---
      this.engineMaster = this.ctx.createGain();
      this.engineMaster.gain.value = 0.22;

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 450;
      this.engineFilter.Q.value = 3.5;

      // Primary cylinder combustion pulses (Sawtooth)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.value = 45; // Idle ~800 RPM

      // Sub-harmonic rumble (Triangle)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.value = 22.5;

      // Intake whine / mechanical overtone (Square)
      this.osc3 = this.ctx.createOscillator();
      this.osc3.type = 'sawtooth';
      this.osc3.frequency.value = 90;

      const osc3Gain = this.ctx.createGain();
      osc3Gain.gain.value = 0.25;

      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.osc3.connect(osc3Gain);
      osc3Gain.connect(this.engineFilter);

      this.engineFilter.connect(this.engineMaster);
      this.engineMaster.connect(this.master);

      this.osc1.start();
      this.osc2.start();
      this.osc3.start();

      // --- 2. TIRE SCREECH SYNTHESIZER ---
      this.screechSource = this.ctx.createBufferSource();
      this.screechSource.buffer = this.noiseBuffer;
      this.screechSource.loop = true;

      this.screechFilter = this.ctx.createBiquadFilter();
      this.screechFilter.type = 'bandpass';
      this.screechFilter.frequency.value = 900;
      this.screechFilter.Q.value = 4.0;

      this.screechGain = this.ctx.createGain();
      this.screechGain.gain.value = 0.0;

      this.screechSource.connect(this.screechFilter);
      this.screechFilter.connect(this.screechGain);
      this.screechGain.connect(this.master);
      this.screechSource.start();

      // --- 3. NITRO SYNTHESIZER ---
      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.value = 0.0;
      const nitroFilter = this.ctx.createBiquadFilter();
      nitroFilter.type = 'highpass';
      nitroFilter.frequency.value = 1200;

      const nitroNoise = this.ctx.createBufferSource();
      nitroNoise.buffer = this.noiseBuffer;
      nitroNoise.loop = true;
      nitroNoise.connect(nitroFilter);
      nitroFilter.connect(this.nitroGain);
      this.nitroGain.connect(this.master);
      nitroNoise.start();

      this.initialized = true;
      console.log('🏁 Web Audio Engine Initialized (Phase 2)');
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
    }
  }

  // Update engine pitch, RPM, and tire screech on every game frame
  update(rpmRatio, throttle, isDrifting, isBraking, isNitro = false) {
    if (!this.initialized || !this.ctx || this.muted) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    // Check for throttle release backfire pop
    if (this.lastThrottle > 0.8 && throttle < 0.2 && rpmRatio > 0.5) {
      this.playExhaustBackfire();
    }
    this.lastThrottle = throttle;

    // Base frequency: 42Hz idle to 380Hz redline
    const baseFreq = 42 + rpmRatio * 320;
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.osc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.05);
    this.osc3.frequency.setTargetAtTime(baseFreq * 2.1, now, 0.05);

    // Filter opening with throttle
    const targetCutoff = 450 + throttle * 1200 + rpmRatio * 1800;
    this.engineFilter.frequency.setTargetAtTime(targetCutoff, now, 0.04);

    // Engine volume dynamics
    const targetVol = 0.15 + throttle * 0.18 + rpmRatio * 0.12;
    this.engineMaster.gain.setTargetAtTime(targetVol, now, 0.04);

    // Tire Screech volume
    if (isDrifting || (isBraking && rpmRatio > 0.3)) {
      const screechIntensity = isDrifting ? 0.28 : 0.15;
      this.screechGain.gain.setTargetAtTime(screechIntensity, now, 0.08);
      this.screechFilter.frequency.setTargetAtTime(850 + Math.random() * 200, now, 0.05);
    } else {
      this.screechGain.gain.setTargetAtTime(0.0, now, 0.12);
    }

    // Nitro sound
    if (isNitro) {
      this.nitroGain.gain.setTargetAtTime(0.35, now, 0.08);
    } else {
      this.nitroGain.gain.setTargetAtTime(0.0, now, 0.15);
    }
  }

  // Turbo blow-off valve release "pssshh"
  playTurboBlowOff() {
    if (!this.initialized || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);

    filter.type = 'bandpass';
    filter.frequency.value = 2200;

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Exhaust Backfire Pops on high-RPM overrun
  playExhaustBackfire() {
    if (!this.initialized || !this.ctx || this.muted) return;
    const numPops = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numPops; i++) {
      const delay = i * (0.06 + Math.random() * 0.05);
      const now = this.ctx.currentTime + delay;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 + Math.random() * 60, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.value = 350;

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);

      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  // Race Countdown Beeps ("3.. 2.. 1.. GO!")
  playCountdownBeep(isGo = false) {
    if (!this.initialized || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 1200 : 600, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + (isGo ? 0.5 : 0.25));

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(now);
    osc.stop(now + (isGo ? 0.5 : 0.25));
  }

  // Checkpoint Passed Chime
  playCheckpointChime() {
    if (!this.initialized || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.1); // A5

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Police Pursuit Alert Chime
  playPursuitAlert() {
    if (!this.initialized || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.setValueAtTime(987, now + 0.15);
    osc.frequency.setValueAtTime(1318, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Ad verified success chime
  playAdVerifiedChime() {
    if (!this.initialized || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);
    osc.frequency.setValueAtTime(1046.50, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.55);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(now);
    osc.stop(now + 0.55);
  }
}

window.GameAudio = GameAudio;
