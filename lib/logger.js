const winston = require('winston');

const log = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.splat(),
    winston.format.printf(info => `${info.message}`),
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

module.exports = log;
