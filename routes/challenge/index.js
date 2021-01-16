module.exports = function (models) {

	var express = require('express');
	var utils = require('../../libs/utils');
	var router = express.Router();

	router.get('/', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn) {
				// Handle displaying the challenge rooms here
				data.rooms = req.app.challenge.challenge_rooms;
				data.type_names = req.app.challenge.type_names;

				utils.load(res, 'challenge/index', data);
			} else {
				res.redirect('/error');
			}
		});
	});

	router.all('/room/:id', function (req, res, next) {
		var id = req.params.id;

		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn) {
				if (typeof req.app.challenge.challenge_rooms[id] !== undefined) {
					// Verify the user is allowed viewing this room
					utils.load(res, 'challenge/room', data);
				} else {
					res.redirect('/error');
				}
			} else {
				res.redirect('/error');
			}
		});
	});

	return router;
}