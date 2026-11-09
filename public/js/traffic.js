/**
 * NEON PURSUIT - City Ambient Traffic System (Phase 2)
 * Spawns and manages autonomous civilian traffic cars (Taxis, Sedans, Coupes)
 * navigating the city highway lanes with collision physics and horn reactions.
 */
class TrafficManager {
  constructor(app, audio) {
    this.app = app;
    this.audio = audio;
    this.vehicles = [];
    this.root = new pc.Entity('TrafficRoot');
    this.app.root.addChild(this.root);

    this.materials = {};
    this.initMaterials();
    this.spawnTraffic();
  }

  initMaterials() {
    // Taxi Yellow
    const taxiMat = new pc.StandardMaterial();
    taxiMat.diffuse = new pc.Color(0.95, 0.75, 0.05);
    taxiMat.shininess = 60;
    taxiMat.update();
    this.materials.taxi = taxiMat;

    // White Sedan
    const whiteMat = new pc.StandardMaterial();
    whiteMat.diffuse = new pc.Color(0.85, 0.85, 0.88);
    whiteMat.shininess = 70;
    whiteMat.update();
    this.materials.white = whiteMat;

    // Dark Sedan
    const darkMat = new pc.StandardMaterial();
    darkMat.diffuse = new pc.Color(0.12, 0.14, 0.18);
    darkMat.shininess = 65;
    darkMat.update();
    this.materials.dark = darkMat;

    // Glass
    const glassMat = new pc.StandardMaterial();
    glassMat.diffuse = new pc.Color(0.05, 0.08, 0.12);
    glassMat.shininess = 90;
    glassMat.update();
    this.materials.glass = glassMat;

    // Headlight
    const headMat = new pc.StandardMaterial();
    headMat.diffuse = new pc.Color(1, 1, 1);
    headMat.emissive = new pc.Color(1.5, 1.5, 1.3);
    headMat.update();
    this.materials.headlight = headMat;

    // Taillight
    const tailMat = new pc.StandardMaterial();
    tailMat.diffuse = new pc.Color(0.8, 0.1, 0.1);
    tailMat.emissive = new pc.Color(1.2, 0.05, 0.05);
    tailMat.update();
    this.materials.taillight = tailMat;

    // Wheel
    const wheelMat = new pc.StandardMaterial();
    wheelMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
    wheelMat.update();
    this.materials.wheel = wheelMat;
  }

  spawnTraffic() {
    // Traffic routes: lanes along North-South and East-West expressways
    const configs = [
      // Northbound lane (X = 6.5, moving toward +Z)
      { x: 6.5,  z: -120, dir: 1,  axis: 'z', speed: 11, mat: this.materials.taxi,  isTaxi: true },
      { x: 6.5,  z: -30,  dir: 1,  axis: 'z', speed: 13, mat: this.materials.white, isTaxi: false },
      { x: 6.5,  z: 60,   dir: 1,  axis: 'z', speed: 10, mat: this.materials.dark,  isTaxi: false },

      // Southbound lane (X = -6.5, moving toward -Z)
      { x: -6.5, z: 120,  dir: -1, axis: 'z', speed: 12, mat: this.materials.white, isTaxi: false },
      { x: -6.5, z: 20,   dir: -1, axis: 'z', speed: 14, mat: this.materials.taxi,  isTaxi: true },
      { x: -6.5, z: -80,  dir: -1, axis: 'z', speed: 11, mat: this.materials.dark,  isTaxi: false },

      // Eastbound lane (Z = 6.5, moving toward +X)
      { x: -110, z: 6.5,  dir: 1,  axis: 'x', speed: 12, mat: this.materials.dark,  isTaxi: false },
      { x: 40,   z: 6.5,  dir: 1,  axis: 'x', speed: 11, mat: this.materials.taxi,  isTaxi: true },

      // Westbound lane (Z = -6.5, moving toward -X)
      { x: 110,  z: -6.5, dir: -1, axis: 'x', speed: 13, mat: this.materials.white, isTaxi: false },
      { x: -30,  z: -6.5, dir: -1, axis: 'x', speed: 10, mat: this.materials.dark,  isTaxi: false }
    ];

    configs.forEach((cfg, idx) => {
      const car = this.createTrafficEntity(cfg, idx);
      this.vehicles.push(car);
    });

    console.log(`🚗 Spawned ${this.vehicles.length} Civilian Traffic Vehicles`);
  }

