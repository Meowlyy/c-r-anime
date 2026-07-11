// Anime Clash — top-down card battler.
// File wiring: uses Assets (assets.js), Projectile (Projectile.js), EnemyAI (AI.js).
const ITEMS_METADATA = [
  { "itemKey": "482910377", "name": "Sky Dragon Card",
    "priceCents": 30000, "description": "Adds an extra Sky Dragon to your deck rotation." },
  { "itemKey": "613750284", "name": "Elixir Boost",
    "priceCents": 20000, "description": "Start every battle with +3 elixir." },
  { "itemKey": "749183025", "name": "Iron Guardian Card",
    "priceCents": 15000, "description": "Adds an extra Iron Guardian to your deck rotation." },
  { "itemKey": "195830472", "name": "Shrine Blessing",
    "priceCents": 25000, "description": "Your Princess Towers gain +20% health." },
  { "itemKey": "368294715", "name": "Battle Chest",
    "priceCents": 10000, "description": "200 bonus Wispcoins next match victory." }
];

const PLAYER_DATA_DEFAULTS = {
  wispcoins: 250,
  wins: 0,
  losses: 0,
  bestElixirSpent: 0,
  leaderboard: [
    { field: 'wins', label: 'Most Victories' },
    { field: 'bestElixirSpent', label: 'Most Elixir Spent' },
  ],
};

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = [];
    this.units = [];
    this.towers = [];
    this.projectiles = [];
    this.arena = null;
    this.lastTime = 0;
    this.state = 'playing'; // 'playing' | 'gameover'
    this.winner = null;
    this.matchTime = 180; // 3 minutes
    this.doubleElixirAt = 90;
    this.mouse = { x: 0, y: 0, down: false };
    this.pendingDeploy = null; // { handIndex, cardId }
    this.hoverPreview = null;
    this.shopOpen = false;
    this.rewardPending = null;
    this.isConnected = false;
    this.myPlayerIndex = -1;
    this.playerData = null;
    this.serverEntities = {};
    this.remotePlayers = {};

    // File wiring references (assets.js, Projectile.js, AI.js)
    this._assetsReady = typeof Assets !== 'undefined' && !!lib.sprite('cardBg');
    this._projectileClass = Projectile;
    this._aiClass = EnemyAI;

    this.gameConfig = {
      worldBounds: { width: 1280, height: 1600 },
      playerSpeed: 300,
      maxPlayerSpeed: 120,
      maxEntitySpeed: 100,
      entityTypes: {
        unit: { speed: 60, health: 300, behavior: 'chase', collisionGroup: 'unit', collisionRadius: 20 },
      },
      collisionRules: [],
    };

    this.setupResize();
    this.setupInput();
    this.initMatch();
    this.buildUI();
    this.start();
  }

  initMatch() {
    this.entities = [];
    this.units = [];
    this.towers = [];
    this.projectiles = [];
    this.matchTime = 180;
    this.state = 'playing';
    this.winner = null;

    // Compute arena rect (fits in canvas)
    this.rebuildArena();

    this.player = new Player('ally');
    this.enemy = new RemotePlayer('enemy');
    this.ai = new EnemyAI(this, this.enemy);

    this.entities.push(this.arena);
    this.entities.push(this.player);
    this.entities.push(this.enemy);

    this.spawnTowers();
  }

  rebuildArena() {
    const canvasW = this.canvas.width / (window.devicePixelRatio || 1);
    const canvasH = this.canvas.height / (window.devicePixelRatio || 1);
    // Reserve bottom UI strip 150px, side padding
    const uiBottom = 170;
    const uiTop = 40;
    const availableW = canvasW;
    const availableH = canvasH - uiBottom - uiTop;
    // Arena aspect roughly 3:4 (portrait)
    let arenaH = availableH;
    let arenaW = Math.min(availableW - 20, arenaH * 0.72);
    if (arenaW < 300) {
      arenaW = availableW - 20;
      arenaH = Math.min(availableH, arenaW / 0.72);
    }
    const arenaX = (canvasW - arenaW) / 2;
    const arenaY = uiTop + (availableH - arenaH) / 2;
    if (this.arena) {
      // Remove old arena from entities
      const i = this.entities.indexOf(this.arena);
      if (i !== -1) this.entities.splice(i, 1);
    }
    this.arena = new Arena(arenaX, arenaY, arenaW, arenaH);
    if (!this.entities.includes(this.arena)) this.entities.unshift(this.arena);
  }

  spawnTowers() {
    const a = this.arena;
    // Ally (bottom)
    const kingY = a.y + a.height - 90;
    const princessY = a.y + a.height - 210;
    const leftX = a.x + a.width * 0.22;
    const rightX = a.x + a.width * 0.78;
    const centerX = a.x + a.width * 0.5;
    this.towers.push(new Tower(centerX, kingY, 'ally', 'king'));
    this.towers.push(new Tower(leftX, princessY, 'ally', 'princess'));
    this.towers.push(new Tower(rightX, princessY, 'ally', 'princess'));
    // Enemy (top)
    const eKingY = a.y + 90;
    const ePrincessY = a.y + 210;
    this.towers.push(new Tower(centerX, eKingY, 'enemy', 'king'));
    this.towers.push(new Tower(leftX, ePrincessY, 'enemy', 'princess'));
    this.towers.push(new Tower(rightX, ePrincessY, 'enemy', 'princess'));
    for (const t of this.towers) this.entities.push(t);
  }

  spawnUnitsForCard(cardId, x, y, team) {
    const card = Card.get(cardId);
    const count = card.count || 1;
    if (count === 1) {
      const u = new Unit(cardId, x, y, team);
      this.units.push(u);
      this.entities.push(u);
    } else {
      // Spread horizontally
      const spread = 26;
      const startX = x - (count - 1) * spread / 2;
      for (let i = 0; i < count; i++) {
        const u = new Unit(cardId, startX + i * spread, y, team);
        this.units.push(u);
        this.entities.push(u);
      }
    }
  }

  setupResize() {
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.arena) this.rebuildArena();
      if (this.arena && this.towers.length) {
        // Reposition towers on resize
        const a = this.arena;
        const centerX = a.x + a.width * 0.5;
        const leftX = a.x + a.width * 0.22;
        const rightX = a.x + a.width * 0.78;
        const kingY = a.y + a.height - 90;
        const princessY = a.y + a.height - 210;
        const eKingY = a.y + 90;
        const ePrincessY = a.y + 210;
        const positions = {
          allyking: [centerX, kingY], allyleft: [leftX, princessY], allyright: [rightX, princessY],
          enemyking: [centerX, eKingY], enemyleft: [leftX, ePrincessY], enemyright: [rightX, ePrincessY],
        };
        const layout = ['allyking', 'allyleft', 'allyright', 'enemyking', 'enemyleft', 'enemyright'];
        for (let i = 0; i < this.towers.length && i < layout.length; i++) {
          const [tx, ty] = positions[layout[i]];
          this.towers[i].x = tx - this.towers[i].width / 2;
          this.towers[i].y = ty - this.towers[i].height / 2;
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(resize);
      ro.observe(this.canvas);
    }
  }

  setupInput() {
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', () => { this.mouse.down = false; });
    // Restart hotkey — press R to reset when the match ends
    window.addEventListener('keydown', (e) => {
      if (this.state === 'gameover' && (e.key === 'r' || e.key === 'R' || e.key === 'Enter')) {
        this.restartMatch();
      }
    });
  }

  canvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  onPointerMove(e) {
    const p = this.canvasPos(e);
    this.mouse.x = p.x;
    this.mouse.y = p.y;
  }

  onPointerDown(e) {
    const p = this.canvasPos(e);
    this.mouse.x = p.x;
    this.mouse.y = p.y;
    this.mouse.down = true;
    if (this.state !== 'playing') return;
    // If a card is selected, try to deploy
    if (this.pendingDeploy) {
      if (this.arena.canDeploy(p.x, p.y, true)) {
        const cardId = this.player.playCard(this.pendingDeploy.handIndex);
        if (cardId) {
          this.spawnUnitsForCard(cardId, p.x, p.y, 'ally');
          // Multiplayer: notify server of the deploy action (stub for future turns)
          if (this.isConnected && window.Multiplayer && Multiplayer.requestAction) {
            Multiplayer.requestAction('deploy', { cardId: cardId, x: p.x, y: p.y });
          }
        }
      }
      this.pendingDeploy = null;
    }
  }

  handleCardClick(handIndex) {
    if (this.state !== 'playing') return;
    if (!this.player.canPlay(handIndex)) return;
    if (this.pendingDeploy && this.pendingDeploy.handIndex === handIndex) {
      this.pendingDeploy = null;
    } else {
      this.pendingDeploy = { handIndex, cardId: this.player.hand[handIndex] };
    }
  }

  update(dt) {
    if (this.state === 'playing') {
      this.matchTime -= dt;
      if (this.matchTime <= 0) {
        this.matchTime = 0;
        this.checkVictory(true);
      }
      // Double elixir
      const doubling = this.matchTime <= this.doubleElixirAt;
      const baseRate = 1 / 2.8;
      this.player.elixirRate = doubling ? baseRate * 2 : baseRate;
      this.enemy.elixirRate = doubling ? baseRate * 2 : baseRate;

      this.player.update(dt);
      this.enemy.update(dt);
      this.ai.update(dt);

      for (const u of this.units) u.update(dt, this);
      for (const t of this.towers) t.update(dt, this);
      for (const pr of this.projectiles) pr.update(dt, this);

      // Cleanup dead units/projectiles
      this.units = this.units.filter((u) => {
        if (u.hp <= 0) {
          const i = this.entities.indexOf(u);
          if (i !== -1) this.entities.splice(i, 1);
          return false;
        }
        return true;
      });
      this.projectiles = this.projectiles.filter((p) => p.alive);

      // Activate king if same-side princess falls
      for (const t of this.towers) {
        if (t.kind === 'princess' && t.hp <= 0) {
          const king = this.towers.find((k) => k.kind === 'king' && k.team === t.team);
          if (king) king.activated = true;
        }
      }

      this.checkVictory(false);
    }

    // Multiplayer input heartbeat (server-authoritative wiring stub)
    if (this.isConnected && window.Multiplayer && Multiplayer.sendInput) {
      Multiplayer.sendInput({ dx: 0, dy: 0, keys: {} });
    }

    this.updateUI();
  }

  checkVictory(timeout) {
    const allyKing = this.towers.find((t) => t.team === 'ally' && t.kind === 'king');
    const enemyKing = this.towers.find((t) => t.team === 'enemy' && t.kind === 'king');
    if (enemyKing && enemyKing.hp <= 0) return this.endMatch('ally');
    if (allyKing && allyKing.hp <= 0) return this.endMatch('enemy');
    if (timeout) {
      // Compare tower kills
      const allyDown = this.towers.filter((t) => t.team === 'ally' && t.hp <= 0).length;
      const enemyDown = this.towers.filter((t) => t.team === 'enemy' && t.hp <= 0).length;
      if (enemyDown > allyDown) this.endMatch('ally');
      else if (allyDown > enemyDown) this.endMatch('enemy');
      else this.endMatch('draw');
    }
  }

  async endMatch(winner) {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.winner = winner;
    const reward = winner === 'ally' ? 120 : (winner === 'draw' ? 40 : 10);
    this.player.wispcoins += reward;
    this.rewardPending = reward;
    // Persist wins/losses/coins
    if (this.playerData && window.SaveData) {
      this.playerData.wispcoins = this.player.wispcoins;
      if (winner === 'ally') this.playerData.wins = (this.playerData.wins || 0) + 1;
      if (winner === 'enemy') this.playerData.losses = (this.playerData.losses || 0) + 1;
      try { await SaveData.setPlayerData(this.playerData); } catch (e) {}
    }
    if (this.gameOverTitle) {
      this.gameOverTitle.set(winner === 'ally' ? 'VICTORY!' : (winner === 'draw' ? 'DRAW' : 'DEFEAT'));
      this.gameOverTitle.setColor(winner === 'ally' ? '#4ade80' : (winner === 'draw' ? '#fbbf24' : '#f87171'));
      this.gameOverReward.set('+' + reward + ' Wispcoins');
      UI.showGroup('gameover');
    }
  }

  restartMatch() {
    UI.hideGroup('gameover');
    this.initMatch();
    UI.showGroup('hud');
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, w, h);

    // Arena + towers + units + projectiles
    if (this.arena) this.arena.draw(ctx);

    // Sort towers + units by y for proper depth
    const drawable = [...this.towers, ...this.units].filter((o) => true);
    drawable.sort((a, b) => (a.y + a.height) - (b.y + b.height));
    for (const o of drawable) o.draw(ctx);

    for (const p of this.projectiles) p.draw(ctx);

    // Deploy zone overlay when placing a card
    if (this.pendingDeploy && this.arena) {
      const a = this.arena;
      const midY = a.riverY + a.riverH / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(74, 222, 128, 0.10)';
      ctx.fillRect(a.x, midY + 6, a.width, a.y + a.height - (midY + 6));
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(a.x + 2, midY + 8, a.width - 4, a.y + a.height - (midY + 10));
      ctx.setLineDash([]);
      ctx.restore();

      // Preview at mouse
      const cardId = this.pendingDeploy.cardId;
      const card = Card.get(cardId);
      const canDrop = a.canDeploy(this.mouse.x, this.mouse.y, true);
      ctx.save();
      ctx.globalAlpha = canDrop ? 0.75 : 0.35;
      const sprite = lib.sprite(card.spriteId);
      if (sprite) {
        const size = card.size;
        ctx.drawImage(sprite, this.mouse.x - size / 2, this.mouse.y - size / 2, size, size);
        if (card.count > 1) {
          for (let i = 1; i < card.count; i++) {
            ctx.drawImage(sprite, this.mouse.x - size / 2 + i * 26, this.mouse.y - size / 2, size, size);
          }
        }
      }
      ctx.restore();

      // Red X if invalid
      if (!canDrop) {
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.mouse.x - 14, this.mouse.y - 14);
        ctx.lineTo(this.mouse.x + 14, this.mouse.y + 14);
        ctx.moveTo(this.mouse.x + 14, this.mouse.y - 14);
        ctx.lineTo(this.mouse.x - 14, this.mouse.y + 14);
        ctx.stroke();
      }
    }
  }

  // --- UI ---
  buildUI() {
    // HUD group
    this.timerLabel = UI.label({
      group: 'hud', anchor: 'top', y: 8,
      text: '3:00', color: '#fff', fontSize: 22, fontWeight: '700',
      style: { textShadow: '0 2px 6px rgba(0,0,0,0.7)' },
    });

    this.coinsLabel = UI.label({
      group: 'hud', anchor: 'top-right', x: 12, y: 8,
      text: '💰 250 Wispcoins', color: '#ffd700', fontSize: 16, fontWeight: '600',
      style: { textShadow: '0 2px 6px rgba(0,0,0,0.7)' },
    });

    this.shopBtn = UI.button({
      group: 'hud', anchor: 'top-left', x: 12, y: 8,
      text: '🛒 Shop', width: 96, height: 36,
      background: 'linear-gradient(180deg,#ffcf5f,#c98a1e)',
      color: '#3a1a00', borderRadius: 10,
      style: { fontWeight: '700', border: '2px solid #7a4a00' },
      onClick: () => this.toggleShop(),
    });

    // Elixir bar (bottom)
    this.elixirBar = UI.bar({
      group: 'hud', anchor: 'bottom', y: 150, width: '80%', height: 20,
      value: 0.5, color: '#c026d3',
      style: { border: '2px solid #4a044e', borderRadius: '6px', background: 'rgba(0,0,0,0.6)', maxWidth: '640px' },
    });
    this.elixirLabel = UI.label({
      group: 'hud', anchor: 'bottom', y: 152, text: '5 / 10',
      color: '#fff', fontSize: 14, fontWeight: '700',
      style: { textShadow: '0 1px 3px rgba(0,0,0,0.9)', pointerEvents: 'none' },
    });

    // Hand — 4 card slots
    this.handSlots = [];
    const slotWidth = 90;
    const slotHeight = 120;
    const gap = 8;
    const totalW = 4 * slotWidth + 3 * gap;
    const startOffset = -(totalW / 2) + slotWidth / 2;
    for (let i = 0; i < 4; i++) {
      const xOffset = startOffset + i * (slotWidth + gap);
      const btn = UI.button({
        group: 'hud', anchor: 'bottom', x: xOffset, y: 16,
        text: '', width: slotWidth, height: slotHeight,
        background: 'linear-gradient(180deg,#e9c9ff,#8b5cf6)',
        color: '#1a0033', borderRadius: 10,
        style: {
          border: '3px solid #4a044e', padding: '4px', fontSize: '11px',
          fontWeight: '700', textAlign: 'center', lineHeight: '1.1',
          boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
          whiteSpace: 'pre-line',
        },
        onClick: () => this.handleCardClick(i),
      });
      this.handSlots.push(btn);
    }
    // Next card indicator (leftmost, above hand)
    this.nextLabel = UI.label({
      group: 'hud', anchor: 'bottom-left', x: 12, y: 140,
      text: 'Next:', color: '#fff', fontSize: 12, fontWeight: '600',
      style: { textShadow: '0 1px 3px rgba(0,0,0,0.9)' },
    });
    this.nextCard = UI.label({
      group: 'hud', anchor: 'bottom-left', x: 12, y: 20,
      text: '', width: 90, height: 100,
      color: '#1a0033', fontSize: 11, fontWeight: '700', textAlign: 'center',
      background: 'linear-gradient(180deg,#c4b5fd,#7c3aed)',
      style: {
        border: '2px solid #4a044e', borderRadius: '8px', padding: '4px',
        lineHeight: '1.1', whiteSpace: 'pre-line',
      },
    });

    // Game over group
    UI.panel({
      group: 'gameover', anchor: 'center', width: 420, height: 300,
      background: 'linear-gradient(180deg,#1e1b4b,#4c1d95)',
      style: { border: '3px solid #ffd700', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)' },
      visible: false,
    });
    this.gameOverTitle = UI.label({
      group: 'gameover', anchor: 'center', y: -90,
      text: 'VICTORY!', color: '#4ade80', fontSize: 48, fontWeight: '800',
      style: { textShadow: '0 4px 12px rgba(0,0,0,0.8)' }, visible: false,
    });
    this.gameOverReward = UI.label({
      group: 'gameover', anchor: 'center', y: -20,
      text: '+120 Wispcoins', color: '#ffd700', fontSize: 22, fontWeight: '700',
      visible: false,
    });
    UI.button({
      group: 'gameover', anchor: 'center', y: 60,
      text: 'Play Again', width: 220, height: 56,
      background: 'linear-gradient(180deg,#22d3ee,#0891b2)',
      color: '#062028', borderRadius: 12,
      style: { fontWeight: '800', fontSize: '1.1rem', border: '2px solid #164e63' },
      onClick: () => this.restartMatch(),
      visible: false,
    });

    // Shop group
    UI.panel({
      group: 'shop', anchor: 'center', width: 520, height: 460,
      background: 'linear-gradient(180deg,#2a1a4a,#0f0a1e)',
      style: {
        border: '3px solid #ffd700', borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.7)', maxWidth: '92%', maxHeight: '92%',
      },
      visible: false,
    });
    UI.label({
      group: 'shop', anchor: 'center', y: -200, text: '🛒 Anime Clash Shop',
      color: '#ffd700', fontSize: 24, fontWeight: '800',
      style: { textShadow: '0 2px 6px rgba(0,0,0,0.8)' }, visible: false,
    });
    this.shopCoinsLabel = UI.label({
      group: 'shop', anchor: 'center', y: -168,
      text: '💰 250 Wispcoins', color: '#fbbf24', fontSize: 14, fontWeight: '600',
      visible: false,
    });

    // Shop items (5 items, 2 columns)
    const shopItems = [
      { key: 'dragon_card', name: 'Extra Dragon', desc: 'Adds Sky Dragon to deck', price: 350, action: () => { this.player.addCardToDeck('dragon'); this.showToast('Sky Dragon added to deck!'); } },
      { key: 'tank_card', name: 'Extra Guardian', desc: 'Adds Iron Guardian to deck', price: 200, action: () => { this.player.addCardToDeck('tank'); this.showToast('Iron Guardian added!'); } },
      { key: 'elixir_boost', name: 'Elixir Boost', desc: '+3 starting elixir', price: 250, action: () => { this.player.elixir = Math.min(this.player.maxElixir, this.player.elixir + 3); this.showToast('+3 Elixir!'); } },
      { key: 'tower_hp', name: 'Shrine Blessing', desc: '+300 HP to your towers', price: 300, action: () => { this.towers.filter(t => t.team === 'ally').forEach(t => { t.maxHp += 300; t.hp = Math.min(t.maxHp, t.hp + 300); }); this.showToast('Towers reinforced!'); } },
      { key: 'heal_now', name: 'Full Repair', desc: 'Restore all your towers', price: 400, action: () => { this.towers.filter(t => t.team === 'ally').forEach(t => { t.hp = t.maxHp; }); this.showToast('Towers fully healed!'); } },
    ];
    this.shopButtons = [];
    for (let i = 0; i < shopItems.length; i++) {
      const item = shopItems[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const btnW = 220;
      const btnH = 78;
      const xOff = (col === 0 ? -114 : 114);
      const yOff = -110 + row * (btnH + 12);
      const btn = UI.button({
        group: 'shop', anchor: 'center', x: xOff, y: yOff,
        text: '', width: btnW, height: btnH,
        background: 'linear-gradient(180deg,#4c1d95,#1e1b4b)',
        color: '#fff', borderRadius: 10,
        style: {
          border: '2px solid #ffd700', padding: '6px',
          fontSize: '12px', textAlign: 'left', fontWeight: '600',
          whiteSpace: 'pre-line', lineHeight: '1.3',
        },
        onClick: () => this.buyShopItem(item),
        visible: false,
      });
      btn._item = item;
      this.shopButtons.push(btn);
    }
    UI.button({
      group: 'shop', anchor: 'center', y: 200, text: 'Close',
      width: 160, height: 42,
      background: 'linear-gradient(180deg,#f87171,#991b1b)',
      color: '#fff', borderRadius: 10,
      style: { fontWeight: '700', border: '2px solid #7f1d1d' },
      onClick: () => this.toggleShop(),
      visible: false,
    });

    // Toast
    this.toastLabel = UI.label({
      group: 'toast', anchor: 'top', y: 60,
      text: '', color: '#fff', fontSize: 18, fontWeight: '700',
      background: 'rgba(0,0,0,0.75)',
      style: {
        padding: '10px 20px', borderRadius: '10px',
        border: '2px solid #ffd700', transition: 'opacity 0.3s',
      },
      visible: false,
    });

    UI.showGroup('hud');
  }

  showToast(text) {
    if (!this.toastLabel) return;
    this.toastLabel.set(text);
    this.toastLabel.show();
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastLabel.hide(), 1800);
  }

  toggleShop() {
    this.shopOpen = !this.shopOpen;
    if (this.shopOpen) {
      UI.showGroup('shop');
      this.refreshShopUI();
    } else {
      UI.hideGroup('shop');
    }
  }

  refreshShopUI() {
    if (this.shopCoinsLabel) this.shopCoinsLabel.set('💰 ' + this.player.wispcoins + ' Wispcoins');
    for (const btn of this.shopButtons) {
      const it = btn._item;
      const canAfford = this.player.wispcoins >= it.price;
      btn.set(it.name + '\n' + it.desc + '\n💰 ' + it.price);
      btn.update({
        background: canAfford
          ? 'linear-gradient(180deg,#4c1d95,#1e1b4b)'
          : 'linear-gradient(180deg,#3a3a4a,#1a1a2a)',
        style: {
          border: canAfford ? '2px solid #ffd700' : '2px solid #555',
          padding: '6px', fontSize: '12px', textAlign: 'left',
          fontWeight: '600', whiteSpace: 'pre-line', lineHeight: '1.3',
          opacity: canAfford ? '1' : '0.6',
          cursor: canAfford ? 'pointer' : 'not-allowed',
        },
      });
    }
  }

  async buyShopItem(item) {
    if (this.player.wispcoins < item.price) {
      this.showToast('Not enough Wispcoins!');
      return;
    }
    this.player.wispcoins -= item.price;
    item.action();
    if (this.playerData && window.SaveData) {
      this.playerData.wispcoins = this.player.wispcoins;
      try { await SaveData.setPlayerData(this.playerData); } catch (e) {}
    }
    this.refreshShopUI();
  }

  updateUI() {
    // Timer
    const total = Math.max(0, Math.floor(this.matchTime));
    const m = Math.floor(total / 60);
    const s = total % 60;
    const doubling = this.matchTime <= this.doubleElixirAt;
    const timerText = m + ':' + (s < 10 ? '0' : '') + s + (doubling ? ' ⚡x2' : '');
    if (this.timerLabel) this.timerLabel.set(timerText);

    // Elixir
    if (this.elixirBar) this.elixirBar.setValue(this.player.elixir / this.player.maxElixir);
    if (this.elixirLabel) this.elixirLabel.set(Math.floor(this.player.elixir) + ' / ' + this.player.maxElixir);

    // Coins
    if (this.coinsLabel) this.coinsLabel.set('💰 ' + this.player.wispcoins + ' Wispcoins');

    // Hand
    for (let i = 0; i < 4; i++) {
      const cardId = this.player.hand[i];
      const btn = this.handSlots[i];
      if (!btn) continue;
      if (!cardId) {
        btn.set('');
        continue;
      }
      const card = Card.get(cardId);
      const affordable = this.player.elixir >= card.cost;
      const selected = this.pendingDeploy && this.pendingDeploy.handIndex === i;
      btn.set(card.name + '\n💧 ' + card.cost);
      btn.update({
        background: selected
          ? 'linear-gradient(180deg,#fef08a,#facc15)'
          : (affordable ? 'linear-gradient(180deg,#e9c9ff,#8b5cf6)' : 'linear-gradient(180deg,#4a4a5a,#2a2a3a)'),
        color: affordable ? '#1a0033' : '#888',
        style: {
          border: selected ? '3px solid #fbbf24' : '3px solid #4a044e',
          padding: '4px', fontSize: '11px', fontWeight: '700',
          textAlign: 'center', lineHeight: '1.1', whiteSpace: 'pre-line',
          boxShadow: selected
            ? '0 0 16px rgba(251,191,36,0.9)'
            : '0 4px 8px rgba(0,0,0,0.4)',
          opacity: affordable ? '1' : '0.75',
          cursor: affordable ? 'pointer' : 'not-allowed',
        },
      });
    }
    // Next
    if (this.nextCard && this.player.next) {
      const nc = Card.get(this.player.next);
      this.nextCard.set(nc.name + '\n💧 ' + nc.cost);
    }
  }

  async start() {
    // Load saved player data
    if (window.SaveData) {
      try {
        this.playerData = await SaveData.getPlayerData(PLAYER_DATA_DEFAULTS);
        if (this.playerData && this.player) {
          this.player.wispcoins = this.playerData.wispcoins != null ? this.playerData.wispcoins : 250;
        }
      } catch (e) { /* offline fallback */ }
    }
    // Connect multiplayer (stub — full sync arrives in a later turn)
    try {
      if (window.Multiplayer && Multiplayer.connect) {
        await Multiplayer.connect();
        this.isConnected = true;
        this.myPlayerIndex = Multiplayer.getMyPlayerIndex();
        Multiplayer.registerGameConfig(this.gameConfig);
        const existing = Multiplayer.getPlayers ? Multiplayer.getPlayers() : [];
        for (const p of existing) this.remotePlayers[p.id] = p;
        Multiplayer.onPlayerJoin((p) => {
          this.remotePlayers[p.id] = p;
          const badge = document.getElementById('solo-badge');
          if (badge) badge.style.display = 'none';
        });
        Multiplayer.onPlayerLeave((d) => { delete this.remotePlayers[d.id]; });
        Multiplayer.onStateSync((state) => {
          const seen = new Set();
          (state.entities || []).forEach((e) => {
            seen.add(e.id);
            if (!this.serverEntities[e.id]) this.serverEntities[e.id] = { id: e.id, x: e.x, y: e.y, type: e.type };
            else { this.serverEntities[e.id].x = e.x; this.serverEntities[e.id].y = e.y; }
          });
          Object.keys(this.serverEntities).forEach((id) => { if (!seen.has(id)) delete this.serverEntities[id]; });
        });
        Multiplayer.onActionResult((r) => { /* cosmetics hook */ });
      }
    } catch (e) { /* offline fallback */ }

    const loop = (t) => {
      const dt = Math.min(0.05, (t - this.lastTime) / 1000 || 0);
      this.lastTime = t;
      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
