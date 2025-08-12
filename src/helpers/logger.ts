import winston from "winston";

const logLevel = process.env.LOG_LEVEL || "info";

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp}, ${info.level}: ${info.message}`,
  ),
);

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.json(),
  transports: [new winston.transports.Console({ format: consoleFormat })],
});
