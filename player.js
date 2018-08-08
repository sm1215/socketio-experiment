class Player {
  constructor(id) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.hp = 100;
    this.color = '#'+Math.floor(Math.random()*16777215).toString(16); // ty Paul Irish & friends https://www.paulirish.com/2009/random-hex-color-code-snippets/
  }
}

var exports = module.exports = Player;