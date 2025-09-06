const express = require('express');
const webhookRoutes = require('./webhook.route');

const router = express.Router();

// Mount the webhook routes under the /webhook path
router.use('/webhook', webhookRoutes);

module.exports = router;