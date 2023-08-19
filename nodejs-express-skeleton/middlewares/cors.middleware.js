const cors = (_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE, Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.header("X-XSS-Protection", "1; mode=block");
    res.header("cache-control", "no-store");
    res.header("pragma", "no-cache");
    res.header("X-Content-Type-Options", "no-sniff");
    next();
};

module.exports = cors;
