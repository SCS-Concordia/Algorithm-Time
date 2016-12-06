var Rx     = require("Rx");
var cookie = require("cookie-signature");
var Some   = require("existence/some");
var None   = require("existence/none");
var clone  = require("lodash").clone;

var _getCookies = function(request) {
    if (request.cookies) {
        return new Some(request.cookies);
    } else {
        return new None();
    }
};

var _getSession = function(cookies) {
    if (cookies.session) {
        return new Some(cookies.session);
    } else {
        return new None();
    }
};

var _validatedSession = function(secret, signed) {
    var result = cookie.unsign(signed, secret);
    if (result) {
        try {
            return new Some(JSON.parse(result));
        } catch(_) {
            return new None();
        }
    } else {
        return new None();
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
        data.request._initSession = clone(session);
        return Rx.Observable.returnValue(data);
    };
};
