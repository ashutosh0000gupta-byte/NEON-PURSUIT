const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');
const IMPRESSIONS_FILE = path.join(DATA_DIR, 'impressions.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Helper to load JSON safely
function loadData(filePath, defaultData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

// Helper to save JSON safely
function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// In-memory cooldown tracker to prevent duplicate impressions
// Map of `${billboardId}_${sessionId}` -> timestamp of last recorded impression
const recentImpressionsCooldown = new Map();
const COOLDOWN_MS = 15000; // 15 seconds cooldown between impressions for the same billboard per player

// --- REST API ENDPOINTS ---

// 1. Health check & status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    game: 'NEON PURSUIT - 3D Open World Racing',
    engine: 'PlayCanvas',
    adServer: 'Active v1.0',
    timestamp: new Date().toISOString()
  });
});

// 2. Get Billboard Inventory
app.get('/api/ads/billboards', (req, res) => {
  const data = loadData(CAMPAIGNS_FILE, { billboards: [], campaigns: [] });
  res.json(data.billboards);
});

// 3. Get Active Campaigns mapped to billboards
app.get('/api/ads/active', (req, res) => {
  const data = loadData(CAMPAIGNS_FILE, { billboards: [], campaigns: [] });
  
  // Build a map of billboardId -> active campaign
  const activeAds = {};
  data.billboards.forEach(bb => {
    // Find active campaign assigned to this billboard
    const campaign = data.campaigns.find(c => c.billboardId === bb.id && c.status === 'active');
    if (campaign) {
      activeAds[bb.id] = {
        billboardId: bb.id,
        campaignId: campaign.id,
        name: campaign.name,
        advertiser: campaign.advertiser,
        image: campaign.image,
        headline: campaign.headline,
        cpm: campaign.cpm
      };
    } else {
      activeAds[bb.id] = {
        billboardId: bb.id,
        campaignId: 'DEFAULT',
        name: 'Default In-Game Ad Placement',
        advertiser: 'Neon Pursuit Network',
        image: '/assets/ads/default_ad.svg',
        headline: 'YOUR BRAND HERE',
        cpm: 0
      };
    }
  });

  res.json({
    success: true,
    billboards: data.billboards,
    activeAds
  });
});

// 4. Record & Validate Advertising Impression
app.post('/api/ads/impression', (req, res) => {
  const {
    billboardId,
    campaignId,
    dwellTime,      // seconds visible in camera view
    distance,       // meters from vehicle
    facingAngle,    // degrees off billboard normal
    inFrustum,      // frustum check boolean
    sessionId = 'guest-driver',
    speed = 0
  } = req.body;

  const now = Date.now();
  const data = loadData(CAMPAIGNS_FILE, { billboards: [], campaigns: [] });
  const campaign = data.campaigns.find(c => c.id === campaignId) || {
    id: 'DEFAULT',
    name: 'Default Ad',
    advertiser: 'Neon Pursuit',
    cpm: 100.0,
    impressions: 0,
    spent: 0
  };

  // --- SERVER-SIDE ANTI-FRAUD VALIDATION ---
  let isValid = true;
  const validationErrors = [];

  // Criterion 1: Must be in camera frustum
  if (!inFrustum) {
    isValid = false;
    validationErrors.push('Not within camera viewport');
  }

  // Criterion 2: Must be within realistic view distance (< 90m)
  if (typeof distance !== 'number' || distance > 90 || distance < 0) {
    isValid = false;
    validationErrors.push(`Distance out of range: ${distance?.toFixed(1)}m`);
  }

  // Criterion 3: Must meet minimum dwell time (>= 1.5 seconds)
  if (typeof dwellTime !== 'number' || dwellTime < 1.45) {
    isValid = false;
    validationErrors.push(`Insufficient dwell time: ${dwellTime?.toFixed(2)}s (min 1.5s required)`);
  }

  // Criterion 4: Facing angle check (cannot be viewing billboard backface, angle must be < 80 deg)
  if (typeof facingAngle === 'number' && Math.abs(facingAngle) > 80) {
    isValid = false;
    validationErrors.push(`Oblique/obstructed viewing angle: ${facingAngle.toFixed(1)}°`);
  }

  // Criterion 5: Anti-fraud deduplication cooldown
  const cooldownKey = `${billboardId}_${sessionId}`;
  const lastRecorded = recentImpressionsCooldown.get(cooldownKey);
  if (lastRecorded && (now - lastRecorded) < COOLDOWN_MS) {
    const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastRecorded)) / 1000);
    isValid = false;
    validationErrors.push(`Cooldown active for ${billboardId} (${remainingSec}s remaining)`);
  }

  // Calculate gross revenue using official formula: Revenue = (Impressions / 1000) * CPM
  const singleImpressionRevenue = (1 / 1000) * (campaign.cpm || 100);

  const impressionRecord = {
    id: 'IMP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    billboardId,
    campaignId,
    campaignName: campaign.name,
    advertiser: campaign.advertiser,
    cpm: campaign.cpm || 100,
    revenueEarned: isValid ? singleImpressionRevenue : 0,
    dwellTime: Number(dwellTime?.toFixed(2) || 0),
    distance: Number(distance?.toFixed(1) || 0),
    facingAngle: Number(facingAngle?.toFixed(1) || 0),
    speed: Number(speed?.toFixed(1) || 0),
    sessionId,
    valid: isValid,
    reason: isValid ? 'PASSED_ALL_CRITERIA' : validationErrors.join(', '),
    timestamp: new Date().toISOString()
  };

  // Record impression in storage
  const impData = loadData(IMPRESSIONS_FILE, { impressions: [] });
  impData.impressions.push(impressionRecord);
  
  // Keep last 1000 impressions to prevent unlimited growth
  if (impData.impressions.length > 1000) {
    impData.impressions = impData.impressions.slice(-1000);
  }
  saveData(IMPRESSIONS_FILE, impData);

  if (isValid) {
    // Set cooldown
    recentImpressionsCooldown.set(cooldownKey, now);

    // Update campaign metrics
    if (campaign && campaign.id !== 'DEFAULT') {
      campaign.impressions = (campaign.impressions || 0) + 1;
      campaign.spent = (campaign.spent || 0) + singleImpressionRevenue;
      saveData(CAMPAIGNS_FILE, data);
    }

    console.log(`[AD-VERIFIED] Billboard ${billboardId} | Campaign: ${campaign.name} | Rev: ₹${singleImpressionRevenue.toFixed(3)} | Dwell: ${dwellTime}s`);
    
    return res.json({
      success: true,
      verified: true,
      impression: impressionRecord,
      message: 'Valid impression recorded and credited.'
    });
  } else {
    console.log(`[AD-REJECTED] Billboard ${billboardId} | Reason: ${impressionRecord.reason}`);
    return res.status(200).json({
      success: false,
      verified: false,
      impression: impressionRecord,
      message: 'Impression rejected by verification engine.',
      reasons: validationErrors
    });
  }
});

