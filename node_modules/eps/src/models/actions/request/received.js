var Action = require("../../action");

module.exports = Action.createCustom(
    "request received",
    ["request"],
    function(self) {
        return {
            method: self._data.request.method,
            url:    self._data.request.url
        };
    }
);
