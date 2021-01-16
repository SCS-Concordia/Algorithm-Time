module.exports = function (models) {

	var xss = require('xss');
	var express = require('express');
	var utils = require('../../libs/utils');
	var router = express.Router();
	var sha256 = require('js-sha256');

	function generateRandomKey(N /* size of the key */) {
		return Array(N + 1).join((Math.random().toString(36) + '00000000000000000').slice(2, 18)).slice(0, N);
	}

	function getAKeyAndRedirect(session, key, user, res) {
		models.session_model.find({ key: key }, function (err, keys) {
			if (keys.length > 0) {
				console.log("Key collision handled");
				var newkey = generateRandomKey(120);
				getAKeyAndRedirect(session, newkey, user, res);
			} else {
				session.key = key;
				res.cookie("session", session);
				session.id = user._id;
				user.lastLogin = new Date();
				user.save(function (err) {
					session.save(function (err) {
						res.redirect("../leaderboard");
					});
				});
			}
		});
	}

	router.get('/profile', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn) {
				console.log(data);
				res.redirect('profile/' + data.user.nickname);
			} else {
				res.redirect('/error');
			}
		});
	});

	router.get('/profile/:nickname', function (req, res, next) {
		data = {};
		utils.initializeSession(req, data, models, function (data) {
			if (data.loggedIn) {
				models.user_model.findOne({ nickname: req.params.nickname }, function (err, user) {

					if (err) {
						res.redirect('/error');
					} else {
						if (user != null) {
							data.profile = user;
							models.user_prob_model.aggregate([
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
										user: data.profile.nickname,
										accept: true
									}
								}
							], function (err, problems) {
								data.profile.problems = problems;
								data.profile.score = 0;

								console.log(data.profile.problems);

								for (var i = 0; i < data.profile.problems.length; i++) {
									if (data.profile.problems[i].complete) {
										data.profile.score += data.profile.problems[i].score;
									}
								}

								utils.load(res, 'user/profile', data);
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

	router.get('/register', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn) {
				res.redirect('profile');
			} else {
				data.user = {
					nickname: "",
					email: "",
					fullname: ""
				};
				utils.load(res, 'user/register', data);
			}
		});
	});

	/**
	 * Validates email.
	 * @param {*} email Email to validate.
	 * @returns If the email is valid.
	 */
	function validateEmail(email) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

	/**
	 * Validates user fields from registry form.
	 * @param {*} user The user to validate.
	 * @throws Error if user is not valid.
	 * @returns Returns true if valid.
	 */
	function validateUser(user) {
		// Assert that nickname is not null.
		if (user.nickname == undefined || user.nickname.trim() == '')
			throw `Nickname is required.`;

		// Assert that nickname is one word.
		if (user.nickname.split(' ').length != 1)
			throw `Nickname should not contain spaces.`;

		// Assert that nickname is less than MAX_STRING_SIZE.
		if (user.nickname.length >= utils.MAX_STRING_SIZE)
			throw `Nickname should be less than ${utils.MAX_STRING_SIZE} characters.`;

		// Assert that fullname is less than MAX_STRING_SIZE.
		if (user.fullname.length >= utils.MAX_STRING_SIZE)
			throw `Full name should be less than ${utils.MAX_STRING_SIZE} characters.`;

		// Asserts that email is valid.
		if (!validateEmail(user.email))
			throw `Email is invalid.`;

		// Assers password is not empty.
		if (user.password == undefined || user.password.trim() == '')
			throw `Password is required.`;

		// If all tests pass, the user is valid.
		return true;
	}

	router.post('/register', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn) {
				res.redirect('profile');
			} else {
				// Create a new user
				var user = new models.user_model;
				err_msg = "";

				// Set the data
				user.nickname = xss(req.body.nickname.toLowerCase());
				user.fullname = xss(req.body.fullname);
				user.email = xss(req.body.email.toLowerCase());
				user.password = xss(sha256(req.body.password));
				user.score = 0;
				user.date = new Date();
				user.level = utils.level.USER;
				user.lastLogin = null;

				// Logging
				console.log("Registration form submitted: " + user.nickname);

				try {
					if (validateUser(user)) {
						// Assert user nickname and user email is unique.
						models.user_model.find({ $or: [{ nickname: user.nickname }, { email: user.email }] }, function (err, users) {
							if (users.length > 0) {
								let error_msg = "";

								if (users[0].email == user.email) {
									error_msg = "This email already exists, please type another one";
								} else {
									error_msg = "This nickname already exists, please type another one";
								}

								utils.load(res, 'user/register', { error_msg, user });
							} else {
								// Save new user
								user.save(function (err) {
									if (err) {
										utils.load(res, 'user/register', { error_msg: "Couldn't connect to DB. Try again." });
										console.log("Couldn't save user to DB: " + err);
									} else {
										utils.load(res, 'user/login', { success_msg: "Successfully registered, please login." });
									}
								});
							}
						})
					}
				} catch (err) {
					utils.load(res, 'user/register', { error_msg: err, user });
				}
			}
		});
	});

	router.get('/edit/:nickname', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn && (data.user.level == utils.level.ADMIN || (data.user.nickname == req.params.nickname && data.user.level == utils.level.USER))) {
				models.user_model.findOne({ nickname: req.params.nickname }, function (err, user) {
					if (err) {
						utils.load(res, 'user/edit', { error_msg: "Error connecting to the database" });
					} else {
						if (user != null) {
							data.profile = user;
							utils.load(res, 'user/edit', data);
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

	router.post('/edit/:nickname', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn && (data.user.level == utils.level.ADMIN || data.user.nickname == req.params.nickname)) {
				models.user_model.findOne({ nickname: req.params.nickname }, function (err, user) {
					if (err) {
						utils.load(res, 'user/edit', { error_msg: "Error connecting to the database" });
					} else {
						if (user != null) {
							// Set the data
							user.fullname = xss(req.body.fullname);
							user.email = xss(req.body.email.toLowerCase());

							// If password is set
							if (req.body.password.length > 0) {
								user.password = xss(sha256(req.body.password));
							}

							// Allow admin to change user level
							if (data.user.level == utils.level.ADMIN) {
								user.level = req.body.level;
							}

							models.user_model.findOne({ email: user.email }, function (err, userForEmail) {

								// Store user's profile
								data.profile = user;

								// Already exists
								if (userForEmail != null && userForEmail.nickname != user.nickname) {
									data.error_msg = "This email already exists, please type another one";
									utils.load(res, 'user/edit', data);
								} else {

									// Save new user
									user.save(function (err) {
										if (err) {
											utils.load(res, 'user/edit', { error_msg: "Couldn't connect to DB. Try again." });
											console.log("Coudn't save user to DB: " + err);
										} else {
											data.success_msg = "Successfully updated";
											utils.load(res, 'user/edit', data);
										}
									});
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

	router.get('/guest', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn) {
				res.redirect('profile');
			} else {

				var randNickname = "at_" + parseInt(Math.random() * 10000000 + 1000);
				models.user_model.findOne({ nickname: randNickname }, function (err, guest) {
					if (err) {
						res.redirect('/error');
					} else {
						if (guest != null) {
							console.log('Duplicate guest nicknames, trying again ...');
							res.redirect('/user/guest');
						} else {

							// Create a new tmp user
							var user = new models.user_model;
							user.nickname = randNickname;
							user.fullname = randNickname;
							user.email = `${randNickname}@scsconcordia.ca`;
							user.password = "";
							user.score = 0;
							user.date = new Date();
							user.level = utils.level.GUEST;
							user.lastLogin = new Date();

							user.save(function (err) {
								if (err) {
									res.redirect('/error');
								} else {
									var session = new models.session_model;
									var key = generateRandomKey(120);
									getAKeyAndRedirect(session, key, user, res);
								}
							});
						}
					}
				});
			}
		});
	});

	router.get('/login', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn) {
				res.redirect('profile');
			} else {
				utils.load(res, 'user/login', data);
			}
		});
	});

	router.post('/login', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn) {
				res.redirect('profile');
			} else {
				models.user_model.find({ nickname: req.body.nickname.toLowerCase(), password: sha256(req.body.password) }, function (err, users) {
					// not valid credentials
					if (users.length < 1 || users.length > 1) {
						utils.load(res, 'user/login', { error_msg: "Invalid Login" });
					} else {
						var user = users[0];
						var session = new models.session_model;
						var key = generateRandomKey(120);

						getAKeyAndRedirect(session, key, user, res);
					}
				});
			}
		});
	});

	router.get('/logout', function (req, res, next) {
		if (req.cookies.session != undefined) {
			try {
				models.session_model.remove({ key: req.cookies.session.key }, function (err, status) {
					res.clearCookie("session");
					res.redirect("/");
				});
			} catch (e) {
				console.log(e);
				res.redirect("/");
			}
		} else {
			res.redirect("/");
		}
	});

	router.get('/delete/:nickname', function (req, res, next) {
		utils.initializeSession(req, {}, models, function (data) {
			if (data.loggedIn && data.user.level == utils.level.ADMIN) {
				models.user_model.findOne({ nickname: req.params.nickname }, function (err, user) {
					if (err) {
						res.send('500');
					} else {
						if (user != null) {
							user.remove(function (err) {
								if (err) {
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
