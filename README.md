# 🏁 NEON PURSUIT
### 3D Open-World Racing Game Inspired by Need for Speed: Most Wanted (2005)
*Built on PlayCanvas 3D Engine • Real-Time In-Game Billboard Advertising Platform*

---

## 🌟 Complete Feature Overview

**NEON PURSUIT** combines the adrenaline-pumping street racing and police pursuit mechanics of the legendary ***Need for Speed: Most Wanted (2005)*** with an enterprise-grade **Dynamic In-Game Billboard Advertising Network** running natively in modern web browsers with cross-platform desktop/mobile support.

---

## 🎮 1. Gameplay Features (Most Wanted 2005 Inspired)

### 🏎️ Hero Car: BMW M3 GTR Livery
* **Iconic Paint & Vinyl**: Metallic Silver body with bold Cobalt Blue dual racing stripes on hood, roof, trunk, and door flanks.
* **Aggressive Body Kit**: Carbon fiber front splitter, widebody flared wheel arches, quad titanium exhaust tips, and GT rear wing.
* **Underglow Neon**: Real-time ground lighting illuminating the asphalt in cyan, gold, green, or red.

### 🌅 Rockport Autumn Golden-Hour Visual Filter
* **Iconic Sepia / Golden Bloom**: Authentic 2005 color grading with warm sunlight (`#ffb732`), volumetric autumn horizon haze, and deep asphalt reflections.

### 🚨 Full Police Pursuit System
* **Black & White Police Interceptors**: AI-driven police cruisers patrol the highway and city avenues.
* **Flashing Red/Blue Lightbars & Sirens**: Roof-mounted emergency strobes, authentic siren audio, and police radio scanner chatter.
* **Heat Levels (1 to 5)**: Violating speed limits (> 115 km/h) near cruisers or ramming city property engages the pursuit.
* **Pursuit Cooldown / Evade**: Breaking line of sight (> 75m) triggers the green **"EVADING"** meter; evading for 8 seconds awards **Bounty Cash**!
* **Bounty & Cost to State**: Dynamic counters tracking property damage and police takedowns.

### 💥 Pursuit Breakers (Collapsible Roadside Traps)
* **Expressway Fuel Station Canopy**: Ram the structural support pillars to violently collapse the massive canopy, crushing pursuing police cars!
* **Downtown Scaffolding Tower**: Industrial construction frame that falls across the road to block the police convoy.
* **Takedown Bounty**: Totaling cruisers with pursuit breakers awards `+$10,000 BOUNTY` and `+$5,000 COST TO STATE`.

### ⏱️ Speedbreaker (Bullet-Time Slow Motion)
* Press **`X`** on keyboard or tap **`⏱️ SLOW-MO`** on mobile:
  * Slows down world time (`timeScale = 0.38`) for cinematic evasions.
  * Increases steering agility to 44° for dodging roadblocks and making impossible 90° corners.
  * Muffles audio via an active low-pass acoustic filter.

### 🔧 Interactive 3D Tuning Garage (Safehouse)
* Press **`G`** or tap **`🔧 GARAGE`** on mobile:
  * **Body Paints**: Hero M3 GTR, Midnight Black, Razor Gold, Crimson Candy, Toxic Lime, Neo Purple.
  * **Neon Underglow**: Electric Cyan, Street Amber, Acid Green, Hot Pink, Pursuit Red, Stealth Off.
  * **Handling Presets**: Street Balanced (260 km/h), Pro Drift Spec (high slip angle), Drag Rocket Spec (310 km/h).

### ⚔️ Blacklist 15 Rival Boss Duel
* Press **`B`** to trigger a 1v1 Street Duel against **Blacklist #1 "RAZOR"** in his Supercharged Gold Mustang GT!

### 🚇 Highway Tunnel Section
* Concrete highway tunnel with overhead sodium strip lights, arched portals, and acoustic exhaust reverberation.

---

## 📱 2. Mobile & Tablet Virtual Controller

