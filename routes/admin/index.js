module.exports = function (models) {

	var express = require('express');
	var utils = require('../../libs/utils');
	var router = express.Router();

	function admin(req, res, callback) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn && data.user.level == utils.level.ADMIN) {
				callback(data);
			} else {
				res.redirect('/error');
			}
		});
	}

	router.get('/', function (req, res, next) {
		admin(req, res, function (data) {
			utils.load(res, 'admin/index', data);
		});
	});

	router.get('/users', function (req, res, next) {
		admin(req, res, function (data) {
			models.user_model.find({}, function (error, users) {
				data.users = users;
				utils.load(res, 'admin/users', data);
			});
		});
	});

	router.get('/sessions', function (req, res, next) {
		admin(req, res, function (data) {
			models.session_model.find({}, function (error, sessions) {
				models.user_model.find({}, function (err, users) {
					console.log(sessions);
					for (var i = 0; i < sessions.length; i++) {
						sessions[i].nickname = "Not available";
						for (var j = 0; j < users.length; j++) {
							if (sessions[i].id == users[j]._id) {
								sessions[i].nickname = users[j].nickname;
								break;
							}
						}
					}
					data.sessions = sessions;
					utils.load(res, 'admin/sessions', data);
				});
			});
		});
	});

	router.get('/rooms', function (req, res, next) {
		admin(req, res, function (data) {
			models.room_model.find({}, function (error, rooms) {
				data.rooms = rooms;
				utils.load(res, 'admin/rooms', data);
			});
		});
	});

	router.get('/probs', function (req, res, next) {
		admin(req, res, function (data) {
			models.prob_model.find({}, function (error, probs) {
				data.probs = probs;
				utils.load(res, 'admin/probs', data);
			});
		});
	});

	router.get('/delete_guests', function (req, res, next) {
		admin(req, res, function (data) {
			models.user_model.remove({ level: utils.level.GUEST }, function (err) {
				if (err) {
					res.send('500');
				} else {
					res.send('200');
				}
			});
		});
	});
	return router;
}
