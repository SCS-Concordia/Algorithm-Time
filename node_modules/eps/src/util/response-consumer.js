var Rx       = require("rx");
var Response = require("responses/response");

module.exports = function(response) {
    if (response instanceof Response) {
        var res  = response.getResponse();
        var view = response.getView();
        res.writeHead(response.statusCode(), response.getHeaders());
        res.end(view());
        return Rx.Observable.empty();
    } else {
        throw new Error("response-consumer only accepts Response objects");
    }
};
