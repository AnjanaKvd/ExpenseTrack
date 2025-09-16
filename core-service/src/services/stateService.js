const redisClient = require('../cache/redis');

const STATE_EXPIRATION_SECONDS = 300; // State will expire in 5 minutes (300 seconds)

/**
 * Sets the conversational state and context for a user in Redis.
 * @param {number} userId The user's database ID.
 * @param {string} state The state to set (e.g., 'AWAITING_EXPENSE_AMOUNT').
 * @param {object} context The partial data collected so far.
 */
const setUserState = async (userId, state, context = {}) => {
  const key = `user:${userId}:state`;
  const value = JSON.stringify({ state, context });
  try {
    await redisClient.set(key, value, { EX: STATE_EXPIRATION_SECONDS });
    console.log(`- STATE: User ${userId} state set to -> ${state} with context:`, context);
  } catch (error) {
    console.error('🔴 Error setting user state in Redis:', error);
  }
};

/**
 * Gets the conversational state and context for a user from Redis.
 * @param {number} userId The user's database ID.
 * @returns {Promise<{state: string, context: object}>} The user's state and context.
 */
const getUserState = async (userId) => {
  const key = `user:${userId}:state`;
  const defaultState = { state: 'IDLE', context: {} };
  try {
    const value = await redisClient.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return defaultState;
  } catch (error) {
    console.error('🔴 Error getting user state from Redis:', error);
    return defaultState; // Default to IDLE on error
  }
};

/**
 * Clears the conversational state for a user from Redis.
 * @param {number} userId The user's database ID.
 */
const clearUserState = async (userId) => {
    const key = `user:${userId}:state`;
    try {
        await redisClient.del(key);
        console.log(`- STATE: User ${userId} state cleared.`);
    } catch (error) {
        console.error('🔴 Error clearing user state in Redis:', error);
    }
}

module.exports = {
  setUserState,
  getUserState,
  clearUserState,
};