var util               = require("util");
var Form               = require("functional-form");
var RequiredValidator  = require("functional-form/validators/required");
var EmailValidator     = require("functional-form/validators/email");

function LoginEmailForm(data, errors) {
    Form.call(this, data, errors);
}

util.inherits(LoginEmailForm, Form);

LoginEmailForm.prototype.definition = function() {
    return {
        email: [
            new RequiredValidator("Invalid email address."),
            new EmailValidator("Invalid email address.")
        ]
    };
};

module.exports = LoginEmailForm;
