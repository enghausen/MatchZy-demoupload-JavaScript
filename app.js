// Load environment variables from .env file
require('dotenv').config();

// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // Added crypto module for generating random strings

// Initialize express application
const app = express();

// Port configuration: Use environment variable or default to 3000
const port = process.env.PORT || 3000;

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

// Middleware to log each HTTP request
app.use((req, res, next) => {
    const start = new Date();
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.on('finish', () => {
        const duration = new Date() - start;
        log(`Request from IP: ${clientIp}, Method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms`);
    });
    next();
});

// Endpoint to handle file uploads
app.post('/upload', function (req, res) {
    // Check for custom authorization header
    const customAuth = req.header('MatchZy-Authorization');
    if (customAuth !== process.env.MATCHZY_AUTHORIZATION) {
        log(`Unauthorized upload attempt from IP: ${req.ip}`);
        return res.status(401).end('Unauthorized');
    }

    // Extract the filename and determine the team name from it
    let filename = req.header('MatchZy-FileName');
    const teamName = filename.split('_').slice(-1)[0].split('.')[0];  // Team name is extracted from the last part of the filename before the extension

    // Add a random string to the filename if enabled in the .env
    if (process.env.ADD_RANDOM_STRING_TO_FILENAME === 'true') {
        const randomString = crypto.randomBytes(8).toString('hex');  // Generates a random string
        filename = `${filename.split('.').slice(0, -1).join('.')}_${randomString}.${filename.split('.').pop()}`;
    }

    // Define the upload directory using an environment variable or default path
    const folder = path.join(process.env.UPLOAD_DIRECTORY_PATH || '/mnt/demos/shared', teamName);

    // Ensure the upload directory exists
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    // Create a writable stream for the uploaded file
    let writeStream = fs.createWriteStream(path.join(folder, filename));

    // Pipe the incoming file stream to the writable stream
    req.pipe(writeStream);
    req.on('end', () => {
        // Once upload is complete, log the file details
        const fileSize = fs.statSync(path.join(folder, filename)).size;
        writeStream.end();
        log(`File uploaded: ${filename}, Size: ${fileSize} bytes, Team: ${teamName}, IP: ${req.ip}`);
        res.status(200).end('Success');
    });

    // Handle errors during the file writing process
    writeStream.on('error', function (err) {
        log(`Error writing file: ${filename}, Error: ${err.message}, IP: ${req.ip}`);
        res.status(500).end('Error writing demo file: ' + err.message);
    });
});

// Start the server
app.listen(port, () => log(`Server running on port ${port}`));