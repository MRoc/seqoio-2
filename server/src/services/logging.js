const bunyan = require("bunyan");
const config = require("../config/config");

function getLogger(name) {
  const logger = bunyan.createLogger({
    name,
    level: config.loggingLevel,
  });

  logger.logRequestMiddleware = () =>
    function (req, res, next) {
      logger.info(`${req.method} ${req.originalUrl}`);
      next();
    };

  return logger;
}

exports.getLogger = getLogger;
