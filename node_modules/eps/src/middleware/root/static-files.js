var path        = require("path");
var Rx          = require("rx");
var RxMap       = require("rx-map");
var rxDirectory = require("rx-directory");
var filed       = require("filed");

var _memo = new RxMap();

var _getFiles = function(base, folder) {
    return _memo.putIfAbsent(folder, function() {
        return rxDirectory.recursive(folder).reduce(function(files, file) {
            var relative   = file.substr(folder.length);
            var normalized = path.join(base, relative);
            files[normalized] = file;
            return files;
        }, {});
    });
};

module.exports = function(base, folder) {
    return function(data) {
        return _getFiles(base, folder).flatMap(function(files) {
            if (files[data.request.url]) {
                filed(files[data.request.url]).pipe(data.response);
                return Rx.Observable.empty();
            } else {
                return Rx.Observable.returnValue(data);
            }
        });
    };
};
