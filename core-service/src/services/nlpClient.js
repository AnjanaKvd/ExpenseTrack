const axios = require('axios');
const config = require('../config/config');

const NLP_SERVICE_URL = config.nlpServiceUrl;

if (!NLP_SERVICE_URL) {
    console.error('🔴 FATAL ERROR: NLP_SERVICE_URL is not defined in the .env file.');
    process.exit(1);
}

/**
 * Parses a user's message using the external NLP service.
 * @param {string} text The user's message.
 * @returns {Promise<object|null>} The parsed data (intent, entities) or null on error.
 */
const parseMessage = async (text) => {
    console.log(`- NLP: Sending to NLP service -> "${text}"`);
    try {
        const response = await axios.post(`${NLP_SERVICE_URL}/parse`, { text });
        console.log(`- NLP: Received from NLP service <-`, response.data);
        return response.data;
    } catch (error) {
        console.error('🔴 Error communicating with NLP service:', error.message);
        return null; // Return null to indicate a failure
    }
};

module.exports = {
    parseMessage,
};