var Rx           = require("rx");
var util         = require("util");
var extend       = require("lodash").extend;
var omit         = require("lodash").omit;
var zip          = require("lodash").zip;
var indigenous   = require("indigenous");
var argsToObject = require("../util/args-to-object");

function Action(type, data) {
    this._type = type;
    this._data = data;
}

Action.prototype._type = undefined;
Action.prototype._data = undefined;

Action.create = function(type, attributes) {
    var ctor = function() {
        Action.call(this, type, argsToObject(arguments, attributes));
    }
    util.inherits(ctor, Action);
    return ctor;
};

Action.createCustom = function(type, attributes, mapper) {
    var ctor = Action.create(type, attributes);

    ctor.prototype.data = function() { return mapper(this); };

    return ctor;
};

Action.prototype.fromObservable = function(observable, mapper) {
    var self  = this;
    var start = Date.now();
    return observable
        .map(mapper)
        .map(function(data) {
            return new Action(
                self.type(),
                extend({}, data, self.data(), {
                    latency: Date.now() - start
                }));
        })
        .catchException(function(error) {
            return Rx.Observable.throwException(new Action(
                self.type(), extend({}, self.data(), {
                    latency: Date.now() - start,
                    message: error.message,
                    stack:   error.stack
                })
            ));
        });
};

Action.prototype.fromObservableBoolean = function(observable) {
    return this.fromObservable(observable, function(bool) {
        return bool ? { status: "ok" }
                    : { status: "error" };
    });
};

Action.prototype.fromObservableValidation = function(observable) {
    return this.fromObservable(observable, function(validation) {
        return validation.toNative();
    });
};

Action.prototype.fromObservableForm = function(observable) {
    return this.fromObservable(observable, function(form) {
        if (form.hasErrors()) {
            return {
                status: "error",
                errors: form.getErrors()
            };
        } else {
            return { status: "ok" };
        }
    });
};

Action.prototype.toNative = function() {
    return extend({}, this.data(), { type: this.type() });
};

Action.prototype.type = function() {
    return this._type;
};

Action.prototype.data = function() {
    return this._data;
};

module.exports = Action;
