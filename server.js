var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const Player = require('./player.js');

const players = [];
const messages = [];
const projectiles = [];
let projectileId = 0;
const PLAYER_SPEED = 5;
const PROJECTILE_SPEED = 10;

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res){
  //outputs clientside
  console.log("game", game);
  res.sendFile(__dirname + '/index.html');
  
});

io.on('connection', function(socket) {
  const id = players.length;
  const player = new Player(id);
  players.push(player);

  socket.emit('set player', player);
  
  // Not sure if this should only be sent to the current socket or all sockets through io
  io.emit('init players', players);

  if(messages.length > 0) {
    messages.forEach((entry) => {
      io.emit('message received', entry.playerId, entry.message);
    });
  }

  console.log('a user connected, players:', players);

  socket.on('fire', function(coords) {
    const projectile = {
      id: projectileId,
      x: coords.x1,
      y: coords.y1,
      x1: coords.x1,
      y1: coords.y1,
      x2: coords.x2,
      y2: coords.y2
    };

    projectiles.push(projectile);
    io.emit('player fired', projectile);
    projectileId += 1;
  });

  socket.on('rotate', function(playerId, rot) {
    const player = getPlayer(playerId);
    player.rot = rot;
  });

  socket.on('startUp', function(playerId) {
    const player = getPlayer(playerId);
    player.MOVE_UP = true;
  });

  socket.on('stopUp', function(playerId) {
    const player = getPlayer(playerId);
    player.MOVE_UP = false;
  });

  socket.on('startDown', function(playerId) {
    const player = getPlayer(playerId);
    player.MOVE_DOWN = true;
  });

  socket.on('stopDown', function(playerId) {
    const player = getPlayer(playerId);
    player.MOVE_DOWN = false;
  });

  socket.on('startLeft', function(playerId) {
    const player = getPlayer(playerId);
    player.MOVE_LEFT = true;
  });

  socket.on('stopLeft', function(playerId) {
    const player = getPlayer(playerId);
    player.MOVE_LEFT = false;
  });

  socket.on('startRight', function(playerId) {
    const player = getPlayer(playerId);
    player.MOVE_RIGHT = true;
  });

  socket.on('stopRight', function(playerId) {
    const player = getPlayer(playerId);
    player.MOVE_RIGHT = false;
  });

  socket.on('send message', function(playerId, message) {
    messages.push({ playerId, message });
    io.emit('message received', playerId, message);  
  });
});

function getPlayer(id) {
  let found;
  players.forEach((p) => {
    if(p.id == id) {
      found = p;
    }
  });
  return found;
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});

/***************************************************
* Game loop logic below
****************************************************/

/*
Length of a tick in milliseconds. The denominator is your desired framerate.
e.g. 1000 / 20 = 20 fps,  1000 / 60 = 60 fps
*/
const tickLengthMs = 1000 / 60;

let previousTick = Date.now();
let actualTicks = 0;

const gameLoop = function() {
  const now = Date.now();

  actualTicks++;

  if(previousTick + tickLengthMs <= now) {
    const delta = (now - previousTick) / 1000;
    previousTick = now;
    update(delta);
    actualTicks = 0;
  }

  if(Date.now() - previousTick < tickLengthMs - 16) {
    setTimeout(gameLoop);
  } else {
    setImmediate(gameLoop);
  }
}

gameLoop();

function update() {
  updatePlayerPositions();
  updateProjectilePositions();

  io.emit('update players', players);
  io.emit('update projectiles', projectiles);
}

function updatePlayerPositions() {
  players.forEach((player) => {
    if (player.MOVE_UP) {
      player.y -= PLAYER_SPEED;
    }

    if (player.MOVE_RIGHT) {
      player.x += PLAYER_SPEED;
    }

    if (player.MOVE_DOWN) {
      player.y += PLAYER_SPEED;
    }

    if (player.MOVE_LEFT) {
      player.x -= PLAYER_SPEED;
    }
  });
}

function updateProjectilePositions() {
  projectiles.forEach((p, i) => {
    let distance = PROJECTILE_SPEED;
    // Shooting left or up
    if((p.x1 - p.x2 > 0)) {// || (p.y1 - p.y2 > 0)) {
      p.x -= PROJECTILE_SPEED;
      // distance = -Math.abs(distance);
    } else {
      p.x += PROJECTILE_SPEED;
    }

    if(p.y1 - p.y2 > 0) {
      p.y -= PROJECTILE_SPEED;
    } else {
      p.y += PROJECTILE_SPEED;
    }
    // p.x += PROJECTILE_SPEED;
    // p.y += PROJECTILE_SPEED;
  });
}
