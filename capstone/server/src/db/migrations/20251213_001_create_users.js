/**
 * Migration: Create Users Table
 * 
 * Creates the users table for authentication
 */

export async function up(knex) {
  // Create enum for user roles
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'researcher', 'viewer');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255);
    table.specificType('role', 'user_role').defaultTo('viewer');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('last_login');

    // Indexes
    table.index('email');
    table.index('role');
    table.index('is_active');
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS user_role');
}
