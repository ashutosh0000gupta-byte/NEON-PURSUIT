/**
 * NEON PURSUIT - In-Game Blacklist Leaderboard System
 * Features:
 * - Live Blacklist Top Drivers, Cars, and Bounties
 * - Submits player's active Bounty and Drift Score to server API
 * - Interactive modal accessible via [L] key or mobile [🏆 RANKS] pill
 */
class LeaderboardManager {
  constructor() {
    this.isOpen = false;
    this.container = null;
    this.records = [];

    this.initDOM();
  }

  initDOM() {
    const modal = document.createElement('div');
    modal.id = 'leaderboard-modal-overlay';
    modal.className = 'garage-modal-overlay';
    modal.innerHTML = `
      <div class="garage-panel" style="width: 820px; border-left-color: #ffb703;">
        <div class="garage-header">
          <div class="g-title-group">
            <span class="g-eyebrow" style="color: #ffb703;">// ROCKPORT CITY POLICE DEPARTMENT & BLACKLIST 15</span>
            <h2 class="g-title">MOST WANTED LEADERBOARD</h2>
          </div>
          <button class="g-close-btn" id="ranks-close-btn">&times;</button>
        </div>

        <div class="garage-body" style="padding: 16px 24px;">
          <div style="overflow-x: auto;">
            <table class="imp-table" style="font-size: 13px;">
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>DRIVER</th>
                  <th>VEHICLE</th>
                  <th>BOUNTY</th>
                  <th>BEST SPRINT</th>
                  <th>DRIFT SCORE</th>
                </tr>
              </thead>
              <tbody id="ranks-tbody">
                <tr><td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">Loading Blacklist Records...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="garage-footer">
          <span class="g-hint">PRESS [L] TO TOGGLE LEADERBOARD</span>
          <button class="g-apply-btn" id="ranks-submit-btn" style="background: linear-gradient(90deg, #ffb703, #ff5500); color: #fff;">
            SUBMIT MY RUN 🏆
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.container = modal;

    // Events
    document.getElementById('ranks-close-btn').onclick = () => this.toggle(false);
    document.getElementById('ranks-submit-btn').onclick = () => this.promptSubmitRun();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'l' || e.key === 'L') {
        this.toggle();
      }
    });
  }

  async fetchRecords() {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      this.records = data.records || [];
      this.renderTable();
    } catch (e) {
      console.warn('Failed to fetch leaderboard:', e);
    }
  }

  renderTable() {
    const tbody = document.getElementById('ranks-tbody');
    if (!tbody) return;

    if (!this.records.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">No records yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.records.map(r => {
      const isTop3 = r.rank <= 3;
      const rankBadge = isTop3 ? `🥇 #${r.rank}` : `#${r.rank}`;
      const bountyStr = `$${r.bounty.toLocaleString()}`;

      return `
        <tr style="${isTop3 ? 'background: rgba(255, 183, 3, 0.05);' : ''}">
          <td style="font-family: 'Orbitron', sans-serif; font-weight: 900; color: ${isTop3 ? '#ffb703' : '#94a3b8'};">${rankBadge}</td>
          <td style="font-weight: 700; color: #ffffff;">${r.driver}</td>
          <td style="color: #cbd5e1;">${r.car}</td>
          <td style="font-family: 'Orbitron', sans-serif; font-weight: 900; color: #39ff14;">${bountyStr}</td>
          <td style="font-family: 'JetBrains Mono', monospace;">${r.bestSprintTime ? r.bestSprintTime.toFixed(2) + 's' : '--'}</td>
          <td style="font-family: 'JetBrains Mono', monospace; color: #ffb703;">${r.driftScore ? r.driftScore.toLocaleString() + ' PTS' : '--'}</td>
        </tr>
      `;
    }).join('');
  }

  async promptSubmitRun() {
    const name = prompt('Enter your Street Racer Nickname:', 'Player_MW');
    if (!name) return;

    const vehicle = window.playerVehicleInstance;
    const bounty = window.policeInstance?.bounty || 25000;
    const driftScore = vehicle?.driftScore || 12000;
    const bestSprintTime = window.raceInstance?.raceTimer || 42.15;
    const car = vehicle?.currentModelName || 'BMW M3 GTR';

    try {
      const res = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver: name, car, bounty, driftScore, bestSprintTime })
      });
      const result = await res.json();
      alert('🏆 Record successfully registered on the Blacklist Leaderboard!');
      this.records = result.records || [];
      this.renderTable();
    } catch (err) {
      alert('Error submitting score: ' + err.message);
    }
  }

  toggle(forceState) {
    this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
    this.container.classList.toggle('active', this.isOpen);
    if (this.isOpen) {
      this.fetchRecords();
    }
  }
}

window.LeaderboardManager = LeaderboardManager;

