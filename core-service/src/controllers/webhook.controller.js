const userService = require('../services/userService');
const messageService = require('../services/messageService');
const stateService = require('../services/stateService');
const itemService = require('../services/itemService');

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
        // This is where we implement the FSM logic for active users.
        const userState = await stateService.getUserState(user.user_id);
        console.log(`- FSM: Current state for user ${user.user_id} is [${userState}]`);

        // A nested switch for the conversational state
        switch (userState) {
                case 'IDLE':
                    // Check for commands when the user is not in a conversation
                    if (messageBody === 'add item') {
                        replyMessage = "What is the name of the item you want to track?";
                        await stateService.setUserState(user.user_id, 'AWAITING_ITEM_NAME');
                    } else if (messageBody === 'list items') { // 2. Add the 'list items' command
                        const items = await itemService.getItems(user.user_id);
                        replyMessage = messageService.formatItemsList(items);
                    } else {
                        // TODO: Send to NLP service
                        replyMessage = `Command not recognized. Try "add item" or "list items".`;
                    }
                    break;

                case 'AWAITING_ITEM_NAME':
                    // The user was asked for an item name.
                    const itemName = messagePayload.body.trim();
                    if(itemName.length > 100) { // Basic validation
                        replyMessage = "That name is a bit too long. Please try a shorter name.";
                        // The user stays in the AWAITING_ITEM_NAME state to try again
                    } else {
                        // 3. Call the itemService to save the item to the database
                        await itemService.addItem(user.user_id, itemName);
                        replyMessage = `✅ Got it! I've added "${itemName}" to your trackable items.`;
                        await stateService.clearUserState(user.user_id); // Reset state to IDLE
                    }
                    break;
            }
        break;
      
      default:
        console.warn(`Unhandled user status: ${user.status}`);
        break;
    }

    res.status(200).json({ status: 'success', reply: replyMessage });

  } catch (error) {
    console.error('🔴 An error occurred in the webhook controller:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  handleIncomingMessage,
};