/**
 * NEON PURSUIT - Dynamic 3D Billboard Entity & Texture Pipeline
 * Real-world advertising billboard with structural steel gantry, catwalk,
 * floodlights, and dynamic server-driven texture loading.
 */
class BillboardEntity {
  constructor(app, config) {
    this.app = app;
    this.config = config; // { id, name, location, position, rotation, dimensions, type }
    this.root = null;
    this.screenMesh = null;
    this.material = null;
    this.texture = null;

    this.currentCampaign = null;
    this.currentImageSrc = null;

    this.initStructure();
  }

  initStructure() {
    const app = this.app;
    const cfg = this.config;

    // 1. Root Entity
    this.root = new pc.Entity('Billboard_' + cfg.id);
    this.root.setPosition(cfg.position.x, cfg.position.y, cfg.position.z);
    this.root.setEulerAngles(cfg.rotation.x, cfg.rotation.y, cfg.rotation.z);
    app.root.addChild(this.root);

    const w = cfg.dimensions.width || 16;
    const h = cfg.dimensions.height || 8;
    const depth = 0.6;

    // Steel truss material
    const steelMat = new pc.StandardMaterial();
    steelMat.diffuse = new pc.Color(0.2, 0.22, 0.25);
    steelMat.metalness = 0.85;
    steelMat.useMetalness = true;
    steelMat.shininess = 65;
    steelMat.update();

    // Dark screen border/housing material
    const frameMat = new pc.StandardMaterial();
    frameMat.diffuse = new pc.Color(0.08, 0.08, 0.1);
    frameMat.shininess = 40;
    frameMat.update();

    // Floodlight lamp material
    const lampMat = new pc.StandardMaterial();
    lampMat.emissive = new pc.Color(2.2, 2.2, 2.0);
    lampMat.update();

    // 2. Billboard Screen Material (Dynamic Ad Receiver)
    this.material = new pc.StandardMaterial();
    this.material.diffuse = new pc.Color(1, 1, 1);
    this.material.emissive = new pc.Color(0.85, 0.85, 0.85); // High visibility night & day
    this.material.shininess = 20;
    this.material.update();

    // 3. Screen Mesh Box
    this.screenMesh = new pc.Entity('AdDisplaySurface');
    this.screenMesh.addComponent('render', { type: 'box', material: this.material });
    this.screenMesh.setLocalScale(w, h, depth);
    this.screenMesh.setLocalPosition(0, 0, 0);
    this.root.addChild(this.screenMesh);

    // 4. Heavy Outer Protective Frame
    const borderThickness = 0.5;
    const frame = new pc.Entity('BillboardFrame');
    frame.addComponent('render', { type: 'box', material: frameMat });
    frame.setLocalScale(w + borderThickness * 2, h + borderThickness * 2, depth * 0.9);
    frame.setLocalPosition(0, 0, -0.05);
    this.root.addChild(frame);

    // 5. Structural Support Columns (Ground Pylons)
    // Extend from billboard height down to ground plane
    const pylonHeight = cfg.position.y;
    const colSpacing = w * 0.35;

    [-colSpacing, colSpacing].forEach((colX, idx) => {
      const pylon = new pc.Entity('SupportPylon_' + idx);
      pylon.addComponent('render', { type: 'cylinder', material: steelMat });
      pylon.setLocalScale(1.2, pylonHeight, 1.2);
      // Center of cylinder must be positioned halfway between ground (y=0 in world) and billboard
      pylon.setLocalPosition(colX, -pylonHeight / 2, -0.6);
      this.root.addChild(pylon);
    });

    // 6. Maintenance Catwalk Platform (Industrial Realism)
    const catwalk = new pc.Entity('Catwalk');
    catwalk.addComponent('render', { type: 'box', material: steelMat });
    catwalk.setLocalScale(w + 1.2, 0.25, 1.8);
    catwalk.setLocalPosition(0, -h / 2 - 0.2, 0.8);
    this.root.addChild(catwalk);

    // Safety Railing on Catwalk
    const railing = new pc.Entity('CatwalkRailing');
    railing.addComponent('render', { type: 'box', material: steelMat });
    railing.setLocalScale(w + 1.2, 1.1, 0.1);
    railing.setLocalPosition(0, -h / 2 + 0.45, 1.7);
    this.root.addChild(railing);

    // 7. Billboard Top Spotlight Fixtures
    // 4 Spotlights angled down at the front face
    const spotOffsets = [-w * 0.38, -w * 0.13, w * 0.13, w * 0.38];
    spotOffsets.forEach((sx, idx) => {
      // Bracket arm
      const bracket = new pc.Entity('LampBracket_' + idx);
      bracket.addComponent('render', { type: 'cylinder', material: steelMat });
      bracket.setLocalScale(0.12, 1.8, 0.12);
      bracket.setLocalPosition(sx, h / 2 + 0.6, 1.0);
      bracket.setLocalEulerAngles(65, 0, 0);
      this.root.addChild(bracket);

      // Lamp bulb fixture
      const bulb = new pc.Entity('LampBulb_' + idx);
      bulb.addComponent('render', { type: 'sphere', material: lampMat });
      bulb.setLocalScale(0.4, 0.4, 0.4);
      bulb.setLocalPosition(sx, h / 2 + 1.2, 1.6);
      this.root.addChild(bulb);

      // Real point light casting glow onto the billboard face
      const light = new pc.Entity('SpotLight_' + idx);
      light.addComponent('light', {
        type: 'point',
        color: new pc.Color(1.0, 0.96, 0.9),
        intensity: 0.9,
        range: 12,
        castShadows: false
      });
      light.setLocalPosition(sx, h / 2 + 0.8, 2.2);
      this.root.addChild(light);
    });

    // Load initial default placeholder ad
    this.createProceduralTexture(cfg.name, 'LOADING ADVERTISER...');
  }

