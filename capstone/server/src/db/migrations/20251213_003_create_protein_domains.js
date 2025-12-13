/**
 * Migration: Create Protein Domains Table
 * 
 * Creates the protein_domains table for storing domain annotations
 */

export async function up(knex) {
  return knex.schema.createTable('protein_domains', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('gene_id').references('id').inTable('genes').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('type', 100); // e.g., 'Pfam', 'SMART', 'InterPro'
    table.string('accession', 50); // Domain database accession
    table.integer('start_position').notNullable();
    table.integer('end_position').notNullable();
    table.string('color', 20); // Hex color for visualization
    table.text('description');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('gene_id');
    table.index('name');
    table.index('type');
    table.index(['gene_id', 'start_position', 'end_position']);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('protein_domains');
}
