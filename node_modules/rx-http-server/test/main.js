var RxHttpServer = require("../src/index.js");

var server = new RxHttpServer();

server.requests.subscribe(function(data) {
    data.response.writeHead(200, {"Content-Type": "text/plain"});
    data.response.end("Hello from Rx!");
});

server.listen(3000);
