var Rx      = require("rx");
var memoize = require("lodash").memoize;

var response = function(res, data, body) {
    return Rx.Observable.returnValue(new res(
        data.request,
        data.response,
        memoize(body)
    ));
};

var responseWithHeaders = function(res, data, headers, body) {
    return response(res, data, body).map(function(response) {
        return response.withHeaders(headers);
    });
};

response.withHeaders = responseWithHeaders;

module.exports = response;
