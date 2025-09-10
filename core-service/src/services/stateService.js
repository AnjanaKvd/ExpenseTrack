const redisClient = require('../cache/redis');

const STATE_EXPIRATION_SECONDS = 300; // State will expire in 5 minutes

/**
 * Sets the conversational state for a user in Redis.
 * @param {number} userId The user's database ID.
 * @param {string} state The state to set (e.g., 'AWAITING_ITEM_NAME').
 */
const setUserState = async (userId, state) => {
  const key = `user:${userId}:state`;
  try {
    await redisClient.set(key, state, { EX: STATE_EXPIRATION_SECONDS });
    console.log(`- STATE: User ${userId} state set to -> ${state}`);
  } catch (error) {
    console.error('🔴 Error setting user state in Redis:', error);
  }
};

/**
 * Gets the conversational state for a user from Redis.
 * @param {number} userId The user's database ID.
 * @returns {Promise<string>} The user's current state, or 'IDLE' if not set.
 */
const getUserState = async (userId) => {
  const key = `user:${userId}:state`;
  try {
    const state = await redisClient.get(key);
    // If no state is found, the user is considered IDLE.
    return state || 'IDLE';
  } catch (error) {
    console.error('🔴 Error getting user state from Redis:', error);
    return 'IDLE'; // Default to IDLE on error
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