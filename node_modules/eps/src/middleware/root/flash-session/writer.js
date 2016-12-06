var Rx          = require("Rx");
var isEqual     = require("lodash").isEqual;
var isUndefined = require("lodash").isEqual;
var pick        = require("lodash").pick;

module.exports = function(response) {
    var request = response.getRequest();
    var initial = request._initFlash;
    var fresh   = pick(request.flash, function(value, key) {
        return isUndefined(initial[key]) || !isEqual(initial[key], value);
    });
    request.cookies.flash = JSON.stringify(fresh);
    return Rx.Observable.returnValue(response);
};
