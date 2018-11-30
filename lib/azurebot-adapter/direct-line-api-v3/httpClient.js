'use strict';
require('dotenv').config();
const cache = require('./cache');
const urls = require('./urls');
const response = require('../response');
const restClient = require('../../rest/client');

async function authenticate(uuid) {
    cache.init(uuid);

    let authenticationToken = cache.authenticationToken(uuid);
    if (authenticationToken) return authenticationToken;

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + process.env.AZURE_DIRECT_LINE_SECRET }
    };

    let response = await restClient.create().post(urls.authentication(), body, config);
    // TODO: handle response.data.expires_in (1800)
    authenticationToken = response.data.token;
    cache.setAuthenticationToken(uuid, authenticationToken);
    return authenticationToken;
}

async function startConversation(authenticationToken) {
    let conversationToken = cache.conversationToken(authenticationToken);
    let conversationId = cache.conversationId(authenticationToken);
    if (conversationToken && conversationId) return ({ token: conversationToken, id: conversationId });

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + authenticationToken }
    };

    let response = await restClient.create().post(urls.conversations(), body, config);
    // TODO: handle response.data.expires_in (1800)
    // TODO: handle response.data.streamUrl
    conversationToken = response.data.token;
    conversationId = response.data.conversationId;
    cache.setConversationToken(authenticationToken, conversationToken);
    cache.setConversationId(authenticationToken, conversationId);
    return ({ token: conversationToken, id: conversationId });
}

async function sendActivity(uuid, conversationId, conversationToken, message) {
    let body = { 'type': 'message', 'from': { 'id': uuid }, 'text': message };
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken, 'Content-Type': 'application/json' }
    };

    let response = await restClient.create().post(urls.activities(conversationId), body, config);
    return response.data.id;
}

async function listActivities(conversationId, conversationToken) {
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken }
    };

    let response = await restClient.create().get(urls.activities(conversationId), config);
    // TODO: use watermark
    return response.data.activities;
}

async function getReply(conversationId, conversationToken, activityId) {
    let activities = await listActivities(conversationId, conversationToken);
    let lastActivity = activities[activities.length - 1];
    if (lastActivity.replyToId != activityId) throw new Error("Azure Bot: didn't reply to last message");
    return await response.format(lastActivity);
}

module.exports = {
    authenticate,
    startConversation,
    sendActivity,
    getReply
}
