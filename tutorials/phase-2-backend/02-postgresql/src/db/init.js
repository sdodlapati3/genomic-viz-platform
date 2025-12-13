/**
 * Database Initialization Script
 * Creates tables, indexes, views, and functions
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query, testConnection, closePool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📊 Genomic Database - Initialization');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot initialize database - connection failed');
    console.log('');
    console.log('Make sure PostgreSQL is running and the database exists:');
    console.log('  createdb genomic_viz');
    console.log('');
    process.exit(1);
  }
  
  try {
    // Read schema SQL file
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    console.log('📝 Executing schema SQL...');
    await query(schemaSql);
    
    console.log('');
    console.log('✅ Database initialized successfully!');
    console.log('───────────────────────────────────────────────────────────');
    console.log('  Tables created:');
    console.log('    • genes');
    console.log('    • protein_domains');
    console.log('    • variants');
    console.log('    • samples');
    console.log('    • sample_variants');
    console.log('');
    console.log('  Views created:');
    console.log('    • variants_with_genes');
    console.log('    • sample_mutation_summary');
    console.log('    • gene_mutation_frequency');
    console.log('');
    console.log('  Functions created:');
    console.log('    • get_variants_in_region()');
    console.log('    • get_gene_mutation_stats()');
    console.log('───────────────────────────────────────────────────────────');
    console.log('');
    console.log('Next step: Run seed script to populate data:');
    console.log('  npm run db:seed');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

initDatabase();
