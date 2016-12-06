module.exports = function(models){

	var express = require('express');
	var viewUtils = require(__base + '/libs/viewUtils');
	var router = express.Router();

	function adminExists(res, found, notFound) {
		var count = 0;
		models.user_model.find({level: viewUtils.level.ADMIN}, function(err, users) {
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
			viewUtils.load(res, 'install/index');
		});
	});

	router.post('/', function(req, res, next) {

		adminExists(res, function(res) {
			res.redirect('/error');
		}, function(res) {
			models.user_model.findOne({nickname: req.body.nickname}, function(err, user) {
				if(err) {
					viewUtils.load(res, 'install/index', {error_msg: "Error connecting to the database. Try again!"});
				} else {

					if(user != null) {
						user.level= viewUtils.level.ADMIN;
						user.save(function(err) {
							if(err) {
								viewUtils.load(res, 'install/index', {error_msg: "Error occured. User not promoted."});
							} else {
								viewUtils.load(res, 'install/index', {success_msg: "'" + req.body.nickname + "' added as admin!"});
							}
						});
					} else {
						viewUtils.load(res, 'install/index', {error_msg: "Nickname not found!"});
					}
				}	
			});
		});
	});

	return router;
}
