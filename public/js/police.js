/**
 * NEON PURSUIT - Police Pursuit Engine (Inspired by Need for Speed: Most Wanted 2005)
 * Features:
 * - Black & White Police Interceptors
 * - Flashing Red & Blue Strobe Lightbars
 * - Pursuit AI: Patrolling, Chasing, Ramming, and Roadblock Interceptions
 * - Heat Levels (Heat 1 Patrol -> Heat 2 State Interceptor)
 * - Bounty & Cost to State calculation
 * - Pursuit Evade / Cooldown meter
 * - Police Scanner Radio Chatter & Sirens
 */
class PoliceManager {
  constructor(app, audio, hud) {
    this.app = app;
    this.audio = audio;
    this.hud = hud;

    this.root = new pc.Entity('PoliceRoot');
    this.app.root.addChild(this.root);

    this.cruisers = [];
    this.materials = {};

    // Pursuit State
    this.pursuitActive = false;
    this.heatLevel = 1; // 1 to 5
    this.bounty = 12500;
    this.costToState = 0;
    this.evadeTimer = 0; // Counts up to 100% when out of police line of sight
    this.evadeTargetTime = 8.0; // 8 seconds to evade
    this.inCooldown = false;

    // Siren audio state
    this.sirenActive = false;
    this.lastRadioChatterTime = 0;

    this.initMaterials();
    this.spawnPatrolCruisers();
  }

  initMaterials() {
    // Police Black
    const blackMat = new pc.StandardMaterial();
    blackMat.diffuse = new pc.Color(0.04, 0.04, 0.05);
    blackMat.shininess = 70;
    blackMat.update();
    this.materials.black = blackMat;

    // Police White Doors & Roof
    const whiteMat = new pc.StandardMaterial();
    whiteMat.diffuse = new pc.Color(0.92, 0.92, 0.95);
    whiteMat.shininess = 80;
    whiteMat.update();
    this.materials.white = whiteMat;

    // Tinted Glass
    const glassMat = new pc.StandardMaterial();
    glassMat.diffuse = new pc.Color(0.02, 0.03, 0.05);
    glassMat.shininess = 90;
    glassMat.update();
    this.materials.glass = glassMat;

    // Red Strobe LED
    const redMat = new pc.StandardMaterial();
    redMat.diffuse = new pc.Color(1, 0, 0);
    redMat.emissive = new pc.Color(2.5, 0.1, 0.1);
    redMat.update();
    this.materials.strobeRed = redMat;

    // Blue Strobe LED
    const blueMat = new pc.StandardMaterial();
    blueMat.diffuse = new pc.Color(0, 0.4, 1);
    blueMat.emissive = new pc.Color(0.2, 1.2, 3.0);
    blueMat.update();
    this.materials.strobeBlue = blueMat;

    // Strobe Off / Inactive
    const offMat = new pc.StandardMaterial();
    offMat.diffuse = new pc.Color(0.2, 0.2, 0.2);
    offMat.emissive = new pc.Color(0, 0, 0);
    offMat.update();
    this.materials.strobeOff = offMat;

    // Chrome Bumper / Pushbar
    const pushbarMat = new pc.StandardMaterial();
    pushbarMat.diffuse = new pc.Color(0.2, 0.22, 0.25);
    pushbarMat.metalness = 0.9;
    pushbarMat.useMetalness = true;
    pushbarMat.shininess = 80;
    pushbarMat.update();
    this.materials.pushbar = pushbarMat;

    // Wheels
    const wheelMat = new pc.StandardMaterial();
    wheelMat.diffuse = new pc.Color(0.08, 0.08, 0.09);
    wheelMat.update();
    this.materials.wheel = wheelMat;
  }

  spawnPatrolCruisers() {
    const patrolPositions = [
      { x: 0,   z: -60,  heading: 0,   speed: 16 },
      { x: 6.5, z: 80,   heading: 180, speed: 18 },
      { x: 60,  z: 0,    heading: 90,  speed: 15 }
    ];

    patrolPositions.forEach((pos, idx) => {
      const cruiser = this.createPoliceCruiser(pos, idx);
      this.cruisers.push(cruiser);
    });

    console.log(`🚨 Spawned ${this.cruisers.length} Police Interceptor Units`);
  }

