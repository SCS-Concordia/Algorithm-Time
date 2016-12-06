module.exports = function(pairs) {
    return pairs.reduce(function(m, n) {
        m[n[0]] = n[1]
        return m;
    }, {});
};
