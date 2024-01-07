require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.post('/upload', function (req, res) {
    // Check for custom authorization header
    const customAuth = req.header('MatchZy-Authorization');
    if (customAuth !== process.env.MATCHZY_AUTHORIZATION) {
        return res.status(401).end('Unauthorized');
    }

    const filename = req.header('MatchZy-FileName');
    const matchId = req.header('MatchZy-MatchId');
    const mapNumber = req.header('MatchZy-MapNumber');

    // Extract team name and create a directory
    const teamName = filename.split('_').slice(-1)[0].split('.')[0];
    const folder = path.join('/mnt/demos/shared', teamName);

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    let writeStream = fs.createWriteStream(path.join(folder, filename));

    req.pipe(writeStream);
    req.on('end', () => {
        writeStream.end();
        res.status(200).end('Success');
    });

    writeStream.on('error', function (err) {
        res.status(500).end('Error writing demo file: ' + err.message);
    });
});

app.listen(port);
