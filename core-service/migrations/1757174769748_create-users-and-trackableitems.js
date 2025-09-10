/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createType('user_status', ['pending_onboarding', 'awaiting_confirmation', 'active', 'disabled']);
    // Create Users table
    pgm.createTable('users', {
        user_id: 'id', // auto-incrementing primary key
        phone_number: { type: 'varchar(50)', notNull: true, unique: true },
        status: { type: 'user_status', notNull: true, default: 'pending_onboarding' },
        created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
    });

    // Create trackableItems table
    pgm.createTable('trackableItems', {
        item_id: 'id', // SERIAL PRIMARY KEY shortcut
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(user_id)', // matches the Users table PK
            onDelete: 'cascade'
        },
        item_name: { type: 'varchar(100)', notNull: true },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
    });
};

exports.down = pgm => {
    pgm.dropTable('trackableItems');
    pgm.dropTable('users');
    pgm.dropType('user_status');
};
