'use strict';
require('dotenv').config();
const uuidv1 = require('uuid/v1');
const baseLogger = require('pino')({ level: process.env.LOG_LEVEL });
const axios = require('axios');
const errors = require('./errors');
const status = require('./status');

const requestIdHeaderName = 'X-Request-ID';
const defaultTimeout = 5000;

function create() {
    let headers = {};
    headers[requestIdHeaderName] = uuidv1();

    let instance = axios.create({
        headers: headers,
        timeout: defaultTimeout,
        validateStatus: () => { return true; }
    });

    instance.interceptors.request.use(function (config) {
        logRequest(config);
        return config;
    }, function (error) {
        logRequestError(error);
        throw error;
    });

    instance.interceptors.response.use(function (response) {
        logResponse(response);
        if (status.hasFailed(response)) {
            let error = new errors.RestError(response.status, JSON.stringify(response.data));
            throw error;
        }
        return response;
    }, function (error) {
        logResponseError(error);
        throw error;
    });

    return instance;
}

function logRequest(config) {
    const requestLogger = baseLogger.child({
        request_id: config.headers[requestIdHeaderName],
        method: config.method,
        url: config.url
    });
    requestLogger.info();
    const dataLogger = requestLogger.child({ data: config.data });
    dataLogger.debug();
}

function logRequestError(error) {
    // error.response / error.request
    const errorLogger = baseLogger.child({
        request_id: error.config.headers[requestIdHeaderName],
        method: error.config.method,
        url: error.config.url,
        data: error.config.data,
        error: {
            name: error.name,
            message: error.message
        }
    });
    errorLogger.error();
}

function logResponse(response) {
    const responseLogger = baseLogger.child({
        response_id: response.config.headers[requestIdHeaderName],
        url: response.config.url,
        status: `${response.status} ${response.statusText}`
    });
    responseLogger.info();
    const dataLogger = responseLogger.child({ data: response.data });
    dataLogger.debug();
}

function logResponseError(error) {
    // error.response / error.request
    let fields = {
        response_id: error.config.headers[requestIdHeaderName],
        url: error.config.url,
        data: error.config.data,
        error: {
            name: error.name,
            message: error.message
        }
    };
    if (error.response) { fields['status'] = `${error.response.status} ${error.response.statusText}` }
    const errorLogger = baseLogger.child(fields);
    errorLogger.error();
}

module.exports = {
    create
}
