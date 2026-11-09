/**
 * NEON PURSUIT - Blacklist Rival Boss Racer System (Inspired by NFS: Most Wanted 2005)
 * Spawns an aggressive 1v1 Rival AI racer (Blacklist #1 "RAZOR" / #15 "SONNY")
 * competing in a high-stakes street duel with live position tracking and boss rewards!
 */
class BlacklistRivalManager {
  constructor(app, audio, hud) {
    this.app = app;
    this.audio = audio;
    this.hud = hud;

    this.root = new pc.Entity('BlacklistRoot');
    this.app.root.addChild(this.root);

    this.rivalCar = null;
    this.rivalName = 'RAZOR [BLACKLIST #1]';
    this.rivalVehicleName = 'FORD MUSTANG GT - SUPERCHARGED';
    this.raceActive = false;
    this.rivalSpeed = 0; // m/s
    this.currentWaypoint = 0;
    this.waypoints = [
      { x: 0,   z: -20 },
      { x: 0,   z: -80 },
      { x: 30,  z: -110 },
      { x: 75,  z: -60 },
      { x: 75,  z: 30 },
      { x: 40,  z: 90 },
      { x: 0,   z: 110 },
      { x: 0,   z: -10 }
    ];

    this.materials = {};
    this.initMaterials();
    this.createRivalVehicle();
  }

  initMaterials() {
    // Razor Metallic Gold & Black Livery
    const paintMat = new pc.StandardMaterial();
    paintMat.diffuse = new pc.Color(0.95, 0.75, 0.1); // Razor Flame Gold
    paintMat.specular = new pc.Color(1, 1, 1);
    paintMat.metalness = 0.9;
    paintMat.useMetalness = true;
    paintMat.shininess = 95;
    paintMat.update();
    this.materials.paint = paintMat;

    // Black Vinyl Flames
    const blackMat = new pc.StandardMaterial();
    blackMat.diffuse = new pc.Color(0.05, 0.05, 0.06);
    blackMat.shininess = 70;
    blackMat.update();
    this.materials.black = blackMat;

    // Glass
    const glassMat = new pc.StandardMaterial();
    glassMat.diffuse = new pc.Color(0.02, 0.02, 0.04);
    glassMat.shininess = 90;
    glassMat.update();
    this.materials.glass = glassMat;

    // Headlight
    const headMat = new pc.StandardMaterial();
    headMat.diffuse = new pc.Color(1, 0.95, 0.8);
    headMat.emissive = new pc.Color(2.2, 1.8, 1.2);
    headMat.update();
    this.materials.headlight = headMat;

    // Taillight
    const tailMat = new pc.StandardMaterial();
    tailMat.diffuse = new pc.Color(0.9, 0.05, 0.05);
    tailMat.emissive = new pc.Color(1.5, 0.1, 0.1);
    tailMat.update();
    this.materials.taillight = tailMat;

    // Wheels
    const wheelMat = new pc.StandardMaterial();
    wheelMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
    wheelMat.update();
    this.materials.wheel = wheelMat;
  }

