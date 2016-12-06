var Rx                     = require("rx");
var util                   = require("util");
var terminal               = require("color-terminal");
var LoggerServiceInterface = require("../../interfaces/logger");

function DevelopmentLogger() { }

var _write = function(c, type, data) {
    terminal.colorize("[" + c + type + "%n] " + data + "\n");
};

module.exports = LoggerServiceInterface.implement(DevelopmentLogger, {

    info: function(action) {
        _write("%g", "info", JSON.stringify(action.toNative()));
    },

    error: function(action) {
        _write("%r", "error", JSON.stringify(action.toNative()));
    },

    observer: function() {
        var self = this;
        return Rx.Observer.create(
            function(action) { self.info(action); },
            function(action) { self.error(action); }
        );
    }

});

module.exports = DevelopmentLogger;
