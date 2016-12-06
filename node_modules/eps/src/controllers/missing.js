var Rx              = require("rx");
var handler         = require("rx-request-handler");
var MissingResponse = require("responses/response/ok");
var response        = require("../util/response");

module.exports = handler(function(data) {
    return response(MissingResponse, data, function() {
        return "";
    });
});
