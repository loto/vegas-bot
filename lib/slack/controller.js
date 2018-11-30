'use strict';
require('dotenv').config();
const baseLogger = require('pino')({ level: process.env.LOG_LEVEL });
const azurebot = require('../azurebot-adapter/bot');
const formatter = require('./formatter');
const { WebClient } = require('@slack/client');
const webApiClient = new WebClient(process.env.SLACK_BOT_TOKEN);

async function eventReceived(event) {
    if (event.subtype === 'bot_message') return;

    let response;
    try {
        let uuid = `${event.channel}-${event.user}`;
        let message = event.text;
        let reply = await azurebot.sendMessage(uuid, message);
        response = await formatter.formatResponse(event, reply);
    } catch (error) {
        response = await formatter.formatError(event, error);
    }

    webApiClient.chat.postMessage(response)
        .catch((error) => {
            baseLogger.error(error.message);
        });
}

module.exports = {
    eventReceived
}
