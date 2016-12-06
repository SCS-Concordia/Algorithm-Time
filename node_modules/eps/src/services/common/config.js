var Rx       = require("rx");
var RxMap    = require("rx-map");
var rxConfig = require("rx-config");
var strategy = require("rx-config/strategies/recursive-directory");
var path     = require("path");

var map = new RxMap();

module.exports = function(container) {
    return map.putIfAbsent("", function() {
        return rxConfig(
            strategy(path.join(__dirname, "../../config/common")),
            strategy(path.join(__dirname, "../../config/env/development")),
            strategy(path.join(__dirname, "../../config/local"))
        );
    });
};
