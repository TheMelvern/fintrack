const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getLogFileName = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return path.join(logsDir, `error-logs-${year}-${month}.log`);
};

const logToFile = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) {
    logEntry += `\n  Data: ${JSON.stringify(data, null, 2)}`;
  }
  logEntry += '\n';

  const logFile = getLogFileName();
  fs.appendFileSync(logFile, logEntry, 'utf8');
  console.log(logEntry.trim());
};

const logger = {
  info: (message, data) => logToFile('info', message, data),
  error: (message, data) => logToFile('error', message, data),
  warn: (message, data) => logToFile('warn', message, data),
  debug: (message, data) => logToFile('debug', message, data),
};

module.exports = logger;