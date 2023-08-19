class DuplicateRecord extends Error {
    constructor(type = 'value') {
        const message = `The ${type} you entered is already in the list.`;
        super(message);
        this.name = this.constructor.name;
        this.code = this.constructor.name;
        this.statusCode = 400;
        this.message = message;
    }
}

module.exports = DuplicateRecord;
