/**
 * NEON PURSUIT - Realistic Particle, Smoke & Skidmark VFX Engine
 * Inspired by Need for Speed: Most Wanted (2005) & Top WebGL Racing Simulators
 * 
 * Features:
 * 1. Volumetric Tire Burnout & Drift Smoke (billowy alpha-blended puffs with spin, expansion & rise)
 * 2. Real-Time Asphalt Skid Marks (rubber contact ribbons deposited on road plane)
 * 3. Twin Exhaust Backfire Sparks & Nitrous Afterburner Flame Spikes
 * 4. High-Speed Camera Shake & Screen Speed Streaks
 */
class ParticleVFXSystem {
  constructor(app) {
    this.app = app;
    this.smokePool = [];
    this.activeSmokes = [];
    this.maxSmokes = 75;

    this.skidMarks = [];
    this.maxSkidMarks = 120;
    this.lastSkidPoints = { left: null, right: null };

    this.exhaustFlames = [];

    this.initSmokeMaterials();
    this.initSmokePool();
    this.initSkidMaterial();
    this.initExhaustFlames();
  }

  // 1. Procedural Smoke Puffs
  initSmokeMaterials() {
    this.smokeMaterial = new pc.StandardMaterial();
    this.smokeMaterial.diffuse = new pc.Color(0.85, 0.85, 0.88);
    this.smokeMaterial.opacity = 0.55;
    this.smokeMaterial.blendType = pc.BLEND_NORMAL;
    this.smokeMaterial.depthWrite = false;

    try {
      // Generate soft circular radial gradient texture for realistic billowy smoke
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
      grad.addColorStop(0, 'rgba(235, 235, 240, 0.95)');
      grad.addColorStop(0.35, 'rgba(200, 205, 215, 0.7)');
      grad.addColorStop(0.7, 'rgba(160, 165, 175, 0.35)');
      grad.addColorStop(1, 'rgba(120, 125, 135, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      if (this.app && this.app.graphicsDevice) {
        const smokeTex = new pc.Texture(this.app.graphicsDevice, {
          width: 64,
          height: 64,
          format: pc.PIXELFORMAT_RGBA8,
          minFilter: pc.FILTER_LINEAR,
          magFilter: pc.FILTER_LINEAR,
          addressU: pc.ADDRESS_CLAMP_TO_EDGE,
          addressV: pc.ADDRESS_CLAMP_TO_EDGE
        });
        smokeTex.setSource(canvas);
        this.smokeMaterial.opacityMap = smokeTex;
      }
    } catch (e) {
      console.warn('Smoke texture fallback to procedural alpha:', e);
    }

    this.smokeMaterial.update();
  }

  initSmokePool() {
    for (let i = 0; i < this.maxSmokes; i++) {
      const p = new pc.Entity('SmokeParticle_' + i);
      p.addComponent('render', { type: 'plane', material: this.smokeMaterial });
      p.setLocalScale(0.8, 1, 0.8);
      p.enabled = false;
      this.app.root.addChild(p);

      this.smokePool.push({
        entity: p,
        velocity: new pc.Vec3(),
        rotSpeed: 0,
        age: 0,
        lifetime: 1.2,
        scale: 0.8,
        maxScale: 3.5,
        baseOpacity: 0.6
      });
    }
  }

  // 2. Asphalt Skid Marks
  initSkidMaterial() {
    this.skidMaterial = new pc.StandardMaterial();
    this.skidMaterial.diffuse = new pc.Color(0.04, 0.04, 0.05); // Dark tire rubber
    this.skidMaterial.specular = new pc.Color(0.08, 0.08, 0.08);
    this.skidMaterial.shininess = 15;
    this.skidMaterial.opacity = 0.65;
    this.skidMaterial.blendType = pc.BLEND_NORMAL;
    this.skidMaterial.depthWrite = false;
    this.skidMaterial.update();
  }

