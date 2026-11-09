/**
 * NEON PURSUIT - Checkpoint Street Racing System (Phase 2)
 * Need for Speed: Most Wanted inspired sprint racing event with
 * holographic checkpoint gates, audio countdown, split timers, and victory rewards.
 */
class RaceManager {
  constructor(app, audio, hud) {
    this.app = app;
    this.audio = audio;
    this.hud = hud;

    this.root = new pc.Entity('RaceRoot');
    this.app.root.addChild(this.root);

    // Race Configuration: Metro Expressway Sprint (8 Checkpoints)
    this.raceName = 'METRO EXPRESSWAY SPRINT';
    this.checkpointsData = [
      { x: 0,   y: 3.5, z: -30,  rot: 0,   w: 18 },  // Gate 1: Launch line
      { x: 0,   y: 3.5, z: -75,  rot: 0,   w: 18 },  // Gate 2: South Overpass Approach
      { x: 0,   y: 3.5, z: -140, rot: 0,   w: 20 },  // Gate 3: South Expressway End
      { x: 50,  y: 3.5, z: -90,  rot: -45, w: 18 },  // Gate 4: East Ring Road Turn
      { x: 75,  y: 3.5, z: 0,    rot: -90, w: 20 },  // Gate 5: Downtown Skyscraper Plaza
      { x: 50,  y: 3.5, z: 90,   rot: -135,w: 18 },  // Gate 6: North Ring Loop
      { x: 0,   y: 3.5, z: 120,  rot: 180, w: 20 },  // Gate 7: Hillside Bridge Approach
      { x: 0,   y: 3.5, z: 10,   rot: 180, w: 20 }   // Gate 8: Final Finish Line!
    ];

    this.checkpointEntities = [];
    this.currentGateIndex = 0;
    this.state = 'IDLE'; // 'IDLE', 'COUNTDOWN', 'RACING', 'FINISHED'
    this.raceTimer = 0;
    this.countdownTimer = 3.99;
    this.targetGoldTime = 52.0; // Seconds

    this.materials = {};
    this.initMaterials();
    this.buildCheckpointGates();
  }

  initMaterials() {
    // Active Gate Neon Yellow/Green
    const activeMat = new pc.StandardMaterial();
    activeMat.diffuse = new pc.Color(0.2, 0.9, 0.1);
    activeMat.emissive = new pc.Color(0.4, 2.2, 0.2);
    activeMat.update();
    this.materials.active = activeMat;

    // Upcoming Gate Neon Cyan
    const nextMat = new pc.StandardMaterial();
    nextMat.diffuse = new pc.Color(0, 0.7, 1);
    nextMat.emissive = new pc.Color(0.1, 1.4, 2.0);
    nextMat.update();
    this.materials.next = nextMat;

    // Inactive Gate Dark Steel
    const inactiveMat = new pc.StandardMaterial();
    inactiveMat.diffuse = new pc.Color(0.2, 0.25, 0.3);
    inactiveMat.emissive = new pc.Color(0.1, 0.1, 0.15);
    inactiveMat.update();
    this.materials.inactive = inactiveMat;

    // Hologram Gate Beam (Translucent)
    const beamMat = new pc.StandardMaterial();
    beamMat.diffuse = new pc.Color(0, 0.9, 1);
    beamMat.emissive = new pc.Color(0, 1.8, 2.2);
    beamMat.opacity = 0.35;
    beamMat.blendType = pc.BLEND_ADDITIVE;
    beamMat.update();
    this.materials.beam = beamMat;
  }

  buildCheckpointGates() {
    this.checkpointsData.forEach((cp, idx) => {
      const gate = new pc.Entity('Gate_' + idx);
      gate.setPosition(cp.x, cp.y, cp.z);
      gate.setEulerAngles(0, cp.rot, 0);
      this.root.addChild(gate);

      const h = 7.0;
      const w = cp.w;

      // Left Pillar
      const leftCol = new pc.Entity('LCol');
      leftCol.addComponent('render', { type: 'cylinder', material: this.materials.next });
      leftCol.setLocalScale(0.6, h, 0.6);
      leftCol.setLocalPosition(-w / 2, 0, 0);
      gate.addChild(leftCol);

      // Right Pillar
      const rightCol = new pc.Entity('RCol');
      rightCol.addComponent('render', { type: 'cylinder', material: this.materials.next });
      rightCol.setLocalScale(0.6, h, 0.6);
      rightCol.setLocalPosition(w / 2, 0, 0);
      gate.addChild(rightCol);

      // Top Crossbar
      const topBar = new pc.Entity('TBar');
      topBar.addComponent('render', { type: 'box', material: this.materials.next });
      topBar.setLocalScale(w + 1.2, 0.6, 0.6);
      topBar.setLocalPosition(0, h / 2, 0);
      gate.addChild(topBar);

      // Glowing Hologram Beam curtain
      const beam = new pc.Entity('HoloBeam');
      beam.addComponent('render', { type: 'box', material: this.materials.beam });
      beam.setLocalScale(w - 0.4, h - 0.5, 0.15);
      beam.setLocalPosition(0, 0, 0);
      gate.addChild(beam);

      this.checkpointEntities.push({
        entity: gate,
        leftCol,
        rightCol,
        topBar,
        beam,
        data: cp
      });
    });

    this.updateGateVisuals();
  }

