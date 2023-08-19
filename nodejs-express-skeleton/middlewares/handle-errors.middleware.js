const handleErrors = (err, _req, res, _next) => {
    const message = err.code ? err.message : 'An internal server error has occurred';

    console.log(err);
    return res.status(err.statusCode || 500).json({
        // code: err.code,
        message,
    });
};

module.exports = handleErrors;
