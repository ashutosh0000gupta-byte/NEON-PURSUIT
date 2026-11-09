/**
 * NEON PURSUIT - 3D Sports Car Vehicle Entity & Arcade Physics Controller
 * Inspired by Need for Speed: Most Wanted (2005)
 */
class Vehicle {
  constructor(app) {
    this.app = app;
    this.root = null;
    this.chassis = null;
    this.wheels = [];
    this.headlights = [];
    this.taillights = [];
    this.exhausts = [];

    // Physics & State Parameters
    this.position = new pc.Vec3(0, 0.45, 0);
    this.rotation = new pc.Vec3(0, 0, 0); // Yaw, Pitch, Roll in degrees
    this.velocity = new pc.Vec3(0, 0, 0); // World velocity vector
    this.speed = 0;       // Scalar speed in m/s
    this.speedKmh = 0;    // Speed in km/h
    this.heading = 0;     // Heading angle (degrees around Y)

    // Drivetrain & Engine
    this.throttle = 0;
    this.brake = 0;
    this.steerInput = 0;
    this.steeringAngle = 0; // Current front wheel angle in degrees
    this.maxSteeringAngle = 32;

    this.gear = 1;
    this.rpm = 900;       // Idle RPM
    this.maxRpm = 8500;
    this.gearRatios = [3.8, 2.9, 2.1, 1.5, 1.15, 0.88];
    this.gearMaxSpeeds = [45, 85, 135, 185, 230, 275]; // km/h per gear

    // Handling & Drift
    this.isDrifting = false;
    this.driftAngle = 0;
    this.driftScore = 0;
    this.isBraking = false;
    this.isReversing = false;
    this.isNitro = false;
    this.nitroFuel = 100; // 0 to 100

    // Suspension dynamics (body roll and pitch)
    this.bodyRoll = 0;
    this.bodyPitch = 0;

    // Materials
    this.materials = {};

    this.initVehicleMesh();
  }

