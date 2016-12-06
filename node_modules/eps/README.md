EPS Web Framework
=================

An oppinionated reactive server side web framework for node.js based off of
RxJS.

Install
-------

Clone the repo to a destination of your choice:
```
git clone git@github.com:WarpcoreLabs/eps.git
```

Install the dependencies:
```
npm install
```

Fire the bass cannon:
```
npm start
```

Pick up your loot at [http://localhost:3000](http://localhost:3000)

The basics
----------

EPS is part framework part lego kit. It gives you lots of powerful components
to snap together and you can choose to create or replace whatever components
you see fit.

A basic setup starts with a master process spawning, monitoring and reviving
worker processes. The worker processes spin up HTTP servers and compose
a set of request handling components together known as `root middleware`.
At the end of the `root middleware` composition there is a responseConsumer
subscribed too it that takes responses and sends them to the client.

This basic setup typically lives in your src/main.js file and will look
something like the following:
```javascript
var cluster             = require("cluster");
var os                  = require("os");
var RxHttpServer        = require("rx-http-server");
var requestLogger       = require("./middleware/root/request-logger");
var less                = require("./middleware/root/less");
var staticFiles         = require("./middleware/root/static-files");
var services            = require("./middleware/root/services");
var cookieReader        = require("./middleware/root/cookie/reader");
var cookieWriter        = require("./middleware/root/cookie/writer");
var flashSessionReader  = require("./middleware/root/flash-session/reader");
var flashSessionWriter  = require("./middleware/root/flash-session/writer");
var signedSessionReader = require("./middleware/root/signed-session/reader");
var signedSessionWriter = require("./middleware/root/signed-session/writer");
var router              = require("./middleware/root/router");

var cpus       = os.cpus().length;
var server     = new RxHttpServer();
var lessPath   = path.join(__dirname, "public/css/main.less");
var publicPath = path.join(__dirname, "public");

if (cluster.isMaster) {
    for (var i = 0; i < cpus; i++) {
        cluster.fork();
    }
    cluster.on("exit", function(worker, code, signal) {
        logger.error(new WorkerDiedAction(worker));
        cluster.fork();
    });
} else {
    server
        .requests
        .flatMap(services)
        .flatMap(requestLogger)
        .flatMap(less("/public/css/main.css", lessPath))
        .flatMap(staticFiles("/public", publicPath))
        .flatMap(cookieReader)
        .flatMap(flashSessionReader)
        .flatMap(signedSessionReader("Why is a raven like a writing desk?"))
        .flatMap(router)
        .flatMap(signedSessionWriter("Why is a raven like a writing desk?"))
        .flatMap(flashSessionWriter)
        .flatMap(cookieWriter)
        .subscribe(responseConsumer);
    server.listen(3000);
}
```

Likewise, each controller is a composition of components. The actual controller
`action` is preceded by an optional and custom `preAction` pipeline and followed
by another optional and custom `postAction` pipeline.

A simple example that makes sure a user is unauthenticated and grabs the
template service in the `preAction` pipeline and does etag cache checking
in the `postAction` pipeline would look something like this:
```javascript
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
```
