class CommonFunctions {
    static removeUndefined(obj) {
        Object.keys(obj).forEach(key => (obj[key] === undefined || isNaN(obj[key])) && delete obj[key]);

        return obj;
    }
    static removeNaN(obj) {
        Object.keys(obj).forEach(key => (isNaN(obj[key])) && delete obj[key]);

        return obj;
    }
}

module.exports = CommonFunctions;
