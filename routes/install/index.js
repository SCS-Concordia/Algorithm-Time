module.exports = function(models){

	var express = require('express');
	var utils = require('../../libs/utils');
	var router = express.Router();

	function adminExists(res, found, notFound) {
		models.user_model.find({level: utils.level.ADMIN}, function(err, users) {
			if(users.length == 0) {
				notFound(res);
			} else {
				found(res);
			}
		});
	}

	router.get('/', function(req, res, next) {
		adminExists(res, function(res) {
			res.redirect('/error');
		}, function(res) {
			utils.load(res, 'install/index');
		});
	});

	router.post('/', function(req, res, next) {
		adminExists(res, function(res) {
			res.redirect('/error');
		}, function(res) {
			models.user_model.findOne({nickname: req.body.nickname}, function(err, user) {
				if(err) {
					utils.load(res, 'install/index', {error_msg: "Error connecting to the database. Try again!"});
				} else {

					if(user != null) {
						user.level= utils.level.ADMIN;
						user.save(function(err) {
							if(err) {
								utils.load(res, 'install/index', {error_msg: "Error occured. User not promoted."});
							} else {
								utils.load(res, 'install/index', {success_msg: "'" + req.body.nickname + "' added as admin!"});
							}
						});
					} else {
						utils.load(res, 'install/index', {error_msg: "Nickname not found!"});
					}
				}	
			});
		});
	});

	return router;
}
