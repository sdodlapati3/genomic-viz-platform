/**
 * Seed: Default Admin User
 * 
 * Creates a default admin user for initial setup
 */

import bcrypt from 'bcryptjs';

export async function seed(knex) {
  // Check if admin already exists
  const existingAdmin = await knex('users')
    .where('email', 'admin@example.com')
    .first();

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // Insert admin user
  await knex('users').insert({
    email: 'admin@example.com',
    password_hash: passwordHash,
    name: 'System Administrator',
    role: 'admin',
    is_active: true,
  });

  console.log('Created default admin user: admin@example.com / Admin123!');
}