When accessed from a smartphone or tablet (or toggled via **`📱 CONTROLS: ON/OFF`**):
* **Left Thumb**: Ergonomic ◄ **LEFT** and ► **RIGHT** steering buttons.
* **Right Thumb**: ▲ **GAS** (Green pedal), ▼ **BRAKE** (Red pedal), **⚡ DRIFT** (Amber button), and **🚀 NOS** (Cyan button).
* **Power Row**: **⏱️ SLOW-MO** (Speedbreaker bullet-time).
* **Top Quick Action Pills**: **📷 CAM**, **🔧 GARAGE**, **🚨 POLICE**, **🔄 RESET**, **🏁 RACE**, **📊 ADS**.
* **Multi-Touch**: Full simultaneous multi-touch support for driving, boosting, and steering simultaneously without finger conflict.

---

## 📊 3. Dynamic Billboard Advertising System

### In-Game 3D Billboards
1. **`BB-001`**: Highway Overpass Mega Billboard (South Expressway)
2. **`BB-002`**: Downtown Central Skyscraper Curved Display (Neon Plaza)
3. **`BB-003`**: Waterfront Speedway Monolith (East Docks)
4. **`BB-004`**: North Ridge Bridge Banner (Hillside Expressway)

### IAB / MRC Viewability Verification Standard
* **Camera Frustum Test**: Viewport projection `[0..1, 0..1]` in front of camera plane.
* **Distance Threshold**: Valid only within **85 meters**.
* **Facing Angle Check**: Evaluates billboard normal vector (rejects viewing from behind or angles > 75°).
* **Dwell Time Requirement**: Requires **≥ 1.5 seconds** continuous line-of-sight visibility.
* **Anti-Fraud Cooldown**: 15-second per-billboard cooldown per session.

### Revenue Calculation Formula
$$\text{Gross Revenue} = \left(\frac{\text{Valid Impressions}}{1,000}\right) \times \text{CPM}$$

---

## 🕹️ 4. Controls Master Reference

| Action | PC Keyboard | Mobile Screen |
| :--- | :--- | :--- |
| **Accelerate** | `W` / `▲ Up Arrow` | **▲ GAS** (Green Pedal) |
| **Brake / Reverse** | `S` / `▼ Down Arrow` | **▼ BRAKE** (Red Pedal) |
| **Steer Left / Right** | `A` / `D` | **◄ LEFT** / **► RIGHT** |
| **Handbrake Drift** | `SPACEBAR` | **⚡ DRIFT** |
| **Nitrous Boost** | `LEFT SHIFT` | **🚀 NOS** |
| **Speedbreaker (Slow-Mo)** | `X` | **⏱️ SLOW-MO** |
| **Tuning Garage** | `G` | **🔧 GARAGE** |
| **Trigger Police Pursuit** | `P` | **🚨 POLICE** |
| **Blacklist 1v1 Boss Duel** | `B` | `[B] Key` |
| **Street Sprint Race** | `E` | **🏁 RACE** |
| **Camera View** | `C` | **📷 CAM** |
| **Reset Vehicle** | `R` | **🔄 RESET** |
| **Ad Telemetry Panel** | `H` | **📊 ADS** |

---

## 🚀 5. How to Launch & Play

### Local Play:
1. Double click **`start.bat`** or run:
   ```bash
   node server.js
   ```
2. Open:
   * **3D Game Client**: [http://localhost:3000/](http://localhost:3000/)
   * **Ad Operations Dashboard**: [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)

### Free Cloud Deployment:
1. Connect this repository ([https://github.com/ashutosh0000gupta-byte/NEON-PURSUIT](https://github.com/ashutosh0000gupta-byte/NEON-PURSUIT)) on **Render.com**.
2. Select **Web Service**, set Build Command: `npm install`, Start Command: `node server.js`.
3. Get your live free HTTPS link (e.g. `https://neon-pursuit.onrender.com`) accessible from any browser worldwide!
