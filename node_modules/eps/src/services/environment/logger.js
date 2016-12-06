var RxMap       = require("rx-map");
var DevLogger   = require("./development/logger");
var Environment = require("../../util/environment");

var map = new RxMap();

function factory(container) {
    return map.putIfAbsent("", function() {
        return container("environment").map(function(environment) {
            switch(environment.type()) {
                case Environment.production:  return new DevLogger();
                case Environment.development: return new DevLogger();
                default:                      return new DevLogger();
            }
        });
    });
}

module.exports = factory;
