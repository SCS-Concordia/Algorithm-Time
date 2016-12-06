var Rx = require("rx");

module.exports = function(service) {
    return function(data) {
        if (typeof(data.services) == "undefined") {
            data.services = {};
        }
        return data.serviceContainer(service).map(function(instance) {
            data.services[service] = instance;
            return data;
        });
    };
};
