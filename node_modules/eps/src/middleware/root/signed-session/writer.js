var Rx      = require("Rx");
var cookie  = require("cookie-signature");
var isEqual = require("lodash").isEqual;

module.exports = function(secret) {
    return function(response) {
        var request = response.getRequest();
        if (!isEqual(request.session, request._initSession)) {
            var serialized          = JSON.stringify(request.session);
            var signed              = cookie.sign(serialized, secret);
            request.cookies.session = signed;
            return Rx.Observable.returnValue(response);
        } else {
            return Rx.Observable.returnValue(response);
        }
    };
};
