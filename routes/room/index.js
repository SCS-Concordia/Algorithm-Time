module.exports = function (models) {

	var express = require('express');
	var utils = require('../../libs/utils');
	var router = express.Router();

	router.get('/create', function (req, res, next) {
		var data = {};

		// Check if logged in
		utils.initializeSession(req, data, models, function (data) {
			if (data.loggedIn && data.user.level == utils.level.ADMIN) {
				utils.load(res, 'room/create', data);
			} else {
				res.redirect('/error');
			}
		});
	});

	router.post('/create', function (req, res, next) {
		var data = req.body;

		utils.initializeSession(req, data, models, function (data) {
			if (data.loggedIn && data.user.level == utils.level.ADMIN) {

				// Get all rooms available
				models.room_model.find({}, function (err, rooms) {
					var room = new models.room_model;

					// Set the room number
					room.room = (rooms.length == 0) ? 1 : rooms[0].room + 1;

					// Form validation
					if (data.title == undefined || data.title.trim() == "" || data.description.trim() == "" || data.description == undefined) {
						data.error_msg = "Missing fields";
						utils.load(res, 'room/create', data);
					} else {
						room.title = data.title;
						room.description = data.description;
						room.date = new Date();
						room.points = 0;
						room.save(function (err) {
							if (err) {
								data.error_msg = "Error Saving Room";
								utils.load(res, 'room/create', data);
							} else {
								res.redirect('all');
							}
						});
					}

				}).sort({ room: -1 }).limit(1);
			} else {
				res.redirect('/error');
			}
		});
	});

	router.get('/all', function (req, res, next) {
		models.room_model.find({}, function (err, rooms) {
			data = { rooms: rooms };
			utils.initializeSession(req, data, models, function (data) {
				if (data.user == undefined) {
					res.redirect('/user/login');
				} else {
					utils.load(res, 'room/all', data);
				}
			});
		});
	});

	router.get('/:id(\\d+)/', function (req, res, next) {
		var room = req.params.id;
		models.room_model.findOne({ room: room }, function (err, roomObj) {
			if (err) {
				// If there is an issue, redirect to error page and return false.
				res.redirect('/error');
				return false;
			}

			data = { room: roomObj }
			utils.initializeSession(req, data, models, function (data) {
				if (data.room == null) {
					// If there is no room, redirect to error page.
					res.redirect('/error');
				} else if (!data.loggedIn) {
					res.redirect('/user/login');
				} else {
					models.user_prob_model.find({ user: data.user.nickname, accept: true }, function (err, rels) {
						data.solved = [];
						for (var i = 0; i < rels.length; i++) {
							data.solved.push(rels[i].prob);
						}
						models.prob_model.find({ room: roomObj.room }, function (err, probs) {
							data.probs = probs;

							models.prob_model.aggregate([
								{
									$match:
									{
										room: roomObj.room
									}
								},
								{
									$lookup:
									{
										from: "userprobs",
										localField: "id",
										foreignField: "prob",
										as: "userprobs"
									}
								},
								{
									$unwind: "$userprobs"
								},
								{
									$match:
									{
										"userprobs.accept": true
									}
								},
								{
									$group:
									{
										_id: "$userprobs.user",
										totalScore: { $sum: "$score" },
										count: { $sum: 1 }
									}
								},
								{
									$sort:
									{
										totalScore: -1
									}
								}
							], function (err, leaderboards) {
								data.room_leaderboards = leaderboards;

								utils.load(res, 'room/index', data);
							});
						}).sort({ score: 1 });
					});
				}
			});
		});
	});

	router.get('/delete/:id', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn && data.user.level == utils.level.ADMIN) {

				// Find room to delete
				models.room_model.findOne({ room: req.params.id }, function (err, room) {
					if (err) {
						res.send('500');
					} else {
						if (room != null) {

							// Find problems in that room
							models.prob_model.find({ room: req.params.id }, function (err, probs) {
								if (err) {
									res.send('500');
								} else {

									var probsId = [];
									for (var i = 0; i < probs.length; i++) {
										probsId.push(probs[i].id);
									}

									// Remove user problem entries
									models.user_prob_model.remove({ prob: { $in: probsId } }, function (err) {
										room.remove(function (err) {
											if (err) {
												res.send('500');
											} else {

												// Remove problems
												models.prob_model.remove({ room: req.params.id }, function (err) {
													if (err) {
														res.send('500');
													} else {

														// Remove room
														room.remove(function (err) {
															if (err) {
																res.send('500');
															} else {
																res.send('200');
															}
														});
													}
												});
											}
										});
									});
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

	router.get('/edit/:id', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn && data.user.level == utils.level.ADMIN) {
				models.room_model.findOne({ room: req.params.id }, function (err, room) {
					if (err) {
						console.log("Error: " + err);
						res.redirect('/error');
					} else {
						if (room != null) {
							data.room = room;
							utils.load(res, 'room/edit', data);
						} else {
							res.redirect('/error');
						}
					}
				});
			} else {
				res.redirect('/error');
			}
		});
	});

	router.post('/edit/:id', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn && data.user.level == utils.level.ADMIN) {
				models.room_model.findOne({ room: req.params.id }, function (err, room) {
					if (err) {
						console.log("Error: " + err);
						res.redirect('/error');
					} else {
						if (room != null) {

							room.title = req.body.title;
							room.description = req.body.description;
							data.room = room;

							room.save(function (err) {
								if (err) {
									data.error_msg = "Error connecting to the database";
									utils.load(res, 'room/edit', data);
								} else {
									data.success_msg = "Room updated";
									utils.load(res, 'room/edit', data);
								}
							});
						} else {
							res.redirect('/error');
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

