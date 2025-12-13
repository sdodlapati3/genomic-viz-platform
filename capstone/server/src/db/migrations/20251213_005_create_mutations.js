/**
 * Migration: Create Mutations Table
 * 
 * Creates the mutations table for storing variant data
 */

export async function up(knex) {
  // Create enum for mutation types
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE mutation_type AS ENUM (
        'missense', 'nonsense', 'frameshift', 'splice', 
        'silent', 'indel', 'insertion', 'deletion', 'other'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  return knex.schema.createTable('mutations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('gene_id').references('id').inTable('genes').onDelete('SET NULL');
    table.uuid('sample_id').references('id').inTable('samples').onDelete('CASCADE');
    
    // Genomic coordinates
    table.string('chromosome', 10).notNullable();
    table.integer('position').notNullable();
    table.integer('end_position');
    table.string('ref_allele', 1000);
    table.string('alt_allele', 1000);
    
    // Gene and protein info
    table.string('gene_symbol', 50);
    table.specificType('mutation_type', 'mutation_type');
    table.string('consequence', 200);
    table.string('aa_change', 100);
    table.integer('aa_position');
    table.string('codon_change', 50);
    
    // Annotation
    table.string('dbsnp_id', 50);
    table.string('cosmic_id', 50);
    table.float('allele_frequency');
    table.integer('read_depth');
    table.integer('alt_read_count');
    table.string('variant_class', 50);
    table.string('impact', 50); // HIGH, MODERATE, LOW, MODIFIER
    
    // Clinical significance
    table.string('clinical_significance', 100);
    table.boolean('is_somatic').defaultTo(true);
    table.boolean('is_hotspot').defaultTo(false);
    
    // Source info
    table.string('source_file', 500);
    table.string('source_type', 50); // VCF, MAF, etc.
    
    table.jsonb('annotations').defaultTo('{}');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for common queries
    table.index('gene_id');
    table.index('sample_id');
    table.index('gene_symbol');
    table.index('chromosome');
    table.index(['chromosome', 'position']);
    table.index('mutation_type');
    table.index('aa_position');
    table.index('is_hotspot');
    table.index('clinical_significance');
    
    // Composite index for lollipop plot queries
    table.index(['gene_symbol', 'aa_position', 'mutation_type']);
    
    // Unique constraint for deduplication
    table.unique(['sample_id', 'chromosome', 'position', 'ref_allele', 'alt_allele']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('mutations');
  await knex.raw('DROP TYPE IF EXISTS mutation_type');
}
