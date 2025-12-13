/**
 * Migration: Create Audit Log Table
 * 
 * Creates table for tracking user actions and data changes
 */

export async function up(knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('user_email', 255);
    table.string('action', 100).notNullable(); // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    table.string('resource_type', 100); // users, mutations, samples, etc.
    table.uuid('resource_id');
    table.string('resource_name', 255);
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.string('request_method', 10);
    table.text('request_path');
    table.integer('response_status');
    table.integer('response_time_ms');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for querying audit logs
    table.index('user_id');
    table.index('action');
    table.index('resource_type');
    table.index('resource_id');
    table.index('created_at');
    table.index(['user_id', 'action']);
    table.index(['resource_type', 'resource_id']);
    table.index(['created_at', 'action']);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('audit_logs');
}
