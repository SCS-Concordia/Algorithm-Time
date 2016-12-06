var util   = require("util");
var Action = require("../../action");

module.exports = Action.createCustom("worker died", ["worker"], function(self) {
    return { pid: self._data.worker.process.pid };
});
