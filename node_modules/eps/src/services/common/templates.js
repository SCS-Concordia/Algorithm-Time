var path   = require("path");
var RxMap  = require("rx-map");
var Rx     = require("rx");
var jade   = require("jade");
var extend = require("lodash").extend;

module.exports = function(container) {
    var base = path.join(__dirname, "../../views");
    return Rx.Observable.returnValue(function(template, data) {
        return jade.renderFile(path.join(base, template), extend(data || {}, {
            cache: true
        }));
    });
};
