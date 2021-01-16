var mongoose = require('mongoose');
var utils = require('../libs/utils');

var userModel = new mongoose.Schema({
	id: Number,
	nickname: {
		type: String,
		unique: true,
		required: true,
		validate: function (v) {
			return v.length <= utils.MAX_STRING_SIZE;
		}
	},
	fullname: {
		type: String,
		required: true,
		validate: function (v) {
			return v.length <= utils.MAX_STRING_SIZE;
		}
	},
	email: {
		type: String,
		unique: true,
		required: true
	},
	password: String,
	score: Number,
	lastLogin: Date,
	level: {
		type: Number,
		default: utils.level.USER
	},
	date: Date
});

module.exports = mongoose.model('user', userModel);