// 5. Admin Analytics Endpoint
app.get('/api/admin/analytics', (req, res) => {
  const campData = loadData(CAMPAIGNS_FILE, { billboards: [], campaigns: [] });
  const impData = loadData(IMPRESSIONS_FILE, { impressions: [] });

  const totalImpressions = impData.impressions.length;
  const validImpressions = impData.impressions.filter(i => i.valid).length;
  const rejectedImpressions = totalImpressions - validImpressions;

  // Calculate total gross revenue
  const totalRevenue = impData.impressions
    .filter(i => i.valid)
    .reduce((sum, i) => sum + (i.revenueEarned || 0), 0);

  // Billboard specific breakdown
  const billboardStats = campData.billboards.map(bb => {
    const bbImps = impData.impressions.filter(i => i.billboardId === bb.id);
    const valid = bbImps.filter(i => i.valid).length;
    const rev = bbImps.filter(i => i.valid).reduce((s, i) => s + (i.revenueEarned || 0), 0);
    const activeCamp = campData.campaigns.find(c => c.billboardId === bb.id && c.status === 'active');

    return {
      id: bb.id,
      name: bb.name,
      location: bb.location,
      activeCampaign: activeCamp ? activeCamp.name : 'Default Ad',
      advertiser: activeCamp ? activeCamp.advertiser : 'Network',
      cpm: activeCamp ? activeCamp.cpm : 0,
      image: activeCamp ? activeCamp.image : '/assets/ads/default_ad.svg',
      totalImpressions: bbImps.length,
      validImpressions: valid,
      revenueGenerated: Number(rev.toFixed(2))
    };
  });

  // Recent 25 impressions (most recent first)
  const recentImpressions = [...impData.impressions].reverse().slice(0, 25);

  res.json({
    success: true,
    metrics: {
      totalImpressions,
      validImpressions,
      rejectedImpressions,
      verificationRate: totalImpressions > 0 ? Number(((validImpressions / totalImpressions) * 100).toFixed(1)) : 100,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      currency: 'INR (₹)',
      activeCampaignsCount: campData.campaigns.filter(c => c.status === 'active').length,
      totalBillboards: campData.billboards.length
    },
    billboardStats,
    recentImpressions,
    campaigns: campData.campaigns
  });
});

