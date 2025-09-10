const userService = require('../services/userService');
const messageService = require('../services/messageService');

/**
 * Controller for handling all incoming webhook events.
 */
const handleIncomingMessage = async (req, res) => {
  try {
    const messagePayload = req.body;
    console.log('Received payload:', JSON.stringify(messagePayload, null, 2));
    const messageBody = messagePayload.body ? messagePayload.body.trim().toLowerCase() : '';

    // 1. Extract the sender's phone number
    const phoneNumber = messagePayload.from;
    if (!phoneNumber) {
      console.warn('⚠️ Payload received without a "from" number. Ignoring.');
      return res.status(400).json({ status: 'error', message: 'Missing "from" field' });
    }

    // 2. Find or create the user in the database
    const user = await userService.findOrCreateUser(phoneNumber);


    let replyMessage = null; // Initialize reply message as null

    // 3. Implement the initial onboarding logic
    switch (user.status) {

      case 'pending_onboarding':
        // This is the user's VERY FIRST message.
        console.log(`✨ New user ${phoneNumber} started onboarding.`);
        replyMessage = messageService.getOnboardingMessage();
        // IMPORTANT: Update their status to show we are now waiting for their 'yes'.
        await userService.updateUserStatus(user.user_id, 'awaiting_confirmation');
        break;

      case 'awaiting_confirmation':
        // This is the user's SECOND message. We are expecting a 'yes'.
        if (messageBody === 'yes') {
          console.log(`✅ User ${phoneNumber} confirmed onboarding.`);
          replyMessage = messageService.getOnboardingSuccessMessage();
          await userService.updateUserStatus(user.user_id, 'active');
        } else {
          // If they send something other than 'yes', remind them.
          console.log(`🤔 User ${phoneNumber} sent "${messageBody}" instead of 'yes'.`);
          replyMessage = "Please reply with 'yes' to accept the terms and activate your account.";
        }
        break;

      case 'active':
        // This user is fully onboarded. Handle their regular commands.
        console.log(`🗣️  Message from active user ${phoneNumber}: "${messagePayload.body}"`);
        // TODO: This is where the FSM for adding items and the NLP logic will go next.
        // For now, let's just acknowledge the message.
        replyMessage = `Message received. (NLP processing to be added)`;
        break;
      
      default:
          console.warn(`Unhandled user status: ${user.status}`);
          break;
    }

    // Acknowledge the request immediately
    console.log('✅ Webhook processing complete. Sending response.'+ replyMessage);
    res.status(200).json({ status: 'success', reply: replyMessage });

  } catch (error) {
    console.error('🔴 An error occurred in the webhook controller:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  handleIncomingMessage,
};