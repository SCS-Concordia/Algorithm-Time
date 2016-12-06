var util               = require("util");
var Form               = require("functional-form");
var RequiredValidator  = require("functional-form/validators/required");
var MinLengthValidator = require("functional-form/validators/min-length");

function LoginPasswordForm(data, errors) {
    Form.call(this, data, errors);
}

util.inherits(LoginPasswordForm, Form);

LoginPasswordForm.prototype.definition = function() {
    return {
        password: [
            new RequiredValidator("Invalid username/password combination."),
            new MinLengthValidator(7, "Invalid username/password combination.")
        ]
    };
};

module.exports = LoginPasswordForm;
