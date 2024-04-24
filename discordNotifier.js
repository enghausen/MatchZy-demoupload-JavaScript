// Import logger
const log = require('./logger');

async function sendNotification(teamName, filename) {
    // Check if Discord notifications are enabled in the environment
    if (process.env.ENABLE_DISCORD_NOTIFICATIONS !== 'true') {
        log('Discord notifications are disabled.');
        return;
    }

    const webhookUrl = process.env[`DISCORD_WEBHOOK_URL_${teamName.toUpperCase()}`];
    if (!webhookUrl) {
        log(`No Discord webhook URL configured for ${teamName}. Notifications are not sent.`);
        return;
    }

    const message = `Demo uploaded: ${process.env.DISCORD_BASE_URL}/${teamName}/${filename}`;

    try {
        const fetch = (await import('node-fetch')).default; // Dynamic import for node-fetch
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: message })
        });
        log(`Notification sent: Status ${response.status}`);
    } catch (error) {
        log(`Failed to send Discord notification: ${error}`);
    }
}

module.exports = { sendNotification };