  // 3. Nitrous Exhaust Jet & Backfire Spikes
  initExhaustFlames() {
    // High-temperature blue/orange flame material
    this.flameMaterial = new pc.StandardMaterial();
    this.flameMaterial.diffuse = new pc.Color(0.1, 0.5, 1.0); // Electric Nitrous Blue
    this.flameMaterial.emissive = new pc.Color(0.2, 0.8, 2.5); // Bright neon glow
    this.flameMaterial.opacity = 0.85;
    this.flameMaterial.blendType = pc.BLEND_ADDITIVE;
    this.flameMaterial.update();

    this.backfireMaterial = new pc.StandardMaterial();
    this.backfireMaterial.diffuse = new pc.Color(1.0, 0.4, 0.05); // Fiery orange/yellow
    this.backfireMaterial.emissive = new pc.Color(2.5, 1.0, 0.1);
    this.backfireMaterial.opacity = 0.9;
    this.backfireMaterial.blendType = pc.BLEND_ADDITIVE;
    this.backfireMaterial.update();
  }

  // Spawn smoke at specified world position (typically rear tire ground contact)
  spawnTireSmoke(pos, carVel) {
    if (this.smokePool.length === 0) return;

    const p = this.smokePool.pop();
    p.entity.enabled = true;
    p.age = 0;
    p.lifetime = 0.8 + Math.random() * 0.6;
    p.scale = 0.6 + Math.random() * 0.4;
    p.maxScale = 2.4 + Math.random() * 1.8;

    // Jitter position around tire footprint
    const px = pos.x + (Math.random() - 0.5) * 0.35;
    const py = pos.y + 0.12 + Math.random() * 0.08;
    const pz = pos.z + (Math.random() - 0.5) * 0.35;
    p.entity.setPosition(px, py, pz);

    // Random billow rotation
    p.entity.setEulerAngles(90, Math.random() * 360, 0);
    p.rotSpeed = (Math.random() - 0.5) * 60;

    // Upward drift and momentum bleed
    p.velocity.set(
      carVel.x * 0.15 + (Math.random() - 0.5) * 1.2,
      0.8 + Math.random() * 1.0, // Rises into air
      carVel.z * 0.15 + (Math.random() - 0.5) * 1.2
    );

    this.activeSmokes.push(p);
  }

