// A defensive tower — the game's core objective. Destroy the king to win.
class Tower extends GameObject {
  constructor(x, y, team, kind) {
    const w = kind === 'king' ? 90 : 70;
    const h = kind === 'king' ? 110 : 90;
    super(x - w / 2, y - h / 2, w, h);
    this.name = kind === 'king' ? 'King Tower' : 'Princess Tower';
    this.team = team;
    this.kind = kind;
    this.maxHp = kind === 'king' ? 2400 : 1400;
    this.hp = this.maxHp;
    this.damage = kind === 'king' ? 90 : 70;
    this.range = 210;
    this.attackSpeed = 0.9;
    this.attackCooldown = 0;
    this.target = null;
    this.spriteId = team === 'ally' ? 'tower_ally' : 'tower_enemy';
    this.activated = kind !== 'king'; // King only wakes when hit or side princess dies
    this.hurtFlash = 0;
  }

  activate() { this.activated = true; }

  takeDamage(amount) {
    this.hp -= amount;
    this.hurtFlash = 0.2;
    if (this.hp < 0) this.hp = 0;
    this.activate();
  }

  findTarget(game) {
    let best = null;
    let bestDist = Infinity;
    for (const u of game.units) {
      if (u.team === this.team || u.hp <= 0) continue;
      const dx = u.cx - this.cx;
      const dy = u.cy - this.cy;
      const d = Math.hypot(dx, dy);
      if (d < this.range && d < bestDist) {
        bestDist = d;
        best = u;
      }
    }
    return best;
  }

  update(dt, game) {
    if (this.hp <= 0) return;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (!this.activated) return;
    this.attackCooldown -= dt;
    if (!this.target || this.target.hp <= 0) this.target = this.findTarget(game);
    if (!this.target) return;
    const dx = this.target.cx - this.cx;
    const dy = this.target.cy - this.cy;
    if (Math.hypot(dx, dy) > this.range) {
      this.target = null;
      return;
    }
    if (this.attackCooldown <= 0) {
      this.attackCooldown = this.attackSpeed;
      game.projectiles.push(new Projectile(this.cx, this.cy - 10, this.target, this.damage, this.team, 'arrow', false));
    }
  }

  draw(ctx) {
    ctx.save();
    if (this.hurtFlash > 0) ctx.filter = 'brightness(1.8)';
    const sprite = lib.sprite(this.spriteId);
    if (sprite) ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
    ctx.restore();

    if (this.hp <= 0) {
      // Draw rubble tint
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      return;
    }

    // HP bar
    const barW = this.width;
    const barH = 8;
    const barX = this.x;
    const barY = this.y - 14;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(barX, barY, barW, barH);
    const pct = this.hp / this.maxHp;
    ctx.fillStyle = this.team === 'ally' ? '#4ade80' : '#f87171';
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Range ring (subtle, only when activated + has target)
    if (this.activated && this.target) {
      ctx.strokeStyle = this.team === 'ally' ? 'rgba(255,105,180,0.15)' : 'rgba(59,130,246,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
