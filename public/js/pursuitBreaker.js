/**
 * NEON PURSUIT - Pursuit Breaker System (Iconic Need for Speed: Most Wanted 2005)
 * Allows players to ram into structural support pillars of roadside structures
 * (Highway Gas Station Canopies, Construction Scaffolding, Water Towers)
 * to collapse them, instantly crushing pursuing police cruisers and awarding massive Bounty!
 */
class PursuitBreakerManager {
  constructor(app, audio, hud, police) {
    this.app = app;
    this.audio = audio;
    this.hud = hud;
    this.police = police;

    this.root = new pc.Entity('PursuitBreakerRoot');
    this.app.root.addChild(this.root);

    this.breakers = [];
    this.materials = {};

    this.initMaterials();
    this.spawnPursuitBreakers();
  }

  initMaterials() {
    // Metal Truss / Scaffolding
    const metalMat = new pc.StandardMaterial();
    metalMat.diffuse = new pc.Color(0.25, 0.28, 0.32);
    metalMat.metalness = 0.85;
    metalMat.useMetalness = true;
    metalMat.shininess = 60;
    metalMat.update();
    this.materials.metal = metalMat;

    // Red / White Hazard Stripes
    const hazardMat = new pc.StandardMaterial();
    hazardMat.diffuse = new pc.Color(0.9, 0.2, 0.1);
    hazardMat.emissive = new pc.Color(0.8, 0.1, 0.05);
    hazardMat.update();
    this.materials.hazard = hazardMat;

    // Gas Station Canopy Roof (Yellow & Black Petroleum Brand)
    const canopyMat = new pc.StandardMaterial();
    canopyMat.diffuse = new pc.Color(0.95, 0.75, 0.05); // Sunburst Yellow
    canopyMat.shininess = 70;
    canopyMat.update();
    this.materials.canopy = canopyMat;

    // Glowing Neon Pursuit Breaker Marker (Iconic Inverted Red Triangle)
    const markerMat = new pc.StandardMaterial();
    markerMat.diffuse = new pc.Color(1, 0, 0);
    markerMat.emissive = new pc.Color(2.5, 0.2, 0.1);
    markerMat.update();
    this.materials.marker = markerMat;
  }

  spawnPursuitBreakers() {
    // 1. South Expressway Gas Station Canopy Breaker
    this.createGasStationBreaker({
      id: 'PB-GAS-01',
      name: 'EXPRESSWAY FUEL CANOPY',
      x: 18,
      y: 0,
      z: -45,
      rot: 0
    });

    // 2. Downtown Construction Scaffolding & Tower Breaker
    this.createScaffoldingBreaker({
      id: 'PB-SCAF-02',
      name: 'DOWNTOWN PLAZA SCAFFOLDING',
      x: -45,
      y: 0,
      z: 25,
      rot: 90
    });

    console.log(`💥 Initialized ${this.breakers.length} Pursuit Breaker Structures`);
  }

  // Create Gas Station Canopy Pursuit Breaker
  createGasStationBreaker(cfg) {
    const root = new pc.Entity(cfg.id);
    root.setPosition(cfg.x, cfg.y, cfg.z);
    root.setEulerAngles(0, cfg.rot, 0);
    this.root.addChild(root);

    // Floating Iconic Pursuit Breaker Red Marker Triangle
    const marker = new pc.Entity('BreakerMarker');
    marker.addComponent('render', { type: 'cone', material: this.materials.marker });
    marker.setLocalScale(1.8, 2.2, 1.8);
    marker.setLocalPosition(0, 11.5, 0);
    marker.setLocalEulerAngles(180, 0, 0); // Point down
    root.addChild(marker);

    // Massive Canopy Roof
    const roof = new pc.Entity('CanopyRoof');
    roof.addComponent('render', { type: 'box', material: this.materials.canopy });
    roof.setLocalScale(24, 1.2, 16);
    roof.setLocalPosition(0, 6.5, 0);
    root.addChild(roof);

    // Support Pillars (Target for ramming)
    const pillars = [];
    const pillarPositions = [
      { x: -8, z: -5 },
      { x: -8, z: 5 },
      { x: 8,  z: -5 },
      { x: 8,  z: 5 }
    ];

    pillarPositions.forEach((pp, idx) => {
      const p = new pc.Entity('Pillar_' + idx);
      p.addComponent('render', { type: 'cylinder', material: this.materials.hazard });
      p.setLocalScale(0.8, 6.5, 0.8);
      p.setLocalPosition(pp.x, 3.25, pp.z);
      root.addChild(p);
      pillars.push(p);
    });

    // Fuel Pump islands underneath
    [-4, 4].forEach(px => {
      const pump = new pc.Entity('Pump_' + px);
      pump.addComponent('render', { type: 'box', material: this.materials.metal });
      pump.setLocalScale(1.4, 2.0, 3.5);
      pump.setLocalPosition(px, 1.0, 0);
      root.addChild(pump);
    });

    this.breakers.push({
      cfg,
      root,
      roof,
      marker,
      pillars,
      collapsed: false,
      collapseProgress: 0,
      collapseVelocity: 0,
      targetPillarRadius: 3.5
    });
  }