  // Update glowing materials of gates based on active gate
  updateGateVisuals() {
    this.checkpointEntities.forEach((g, idx) => {
      if (this.state === 'IDLE') {
        g.leftCol.render.material = this.materials.inactive;
        g.rightCol.render.material = this.materials.inactive;
        g.topBar.render.material = this.materials.inactive;
        g.beam.enabled = false;
      } else if (idx === this.currentGateIndex) {
        // Active target gate glows neon green/yellow
        g.leftCol.render.material = this.materials.active;
        g.rightCol.render.material = this.materials.active;
        g.topBar.render.material = this.materials.active;
        g.beam.enabled = true;
      } else if (idx === this.currentGateIndex + 1) {
        // Next upcoming gate glows cyan
        g.leftCol.render.material = this.materials.next;
        g.rightCol.render.material = this.materials.next;
        g.topBar.render.material = this.materials.next;
        g.beam.enabled = true;
      } else {
        g.leftCol.render.material = this.materials.inactive;
        g.rightCol.render.material = this.materials.inactive;
        g.topBar.render.material = this.materials.inactive;
        g.beam.enabled = false;
      }
    });
  }

  // Start the race countdown
  startRace(playerVehicle) {
    console.log('🏁 Starting Race: ' + this.raceName);
    this.state = 'COUNTDOWN';
    this.countdownTimer = 3.99;
    this.currentGateIndex = 0;
    this.raceTimer = 0;

    // Reset vehicle to start gate
    playerVehicle.position.set(0, 0.42, -10);
    playerVehicle.speed = 0;
    playerVehicle.heading = 0;
    playerVehicle.root.setPosition(playerVehicle.position);
    playerVehicle.root.setEulerAngles(0, 0, 0);

    this.updateGateVisuals();

    if (this.hud && this.hud.showRaceStartOverlay) {
      this.hud.showRaceStartOverlay(this.raceName);
    }
  }

  // Frame update loop
  update(dt, playerVehicle) {
    if (this.state === 'IDLE') {
      return;
    }

    // 1. COUNTDOWN STATE
    if (this.state === 'COUNTDOWN') {
      const prevSecond = Math.ceil(this.countdownTimer);
      this.countdownTimer -= dt;
      const currentSecond = Math.ceil(this.countdownTimer);

      // Play beeps on each second tick
      if (currentSecond !== prevSecond && currentSecond > 0) {
        if (this.audio) this.audio.playCountdownBeep(false);
      }

      if (this.countdownTimer <= 0) {
        this.state = 'RACING';
        if (this.audio) this.audio.playCountdownBeep(true);
        console.log('🟢 GREEN LIGHT! RACE STARTED!');
      }

      if (this.hud && this.hud.updateRaceCountdown) {
        this.hud.updateRaceCountdown(this.countdownTimer);
      }
      return;
    }

    // 2. RACING STATE
    if (this.state === 'RACING') {
      this.raceTimer += dt;

      // Check player distance to active gate
      const activeGate = this.checkpointEntities[this.currentGateIndex];
      if (activeGate) {
        const playerPos = playerVehicle.position;
        const gatePos = activeGate.data;
        const dist = Math.hypot(playerPos.x - gatePos.x, playerPos.z - gatePos.z);

        // Within gate trigger zone (~12m radius)
        if (dist < 12.0) {
          this.passCheckpoint();
        }
      }

      // Update HUD race display
      if (this.hud && this.hud.updateRaceHUD) {
        this.hud.updateRaceHUD({
          gate: this.currentGateIndex + 1,
          totalGates: this.checkpointEntities.length,
          time: this.raceTimer,
          targetTime: this.targetGoldTime
        });
      }
    }
  }

  // Pass active checkpoint
  passCheckpoint() {
    this.currentGateIndex++;
    console.log(`🚩 Passed Checkpoint ${this.currentGateIndex}/${this.checkpointEntities.length}!`);

    if (this.audio) {
      this.audio.playCheckpointChime();
    }

    // Check if finished race
    if (this.currentGateIndex >= this.checkpointEntities.length) {
      this.finishRace();
    } else {
      this.updateGateVisuals();
    }
  }

  // Finish Race and show victory podium
  finishRace() {
    this.state = 'FINISHED';
    console.log(`🏆 RACE FINISHED! Final Time: ${this.raceTimer.toFixed(2)}s`);

    if (this.audio) {
      this.audio.playPursuitAlert();
    }

    const wonGold = this.raceTimer <= this.targetGoldTime;
    const cashBounty = wonGold ? 25000 : 15000;
    const adBonus = 5000;

    if (this.hud && this.hud.showRaceFinishedModal) {
      this.hud.showRaceFinishedModal({
        raceName: this.raceName,
        time: this.raceTimer,
        targetTime: this.targetGoldTime,
        wonGold,
        cashBounty,
        adBonus
      });
    }

    this.updateGateVisuals();
  }
}

window.RaceManager = RaceManager;