  createRivalVehicle() {
    const root = new pc.Entity('RivalCar');
    root.setPosition(5, 0.45, -15);
    root.setEulerAngles(0, 0, 0);
    this.root.addChild(root);

    // Muscle Car Body (Wide aggressive stance)
    const body = new pc.Entity('RivalBody');
    body.addComponent('render', { type: 'box', material: this.materials.paint });
    body.setLocalScale(1.95, 0.45, 4.5);
    body.setLocalPosition(0, 0.35, 0);
    root.addChild(body);

    // Black Hood Scoop & Roof
    const hoodScoop = new pc.Entity('HoodScoop');
    hoodScoop.addComponent('render', { type: 'box', material: this.materials.black });
    hoodScoop.setLocalScale(0.9, 0.2, 1.2);
    hoodScoop.setLocalPosition(0, 0.65, 1.2);
    root.addChild(hoodScoop);

    // Cabin
    const cabin = new pc.Entity('RivalCabin');
    cabin.addComponent('render', { type: 'box', material: this.materials.glass });
    cabin.setLocalScale(1.5, 0.5, 2.2);
    cabin.setLocalPosition(0, 0.75, -0.2);
    root.addChild(cabin);

    // Aggressive Drag Wing Spoiler
    const wing = new pc.Entity('RivalWing');
    wing.addComponent('render', { type: 'box', material: this.materials.black });
    wing.setLocalScale(1.95, 0.08, 0.4);
    wing.setLocalPosition(0, 0.95, -2.1);
    root.addChild(wing);

    // Headlights
    [-0.65, 0.65].forEach(hx => {
      const hl = new pc.Entity('RivalHL');
      hl.addComponent('render', { type: 'box', material: this.materials.headlight });
      hl.setLocalScale(0.32, 0.12, 0.1);
      hl.setLocalPosition(hx, 0.38, 2.26);
      root.addChild(hl);
    });

    // Taillights
    [-0.65, 0.65].forEach(tx => {
      const tl = new pc.Entity('RivalTL');
      tl.addComponent('render', { type: 'box', material: this.materials.taillight });
      tl.setLocalScale(0.35, 0.12, 0.1);
      tl.setLocalPosition(tx, 0.42, -2.26);
      root.addChild(tl);
    });

    // Wheels
    [
      [-0.94, 0.32, 1.35],
      [0.94, 0.32, 1.35],
      [-0.94, 0.32, -1.35],
      [0.94, 0.32, -1.35]
    ].forEach(wp => {
      const wh = new pc.Entity('RivalWheel');
      wh.addComponent('render', { type: 'cylinder', material: this.materials.wheel });
      wh.setLocalScale(0.68, 0.28, 0.68);
      wh.setLocalPosition(wp[0], wp[1], wp[2]);
      wh.setLocalEulerAngles(0, 0, 90);
      root.addChild(wh);
    });

    this.rivalCar = {
      entity: root,
      pos: root.getPosition(),
      heading: 0,
      speed: 0
    };
  }

  // Start 1v1 Blacklist Boss Duel
  startDuel(playerVehicle) {
    this.raceActive = true;
    this.currentWaypoint = 0;
    this.rivalCar.pos.set(4, 0.45, -12);
    this.rivalCar.speed = 0;
    this.rivalCar.heading = 0;
    this.rivalCar.entity.setPosition(this.rivalCar.pos);

    console.log(`⚔️ [BLACKLIST 1v1 DUEL] Player vs ${this.rivalName}!`);

    if (this.audio) {
      this.audio.playCountdownBeep(true);
      this.audio.playPursuitAlert();
    }

    if (this.hud && this.hud.showImpressionToast) {
      this.hud.showImpressionToast({
        billboard: { id: 'BLACKLIST BOSS DUEL' },
        campaign: { name: `VS ${this.rivalName}` },
        revenue: 50.00,
        totalRevenue: 50000
      });
    }
  }

  // AI navigation and chase loop
  update(dt, playerVehicle) {
    if (!this.raceActive || !this.rivalCar) return;

    const car = this.rivalCar;
    const target = this.waypoints[this.currentWaypoint];
    if (!target) return;

    // Direction vector towards current waypoint
    const dx = target.x - car.pos.x;
    const dz = target.z - car.pos.z;
    const distToWp = Math.hypot(dx, dz);

    if (distToWp < 15.0) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
    }

    // Steer towards target waypoint
    const targetAngleRad = Math.atan2(dx, dz);
    const targetAngleDeg = targetAngleRad * pc.math.RAD_TO_DEG;
    car.heading = pc.math.lerp(car.heading, targetAngleDeg, dt * 4.5);

    // Rival AI Speed (Competitive rubber-banding: stays close to player for dramatic racing)
    const playerSpeed = Math.abs(playerVehicle.speed);
    const targetSpeed = Math.max(22, playerSpeed * 1.05); // m/s (~180-240 km/h)
    car.speed = pc.math.lerp(car.speed, targetSpeed, dt * 2.5);

    // Move forward
    const headingRad = car.heading * pc.math.DEG_TO_RAD;
    car.pos.x += Math.sin(headingRad) * car.speed * dt;
    car.pos.z += Math.cos(headingRad) * car.speed * dt;

    car.entity.setPosition(car.pos);
    car.entity.setEulerAngles(0, car.heading, 0);

    // Collision with player car
    const pDist = Math.hypot(playerVehicle.position.x - car.pos.x, playerVehicle.position.z - car.pos.z);
    if (pDist < 2.9) {
      playerVehicle.speed *= 0.8;
      car.speed *= 0.8;
      if (this.audio) this.audio.playExhaustBackfire();
    }
  }
}

window.BlacklistRivalManager = BlacklistRivalManager;

