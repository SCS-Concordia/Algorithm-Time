Rx Router
=========
A server http request router built with RxJS.

Example
-------
```javascript
var Rx           = require("rx");
var RxHttpServer = require("rx-http-server");
var router       = require("rx-router");

var defaultHandler = function(data) {
    data.result = "no match found";
    return Rx.Observable.fromArray([data]);
};

var rootHandler = function(data) {
    data.result = "hello from root";
    return Rx.Observable.fromArray([data]);
};

var regexHandler = function(data) {
    data.result = "hello from regex";
    return Rx.Observable.fromArray([data]);
};

var server = new RxHttpServer();
var routes = router(defaultHandler, {
    "GET": [
        ["/",           rootHandler],
        [/^\/test\/.+/, regexHandler]
    ]
});

server.requests.flatMap(routes).subscribe(function(data) {
    data.response.writeHead(200, {"Content-Type": "text/plain"});
    data.response.end(data.result);
});

server.listen(3000);
```
