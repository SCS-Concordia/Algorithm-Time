var Rx                   = require("rx");
var LocationHeader       = require("header/response/location");
var TempRedirectResponse = require("responses/response/temporary-redirect");
var responseConsumer     = require("../../../util/response-consumer");

module.exports = function(data) {
    if (!data.request.session.user) {
        return Rx.Observable.returnValue(data);
    } else {
        var response = new TempRedirectResponse(
            data.request,
            data.response,
            function() { return ""; }
        );
        response.withHeader(new LocationHeader("/email"));
        data.request.flash.origin = data.request.path;
        responseConsumer(response);
        return Rx.Observable.empty();
    }
};
