/**
 * NEON PURSUIT - 3D City Environment Generator
 * Creates an authentic Need for Speed: Most Wanted urban atmosphere
 * with multi-lane highways, skyscrapers, neon roof signs, streetlights, and overpasses.
 */
class CityBuilder {
  constructor(app) {
    this.app = app;
    this.root = new pc.Entity('CityRoot');
    this.app.root.addChild(this.root);

    this.materials = {};
    this.initMaterials();
    this.buildGroundAndRoads();
    this.buildSkyscrapers();
    this.buildHighwayOverpass();
    this.buildStreetlights();
    this.buildBarriers();
    this.buildHighwayTunnel();
  }

  initMaterials() {
    // 1. Dark Asphalt Road Material
    const asphaltMat = new pc.StandardMaterial();
    asphaltMat.diffuse = new pc.Color(0.12, 0.13, 0.15);
    asphaltMat.shininess = 35;
    asphaltMat.specular = new pc.Color(0.2, 0.2, 0.22);
    asphaltMat.update();
    this.materials.asphalt = asphaltMat;

    // 2. Concrete Sidewalk & Curb Material
    const sidewalkMat = new pc.StandardMaterial();
    sidewalkMat.diffuse = new pc.Color(0.25, 0.26, 0.28);
    sidewalkMat.shininess = 20;
    sidewalkMat.update();
    this.materials.sidewalk = sidewalkMat;

    // 3. Road Markings (Yellow & White Luminous Paint)
    const roadMarkYellow = new pc.StandardMaterial();
    roadMarkYellow.diffuse = new pc.Color(0.9, 0.75, 0.1);
    roadMarkYellow.emissive = new pc.Color(0.25, 0.2, 0.02);
    roadMarkYellow.update();
    this.materials.roadMarkYellow = roadMarkYellow;

    const roadMarkWhite = new pc.StandardMaterial();
    roadMarkWhite.diffuse = new pc.Color(0.85, 0.85, 0.9);
    roadMarkWhite.emissive = new pc.Color(0.15, 0.15, 0.18);
    roadMarkWhite.update();
    this.materials.roadMarkWhite = roadMarkWhite;

    // 4. Skyscraper Materials (Varied glass, concrete, dark panels)
    const buildingColors = [
      new pc.Color(0.08, 0.10, 0.14),
      new pc.Color(0.12, 0.14, 0.18),
      new pc.Color(0.06, 0.08, 0.12),
      new pc.Color(0.14, 0.12, 0.16)
    ];
    this.materials.buildings = buildingColors.map(col => {
      const mat = new pc.StandardMaterial();
      mat.diffuse = col;
      mat.specular = new pc.Color(0.4, 0.45, 0.5);
      mat.shininess = 50;
      mat.update();
      return mat;
    });

    // 5. Window Grid Emissive Material (Simulates glowing night office windows)
    const windowMat = new pc.StandardMaterial();
    windowMat.diffuse = new pc.Color(0.1, 0.15, 0.2);
    windowMat.emissive = new pc.Color(0.6, 0.65, 0.75);
    windowMat.shininess = 80;
    windowMat.update();
    this.materials.window = windowMat;

    // 6. Neon Sign Materials
    const neonPink = new pc.StandardMaterial();
    neonPink.diffuse = new pc.Color(1, 0.1, 0.6);
    neonPink.emissive = new pc.Color(2.0, 0.1, 1.2);
    neonPink.update();
    this.materials.neonPink = neonPink;

    const neonCyan = new pc.StandardMaterial();
    neonCyan.diffuse = new pc.Color(0, 0.9, 1);
    neonCyan.emissive = new pc.Color(0.2, 1.8, 2.2);
    neonCyan.update();
    this.materials.neonCyan = neonCyan;

    const neonAmber = new pc.StandardMaterial();
    neonAmber.diffuse = new pc.Color(1, 0.6, 0);
    neonAmber.emissive = new pc.Color(2.0, 1.1, 0.1);
    neonAmber.update();
    this.materials.neonAmber = neonAmber;

    // 7. Metal & Guardrail
    const metalMat = new pc.StandardMaterial();
    metalMat.diffuse = new pc.Color(0.4, 0.42, 0.45);
    metalMat.metalness = 0.8;
    metalMat.useMetalness = true;
    metalMat.shininess = 60;
    metalMat.update();
    this.materials.metal = metalMat;
  }

