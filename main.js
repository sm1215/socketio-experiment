const game = {
  h: 0,
  w: 0,
  selectors: ['#world', '#chat'],
  els: {},
  player: null,
  chatting: false,

  init: function() {
    this.setupEls();
    this.setListeners();
    this.h = this.els.world.offsetHeight;
    this.w = this.els.world.offsetWidth;
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
    socket.on('player connected', this.playerConnected);
    socket.on('player moved', this.playerMoved);
    socket.on('draw players', this.drawPlayers);
    socket.on('message received', this.messageReceived);

    window.addEventListener('mousedown', this.handleMouse);
    // window.addEventListener('mousemove', this.handleMouse);
    // window.addEventListener('mouseup', this.handleMouse);
  },

  playerConnected(player) {
    game.player = player;
  },

  clearPlayers() {
    const playerEls = document.querySelectorAll('.player');
    playerEls.forEach(function(playerEl) {
      playerEl.parentNode.removeChild(playerEl);
    });
  },

  drawPlayers(players) {
    game.clearPlayers();
    players.forEach((player) => {
      const playerEl = document.createElement('div');
      playerEl.setAttribute('id', 'player-' + player.id);
      playerEl.setAttribute('class', 'player');
      playerEl.style.backgroundColor = player.color;    
      
      const playerMessages = document.createElement('p');
      playerMessages.setAttribute('id', 'player-' + player.id + '-messages' );
      playerMessages.setAttribute('class', 'messages');
      playerEl.appendChild(playerMessages);
      
      game.els.world.appendChild(playerEl);
    });
  },

  playerMoved(players) {
    players.forEach(function(player) {
      const playerEl = document.querySelector('#player-' + player.id);
      playerEl.style.top = player.y + 'px';
      playerEl.style.left = player.x + 'px';
    });    
  },

  messageReceived(playerId, message) {
    const messageEl = document.querySelector('#player-' + playerId + '-messages');
    messageEl.textContent = message;
  },

  handleMouse(e) {
    socket.emit('click');
  },

  handleKeydown(e) {
    const k = e.keyCode;
    
    // Up
    if((k == 87 || k == 38) && !game.chatting) {
      socket.emit('up', game.player.id);
    }

    // Down
    if((k == 83 || k == 40) && !game.chatting) {
      socket.emit('down', game.player.id);
    }

    // Left
    if((k == 65 || k == 37) && !game.chatting) {
      socket.emit('left', game.player.id);
    }

    // Right
    if((k == 68 || k == 39) && !game.chatting) {
      socket.emit('right', game.player.id);
    }

    // Space
    if((k == 32) && !game.chatting) {
      socket.emit('fire', game.player.id);
    }

    // Enter
    if(k == 13) {
      if(game.chatting) {
        console.log("emit");
        
        socket.emit('send message', game.player.id, game.els.chat.value);
        game.els.chat.value = '';
        game.chatting = false;
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
