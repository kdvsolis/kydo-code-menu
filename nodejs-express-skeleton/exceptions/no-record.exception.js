class NoRecord extends Error {
    constructor(type = 'Record') {
        const message = `${type} not found`;
        super(message);
        this.name = this.constructor.name;
        this.code = this.constructor.name;
        this.statusCode = 404;
        this.message = message;
    }
}

module.exports = NoRecord;
