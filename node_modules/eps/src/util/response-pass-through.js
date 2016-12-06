var Rx       = require("rx");
var Response = require("responses/response");

module.exports = function(flatMapper) {
    return function(data) {
        if (data instanceof Response) {
            return Rx.Observable.returnValue(data);
        } else {
            return flatMapper(data);
        }
    };
};
