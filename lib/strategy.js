'use strict';
const errors = require('./rest/errors');

async function withRetries(fn, args, errorMessage = 'startegy.withRetries()', remainingAttempts = 3) {
    let result;
    try {
        result = await fn.apply(null, args);
    }
    catch (error) {
        if (remainingAttempts === 1) throw new errors.TooManyAttemptsError(error, errorMessage);
        return await withRetries(fn, args, errorMessage, remainingAttempts - 1);
    }

    return result;
}

async function withDelayedRetries(fn, args, errorMessage = 'startegy.withRetries()', remainingAttempts = 3, waitDuration = 600) {
    let result;
    try {
        result = await fn.apply(null, args);
    }
    catch (error) {
        if (remainingAttempts === 1) throw new errors.TooManyAttemptsError(error, errorMessage);
        await waitFor(waitDuration);
        return await withDelayedRetries(fn, args, errorMessage, remainingAttempts - 1, waitDuration);
    }

    return result;
}

async function waitFor(delay) {
    return new Promise(function (resolve, _reject) {
        setTimeout(function () { resolve(); }, delay);
    });
}

module.exports = {
    withRetries,
    withDelayedRetries
}
