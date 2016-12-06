var zip           = require("lodash").zip;
var pairsToObject = require("./pairs-to-object");

module.exports = function(args, attributes) {
    var array  = Array.prototype.slice.call(args, 0);
    var zipped = zip(attributes, args);
    return pairsToObject(zipped);
};
