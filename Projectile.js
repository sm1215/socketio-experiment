class Projectile {
  constructor(opts) {
    this.id = opts.projectileId;
    this.playerId = opts.playerId;
    this.type = opts.type;
    this.x = opts.x1 || 0;
    this.y = opts.y1 || 0;
    this.h = opts.h || 4;
    this.w = opts.w || 4;
    this.x1 = opts.x1 || 0;
    this.y1 = opts.y1 || 0;
    this.x2 = opts.x2 || 0;
    this.y2 = opts.y2 || 0;
    this.color = this.setColor();
  }

  setColor() {
    let color;
    switch(this.type) {
      case 'bullet':
        color = '#000';
      break;
      case 'blood':
        color = '#b30000';
      break;
    }
    return color;
  }
}

var exports = module.exports = Projectile;