  buildGroundAndRoads() {
    // Main terrain base
    const ground = new pc.Entity('GroundTerrain');
    ground.addComponent('render', { type: 'box', material: this.materials.asphalt });
    ground.setLocalScale(400, 0.5, 400);
    ground.setLocalPosition(0, -0.25, 0);
    this.root.addChild(ground);

    // North-South Main Expressway (Z axis)
    const nsHighway = new pc.Entity('NS_Highway');
    nsHighway.addComponent('render', { type: 'box', material: this.materials.asphalt });
    nsHighway.setLocalScale(26, 0.6, 380);
    nsHighway.setLocalPosition(0, -0.2, 0);
    this.root.addChild(nsHighway);

    // East-West Cross Boulevard (X axis)
    const ewHighway = new pc.Entity('EW_Highway');
    ewHighway.addComponent('render', { type: 'box', material: this.materials.asphalt });
    ewHighway.setLocalScale(380, 0.6, 26);
    ewHighway.setLocalPosition(0, -0.2, 0);
    this.root.addChild(ewHighway);

    // Diagonal Ring Road Bypass
    const ringRoads = [
      { x: 90, z: 90, sx: 20, sz: 140, rot: 45 },
      { x: -90, z: 90, sx: 20, sz: 140, rot: -45 },
      { x: 90, z: -90, sx: 20, sz: 140, rot: -45 },
      { x: -90, z: -90, sx: 20, sz: 140, rot: 45 }
    ];
    ringRoads.forEach((r, idx) => {
      const ring = new pc.Entity('RingRoad_' + idx);
      ring.addComponent('render', { type: 'box', material: this.materials.asphalt });
      ring.setLocalScale(r.sx, 0.6, r.sz);
      ring.setLocalPosition(r.x, -0.2, r.z);
      ring.setLocalEulerAngles(0, r.rot, 0);
      this.root.addChild(ring);
    });

    // Road Markings: Yellow Double Center Line (North-South)
    for (let z = -180; z <= 180; z += 12) {
      [-0.4, 0.4].forEach(xOff => {
        const line = new pc.Entity('CenterLineYellow_Z_' + z + '_' + xOff);
        line.addComponent('render', { type: 'box', material: this.materials.roadMarkYellow });
        line.setLocalScale(0.2, 0.05, 8);
        line.setLocalPosition(xOff, 0.06, z);
        this.root.addChild(line);
      });

      // White Dashed Lane Dividers (Outer Lanes)
      [-6.5, 6.5].forEach(xOff => {
        const whiteDash = new pc.Entity('WhiteDash_Z_' + z + '_' + xOff);
        whiteDash.addComponent('render', { type: 'box', material: this.materials.roadMarkWhite });
        whiteDash.setLocalScale(0.25, 0.05, 5);
        whiteDash.setLocalPosition(xOff, 0.06, z);
        this.root.addChild(whiteDash);
      });
    }

    // Road Markings: East-West Double Center Line (X axis)
    for (let x = -180; x <= 180; x += 12) {
      if (Math.abs(x) < 16) continue; // Skip intersection
      [-0.4, 0.4].forEach(zOff => {
        const line = new pc.Entity('CenterLineYellow_X_' + x + '_' + zOff);
        line.addComponent('render', { type: 'box', material: this.materials.roadMarkYellow });
        line.setLocalScale(8, 0.05, 0.2);
        line.setLocalPosition(x, 0.06, zOff);
        this.root.addChild(line);
      });
    }

    // Sidewalk Curbs along NS Highway
    [-13.5, 13.5].forEach(curbX => {
      const curb = new pc.Entity('Curb_NS_' + curbX);
      curb.addComponent('render', { type: 'box', material: this.materials.sidewalk });
      curb.setLocalScale(2.5, 0.45, 380);
      curb.setLocalPosition(curbX, 0.15, 0);
      this.root.addChild(curb);
    });
  }

