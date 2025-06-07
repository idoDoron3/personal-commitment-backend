const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Create a logger configured for a specific service
const createLogger = (serviceName) => {
  const logDir = path.join(__dirname, `../logs/${serviceName}`);

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  });

  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      logFormat
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, "error.log"),
        level: "error",
      }),
      new winston.transports.File({
        filename: path.join(logDir, "combined.log"),
      }),
    ],
  });

  // Also log to console if not in production
  if (process.env.NODE_ENV !== "production") {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          logFormat
        ),
      })
    );
  }

  return logger;
};

module.exports = { createLogger };
