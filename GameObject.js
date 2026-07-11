class GameObject {
  constructor(x, y, width, height) {
    this.name = this.constructor.name;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  update(dt) { }
  draw(ctx) { }

  get cx() { return this.x + this.width / 2; }
  get cy() { return this.y + this.height / 2; }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}
