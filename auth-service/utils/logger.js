const { createLogger } = require("../../shared/logger");

// Create logger instance for auth-service
const logger = createLogger("auth-service");

// Custom formatted log for request events
const logRequest = ({
  success,
  req,
  action,
  email,
  role = null,
  reason = null,
  status,
  duration,
}) => {
  const method = req.method;
  const endpoint = req.originalUrl;
  const ip = req.ip;

  const base = `method=${method} | endpoint=${endpoint} | email=${email} | ip=${ip} | status=${status} | duration=${duration}ms`;
  const extra = success ? `role=${role}` : `reason=${reason}`;

  const msg = `${action} ${
    success ? "succeeded" : "failed"
  } | ${base} | ${extra}`;

  success ? logger.info(msg) : logger.error(msg);
};

module.exports = {
  logger,
  logRequest,
};