  createPoliceCruiser(initPos, id) {
    const root = new pc.Entity('PoliceCruiser_' + id);
    root.setPosition(initPos.x, 0.45, initPos.z);
    root.setEulerAngles(0, initPos.heading, 0);
    this.root.addChild(root);

    // 1. Lower Body (Black)
    const lowerBody = new pc.Entity('CopLowerBody');
    lowerBody.addComponent('render', { type: 'box', material: this.materials.black });
    lowerBody.setLocalScale(1.9, 0.42, 4.4);
    lowerBody.setLocalPosition(0, 0.35, 0);
    root.addChild(lowerBody);

    // 2. White Center Doors (Classic Most Wanted Cruiser Livery)
    const whiteDoors = new pc.Entity('WhiteDoors');
    whiteDoors.addComponent('render', { type: 'box', material: this.materials.white });
    whiteDoors.setLocalScale(1.92, 0.38, 1.8);
    whiteDoors.setLocalPosition(0, 0.38, -0.1);
    root.addChild(whiteDoors);

    // 3. Cabin & White Roof
    const cabin = new pc.Entity('CopCabin');
    cabin.addComponent('render', { type: 'box', material: this.materials.glass });
    cabin.setLocalScale(1.48, 0.52, 2.2);
    cabin.setLocalPosition(0, 0.75, -0.2);
    root.addChild(cabin);

    const roof = new pc.Entity('CopRoof');
    roof.addComponent('render', { type: 'box', material: this.materials.white });
    roof.setLocalScale(1.42, 0.1, 1.9);
    roof.setLocalPosition(0, 1.02, -0.2);
    root.addChild(roof);

    // 4. Heavy Front Pushbar / Bullbar (Iconic for ramming street racers)
    const pushbar = new pc.Entity('PushBar');
    pushbar.addComponent('render', { type: 'box', material: this.materials.pushbar });
    pushbar.setLocalScale(1.6, 0.5, 0.25);
    pushbar.setLocalPosition(0, 0.4, 2.3);
    root.addChild(pushbar);

    // 5. Roof Emergency Lightbar (Red & Blue Strobes)
    const lightbarBase = new pc.Entity('LightbarBase');
    lightbarBase.addComponent('render', { type: 'box', material: this.materials.black });
    lightbarBase.setLocalScale(1.1, 0.08, 0.3);
    lightbarBase.setLocalPosition(0, 1.1, -0.2);
    root.addChild(lightbarBase);

    // Red Strobe Lens (Left)
    const redStrobe = new pc.Entity('StrobeRed');
    redStrobe.addComponent('render', { type: 'box', material: this.materials.strobeOff });
    redStrobe.setLocalScale(0.45, 0.15, 0.25);
    redStrobe.setLocalPosition(-0.3, 1.18, -0.2);
    root.addChild(redStrobe);

    // Blue Strobe Lens (Right)
    const blueStrobe = new pc.Entity('StrobeBlue');
    blueStrobe.addComponent('render', { type: 'box', material: this.materials.strobeOff });
    blueStrobe.setLocalScale(0.45, 0.15, 0.25);
    blueStrobe.setLocalPosition(0.3, 1.18, -0.2);
    root.addChild(blueStrobe);

    // Real dynamic point light for emergency strobe glow
    const strobeLight = new pc.Entity('StrobePointLight');
    strobeLight.addComponent('light', {
      type: 'point',
      color: new pc.Color(1, 0, 0),
      intensity: 2.5,
      range: 16,
      castShadows: false
    });
    strobeLight.setLocalPosition(0, 1.4, -0.2);
    strobeLight.enabled = false;
    root.addChild(strobeLight);

    // Wheels
    const wheelPositions = [
      [-0.92, 0.32, 1.35],
      [0.92, 0.32, 1.35],
      [-0.92, 0.32, -1.35],
      [0.92, 0.32, -1.35]
    ];
    wheelPositions.forEach(wp => {
      const wh = new pc.Entity('CopWheel');
      wh.addComponent('render', { type: 'cylinder', material: this.materials.wheel });
      wh.setLocalScale(0.66, 0.26, 0.66);
      wh.setLocalPosition(wp[0], wp[1], wp[2]);
      wh.setLocalEulerAngles(0, 0, 90);
      root.addChild(wh);
    });

    return {
      entity: root,
      pos: root.getPosition(),
      heading: initPos.heading,
      speed: initPos.speed,
      redStrobe,
      blueStrobe,
      strobeLight,
      strobeState: 0,
      strobeTimer: 0,
      hitCooldown: 0,
      isChasing: false
    };
  }

