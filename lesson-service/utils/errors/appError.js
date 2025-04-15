class appError extends Error {
    constructor(message, statusCode = 500, type = 'GeneralError', origin = 'Unknown') {
        super(message);
        this.statusCode = statusCode;
        this.type = type;
        this.origin = origin;
        this.name = this.constructor.name;
    }
}

module.exports = appError;