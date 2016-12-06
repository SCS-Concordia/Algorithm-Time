// Global
global.__base = __dirname;
global.__base_url = "http://localhost:3000";
global.__db_url = "mongodb://localhost:27017/algorithm-time"

// Require
var express = require('express');
var app = express();
var server = require('http').Server(app);
app.io = require('socket.io')();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var cookie = require('cookie');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var xss = require('xss');
var viewUtils = require('./libs/viewUtils');

// Connect to DB
var models = {};
console.log("Connected to: " + __db_url);
mongoose.connect(__db_url);
models.user_model = require('./models/user_model.js');
models.session_model = require('./models/session_model.js');
models.room_model = require('./models/room_model.js');
models.user_prob_model = require('./models/user_prob_model.js');
models.prob_model = require('./models/prob_model.js');

var dropOldDatabaseOnStartup = false;
var clients = [];

// Drop old table
mongoose.connection.on('open', function(){
    if(dropOldDatabaseOnStartup){
      mongoose.connection.db.dropDatabase(function(err){
        if(err) {
          console.log(err);
        } else {
          console.log("Old DB dropped");
        }
      }); 
    }
});

// Routes
var home = require('./routes/home')(models);
var user = require('./routes/user/index')(models);
var room = require('./routes/room/index')(models);
var prob = require('./routes/prob/index')(models);
var install = require('./routes/install/index')(models);
var admin = require('./routes/admin/index')(models);
var session = require('./routes/session/index')(models);
var challenge = require('./routes/challenge/index')(models);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'eps');
app.set('view cache', false);
app.set('socketio', app.io);

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', home);
app.use('/user', user);
app.use('/room', room);
app.use('/prob', prob);
app.use('/install', install);
app.use('/admin', admin);
app.use('/session', session);
app.use('/challenge', challenge);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.redirect('/error');
});

// Socket based events
app.io.on('connection', function(socket){
  var finalRoute = socket.request.headers.referer.split('/').pop();
  var user = "guest";

  try{
    var cookief = socket.request.headers.cookie;
    var cookies = cookieParser.JSONCookies(cookie.parse(cookief));
    if(cookies.session == undefined){
      throw new Error("Undefined cookie");
    }
    user = cookies.session.key;
  }catch(e){
    var mod = 1;
    while(clients.indexOf(user+mod) != -1){
      mod++;
    }
    user = user+mod;
  }

  if(clients.indexOf(user) == -1){
    clients.push(user);
  }

  console.log(clients);
  app.io.sockets.emit('user_count', clients.length);

  socket.on('disconnect', function(socket){
    if(!clients.indexOf(user) > -1){
      clients.splice(clients.indexOf(user), 1);
    }
    app.io.sockets.emit('user_count', clients.length);
    console.log('a user disconnect');

    console.log(clients);
  });
});


// Handle challenge events
app.challenge = {};
app.challenge.MAX_ROOM_SIZE = [1, 3];
app.challenge.challenge_rooms = {};
app.challenge.type_names = ["OneVsOne", "Relay"];

function emitChallengeRoomsUpdate(socket){
  var temp_rooms = app.challenge.challenge_rooms;
  for(var key in temp_rooms){
    delete temp_rooms[key].password;

    for(var i = 0; i < temp_rooms[key].team_1.length; i++){
      delete temp_rooms[key].team_1[i].session;
    }

    for(var i = 0; i < temp_rooms[key].team_2.length; i++){
      delete temp_rooms[key].team_2[i].session;
    }
  }

  var data = {};
  data.rooms = temp_rooms;
  data.type_names = app.challenge.type_names;

  socket.emit("challenge_rooms_update", data);
}

app.io.of('/challenge')
   .on('connection', function(socket){
      var finalRoute = socket.request.headers.referer.split('/').pop();
      var route  = socket.request.headers.referer.split('/');
      var rRoute = route.reverse();

      if(rRoute[0] == "challenge"){
        emitChallengeRoomsUpdate(socket);
      }

      if(rRoute[2] + "/" + rRoute[1] == "challenge/room"){
        socket.join("challenge/room/"+finalRoute);
      }

      socket.on("join_challenge", function(data){
          // Try connecting to the given room

      });

      socket.on("create_challenge", function(data){
          // Handle errors here
          if(typeof data.title === "undefined" || typeof data.option === "undefined" || typeof data.password === "undefined"){
            this.emit("create_challenge_response", { response: "failure" });
          }

          var room   = {};
          room.title = data.title;
          room.type  = data.option;
          room.password = data.password;
          room.team_1   = [];
          room.team_2   = [];

          var room_number = 0;
          for(key in app.challenge.challenge_rooms){
            if(app.challenge.challenge_rooms[key + 1] === undefined){
              room_number = key + 1;
            }
          }
          room.room_number = room_number;
          app.challenge.challenge_rooms[room_number] = room;

          // Get all of the current user's data
          var cookies = cookieParser.JSONCookies(cookie.parse(socket.request.headers.cookie));
          viewUtils.initializeSession({ cookies: cookies }, 
            {}, models, function(data){
            if(data.loggedIn){
              var currentUser = {};
              currentUser.nickname = data.user.nickname;
              currentUser.session  = cookies.session.key;

              app.challenge.challenge_rooms[room_number].team_1.push(currentUser);

              socket.emit("create_challenge_response", { response: "success", room_number: room_number });

              emitChallengeRoomsUpdate(app.io.of('/challenge'));
            }else{
              // Guests cannot create rooms
              socket.emit("create_challenge_response", { response: "failure" });
            }
          });
      });
      
      socket.on("disconnect", function(socket){
        var cookies = cookieParser.JSONCookies(cookie.parse(this.request.headers.cookie));

        if(rRoute[2] + "/" + rRoute[1] == "challenge/room"){
          this.leave("challenge/room/"+finalRoute);

          var currentRooms = app.challenge.challenge_rooms[finalRoute];

          // Remove the user from the room
          for(var i = 0; i < currentRooms.team_1.length || i < currentRooms.team_2.length; i++){
            if(i < currentRooms.team_1.length && currentRooms.team_1[i].session == cookies.session.key){
              app.challenge.challenge_rooms[finalRoute].team_1.splice(i, 1);
              break;
            }else if(i < currentRooms.team_2.length && currentRooms.team_2[i].session == cookies.session.key){
              app.challenge.challenge_rooms[finalRoute].team_2.splice(i, 1);
              break;
            }
          }

          if(currentRooms.team_1.length + currentRooms.team_2.length == 1){
            // delete the room and update the rooms page
            delete app.challenge.challenge_rooms[finalRoute];

            emitChallengeRoomsUpdate(app.io.of('/challenge'));
          }else{
            app.io.of('/challenge').to('challenge/room/'+finalRoute).emit("update_room");
          }
        }
      });
   });

module.exports = app;
