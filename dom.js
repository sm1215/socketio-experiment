const dom = {
  createPlayerElement: function(player) {
    const playerEl = document.createElement('div');
    playerEl.setAttribute('id', 'player-' + player.id);
    playerEl.setAttribute('class', 'player');
    playerEl.style.backgroundColor = player.color;
    playerEl.style.height = player.height;
    playerEl.style.width = player.width;
    
    playerEl.appendChild(dom.createPlayerMessages(player));
    playerEl.appendChild(dom.createPlayerAim(player));

    return playerEl;
  },

  createPlayerMessages: function(player) {
    const playerMessages = document.createElement('p');
    playerMessages.setAttribute('id', 'player-' + player.id + '-messages');
    playerMessages.setAttribute('class', 'messages');
    return playerMessages;
  },

  createPlayerAim: function(player) {
    const playerAim = document.createElement('div');
    playerAim.setAttribute('id', 'player-' + player.id + '-aim');
    playerAim.setAttribute('class', 'aim');
    return playerAim;
  },

  createProjectileElement: function(projectile) {
    const projectileElement = document.createElement('div');
    projectileElement.setAttribute('class', 'projectile');
    projectileElement.setAttribute('id', 'projectile-' + projectile.id);
    projectileElement.style.left = projectile.x + 'px';
    projectileElement.style.top = projectile.y + 'px';

    if(projectile.data) {
      projectile.data.forEach((attr) => {
        projectileElement.dataset[attr.key] = attr.value;
      });
    }
    if(projectile.color) {
      projectileElement.style.backgroundColor = projectile.color;
    }

    return projectileElement;
  }
}
