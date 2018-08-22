const client = {
  h: 0,
  w: 0,
  selectors: ['#world', '#chat', '#avatar'],
  els: {},
  player: null,
  chatting: false,
  world: {
    offsetX: 0,
    offsetY: 0
  },
  rotUpdateInterval: 100,
  reloadInterval: 100,
  BLEED_TIME: 500, //ms

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
      client.els[key] = document.querySelector(selector);
    });
  },

  setListeners:function() {
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);
    window.addEventListener('mousedown', this.handleMouse);
    window.addEventListener('mousemove', this.handleMouse);
    client.els.avatar.addEventListener('change', this.handleAvatarChange);

    socket.on('set player', this.setPlayer);
    socket.on('init players', this.initPlayers);
    socket.on('update players', this.updatePlayers);
    socket.on('update projectiles', this.updateProjectiles);
    socket.on('message received', this.messageReceived);
    socket.on('player fired', this.createProjectile);
    socket.on('remove projectile', this.removeProjectile);
    socket.on('player hit', this.playerHit);
    socket.on('remove player', this.removePlayer);
  },

  setPlayer(player) {
    client.playerId = player.id;
    client.player = player;
  },

  updatePlayers(players) {
    players.forEach(function(player) {

      // Update our reference while we're at it
      if(client.playerId == player.id) {
        client.player = player;
      }

      const playerEl = document.querySelector('#player-' + player.id);
      playerEl.style.top = player.y + 'px';
      playerEl.style.left = player.x + 'px';
      playerEl.style.transform = 'rotate(' + player.rot + 'deg)';
      playerEl.style.backgroundColor = player.color;

      if(player.avatar) {
        playerEl.setAttribute('data-avatar', player.avatar);
      }
    });
  },

  updateProjectiles(projectiles) {    
    projectiles.forEach((p) => {
      try {
        const pEl = document.querySelector('#projectile-' + p.id);
        pEl.style.top = p.y + 'px';
        pEl.style.left = p.x + 'px';
      } catch(e) {
        if(e instanceof TypeError) {
          client.createProjectile(p);
        }      
      }
    });
  },

  clearPlayers() {
    const playerEls = document.querySelectorAll('.player');
    playerEls.forEach(function(playerEl) {
      playerEl.parentNode.removeChild(playerEl);
    });
  },

  initPlayers(players) {
    client.clearPlayers();
    players.forEach((player) => {
      client.els.world.appendChild(dom.createPlayerElement(player));
    });
    client.updatePlayers(players);
  },

  playerHit(playerId) {
    const playerEl = document.querySelector('#player-' + playerId);
    playerEl.classList.add('hit');
    setTimeout(function() {
      playerEl.classList.remove('hit');
    }, client.BLEED_TIME);
  },

  removePlayer(playerId) {
    const playerEl = document.querySelector('#player-' + playerId);
    playerEl.parentNode.removeChild(playerEl);
  },

  createProjectile(projectile) {
    let p = dom.createProjectileElement({ id: projectile.id, x: projectile.x2, y: projectile.y2, color: projectile['color'] });    
    client.els.world.appendChild(p);
  },

  removeProjectile(projectile) {
    const pEl = document.querySelector('#projectile-' + projectile.id);
    pEl.parentNode.removeChild(pEl);
  },

  messageReceived(playerId, message) {
    try {
    const messageEl = document.querySelector('#player-' + playerId + '-messages');
    messageEl.textContent = message;
    } catch(e) {
      console.log("messageReceived:", e);      
    }
  },

  handleMouse(e) {
    if(!client.player) {
      console.warn('no player');
      return;
    }

    const x = e.pageX;
    const y = e.pageY;

    if (e.type == 'mousedown') {
      client.fire(x - client.world.offsetX, y- client.world.offsetY);
      socket.emit('click');
    } else if (e.type == 'mousemove' && client.player) {
      const rot = client.rotatePlayer(x, y);

      if(!client.sentRotate) {
        socket.emit('rotate', client.player.id, rot);
        client.sentRotate = setTimeout(function() {
          client.sentRotate = null;
        }, client.rotUpdateInterval);
      }
    }
  },

  handleAvatarChange(e) {
    const playerEl = document.querySelector('#player-' + client.player.id);
    const value = e.srcElement.value;
    playerEl.setAttribute('data-avatar', value);
    client.els.avatar.blur();

    socket.emit('set avatar', client.player.id, value);
  },

  fire(mouseX, mouseY) {
    if(!client.reloading) {
      socket.emit('fire', { 
        playerId: client.player.id,
        x1: client.player.x + (client.player.w / 2),
        y1: client.player.y + (client.player.h / 2),
        x2: mouseX,
        y2: mouseY
      });
      client.reloading = setTimeout(function() {
        client.reloading = null;
      }, client.reloadInterval);
    }    
  },

  rotatePlayer(mouseX, mouseY){
    // Need to take into account the world offset because the mouse can still be used outside of world bounds
    const x1 = client.world.offsetX + (client.player.x - (client.player.w / 2));
    const y1 = client.world.offsetY + (client.player.y - (client.player.h / 2));
    const x2 = mouseX;
    const y2 = mouseY;

    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const rad = Math.atan2(deltaY, deltaX);
    const deg = rad * (180 / Math.PI);
    const rot = deg + 90; // adding 90 will put us in the correct quadrant

    const playerEl = document.querySelector('#player-' + client.player.id);
    
    playerEl.style.transform = 'rotate(' + rot + 'deg)';
    return rot;
  },

  handleKeyup(e) {
    if(client.chatting) {
      return;
    }

    const k = e.keyCode;
    
    // Up
    if(k == 87 || k == 38) {
      socket.emit('stopUp', client.player.id);
    }

    // Down
    if(k == 83 || k == 40) {
      socket.emit('stopDown', client.player.id);
    }

    // Left
    if(k == 65 || k == 37) {
      socket.emit('stopLeft', client.player.id);
    }

    // Right
    if(k == 68 || k == 39) {
      socket.emit('stopRight', client.player.id);
    }
  },

  handleKeydown(e) {
    const k = e.keyCode;
    
    // Up
    if((k == 87 || k == 38) && !client.chatting) {
      socket.emit('startUp', client.player.id);
    }

    // Down
    if((k == 83 || k == 40) && !client.chatting) {
      socket.emit('startDown', client.player.id);
    }

    // Left
    if((k == 65 || k == 37) && !client.chatting) {
      socket.emit('startLeft', client.player.id);
    }

    // Right
    if((k == 68 || k == 39) && !client.chatting) {
      socket.emit('startRight', client.player.id);
    }

    // // Space
    // if((k == 32) && !client.chatting) {
    //   socket.emit('fire', client.player.id);
    // }

    // Enter
    if(k == 13) {
      if(client.chatting) {
        socket.emit('send message', client.player.id, client.els.chat.value);
        client.els.chat.value = '';
        client.chatting = false;
        client.els.chat.blur();
      } else {
        client.els.chat.focus();
        client.chatting = true;
      }
    }

    // Esc
    if(k == 27) {
      client.els.chat.value = '';
      client.els.chat.blur();
      client.els.chatting = false;
    }
  }
}
