var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var cookie = require('cookie');
var path = require('path');
var User = require('../models/user');

mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to db');
});

var session = session({
  secret: 'change me later',
  resave: 'true',
  saveUninitialized: 'false',
  store: new MongoStore({
    mongooseConnection: db
  })
});

router.get('/signup', function(req, res) {
  res.sendFile(path.join(__dirname, '..', '/views/signup.html'));
});

router.post('/signup', function(req, res, next) {
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

router.get('/login', function(req, res) {
  res.sendFile(path.join(__dirname, '..', '/views/login.html'));
});

router.post('/login', function(req, res, next) {
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

router.get('/logout', function(req, res, next) {
  if (req.session) {
    req.session.destroy(function(err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('login');
      }
    });
  }
});

module.exports = {
  router: router,
  session: session
};
