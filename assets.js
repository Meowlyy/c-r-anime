// Pre-rendered sprites for anime card battler visuals.
Assets.sprite('cardBg', 140, 180, (ctx, w, h) => {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#f8e9ff');
  grad.addColorStop(1, '#c39bff');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#5a2b8c';
  ctx.lineWidth = 3;
  ctx.stroke();
});

Assets.sprite('cardBgLocked', 140, 180, (ctx, w, h) => {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#3a3a4a');
  grad.addColorStop(1, '#1a1a2a');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3;
  ctx.stroke();
});

// Anime unit sprites — each is a small chibi-style figure.
function drawChibi(ctx, w, h, hairColor, outfitColor, accent) {
  // Body
  ctx.fillStyle = outfitColor;
  ctx.beginPath();
  ctx.roundRect(w * 0.25, h * 0.45, w * 0.5, h * 0.4, 6);
  ctx.fill();
  // Head
  ctx.fillStyle = '#ffe0c4';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.35, w * 0.22, 0, Math.PI * 2);
  ctx.fill();
  // Hair
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.28, w * 0.24, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.35, h * 0.35, w * 0.08, 0, Math.PI * 2);
  ctx.arc(w * 0.65, h * 0.35, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(w * 0.4, h * 0.36, w * 0.05, h * 0.06);
  ctx.fillRect(w * 0.55, h * 0.36, w * 0.05, h * 0.06);
  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.fillRect(w * 0.415, h * 0.37, w * 0.02, h * 0.02);
  ctx.fillRect(w * 0.565, h * 0.37, w * 0.02, h * 0.02);
  // Accent
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.55, w * 0.06, 0, Math.PI * 2);
  ctx.fill();
}

Assets.sprite('unit_swordmaiden', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#ff69b4', '#e63946', '#ffd700');
  // Sword
  ctx.fillStyle = '#ccc';
  ctx.fillRect(w * 0.78, h * 0.3, w * 0.06, h * 0.5);
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(w * 0.76, h * 0.78, w * 0.1, h * 0.05);
});

Assets.sprite('unit_archer', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#4a9d3a', '#2d5016', '#ffed4e');
  // Bow
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * 0.15, h * 0.55, h * 0.2, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
});

Assets.sprite('unit_mage', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#9370db', '#4b0082', '#00ffff');
  // Staff
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(w * 0.82, h * 0.25, w * 0.05, h * 0.6);
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.arc(w * 0.845, h * 0.22, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
});

Assets.sprite('unit_tank', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#4682b4', '#696969', '#ff4500');
  // Shield
  ctx.fillStyle = '#8b7355';
  ctx.beginPath();
  ctx.roundRect(w * 0.05, h * 0.45, w * 0.18, h * 0.35, 4);
  ctx.fill();
  ctx.strokeStyle = '#3a2a15';
  ctx.lineWidth = 2;
  ctx.stroke();
});

Assets.sprite('unit_ninja', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#1a1a1a', '#2a2a3e', '#ff1744');
  // Mask band
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(w * 0.28, h * 0.35, w * 0.44, h * 0.05);
});

Assets.sprite('unit_healer', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#ffb6c1', '#fff0f5', '#ff69b4');
  // Cross
  ctx.fillStyle = '#ff1744';
  ctx.fillRect(w * 0.47, h * 0.55, w * 0.06, h * 0.2);
  ctx.fillRect(w * 0.4, h * 0.62, w * 0.2, h * 0.06);
});

Assets.sprite('unit_dragon', 72, 72, (ctx, w, h) => {
  // Dragon body
  ctx.fillStyle = '#8b0000';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.6, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wings
  ctx.fillStyle = '#5a0000';
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.5);
  ctx.lineTo(w * 0.05, h * 0.3);
  ctx.lineTo(w * 0.3, h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.8, h * 0.5);
  ctx.lineTo(w * 0.95, h * 0.3);
  ctx.lineTo(w * 0.7, h * 0.55);
  ctx.closePath();
  ctx.fill();
  // Head
  ctx.fillStyle = '#8b0000';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.35, w * 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#ffed4e';
  ctx.beginPath();
  ctx.arc(w * 0.42, h * 0.33, w * 0.04, 0, Math.PI * 2);
  ctx.arc(w * 0.58, h * 0.33, w * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(w * 0.42, h * 0.33, w * 0.02, 0, Math.PI * 2);
  ctx.arc(w * 0.58, h * 0.33, w * 0.02, 0, Math.PI * 2);
  ctx.fill();
});

// Enemy variants (blue-tinted anime characters)
Assets.sprite('enemy_swordmaiden', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#87ceeb', '#1e40af', '#ffd700');
  ctx.fillStyle = '#ccc';
  ctx.fillRect(w * 0.78, h * 0.3, w * 0.06, h * 0.5);
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(w * 0.76, h * 0.78, w * 0.1, h * 0.05);
});

Assets.sprite('enemy_archer', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#87ceeb', '#1e3a5f', '#ffed4e');
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * 0.15, h * 0.55, h * 0.2, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
});

