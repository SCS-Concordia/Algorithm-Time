var mongoose = require('mongoose');

var sessionModel = new mongoose.Schema({
	key: String,
	id: String
});

module.exports = mongoose.model('session', sessionModel);
