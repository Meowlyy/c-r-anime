// A deployed anime character on the battlefield.
class Unit extends GameObject {
  constructor(cardId, x, y, team) {
    const card = Card.get(cardId);
    const size = card.size;
    super(x - size / 2, y - size / 2, size, size);
    this.name = card.name;
    this.cardId = cardId;
    this.card = card;
    this.team = team; // 'ally' or 'enemy'
    this.hp = card.hp;
    this.maxHp = card.hp;
    this.damage = card.damage;
    this.speed = card.speed;
    this.range = card.range;
    this.attackSpeed = card.attackSpeed;
    this.attackCooldown = 0;
    this.target = null;
    this.projectiles = [];
    this.spriteId = team === 'ally' ? card.spriteId : card.enemySpriteId;
    this.deployPulse = 0.6;
    this.hurtFlash = 0;
  }

  findTarget(game) {
    const candidates = [];
    for (const u of game.units) {
      if (u.team === this.team || u.hp <= 0) continue;
      candidates.push(u);
    }
    for (const t of game.towers) {
      if (t.team === this.team || t.hp <= 0) continue;
      candidates.push(t);
    }
    let best = null;
    let bestDist = Infinity;
    for (const c of candidates) {
      const dx = c.cx - this.cx;
      const dy = c.cy - this.cy;
      const d = Math.hypot(dx, dy);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  }

  findHealTarget(game) {
    let best = null;
    let bestScore = 0;
    for (const u of game.units) {
      if (u.team !== this.team || u === this || u.hp <= 0) continue;
      if (u.hp >= u.maxHp) continue;
      const missing = u.maxHp - u.hp;
      const dx = u.cx - this.cx;
      const dy = u.cy - this.cy;
      const d = Math.hypot(dx, dy);
      if (d > this.range * 1.5) continue;
      const score = missing / (1 + d * 0.01);
      if (score > bestScore) {
        bestScore = score;
        best = u;
      }
    }
    return best;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hurtFlash = 0.2;
    if (this.hp < 0) this.hp = 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  update(dt, game) {
    if (this.hp <= 0) return;
    if (this.deployPulse > 0) this.deployPulse -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    this.attackCooldown -= dt;

    // Healers prioritize wounded allies, fall back to attacking.
    if (this.card.isHealer) {
      const healTarget = this.findHealTarget(game);
      if (healTarget) {
        const dx = healTarget.cx - this.cx;
        const dy = healTarget.cy - this.cy;
        const dist = Math.hypot(dx, dy);
        if (dist > this.range * 0.8) {
          this.x += (dx / dist) * this.speed * dt;
          this.y += (dy / dist) * this.speed * dt;
        } else if (this.attackCooldown <= 0) {
          this.attackCooldown = this.attackSpeed;
          // Emit heal orb
          game.projectiles.push(new Projectile(this.cx, this.cy, healTarget, -30, this.team, 'magicOrb', true));
        }
        return;
      }
    }

    // Validate target
    if (!this.target || this.target.hp <= 0) {
      this.target = this.findTarget(game);
    }

    if (!this.target) return;

    const tx = this.target.cx;
    const ty = this.target.cy;
    const dx = tx - this.cx;
    const dy = ty - this.cy;
    const dist = Math.hypot(dx, dy);

    // Compute the effective distance to the target's edge (for large towers)
    const targetRadius = Math.max(this.target.width, this.target.height) / 2;
    const edgeDist = dist - targetRadius;

    if (edgeDist > this.range) {
      // Move toward target
      // Simple lane-hugging: bias toward the bridge if we haven't crossed yet.
      const arena = game.arena;
      let targetX = tx;
      let targetY = ty;
      if (arena) {
        const crossing = arena.needsBridge(this.cy, this.target.cy);
        if (crossing) {
          const bridge = arena.nearestBridge(this.cx);
          targetX = bridge.x;
          targetY = bridge.y;
        }
      }
      const mdx = targetX - this.cx;
      const mdy = targetY - this.cy;
      const mdist = Math.hypot(mdx, mdy) || 1;
      // Repulsion from other allies to avoid stacking
      let repX = 0, repY = 0;
      for (const u of game.units) {
        if (u === this || u.team !== this.team || u.hp <= 0) continue;
        const rdx = this.cx - u.cx;
        const rdy = this.cy - u.cy;
        const rd = Math.hypot(rdx, rdy);
        const minDist = (this.width + u.width) / 2;
        if (rd < minDist && rd > 0.1) {
          const push = (minDist - rd) / minDist;
          repX += (rdx / rd) * push * 20;
          repY += (rdy / rd) * push * 20;
        }
      }
      let vx = (mdx / mdist) * this.speed + repX;
      let vy = (mdy / mdist) * this.speed + repY;
      this.x += vx * dt;
      this.y += vy * dt;
      // Clamp to arena
      if (arena) {
        this.x = Math.max(arena.x + 4, Math.min(arena.x + arena.width - this.width - 4, this.x));
        this.y = Math.max(arena.y + 4, Math.min(arena.y + arena.height - this.height - 4, this.y));
      }
    } else {
      // Attack
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.attackSpeed;
        if (this.card.projectileSprite) {
          game.projectiles.push(new Projectile(this.cx, this.cy, this.target, this.damage, this.team, this.card.projectileSprite, false, this.card.splashRadius));
        } else {
          // Melee — instant damage
          this.target.takeDamage(this.damage);
          if (this.card.splashRadius > 0) {
            for (const u of game.units) {
              if (u.team === this.team || u === this.target || u.hp <= 0) continue;
              const ddx = u.cx - this.target.cx;
              const ddy = u.cy - this.target.cy;
              if (Math.hypot(ddx, ddy) < this.card.splashRadius) u.takeDamage(this.damage * 0.6);
            }
          }
        }
      }
    }
  }

  draw(ctx) {
    if (this.hp <= 0) return;
    ctx.save();
    if (this.deployPulse > 0) {
      ctx.globalAlpha = 0.5 + 0.5 * (1 - this.deployPulse / 0.6);
      const scale = 1 + this.deployPulse * 0.6;
      ctx.translate(this.cx, this.cy);
      ctx.scale(scale, scale);
      ctx.translate(-this.cx, -this.cy);
    }
    if (this.hurtFlash > 0) {
      ctx.filter = 'brightness(2.2)';
    }
    const sprite = lib.sprite(this.spriteId);
    if (sprite) ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
    ctx.restore();

    // HP bar
    const barW = this.width + 4;
    const barH = 4;
    const barX = this.x - 2;
    const barY = this.y - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX, barY, barW, barH);
    const pct = this.hp / this.maxHp;
    ctx.fillStyle = this.team === 'ally' ? '#4ade80' : '#f87171';
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }
}
