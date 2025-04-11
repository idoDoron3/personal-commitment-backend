class appError extends Error {
    constructor(message, statusCode = 500, type = 'GeneralError', details = []) {
        super(message);
        this.statusCode = statusCode;
        this.type = type;
        this.details = details;
        this.name = this.constructor.name;
    }
}

module.exports = appError;