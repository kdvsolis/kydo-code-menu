class InvalidData extends Error {
    constructor(message = 'Invalid ID supplied') {
        super(message);
        this.message = message;
        this.name = this.constructor.name;
        this.code = 'InvalidData';
        this.statusCode = 400;
    }
}

module.exports = InvalidData;
