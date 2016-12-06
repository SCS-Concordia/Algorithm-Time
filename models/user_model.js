var mongoose = require('mongoose');

var userModel = new mongoose.Schema({
	id: Number,
	nickname: String,
	fullname: String,
	email: String,
	password: String,
	score: Number,
	lastLogin: Date,
	level: Number,
	date: Date
});

module.exports = mongoose.model('user', userModel);
