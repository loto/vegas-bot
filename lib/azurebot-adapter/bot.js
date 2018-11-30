'use strict'
const api = require('./direct-line-api-v3/api');

async function sendMessage(uuid, message) {
    let authenticationToken = await api.authenticate(uuid);
    let conversation = await api.startConversation(authenticationToken);
    let activityId = await api.sendActivity(uuid, conversation.id, conversation.token, message);
    return await api.getReply(conversation.id, conversation.token, activityId);
}

module.exports = {
    sendMessage
}
