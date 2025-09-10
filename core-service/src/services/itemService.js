const db = require('../database/db');

/**
 * Adds a new trackable item for a user to the database.
 * @param {number} userId The user's database ID.
 * @param {string} itemName The name of the item to add.
 * @returns {Promise<object>} The newly created item record.
 */
const addItem = async (userId, itemName) => {
  const query = `
    INSERT INTO "trackableItems" (user_id, item_name)
    VALUES ($1, $2)
    RETURNING *;
  `;
  try {
    const { rows } = await db.query(query, [userId, itemName]);
    console.log(`- DB: Added item "${itemName}" for user ${userId}.`);
    return rows[0];
  } catch (error) {
    console.error(`🔴 Error adding item for user ${userId}:`, error);
    // You could add specific error handling here, e.g., for duplicate items
    throw error;
  }
};

/**
 * Retrieves all trackable items for a given user.
 * @param {number} userId The user's database ID.
 * @returns {Promise<Array<object>>} An array of the user's items.
 */
const getItems = async (userId) => {
    const query = 'SELECT item_name FROM "trackableItems" WHERE user_id = $1 ORDER BY created_at ASC';
    try {
        const { rows } = await db.query(query, [userId]);
        console.log(`- DB: Fetched ${rows.length} items for user ${userId}.`);
        console.log(rows);
        return rows;
    } catch (error) {
        console.error(`🔴 Error fetching items for user ${userId}:`, error);
        throw error;
    }
};

module.exports = {
  addItem,
  getItems,
};