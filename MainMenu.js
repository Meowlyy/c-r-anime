// Clash-Royale-style main menu / home screen, shown before a battle starts.
// Reads wispcoins/wins/losses/gems from SaveData (localStorage) so every
// number here matches what the in-game shop and match rewards produce.
// Calling onStartBattle() hides the menu and hands control back to
// index.html, which then creates the Game.
//
// Layout mirrors a typical mobile CR-style home screen:
//   fixed top bar (level/XP, coins, gems, player card, season+pass banners)
//   -> scrollable content (home scene with battle button + chests, or the
//      card/deck browser)
//   -> fixed bottom tab bar
//
// Only "Start" and "Karten" are real screens right now (this is a solo
// vs-CPU prototype, no server). Buttons for social/leaderboard/live-content
// features that don't exist yet are honestly labeled and show a small
// "kommt bald" toast instead of pretending to work.
// All three chest slots are independently openable (the user asked for every
// chest to be unlockable, not just the first one). Each has its own art,
// cooldown and reward range so they still feel distinct once opened.
const CHEST_SLOTS = [
  { dataKey: 'nextChestAt', art: 'slot1', label: 'Jetzt öffnen', cooldownMs: 4 * 3600 * 1000, rewardMin: 40, rewardMax: 120 },
  { dataKey: 'nextChestAt2', art: 'slot2', label: 'Jetzt öffnen', cooldownMs: 8 * 3600 * 1000, rewardMin: 80, rewardMax: 220 },
  { dataKey: 'nextChestAt3', art: 'slot3', label: 'Jetzt öffnen', cooldownMs: 12 * 3600 * 1000, rewardMin: 150, rewardMax: 400 },
];

// Real profile name-banner art the person dropped into assets/profilnamebanner.
// `fg` is an optional foreground cutout that pops out over the top edge
// (only FlyingCuteness currently has one).
const BANNERS = [
  { id: 'ronin_slash', name: 'Ronin Slash', bg: 'assets/profilnamebanner/84_RoninSlash_BG.png' },
  { id: 'ronin_bath', name: 'Ronin Bad', bg: 'assets/profilnamebanner/84_RoninBath_BG.png' },
  { id: 'ronin_meadow', name: 'Ronin Wiese', bg: 'assets/profilnamebanner/84_RoninMeadow_BG.png' },
  { id: 'ronin_print', name: 'Ronin Print', bg: 'assets/profilnamebanner/84_RoninPrint_BG.png' },
  { id: 'royale_smash', name: 'Royale Smash', bg: 'assets/profilnamebanner/84_RoyaleSmash_BG.png' },
  { id: 'slice_dice', name: 'Slice & Dice', bg: 'assets/profilnamebanner/84_SliceAndDice_BG.png' },
  { id: 'morbid_monarch', name: 'Morbid Monarch', bg: 'assets/profilnamebanner/84_MorbidMonarch_BG.png' },
  { id: 'clash_animals', name: 'Clash Animals', bg: 'assets/profilnamebanner/ClashAnimalsBG.png' },
  { id: 'lava_lamp', name: 'Zauberbuch', bg: 'assets/profilnamebanner/LavaLampBG.png' },
  { id: 'flying_cuteness', name: 'Flying Cuteness', bg: 'assets/profilnamebanner/FlyingCutenessBG.png', fg: 'assets/misc/FlyingCutenessFG.png' },
];

// Real chest art (assets/chests) mapped onto the three home-screen chest
// slots so each one looks distinct instead of reusing the same icon.
const CHEST_ART = {
  slot1: { closed: 'assets/chests/Chest_BasicLucky_Closed.png', open: 'assets/chests/Chest_BasicLucky_Open.png' },
  slot2: { closed: 'assets/chests/Anim_chestFireIce_4K.png', open: 'assets/chests/Anim_chestFireIce_OPEN_4K.png' },
  slot3: { closed: 'assets/chests/LegendaryLucky_CLOSED_4K.png', open: 'assets/chests/LegendaryLucky_OPEN_4K.png' },
};

