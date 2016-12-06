var Rx              = require("rx");
var handler         = require("rx-request-handler");
var OkResponse      = require("responses/response/ok");
var response        = require("../util/response");
var unauthenticated = require("../middleware/controller/pre/unauthenticated");
var requireService  = require("../middleware/controller/pre/require-service");
var etagHit         = require("../middleware/controller/post/etag-hit");
var etagResponse    = require("../middleware/controller/post/etag-response");

module.exports = handler({

    preAction: function(observable) {
        return observable
            .flatMap(unauthenticated)
            .flatMap(requireService("templates"));
    },

    action: function(data) {
        return response(OkResponse, data, function() {
            return data.services.templates("index.jade");
        });
    },

    postAction: function(observables) {
        return observables
            .flatMap(etagHit)
            .flatMap(etagResponse);
    }

});
