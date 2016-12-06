module.exports = function(models){

	var express = require('express');
	var viewUtils = require(__base + '/libs/viewUtils');
	var router = express.Router();

	router.get('/:id', function(req, res, next) {
		viewUtils.initializeSession(req, {}, models, function(data){
			if(data.loggedIn && data.user.level == viewUtils.level.ADMIN) {
				models.session_model.findOne({key: req.params.id}, function(err, session){
					if(err) {
						res.send('500');
					} else {
						if(session != null) {
							session.remove(function(err) {
								if(err) {
									res.send('500');
								} else {
									res.send('200');
								}
							});	
						} else {
							res.send('404');
						}
					}
				});
			} else {
				res.redirect('/error');
			}
		});
	});

	return router;
}