class MainMenu {
  constructor(onStartBattle) {
    this.onStartBattle = onStartBattle;
    this.menuElement = null;
    this.data = null;
    this.activeTab = 'start';
    this.seasonEndsAt = Date.now() + (18 * 24 + 12) * 3600 * 1000; // flavor countdown
    this.init();
  }

  async init() {
    const defaults = { wispcoins: 250, gems: 0, wins: 0, losses: 0, nextChestAt: 0, nextChestAt2: 0, nextChestAt3: 0, playerTag: null, playerName: 'Shinobi', selectedBanner: BANNERS[0].id };
    this.data = window.SaveData
      ? await SaveData.getPlayerData(defaults)
      : defaults;

    if (!this.data.playerTag) {
      this.data.playerTag = this.generateTag();
      if (window.SaveData) await SaveData.setPlayerData(this.data);
    }

    this.menuElement = document.createElement('div');
    this.menuElement.id = 'main-menu-overlay';
    this.menuElement.innerHTML = this.renderShell();
    document.body.appendChild(this.menuElement);

    this.renderTab();
    this.bindTopLevelEvents();
    this.mountAvatarSprites();
    this.startCountdown();
  }

  // ---------- derived display stats ----------
  get level() { return 1 + Math.floor((this.data.wins || 0) / 5); }
  get xpPct() { return ((this.data.wins || 0) % 5) / 5 * 100; }
  get trophies() { return Math.max(0, (this.data.wins || 0) * 30 - (this.data.losses || 0) * 10); }
  get passLevel() { return Math.min(10, Math.floor((this.data.wins || 0) / 2)); }
  // Next round-number milestone above the current trophy count, e.g. 320 -> 500.
  get nextMilestone() {
    const t = this.trophies;
    if (t === 0) return 100;
    const magnitude = Math.pow(10, Math.floor(Math.log10(t)));
    const step = magnitude / 2;
    return Math.ceil((t + 1) / step) * step;
  }
  chestReadyFor(slot) { return Date.now() >= (this.data[slot.dataKey] || 0); }
  get chestReady() { return this.chestReadyFor(CHEST_SLOTS[0]); }
  get arena() { return 1 + Math.floor(this.trophies / 200); }
  get battlesTotal() { return (this.data.wins || 0) + (this.data.losses || 0); }
  get winRate() {
    const total = this.battlesTotal;
    return total ? Math.round((this.data.wins || 0) / total * 100) : 0;
  }

  generateTag() {
    const chars = '0289PYLQGRJCUV';
    let tag = '#';
    for (let i = 0; i < 8; i++) tag += chars[Math.floor(Math.random() * chars.length)];
    return tag;
  }

