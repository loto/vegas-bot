'use strict';
require('dotenv').config();
const restify = require('restify');
const server = restify.createServer();
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

const restifyPromise = require('restify-await-promise');
restifyPromise.install(server);

const slackController = require('./lib/slack/controller');

server.post('/slack-event-raised', async (request, response, next) => {
    let payload = request.body;
    // Slack events subscription endpoint verification, https://api.slack.com/events/url_verification
    if (payload.type === 'url_verification') {
        response.contentType = 'text/plain';
        response.status(200);
        response.send(payload.challenge);
        next();
        return;
    }

    // Always respond under 3s or slack will consider the call failed and follow its retry policy
    // https://api.slack.com/events-api, see 'Responding to Events' section
    response.contentType = 'text/plain';
    response.status(204);
    response.send();

    return await slackController.eventReceived(payload.event);
});

server.listen(process.env.PORT, function () {
    console.log('%s listening at %s', server.name, server.url);
});
