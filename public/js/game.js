/**
 * NEON PURSUIT - Main PlayCanvas Application Orchestrator
 * Need for Speed: Most Wanted (2005) Style 3D Racing with Dynamic In-Game Billboard Ads
 */
(function () {
  // Ensure DOM is loaded
  window.addEventListener('DOMContentLoaded', initGame);

  async function initGame() {
    console.log('🏁 Initializing NEON PURSUIT Engine...');

    const canvas = document.getElementById('application-canvas');
    if (!canvas) {
      console.error('Canvas #application-canvas not found!');
      return;
    }

    // 1. Initialize PlayCanvas Standalone Application
    const app = new pc.Application(canvas, {
      keyboard: new pc.Keyboard(window),
      mouse: new pc.Mouse(canvas),
      touch: new pc.Touch(canvas),
      graphicsDeviceOptions: {
        antialias: true,
        alpha: false,
        preferWebGl2: true,
        powerPreference: 'high-performance'
      }
    });

    app.start();
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // Auto-resize on window resize
    window.addEventListener('resize', () => {
      app.resizeCanvas();
    });

    // 2. Set Up Atmospheric Lighting & Night Sky
    app.scene.ambientLight = new pc.Color(0.14, 0.16, 0.24); // Atmospheric Night Indigo

    // Directional Moonlight
    const moonLight = new pc.Entity('MoonLight');
    moonLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.45, 0.52, 0.7),
      intensity: 0.9,
      castShadows: false
    });
    moonLight.setEulerAngles(50, 35, 0);
    app.root.addChild(moonLight);

    // Warm Ambient Ground Fill
    const warmFill = new pc.Entity('CityWarmAmbient');
    warmFill.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.35, 0.28, 0.2),
      intensity: 0.4
    });
    warmFill.setEulerAngles(-45, -120, 0);
    app.root.addChild(warmFill);

    // 3. Instantiate Game Audio Synthesizer
    const audio = new GameAudio();

    // 4. Build 3D City Environment
    const city = new CityBuilder(app);

    // 5. Build 3D Player Sports Car
    const vehicle = new Vehicle(app);

    // 6. Camera Setup (Smooth 3rd-Person Follow Camera)
    const camera = new pc.Entity('MainCamera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.04, 0.05, 0.08),
      fov: 65,
      nearClip: 0.2,
      farClip: 1000
    });
    camera.setPosition(0, 3.5, -9);
    app.root.addChild(camera);

    // Camera Modes: 0 = Chase Normal, 1 = Chase Far, 2 = Bumper / Hood
    let cameraMode = 0;
    const cameraConfigs = [
      { dist: 8.2, height: 3.2, lookY: 1.1, baseFov: 65 },  // Normal Chase
      { dist: 12.0, height: 4.8, lookY: 1.2, baseFov: 70 }, // Far Chase
      { dist: 1.5, height: 1.1, lookY: 0.8, baseFov: 75 }   // Hood / Cockpit
    ];

    let currentCamPos = new pc.Vec3(0, 3.5, -9);

    // 7. Instantiate HUD & Ad Tracker
    const hud = new GameHUD();
    const adTracker = new AdTracker(app, camera, audio);

    // 7b. Instantiate Civilian Traffic & Checkpoint Street Racing
    const traffic = window.TrafficManager ? new TrafficManager(app, audio) : null;
    const race = window.RaceManager ? new RaceManager(app, audio, hud) : null;

    // Press 'E' to trigger Checkpoint Sprint Race
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'e' || e.key === 'E') && race && race.state === 'IDLE') {
        race.startRace(vehicle);
      }
    });

    // Wire up HUD callbacks
    adTracker.onImpressionVerified = (data) => {
      hud.showImpressionToast(data);
    };
    adTracker.onTelemetryUpdate = (telemetry) => {
      hud.updateTelemetry(telemetry);
    };

    // 8. Fetch & Spawn Dynamic Billboards from Backend Ad Server
    const billboards = await loadDynamicBillboards(app, adTracker);

    // 9. Camera Mode Switching Listener ('C' key)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        cameraMode = (cameraMode + 1) % cameraConfigs.length;
        console.log(`🎥 Camera Switched to Mode ${cameraMode}`);
      }
    });

    // 10. Start Engine Audio on First User Gesture
    const startOverlay = document.getElementById('start-screen-overlay');
    const startBtn = document.getElementById('start-engine-btn');

    function startDrivingSession() {
      if (startOverlay) {
        startOverlay.classList.add('fade-out');
        setTimeout(() => startOverlay.remove(), 600);
      }
      audio.init();
      audio.playPursuitAlert();
      window.removeEventListener('click', startDrivingSession);
      window.removeEventListener('keydown', startDrivingSession);
    }

    if (startBtn) {
      startBtn.addEventListener('click', startDrivingSession);
    }
    window.addEventListener('keydown', startDrivingSession, { once: true });
    window.addEventListener('click', startDrivingSession, { once: true });

    // 11. MAIN ENGINE TICK LOOP
    app.on('update', (dt) => {
      // Clamp dt to avoid physics explodes on tab switch
      const clampedDt = Math.min(dt, 0.1);

      // A. Update Vehicle Physics & Audio
      vehicle.update(clampedDt, app.keyboard, audio);

      // B. Update 3rd-Person Follow Camera
      updateCamera(clampedDt, camera, vehicle, cameraConfigs[cameraMode], currentCamPos);

      // C. Update Ad Viewability Tracking Engine
      adTracker.update(clampedDt, vehicle.speedKmh);

      // C2. Update Civilian Traffic & Street Race
      if (traffic) traffic.update(clampedDt, vehicle);
      if (race) race.update(clampedDt, vehicle);

      // D. Update HUD UI & Mini-Map Radar
      hud.update(vehicle, billboards);
    });

    console.log('✅ NEON PURSUIT Ready to Race');
  }

  // Smooth Chase Camera with Speed-FOV expansion and Drift Lag
  function updateCamera(dt, camera, vehicle, cfg, camPosTracker) {
    const carPos = vehicle.position;
    const carHeadingRad = (vehicle.heading + vehicle.driftAngle * 0.45) * pc.math.DEG_TO_RAD;

    // Calculate ideal camera position behind the car
    const behindX = carPos.x - Math.sin(carHeadingRad) * cfg.dist;
    const behindZ = carPos.z - Math.cos(carHeadingRad) * cfg.dist;
    const idealY = carPos.y + cfg.height;

    // Smooth lerp camera position
    const lerpSpeed = 8.5;
    camPosTracker.x = pc.math.lerp(camPosTracker.x, behindX, dt * lerpSpeed);
    camPosTracker.y = pc.math.lerp(camPosTracker.y, idealY, dt * (lerpSpeed * 1.2));
    camPosTracker.z = pc.math.lerp(camPosTracker.z, behindZ, dt * lerpSpeed);
    camera.setPosition(camPosTracker);

    // Look target: Point slightly ahead of car hood
    const lookTarget = new pc.Vec3(
      carPos.x + Math.sin(carHeadingRad) * 4.0,
      carPos.y + cfg.lookY,
      carPos.z + Math.cos(carHeadingRad) * 4.0
    );
    camera.lookAt(lookTarget);

    // Speed-responsive Dynamic Field of View (FOV)
    // Expands FOV as speed increases for exhilarating speed sensation
    const speedRatio = Math.min(1, Math.abs(vehicle.speedKmh) / 240);
    const targetFov = cfg.baseFov + speedRatio * 18 + (vehicle.isNitro ? 8 : 0);
    camera.camera.fov = pc.math.lerp(camera.camera.fov, targetFov, dt * 5);
  }

  // Load Billboard Data from Ad Server or Local Fallback
  async function loadDynamicBillboards(app, adTracker) {
    const billboardEntities = [];

    // Default Billboard definitions if server is unreachable
    const fallbackBillboards = [
      {
        id: 'BB-001',
        name: 'Highway Overpass Mega Billboard',
        location: 'South Expressway & Metro Loop Junction',
        dimensions: { width: 16, height: 8 },
        position: { x: 0, y: 14, z: -90 },
        rotation: { x: 0, y: 0, z: 0 },
        adImage: '/assets/ads/ad_apex_tires.svg',
        campaign: { id: 'CAMP-001', name: 'Apex Street-Slick Tires', advertiser: 'Apex Motorsport', cpm: 120 }
      },
      {
        id: 'BB-002',
        name: 'Downtown Central Skyscraper Display',
        location: 'Broad Street & Neon Plaza Tower',
        dimensions: { width: 18, height: 10 },
        position: { x: 75, y: 20, z: 20 },
        rotation: { x: 0, y: -90, z: 0 },
        adImage: '/assets/ads/ad_quantum_fuel.svg',
        campaign: { id: 'CAMP-002', name: 'Quantum Nitro Fuel', advertiser: 'Quantum Energy Corp', cpm: 150 }
      },
      {
        id: 'BB-003',
        name: 'Waterfront Industrial Speedway Board',
        location: 'East Docks Container Terminal',
        dimensions: { width: 14, height: 7 },
        position: { x: -85, y: 12, z: -15 },
        rotation: { x: 0, y: 90, z: 0 },
        adImage: '/assets/ads/ad_hyper_energy.svg',
        campaign: { id: 'CAMP-003', name: 'HyperCharge Energy Drink', advertiser: 'HyperCharge Global', cpm: 95 }
      },
      {
        id: 'BB-004',
        name: 'North Ridge Bridge Speedway Banner',
        location: 'Hillside Expressway Overpass North',
        dimensions: { width: 16, height: 8 },
        position: { x: 0, y: 15, z: 100 },
        rotation: { x: 0, y: 180, z: 0 },
        adImage: '/assets/ads/ad_cyber_tel.svg',
        campaign: { id: 'CAMP-004', name: 'CyberTel 5G Ultra Gaming', advertiser: 'CyberTel', cpm: 110 }
      }
    ];

    try {
      console.log('📡 Fetching active ad inventory from backend server...');
      const res = await fetch('/api/ads/active');
      const data = await res.json();

      if (data && data.billboards && data.billboards.length > 0) {
        data.billboards.forEach(bbDef => {
          const activeAd = data.activeAds ? data.activeAds[bbDef.id] : null;
          const entity = new BillboardEntity(app, bbDef);

          const imgUrl = activeAd ? activeAd.image : '/assets/ads/default_ad.svg';
          entity.loadAdImage(imgUrl, activeAd);

          billboardEntities.push(entity);
          adTracker.registerBillboard(entity);
        });
        console.log(`✅ Loaded ${billboardEntities.length} Billboards from Ad Server`);
        return billboardEntities;
      }
    } catch (err) {
      console.warn('⚠️ Ad Server fetch failed, initializing local fallback ads:', err.message);
    }

    // Fallback deployment
    fallbackBillboards.forEach(bbDef => {
      const entity = new BillboardEntity(app, bbDef);
      entity.loadAdImage(bbDef.adImage, bbDef.campaign);
      billboardEntities.push(entity);
      adTracker.registerBillboard(entity);
    });

    console.log(`✅ Loaded ${billboardEntities.length} Fallback Dynamic Billboards`);
    return billboardEntities;
  }
})();

