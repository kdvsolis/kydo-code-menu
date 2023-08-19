class AppError extends Error {

    constructor(message, code) {
        // Calling parent constructor of base Error class.
        super(message);

        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        //save the code for later lookup
        this.code = code;

        // Capturing stack trace, excluding constructor call from it.
        Error.captureStackTrace(this, this.constructor);
    }
}


AppError.INVALID_USERNAME_OR_PASSWORD = 10001;

//ENTITY
module.exports = AppError;