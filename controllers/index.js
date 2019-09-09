var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');
var User = require('../models/user');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);

mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to db');
});

app.use(session({
  secret: 'change me later',
  resave: 'true',
  saveUninitialized: 'false',
  store: new MongoStore({
    mongooseConnection: db
  })
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '..', '/views/index.html'));
});

app.get('/signup', function(req, res) {
  res.sendFile(path.join(__dirname, '..', '/views/signup.html'));
});

app.post('/signup', function(req, res, next) {
	if (req.body.email &&
      req.body.username &&
      req.body.password &&
      req.body.passwordConf) {

		var userData = {
			email: req.body.email,
			username: req.body.username,
			password: req.body.password,
		};

		User.create(userData, function (err, user) {
			if (err) {
				return next(err);
			} else {
        req.session.userId = user._id;
				return res.redirect('/');
			}
		});
	}
});

app.get('/login', function(req, res) {
  res.sendFile(path.join(__dirname, '..', '/views/login.html'));
});

app.post('/login', function(req, res, next) {
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email,
        req.body.password,
        function (err, user) {
          if (err) {
            next(new Error('wrong email or password'));
          } else {
            req.session.userId = user._id;
            res.redirect('/');
          }
        });
  }

});

app.get('/logout', function(req, res, next) {
  if (req.session.userId) {
    req.session.userId = null;
    res.redirect('/login');
  }
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('chat message', function(msg) {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
