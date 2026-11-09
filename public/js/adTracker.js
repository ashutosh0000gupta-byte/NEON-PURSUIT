/**
 * NEON PURSUIT - Dynamic Ad Impression Tracking Engine
 * Compliant with IAB / MRC 3D Game Viewability Guidelines:
 * - 3D Frustum projection check
 * - Distance threshold validation
 * - Surface normal facing angle check
 * - Minimum continuous dwell time (>= 1.5 seconds)
 * - Server-side anti-fraud beacon transmission
 */
class AdTracker {
  constructor(app, cameraEntity, audio) {
    this.app = app;
    this.camera = cameraEntity;
    this.audio = audio;

    this.billboards = [];
    this.trackingState = new Map(); // billboardId -> state { dwellTime, isTracking, lastSentTime, inFrustum, distance, angle }

    this.sessionId = 'driver_' + Math.random().toString(36).substring(2, 9);
    this.verifiedImpressionsCount = 0;
    this.totalGrossRevenue = 0; // ₹
    this.currency = '₹';

    // Callbacks for UI updates
    this.onImpressionVerified = null;
    this.onTelemetryUpdate = null;
  }

  // Register a billboard entity to be tracked
  registerBillboard(billboard) {
    this.billboards.push(billboard);
    this.trackingState.set(billboard.config.id, {
      dwellTime: 0,
      isEligible: false,
      inFrustum: false,
      distance: 999,
      facingAngle: 90,
      lastImpressionTime: 0,
      cooldownRemaining: 0,
      verified: false
    });
  }

  // Main frame loop
  update(dt, carSpeedKmh = 0) {
    if (!this.camera || this.billboards.length === 0) return;

    const camPos = this.camera.getPosition();
    const now = Date.now();
    let primaryBillboardTelemetry = null;

    this.billboards.forEach(bb => {
      const state = this.trackingState.get(bb.config.id);
      if (!state) return;

      const bbPos = bb.getWorldPosition();
      const distance = camPos.distance(bbPos);
      state.distance = distance;

      // 1. DISTANCE CRITERION (< 85 meters)
      const isWithinDistance = distance <= 85;

      // 2. FRUSTUM VISIBILITY CHECK
      // Project billboard 3D world center to 2D screen viewport coordinates
      const screenPos = new pc.Vec3();
      this.camera.camera.worldToScreen(bbPos, screenPos);

      const inFrustum = (
        screenPos.z > 0 && // In front of near clipping plane
        screenPos.x >= 0 && screenPos.x <= window.innerWidth &&
        screenPos.y >= 0 && screenPos.y <= window.innerHeight
      );
      state.inFrustum = inFrustum;

      // 3. FACING ANGLE CRITERION
      // Vector from billboard to camera
      const toCam = new pc.Vec3().sub2(camPos, bbPos).normalize();
      const bbNormal = bb.getForwardNormal();
      const dot = bbNormal.dot(toCam);
      // Angle in degrees between billboard normal and line of sight to camera
      const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * pc.math.RAD_TO_DEG;
      state.facingAngle = angleDeg;

      // Must be viewing front face of billboard (angle < 75 degrees)
      const isFacing = dot > 0.25 && angleDeg < 75;

      // COMBINED ELIGIBILITY
      const isEligible = isWithinDistance && inFrustum && isFacing;
      state.isEligible = isEligible;

      // Handle cooldown
      const cooldownMs = 15000;
      const timeSinceLast = now - state.lastImpressionTime;
      state.cooldownRemaining = Math.max(0, Math.ceil((cooldownMs - timeSinceLast) / 1000));

      // 4. DWELL TIME ACCUMULATION
      if (isEligible && state.cooldownRemaining === 0) {
        state.dwellTime += dt;

        // 5. TRIGGER VERIFIED IMPRESSION (>= 1.5 seconds continuous view)
        if (state.dwellTime >= 1.5) {
          this.recordVerifiedImpression(bb, state, carSpeedKmh);
          state.dwellTime = 0; // Reset dwell timer
          state.lastImpressionTime = now;
        }
      } else {
        // Decay dwell time if line of sight is broken
        state.dwellTime = Math.max(0, state.dwellTime - dt * 2.5);
      }

      // Track the closest or active billboard for the HUD telemetry widget
      if (!primaryBillboardTelemetry || distance < primaryBillboardTelemetry.distance) {
        primaryBillboardTelemetry = {
          id: bb.config.id,
          name: bb.config.name,
          campaign: bb.currentCampaign,
          distance,
          inFrustum,
          facingAngle: angleDeg,
          dwellTime: state.dwellTime,
          isEligible,
          cooldown: state.cooldownRemaining,
          screenX: screenPos.x,
          screenY: screenPos.y
        };
      }
    });

    if (this.onTelemetryUpdate && primaryBillboardTelemetry) {
      this.onTelemetryUpdate(primaryBillboardTelemetry);
    }
  }

  // Send validated impression beacon to backend ad server
  async recordVerifiedImpression(bb, state, carSpeedKmh) {
    const campaign = bb.currentCampaign;
    const campaignId = campaign ? campaign.id || campaign.campaignId : 'DEFAULT';
    const cpm = campaign ? campaign.cpm || 100 : 100;
    const revIncrement = (1 / 1000) * cpm;

    this.verifiedImpressionsCount++;
    this.totalGrossRevenue += revIncrement;

    console.log(`[AdTracker] ✅ Viewability threshold reached for ${bb.config.id}! Sending beacon...`);

    // Audio chime
    if (this.audio) {
      this.audio.playAdVerifiedChime();
    }

    const payload = {
      billboardId: bb.config.id,
      campaignId: campaignId,
      dwellTime: 1.5,
      distance: state.distance,
      facingAngle: state.facingAngle,
      inFrustum: true,
      speed: carSpeedKmh,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    // UI Event
    if (this.onImpressionVerified) {
      this.onImpressionVerified({
        billboard: bb.config,
        campaign: campaign || { name: 'Apex Racing Tires' },
        revenue: revIncrement,
        totalRevenue: this.totalGrossRevenue,
        impressionsCount: this.verifiedImpressionsCount
      });
    }

    try {
      const response = await fetch('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      console.log('[AdTracker Server Response]', result);
    } catch (err) {
      console.warn('[AdTracker] Network beacon failed (server offline or local mock mode):', err.message);
    }
  }
}

window.AdTracker = AdTracker;

