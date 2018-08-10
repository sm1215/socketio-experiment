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
const WORLD_HEIGHT = 600;
const WORLD_WIDTH = 800;

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
    try {
      const player = getPlayer(playerId);
      player.rot = rot;
    } catch(e) {
      console.log("socket rotate:", e);
    }
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

function update(delta) {
  updatePlayerPositions();
  updateProjectilePositions(delta);

  io.emit('update players', players);
  io.emit('update projectiles', projectiles); 
}

function updatePlayerPositions() {
  players.forEach((player) => {
    if (player.MOVE_UP && player.y > 0) {
      player.y -= PLAYER_SPEED;
    }

    if (player.MOVE_RIGHT && player.x < WORLD_WIDTH) {
      player.x += PLAYER_SPEED;
    }

    if (player.MOVE_DOWN && player.y < WORLD_HEIGHT) {
      player.y += PLAYER_SPEED;
    }

    if (player.MOVE_LEFT && player.x > 0) {
      player.x -= PLAYER_SPEED;
    }
  });
}

function Vector(magnitude, angle) {
  const angleRadians = (angle * Math.PI) / 180;

  this.magnitudeX = magnitude * Math.cos(angleRadians);
  this.magnitudeY = magnitude * Math.sin(angleRadians);
}

function distanceAndAngleBetweenTwoPoints(x1, y1, x2, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;

  return {
    // x^2 + y^2 = r^2
    distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
    //convert radians to degrees
    angle: Math.atan2(deltaY, deltaX) * 180 / Math.PI
  }
}

function updateProjectilePositions(delta) {
  const speed = 10;

  projectiles.forEach((p, i) => {

    const data = distanceAndAngleBetweenTwoPoints(p.x1, p.y1, p.x2, p.y2);
    const velocity = speed;//data.distance / speed;
    const toTargetVector = new Vector(velocity, data.angle);
    const elapsedSeconds = delta * 100;

    p.x += (toTargetVector.magnitudeX * elapsedSeconds);
    p.y += (toTargetVector.magnitudeY * elapsedSeconds);

    checkProjectileAgainstBounds(p, i);
  });
}

function checkProjectileAgainstBounds(p, i) {
  if(p.x < 0 || p.x > WORLD_WIDTH || p.y < 0 || p.y > WORLD_HEIGHT) {
    removeProjectile(p, i);
  }
}

function removeProjectile(p, i) {
  projectiles.splice(i, 1);
  io.emit('remove projectile', p);
}