  buildSkyscrapers() {
    // City Block Layout coordinates
    const cityBlocks = [
      // Quadrant 1: North-East (Financial / High-Rise District)
      { x: 45,  z: 55,  w: 24, d: 24, h: 72, mat: 0, sign: 'CYBERTECH', signColor: this.materials.neonCyan },
      { x: 80,  z: 45,  w: 30, d: 22, h: 58, mat: 1 },
      { x: 45,  z: 95,  w: 22, d: 28, h: 48, mat: 2, sign: 'METRO BANK', signColor: this.materials.neonAmber },
      { x: 85,  z: 95,  w: 28, d: 28, h: 84, mat: 3, antenna: true },
      { x: 130, z: 65,  w: 32, d: 35, h: 65, mat: 1 },

      // Quadrant 2: South-East (Commercial / Plaza District)
      { x: 50,  z: -55, w: 26, d: 24, h: 64, mat: 2, sign: 'HOTEL LUX', signColor: this.materials.neonPink },
      { x: 85,  z: -50, w: 28, d: 26, h: 52, mat: 0 },
      { x: 50,  z: -95, w: 24, d: 30, h: 44, mat: 3 },
      { x: 90,  z: -95, w: 32, d: 28, h: 76, mat: 1, antenna: true },
      { x: 135, z: -70, w: 35, d: 35, h: 58, mat: 0 },

      // Quadrant 3: North-West (Industrial / Speedway Hub)
      { x: -50,  z: 55,  w: 26, d: 26, h: 54, mat: 1 },
      { x: -85,  z: 45,  w: 28, d: 24, h: 42, mat: 2, sign: 'SYNTH OILS', signColor: this.materials.neonAmber },
      { x: -50,  z: 100, w: 22, d: 30, h: 62, mat: 0 },
      { x: -90,  z: 100, w: 30, d: 28, h: 70, mat: 3, antenna: true },
      { x: -130, z: 70,  w: 32, d: 35, h: 46, mat: 1 },

      // Quadrant 4: South-West (Port / Warehouse District)
      { x: -45,  z: -50, w: 24, d: 24, h: 48, mat: 3, sign: 'CARGO LOGISTICS', signColor: this.materials.neonCyan },
      { x: -85,  z: -55, w: 32, d: 26, h: 38, mat: 0 },
      { x: -50,  z: -95, w: 26, d: 28, h: 56, mat: 2 },
      { x: -90,  z: -100, w: 28, d: 32, h: 66, mat: 1 },
      { x: -135, z: -75, w: 34, d: 34, h: 50, mat: 0 }
    ];

    cityBlocks.forEach((b, idx) => {
      // Main Building Core
      const building = new pc.Entity('Building_' + idx);
      const bMat = this.materials.buildings[b.mat % this.materials.buildings.length];
      building.addComponent('render', { type: 'box', material: bMat });
      building.setLocalScale(b.w, b.h, b.d);
      building.setLocalPosition(b.x, b.h / 2, b.z);
      this.root.addChild(building);

      // Window strips on front facing facades (adds authentic skyscraper depth)
      const numWindowBands = Math.floor(b.h / 12);
      for (let f = 1; f <= numWindowBands; f++) {
        const bandY = f * 11;
        const windowBand = new pc.Entity('Windows_' + idx + '_' + f);
        windowBand.addComponent('render', { type: 'box', material: this.materials.window });
        windowBand.setLocalScale(b.w * 0.92, 1.4, b.d * 1.01);
        windowBand.setLocalPosition(b.x, bandY, b.z);
        this.root.addChild(windowBand);
      }

      // Rooftop Helipad / Infrastructure Cap
      const roofCap = new pc.Entity('RoofCap_' + idx);
      roofCap.addComponent('render', { type: 'box', material: this.materials.metal });
      roofCap.setLocalScale(b.w * 0.6, 2.5, b.d * 0.6);
      roofCap.setLocalPosition(b.x, b.h + 1.25, b.z);
      this.root.addChild(roofCap);

      // Antenna on selected tall towers
      if (b.antenna) {
        const antenna = new pc.Entity('Antenna_' + idx);
        antenna.addComponent('render', { type: 'cylinder', material: this.materials.metal });
        antenna.setLocalScale(0.4, 18, 0.4);
        antenna.setLocalPosition(b.x, b.h + 10, b.z);
        this.root.addChild(antenna);

        // Blinking red aviation warning beacon on top of antenna
        const beacon = new pc.Entity('Beacon_' + idx);
        const beaconMat = new pc.StandardMaterial();
        beaconMat.emissive = new pc.Color(2.5, 0.1, 0.1);
        beaconMat.update();
        beacon.addComponent('render', { type: 'sphere', material: beaconMat });
        beacon.setLocalScale(1.2, 1.2, 1.2);
        beacon.setLocalPosition(b.x, b.h + 19, b.z);
        this.root.addChild(beacon);
      }

      // Glowing Neon Roof Sign
      if (b.sign) {
        const signEntity = new pc.Entity('NeonSign_' + idx);
        signEntity.addComponent('render', { type: 'box', material: b.signColor || this.materials.neonCyan });
        signEntity.setLocalScale(b.w * 0.7, 4.2, 0.6);
        signEntity.setLocalPosition(b.x, b.h + 4.5, b.z - b.d / 2 + 1);
        this.root.addChild(signEntity);
      }
    });
  }