Assets.sprite('enemy_mage', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#87ceeb', '#003366', '#00ffff');
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(w * 0.82, h * 0.25, w * 0.05, h * 0.6);
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.arc(w * 0.845, h * 0.22, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
});

Assets.sprite('enemy_tank', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#87ceeb', '#4a5568', '#ff4500');
  ctx.fillStyle = '#8b7355';
  ctx.beginPath();
  ctx.roundRect(w * 0.05, h * 0.45, w * 0.18, h * 0.35, 4);
  ctx.fill();
});

Assets.sprite('enemy_ninja', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#87ceeb', '#1a2340', '#ff1744');
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(w * 0.28, h * 0.35, w * 0.44, h * 0.05);
});

Assets.sprite('enemy_healer', 60, 60, (ctx, w, h) => {
  drawChibi(ctx, w, h, '#87ceeb', '#e0e8ff', '#4169e1');
  ctx.fillStyle = '#4169e1';
  ctx.fillRect(w * 0.47, h * 0.55, w * 0.06, h * 0.2);
  ctx.fillRect(w * 0.4, h * 0.62, w * 0.2, h * 0.06);
});

Assets.sprite('enemy_dragon', 72, 72, (ctx, w, h) => {
  ctx.fillStyle = '#1e40af';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.6, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f2a5f';
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.5);
  ctx.lineTo(w * 0.05, h * 0.3);
  ctx.lineTo(w * 0.3, h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.8, h * 0.5);
  ctx.lineTo(w * 0.95, h * 0.3);
  ctx.lineTo(w * 0.7, h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e40af';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.35, w * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffed4e';
  ctx.beginPath();
  ctx.arc(w * 0.42, h * 0.33, w * 0.04, 0, Math.PI * 2);
  ctx.arc(w * 0.58, h * 0.33, w * 0.04, 0, Math.PI * 2);
  ctx.fill();
});

// Arrows / projectiles
Assets.sprite('arrow', 24, 8, (ctx, w, h) => {
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(0, h * 0.4, w * 0.7, h * 0.2);
  ctx.fillStyle = '#ccc';
  ctx.beginPath();
  ctx.moveTo(w * 0.7, 0);
  ctx.lineTo(w, h * 0.5);
  ctx.lineTo(w * 0.7, h);
  ctx.closePath();
  ctx.fill();
});

Assets.sprite('magicOrb', 20, 20, (ctx, w, h) => {
  const grad = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.4, '#00ffff');
  grad.addColorStop(1, 'rgba(0, 100, 255, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
  ctx.fill();
});

Assets.sprite('fireball', 22, 22, (ctx, w, h) => {
  const grad = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  grad.addColorStop(0, '#fffbe0');
  grad.addColorStop(0.4, '#ff6600');
  grad.addColorStop(1, 'rgba(200, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
  ctx.fill();
});

// Tower sprite
Assets.sprite('tower_ally', 80, 100, (ctx, w, h) => {
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.65);
  ctx.fillStyle = '#5a4a2a';
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.3);
  ctx.lineTo(w * 0.5, h * 0.05);
  ctx.lineTo(w * 0.9, h * 0.3);
  ctx.closePath();
  ctx.fill();
  // Flag
  ctx.fillStyle = '#e63946';
  ctx.fillRect(w * 0.48, h * 0.05, w * 0.04, h * 0.15);
  ctx.fillStyle = '#ff69b4';
  ctx.beginPath();
  ctx.moveTo(w * 0.52, h * 0.06);
  ctx.lineTo(w * 0.7, h * 0.1);
  ctx.lineTo(w * 0.52, h * 0.14);
  ctx.closePath();
  ctx.fill();
  // Window
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(w * 0.4, h * 0.5, w * 0.2, h * 0.2);
  // Base
  ctx.fillStyle = '#3a2a15';
  ctx.fillRect(w * 0.1, h * 0.9, w * 0.8, h * 0.08);
});

Assets.sprite('tower_enemy', 80, 100, (ctx, w, h) => {
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.65);
  ctx.fillStyle = '#2d3748';
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.3);
  ctx.lineTo(w * 0.5, h * 0.05);
  ctx.lineTo(w * 0.9, h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(w * 0.48, h * 0.05, w * 0.04, h * 0.15);
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(w * 0.52, h * 0.06);
  ctx.lineTo(w * 0.7, h * 0.1);
  ctx.lineTo(w * 0.52, h * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(w * 0.4, h * 0.5, w * 0.2, h * 0.2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(w * 0.1, h * 0.9, w * 0.8, h * 0.08);
});

// Elixir droplet icon
Assets.sprite('elixir', 24, 30, (ctx, w, h) => {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#ff69ff');
  grad.addColorStop(1, '#a020a0');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.bezierCurveTo(w, h * 0.5, w, h, w / 2, h);
  ctx.bezierCurveTo(0, h, 0, h * 0.5, w / 2, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(w * 0.35, h * 0.3, w * 0.1, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
});
