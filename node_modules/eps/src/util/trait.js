var keys       = require("lodash").keys;
var difference = require("lodash").difference;
var extend     = require("lodash").extend;

module.exports = function(name, abstractMethods) {
    return {
        abstractMethods: function() {
            return abstractMethods;
        },
        implement: function(ctor, impl) {
            var missing = difference(abstractMethods, keys(impl));
            if (missing.length) {
                throw new Error([
                    "implementors of ",
                    name,
                    " must implement: ",
                    missing.join(", ")
                ].join(""));
            } else {
                ctor.prototype = extend(ctor.prototype, impl);
                return ctor;
            }
        }
    }
};
