/**
 * Migration: Create Expression Table
 * 
 * Creates tables for storing gene expression data
 */

export async function up(knex) {
  // Expression datasets (e.g., RNA-seq runs)
  await knex.schema.createTable('expression_datasets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('description', 1000);
    table.string('platform', 100); // e.g., 'Illumina HiSeq', 'NovaSeq'
    table.string('normalization', 100); // e.g., 'TPM', 'FPKM', 'counts'
    table.integer('sample_count');
    table.integer('gene_count');
    table.string('source', 100);
    table.jsonb('metadata').defaultTo('{}');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('name');
    table.index('source');
  });

  // Gene expression values
  await knex.schema.createTable('expression_values', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('dataset_id').references('id').inTable('expression_datasets').onDelete('CASCADE');
    table.uuid('sample_id').references('id').inTable('samples').onDelete('CASCADE');
    table.uuid('gene_id').references('id').inTable('genes').onDelete('CASCADE');
    table.string('gene_symbol', 50);
    table.float('expression_value').notNullable();
    table.float('log2_value');
    table.float('z_score');
    table.float('percentile');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for efficient queries
    table.index('dataset_id');
    table.index('sample_id');
    table.index('gene_id');
    table.index('gene_symbol');
    table.index(['dataset_id', 'gene_symbol']);
    table.index(['dataset_id', 'sample_id']);
    
    // Unique constraint
    table.unique(['dataset_id', 'sample_id', 'gene_id']);
  });

  // Differential expression results
  await knex.schema.createTable('differential_expression', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('dataset_id').references('id').inTable('expression_datasets').onDelete('CASCADE');
    table.uuid('gene_id').references('id').inTable('genes').onDelete('CASCADE');
    table.string('gene_symbol', 50);
    table.string('comparison_name', 255); // e.g., 'tumor_vs_normal'
    table.string('group1_name', 100);
    table.string('group2_name', 100);
    table.float('log2_fold_change');
    table.float('p_value');
    table.float('adjusted_p_value');
    table.float('mean_expression_group1');
    table.float('mean_expression_group2');
    table.boolean('is_significant').defaultTo(false);
    table.string('regulation', 20); // 'up', 'down', 'none'
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('dataset_id');
    table.index('gene_id');
    table.index('gene_symbol');
    table.index('comparison_name');
    table.index('is_significant');
    table.index(['dataset_id', 'is_significant']);
    table.index(['gene_symbol', 'log2_fold_change']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('differential_expression');
  await knex.schema.dropTableIfExists('expression_values');
  await knex.schema.dropTableIfExists('expression_datasets');
}
