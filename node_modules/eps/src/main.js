var path                = require("path");
var cluster             = require("cluster");
var os                  = require("os");
var RxHttpServer        = require("rx-http-server");
var extend              = require("lodash").extend;
var serviceContainer    = require("./services/container");
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
var responseConsumer    = require("./util/response-consumer");
var WorkerOnlineAction  = require("./models/actions/worker/online");
var WorkerDiedAction    = require("./models/actions/worker/died");

var cpus       = os.cpus().length;
var server     = new RxHttpServer();
var lessPath   = path.join(__dirname, "public/css/main.less");
var publicPath = path.join(__dirname, "public");

if (cluster.isMaster) {
    serviceContainer("logger").subscribe(function(logger) {
        for (var i = 0; i < cpus; i++) {
            cluster.fork();
        }
        cluster.on("exit", function(worker, code, signal) {
            logger.error(new WorkerDiedAction(worker));
            cluster.fork();
        });
    });
} else {
    var loggerService = serviceContainer("logger");

    loggerService.subscribe(function(logger) {
        logger.info(new WorkerOnlineAction(cluster));
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
    });
}
