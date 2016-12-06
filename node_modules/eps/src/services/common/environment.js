var Rx          = require("rx");
var RxMap       = require("rx-map");
var path        = require("path");
var Environment = require("../../util/environment");

var map = new RxMap();

module.exports = function(container) {
    return map.putIfAbsent("_", function() {
        return Rx.Observable.returnValue(
            Environment(path.join(__dirname, "../../../.env"))
        );
    });
};
