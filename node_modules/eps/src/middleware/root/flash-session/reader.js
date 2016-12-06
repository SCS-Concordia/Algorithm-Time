var Rx    = require("Rx");
var clone = require("lodash").clone;
var Some  = require("existence/some");
var None  = require("existence/none");

var _getCookies = function(request) {
    if (request.cookies) {
        return new Some(request.cookies);
    } else {
        return new None();
    }
};

var _getFlash = function(cookies) {
    if (cookies.flash) {
        try {
            return new Some(JSON.parse(cookies.flash));
        } catch(_) {
            return new None();
        }
    } else {
        return new None();
    }
};

var _getFlashSession = function(request) {
    return _getCookies(request).flatMap(function(cookies) {
        return _getFlash(cookies);
    }).getOrDefault({});
};

module.exports = function(data) {
    var flash               = _getFlashSession(data.request);
    data.request.flash      = flash;
    data.request._initFlash = clone(flash);
    return Rx.Observable.returnValue(data);
};
