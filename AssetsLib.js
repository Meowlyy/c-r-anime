// Minimal pre-rendered sprite system.
// Provides the `Assets` (definition) and `lib` (lookup) globals expected by
// assets.js and every draw() method in this project (Unit.js, Tower.js,
// Projectile.js, Game.js). Some callers (Projectile.js) rely on the returned
// canvas's own .width/.height as the draw size, so sprites are rendered at
// exactly their logical size (no internal upscaling).
const Assets = {
  _sprites: {},

  // Define a sprite: renders drawFn(ctx, w, h) once onto an offscreen
  // canvas sized exactly w x h, and caches the result for lib.sprite().
  sprite(name, w, h, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w));
    canvas.height = Math.max(1, Math.round(h));
    const ctx = canvas.getContext('2d');
    try {
      drawFn(ctx, canvas.width, canvas.height);
    } catch (e) {
      console.error('Assets.sprite failed for "' + name + '":', e);
    }
    this._sprites[name] = canvas;
    return canvas;
  },

  get(name) {
    return this._sprites[name] || null;
  },
};

const lib = {
  sprite(name) {
    return Assets.get(name);
  },
};
