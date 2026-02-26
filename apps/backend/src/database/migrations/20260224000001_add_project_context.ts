import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', (table) => {
    // Stores the 8 IntakeData fields: projectName, oneLiner, clinicalProblem,
    // targetUsers, coreTechnology, differentiation, fundingMechanism, developmentStage
    table.jsonb('context').defaultTo('{}');
    // Cloning lineage — null means top-level project
    table.uuid('parent_project_id').nullable();
  });

  // Add FK separately (self-referential)
  await knex.schema.alterTable('projects', (table) => {
    table.foreign('parent_project_id').references('id').inTable('projects').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', (table) => {
    table.dropForeign(['parent_project_id']);
    table.dropColumn('context');
    table.dropColumn('parent_project_id');
  });
}