// 6. Admin: Switch campaign assigned to billboard
app.post('/api/admin/campaigns/switch', (req, res) => {
  const { billboardId, campaignId } = req.body;
  const data = loadData(CAMPAIGNS_FILE, { billboards: [], campaigns: [] });

  const campaign = data.campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // Deactivate existing campaign on this billboard
  data.campaigns.forEach(c => {
    if (c.billboardId === billboardId && c.id !== campaignId) {
      c.status = 'paused';
    }
  });

  campaign.billboardId = billboardId;
  campaign.status = 'active';

  saveData(CAMPAIGNS_FILE, data);
  res.json({ success: true, message: `Billboard ${billboardId} updated to campaign ${campaign.name}` });
});

// 6b. Admin: Create New Advertising Campaign (Direct Advertisers)
app.post('/api/admin/campaigns/create', (req, res) => {
  const {
    name,
    advertiser,
    billboardId,
    image,
    headline = 'PREMIUM MOTORSPORT BRAND',
    cpm = 120.0,
    budget = 50000
  } = req.body;

  if (!name || !advertiser || !billboardId) {
    return res.status(400).json({ error: 'Missing required campaign parameters' });
  }

  const data = loadData(CAMPAIGNS_FILE, { billboards: [], campaigns: [] });
  const campaignId = 'CAMP-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  // Deactivate existing campaign on this billboard
  data.campaigns.forEach(c => {
    if (c.billboardId === billboardId) {
      c.status = 'paused';
    }
  });

  const newCampaign = {
    id: campaignId,
    name,
    advertiser,
    billboardId,
    image: image || '/assets/ads/ad_apex_tires.svg',
    fallbackImage: '/assets/ads/default_ad.svg',
    headline,
    cpm: parseFloat(cpm) || 120.0,
    budget: parseFloat(budget) || 50000,
    spent: 0,
    impressions: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    status: 'active'
  };

  data.campaigns.push(newCampaign);
  saveData(CAMPAIGNS_FILE, data);

  console.log(`[CAMPAIGN-CREATED] ${name} (${campaignId}) by ${advertiser} assigned to ${billboardId} @ ₹${cpm} CPM`);
  res.json({ success: true, campaign: newCampaign, message: 'Campaign created and activated successfully.' });
});

// 7. Admin: Reset stats for fresh test demo
app.post('/api/admin/reset-stats', (req, res) => {
  saveData(IMPRESSIONS_FILE, { impressions: [] });
  recentImpressionsCooldown.clear();
  
  const data = loadData(CAMPAIGNS_FILE, { billboards: [], campaigns: [] });
  data.campaigns.forEach(c => {
    c.impressions = 0;
    c.spent = 0;
  });
  saveData(CAMPAIGNS_FILE, data);

  res.json({ success: true, message: 'All impression stats and cooldowns reset successfully.' });
});

// 8. Global Leaderboard Endpoints (Blacklist Rankings)
app.get('/api/leaderboard', (req, res) => {
  const data = loadData(LEADERBOARD_FILE, { records: [] });
  res.json(data);
});

app.post('/api/leaderboard/submit', (req, res) => {
  const { driver = 'Player', car = 'BMW M3 GTR', bounty = 0, bestSprintTime = 0, driftScore = 0 } = req.body;
  const data = loadData(LEADERBOARD_FILE, { records: [] });

  const newRecord = {
    rank: 0,
    driver: driver.slice(0, 24),
    car: car.slice(0, 32),
    bounty: parseInt(bounty) || 0,
    bestSprintTime: parseFloat(bestSprintTime) || 0,
    driftScore: parseInt(driftScore) || 0,
    date: new Date().toISOString().split('T')[0]
  };

  data.records.push(newRecord);
  // Sort descending by bounty
  data.records.sort((a, b) => b.bounty - a.bounty);
  // Recalculate ranks
  data.records.forEach((r, idx) => r.rank = idx + 1);
  // Keep top 25
  data.records = data.records.slice(0, 25);

  saveData(LEADERBOARD_FILE, data);
  res.json({ success: true, message: 'Record submitted to Blacklist Leaderboard!', records: data.records });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  🏁 NEON PURSUIT - 3D Racing & In-Game Ad Server 🏁  `);
  console.log(`=======================================================`);
  console.log(`  ▶ Game Client:     http://localhost:${PORT}/`);
  console.log(`  ▶ Ad Dashboard:    http://localhost:${PORT}/dashboard.html`);
  console.log(`  ▶ Active Ad API:   http://localhost:${PORT}/api/ads/active`);
  console.log(`  ▶ Analytics API:   http://localhost:${PORT}/api/admin/analytics`);
  console.log(`=======================================================`);
});

