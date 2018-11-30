'use strict';
const strategy = require('../../strategy');
const httpClient = require('./httpClient');

async function authenticate(uuid) {
    return await strategy.withRetries(httpClient.authenticate, arguments, 'Direct Line API: authentication');
}

async function startConversation(authenticationToken) {
    return await strategy.withRetries(httpClient.startConversation, arguments, 'Direct Line API: start conversation');
}

async function sendActivity(uuid, conversationId, conversationToken, message) {
    return await strategy.withRetries(httpClient.sendActivity, arguments, 'Direct Line API: send activity');
}

async function getReply(conversationId, conversationToken, activityId) {
    return await strategy.withDelayedRetries(httpClient.getReply, arguments, "Direct Line API: bot didn't reply on time");
}

module.exports = {
    authenticate,
    startConversation,
    sendActivity,
    getReply
}
