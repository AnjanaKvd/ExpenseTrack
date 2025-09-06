/**
 * Controller for handling all incoming webhook events.
 */

const handleIncomingMessage = (req, res) => {
  // The message payload from the dev-gateway
  const messagePayload = req.body;

  console.log('Received payload:', JSON.stringify(messagePayload, null, 2));

  // TODO: Add core logic here
  // 1. Find or create the user.
  // 2. Get user's current state from Redis.
  // 3. Based on state and message, decide the next action.
  //    - If IDLE, send to NLP service.
  //    - If AWAITING_SOMETHING, handle the reply.
  // 4. Send a response back to the gateway (or directly to the user).

  // Acknowledge the request immediately
  res.status(200).json({ status: 'success', message: 'Message received' });
};

module.exports = {
  handleIncomingMessage,
};