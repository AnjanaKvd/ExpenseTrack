/**
 * =================================================================
 * | Development WhatsApp Gateway                                  |
 * =================================================================
 *
 * This script is a temporary tool for local development ONLY.
 * It uses the 'whatsapp-web.js' library to connect to a personal
 * WhatsApp account and acts as a bridge to your core backend service.
 *
 * It forwards all incoming messages to a specified webhook URL.
 *
 * ---
 * Prerequisites:
 * 1. Create a '.env' file in this directory.
 * 2. Add the following line to it:
 * CORE_SERVICE_WEBHOOK_URL=http://localhost:3000/api/v1/webhook
 * ---
 */

// 1. Imports
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
require('dotenv').config(); // Loads environment variables from .env file

// 2. Configuration & Validation
const CORE_SERVICE_WEBHOOK_URL = process.env.CORE_SERVICE_WEBHOOK_URL;

if (!CORE_SERVICE_WEBHOOK_URL) {
    console.error('🔴 FATAL ERROR: CORE_SERVICE_WEBHOOK_URL is not defined in the .env file.');
    console.error('Please create a .env file in the /dev-gateway directory and add the variable.');
    process.exit(1); // Exit the script if the webhook URL is not set
}

console.log('✅ Configuration loaded.');
console.log(`▶️  Forwarding messages to: ${CORE_SERVICE_WEBHOOK_URL}`);

// 3. WhatsApp Client Initialization
// Using LocalAuth to save session and avoid scanning QR code on every run
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session' }), // Saves session in a './session' folder
    puppeteer: {
        headless: true,
        args: [ // Required for running in some server environments
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    }
});

console.log('🚀 Initializing WhatsApp client...');

// 4. Event Handlers
client.on('qr', qr => {
    console.log('--------------------------------------------------');
    qrcode.generate(qr, { small: true });
    console.log('📸 Scan the QR code above with your WhatsApp app.');
    console.log('--------------------------------------------------');
});

client.on('ready', () => {
    console.log('==================================================');
    console.log('✅ WhatsApp client is ready!');
    console.log('==================================================');
});

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ LOADING SCREEN: ${percent}% - ${message}`);
});

client.on('auth_failure', msg => {
    console.error('🔴 AUTHENTICATION FAILURE:', msg);
});

client.on('disconnected', (reason) => {
    console.warn('🔌 Client was logged out:', reason);
});

// The core logic: Listen for messages and forward them
client.on('message', async (message) => {
    // Ignore messages from groups to simplify Phase 1
    const chat = await message.getChat();
    if (chat.isGroup) {
        return;
    }

    console.log(`\n📲 [${new Date().toLocaleTimeString()}] Message received from: ${message.from}`);
    console.log(`   Message Body: "${message.body}"`);

    // Construct a clean payload to send to the core service
    const payload = {
        from: message.from, // Sender's phone number (e.g., '6512345678@c.us')
        to: message.to, // Your bot's phone number
        body: message.body, // The message text
        timestamp: message.timestamp, // Unix timestamp of the message
        messageId: message.id._serialized, // Unique message ID
    };

    // Forward the payload to the core service webhook
    try {
        console.log(`   -> Forwarding to core service...`);
        await axios.post(CORE_SERVICE_WEBHOOK_URL, payload);
        console.log(`   ✅ Successfully forwarded message.`);
    } catch (error) {
        console.error('   🔴 Error forwarding message to core service:');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(`      - Status: ${error.response.status}`);
            console.error(`      - Data:`, error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('      - No response received from the server. Is the core service running?');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('      - Error:', error.message);
        }
    }
});

// 5. Start the client
client.initialize();