  initVehicleMesh() {
    const app = this.app;

    // 1. Root Entity
    this.root = new pc.Entity('PlayerCar');
    this.root.setPosition(this.position);
    app.root.addChild(this.root);

    // --- MATERIALS ---
    // Metallic Silver/Cobalt Blue NFS MW Hero paint
    const carPaintMat = new pc.StandardMaterial();
    carPaintMat.diffuse = new pc.Color(0.08, 0.25, 0.65); // Iconic Cobalt Blue
    carPaintMat.specular = new pc.Color(0.9, 0.95, 1.0);
    carPaintMat.shininess = 95;
    carPaintMat.metalness = 0.85;
    carPaintMat.useMetalness = true;
    carPaintMat.update();
    this.materials.paint = carPaintMat;

    // Matte Carbon Fiber for splitters & spoiler
    const carbonMat = new pc.StandardMaterial();
    carbonMat.diffuse = new pc.Color(0.05, 0.05, 0.06);
    carbonMat.specular = new pc.Color(0.3, 0.3, 0.3);
    carbonMat.shininess = 60;
    carbonMat.update();
    this.materials.carbon = carbonMat;

    // Dark Tinted Glass
    const glassMat = new pc.StandardMaterial();
    glassMat.diffuse = new pc.Color(0.02, 0.04, 0.08);
    glassMat.specular = new pc.Color(1, 1, 1);
    glassMat.shininess = 100;
    glassMat.opacity = 0.85;
    glassMat.blendType = pc.BLEND_NORMAL;
    glassMat.update();
    this.materials.glass = glassMat;

    // Headlight LED material (glowing white-blue)
    const headlightMat = new pc.StandardMaterial();
    headlightMat.diffuse = new pc.Color(0.9, 0.95, 1.0);
    headlightMat.emissive = new pc.Color(1.2, 1.5, 2.0);
    headlightMat.shininess = 100;
    headlightMat.update();
    this.materials.headlight = headlightMat;

    // Taillight LED material (normal red / high-intensity brake red)
    const taillightMat = new pc.StandardMaterial();
    taillightMat.diffuse = new pc.Color(0.8, 0.05, 0.05);
    taillightMat.emissive = new pc.Color(0.8, 0.02, 0.02);
    taillightMat.update();
    this.materials.taillight = taillightMat;

    // Rubber tire material
    const tireMat = new pc.StandardMaterial();
    tireMat.diffuse = new pc.Color(0.08, 0.08, 0.09);
    tireMat.shininess = 20;
    tireMat.update();
    this.materials.tire = tireMat;

    // Rim Chrome material
    const rimMat = new pc.StandardMaterial();
    rimMat.diffuse = new pc.Color(0.85, 0.85, 0.9);
    rimMat.specular = new pc.Color(1, 1, 1);
    rimMat.metalness = 0.95;
    rimMat.useMetalness = true;
    rimMat.shininess = 90;
    rimMat.update();
    this.materials.rim = rimMat;

    // 2. Chassis Pivot (handles suspension roll & pitch independently)
    this.chassis = new pc.Entity('ChassisPivot');
    this.root.addChild(this.chassis);

    // --- BODY PARTS ---
    // A. Lower Hull / Undertray
    const lowerHull = new pc.Entity('LowerHull');
    lowerHull.addComponent('render', { type: 'box', material: carPaintMat });
    lowerHull.setLocalScale(1.85, 0.35, 4.3);
    lowerHull.setLocalPosition(0, 0.32, 0);
    this.chassis.addChild(lowerHull);

    // B. Main Cabin / Cockpit Roof (sloped sports coupe profile)
    const cabin = new pc.Entity('Cabin');
    cabin.addComponent('render', { type: 'box', material: glassMat });
    cabin.setLocalScale(1.42, 0.52, 2.1);
    cabin.setLocalPosition(0, 0.72, -0.2);
    this.chassis.addChild(cabin);

    // C. Roof Cap
    const roof = new pc.Entity('RoofCap');
    roof.addComponent('render', { type: 'box', material: carPaintMat });
    roof.setLocalScale(1.36, 0.12, 1.8);
    roof.setLocalPosition(0, 0.98, -0.2);
    this.chassis.addChild(roof);

    // D. Front Hood / Engine Bay (slanted forward)
    const hood = new pc.Entity('Hood');
    hood.addComponent('render', { type: 'box', material: carPaintMat });
    hood.setLocalScale(1.72, 0.22, 1.4);
    hood.setLocalPosition(0, 0.44, 1.35);
    hood.setLocalEulerAngles(-4, 0, 0);
    this.chassis.addChild(hood);

    // E. Front Splitter (Carbon Fiber)
    const splitter = new pc.Entity('FrontSplitter');
    splitter.addComponent('render', { type: 'box', material: carbonMat });
    splitter.setLocalScale(1.92, 0.08, 0.6);
    splitter.setLocalPosition(0, 0.16, 2.2);
    this.chassis.addChild(splitter);

    // F. Rear Trunk & Diffuser
    const trunk = new pc.Entity('Trunk');
    trunk.addComponent('render', { type: 'box', material: carPaintMat });
    trunk.setLocalScale(1.68, 0.32, 0.95);
    trunk.setLocalPosition(0, 0.46, -1.55);
    this.chassis.addChild(trunk);

    const diffuser = new pc.Entity('RearDiffuser');
    diffuser.addComponent('render', { type: 'box', material: carbonMat });
    diffuser.setLocalScale(1.86, 0.15, 0.5);
    diffuser.setLocalPosition(0, 0.18, -2.15);
    this.chassis.addChild(diffuser);

    // G. Rear GT Wing / Spoiler (Most Wanted iconic element)
    const wingBlade = new pc.Entity('WingBlade');
    wingBlade.addComponent('render', { type: 'box', material: carbonMat });
    wingBlade.setLocalScale(1.88, 0.06, 0.35);
    wingBlade.setLocalPosition(0, 0.92, -2.05);
    this.chassis.addChild(wingBlade);

    // Wing Struts
    const strutLeft = new pc.Entity('StrutLeft');
    strutLeft.addComponent('render', { type: 'box', material: carbonMat });
    strutLeft.setLocalScale(0.05, 0.35, 0.15);
    strutLeft.setLocalPosition(-0.55, 0.75, -2.0);
    this.chassis.addChild(strutLeft);

    const strutRight = new pc.Entity('StrutRight');
    strutRight.addComponent('render', { type: 'box', material: carbonMat });
    strutRight.setLocalScale(0.05, 0.35, 0.15);
    strutRight.setLocalPosition(0.55, 0.75, -2.0);
    this.chassis.addChild(strutRight);

    // H. Quad Titanium Exhausts
    const exhaustOffsets = [-0.48, -0.36, 0.36, 0.48];
    exhaustOffsets.forEach((ox, idx) => {
      const ex = new pc.Entity('Exhaust_' + idx);
      ex.addComponent('render', { type: 'cylinder', material: rimMat });
      ex.setLocalScale(0.08, 0.25, 0.08);
      ex.setLocalPosition(ox, 0.22, -2.25);
      ex.setLocalEulerAngles(90, 0, 0);
      this.chassis.addChild(ex);
      this.exhausts.push(ex);
    });

    // I. Headlight Meshes & Projector Spotlights
    [-0.65, 0.65].forEach((hx, idx) => {
      // Physical glass lens
      const lens = new pc.Entity('HeadlightLens_' + idx);
      lens.addComponent('render', { type: 'box', material: headlightMat });
      lens.setLocalScale(0.32, 0.12, 0.15);
      lens.setLocalPosition(hx, 0.38, 2.12);
      this.chassis.addChild(lens);

      // Actual light source projecting forward on the road
      const light = new pc.Entity('HeadlightBeam_' + idx);
      light.addComponent('light', {
        type: 'spot',
        color: new pc.Color(0.9, 0.95, 1.0),
        intensity: 2.5,
        range: 45,
        innerConeAngle: 25,
        outerConeAngle: 45,
        castShadows: false
      });
      light.setLocalPosition(hx, 0.38, 2.15);
      light.setLocalEulerAngles(-8, 0, 0); // Aimed down slightly onto asphalt
      this.chassis.addChild(light);
      this.headlights.push(light);
    });

    // J. Taillight Meshes
    [-0.65, 0.65].forEach((tx, idx) => {
      const tail = new pc.Entity('TaillightLens_' + idx);
      tail.addComponent('render', { type: 'box', material: taillightMat });
      tail.setLocalScale(0.38, 0.14, 0.12);
      tail.setLocalPosition(tx, 0.42, -2.18);
      this.chassis.addChild(tail);
      this.taillights.push(tail);
    });

    // --- 3. 3D WHEELS & SUSPENSION HUBS ---
    // Wheel coordinates: Front-Left, Front-Right, Rear-Left, Rear-Right
    const wheelConfigs = [
      { name: 'FL', isFront: true, isLeft: true,  x: -0.92, y: 0.35, z: 1.35 },
      { name: 'FR', isFront: true, isLeft: false, x:  0.92, y: 0.35, z: 1.35 },
      { name: 'RL', isFront: false, isLeft: true,  x: -0.92, y: 0.36, z: -1.35 },
      { name: 'RR', isFront: false, isLeft: false, x:  0.92, y: 0.36, z: -1.35 }
    ];

    wheelConfigs.forEach(cfg => {
      // Hub entity (steers)
      const hub = new pc.Entity('WheelHub_' + cfg.name);
      hub.setLocalPosition(cfg.x, cfg.y, cfg.z);
      this.root.addChild(hub);

      // Spinner entity (rotates around X axis as car rolls forward)
      const spinner = new pc.Entity('WheelSpinner_' + cfg.name);
      hub.addChild(spinner);

      // Rubber Tire cylinder
      const tire = new pc.Entity('Tire_' + cfg.name);
      tire.addComponent('render', { type: 'cylinder', material: tireMat });
      tire.setLocalScale(0.68, 0.28, 0.68);
      tire.setLocalEulerAngles(0, 0, 90); // Align cylinder axis along X
      spinner.addChild(tire);

      // Alloy Rim
      const rim = new pc.Entity('Rim_' + cfg.name);
      rim.addComponent('render', { type: 'cylinder', material: rimMat });
      rim.setLocalScale(0.48, 0.30, 0.48);
      rim.setLocalEulerAngles(0, 0, 90);
      spinner.addChild(rim);

      this.wheels.push({
        hub,
        spinner,
        isFront: cfg.isFront,
        isLeft: cfg.isLeft,
        spinAngle: 0
      });
    });

    console.log('🏎️ Sports Car Entity & Systems Built');
  }