  buildHighwayOverpass() {
    // 3D Elevated Highway Bridge crossing over the South intersection
    const bridgeY = 7.5;
    const bridgeZ = -70;

    // Bridge Span Deck
    const bridgeDeck = new pc.Entity('BridgeDeck');
    bridgeDeck.addComponent('render', { type: 'box', material: this.materials.asphalt });
    bridgeDeck.setLocalScale(120, 1.6, 18);
    bridgeDeck.setLocalPosition(0, bridgeY, bridgeZ);
    this.root.addChild(bridgeDeck);

    // Guardrails along elevated bridge
    [-8.5, 8.5].forEach(gz => {
      const rail = new pc.Entity('BridgeRail_' + gz);
      rail.addComponent('render', { type: 'box', material: this.materials.metal });
      rail.setLocalScale(120, 1.2, 0.4);
      rail.setLocalPosition(0, bridgeY + 1.2, bridgeZ + gz);
      this.root.addChild(rail);
    });

    // Support Concrete Pillars
    [-38, 38].forEach(px => {
      const pillar = new pc.Entity('BridgePillar_' + px);
      pillar.addComponent('render', { type: 'cylinder', material: this.materials.sidewalk });
      pillar.setLocalScale(3.2, bridgeY, 3.2);
      pillar.setLocalPosition(px, bridgeY / 2, bridgeZ);
      this.root.addChild(pillar);
    });
  }

  buildStreetlights() {
    // Streetlight poles along main expressway
    const lightZPositions = [-160, -120, -40, 40, 80, 120, 160];
    const lightMat = new pc.StandardMaterial();
    lightMat.emissive = new pc.Color(2.5, 2.2, 1.4); // Warm sodium lamp glow
    lightMat.update();

    lightZPositions.forEach(z => {
      [-14.5, 14.5].forEach((x, sideIdx) => {
        // Vertical steel post
        const pole = new pc.Entity('LightPole_' + z + '_' + sideIdx);
        pole.addComponent('render', { type: 'cylinder', material: this.materials.metal });
        pole.setLocalScale(0.3, 9, 0.3);
        pole.setLocalPosition(x, 4.5, z);
        this.root.addChild(pole);

        // Horizontal arm extending toward road
        const armDir = x > 0 ? -1 : 1;
        const arm = new pc.Entity('LightArm_' + z + '_' + sideIdx);
        arm.addComponent('render', { type: 'cylinder', material: this.materials.metal });
        arm.setLocalScale(0.2, 3.5, 0.2);
        arm.setLocalPosition(x + (1.5 * armDir), 8.8, z);
        arm.setLocalEulerAngles(0, 0, armDir * 75);
        this.root.addChild(arm);

        // Glowing Lamp Fixture
        const lamp = new pc.Entity('LampFixture_' + z + '_' + sideIdx);
        lamp.addComponent('render', { type: 'box', material: lightMat });
        lamp.setLocalScale(1.2, 0.35, 0.8);
        lamp.setLocalPosition(x + (3.2 * armDir), 8.5, z);
        this.root.addChild(lamp);

        // Actual Point Light illuminating the street
        const light = new pc.Entity('StreetLight_' + z + '_' + sideIdx);
        light.addComponent('light', {
          type: 'point',
          color: new pc.Color(1.0, 0.88, 0.65),
          intensity: 1.2,
          range: 22,
          castShadows: false
        });
        light.setLocalPosition(x + (3.2 * armDir), 8.0, z);
        this.root.addChild(light);
      });
    });
  }

