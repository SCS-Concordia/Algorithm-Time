var router = require("rx-router");

module.exports = router(require("../../controllers/missing"), {
    "GET": [
        ["/", require("../../controllers/index")]
    ]
});
