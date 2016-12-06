var Rx         = require("rx");
var crypto     = require("crypto");
var EtagHeader = require("header/response/etag");

module.exports = function(response) {
    var view   = response.getView();
    var shasum = crypto.createHash("sha1");
    shasum.update(view());
    var digest = shasum.digest("hex");
    var header = new EtagHeader(digest);
    return Rx.Observable.returnValue(response.withHeader(header));
};
