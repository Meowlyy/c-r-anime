// Enemy AI controller — reacts to game state to spend elixir wisely.
class EnemyAI {
  constructor(game, controller) {
    this.game = game;
    this.controller = controller; // RemotePlayer
    this.thinkCooldown = 1.5;
    this.aggression = 0.5; // 0..1 — higher = more likely to push
  }

  update(dt) {
    this.thinkCooldown -= dt;
    if (this.thinkCooldown > 0) return;
    this.thinkCooldown = 0.8 + Math.random() * 1.4;
    this.decide();
  }

  decide() {
    const p = this.controller;
    const g = this.game;

    // Count threats in enemy half (top of arena is enemy side)
    const arena = g.arena;
    if (!arena) return;
    const midY = arena.riverY + arena.riverH / 2;

    let allyPushCount = 0;
    let allyPushX = 0;
    let allyHeaviest = null;
    for (const u of g.units) {
      if (u.team !== 'ally' || u.hp <= 0) continue;
      if (u.cy < midY + 40) {
        allyPushCount++;
        allyPushX += u.cx;
        if (!allyHeaviest || u.maxHp > allyHeaviest.maxHp) allyHeaviest = u;
      }
    }

    // Playable cards (affordable, sorted by cost desc for value plays)
    const affordable = [];
    for (let i = 0; i < p.hand.length; i++) {
      const cardId = p.hand[i];
      if (!cardId) continue;
      const card = Card.get(cardId);
      if (p.elixir >= card.cost) affordable.push({ i, cardId, card });
    }
    if (affordable.length === 0) return;

    // Defensive play: enemy pushing near our side of the river
    if (allyPushCount > 0 && p.elixir >= 3) {
      // Pick a defender (cheapest with decent damage)
      affordable.sort((a, b) => a.card.cost - b.card.cost);
      const pick = affordable[0];
      const avgX = allyPushX / allyPushCount;
      // Deploy just above the river on the same lane
      const deployX = Math.max(arena.x + 40, Math.min(arena.x + arena.width - 40, avgX));
      const deployY = arena.riverY - 50 - Math.random() * 30;
      this.deploy(pick, deployX, deployY);
      return;
    }

    // Offensive play: cycle at 6+ elixir
    if (p.elixir >= 6) {
      // Prefer high-value plays
      affordable.sort((a, b) => b.card.cost - a.card.cost);
      // 60% chance to commit to a push
      if (Math.random() < 0.65) {
        const pick = affordable[0];
        // Deploy at back for tanks, front for support
        const lane = Math.random() < 0.5 ? 0.22 : 0.78;
        const deployX = arena.x + arena.width * lane + (Math.random() - 0.5) * 60;
        const deployY = pick.card.hp > 500
          ? arena.y + 40 + Math.random() * 30
          : arena.y + 100 + Math.random() * 40;
        this.deploy(pick, deployX, deployY);
        return;
      }
    }

    // Chip/cycle: low elixir, cheap card behind king
    if (p.elixir >= 8) {
      affordable.sort((a, b) => a.card.cost - b.card.cost);
      const pick = affordable[0];
      const deployX = arena.x + arena.width * 0.5 + (Math.random() - 0.5) * 120;
      const deployY = arena.y + 60 + Math.random() * 40;
      this.deploy(pick, deployX, deployY);
    }
  }

  deploy(pick, x, y) {
    const arena = this.game.arena;
    // Ensure in enemy half
    const midY = arena.riverY + arena.riverH / 2;
    y = Math.min(midY - 10, Math.max(arena.y + 20, y));
    x = Math.max(arena.x + 30, Math.min(arena.x + arena.width - 30, x));
    const cardId = this.controller.playCardAt(pick.i);
    if (!cardId) return;
    this.game.spawnUnitsForCard(cardId, x, y, 'enemy');
  }
}
