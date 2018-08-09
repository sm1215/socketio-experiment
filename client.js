const game = {
  h: 0,
  w: 0,
  selectors: ['#world', '#chat'],
  els: {},
  player: null,
  chatting: false,
  world: {
    offsetX: 0,
    offsetY: 0
  },
  rotUpdateInterval: 100,
  reloadInterval: 100,

  init: function() {
    this.setupEls();
    this.setListeners();
    this.h = this.els.world.offsetHeight;
    this.w = this.els.world.offsetWidth;
    this.world.offsetX = this.els.world.offsetLeft;
    this.world.offsetY = this.els.world.offsetTop;
  },

  setupEls:function() {
    this.selectors.forEach(function(selector) {
      //remove class / id denotion along with whitespace
      var pattern = new RegExp(/[.#\s]/g);
      var key = selector.replace(pattern, '');
      game.els[key] = document.querySelector(selector);
    });
  },

  setListeners:function() {
    // window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);
    window.addEventListener('mousedown', this.handleMouse);
    window.addEventListener('mousemove', this.handleMouse);
    // window.addEventListener('mouseup', this.handleMouse);

    socket.on('set player', this.setPlayer);
    socket.on('init players', this.initPlayers);
    socket.on('update players', this.updatePlayers);
    socket.on('update projectiles', this.updateProjectiles);
    socket.on('message received', this.messageReceived);
    socket.on('player fired', this.playerFired);
  },

  setPlayer(player) {
    game.playerId = player.id;
    game.player = player;
  },

  updatePlayers(players) {
    players.forEach(function(player) {

      // Update out reference while we're at it
      if(game.playerId == player.id) {
        game.player = player;
      }

      const playerEl = document.querySelector('#player-' + player.id);
      playerEl.style.top = player.y + 'px';
      playerEl.style.left = player.x + 'px';
      playerEl.style.transform = 'rotate(' + player.rot + 'deg)';
    });
  },

  updateProjectiles(projectiles) {
    try {
      projectiles.forEach((p) => {
        const pEl = document.querySelector('#projectile-' + p.id);
        pEl.style.top = p.y + 'px';
        pEl.style.left = p.x + 'px';
      });
    } catch(e) {
      
    }
  },

  clearPlayers() {
    const playerEls = document.querySelectorAll('.player');
    playerEls.forEach(function(playerEl) {
      playerEl.parentNode.removeChild(playerEl);
    });
  },

  initPlayers(players) {
    game.clearPlayers();
    players.forEach((player) => {
      game.els.world.appendChild(dom.createPlayerElement(player));
    });
    game.updatePlayers(players);
  },

  playerFired(projectile) {
    let p = dom.createProjectileElement({ id: projectile.id, x: projectile.x1, y: projectile.y1 });    
    game.els.world.appendChild(p);
  },

  messageReceived(playerId, message) {
    const messageEl = document.querySelector('#player-' + playerId + '-messages');
    messageEl.textContent = message;
  },

  handleMouse(e) {
    if(!game.player) {
      console.warn('no player');
      return;
    }

    const x = e.pageX;
    const y = e.pageY;


    if (e.type == 'mousedown') {
      game.fire(x, y);
      socket.emit('click');
    } else if (e.type == 'mousemove' && game.player) {
      const rot = game.rotatePlayer(x, y);

      if(!game.sentRotate) {
        socket.emit('rotate', game.player.id, rot);
        game.sentRotate = setTimeout(function() {
          game.sentRotate = null;
        }, game.rotUpdateInterval);
      }
    }
  },

  fire(mouseX, mouseY) {
    if(!game.reloading) {
      socket.emit('fire', { 
        x1: game.player.x + (game.player.w / 2),
        y1: game.player.y + (game.player.h / 2),
        x2: mouseX,
        y2: mouseY
      });
      game.reloading = setTimeout(function() {
        game.reloading = null;
      }, game.reloadInterval);
    }    
  },

  rotatePlayer(mouseX, mouseY){
    // Need to take into account the world offset because the mouse can still be used outside of world bounds
    const x1 = game.world.offsetX + (game.player.x - (game.player.w / 2));
    const y1 = game.world.offsetY + (game.player.y - (game.player.h / 2));
    const x2 = mouseX;
    const y2 = mouseY;

    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const rad = Math.atan2(deltaY, deltaX);
    const deg = rad * (180 / Math.PI);
    const rot = deg + 90; // adding 90 will put us in the correct quadrant

    const playerEl = document.querySelector('#player-' + game.player.id);
    
    playerEl.style.transform = 'rotate(' + rot + 'deg)';
    return rot;
  },

  handleKeyup(e) {
    if(game.chatting) {
      return;
    }

    const k = e.keyCode;
    
    // Up
    if(k == 87 || k == 38) {
      socket.emit('stopUp', game.player.id);
    }

    // Down
    if(k == 83 || k == 40) {
      socket.emit('stopDown', game.player.id);
    }

    // Left
    if(k == 65 || k == 37) {
      socket.emit('stopLeft', game.player.id);
    }

    // Right
    if(k == 68 || k == 39) {
      socket.emit('stopRight', game.player.id);
    }
  },

  handleKeydown(e) {
    const k = e.keyCode;
    
    // Up
    if((k == 87 || k == 38) && !game.chatting) {
      socket.emit('startUp', game.player.id);
    }

    // Down
    if((k == 83 || k == 40) && !game.chatting) {
      socket.emit('startDown', game.player.id);
    }

    // Left
    if((k == 65 || k == 37) && !game.chatting) {
      socket.emit('startLeft', game.player.id);
    }

    // Right
    if((k == 68 || k == 39) && !game.chatting) {
      socket.emit('startRight', game.player.id);
    }

    // Space
    if((k == 32) && !game.chatting) {
      socket.emit('fire', game.player.id);
    }

    // Enter
    if(k == 13) {
      if(game.chatting) {
        socket.emit('send message', game.player.id, game.els.chat.value);
        game.els.chat.value = '';
        game.chatting = false;
        game.els.chat.blur();
      } else {
        game.els.chat.focus();
        game.chatting = true;
      }
    }

    // Esc
    if(k == 27) {
      game.els.chat.value = '';
      game.els.chat.blur();
      game.els.chatting = false;
    }
  }
}
