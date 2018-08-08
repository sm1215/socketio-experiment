var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const Player = require('./player.js');

const players = [];
const MOVE_AMOUNT = 5;

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

  socket.emit('player connected', player);
  socket.emit('draw players', players);
  socket.broadcast.emit('draw players', players);
  console.log('a user connected, players:', players);

  socket.on('click', function() {
    console.log("click!");
  });

  socket.on('up', function(playerId) {
    const player = getPlayer(playerId);
    player.y -= MOVE_AMOUNT;
    socket.emit('player moved', players);
    socket.broadcast.emit('player moved', players);
  });

  socket.on('down', function(playerId) {
    const player = getPlayer(playerId);
    player.y += MOVE_AMOUNT;
    socket.emit('player moved', players);
    socket.broadcast.emit('player moved', players);
  });

  socket.on('left', function(playerId) {
    const player = getPlayer(playerId);
    player.x -= MOVE_AMOUNT;
    socket.emit('player moved', players);
    socket.broadcast.emit('player moved', players);
  });

  socket.on('right', function(playerId) {
    const player = getPlayer(playerId);
    player.x += MOVE_AMOUNT;
    socket.emit('player moved', players);
    socket.broadcast.emit('player moved', players);
  });

  socket.on('send message', function(playerId, message) {
    console.log("send message", message);    
    socket.emit('message received', playerId, message);
    socket.broadcast.emit('message received', playerId, message);
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

