var Rx        = require("rx");
var container = require("../../services/container");

module.exports = function(data) {
    data.serviceContainer = container;
    return Rx.Observable.returnValue(data);
};