  // Trigger Police Pursuit
  triggerPursuit(reason = 'EXCESSIVE SPEED') {
    if (this.pursuitActive) return;

    this.pursuitActive = true;
    this.inCooldown = false;
    this.evadeTimer = 0;
    this.sirenActive = true;

    console.log(`🚨 [NFS MW PURSUIT ENGAGED] Reason: ${reason} // Heat Level: ${this.heatLevel}`);

    // Play siren alert chime
    if (this.audio) {
      this.audio.playPursuitAlert();
    }

    // Play police radio chatter
    this.playRadioChatter();

    // Notify HUD
    if (this.hud && this.hud.showPursuitStart) {
      this.hud.showPursuitStart({
        heatLevel: this.heatLevel,
        bounty: this.bounty,
        reason: reason
      });
    }
  }

  // Update loop: cruiser AI, pursuit, line of sight, evade timer
  update(dt, playerVehicle) {
    const playerPos = playerVehicle.position;
    const playerSpeed = Math.abs(playerVehicle.speedKmh);
    const now = Date.now();

    let nearestCruiserDist = 999;
    let anyCruiserCanSee = false;

    // Check trigger pursuit if player speeds past a police cruiser at > 120 KM/H
    this.cruisers.forEach(cop => {
      cop.hitCooldown = Math.max(0, cop.hitCooldown - dt);

      const dx = playerPos.x - cop.pos.x;
      const dz = playerPos.z - cop.pos.z;
      const distToPlayer = Math.hypot(dx, dz);
      if (distToPlayer < nearestCruiserDist) nearestCruiserDist = distToPlayer;

      // Trigger condition: Speeding near police (< 45m distance & speed > 115 KM/H)
      if (!this.pursuitActive && distToPlayer < 45 && playerSpeed > 115) {
        this.triggerPursuit('PATROL RADAR VIOLATION: 120+ KM/H');
      }

      // --- PURSUIT AI & CHASE LOGIC ---
      if (this.pursuitActive) {
        cop.isChasing = true;

        // Turn on strobes & sirens
        cop.strobeTimer += dt * 14;
        const phase = Math.floor(cop.strobeTimer) % 4;

        if (phase === 0 || phase === 1) {
          cop.redStrobe.render.material = this.materials.strobeRed;
          cop.blueStrobe.render.material = this.materials.strobeOff;
          cop.strobeLight.light.color = new pc.Color(1, 0, 0);
          cop.strobeLight.enabled = true;
        } else {
          cop.redStrobe.render.material = this.materials.strobeOff;
          cop.blueStrobe.render.material = this.materials.strobeBlue;
          cop.strobeLight.light.color = new pc.Color(0, 0.4, 1);
          cop.strobeLight.enabled = true;
        }

        // Steer towards player
        const targetAngleRad = Math.atan2(dx, dz);
        const targetAngleDeg = targetAngleRad * pc.math.RAD_TO_DEG;
        cop.heading = pc.math.lerp(cop.heading, targetAngleDeg, dt * 3.5);

        // Chase speed: scales with heat level up to 55 m/s (~200 km/h)
        const maxChaseSpeed = 22 + (this.heatLevel * 6); // m/s
        cop.speed = pc.math.lerp(cop.speed, maxChaseSpeed, dt * 2.0);

        // Move cruiser forward
        const headingRad = cop.heading * pc.math.DEG_TO_RAD;
        cop.pos.x += Math.sin(headingRad) * cop.speed * dt;
        cop.pos.z += Math.cos(headingRad) * cop.speed * dt;
        cop.entity.setPosition(cop.pos);
        cop.entity.setEulerAngles(0, cop.heading, 0);

        // Line of sight check (< 75m means police can see player)
        if (distToPlayer < 75) {
          anyCruiserCanSee = true;
        }

        // --- COLLISION: POLICE RAMMING / PIT MANEUVER ---
        if (distToPlayer < 3.2 && cop.hitCooldown <= 0) {
          cop.hitCooldown = 1.0;
          this.handlePoliceCollision(cop, playerVehicle);
        }

      } else {
        // Normal patrol cruise
        cop.strobeLight.enabled = false;
        cop.redStrobe.render.material = this.materials.strobeOff;
        cop.blueStrobe.render.material = this.materials.strobeOff;

        // Cruise straight
        const headingRad = cop.heading * pc.math.DEG_TO_RAD;
        cop.pos.x += Math.sin(headingRad) * cop.speed * dt;
        cop.pos.z += Math.cos(headingRad) * cop.speed * dt;

        // Boundary wrap
        if (Math.abs(cop.pos.x) > 175) cop.pos.x = -Math.sign(cop.pos.x) * 170;
        if (Math.abs(cop.pos.z) > 175) cop.pos.z = -Math.sign(cop.pos.z) * 170;

        cop.entity.setPosition(cop.pos);
        cop.entity.setEulerAngles(0, cop.heading, 0);
      }
    });

    // --- EVADE & COOLDOWN MECHANIC (NFS MOST WANTED 2005) ---
    if (this.pursuitActive) {
      if (!anyCruiserCanSee) {
        // Player has broken line of sight! Enter COOLDOWN!
        this.inCooldown = true;
        this.evadeTimer += dt;

        if (this.evadeTimer >= this.evadeTargetTime) {
          this.evadePursuit();
        }
      } else {
        // In sight: reset evade timer
        this.inCooldown = false;
        this.evadeTimer = Math.max(0, this.evadeTimer - dt * 2.0);
      }

      // Update HUD pursuit bar
      if (this.hud && this.hud.updatePursuitBar) {
        this.hud.updatePursuitBar({
          active: true,
          inCooldown: this.inCooldown,
          evadeProgress: Math.min(1, this.evadeTimer / this.evadeTargetTime),
          heatLevel: this.heatLevel,
          bounty: this.bounty,
          costToState: this.costToState
        });
      }
    }
  }

