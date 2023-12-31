var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var championsQuotesRouter = require('./routes/championsQuotes');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');
var verifyLoginRouter = require('./routes/verifyLogin');
var werewolfRouter = require('./routes/werewolf');

var app = express();

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/championsQuotes', championsQuotesRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/verifyLogin', verifyLoginRouter);
app.use('/werewolf', werewolfRouter);

module.exports = app;
