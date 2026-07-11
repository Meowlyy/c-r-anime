class Projectile extends GameObject {
  constructor(x, y, target, damage, team, spriteId, isHeal, splashRadius) {
    super(x - 6, y - 6, 12, 12);
    this.name = 'Projectile';
    this.target = target;
    this.damage = damage;
    this.team = team;
    this.spriteId = spriteId || 'arrow';
    this.isHeal = !!isHeal;
    this.splashRadius = splashRadius || 0;
    this.speed = 380;
    this.alive = true;
    this.rotation = 0;
  }

  update(dt, game) {
    if (!this.alive) return;
    if (!this.target || this.target.hp <= 0) {
      this.alive = false;
      return;
    }
    const dx = this.target.cx - this.cx;
    const dy = this.target.cy - this.cy;
    const d = Math.hypot(dx, dy);
    this.rotation = Math.atan2(dy, dx);
    if (d < 12) {
      // Hit
      if (this.isHeal) {
        if (this.target.heal) this.target.heal(-this.damage);
      } else {
        this.target.takeDamage(this.damage);
        if (this.splashRadius > 0) {
          for (const u of game.units) {
            if (u.team === this.team || u === this.target || u.hp <= 0) continue;
            const ddx = u.cx - this.target.cx;
            const ddy = u.cy - this.target.cy;
            if (Math.hypot(ddx, ddy) < this.splashRadius) u.takeDamage(this.damage * 0.55);
          }
        }
      }
      this.alive = false;
      return;
    }
    const vx = (dx / d) * this.speed;
    const vy = (dy / d) * this.speed;
    this.x += vx * dt;
    this.y += vy * dt;
  }

  draw(ctx) {
    if (!this.alive) return;
    const sprite = lib.sprite(this.spriteId);
    if (!sprite) return;
    ctx.save();
    ctx.translate(this.cx, this.cy);
    if (this.spriteId === 'arrow') ctx.rotate(this.rotation);
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    ctx.restore();
  }
}
