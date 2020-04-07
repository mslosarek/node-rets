const winston = require('winston');

const log = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.splat(),
    winston.format.printf(({ message, level }) => (
      [
        (!level.includes('info') ? `${level}: ` : ''),
        `${message}`,
      ].join('')
    )),
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  debug: 'green',
});

module.exports = log;
