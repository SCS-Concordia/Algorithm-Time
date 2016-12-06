module.exports = function(models){
	var express = require('express');
	var viewUtils = require(__base + '/libs/viewUtils');
	var router = express.Router();

	router.get('/', function(req, res, next){
		viewUtils.initializeSession(req, {}, models, function(data){
			if(data.loggedIn) {
				// Handle displaying the challenge rooms here
				data.rooms = req.app.challenge.challenge_rooms;
				data.type_names = req.app.challenge.type_names;

				viewUtils.load(res, 'challenge/index', data);
			} else {
				res.redirect('/error');
			}
		});
	});

	router.all('/room/:id', function(req, res, next){
		var id = req.params.id;

		viewUtils.initializeSession(req, {}, models, function(data){
			if(data.loggedIn){
				if(typeof req.app.challenge.challenge_rooms[id] !== undefined){
					// Verify the user is allowed viewing this room
					viewUtils.load(res, 'challenge/room', data);
				}else{
					res.redirect('/error');
				}
			}else{
				res.redirect('/error');
			}
		});
	});

	return router;
}