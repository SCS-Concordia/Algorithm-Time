var Action = require("../../action");

module.exports = Action.createCustom(
    "worker online",
    ["cluster"],
    function(self) {
        return { id: self._data.cluster.worker.id };
    }
);
