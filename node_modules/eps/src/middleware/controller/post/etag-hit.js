var Rx               = require("rx");
var crypto           = require("crypto");
var values           = require("lodash").values;
var CacheHitResponse = require("responses/response/cache-hit");
var responseConsumer = require("../../../util/response-consumer");

module.exports = function(response) {
    var request = response.getRequest();
    if (request.headers["if-none-match"]) {
        var view   = response.getView();
        var shasum = crypto.createHash("sha1");
        shasum.update(view());
        var digest = shasum.digest("hex");
        if (request.headers["if-none-match"] == digest) {
            var res     = response.getResponse();
            var hit     = new CacheHitResponse(
                request,
                res,
                view
            );
            hit._headers = response.getHeaders();
            return responseConsumer(hit);
        } else {
            return Rx.Observable.returnValue(response);
        }
    } else {
        return Rx.Observable.returnValue(response);
    }
};
