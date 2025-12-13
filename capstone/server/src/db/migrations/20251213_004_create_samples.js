/**
 * Migration: Create Samples Table
 * 
 * Creates the samples table for storing clinical and sample metadata
 */

export async function up(knex) {
  // Create enums
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE sample_type AS ENUM ('tumor', 'normal', 'metastasis');
      CREATE TYPE vital_status AS ENUM ('alive', 'deceased', 'unknown');
      CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'unknown');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  return knex.schema.createTable('samples', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('sample_id', 100).unique().notNullable(); // External sample ID
    table.string('patient_id', 100);
    table.specificType('sample_type', 'sample_type').defaultTo('tumor');
    table.string('cancer_type', 200);
    table.string('cancer_subtype', 200);
    table.string('stage', 50);
    table.string('grade', 50);
    table.integer('age_at_diagnosis');
    table.specificType('gender', 'gender_type').defaultTo('unknown');
    table.integer('survival_days');
    table.specificType('vital_status', 'vital_status').defaultTo('unknown');
    table.string('primary_site', 200);
    table.string('metastatic_site', 200);
    table.date('diagnosis_date');
    table.date('collection_date');
    table.string('source', 100); // e.g., 'TCGA', 'ICGC', 'internal'
    table.string('project_id', 100);
    table.jsonb('clinical_data').defaultTo('{}');
    table.jsonb('metadata').defaultTo('{}');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('sample_id');
    table.index('patient_id');
    table.index('cancer_type');
    table.index('sample_type');
    table.index('vital_status');
    table.index('source');
    table.index('project_id');
    table.index('created_by');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('samples');
  await knex.raw('DROP TYPE IF EXISTS sample_type');
  await knex.raw('DROP TYPE IF EXISTS vital_status');
  await knex.raw('DROP TYPE IF EXISTS gender_type');
}