  createTrafficEntity(cfg, id) {
    const root = new pc.Entity('TrafficCar_' + id);
    root.setPosition(cfg.x, 0.4, cfg.z);
    
    // Set rotation based on direction and axis
    if (cfg.axis === 'z') {
      root.setEulerAngles(0, cfg.dir > 0 ? 0 : 180, 0);
    } else {
      root.setEulerAngles(0, cfg.dir > 0 ? 90 : -90, 0);
    }
    this.root.addChild(root);

    // Body Lower Box
    const body = new pc.Entity('TrafficBody');
    body.addComponent('render', { type: 'box', material: cfg.mat });
    body.setLocalScale(1.8, 0.45, 4.0);
    body.setLocalPosition(0, 0.35, 0);
    root.addChild(body);

    // Cabin
    const cabin = new pc.Entity('TrafficCabin');
    cabin.addComponent('render', { type: 'box', material: this.materials.glass });
    cabin.setLocalScale(1.5, 0.45, 2.1);
    cabin.setLocalPosition(0, 0.75, -0.2);
    root.addChild(cabin);

    // Taxi roof sign
    if (cfg.isTaxi) {
      const sign = new pc.Entity('TaxiSign');
      const signMat = new pc.StandardMaterial();
      signMat.emissive = new pc.Color(1.5, 1.2, 0.1);
      signMat.update();
      sign.addComponent('render', { type: 'box', material: signMat });
      sign.setLocalScale(0.8, 0.18, 0.25);
      sign.setLocalPosition(0, 1.05, -0.2);
      root.addChild(sign);
    }

    // Headlights
    [-0.6, 0.6].forEach(hx => {
      const hl = new pc.Entity('HL');
      hl.addComponent('render', { type: 'box', material: this.materials.headlight });
      hl.setLocalScale(0.3, 0.12, 0.1);
      hl.setLocalPosition(hx, 0.38, 2.02);
      root.addChild(hl);
    });

    // Taillights
    [-0.6, 0.6].forEach(tx => {
      const tl = new pc.Entity('TL');
      tl.addComponent('render', { type: 'box', material: this.materials.taillight });
      tl.setLocalScale(0.3, 0.12, 0.1);
      tl.setLocalPosition(tx, 0.38, -2.02);
      root.addChild(tl);
    });

    // Wheels
    const wheelPositions = [
      [-0.85, 0.28, 1.2],
      [0.85, 0.28, 1.2],
      [-0.85, 0.28, -1.2],
      [0.85, 0.28, -1.2]
    ];
    wheelPositions.forEach(wp => {
      const wh = new pc.Entity('W');
      wh.addComponent('render', { type: 'cylinder', material: this.materials.wheel });
      wh.setLocalScale(0.6, 0.22, 0.6);
      wh.setLocalPosition(wp[0], wp[1], wp[2]);
      wh.setLocalEulerAngles(0, 0, 90);
      root.addChild(wh);
    });

    return {
      entity: root,
      cfg: cfg,
      pos: root.getPosition(),
      speed: cfg.speed,
      spinVelocity: 0,
      hitCooldown: 0
    };
  }

  // Update traffic movement and collision with player car
  update(dt, playerVehicle) {
    const bounds = 175;
    const playerPos = playerVehicle.position;

    this.vehicles.forEach(car => {
      car.hitCooldown = Math.max(0, car.hitCooldown - dt);

      // 1. Move along lane
      if (car.cfg.axis === 'z') {
        car.pos.z += car.cfg.dir * car.speed * dt;
        // Wrap around at road boundary
        if (car.cfg.dir > 0 && car.pos.z > bounds) {
          car.pos.z = -bounds;
        } else if (car.cfg.dir < 0 && car.pos.z < -bounds) {
          car.pos.z = bounds;
        }
      } else {
        car.pos.x += car.cfg.dir * car.speed * dt;
        if (car.cfg.dir > 0 && car.pos.x > bounds) {
          car.pos.x = -bounds;
        } else if (car.cfg.dir < 0 && car.pos.x < -bounds) {
          car.pos.x = bounds;
        }
      }

      car.entity.setPosition(car.pos);

      // 2. COLLISION CHECK WITH PLAYER VEHICLE
      const dx = playerPos.x - car.pos.x;
      const dz = playerPos.z - car.pos.z;
      const dist = Math.hypot(dx, dz);

      // Hitbox: ~2.8 meters
      if (dist < 2.8 && car.hitCooldown <= 0) {
        car.hitCooldown = 1.2; // 1.2s cooldown between hit sounds
        
        // Impact reaction
        const impactSpeed = Math.abs(playerVehicle.speedKmh);
        console.log(`💥 COLLISION! Player hit traffic car at ${impactSpeed.toFixed(0)} KM/H!`);

        // Sound effect (horn + crash thump)
        if (this.audio) {
          this.audio.playExhaustBackfire();
        }

        // Push player car back and transfer momentum
        playerVehicle.speed *= 0.45;
        playerVehicle.driftAngle += (Math.random() - 0.5) * 25;

        // Visual flash or push traffic
        car.pos.x += (dx > 0 ? -1 : 1) * 1.5;
      }
    });
  }

  // Get array of traffic positions for radar blips
  getTrafficPositions() {
    return this.vehicles.map(v => v.pos);
  }
}

window.TrafficManager = TrafficManager;

