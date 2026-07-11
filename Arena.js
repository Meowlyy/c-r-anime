// Renders the battlefield (grass, river, bridges, deploy zones).
class Arena extends GameObject {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.name = 'Arena';
    // River runs horizontally across the middle.
    this.riverY = y + height / 2 - 22;
    this.riverH = 44;
    // Two bridges
    this.bridgeW = 70;
    this.bridgeLX = x + width * 0.22 - this.bridgeW / 2;
    this.bridgeRX = x + width * 0.78 - this.bridgeW / 2;
  }

  isRiver(x, y) {
    return y >= this.riverY && y <= this.riverY + this.riverH &&
      !(x >= this.bridgeLX && x <= this.bridgeLX + this.bridgeW) &&
      !(x >= this.bridgeRX && x <= this.bridgeRX + this.bridgeW);
  }

  isAllyHalf(y) { return y > this.riverY + this.riverH / 2; }

  needsBridge(fromY, toY) {
    return (fromY < this.riverY && toY > this.riverY + this.riverH) ||
           (fromY > this.riverY + this.riverH && toY < this.riverY);
  }

  nearestBridge(x) {
    const lx = this.bridgeLX + this.bridgeW / 2;
    const rx = this.bridgeRX + this.bridgeW / 2;
    const by = this.riverY + this.riverH / 2;
    if (Math.abs(x - lx) < Math.abs(x - rx)) return { x: lx, y: by };
    return { x: rx, y: by };
  }

  canDeploy(x, y, isAlly) {
    if (x < this.x || x > this.x + this.width || y < this.y || y > this.y + this.height) return false;
    if (this.isRiver(x, y)) return false;
    // Only deploy on your own half (below the river center for ally)
    const midY = this.riverY + this.riverH / 2;
    if (isAlly && y < midY + 6) return false;
    if (!isAlly && y > midY - 6) return false;
    return true;
  }

  draw(ctx) {
    // Grass background — enemy top (blue tint) / ally bottom (pink tint)
    const midY = this.riverY + this.riverH / 2;
    const gradTop = ctx.createLinearGradient(0, this.y, 0, midY);
    gradTop.addColorStop(0, '#3b4a7a');
    gradTop.addColorStop(1, '#4a6b8a');
    ctx.fillStyle = gradTop;
    ctx.fillRect(this.x, this.y, this.width, midY - this.y);

    const gradBot = ctx.createLinearGradient(0, midY, 0, this.y + this.height);
    gradBot.addColorStop(0, '#6a8a4a');
    gradBot.addColorStop(1, '#4a7a3a');
    ctx.fillStyle = gradBot;
    ctx.fillRect(this.x, midY, this.width, this.height - (midY - this.y));

    // Grid-ish pattern
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let gx = this.x; gx < this.x + this.width; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, this.y);
      ctx.lineTo(gx, this.y + this.height);
      ctx.stroke();
    }
    for (let gy = this.y; gy < this.y + this.height; gy += 32) {
      ctx.beginPath();
      ctx.moveTo(this.x, gy);
      ctx.lineTo(this.x + this.width, gy);
      ctx.stroke();
    }

    // River
    const river = ctx.createLinearGradient(0, this.riverY, 0, this.riverY + this.riverH);
    river.addColorStop(0, '#3ba0d1');
    river.addColorStop(0.5, '#6bc0e8');
    river.addColorStop(1, '#3ba0d1');
    ctx.fillStyle = river;
    ctx.fillRect(this.x, this.riverY, this.width, this.riverH);

    // River banks
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(this.x, this.riverY - 3, this.width, 3);
    ctx.fillRect(this.x, this.riverY + this.riverH, this.width, 3);

    // Bridges
    ctx.fillStyle = '#7a5a2a';
    ctx.fillRect(this.bridgeLX, this.riverY - 3, this.bridgeW, this.riverH + 6);
    ctx.fillRect(this.bridgeRX, this.riverY - 3, this.bridgeW, this.riverH + 6);
    // Bridge planks
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 1;
    for (let bx of [this.bridgeLX, this.bridgeRX]) {
      for (let py = this.riverY; py < this.riverY + this.riverH; py += 8) {
        ctx.beginPath();
        ctx.moveTo(bx, py);
        ctx.lineTo(bx + this.bridgeW, py);
        ctx.stroke();
      }
    }

    // Center dividing line
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(this.x, midY);
    ctx.lineTo(this.x + this.width, midY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
