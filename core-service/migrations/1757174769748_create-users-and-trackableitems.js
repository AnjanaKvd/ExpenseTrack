/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createType('user_status', ['pending_onboarding', 'active', 'disabled']);
    // Create Users table
    pgm.createTable('Users', {
        user_id: 'id', // auto-incrementing primary key
        phone_number: { type: 'varchar(15)', notNull: true, unique: true },
        status: { type: 'user_status', notNull: true, default: 'pending_onboarding' },
        created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
    });

    // Create TrackableItems table
    pgm.createTable('TrackableItems', {
        item_id: 'id', // SERIAL PRIMARY KEY shortcut
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"Users"(user_id)', // matches the Users table PK
            onDelete: 'cascade'
        },
        item_name: { type: 'varchar(100)', notNull: true },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
    });
};

exports.down = pgm => {
    pgm.dropTable('TrackableItems');
    pgm.dropTable('Users');
    pgm.dropType('user_status');
};
