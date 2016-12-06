var util              = require("util");
var Form              = require("functional-form");
var LoginEmailForm    = require("./login/email");
var LoginPasswordForm = require("./login/password");

var emailForm    = new LoginEmailForm();
var passwordForm = new LoginPasswordForm();

function LoginForm(data, errors) {
    Form.call(this, data, errors);
}

util.inherits(LoginForm, Form);

LoginForm.prototype.definition = function() {
    return {};
};

LoginForm.prototype.validate = function(form) {
    return emailForm.validate(form).flatMap(function(valid) {
        return passwordForm.validate(valid);
    });
};

module.exports = LoginForm;
