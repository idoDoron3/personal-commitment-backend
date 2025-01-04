const requestHandler = require('../utils/request-handler');

exports.handleRequest = (req, res, service, endpoint) => {
    requestHandler.forwardRequest(req, res, service, endpoint);
};