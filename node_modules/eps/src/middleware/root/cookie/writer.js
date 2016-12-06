var Rx              = require("Rx");
var cookie          = require("cookie");
var isEqual         = require("lodash").isEqual;
var SetCookieHeader = require("header/response/set-cookie");

module.exports = function(response) {
    var request = response.getRequest();
    if (!isEqual(request.cookies, request._initCookies)) {
        var modified = Object.keys(request.cookies).reduce(function(res, key) {
            var serialized = cookie.serialize(key, request.cookies[key], {
                httpOnly: true
            });
            return res.withHeader(new SetCookieHeader(serialized));
        }, response);
        return Rx.Observable.returnValue(modified);
    } else {
        return Rx.Observable.returnValue(response);
    }
};