  buildBarriers() {
    // City boundary safety crash walls with chevron hazard stripes
    const hazardMat = new pc.StandardMaterial();
    hazardMat.diffuse = new pc.Color(0.8, 0.6, 0.1);
    hazardMat.shininess = 30;
    hazardMat.update();

    const bounds = 190;
    const wallConfigs = [
      { x: 0, z: -bounds, sx: 380, sz: 3 },
      { x: 0, z: bounds,  sx: 380, sz: 3 },
      { x: -bounds, z: 0, sx: 3,   sz: 380 },
      { x: bounds,  z: 0, sx: 3,   sz: 380 }
    ];

    wallConfigs.forEach((cfg, idx) => {
      const wall = new pc.Entity('OuterWall_' + idx);
      wall.addComponent('render', { type: 'box', material: hazardMat });
      wall.setLocalScale(cfg.sx, 2.5, cfg.sz);
      wall.setLocalPosition(cfg.x, 1.25, cfg.z);
      this.root.addChild(wall);
    });

    console.log('🏙️ 3D City Environment & Roadway Grid Assembled');
  }

  // 3D Concrete Highway Tunnel with Ceiling Sodium Lights (NFS Most Wanted Rosewood Tunnel)
  buildHighwayTunnel() {
    const tunnelZStart = 70;
    const tunnelLength = 65;
    const tunnelCenterZ = tunnelZStart + (tunnelLength / 2);
    const tunnelHeight = 8.5;
    const tunnelWidth = 28;

    // Concrete Sidewalls
    [-tunnelWidth / 2, tunnelWidth / 2].forEach((wx, idx) => {
      const wall = new pc.Entity('TunnelWall_' + idx);
      wall.addComponent('render', { type: 'box', material: this.materials.sidewalk });
      wall.setLocalScale(2.5, tunnelHeight, tunnelLength);
      wall.setLocalPosition(wx, tunnelHeight / 2, tunnelCenterZ);
      this.root.addChild(wall);
    });

    // Concrete Arched Roof
    const roof = new pc.Entity('TunnelRoof');
    roof.addComponent('render', { type: 'box', material: this.materials.sidewalk });
    roof.setLocalScale(tunnelWidth + 4, 1.8, tunnelLength);
    roof.setLocalPosition(0, tunnelHeight, tunnelCenterZ);
    this.root.addChild(roof);

    // Glowing Ceiling Lights running through tunnel
    const ceilingLightMat = new pc.StandardMaterial();
    ceilingLightMat.emissive = new pc.Color(2.5, 1.8, 0.4); // Sodium Amber
    ceilingLightMat.update();

    for (let tz = tunnelZStart + 8; tz < tunnelZStart + tunnelLength - 4; tz += 12) {
      const lamp = new pc.Entity('TunnelCeilingLight_' + tz);
      lamp.addComponent('render', { type: 'box', material: ceilingLightMat });
      lamp.setLocalScale(6.0, 0.35, 1.2);
      lamp.setLocalPosition(0, tunnelHeight - 0.5, tz);
      this.root.addChild(lamp);

      const light = new pc.Entity('TunnelLightSource_' + tz);
      light.addComponent('light', {
        type: 'point',
        color: new pc.Color(1.0, 0.82, 0.45),
        intensity: 1.5,
        range: 18,
        castShadows: false
      });
      light.setLocalPosition(0, tunnelHeight - 1.2, tz);
      this.root.addChild(light);
    }

    console.log('🚇 Highway Tunnel Vault Assembled');
  }
}

window.CityBuilder = CityBuilder;