  // Generate dynamic procedural canvas texture or load from URL
  loadAdImage(imageUrl, campaignData) {
    if (this.currentImageSrc === imageUrl && this.texture) {
      this.currentCampaign = campaignData;
      return;
    }

    this.currentCampaign = campaignData;
    this.currentImageSrc = imageUrl;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      this.applyImageToTexture(img);
    };

    img.onerror = () => {
      console.warn(`[Billboard ${this.config.id}] Failed to load ad: ${imageUrl}. Using fallback.`);
      this.createProceduralTexture(campaignData?.headline || 'NEON PURSUIT AD NETWORK', campaignData?.advertiser || 'SPONSOR SPOTLIGHT');
    };

    img.src = imageUrl;
  }

  // Paint image onto PlayCanvas dynamic texture
  applyImageToTexture(image) {
    const app = this.app;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Draw ad image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Create or update PlayCanvas texture
    if (this.texture) {
      this.texture.destroy();
    }

    const texture = new pc.Texture(app.graphicsDevice, {
      width: canvas.width,
      height: canvas.height,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
      magFilter: pc.FILTER_LINEAR
    });

    texture.setSource(canvas);
    this.texture = texture;

    // Apply to material
    this.material.diffuseMap = texture;
    this.material.emissiveMap = texture;
    this.material.diffuse = new pc.Color(1, 1, 1);
    this.material.emissive = new pc.Color(0.88, 0.88, 0.88);
    this.material.update();

    console.log(`[Billboard ${this.config.id}] Applied Dynamic Ad: ${this.currentCampaign?.name || 'Ad'}`);
  }

  // Fallback procedural canvas texture
  createProceduralTexture(title, subtitle) {
    const app = this.app;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Cyberpunk gradient background
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0a0a14');
    grad.addColorStop(1, '#1b1233');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing border
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 12;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Text
    ctx.fillStyle = '#00f7ff';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.fillText('// DYNAMIC IN-GAME BILLBOARD', 50, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 64px "Impact", Arial Black, sans-serif';
    ctx.fillText(title.toUpperCase().slice(0, 30), 50, 240);

    ctx.fillStyle = '#ff007f';
    ctx.font = 'bold 38px "Segoe UI", Arial, sans-serif';
    ctx.fillText(subtitle.toUpperCase(), 50, 320);

    ctx.fillStyle = '#9999aa';
    ctx.font = '22px monospace';
    ctx.fillText(`BILLBOARD ID: ${this.config.id} // PLAYCANVAS 3D ENGINE`, 50, 440);

    if (this.texture) this.texture.destroy();

    const texture = new pc.Texture(app.graphicsDevice, {
      width: canvas.width,
      height: canvas.height,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true
    });
    texture.setSource(canvas);
    this.texture = texture;

    this.material.diffuseMap = texture;
    this.material.emissiveMap = texture;
    this.material.update();
  }

  // Get world center position of billboard face
  getWorldPosition() {
    return this.root.getPosition();
  }

  // Get forward normal vector of billboard display face
  getForwardNormal() {
    return this.root.forward;
  }
}

window.BillboardEntity = BillboardEntity;

