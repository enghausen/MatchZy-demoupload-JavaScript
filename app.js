// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const log = require('./logger');  // Importing logger
const discordNotifier = require('./discordNotifier');  // Importing Discord notifier

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
    const start = new Date();
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.on('finish', () => {
        const duration = new Date() - start;
        log(`Request from IP: ${clientIp}, Method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms`);
    });
    next();
});

app.post('/upload', function (req, res) {
    const customAuth = req.header('MatchZy-Authorization');
    if (customAuth !== process.env.MATCHZY_AUTHORIZATION) {
        log(`Unauthorized upload attempt from IP: ${req.ip}`);
        return res.status(401).end('Unauthorized');
    }

    let filename = req.header('MatchZy-FileName');
    const teamName = filename.split('_').slice(-1)[0].split('.')[0];
    if (process.env.ADD_RANDOM_STRING_TO_FILENAME === 'true') {
        const randomString = crypto.randomBytes(8).toString('hex');
        filename = `${filename.split('.').slice(0, -1).join('.')}_${randomString}.${filename.split('.').pop()}`;
    }

    const folder = path.join(process.env.UPLOAD_DIRECTORY_PATH || '/mnt/demos/shared', teamName);
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    let writeStream = fs.createWriteStream(path.join(folder, filename));
    req.pipe(writeStream);
    req.on('end', () => {
        const fileSize = fs.statSync(path.join(folder, filename)).size;
        writeStream.end();
        log(`File uploaded: ${filename}, Size: ${fileSize} bytes, Team: ${teamName}, IP: ${req.ip}`);
        discordNotifier.sendNotification(teamName, filename);  // Sending notification to Discord
        res.status(200).end('Success');
    });

    writeStream.on('error', function (err) {
        log(`Error writing file: ${filename}, Error: ${err.message}, IP: ${req.ip}`);
        res.status(500).end('Error writing demo file: ' + err.message);
    });
});

app.listen(port, () => log(`Server running on port ${port}`));
