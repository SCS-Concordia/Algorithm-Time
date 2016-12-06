var Rx     = require("Rx");
var cookie = require("cookie");
var clone  = require("lodash").clone;

module.exports = function(data) {
    if (data.request.headers.cookie) {
        var cookies               = cookie.parse(data.request.headers.cookie);
        data.request.cookies      = cookies;
        data.request._initCookies = clone(cookies);
        return Rx.Observable.returnValue(data);
    } else {
        data.request.cookies      = {};
        data.request._initCookies = {};
        return Rx.Observable.returnValue(data);
    }
};
