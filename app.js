require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Logger setup
// Set the directory for log files
const logDirectory = path.join(__dirname, 'logs');
// Create the directory if it doesn't exist
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}
// Create a write stream for logging
const logStream = fs.createWriteStream(path.join(logDirectory, 'app.log'), { flags: 'a' });

// Function to log messages
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    logStream.write(logMessage);
    console.log(logMessage);
}

// Middleware to log each request
app.use((req, res, next) => {
    const start = new Date();
    res.on('finish', () => {
        const duration = new Date() - start;
        log(`Request from IP: ${req.ip}, Method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms`);
    });
    next();
});

// Endpoint for file upload
app.post('/upload', function (req, res) {
    // Check for custom authorization header
    const customAuth = req.header('MatchZy-Authorization');
    if (customAuth !== process.env.MATCHZY_AUTHORIZATION) {
        log(`Unauthorized upload attempt from IP: ${req.ip}`);
        return res.status(401).end('Unauthorized');
    }

    // Extracting information from headers
    const filename = req.header('MatchZy-FileName');
    const teamName = filename.split('_').slice(-1)[0].split('.')[0];
    const folder = path.join('/mnt/demos/shared', teamName);

    // Create directory if it doesn't exist
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    let writeStream = fs.createWriteStream(path.join(folder, filename));

    // Handling file upload stream
    req.pipe(writeStream);
    req.on('end', () => {
        const fileSize = fs.statSync(path.join(folder, filename)).size;
        writeStream.end();
        log(`File uploaded: ${filename}, Size: ${fileSize} bytes, Team: ${teamName}, IP: ${req.ip}`);
        res.status(200).end('Success');
    });

    // Handle file stream errors
    writeStream.on('error', function (err) {
        log(`Error writing file: ${filename}, Error: ${err.message}, IP: ${req.ip}`);
        res.status(500).end('Error writing demo file: ' + err.message);
    });
});

// Start the server
app.listen(port, () => log(`Server running on port ${port}`));

