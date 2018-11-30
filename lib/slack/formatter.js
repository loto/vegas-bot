'use strict';

async function formatResponse(event, responseMessage) {
    let response = { channel: event.channel, as_user: false };

    if (typeof responseMessage === 'string' || responseMessage instanceof String) response['text'] = responseMessage;
    if (responseMessage.text) response['text'] = responseMessage.text;
    if ((typeof responseMessage.attachments === 'array' || responseMessage.attachments instanceof Array) && responseMessage.attachments.length > 0) {
        response['attachments'] = new Array();

        await responseMessage.attachments.forEach(async (attachment) => {
            let titleAttachment = attachment.elements.shift();
            let descriptionAttachment = attachment.elements.shift();
            let fieldsAttachment = attachment.elements.shift() || {};

            let formattedAttachment = {
                title: titleAttachment.text,
                text: descriptionAttachment.text,
                color: 'good'
            };

            if (fieldsAttachment.facts && fieldsAttachment.facts.length > 0) {
                formattedAttachment['fields'] = new Array();
                await fieldsAttachment.facts.forEach(async (fact) => {
                    fact['short'] = true;
                    formattedAttachment.fields.push(fact);
                });
            }

            response['attachments'].push(formattedAttachment);
        });
    }

    return response;
}

async function formatError(event, error) {
    let response = { channel: event.channel };

    response['attachments'] = new Array({
        'title': 'An error occurred',
        'text': error.message,
        'color': 'danger'
    });

    return response;
}

module.exports = {
    formatResponse,
    formatError
}