  // Create Construction Scaffolding Pursuit Breaker
  createScaffoldingBreaker(cfg) {
    const root = new pc.Entity(cfg.id);
    root.setPosition(cfg.x, cfg.y, cfg.z);
    root.setEulerAngles(0, cfg.rot, 0);
    this.root.addChild(cfg.id);
    this.root.addChild(root);

    // Marker
    const marker = new pc.Entity('BreakerMarker');
    marker.addComponent('render', { type: 'cone', material: this.materials.marker });
    marker.setLocalScale(1.8, 2.2, 1.8);
    marker.setLocalPosition(0, 14.5, 0);
    marker.setLocalEulerAngles(180, 0, 0);
    root.addChild(marker);

    // Heavy Industrial Scaffolding Tower
    const tower = new pc.Entity('ScaffoldingTower');
    tower.addComponent('render', { type: 'box', material: this.materials.metal });
    tower.setLocalScale(14, 11, 10);
    tower.setLocalPosition(0, 6.0, 0);
    root.addChild(tower);

    // Support legs
    const pillars = [];
    [-5, 5].forEach(px => {
      const p = new pc.Entity('ScafPillar_' + px);
      p.addComponent('render', { type: 'cylinder', material: this.materials.hazard });
      p.setLocalScale(0.7, 5.0, 0.7);
      p.setLocalPosition(px, 2.5, 0);
      root.addChild(p);
      pillars.push(p);
    });

    this.breakers.push({
      cfg,
      root,
      roof: tower,
      marker,
      pillars,
      collapsed: false,
      collapseProgress: 0,
      collapseVelocity: 0,
      targetPillarRadius: 3.5
    });
  }

  // Update loop: checks player collision with breaker pillars & animates collapse physics
  update(dt, playerVehicle) {
    const playerPos = playerVehicle.position;

    this.breakers.forEach(b => {
      // Rotate floating marker triangle
      if (b.marker && !b.collapsed) {
        b.marker.rotate(0, dt * 90, 0);
      }

      // 1. COLLISION TRIGGER CHECK
      if (!b.collapsed) {
        // Distance to breaker center
        const dx = playerPos.x - b.cfg.x;
        const dz = playerPos.z - b.cfg.z;
        const dist = Math.hypot(dx, dz);

        // Player drives through breaker footprint at high speed (> 35 KM/H)
        if (dist < 8.5 && Math.abs(playerVehicle.speedKmh) > 35) {
          this.triggerBreakerCollapse(b, playerVehicle);
        }
      }

      // 2. COLLAPSE ANIMATION PHYSICS
      if (b.collapsed && b.collapseProgress < 1.0) {
        b.collapseVelocity += dt * 9.8;
        b.collapseProgress += b.collapseVelocity * dt * 0.15;

        // Animate roof tilting and crashing down
        const tiltAngle = Math.min(35, b.collapseProgress * 35);
        const dropY = Math.max(0.8, 6.5 - (b.collapseProgress * 5.7));

        b.roof.setLocalPosition(0, dropY, 0);
        b.roof.setLocalEulerAngles(tiltAngle, 0, tiltAngle * 0.4);

        if (b.marker) b.marker.enabled = false;
      }
    });
  }

  // Trigger Pursuit Breaker Collapse (Crushes pursuing cops)
  triggerBreakerCollapse(breaker, playerVehicle) {
    breaker.collapsed = true;
    console.log(`💥 [PURSUIT BREAKER TRIGGERED] ${breaker.cfg.name}!`);

    // Play destruction sound / backfire explosion
    if (this.audio) {
      this.audio.playExhaustBackfire();
      this.audio.playPursuitAlert();
    }

    // Check if any police cruisers are caught underneath / behind player (within 24m)
    let crushedCopsCount = 0;
    if (this.police && this.police.cruisers && this.police.pursuitActive) {
      this.police.cruisers.forEach(cop => {
        const cdx = cop.pos.x - breaker.cfg.x;
        const cdz = cop.pos.z - breaker.cfg.z;
        const copDist = Math.hypot(cdx, cdz);

        if (copDist < 26.0) {
          crushedCopsCount++;
          // Disable cruiser
          cop.speed = 0;
          cop.isChasing = false;
          cop.entity.setEulerAngles(25, cop.heading + 45, 15);
          console.log(`🚔 COP TOTALED by Pursuit Breaker!`);
        }
      });

      if (crushedCopsCount > 0) {
        const bonusBounty = crushedCopsCount * 12500;
        const bonusCost = crushedCopsCount * 8500;
        this.police.bounty += bonusBounty;
        this.police.costToState += bonusCost;
      }
    }

    // Trigger on-screen banner
    if (this.hud && this.hud.showImpressionToast) {
      this.hud.showImpressionToast({
        billboard: { id: 'PURSUIT BREAKER' },
        campaign: { name: `${breaker.cfg.name} COLLAPSED!` },
        revenue: 15.00,
        totalRevenue: this.police?.bounty || 25000
      });
    }
  }
}

window.PursuitBreakerManager = PursuitBreakerManager;

