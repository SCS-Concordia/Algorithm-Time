var rxServiceManager = require("rx-service-manager");

module.exports = rxServiceManager({
    "environment": require("./common/environment"),
    "config":      require("./common/config"),
    "templates":   require("./common/templates"),
    "logger":      require("./environment/logger")
});
