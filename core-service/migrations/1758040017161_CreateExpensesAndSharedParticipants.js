/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // 1. Create the new ENUM type for expenses
    pgm.createType('expense_type', ['personal', 'shared']);

    // 2. Create the Expenses table
    pgm.createTable('expenses', {
        expense_id: 'id', // This is a shortcut for SERIAL PRIMARY KEY
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(user_id)', // Foreign key to the users table
            onDelete: 'cascade', // If a user is deleted, their expenses are also deleted
        },
        item_name: { type: 'varchar(100)', notNull: true },
        total_amount: { type: 'decimal(10, 2)', notNull: true },
        expense_type: { type: 'expense_type', notNull: true },
        transaction_time: {
            type: 'timestamptz', // Timestamp with timezone
            notNull: true,
            default: pgm.func('now()'),
        },
    });

    // 3. Create the SharedParticipants table
    pgm.createTable('sharedparticipants', {
        share_id: 'id',
        expense_id: {
            type: 'integer',
            notNull: true,
            references: '"expenses"(expense_id)', // Foreign key to the expenses table
            onDelete: 'cascade', // If an expense is deleted, its participant records are also deleted
        },
        entity_name: { type: 'varchar(100)', notNull: true },
        share_amount: { type: 'decimal(10, 2)', notNull: true },
    });

    // Add an index for faster lookups of expenses by user
    pgm.createIndex('expenses', 'user_id');
};

exports.down = pgm => {
    // Drop tables in the reverse order of creation to avoid foreign key constraint errors
    pgm.dropTable('sharedparticipants');
    pgm.dropTable('expenses');
    pgm.dropType('expense_type');
};