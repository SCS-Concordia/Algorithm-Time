var Success      = require("functional-validation/success");
var Failure      = require("functional-validation/failure");
var Rx           = require("rx");
var pick         = require("lodash").pick;
var argsToObject = require("./args-to-object");

var callApi = function(http, endPoint, data) {
    return http.postWithParams(endPoint, data).map(function(body) {
        var json = JSON.parse(body);
        switch(json.status) {
            case "ok":    return new Success(json.message);
            case "error": return new Failure(json.message);
            default:      return new Failure(json.message);
        }
    });
};

var api = function(endPoint, attributes, httpGetter) {
    return function() {
        var http = httpGetter(this);
        var data = argsToObject(arguments, attributes);
        return callApi(http, endPoint, data);
    };
};

api.formThenApi = function(formSchema, endPoint, attributes, httpGetter) {
    return function(post) {
        var http = httpGetter(this);
        var data = pick(post, attributes);
        var form = formSchema.validate(data);
        return form.fold(
            function(e) {
                return Rx.Observable.returnValue(e);
            },
            function(_) {
                return callApi(http, endPoint, data).map(function(n) {
                    return n.fold(
                        function(e) { return form.withError("", e[0]); },
                        function(_) { return form; }
                    );
                });
            }
        );
    };
};

module.exports = api;
