const userService = require('../services/userService');
const messageService = require('../services/messageService');
const stateService = require('../services/stateService');
const itemService = require('../services/itemService');
const nlpClient = require('../services/nlpClient');
const expenseService = require('../services/expenseService');
const { extractEntities } = require('../utils/entityExtractor');

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
        const userState = await stateService.getUserState(user.user_id);
        console.log(`- FSM: Current state for user ${user.user_id} is [${userState}]`);

        switch (userState) {
          case 'IDLE':
            // 2. If IDLE, send the message to the NLP service instead of checking for commands.
            const nlpData = await nlpClient.parseMessage(messagePayload.body);

            if (!nlpData || !nlpData.intent) {
              replyMessage = "Sorry, I'm having trouble understanding. Could you rephrase?";
              break;
            }

            const entities = extractEntities(nlpData.entities);

            // 3. Create a switch statement to handle the intent
            switch (nlpData.intent) {
              case 'greet':
                replyMessage = "Hello! How can I help you log your expenses today?";
                break;
              case 'goodbye':
                replyMessage = "Goodbye! Have a great day.";
                break;
              case 'log_personal_expense':
                if (!entities.amount || !entities.item) {
                  replyMessage = "I see you're logging an expense, but I'm missing the amount or the item. Please try again, for example: 'spent 500 on groceries'.";
                } else {
                  await expenseService.logPersonalExpense(user.user_id, entities.amount, entities.item);
                  replyMessage = `✅ Logged personal expense: ${entities.item} for ${entities.amount} Rs.`;
                }
                break;
              case 'log_shared_expense':
                if (!entities.amount || !entities.item || entities.persons.length === 0) {
                  replyMessage = "To log a shared expense, I need an amount, an item, and at least one person. For example: 'shared 1000 for a taxi with Kamal'.";
                } else {
                  await expenseService.logSharedExpense(user.user_id, entities.amount, entities.item, entities.persons);
                  replyMessage = `✅ Logged shared expense: ${entities.item} for ${entities.amount} Rs with ${entities.persons.join(', ')}.`;
                }
                break;
              case 'query_balance':
                if (entities.persons.length === 0) {
                  replyMessage = "Who would you like me to check your balance with? Please try again, for example: 'show share with Kamal'.";
                } else {
                  const person = entities.persons[0]; // Handle the first person mentioned
                  const balance = await expenseService.queryBalance(user.user_id, person);
                  replyMessage = messageService.formatBalanceMessage(person, balance);
                }
                break;
              default:
                replyMessage = "I'm not sure how to handle that, but I'm always learning!";
                break;
            }
            break; // End of IDLE case

          case 'AWAITING_ITEM_NAME':
            // This FSM logic remains the same
            const itemName = messagePayload.body.trim();
            await itemService.addItem(user.user_id, itemName);
            replyMessage = `✅ Got it! I've added "${itemName}" to your trackable items.`;
            await stateService.clearUserState(user.user_id);
            break;
        }
        break; // End of active case
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