  // Handle high-speed police car ramming
  handlePoliceCollision(cop, playerVehicle) {
    console.log('💥 POLICE IMPACT! Rammed patrol unit!');

    // Add cost to state and bounty
    this.costToState += 4200;
    this.bounty += 6500;

    // Sound effect
    if (this.audio) {
      this.audio.playExhaustBackfire();
    }

    // Physics bounce
    playerVehicle.speed *= 0.7;
    cop.speed *= 0.3;
    playerVehicle.driftAngle += (Math.random() - 0.5) * 35;
  }

  // Successfully Evade Pursuit (NFS Most Wanted Victory Screen)
  evadePursuit() {
    this.pursuitActive = false;
    this.inCooldown = false;
    this.evadeTimer = 0;

    console.log(`🏆 [PURSUIT EVADED] Total Bounty Won: $${this.bounty} // Cost to State: $${this.costToState}`);

    if (this.audio) {
      this.audio.playPursuitAlert();
    }

    if (this.hud && this.hud.showPursuitEvadedModal) {
      this.hud.showPursuitEvadedModal({
        bounty: this.bounty,
        costToState: this.costToState,
        heatLevel: this.heatLevel
      });
    }

    // Escalate heat level for next chase
    this.heatLevel = Math.min(5, this.heatLevel + 1);
  }

  // Police Scanner Radio Chatter Synthesizer
  playRadioChatter() {
    if (!this.audio || !this.audio.ctx) return;
    try {
      const now = this.audio.ctx.currentTime;
      // High-pitched squelch burst
      const osc = this.audio.ctx.createOscillator();
      const gain = this.audio.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.audio.master);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }
}

window.PoliceManager = PoliceManager;