  // ---------- shell: top bar + content mount + tab bar ----------
  renderShell() {
    return `
      <div class="mm-topbar">
        <div class="mm-currency-row">
          <div class="mm-level-pill" title="Level ${this.level}">
            <span class="mm-level-badge">${this.level}</span>
            <div class="mm-xp-bar"><div class="mm-xp-fill" style="width:${this.xpPct}%"></div></div>
          </div>
          <div class="mm-curr-group">
            <div class="mm-pill mm-coin">🪙 ${this.data.wispcoins}<button class="mm-add-btn" data-toast="Shop kommt bald">+</button></div>
            <div class="mm-pill mm-gem">💎 ${this.data.gems || 0}<button class="mm-add-btn" data-toast="Shop kommt bald">+</button></div>
          </div>
        </div>

        <div class="mm-player-row">
          <div class="mm-player-card" id="mm-open-profile" role="button" tabindex="0">
            <div class="mm-avatar" id="mm-avatar"></div>
            <div class="mm-player-meta">
              <span class="mm-player-name">${this.escapeHtml(this.data.playerName || 'Shinobi')}</span>
              <span class="mm-clan">🛡 Schattenklan</span>
            </div>
            <div class="mm-trophies">🏆 ${this.trophies}</div>
          </div>
          <div class="mm-icon-group">
            <button class="mm-icon-btn" data-toast="Freunde kommen bald">👥</button>
            <button class="mm-icon-btn" data-toast="Nachrichten kommen bald">✉️</button>
            <button class="mm-icon-btn" id="settings-btn" title="Einstellungen">☰</button>
          </div>
        </div>

        <div class="mm-banner-row">
          <div class="mm-banner mm-season-banner">
            <div class="mm-banner-title">Season 1<br><strong>Ninja-Pfad</strong></div>
            <div class="mm-banner-timer">⏱ <span id="mm-season-timer">--</span></div>
          </div>
          <div class="mm-banner mm-pass-banner">
            <div class="mm-banner-title">👑 Pass Royale</div>
            <div class="mm-xp-bar mm-xp-bar--small"><div class="mm-xp-fill" style="width:${this.passLevel * 10}%"></div></div>
            <span class="mm-pass-level">${this.passLevel}/10</span>
          </div>
        </div>
      </div>

      <div id="menu-content"></div>

      <nav class="mm-tabbar">
        <button class="mm-tab-btn" data-toast="Truhen-Übersicht kommt bald">🗝</button>
        <button class="mm-tab-btn" data-tab="karten">🃏<span class="mm-tab-badge">${(typeof Card !== 'undefined') ? Card.list().length : 0}</span></button>
        <button class="mm-tab-btn mm-tab-btn--main" data-tab="start">⚔</button>
        <button class="mm-tab-btn" data-toast="Rangliste kommt bald">🛡</button>
        <button class="mm-tab-btn" data-toast="Kampfprotokoll kommt bald">🏅</button>
      </nav>

      <div id="mm-toast"></div>
    `;
  }

