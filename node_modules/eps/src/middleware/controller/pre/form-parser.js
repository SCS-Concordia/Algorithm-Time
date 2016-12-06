var Rx = require("rx");
var qs = require("querystring");

module.exports = function(data) {
     if (data.request.method == "POST") {
         return Rx.Node.fromStream(data.request).reduce(function(memo, chunk) {
             return memo + chunk;
         }, "").map(function(str) {
             data.request.post = qs.parse(str);
             return data;
         });
     } else {
         throw new Error("form parser middleware only usable on POST requests");
     }
};
