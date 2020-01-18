module.exports = function (models) {

	var express = require('express');
	var utils = require('../libs/utils');
	var router = express.Router();

	router.get('/500.shtml', function(req, res, next) {
		data = {};
		utils.initializeSession(req, data, models, function (data) {
			models.user_model.count({}, function (err, usercount) {
				data.usercount = usercount;
				models.room_model.count({}, function (err, roomcount) {
					data.roomcount = roomcount;
					utils.load(res, 'index', data);
				});
			});
		});
	});

	router.get('/leaderboard', function (req, res, next) {
		data = {};
		utils.initializeSession(req, data, models, function (data) {
			var currUser = "";
			if (typeof data.user != "undefined") {
				currUser = data.user.nickname;
			}
			models.user_model.aggregate([
				{
					$lookup: {
						from: "userprobs",
						localField: "nickname",
						foreignField: "user",
						as: "solved"
					}
				},
				{
					$project: {
						"_id": 1,
						"nickname": 1,
						"fullname": 1,
						"lastLogin": 1,
						"solved": {
							$filter: {
								"input": "$solved",
								"as": "solved",
								"cond": { "$eq": ["$$solved.accept", true] }
							}
						}
					}
				}
			], function (error, users) {
				data.users = users;
				data.currentUser = currUser;
				for (var i = 0; i < users.length; i++) {
					users[i].score = 0;
					for (var j = 0; j < users[i].solved.length; j++) {
						users[i].score += users[i].solved[j].score;
					}
				}
				data.users.sort(function (a, b) { return b.score - a.score });
				utils.load(res, 'leaderboard', data);
			});
		});
	});

	router.get('/submissions', function (req, res, next) {
		data = {};

		utils.initializeSession(req, data, models, function (data) {
			if (data.user == undefined || data.user.level != utils.level.ADMIN) {
				res.redirect('/');
			} else {
				models.user_prob_model.aggregate([
					{
						$lookup:
						{
							from: "users",
							localField: "user",
							foreignField: "nickname",
							as: "user_docs"
						}
					},
					{
						$lookup:
						{
							from: "probs",
							localField: "prob",
							foreignField: "id",
							as: "prob_docs"
						}
					},
					{
						$match:
						{
							complete: false,
						}
					},
					{
						$sort:
						{
							date: 1,
						}
					}
				], function (error, rels) {
					data.rels = rels;
					utils.load(res, 'submissions/index', data);
				});
			}
		});
	});

	router.get('/error', function (req, res, next) {
		data = { error: { message: "Oups :(", stack: "There seems to be an error with this page." } };
		utils.initializeSession(req, data, models, function (data) {
			utils.load(res, 'error', data);
		});
	});

	return router;
}
