const express = require('express');
const webhookController = require('../../controllers/webhook.controller');

const router = express.Router();

// Define the POST endpoint for incoming WhatsApp messages
router.post('/', webhookController.handleIncomingMessage);

module.exports = router;