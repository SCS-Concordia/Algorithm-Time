var Rx                    = require("rx");
var RequestReceivedAction = require("../../models/actions/request/received");

module.exports = function(data) {
    return data.serviceContainer("logger").map(function(logger) {
        logger.info(new RequestReceivedAction(data.request));
        return data;
    });
};