  bindTopLevelEvents() {
    this.menuElement.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.onclick = () => {
        this.activeTab = btn.dataset.tab;
        this.renderTab();
      };
    });

    this.menuElement.querySelectorAll('[data-toast]').forEach((btn) => {
      btn.onclick = () => this.toast(btn.dataset.toast);
    });

    document.getElementById('settings-btn').onclick = () => this.toggleSettings();
    document.getElementById('mm-open-profile').onclick = () => this.openProfile();
  }

  // ---------- tab content ----------
  renderTab() {
    this.menuElement.querySelectorAll('.mm-tab-btn[data-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === this.activeTab);
    });

    const mount = document.getElementById('menu-content');
    mount.innerHTML = this.activeTab === 'karten' ? this.renderDeckTab() : this.renderStartTab();

    if (this.activeTab === 'start') {
      document.getElementById('battle-btn').onclick = () => {
        this.hide();
        if (this.onStartBattle) this.onStartBattle();
      };
      mount.querySelectorAll('[data-toast]').forEach((btn) => {
        btn.onclick = () => this.toast(btn.dataset.toast);
      });
      const openChestBtns = mount.querySelectorAll('[id^="mm-open-chest"]');
      openChestBtns.forEach((btn) => {
        btn.onclick = () => this.openChest(Number(btn.dataset.slot));
      });
      this.mountAvatarSprites();
      this.updateChestTimer();
    } else {
      Card.list().forEach((card) => {
        const holder = mount.querySelector(`[data-icon="${card.id}"]`);
        if (!holder || typeof lib === 'undefined') return;
        const sprite = lib.sprite(card.spriteId);
        if (sprite) holder.appendChild(this.cloneSprite(sprite));
      });
    }
  }

  renderStartTab() {
    return `
      <div class="mm-scene">
        <div class="mm-side-icons mm-side-left">
          <button class="mm-scene-icon" data-toast="Quests kommen bald"><span>📜</span>Quests</button>
          <button class="mm-scene-icon" id="mm-scroll-chest"><span>🎁</span>Truhe</button>
          <button class="mm-scene-icon" data-toast="Shop kommt bald"><span>🏪</span>Shop</button>
        </div>
        <div class="mm-side-icons mm-side-right">
          <button class="mm-scene-icon" data-toast="TV Royale kommt bald"><span>📺</span>TV Royale</button>
          <button class="mm-scene-icon" data-toast="Bestenliste kommt bald"><span>🏅</span>Bestenliste</button>
        </div>

        <div class="mm-scene-art">
          <div class="mm-sky"></div>
          <div class="mm-mountain mm-mountain--back"></div>
          <div class="mm-mountain mm-mountain--front"></div>
          <div class="mm-torii">
            <div class="mm-torii-bar mm-torii-bar--top"></div>
            <div class="mm-torii-bar mm-torii-bar--mid"></div>
            <div class="mm-torii-leg mm-torii-leg--l"></div>
            <div class="mm-torii-leg mm-torii-leg--r"></div>
          </div>
          <div class="mm-blossoms"></div>
        </div>

        <div class="mm-battle-zone">
          <div class="mm-trophy-road">
            <div class="mm-trophy-road-bar">
              <div class="mm-trophy-road-fill" style="width:${Math.min(100, this.trophies / this.nextMilestone * 100)}%"></div>
            </div>
            <span class="mm-trophy-road-label">🏆 ${this.trophies} / ${this.nextMilestone}</span>
          </div>
          <div class="mm-battle-row">
            <button class="mm-btn-battle" id="battle-btn">
              <span class="mm-battle-label">⚔ KAMPF</span>
              <span class="mm-battle-sub">1 Spieler vs. CPU</span>
            </button>
            <button class="mm-mode-btn" data-toast="Weitere Modi kommen bald">
              <div class="mm-mode-icon" id="mm-mode-avatar"></div>
              <span>1v1</span>
            </button>
          </div>
        </div>
      </div>

      <div class="mm-chest-row" id="mm-chest-row">${this.renderChestSlots()}</div>
    `;
  }

  renderChestSlots() {
    const slotsHtml = CHEST_SLOTS.map((slot, i) => this.renderChestSlot(slot, i)).join('');
    return `
      ${slotsHtml}
      <div class="mm-chest mm-chest--empty">
        <span class="mm-chest-label">Truhenplatz</span>
      </div>
    `;
  }

  renderChestSlot(slot, index) {
    const ready = this.chestReadyFor(slot);
    const art = CHEST_ART[slot.art];
    const btnId = index === 0 ? 'mm-open-chest' : `mm-open-chest${index + 1}`;
    const timerId = index === 0 ? 'mm-chest-timer' : `mm-chest-timer${index + 1}`;
    return ready
      ? `<button class="mm-chest mm-chest--ready" id="${btnId}" data-slot="${index}">
           <div class="mm-chest-icon"><img src="${art.closed}" alt="Truhe"></div>
           <span class="mm-chest-label">Jetzt öffnen</span>
         </button>`
      : `<div class="mm-chest mm-chest--locked">
           <div class="mm-chest-icon"><img src="${art.closed}" alt="Truhe"><span class="mm-chest-lock-badge">🔒</span></div>
           <span class="mm-chest-label" id="${timerId}">--</span>
         </div>`;
  }

  renderDeckTab() {
    const cards = (typeof Card !== 'undefined') ? Card.list() : [];
    if (!cards.length) {
      return `<div class="deck-empty">Kartendaten konnten nicht geladen werden.</div>`;
    }
    const items = cards.map((card) => `
      <div class="deck-card">
        <div class="deck-card-icon" data-icon="${card.id}"></div>
        <div class="deck-card-cost">💧${card.cost}</div>
        <div class="deck-card-name">${card.name}</div>
        <div class="deck-card-stats">
          <span>❤ ${card.hp}</span>
          <span>⚔ ${card.damage}</span>
        </div>
        <div class="deck-card-desc">${card.description}</div>
      </div>
    `).join('');
    return `
      <div class="deck-header">
        <h2>Dein Deck</h2>
        <p>${cards.length} Karten &mdash; wird automatisch im Kampf gemischt</p>
      </div>
      <div class="deck-grid">${items}</div>
    `;
  }

  // ---------- helpers ----------

  // Sprites live on offscreen canvases in Assets._sprites. We can't reuse
  // the same <canvas> node in two places, so redraw its pixels onto a
  // fresh canvas sized for the menu thumbnail.
  cloneSprite(sourceCanvas) {
    const out = document.createElement('canvas');
    out.width = sourceCanvas.width;
    out.height = sourceCanvas.height;
    out.getContext('2d').drawImage(sourceCanvas, 0, 0);
    return out;
  }

  async openChest(slotIndex = 0) {
    const slot = CHEST_SLOTS[slotIndex] || CHEST_SLOTS[0];
    const reward = slot.rewardMin + Math.floor(Math.random() * (slot.rewardMax - slot.rewardMin + 1));
    const art = CHEST_ART[slot.art];

    // Swap to the open-chest artwork and let the pop animation play before
    // we recompute the reward/cooldown state underneath it.
    const btnId = slotIndex === 0 ? 'mm-open-chest' : `mm-open-chest${slotIndex + 1}`;
    const chestEl = document.getElementById(btnId);
    if (chestEl) {
      chestEl.classList.add('mm-chest--opening');
      const img = chestEl.querySelector('img');
      if (img) img.src = art.open;
      chestEl.disabled = true;
    }

    this.data.wispcoins = (this.data.wispcoins || 0) + reward;
    this.data[slot.dataKey] = Date.now() + slot.cooldownMs;
    if (window.SaveData) await SaveData.setPlayerData(this.data);

    this.toast(`Truhe geöffnet: +${reward} 🪙`);

    setTimeout(() => {
      // Refresh the whole shell so the coin pill and chest row both update.
      this.menuElement.innerHTML = this.renderShell();
      this.renderTab();
      this.bindTopLevelEvents();
      this.mountAvatarSprites();
      this.startCountdown();
    }, 650);
  }

  updateChestTimer() {
    CHEST_SLOTS.forEach((slot, index) => {
      const timerId = index === 0 ? 'mm-chest-timer' : `mm-chest-timer${index + 1}`;
      const el = document.getElementById(timerId);
      if (!el) return;
      const msLeft = Math.max(0, (this.data[slot.dataKey] || 0) - Date.now());
      const hours = Math.floor(msLeft / 3600000);
      const mins = Math.floor((msLeft % 3600000) / 60000);
      el.textContent = `${hours}h ${mins}m`;
      if (msLeft <= 0) this.renderTab(); // flip to "ready" state
    });
  }

  mountAvatarSprites() {
    this.applyMiniBanner();
    if (typeof lib === 'undefined') return;
    const ninjaSprite = lib.sprite('unit_ninja');
    if (!ninjaSprite) return;

    const avatar = document.getElementById('mm-avatar');
    if (avatar && !avatar.querySelector('canvas')) avatar.appendChild(this.cloneSprite(ninjaSprite));

    const modeAvatar = document.getElementById('mm-mode-avatar');
    if (modeAvatar && !modeAvatar.querySelector('canvas')) modeAvatar.appendChild(this.cloneSprite(ninjaSprite));

    const scrollBtn = document.getElementById('mm-scroll-chest');
    if (scrollBtn) {
      scrollBtn.onclick = () => {
        document.getElementById('mm-chest-row').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
    }
  }

  startCountdown() {
    if (this._countdownTimer) clearInterval(this._countdownTimer);
    const update = () => {
      const el = document.getElementById('mm-season-timer');
      if (!el) return; // menu closed / tab switched away
      const msLeft = Math.max(0, this.seasonEndsAt - Date.now());
      const days = Math.floor(msLeft / (24 * 3600 * 1000));
      const hours = Math.floor((msLeft % (24 * 3600 * 1000)) / (3600 * 1000));
      el.textContent = `${days}d ${hours}h`;
      this.updateChestTimer();
    };
    update();
    this._countdownTimer = setInterval(update, 30 * 1000);
  }

  toast(message) {
    const host = document.getElementById('mm-toast');
    if (!host) return;
    host.textContent = message;
    host.classList.remove('mm-toast--show');
    // Force reflow so the animation restarts if toasts fire back-to-back.
    void host.offsetWidth;
    host.classList.add('mm-toast--show');
  }

  // ---------- profile modal ----------
  currentBanner() {
    return BANNERS.find((b) => b.id === this.data.selectedBanner) || BANNERS[0];
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  openProfile() {
    if (document.getElementById('profile-modal')) return;
    const banner = this.currentBanner();

    const backdrop = document.createElement('div');
    backdrop.id = 'profile-modal';
    backdrop.innerHTML = `
      <div class="pm-card">
        <button class="pm-close" id="pm-close-btn">✕</button>

        <div class="pm-banner" id="pm-banner">
          <img class="pm-banner-img" src="${banner.bg}" alt="${this.escapeHtml(banner.name)}">
          <button class="pm-banner-edit-btn" id="pm-banner-edit-btn">🖼 Banner</button>
          ${banner.fg ? `<img class="pm-banner-fg" src="${banner.fg}" alt="">` : ''}
          <div class="pm-banner-avatar" id="pm-avatar"></div>
        </div>

        <div class="pm-badges">
          <div class="pm-badge" title="Beigetreten 2026">🌱<span>2026</span></div>
          <div class="pm-badge" title="Aktuelle Arena">🏯<span>Arena ${this.arena}</span></div>
          <div class="pm-badge" title="Level">⭐<span>Lv. ${this.level}</span></div>
        </div>

        <h2 class="pm-name" id="pm-name-row">
          <span id="pm-name-text">${this.escapeHtml(this.data.playerName || 'Shinobi')}</span>
          <button class="pm-name-edit-btn" id="pm-name-edit-btn" title="Namen ändern">✏️</button>
        </h2>
        <p class="pm-tag">${this.data.playerTag}</p>

        <div class="pm-clan-row">
          <span class="pm-clan-icon">🛡</span>
          <div class="pm-clan-meta">
            <strong>Schattenklan</strong>
            <span>Mitglied</span>
          </div>
          <div class="pm-clan-trophies">🏆 ${this.trophies}</div>
        </div>

        <div class="pm-divider"><span>Trophäenpfad</span></div>
        <div class="pm-road-row">
          <div class="pm-road-badge">${this.level}</div>
          <div class="pm-road-trophies">🏆 ${this.trophies}</div>
          <div class="pm-road-arena">Arena ${this.arena}</div>
        </div>

        <div class="pm-divider"><span>Statistik</span></div>
        <div class="pm-stats">
          <div class="pm-stat"><span class="pm-stat-value">${this.data.wins || 0}</span><span class="pm-stat-label">Siege</span></div>
          <div class="pm-stat"><span class="pm-stat-value">${this.data.losses || 0}</span><span class="pm-stat-label">Niederlagen</span></div>
          <div class="pm-stat"><span class="pm-stat-value">${this.winRate}%</span><span class="pm-stat-label">Sieg-Quote</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const avatarHolder = document.getElementById('pm-avatar');
    if (avatarHolder && typeof lib !== 'undefined') {
      const sprite = lib.sprite('unit_ninja');
      if (sprite) avatarHolder.appendChild(this.cloneSprite(sprite));
    }

    backdrop.onclick = (e) => { if (e.target === backdrop) this.closeProfile(); };
    document.getElementById('pm-close-btn').onclick = () => this.closeProfile();
    document.getElementById('pm-banner-edit-btn').onclick = () => this.openBannerPicker();
    document.getElementById('pm-name-edit-btn').onclick = () => this.startEditName();
  }

  startEditName() {
    const row = document.getElementById('pm-name-row');
    if (!row || document.getElementById('pm-name-input')) return;
    const current = this.data.playerName || 'Shinobi';
    row.innerHTML = `<input id="pm-name-input" class="pm-name-input" type="text" maxlength="16" value="${this.escapeHtml(current)}">`;
    const input = document.getElementById('pm-name-input');
    input.focus();
    input.select();

    const commit = async () => {
      const value = input.value.trim().slice(0, 16) || 'Shinobi';
      this.data.playerName = value;
      if (window.SaveData) await SaveData.setPlayerData(this.data);
      row.innerHTML = `
        <span id="pm-name-text">${this.escapeHtml(value)}</span>
        <button class="pm-name-edit-btn" id="pm-name-edit-btn" title="Namen ändern">✏️</button>
      `;
      document.getElementById('pm-name-edit-btn').onclick = () => this.startEditName();
      // Topbar shows the name too, but only if the menu is still mounted.
      const topbarName = this.menuElement.querySelector('.mm-player-name');
      if (topbarName) topbarName.textContent = value;
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
    });
    input.addEventListener('blur', commit, { once: true });
  }

  // ---------- banner picker ----------
  openBannerPicker() {
    if (document.getElementById('banner-picker-modal')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'banner-picker-modal';
    backdrop.innerHTML = `
      <div class="bp-card">
        <button class="bp-close" id="bp-close-btn">✕</button>
        <div class="bp-title">Banner wählen</div>
        <div class="bp-grid">
          ${BANNERS.map((b) => `
            <div class="bp-option ${b.id === this.data.selectedBanner ? 'bp-option--selected' : ''}" data-banner="${b.id}" style="background-image:url('${b.bg}')">
              <span>${this.escapeHtml(b.name)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
    document.getElementById('bp-close-btn').onclick = () => backdrop.remove();
    backdrop.querySelectorAll('[data-banner]').forEach((el) => {
      el.onclick = () => this.selectBanner(el.dataset.banner, backdrop);
    });
  }

  async selectBanner(bannerId, backdrop) {
    this.data.selectedBanner = bannerId;
    if (window.SaveData) await SaveData.setPlayerData(this.data);
    if (backdrop) backdrop.remove();

    const banner = this.currentBanner();
    const pmBanner = document.getElementById('pm-banner');
    if (pmBanner) {
      const img = pmBanner.querySelector('.pm-banner-img');
      if (img) { img.src = banner.bg; img.alt = banner.name; }
      const oldFg = pmBanner.querySelector('.pm-banner-fg');
      if (oldFg) oldFg.remove();
      if (banner.fg) {
        const fgImg = document.createElement('img');
        fgImg.className = 'pm-banner-fg';
        fgImg.src = banner.fg;
        pmBanner.appendChild(fgImg);
      }
    }
    this.applyMiniBanner();
  }

  // Small preview strip behind the home-screen player card, so the picked
  // banner is visible without opening the full profile.
  applyMiniBanner() {
    const card = this.menuElement && this.menuElement.querySelector('.mm-player-card');
    if (!card) return;
    card.style.backgroundImage = `url('${this.currentBanner().bg}')`;
  }

  closeProfile() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.remove();
  }

  // ---------- settings dropdown ----------
  toggleSettings() {
    let panel = document.getElementById('settings-panel');
    if (panel) { panel.remove(); return; }

    panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.innerHTML = `<button id="reset-progress-btn">Fortschritt zurücksetzen</button>`;
    document.querySelector('.mm-player-row').appendChild(panel);

    document.getElementById('reset-progress-btn').onclick = async () => {
      if (!confirm('Wispcoins, Siege und Niederlagen wirklich zurücksetzen?')) return;
      const defaults = {
        wispcoins: 250, gems: 0, wins: 0, losses: 0, nextChestAt: 0, nextChestAt2: 0, nextChestAt3: 0,
        playerTag: this.data.playerTag, playerName: this.data.playerName, selectedBanner: this.data.selectedBanner,
      };
      if (window.SaveData) await SaveData.setPlayerData(defaults);
      this.data = defaults;
      panel.remove();
      this.menuElement.innerHTML = this.renderShell();
      this.renderTab();
      this.bindTopLevelEvents();
      this.mountAvatarSprites();
      this.startCountdown();
    };
  }

  hide() {
    if (this._countdownTimer) clearInterval(this._countdownTimer);
    if (this.menuElement) this.menuElement.style.display = 'none';
  }

  show() {
    if (this.menuElement) this.menuElement.style.display = 'flex';
  }
}
