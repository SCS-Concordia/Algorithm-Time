var Rx        = require("Rx");
var cookie    = require("cookie-signature");
var Existence = require("existence");

var _getCookies = function(request) {
    if (request.cookies) {
        return new Existence(request.cookies);
    } else {
        return new Existence();
    }
};

var _getSession = function(cookies) {
    if (cookies.session) {
        return new Existence(cookies.session);
    } else {
        return new Existence();
    }
};

var _validatedSession = function(secret, signed) {
    var result = cookie.unsign(signed, secret);
    if (result) {
        return new Existence(JSON.parse(result));
    } else {
        return new Existence();
    }
};

var _getValidatedSession = function(secret, request) {
    return _getCookies(request).flatMap(function(cookies) {
        return _getSession(cookies).flatMap(function(session) {
            return _validatedSession(secret, session)
        });
    }).getOrDefault({});
};

module.exports = function(secret) {
    return function(data) {
        var session               = _getValidatedSession(secret, data.request);
        data.request.session      = session;
        data.request._initSession = session;
        return Rx.Observable.returnValue(data);
    };
};
