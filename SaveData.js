// Simple localStorage-backed persistence, so wispcoins/wins/losses survive
// page reloads. Game.js already calls window.SaveData.getPlayerData() /
// setPlayerData() if it exists (see Game.js "start()" and "endMatch()") —
// this file just provides that global so progress actually sticks.
const SaveData = {
  KEY: 'animeClash_playerData',

  async getPlayerData(defaults) {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return Object.assign({}, defaults);
      const saved = JSON.parse(raw);
      return Object.assign({}, defaults, saved);
    } catch (e) {
      return Object.assign({}, defaults);
    }
  },

  async setPlayerData(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      /* storage unavailable (e.g. private mode) - fail silently */
    }
  },
};

window.SaveData = SaveData;
