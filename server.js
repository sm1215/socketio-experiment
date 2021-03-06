var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const Player = require('./player.js');

let players = [];
let messages = [];
let projectiles = [];

let playerId = 0;
let projectileId = 0;

const PLAYER_SPEED = 5;
const PROJECTILE_SPEED = 10;
const WORLD_HEIGHT = 600;
const WORLD_WIDTH = 800;
const BULLET_DAMAGE = 25;
const BULLET_VELOCITY = 10;
const BLOOD_PARTICLE_LIMIT = 8;
const BLOOD_DISTANCE = { MIN: 50, MAX: 75 };

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

  function spawnPlayer() {
    const id = playerId++;
    const player = new Player(id);
    player.socketId = socket.id;
    players.push(player);
   
    socket.emit('set player', player);

    io.emit('init players', players);
  
    if(messages.length > 0) {
      messages.forEach((entry) => {
        io.emit('message received', entry.playerId, entry.message);
      });
    }
  }
  spawnPlayer();
  gameLoop();

  console.log('a user connected, players:', players.length);

  socket.on('set avatar', function(playerId, avatar) {
    try {
      const player = getPlayer(playerId);
      player.avatar = avatar;
    } catch(e) {
      console.log("socket set avatar:", e);      
    }
  });

  socket.on('fire', function(data) {
    const projectile = {
      type: 'bullet',
      id: projectileId,
      x: data.x1,
      y: data.y1,
      h: 4,
      w: 4,
      x1: data.x1,
      y1: data.y1,
      x2: data.x2,
      y2: data.y2,
      playerId: data.playerId
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

  // Need to match the socketId to the player's stored socketId
  socket.on('disconnect', function() {
    players.forEach((player, i) => {
      if(player.socketId == socket.id) {
        removePlayer(player, i);
      }
    });
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

  if(players.length <= 0) {
    resetEntities();
    return;
  }

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

function resetEntities() {
  players = [];
  projectiles = [];
  messages = [];
}

gameLoop();

// sm1215
let hits = [];

function update(delta) {
  updatePlayerPositions();
  updateProjectilePositions(delta);
  checkCollisions();
  updateBlood();

  io.emit('update players', players);
  io.emit('update projectiles', projectiles);
}

function getVariedAngle(angle) {
  const angleVariance = 15;
  return getRandomArbitrary(angle - angleVariance, angle + angleVariance);
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function updateBlood() {
  hits.forEach((hit) => {
    const originalData = distanceAndAngleBetweenTwoPoints(hit.x1, hit.y1, hit.x2, hit.y2);
    const originalVector = new Vector(BULLET_VELOCITY, originalData.angle);

    for(var i = 0; i < BLOOD_PARTICLE_LIMIT; i++) {
      const targetVector = new Vector(BULLET_VELOCITY, getVariedAngle(originalData.angle));

      const projectile = {
        type: 'blood',
        id: projectileId,
        x: hit.x1,
        y: hit.y1,
        h: 4,
        w: 4,
        x1: hit.x1,
        y1: hit.y1,
        x2: hit.x2,
        y2: hit.y2,
        angle: getVariedAngle(originalData.angle),
        distance: getRandomArbitrary(BLOOD_DISTANCE.MIN, BLOOD_DISTANCE.MAX),
        color: '#bd1010'
      };
      projectileId++;
      projectiles.push(projectile);
    }
  });
  hits = [];
}

function checkCollisions() {
  players.forEach((play, playI) => {
    projectiles.forEach((proj, projI) => {
      // Don't shoot yourself
      if(proj.playerId == play.id || proj.type != 'bullet') {
        return;
      }
      if((proj.x >= play.x) &&
        (proj.x <= play.x + play.w) &&
        (proj.y >= play.y) &&
        (proj.y <= play.y + play.h)) {
          playerHit(play, playI, proj, projI);
          hits.push({ x1: play.x, y1: play.y, x2: proj.x2, y2: proj.y2 });
        }
    });
  });
}

function playerHit(player, playerI, projectile, projectileI) {
  player.hp -= BULLET_DAMAGE;
  io.emit('player hit', player.id);
  checkPlayerDead(player, playerI);
  removeProjectile(projectile, projectileI);
}

function checkPlayerDead(player, playerI) {
  if(player.hp <= 0) {
    player.respawn();
  }
}

function updatePlayerPositions() {
  players.forEach((player) => {
    if (player.MOVE_UP && player.y > 0) {
      player.y -= PLAYER_SPEED;
    }

    if (player.MOVE_RIGHT && player.x + player.w < WORLD_WIDTH) {
      player.x += PLAYER_SPEED;
    }

    if (player.MOVE_DOWN && player.y + player.h < WORLD_HEIGHT) {
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
  projectiles.forEach((p, i) => {

    //TODO: Could probably calculate these things once on object creation instead of during each loop
    const data = distanceAndAngleBetweenTwoPoints(p.x1, p.y1, p.x2, p.y2);
    const velocity = PROJECTILE_SPEED; //data.distance / speed; //just going to use a constant speed
    let angle;
    
    // TODO: hacked in for blood particles
    if(p['angle']) {
      angle = p['angle'];
    } else {
      angle = data.angle;
    }

    const toTargetVector = new Vector(velocity, angle);
    const elapsedSeconds = delta * 100;

    p.x += (toTargetVector.magnitudeX * elapsedSeconds);
    p.y += (toTargetVector.magnitudeY * elapsedSeconds);

    // TODO: hacked in for blood particles
    if(p['distance']) {
      const distanceTraveled = calcDistance(p.x1, p.y1, p.x, p.y);
      if(distanceTraveled > p.distance) {
        removeProjectile(p, i);
      }
    }
    checkProjectileAgainstBounds(p, i);
  });
}

function calcDistance(x1, x2, y1, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
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

function removePlayer(p, i) {
  players.splice(i, 1);
  io.emit('remove player', p.id);
}