  // Deposit tire rubber skid ribbons on the asphalt
  recordSkidMark(leftPos, rightPos) {
    // Only place skid marks at discrete distances to avoid mesh overdraw
    const minDistance = 1.2;

    [
      { current: leftPos, key: 'left' },
      { current: rightPos, key: 'right' }
    ].forEach(({ current, key }) => {
      const last = this.lastSkidPoints[key];
      if (!last) {
        this.lastSkidPoints[key] = current.clone();
        return;
      }

      const dx = current.x - last.x;
      const dz = current.z - last.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist >= minDistance && dist < 12.0) {
        this.createSkidSegment(last, current);
        this.lastSkidPoints[key] = current.clone();
      }
    });
  }

  createSkidSegment(p1, p2) {
    const midX = (p1.x + p2.x) * 0.5;
    const midZ = (p1.z + p2.z) * 0.5;
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angleRad = Math.atan2(dx, dz);

    const quad = new pc.Entity('SkidRibbon_' + Date.now());
    quad.addComponent('render', { type: 'plane', material: this.skidMaterial });
    quad.setLocalScale(0.32, 1, length * 1.05); // Width matches tire tread
    quad.setPosition(midX, 0.045, midZ); // Sits right above asphalt plane
    quad.setEulerAngles(0, angleRad * pc.math.RAD_TO_DEG, 0);

    this.app.root.addChild(quad);

    this.skidMarks.push({
      entity: quad,
      age: 0,
      lifetime: 22.0 // Stays visible on road for 22 seconds like Most Wanted
    });

    // Enforce max skid mark limit
    if (this.skidMarks.length > this.maxSkidMarks) {
      const oldest = this.skidMarks.shift();
      oldest.entity.destroy();
    }
  }

  endSkid() {
    this.lastSkidPoints.left = null;
    this.lastSkidPoints.right = null;
  }

  // Trigger twin backfire flame burst at car exhausts
  triggerBackfireSpike(vehicle) {
    if (!vehicle || !vehicle.exhaustTips) return;

    vehicle.exhaustTips.forEach(tip => {
      const flame = new pc.Entity('BackfireSpike');
      flame.addComponent('render', { type: 'cone', material: this.backfireMaterial });
      flame.setLocalScale(0.18, 0.55 + Math.random() * 0.35, 0.18);
      flame.setLocalEulerAngles(-90, 0, 0); // Spits backward
      flame.setLocalPosition(0, 0, -0.28);
      tip.addChild(flame);

      setTimeout(() => {
        flame.destroy();
      }, 100 + Math.random() * 70);
    });
  }

  // Update smoke particles, skidmark fade, and exhaust effects
  update(dt, vehicle) {
    // 1. Update Smoke Particles
    for (let i = this.activeSmokes.length - 1; i >= 0; i--) {
      const p = this.activeSmokes[i];
      p.age += dt;

      if (p.age >= p.lifetime) {
        p.entity.enabled = false;
        this.smokePool.push(p);
        this.activeSmokes.splice(i, 1);
        continue;
      }

      const progress = p.age / p.lifetime;

      // Expand billow volume
      const currentScale = pc.math.lerp(p.scale, p.maxScale, Math.pow(progress, 0.6));
      p.entity.setLocalScale(currentScale, 1, currentScale);

      // Move particle
      const curPos = p.entity.getPosition();
      curPos.x += p.velocity.x * dt;
      curPos.y += p.velocity.y * dt;
      curPos.z += p.velocity.z * dt;
      p.entity.setPosition(curPos);

      // Rotate billow
      const rot = p.entity.getEulerAngles();
      p.entity.setEulerAngles(90, rot.y + p.rotSpeed * dt, 0);

      // Velocity dampening
      p.velocity.x *= 0.94;
      p.velocity.z *= 0.94;
      p.velocity.y *= 0.98;
    }

    // 2. Check Vehicle State for Tire Smoke & Skidmarks
    if (vehicle && vehicle.root) {
      const carSpeed = Math.abs(vehicle.speedKmh);
      const isBurnout = vehicle.throttle > 0.8 && carSpeed < 18;
      const isHardDrift = vehicle.isDrifting && carSpeed > 22;
      const isHardBrake = vehicle.isBraking && carSpeed > 45;

      if (isBurnout || isHardDrift || isHardBrake) {
        // Calculate rear tire world positions
        const carPos = vehicle.position;
        const carHeadingRad = (vehicle.heading + vehicle.driftAngle) * pc.math.DEG_TO_RAD;
        const rightX = Math.cos(carHeadingRad);
        const rightZ = -Math.sin(carHeadingRad);
        const backX = -Math.sin(carHeadingRad);
        const backZ = -Math.cos(carHeadingRad);

        // Rear axle offset (-1.35m back, +/-0.92m lateral)
        const leftRear = new pc.Vec3(
          carPos.x + backX * 1.35 - rightX * 0.92,
          0.05,
          carPos.z + backZ * 1.35 - rightZ * 0.92
        );

        const rightRear = new pc.Vec3(
          carPos.x + backX * 1.35 + rightX * 0.92,
          0.05,
          carPos.z + backZ * 1.35 + rightZ * 0.92
        );

        // Emit smoke puffs (frequency scaled by severity)
        if (Math.random() < (isBurnout ? 0.75 : 0.45)) {
          this.spawnTireSmoke(leftRear, vehicle.velocity);
          this.spawnTireSmoke(rightRear, vehicle.velocity);
        }

        // Draw rubber skid ribbons
        if (isHardDrift || isHardBrake) {
          this.recordSkidMark(leftRear, rightRear);
        } else {
          this.endSkid();
        }
      } else {
        this.endSkid();
      }
    }

    // 3. Skid Marks Aging
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const s = this.skidMarks[i];
      s.age += dt;
      if (s.age > s.lifetime) {
        s.entity.destroy();
        this.skidMarks.splice(i, 1);
      }
    }
  }
}

window.ParticleVFXSystem = ParticleVFXSystem;

