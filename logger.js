const fs = require('fs');
const path = require('path');

// Logger setup
// Define the log directory using an environment variable or default to 'logs'
const logDirectory = path.join(__dirname, process.env.LOG_DIRECTORY_PATH || 'logs');

// Ensure the log directory exists
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Create a writable stream for logging
const logStream = fs.createWriteStream(path.join(logDirectory, 'app.log'), { flags: 'a' });

// Function to append log messages to the log file and console
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    logStream.write(logMessage);
    console.log(logMessage);
}

module.exports = log;
