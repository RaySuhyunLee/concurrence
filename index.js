/* jshint esversion: 6 */

var express = require('express');
var router = express.Router();
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');
var User = require('./models/user');
var Auth = require('./controllers/auth');

console.log(Auth.session);
app.use(Auth.session);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', router);
app.use('/u', Auth.router);

router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '/views/index.html'));
});

// authorization
io.use(function(socket, next) {
  req = socket.handshake;
  res = { end: function() {} };
  
  Auth.session(req, res, function() {
    next();
  });
});

io.on('connection', function(socket){
  var userId = socket.handshake.session.userId;
  console.log(`user ${userId} connected`);
  socket.on('chat message', function(msg) {
    console.log(`message(${userId}): ${msg}`);
    io.emit('chat message', msg);
  });
  socket.on('disconnect', function() {
    console.log(`user ${userId} disconnected`);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
