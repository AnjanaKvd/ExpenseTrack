const db = require('../database/db');

/**
 * Finds an existing user by their phone number or creates a new one.
 * @param {string} phoneNumber The user's phone number from WhatsApp (e.g., '6512345678@c.us').
 * @returns {Promise<object>} The user record from the database.
 */
const findOrCreateUser = async (phoneNumber) => {
  const findUserQuery = 'SELECT * FROM users WHERE phone_number = $1';
  const insertUserQuery = `
    INSERT INTO users (phone_number, status)
    VALUES ($1, 'pending_onboarding')
    RETURNING *;
  `;

  try {
    // Check if the user exists
    let { rows } = await db.query(findUserQuery, [phoneNumber]);
    
    if (rows.length > 0) {
      console.log(`👤 User found: ${phoneNumber}`);
      return rows[0]; // Return existing user
    } else {
      // If not, create the user
      console.log(`✨ New user detected. Creating record for: ${phoneNumber}`);
      let { rows: newRows } = await db.query(insertUserQuery, [phoneNumber]);
      return newRows[0]; // Return the newly created user
    }
  } catch (error) {
    console.error('🔴 Error in findOrCreateUser:', error);
    throw error;
  }
};

/**
 * Updates a user's status.
 * @param {number} userId The ID of the user to update.
 * @param {string} newStatus The new status to set (e.g., 'active').
 * @returns {Promise<object>} The updated user record.
 */
const updateUserStatus = async (userId, newStatus) => {
    const query = 'UPDATE users SET status = $1 WHERE user_id = $2 RETURNING *';
    try {
        const { rows } = await db.query(query, [newStatus, userId]);
        console.log(`✅ User ${userId} status updated to '${newStatus}'`);
        return rows[0];
    } catch (error) {
        console.error(`🔴 Error updating status for user ${userId}:`, error);
        throw error;
    }
};


module.exports = {
  findOrCreateUser,
  updateUserStatus,
};