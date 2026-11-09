# 🏁 NEON PURSUIT
### 3D Open-World Racing Game with Dynamic In-Game Billboard Advertising
*Inspired by Need for Speed: Most Wanted (2005) • Built on PlayCanvas 3D Engine*

---

## 🚀 1. Milestone 1 Implementation Overview

As outlined in the **Game Development Project Summary & Blueprint**, Milestone 1 establishes the core browser prototype demonstrating:
1. **PlayCanvas 3D Engine Integration**: Standalone client running high-performance WebGL 3D graphics directly in web browsers.
2. **3D City Environment**: Urban roadway grid, asphalt avenues, yellow/white lane markings, sidewalks, overpasses, glowing streetlights, and commercial skyscrapers with neon roof signage.
3. **High-Performance Sports Car**:
   - Iconic coupe styling inspired by NFS Most Wanted (aerodynamic body, GT rear wing, front splitter, quad exhaust).
   - 4 independently rotating and steering alloy wheels.
   - Projector headlights casting illumination forward on the asphalt.
   - Dual red taillights that flare on braking and reverse.
4. **Arcade Driving Physics**:
   - Torque curve with 6-speed automatic gearbox and gear display.
   - Speed-sensitive steering and top speed up to 260 km/h.
   - Handbrake & drifting mechanics (`Spacebar`) with lateral slip and drift scoring.
   - Dynamic chassis pitch & roll (suspension roll in corners, dip on braking).
   - Nitro boost (`Shift`) with acceleration multiplier.
5. **Procedural Web Audio Engine**:
   - Real-time multi-oscillator V8 engine sound synthesis scaling with RPM and throttle.
   - Automatic gear shift drops and turbo blow-off valve release.
   - Dynamic tire screech sound triggered during high-angle drift.
   - NFS Most Wanted pursuit chime and ad impression verification sound.
6. **Dynamic In-Game Billboards**:
   - Realistic 3D architectural structures: twin ground pylons, steel backing truss, maintenance catwalk with safety railings, and top spotlights.
   - Dynamic ad texture loading pipeline fetching active campaigns from `/api/ads/active`.
   - 4 active billboards distributed across key high-speed expressways and skyscraper plazas.
7. **Ad Impression Verification Engine (IAB/MRC Viewability Standard)**:
   - **3D Camera Frustum Check**: Projects billboard world coordinates to camera viewport plane `[0..1, 0..1]`.
   - **Distance Validation**: Valid only within 85 meters.
   - **Facing Angle Check**: Evaluates billboard normal dot product with camera vector (rejects viewing from behind or extreme oblique angles > 75°).
   - **Dwell Time Requirement**: Requires continuous view for ≥ 1.5 seconds.
   - **Server-Side Anti-Fraud**: Cooldown per billboard to eliminate spam impressions.
8. **Advertising Revenue Model & Operations Dashboard**:
   - Executive dark-mode dashboard at `http://localhost:3000/dashboard.html`.
   - Real-time KPI cards: Total Impressions, Verified Impressions, Viewability Rate (%), and Gross Revenue (₹).
   - Exact CPM formula: `Revenue = (Valid Impressions ÷ 1,000) × CPM`.
   - Interactive Billboard Inventory Grid: Switch campaigns dynamically on live billboards with one click!
   - Real-time Impression Stream Table streaming telemetry beacons live as the car drives past boards.

---

## 🎮 2. Quick Start & How to Play

### Option A: One-Click Windows Launcher
Simply double-click **`start.bat`** in the project folder. It will:
1. Start the Node.js backend ad server on port `3000`.
2. Automatically open the Game Client: `http://localhost:3000/`
3. Automatically open the Ad Dashboard: `http://localhost:3000/dashboard.html`

### Option B: Terminal Command
```bash
# In the project directory:
node server.js
```
Then visit:
- **Game Client**: [http://localhost:3000/](http://localhost:3000/)
- **Advertising Dashboard**: [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)

---

## 🕹️ 3. Vehicle Controls

| Key | Action |
| :--- | :--- |
| **`W` / `▲ Up Arrow`** | Accelerate (Throttle) |
| **`S` / `▼ Down Arrow`** | Brake / Reverse |
| **`A` / `◄ Left Arrow`** | Steer Left |
| **`D` / `► Right Arrow`** | Steer Right |
| **`SPACEBAR`** | Handbrake / Drift (Accrues drift score) |
| **`LEFT SHIFT`** | Nitrous Boost (NOS) |
| **`C`** | Toggle Camera Mode (Close Chase, Far Chase, Hood Cam) |
| **`R`** | Reset Vehicle (If stuck or collided) |
| **`H`** | Toggle Live Ad Telemetry Panel |

---

## 📡 4. Dynamic In-Game Billboard Inventory

| Billboard ID | Structure & Location | Active Campaign | Advertiser | CPM Rate |
| :--- | :--- | :--- | :--- | :--- |
| **`BB-001`** | Highway Overpass Mega Billboard (South Expressway) | *Apex Pro Grip - Street Slick Tires* | Apex Motorsport Group | ₹120.00 |
| **`BB-002`** | Downtown Central Skyscraper Display (Neon Plaza) | *Quantum Nitro Fuel - Ignite The Streets* | Quantum Energy Corp | ₹150.00 |
| **`BB-003`** | Waterfront Speedway Monolith (East Docks) | *HyperCharge Zero Sugar Energy Drink* | HyperCharge Beverage Co. | ₹95.00 |
| **`BB-004`** | North Ridge Bridge Banner (Hillside Expressway) | *CyberTel 5G Ultra Gaming Network* | CyberTel Global | ₹110.00 |

---

## 📊 5. Revenue Calculation Formula

$$\text{Gross Revenue} = \left(\frac{\text{Verified Impressions}}{1,000}\right) \times \text{CPM}$$

* **Example 1**: 500,000 valid impressions at an average CPM of ₹100 = **₹50,000**.
* **Single Impression Value**: At ₹120 CPM, each verified view credits **₹0.12** in real-time.

---

## 🛠️ 6. REST API Endpoints

- `GET /api/status`: Health check, engine version, and uptime.
- `GET /api/ads/billboards`: List of 3D billboard positions, dimensions, and locations.
- `GET /api/ads/active`: Active scheduled campaigns mapped to billboard entities.
- `POST /api/ads/impression`: Validates and records viewability beacons.
- `GET /api/admin/analytics`: Aggregated metrics, KPI totals, and recent impression streams.
- `POST /api/admin/campaigns/switch`: Dynamic live billboard ad campaign assignment.
- `POST /api/admin/reset-stats`: Clears impression telemetry and resets test revenue.

---

## 🗺️ 7. Long-Term Roadmap (Phases 2 – 6)

- [x] **Phase 1 (Completed)**: Standalone PlayCanvas 3D city prototype, sports car, arcade physics, follow camera, procedural audio, dynamic billboard engine, impression tracking, and ad dashboard.
- [ ] **Phase 2**: Expanded road network, traffic AI, additional vehicle classes.
- [ ] **Phase 3**: Day/night weather transitions, interactive garages, performance tuning.
- [ ] **Phase 4**: Third-party ad network SDK integrations (Anzu, AdInMo, Frameplay).
- [ ] **Phase 5**: Full Most Wanted Police Chase system (Patrols, Heat Levels 1-5, Roadblocks, Spike Strips, Helicopter pursuit).
- [ ] **Phase 6**: Cross-platform packaging: Windows (.EXE via Electron/Neutralino) & Android (.APK via Capacitor/Cordova).

