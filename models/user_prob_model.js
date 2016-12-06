var mongoose = require('mongoose');

var userProbModel = new mongoose.Schema({
	user: String,
	prob: Number,
	score: Number,
	complete: Boolean,
	accept: Boolean,
	date: Date
});

module.exports = mongoose.model('userProb', userProbModel);
