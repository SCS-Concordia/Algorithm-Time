var mongoose = require('mongoose');

var probModel = new mongoose.Schema({
	id: Number,
	title: String,
	score: Number,
	room: Number,
	description: String,
	date: Date
});

module.exports = mongoose.model('probs', probModel);
