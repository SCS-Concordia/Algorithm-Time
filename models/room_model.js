var mongoose = require('mongoose');

var roomModel = new mongoose.Schema({
	title: String,
	description: String,
	points: Number,
	room: Number,
	date: Date
});

module.exports = mongoose.model('rooms', roomModel);
