class Player {
  constructor(id) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.h = 20;
    this.w = 20;
    this.rot = 0;
    this.hp = 100;
    this.MOVE_UP = false;
    this.MOVE_RIGHT = false;
    this.MOVE_DOWN = false;
    this.MOVE_LEFT = false;
    this.color = this.getColor();
  }

  respawn() {
    this.x = 0;
    this.y = 0;
    this.rot = 0;
    this.hp = 100;
    this.color = this.getColor();
  }

  getColor() {
    return '#'+Math.floor(Math.random()*16777215).toString(16); 
  }
}

var exports = module.exports = Player;