  // Handle frame physics update
  update(dt, keyboard, audio) {
    if (!this.root) return;

    // 1. GATHER INPUTS
    let forwardInput = 0;
    let turnInput = 0;
    let handbrake = false;
    let nitroInput = false;

    // Keyboard support: Arrow keys and WASD
    if (keyboard.isPressed(pc.KEY_UP) || keyboard.isPressed(pc.KEY_W)) forwardInput += 1;
    if (keyboard.isPressed(pc.KEY_DOWN) || keyboard.isPressed(pc.KEY_S)) forwardInput -= 1;
    if (keyboard.isPressed(pc.KEY_LEFT) || keyboard.isPressed(pc.KEY_A)) turnInput -= 1;
    if (keyboard.isPressed(pc.KEY_RIGHT) || keyboard.isPressed(pc.KEY_D)) turnInput += 1;
    if (keyboard.isPressed(pc.KEY_SPACE)) handbrake = true;
    if (keyboard.isPressed(pc.KEY_SHIFT)) nitroInput = true;

    // Vehicle Reset on 'R'
    if (keyboard.wasPressed(pc.KEY_R)) {
      this.resetPosition();
      return;
    }

    this.throttle = Math.max(0, forwardInput);
    this.brake = Math.max(0, -forwardInput);
    this.steerInput = turnInput;

    // 2. NITRO BOOST
    this.isNitro = nitroInput && this.nitroFuel > 0 && this.speedKmh > 10;
    if (this.isNitro) {
      this.nitroFuel = Math.max(0, this.nitroFuel - dt * 25);
    } else {
      // Regenerate nitro slowly
      this.nitroFuel = Math.min(100, this.nitroFuel + dt * 6);
    }

    // 3. SPEED-DEPENDENT STEERING
    // Speed sensitivity: tight turning at low speeds, stable at high speeds
    const speedRatio = Math.min(1, Math.abs(this.speedKmh) / 180);
    const targetSteerAngle = turnInput * (this.maxSteeringAngle * (1 - speedRatio * 0.55));
    this.steeringAngle = pc.math.lerp(this.steeringAngle, targetSteerAngle, dt * 10);

    // 4. ACCELERATION & DRIVETRAIN
    const maxTopSpeed = 260; // km/h
    const currentSpeedKmh = this.speed * 3.6;
    this.speedKmh = currentSpeedKmh;

    // Automatic Gearbox calculations
    for (let i = 0; i < this.gearMaxSpeeds.length; i++) {
      if (Math.abs(currentSpeedKmh) <= this.gearMaxSpeeds[i] || i === this.gearMaxSpeeds.length - 1) {
        if (this.gear !== i + 1 && Math.abs(currentSpeedKmh) > 15) {
          // Play turbo blow-off on upshift
          if (audio && i + 1 > this.gear) audio.playTurboBlowOff();
        }
        this.gear = i + 1;
        break;
      }
    }

    // Calculate RPM for audio & HUD
    const gearMinSpeed = this.gear === 1 ? 0 : this.gearMaxSpeeds[this.gear - 2];
    const gearMaxSpeed = this.gearMaxSpeeds[this.gear - 1];
    const gearProgress = Math.max(0, Math.min(1, (Math.abs(currentSpeedKmh) - gearMinSpeed) / (gearMaxSpeed - gearMinSpeed + 0.1)));
    this.rpm = 900 + gearProgress * 7200;

    // Acceleration force
    let accelForce = 0;
    if (this.throttle > 0) {
      // Higher torque in lower gears
      const gearTorqueMultiplier = [1.8, 1.45, 1.15, 0.9, 0.72, 0.58][this.gear - 1];
      let baseAccel = 18.0 * gearTorqueMultiplier;
      if (this.isNitro) baseAccel *= 1.6;

      // Drop off near top speed
      const topSpeedFactor = Math.max(0, 1 - (Math.abs(currentSpeedKmh) / maxTopSpeed));
      accelForce = baseAccel * topSpeedFactor;
    }

    // Braking force
    let brakeForce = 0;
    this.isBraking = false;
    this.isReversing = false;

    if (this.brake > 0) {
      if (this.speed > 0.5) {
        // Active braking
        brakeForce = 28.0;
        this.isBraking = true;
      } else {
        // Reverse gear
        accelForce = -9.0;
        this.gear = 'R';
        this.isReversing = true;
      }
    }

    // Handbrake
    if (handbrake) {
      brakeForce += 35.0;
      this.isBraking = true;
    }

    // Rolling friction & Aerodynamic drag
    const rollingResistance = 1.2;
    const aeroDrag = 0.0014 * (this.speed * this.speed);
    const naturalDecel = rollingResistance + aeroDrag;

    // Update forward speed scalar
    if (this.speed > 0) {
      this.speed += (accelForce - brakeForce - naturalDecel) * dt;
      if (this.speed < 0 && !this.isReversing) this.speed = 0;
    } else if (this.speed < 0) {
      this.speed += (accelForce + brakeForce + naturalDecel) * dt;
      if (this.speed > 0 && this.isReversing) this.speed = 0;
    } else {
      this.speed += accelForce * dt;
    }

    // 5. DRIFT MECHANICS & LATERAL SLIP
    const driftTrigger = handbrake || (Math.abs(this.steeringAngle) > 18 && Math.abs(currentSpeedKmh) > 55);
    if (driftTrigger && Math.abs(currentSpeedKmh) > 25) {
      this.isDrifting = true;
      this.driftAngle = pc.math.lerp(this.driftAngle, -turnInput * 38, dt * 6);
      this.driftScore += Math.floor(Math.abs(currentSpeedKmh) * dt * 8);
    } else {
      this.isDrifting = false;
      this.driftAngle = pc.math.lerp(this.driftAngle, 0, dt * 8);
    }

    // Heading update
    const turnRate = (this.speed / 4.2) * Math.tan(this.steeringAngle * pc.math.DEG_TO_RAD);
    this.heading += turnRate * pc.math.RAD_TO_DEG * dt;

    // 6. WORLD VELOCITY & POSITION INTEGRATION
    const effectiveHeadingRad = (this.heading + this.driftAngle) * pc.math.DEG_TO_RAD;
    const forwardX = Math.sin(effectiveHeadingRad);
    const forwardZ = Math.cos(effectiveHeadingRad);

    this.position.x += forwardX * this.speed * dt;
    this.position.z += forwardZ * this.speed * dt;

    // Keep car grounded on road plane
    this.position.y = 0.42;

    // City Boundary constraint (soft elastic bounce to prevent driving off world)
    const mapBounds = 185;
    if (Math.abs(this.position.x) > mapBounds) {
      this.position.x = Math.sign(this.position.x) * mapBounds;
      this.speed *= -0.4;
    }
    if (Math.abs(this.position.z) > mapBounds) {
      this.position.z = Math.sign(this.position.z) * mapBounds;
      this.speed *= -0.4;
    }

    // Apply Root Transformation
    this.root.setPosition(this.position);
    this.root.setEulerAngles(0, this.heading + this.driftAngle, 0);

    // 7. SUSPENSION CHASSIS ROLL & PITCH
    const targetRoll = -turnInput * (Math.abs(this.speedKmh) / 100) * 4.5;
    const targetPitch = (accelForce > 0 ? -1.8 : 0) + (this.isBraking ? 2.8 : 0);

    this.bodyRoll = pc.math.lerp(this.bodyRoll, targetRoll, dt * 7);
    this.bodyPitch = pc.math.lerp(this.bodyPitch, targetPitch, dt * 8);
    this.chassis.setLocalEulerAngles(this.bodyPitch, 0, this.bodyRoll);

    // 8. UPDATE WHEEL ROTATION & STEERING
    const wheelCircumference = 0.68 * Math.PI; // meters
    const spinDelta = (this.speed / wheelCircumference) * 360 * dt;

    this.wheels.forEach(w => {
      // Steer front wheels
      if (w.isFront) {
        w.hub.setLocalEulerAngles(0, this.steeringAngle, 0);
      }
      // Spin all wheels
      w.spinAngle = (w.spinAngle + spinDelta) % 360;
      w.spinner.setLocalEulerAngles(w.spinAngle, 0, 0);
    });

    // 9. TAILLIGHT INTENSITY
    const tailEmissive = this.isBraking || this.isReversing
      ? new pc.Color(2.2, 0.1, 0.1) // Bright red glow
      : new pc.Color(0.6, 0.03, 0.03); // Normal red
    this.materials.taillight.emissive = tailEmissive;
    this.materials.taillight.update();

    // 10. UPDATE AUDIO ENGINE
    if (audio) {
      const rpmRatio = Math.max(0, Math.min(1, (this.rpm - 900) / (this.maxRpm - 900)));
      audio.update(rpmRatio, this.throttle, this.isDrifting, this.isBraking, this.isNitro);
    }
  }

  // Reset vehicle to center road origin if flipped or stuck
  resetPosition() {
    this.position.set(0, 0.42, -20);
    this.velocity.set(0, 0, 0);
    this.speed = 0;
    this.heading = 0;
    this.steeringAngle = 0;
    this.driftAngle = 0;
    this.root.setPosition(this.position);
    this.root.setEulerAngles(0, 0, 0);
    this.chassis.setLocalEulerAngles(0, 0, 0);
    console.log('🔄 Vehicle Reset to Starting Grid');
  }
}

window.Vehicle = Vehicle;

