/**
 * NEON PURSUIT - Main PlayCanvas Application Orchestrator
 * Need for Speed: Most Wanted (2005) Style 3D Racing with Dynamic In-Game Billboard Ads
 */
(function () {
  // Ensure DOM is loaded immediately (robust against fast cache / interactive state)
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }

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

    // 2. Set Up Iconic Need for Speed: Most Wanted (2005) Autumn Golden Hour Atmosphere
    app.scene.ambientLight = new pc.Color(0.48, 0.40, 0.28); // Warm Golden-Amber Ambient

    // Atmospheric Autumn Distance Fog (Iconic Rockport City Haze)
    app.scene.fog = pc.FOG_EXP;
    app.scene.fogColor = new pc.Color(0.68, 0.55, 0.38);
    app.scene.fogDensity = 0.0028;

    // Golden Sunlight (Long shadows, warm automotive reflections)
    const sunLight = new pc.Entity('MWSunLight');
    sunLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1.0, 0.85, 0.55),
      intensity: 1.55,
      castShadows: false
    });
    sunLight.setEulerAngles(38, 48, 0);
    app.root.addChild(sunLight);

    // Warm Horizon Fill
    const warmFill = new pc.Entity('CityWarmAmbient');
    warmFill.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.55, 0.38, 0.22),
      intensity: 0.5
    });
    warmFill.setEulerAngles(-40, -110, 0);
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

    // 7a. Atmosphere Cycle (Autumn Golden Hour -> Midnight Neon -> Overcast Rain)
    let atmosphereMode = 0;
    function setAtmosphere(mode) {
      atmosphereMode = mode;
      if (mode === 0) {
        app.scene.ambientLight = new pc.Color(0.48, 0.40, 0.28);
        app.scene.fogColor = new pc.Color(0.68, 0.55, 0.38);
        app.scene.fogDensity = 0.0028;
        sunLight.light.color = new pc.Color(1.0, 0.85, 0.55);
        sunLight.light.intensity = 1.55;
        hud.showToast('🌅 ROCKPORT AUTUMN GOLDEN HOUR');
      } else if (mode === 1) {
        app.scene.ambientLight = new pc.Color(0.08, 0.10, 0.16);
        app.scene.fogColor = new pc.Color(0.04, 0.06, 0.10);
        app.scene.fogDensity = 0.0035;
        sunLight.light.color = new pc.Color(0.2, 0.35, 0.65);
        sunLight.light.intensity = 0.45;
        hud.showToast('🌙 MIDNIGHT NEON CITY');
      } else {
        app.scene.ambientLight = new pc.Color(0.32, 0.35, 0.40);
        app.scene.fogColor = new pc.Color(0.40, 0.45, 0.50);
        app.scene.fogDensity = 0.0042;
        sunLight.light.color = new pc.Color(0.7, 0.75, 0.8);
        sunLight.light.intensity = 0.9;
        hud.showToast('🌧️ OVERCAST WET RAIN');
      }
    }
    window.setAtmosphere = setAtmosphere;

    // Press 'N' to cycle Day / Night / Weather
    window.addEventListener('keydown', (e) => {
      if (e.key === 'n' || e.key === 'N') {
        setAtmosphere((atmosphereMode + 1) % 3);
      }
    });

    // 7b. Instantiate Mobile Touch Virtual Controller
    const mobileControls = window.MobileControlsManager ? new MobileControlsManager() : null;

    // 7c. Instantiate Civilian Traffic, Street Racing, Police Pursuit, Pursuit Breakers & Garage
    const traffic = window.TrafficManager ? new TrafficManager(app, audio) : null;
    const race = window.RaceManager ? new RaceManager(app, audio, hud) : null;
    const police = window.PoliceManager ? new PoliceManager(app, audio, hud) : null;
    const pursuitBreakers = window.PursuitBreakerManager ? new PursuitBreakerManager(app, audio, hud, police) : null;
    const garage = window.TuningGarageManager ? new TuningGarageManager(vehicle) : null;
    const blacklist = window.BlacklistRivalManager ? new BlacklistRivalManager(app, audio, hud) : null;
    const leaderboard = window.LeaderboardManager ? new LeaderboardManager() : null;

    // Global references for Leaderboard & Blacklist integrations
    window.playerVehicleInstance = vehicle;
    window.policeInstance = police;
    window.raceInstance = race;

    // 7d. Realistic Particle, Tire Smoke & Skidmark VFX System
    window.gameParticles = window.ParticleVFXSystem ? new ParticleVFXSystem(app) : null;

    // Press 'M' to toggle Pursuit Electronic Soundtrack
    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') {
        const isMusicOn = audio.toggleMusic();
        hud.showToast(`🎵 SOUNDTRACK: ${isMusicOn ? 'ENABLED' : 'MUTED'}`);
      }
    });

    // Press 'P' to trigger Police Pursuit
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'p' || e.key === 'P') && police) {
        police.triggerPursuit('HEAT 1 DISPATCH: 10-41 SUSPECT SIGHTED');
      }
    });

    // Press 'B' to trigger 1v1 Blacklist Boss Duel
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'b' || e.key === 'B') && blacklist && !blacklist.raceActive) {
        blacklist.startDuel(vehicle);
      }
    });

    // Press 'E' to trigger Checkpoint Sprint Race
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'e' || e.key === 'E') && race && race.state === 'IDLE') {
        race.startRace(vehicle);
      }
    });

    // Camera Mode Switching Listener ('C' key)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        cameraMode = (cameraMode + 1) % cameraConfigs.length;
        console.log(`🎥 Camera Switched to Mode ${cameraMode}`);
      }
    });

    // Wire up HUD callbacks
    adTracker.onImpressionVerified = (data) => {
      hud.showImpressionToast(data);
    };
    adTracker.onTelemetryUpdate = (telemetry) => {
      hud.updateTelemetry(telemetry);
    };

    // 8. START ENGINE & DRIVING SESSION (IMMEDIATE, NON-BLOCKING)
    const startOverlay = document.getElementById('start-screen-overlay');
    const startBtn = document.getElementById('start-engine-btn');

    function startDrivingSession() {
      if (startOverlay) {
        startOverlay.classList.add('fade-out');
        setTimeout(() => {
          if (startOverlay && startOverlay.parentNode) {
            startOverlay.parentNode.removeChild(startOverlay);
          }
        }, 500);
      }
      try {
        audio.init();
        audio.playPursuitAlert();
      } catch (err) {
        console.warn('Audio gesture init:', err);
      }
    }
    window.startDrivingSession = startDrivingSession;

    if (startBtn) {
      startBtn.addEventListener('click', startDrivingSession);
      startBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrivingSession();
      }, { passive: false });
    }
    window.addEventListener('keydown', startDrivingSession, { once: true });
    window.addEventListener('click', startDrivingSession, { once: true });

    // 9. MAIN ENGINE TICK LOOP (STARTS IMMEDIATELY ON FRAME 0)
    let billboards = [];
    app.on('update', (dt) => {
      const clampedDt = Math.min(dt, 0.1);
      const timeScale = window.gameTimeScale || 1.0;
      const scaledDt = clampedDt * timeScale;

      // A. Update Vehicle Physics & Audio
      vehicle.update(scaledDt, app.keyboard, audio);

      // B. Update 3rd-Person Follow Camera
      updateCamera(clampedDt, camera, vehicle, cameraConfigs[cameraMode], currentCamPos);

      // C. Update Ad Viewability Tracking Engine
      adTracker.update(scaledDt, vehicle.speedKmh);

      // C2. Update Civilian Traffic, Street Race, Police Pursuit, Breakers & Blacklist
      if (traffic) traffic.update(scaledDt, vehicle);
      if (race) race.update(scaledDt, vehicle);
      if (police) {
        police.update(scaledDt, vehicle);
        if (audio) audio.setPursuitIntensity(police.heatLevel, police.isPursuitActive);
      }
      if (pursuitBreakers) pursuitBreakers.update(scaledDt, vehicle);
      if (blacklist) blacklist.update(scaledDt, vehicle);

      // C3. Update Realistic Particles, Burnout Smoke & Asphalt Skidmarks
      if (window.gameParticles) window.gameParticles.update(scaledDt, vehicle);

      // D. Update HUD UI & Mini-Map Radar
      hud.update(vehicle, billboards, police);
    });

    // 10. Load Dynamic Billboards asynchronously in parallel (never blocks engine tick)
    loadDynamicBillboards(app, adTracker).then(bbs => {
      billboards = bbs || [];
    }).catch(err => {
      console.warn('Billboards load error:', err);
    });

    console.log('✅ NEON PURSUIT Engine Ready to Race');
  }

  // Smooth Chase Camera with Speed-FOV expansion, Drift Lag & High-Speed Camera Shake
  function updateCamera(dt, camera, vehicle, cfg, camPosTracker) {
    const carPos = vehicle.position;
    const carHeadingRad = (vehicle.heading + vehicle.driftAngle * 0.45) * pc.math.DEG_TO_RAD;

    // Calculate ideal camera position behind the car
    const behindX = carPos.x - Math.sin(carHeadingRad) * cfg.dist;
    const behindZ = carPos.z - Math.cos(carHeadingRad) * cfg.dist;
    const idealY = carPos.y + cfg.height;

    // Realistic camera shake at high speeds, during nitro boost and hard drifting
    let shakeIntensity = 0;
    if (vehicle.isNitro) shakeIntensity += 0.08;
    if (Math.abs(vehicle.speedKmh) > 200) shakeIntensity += (Math.abs(vehicle.speedKmh) - 200) * 0.0008;
    if (vehicle.isDrifting) shakeIntensity += 0.04;

    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity * 0.7;
    const shakeZ = (Math.random() - 0.5) * shakeIntensity;

    // Smooth lerp camera position
    const lerpSpeed = 8.5;
    camPosTracker.x = pc.math.lerp(camPosTracker.x, behindX + shakeX, dt * lerpSpeed);
    camPosTracker.y = pc.math.lerp(camPosTracker.y, idealY + shakeY, dt * (lerpSpeed * 1.2));
    camPosTracker.z = pc.math.lerp(camPosTracker.z, behindZ + shakeZ, dt * lerpSpeed);
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

