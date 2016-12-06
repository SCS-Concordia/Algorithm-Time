var fs   = require("fs");
var util = require("util");

function Environment(path) {
    var contents = fs.readFileSync(path, {encoding: "utf8"});
    if (contents == "production") {
        return new ProductionEnvironment();
    } else {
        return new DevelopmentEnvironment();
    }
}

Environment.development = 0;
Environment.production  = 1;

Environment.prototype.type = function() {
    throw new Error("must implement #type()");
};


function ProductionEnvironment() { }

util.inherits(ProductionEnvironment, Environment);

ProductionEnvironment.prototype.type = function() {
    return Environment.production;
};


function DevelopmentEnvironment() { }

util.inherits(DevelopmentEnvironment, Environment);

DevelopmentEnvironment.prototype.type = function() {
    return Environment.development;
};


Environment.production = ProductionEnvironment;
Environment.development = DevelopmentEnvironment;


module.exports = Environment;
