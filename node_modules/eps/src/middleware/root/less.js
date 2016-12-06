var fs                = require("fs");
var Rx                = require("rx");
var RxMap             = require("rx-map");
var less              = require("less");
var ContentTypeHeader = require("header/response/content-type");
var OkResponse        = require("responses/response/ok");
var responseConsumer  = require("../../util/response-consumer");
var etagHit           = require("../controller/post/etag-hit");
var etagResponse      = require("../controller/post/etag-response");

var _memo    = new RxMap();
var readFile = Rx.Observable.fromNodeCallback(fs.readFile);

module.exports = function(path, src) {
    return function(data) {
        if (data.request.url == path) {
            return _memo.putIfAbsent(path + src, function() {
                return readFile(src).flatMap(function(contents) {
                    var peices = src.split("/");
                    var name   = peices.pop();
                    var root   = peices.join("/");
                    var parser = new(less.Parser)({
                        paths:    [root],
                        filename: name
                    });
                    var parse = Rx
                        .Observable
                        .fromNodeCallback(parser.parse, null, parser);

                    return parse(contents.toString()).map(function(tree) {
                        return tree.toCSS();
                    });
                });
            }).flatMap(function(css) {
                var header   = new ContentTypeHeader("text/css");
                var response = new OkResponse(
                    data.request,
                    data.response,
                    function() { return css; }
                );
                return Rx
                    .Observable
                    .returnValue(response.withHeader(header))
                    .flatMap(etagHit)
                    .flatMap(etagResponse)
                    .flatMap(responseConsumer);
            });
        } else {
            return Rx.Observable.returnValue(data);
        }
    };
}
