/**
 * Migration: Create Genes Table
 * 
 * Creates the genes table for storing gene reference data
 */

export async function up(knex) {
  return knex.schema.createTable('genes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('symbol', 50).unique().notNullable();
    table.string('name', 500);
    table.string('ensembl_id', 50);
    table.string('entrez_id', 20);
    table.string('chromosome', 10);
    table.integer('start_position');
    table.integer('end_position');
    table.string('strand', 1);
    table.integer('protein_length');
    table.text('description');
    table.jsonb('aliases').defaultTo('[]');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('symbol');
    table.index('ensembl_id');
    table.index('chromosome');
    table.index(['chromosome', 'start_position', 'end_position']);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('genes');
}
