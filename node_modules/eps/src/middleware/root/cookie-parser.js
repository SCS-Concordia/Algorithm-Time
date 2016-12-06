var Rx     = require("Rx");
var cookie = require("cookie");

module.exports = function(data) {
    if (data.request.headers.cookie) {
        var cookies               = cookie.parse(data.request.headers.cookie);
        data.request.cookies      = cookies;
        data.request._initCookies = cookies;
        return Rx.Observable.returnValue(data);
    } else {
        return Rx.Observable.returnValue(data);
    }
};
