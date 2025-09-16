const userService = require('../services/userService');
const messageService = require('../services/messageService');
const stateService = require('../services/stateService');
const itemService = require('../services/itemService');
const nlpClient = require('../services/nlpClient');
const expenseService = require('../services/expenseService');
const { extractEntities } = require('../utils/entityExtractor');

/**
 * Handles the logic for logging a shared expense, asking for missing info if needed.
 */
async function handleLogSharedExpense(user, entities) {
    let { amount, item, persons } = entities;

    // 1. Check for missing information and ask clarifying questions
    if (!amount) {
        await stateService.setUserState(user.user_id, 'AWAITING_EXPENSE_AMOUNT', { item, persons });
        return `I see you want to log a shared expense${item ? ` for "${item}"` : ''}${persons.length > 0 ? ` with ${persons.join(', ')}` : ''}. How much was the total?`;
    }
    if (!item) {
        await stateService.setUserState(user.user_id, 'AWAITING_EXPENSE_ITEM', { amount, persons });
        return `I see you want to log a shared expense of ${amount} Rs${persons.length > 0 ? ` with ${persons.join(', ')}` : ''}. What was the item?`;
    }
    if (persons.length === 0) {
        await stateService.setUserState(user.user_id, 'AWAITING_EXPENSE_PERSONS', { amount, item });
        return `I see you want to log an expense of ${amount} Rs for "${item}". Who did you share it with?`;
    }

    // 2. If all information is present, log the expense
    await expenseService.logSharedExpense(user.user_id, amount, item, persons);
    await stateService.clearUserState(user.user_id);
    return `✅ Logged shared expense: ${item} for ${amount} Rs with ${persons.join(', ')}.`;
}

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
        const { state, context } = await stateService.getUserState(user.user_id);
        console.log(`- FSM: Current state for user ${user.user_id} is [${state}]`);

        switch (state) {
          case 'IDLE':
            const nlpData = await nlpClient.parseMessage(messagePayload.body);
            if (!nlpData || !nlpData.intent) {
              replyMessage = "Sorry, I'm having trouble understanding. Could you rephrase?";
              break;
            }
            const entities = extractEntities(nlpData.entities);

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
                replyMessage = await handleLogSharedExpense(user, entities);
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
            break;

          case 'AWAITING_EXPENSE_AMOUNT':
            // User sent a message when we were waiting for an amount
            const newAmount = extractEntities([{ entity: 'AMOUNT', value: messageBody }]).amount;
            if (!newAmount) {
                replyMessage = "That doesn't look like a valid amount. Please provide a number.";
            } else {
                const updatedEntities = { ...context, amount: newAmount };
                replyMessage = await handleLogSharedExpense(user, updatedEntities);
            }
            break;
            
          case 'AWAITING_EXPENSE_ITEM':
             // Combine new info with old context and re-run the handler
            const updatedEntitiesWithItem = { ...context, item: messageBody };
            replyMessage = await handleLogSharedExpense(user, updatedEntitiesWithItem);
            break;
          
          case 'AWAITING_EXPENSE_PERSONS':
            // Extract persons from the message and combine with existing context
            const persons = extractEntities([{ entity: 'PERSON', value: messageBody }]).persons;
            const updatedEntitiesWithPersons = { ...context, persons: persons.length ? persons : [messageBody] };
            replyMessage = await handleLogSharedExpense(user, updatedEntitiesWithPersons);
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