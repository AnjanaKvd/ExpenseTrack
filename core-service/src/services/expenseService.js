const db = require('../database/db');

/**
 * Logs a personal expense to the database.
 * @param {number} userId The user's ID.
 * @param {number} amount The total amount of the expense.
 * @param {string} itemName The name of the item.
 * @returns {Promise<object>} The created expense record.
 */
const logPersonalExpense = async (userId, amount, itemName) => {
    const query = `
        INSERT INTO expenses (user_id, total_amount, item_name, expense_type)
        VALUES ($1, $2, $3, 'personal')
        RETURNING *;
    `;
    try {
        const { rows } = await db.query(query, [userId, amount, itemName]);
        console.log(`- DB: Logged personal expense for user ${userId}.`);
        return rows[0];
    } catch (error) {
        console.error('🔴 Error logging personal expense:', error);
        throw error;
    }
};

/**
 * Logs a shared expense, creating records in both expenses and sharedParticipants.
 * This function uses a transaction to ensure all-or-nothing data integrity.
 * @param {number} userId The user who is logging the expense.
 * @param {number} totalAmount The total amount of the expense.
 * @param {string} itemName The name of the item.
 * @param {Array<string>} participants An array of the names of people involved (e.g., ['Kamal', 'Nimal']).
 * @returns {Promise<object>} The created expense record.
 */
const logSharedExpense = async (userId, totalAmount, itemName, participants) => {
    const client = await db.getClient(); // Use a client for transactions
    try {
        await client.query('BEGIN'); // Start transaction

        // 1. Create the main expense record
        const expenseQuery = `
            INSERT INTO expenses (user_id, total_amount, item_name, expense_type)
            VALUES ($1, $2, $3, 'shared')
            RETURNING expense_id;
        `;
        const expenseResult = await client.query(expenseQuery, [userId, totalAmount, itemName]);
        const newExpenseId = expenseResult.rows[0].expense_id;

        // 2. Calculate the share amount and create participant records
        // Includes the user logging the expense, so participants.length + 1
        const shareAmount = totalAmount / (participants.length + 1);

        for (const person of participants) {
            const participantQuery = `
                INSERT INTO sharedParticipants (expense_id, entity_name, share_amount)
                VALUES ($1, $2, $3);
            `;
            await client.query(participantQuery, [newExpenseId, person, shareAmount]);
        }
        
        await client.query('COMMIT'); // Commit transaction
        console.log(`- DB: Logged shared expense ${newExpenseId} for user ${userId}.`);
        return { expense_id: newExpenseId }; // Return the new ID

    } catch (error) {
        await client.query('ROLLBACK'); // Roll back on error
        console.error('🔴 Error logging shared expense:', error);
        throw error;
    } finally {
        client.release(); // Release the client back to the pool
    }
};


/**
 * Queries the total shared balance between the user and another entity.
 * @param {number} userId The user's ID.
 * @param {string} person The name of the person to query the balance with.
 * @returns {Promise<number>} The total shared amount.
 */
const queryBalance = async (userId, person) => {
    const query = `
        SELECT SUM(sp.share_amount) AS total_share
        FROM expenses e
        JOIN sharedParticipants sp ON e.expense_id = sp.expense_id
        WHERE e.user_id = $1 AND sp.entity_name ILIKE $2;
    `;
    try {
        const { rows } = await db.query(query, [userId, person]);
        // If no records are found, SUM returns null. We should return 0.
        return parseFloat(rows[0].total_share) || 0;
    } catch (error) {
        console.error('🔴 Error querying balance:', error);
        throw error;
    }
};


// We need to add getClient to our db export to use transactions
db.getClient = () => db.pool.connect();

module.exports = {
    logPersonalExpense,
    logSharedExpense,
    queryBalance,
};