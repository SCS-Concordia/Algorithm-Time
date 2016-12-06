module.exports = function(models) {
	
	var express = require('express');
	var viewUtils = require(__base + '/libs/viewUtils');
	var router = express.Router();
	var ObjectId = require('mongodb').ObjectID;

	// Submit a problem for review, and admin will need to review the submission before points are awarded
	router.get('/review/:id(\\d+)/', function (req, res, next) {
		models.prob_model.findOne({id: req.params.id}, function(err, prob){
			data = {prob:prob};
			viewUtils.initializeSession(req, data, models, function(data){
				if(data.user == undefined){
					res.redirect('/');
				}else{
					models.user_prob_model.count({user: new ObjectId(data.user._id), prob: prob.id}, function(err, count){
						if(count < 1){
							var user_prob = new models.user_prob_model;
							user_prob.user = data.user.nickname;
							user_prob.prob = prob.id;
							user_prob.score = prob.score;
							user_prob.complete = false;
							user_prob.date = new Date();
							user_prob.save(function(err){
								res.redirect('../'+prob.id);
							});	
						}else{
							res.redirect('../'+prob.id);
						}
					});	
				}
			});
		});
	});

	// Mark a submission as valid, awarding points to the user who completed it
	// ADMIN ONLY
	router.get('/complete/:id/', function (req, res, next) {
		models.user_prob_model.findOne({_id: new ObjectId(req.params.id)}, function(error, rel){
			data = {rel:rel};
			viewUtils.initializeSession(req, data, models, function(data){
				if(data.user == undefined || data.user.level != viewUtils.level.ADMIN){
					res.redirect('/');
				}else{
					rel.complete = true;
					rel.accept = true;
					rel.save(function(err){
						var io = req.app.get('socketio');
						var currUser = "";
						if(typeof data.user != "undefined"){
							currUser = data.user.nickname;
						}
						models.user_model.aggregate([
						    {
						        $lookup:{
						              from: "userprobs",
						              localField: "nickname",
						              foreignField: "user",
						              as: "solved"
						            }
						    },
						    {
						        $project:{
						            "_id":1,
						            "nickname":1,
						            "fullname":1,
						            "lastLogin":1,
						            "solved": {
						               $filter: {
						                "input": "$solved",
						                "as": "solved",
						                "cond": { "$eq": [ "$$solved.complete", true ] }
						              }
						            }
						        }
						    }
						], function(error, users){
							data.users = users;
							data.currentUser = currUser;
							for(var i = 0; i < users.length; i++){
								users[i].score = 0;
								for(var j = 0; j < users[i].solved.length; j++){
									users[i].score += users[i].solved[j].score;
								}
							}
							data.users.sort(function(a, b){return b.score-a.score});
	    				io.emit('leaderboard', data);
							res.redirect('/submissions');
						});
					});	
				}
			});
		});
	});

	// Mark a submission as invalid, this will not award points and will make it so the user has to resubmit
	// ADMIN ONLY
	router.get('/incomplete/:id/', function (req, res, next) {
		viewUtils.initializeSession(req, {}, models, function(data){
			if(data.user == undefined || data.user.level == viewUtils.level.ADMIN){
				models.user_prob_model.findOne({_id: new ObjectId(req.params.id)}, function(error, rel){
					rel.accept = false;
					rel.complete = true;
					rel.save(function(err) {
						if(err) {
							res.redirect('/error');
						} else {
							res.redirect('/submissions');
						}
					});
				});
			}else{
				res.redirect('/');
			}
		});
	});

	// Create a problem
	// ADMIN ONLY
	router.get('/create/:id(\\d+)/', function (req, res, next) {
		models.room_model.findOne({room: req.params.id}, function(err, room){
			data = {room:room};
			viewUtils.initializeSession(req, data, models, function(data){
				if(data.user == undefined || data.user.level != 0){
					res.redirect('/');
				}else{
					viewUtils.load(res, 'prob/create', data);	
				}
			});
		});
	});

	// View a specific problem's details and offer the ability to submit
	router.get('/:id(\\d+)/', function (req, res, next) {
		models.prob_model.findOne({id: req.params.id}, function(err, prob){
			data = {prob:prob, complete:true, accept:false};
			viewUtils.initializeSession(req, data, models, function(data){
				if(data.user == undefined){
					res.redirect('/error');
				}else{
					models.user_prob_model.find({user: data.user.nickname, prob: prob.id}, function(err, rels){
						if(rels.length > 0){
							for(var i=0; i < rels.length; i++) {
								data.complete = data.complete && rels[i].complete;
								data.accept = data.accept || rels[i].accept;
							}
						}
						data.rels = rels;
						viewUtils.load(res, 'prob/index', data);	
					});
				}
			});
		});
	});

	router.get('/create', function(req, res, next) {
		viewUtils.load(res, 'prob/create', {error_msg: "No room specified"});
	});

	router.post('/create', function(req, res, next) {
		data = req.body;
		viewUtils.initializeSession(req, data, models, function(data){
			if(data.user.level == 0){
				models.room_model.findOne({room:data.room}, function(err, room){
					models.prob_model.find({}, function(err, probs){

						var prob = new models.prob_model;
						prob.id = (probs.length == 0)?1:probs[0].id + 1;
						if(data.title == undefined || data.title.trim() == "" 
							|| data.description.trim() == "" || data.description == undefined
							|| data.score.trim() == "" || data.score == undefined){
							data.error_msg = "Missing fields";
							viewUtils.load(res, 'prob/create', data);
						}else{
							prob.title = data.title;
							prob.description = data.description;
							prob.date = new Date();
							prob.score = data.score;
							prob.room = room.room;
							room.points = room.points + prob.score;
							prob.save(function(err){
								room.save(function(err){
									if(err){
										data.error_msg = "Error Saving Prob";
										viewUtils.load(res, 'prob/create', data);
									}else{										
										res.redirect('/room/'+room.room);
									}
								});
							});	
						}
					}).sort({id:-1}).limit(1);
				});
			}
		});
	});

	router.get('/edit/:id', function(req, res, next) {
		viewUtils.initializeSession(req, {}, models, function(data){
			if(data.loggedIn && data.user.level == viewUtils.level.ADMIN) {
				models.prob_model.findOne({id: req.params.id}, function(err, prob){
					if(err) {
						res.redirect('/error');
						console.log("Error: " + err);
					} else {
						if(prob != null) {
						
							// Store prob
							data.prob = prob;

							// Get list of rooms
							models.room_model.find({}, function(err, rooms) {
								if(err) {
									res.redirect('/error');
									console.log('Error: ' + err);
								} else {
									data.rooms = rooms;
									viewUtils.load(res, "prob/edit", data);
								}
							});

						} else {
							console.log('/error');
						}
					}
				});
			} else {
				res.redirect('/error');
			}
		});
	});

	router.post('/edit/:id', function(req, res, next) {
		viewUtils.initializeSession(req, {}, models, function(data){
			if(data.loggedIn && data.user.level == viewUtils.level.ADMIN) {
				models.prob_model.findOne({id: req.params.id}, function(err, prob){
					if(err) {
						res.redirect('/error');
						console.log("Error: " + err);
					} else {
						if(prob != null) {
						
							// Get list of rooms
							models.room_model.find({}, function(err, rooms) {
								if(err) {
									res.redirect('/error');
									console.log('Error: ' + err);
								} else {
									
									var probOldScore = prob.score;
									var roomOldId = prob.room;

									prob.title = req.body.title;
									prob.room = req.body.room;
									prob.description = req.body.description;
									prob.score = req.body.score;
									
									data.rooms = rooms;
									data.prob = prob;

									if(!viewUtils.isset(prob.title) || !viewUtils.isset(prob.room) || !viewUtils.isset(prob.description) || !viewUtils.isset(prob.score)) {
										data.error_msg="Missing fields";
										viewUtils.load(res, 'prob/edit', data);
									} else {
										var room1 = undefined;
										var room2 = undefined;
										for(var i=0; i < rooms.length; i++) {
											if(rooms[i].room == roomOldId) {
												rooms[i].points -= probOldScore;
												room1 = rooms[i];
											}
											
											if(rooms[i].room == prob.room) {
												rooms[i].points += prob.score;
												room2 = rooms[i];
											}
										}

										if(room1 == undefined || room2 == undefined) {
											data.error_msg = "Room not found";
											viewUtils.load(res, 'prob/edit', data);
										} else {
											room1.save(function(r1Error){
												room2.save(function(r2Error){
													prob.save(function(pError){
														if(r1Error || r2Error || pError) {
															data.error_msg="Error connecting to the database";
															viewUtils.load(res, 'prob/edit', data);
														} else {
															data.success_msg="Problem updated";
															viewUtils.load(res, 'prob/edit', data);
														}
													});
												});
											});
										}
									}
								}
							});

						} else {
							console.log('/error');
						}
					}
				});
			} else {
				res.redirect('/error');
			}
		});
	});

	router.get('/delete/:id', function(req, res, next) {
		viewUtils.initializeSession(req, {}, models, function(data){
			if(data.loggedIn && data.user.level == viewUtils.level.ADMIN) {
				models.prob_model.findOne({id: req.params.id}, function(err, prob){
					if(err) {
						res.send('500');
					} else {
						if(prob != null) {

							models.room_model.findOne({room: prob.room}, function(err, room) {
								if(err) {
									res.send('500');
								} else {
									if(room != null) {
										room.points -= prob.score;
										room.save(function(rError){
											prob.remove(function(pError) {
												if(rError | pError) {
													res.send('500');
												} else {
													res.send('200');
												}
											});	
										});
									} else {
										res.send('404');
									}
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

