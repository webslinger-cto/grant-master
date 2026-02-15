import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // ============================================================================
  // IDENTITY & ACCESS
  // ============================================================================

  await knex.schema.createTable('organizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('domain', 255);
    table.jsonb('settings').defaultTo('{}');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.string('email', 255).unique().notNullable();
    table.string('full_name', 255).notNullable();
    table.text('avatar_url');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at');
    table.jsonb('notification_preferences').defaultTo('{"email": true, "digest": false}');
    table.timestamps(true, true);

    table.index(['organization_id']);
    table.index(['email']);
  });

  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.text('description');
    table.jsonb('permissions').defaultTo('[]');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('user_roles', (table) => {
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.primary(['user_id', 'role_id']);
  });

  // ============================================================================
  // FUNDING CATALOG
  // ============================================================================

  await knex.schema.createTable('funding_sources', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('type', 50).notNullable();
    table.text('website_url');
    table.decimal('default_probability', 5, 2).defaultTo(20.00);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);

    table.index(['type']);
  });

  await knex.schema.createTable('programs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('funding_source_id').references('id').inTable('funding_sources').onDelete('SET NULL');
    table.string('name', 255).notNullable();
    table.text('description');
    table.text('eligibility_criteria');
    table.decimal('typical_award_range_min', 15, 2);
    table.decimal('typical_award_range_max', 15, 2);
    table.integer('typical_duration_months');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);

    table.index(['funding_source_id']);
  });

  await knex.schema.createTable('opportunities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('program_id').references('id').inTable('programs').onDelete('SET NULL');
    table.string('title', 500).notNullable();
    table.string('foa_number', 100);
    table.text('description');
    table.text('eligibility');
    table.decimal('total_funding_available', 15, 2);
    table.decimal('max_award_amount', 15, 2);
    table.decimal('min_award_amount', 15, 2);
    table.date('loi_deadline');
    table.date('full_proposal_deadline');
    table.date('posted_date');
    table.text('announcement_url');
    table.text('application_portal_url');
    table.string('status', 50).defaultTo('open');
    table.jsonb('metadata').defaultTo('{}');
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);

    table.index(['program_id']);
    table.index(['full_proposal_deadline']);
    table.index(['status']);
  });

  // ============================================================================
  // PROJECTS & APPLICATIONS
  // ============================================================================

  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('clinical_area', 100);
    table.string('status', 50).defaultTo('active');
    table.uuid('lead_user_id').references('id').inTable('users');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);

    table.index(['organization_id']);
    table.index(['lead_user_id']);
  });

  await knex.schema.createTable('applications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('opportunity_id').references('id').inTable('opportunities').onDelete('SET NULL');
    table.string('internal_name', 255).notNullable();
    table.decimal('amount_requested', 15, 2);
    table.date('internal_deadline');
    table.date('submission_deadline');
    table.date('expected_decision_date');
    table.date('submitted_date');
    table.date('decision_date');
    table.string('current_stage', 50).notNullable().defaultTo('qualification');
    table.decimal('probability', 5, 2).defaultTo(20.00);
    table.string('outcome', 50);
    table.decimal('actual_award_amount', 15, 2);
    table.text('outcome_notes');
    table.string('confirmation_number', 255);
    table.jsonb('metadata').defaultTo('{}');
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);

    table.index(['project_id']);
    table.index(['opportunity_id']);
    table.index(['current_stage']);
    table.index(['submission_deadline']);
  });

  await knex.schema.createTable('stage_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.string('from_stage', 50);
    table.string('to_stage', 50).notNullable();
    table.uuid('changed_by').references('id').inTable('users');
    table.timestamp('changed_at').defaultTo(knex.fn.now());
    table.text('notes');
    table.decimal('probability_at_change', 5, 2);

    table.index(['application_id']);
    table.index(['changed_at']);
  });

  // ============================================================================
  // BUDGETS
  // ============================================================================

  await knex.schema.createTable('budgets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('current_version_id');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['application_id']);
  });

  await knex.schema.createTable('budget_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('budget_id').references('id').inTable('budgets').onDelete('CASCADE');
    table.integer('version_number').notNullable();
    table.decimal('total_amount', 15, 2).notNullable();
    table.jsonb('line_items').notNullable();
    table.text('notes');
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['budget_id']);
  });

  // Add FK after budget_versions exists
  await knex.schema.alterTable('budgets', (table) => {
    table.foreign('current_version_id').references('id').inTable('budget_versions');
  });

  // ============================================================================
  // TASKS & DEPENDENCIES
  // ============================================================================

  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.uuid('assigned_to').references('id').inTable('users');
    table.date('due_date');
    table.decimal('estimated_hours', 8, 2);
    table.decimal('actual_hours', 8, 2);
    table.string('status', 50).defaultTo('not_started');
    table.string('priority', 20).defaultTo('medium');
    table.string('task_type', 50);
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);
    table.timestamp('completed_at');

    table.index(['application_id']);
    table.index(['assigned_to']);
    table.index(['status']);
    table.index(['due_date']);
  });

  await knex.schema.createTable('task_dependencies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('blocks_task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['task_id']);
    table.index(['blocks_task_id']);
    table.check('task_id != blocks_task_id', [], 'no_self_dependency');
  });

  await knex.schema.createTable('task_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('funding_source_type', 50);
    table.string('program_type', 100);
    table.jsonb('tasks').notNullable();
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);
  });

  // ============================================================================
  // DOCUMENT POINTERS
  // ============================================================================

  await knex.schema.createTable('document_checklist_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.string('document_type', 100).notNullable();
    table.boolean('required').defaultTo(true);
    table.text('document_url');
    table.string('status', 50).defaultTo('not_started');
    table.uuid('responsible_user_id').references('id').inTable('users');
    table.text('notes');
    table.timestamps(true, true);

    table.index(['application_id']);
  });

  // ============================================================================
  // REVIEWS & SCORECARDS
  // ============================================================================

  await knex.schema.createTable('reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('reviewer_id').references('id').inTable('users');
    table.string('review_type', 50).defaultTo('internal');
    table.string('status', 50).defaultTo('pending');
    table.string('decision', 50);
    table.decimal('overall_score', 5, 2);
    table.text('comments');
    table.jsonb('scorecard_data');
    table.timestamps(true, true);
    table.timestamp('completed_at');

    table.index(['application_id']);
    table.index(['reviewer_id']);
  });

  await knex.schema.createTable('scorecard_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.jsonb('criteria').notNullable();
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ============================================================================
  // AWARDS & POST-AWARD
  // ============================================================================

  await knex.schema.createTable('awards', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.string('award_number', 255);
    table.decimal('awarded_amount', 15, 2).notNullable();
    table.date('award_date');
    table.date('start_date');
    table.date('end_date');
    table.decimal('total_budget', 15, 2);
    table.decimal('spent_to_date', 15, 2).defaultTo(0);
    table.text('reporting_requirements');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);

    table.index(['application_id']);
  });

  await knex.schema.createTable('reporting_deadlines', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('award_id').references('id').inTable('awards').onDelete('CASCADE');
    table.string('report_type', 100).notNullable();
    table.date('due_date').notNullable();
    table.string('status', 50).defaultTo('pending');
    table.date('submitted_date');
    table.text('document_url');
    table.text('notes');
    table.timestamps(true, true);

    table.index(['award_id']);
    table.index(['due_date']);
  });

  await knex.schema.createTable('deliverables', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('award_id').references('id').inTable('awards').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.date('due_date');
    table.string('status', 50).defaultTo('pending');
    table.date('completed_date');
    table.text('evidence_url');
    table.timestamps(true, true);

    table.index(['award_id']);
  });

  // ============================================================================
  // PARTNERS & CONTACTS
  // ============================================================================

  await knex.schema.createTable('partners', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('organization_name', 255);
    table.string('partner_type', 50);
    table.string('email', 255);
    table.string('phone', 50);
    table.specificType('expertise_areas', 'text[]');
    table.text('notes');
    table.timestamps(true, true);

    table.index(['organization_id']);
  });

  await knex.schema.createTable('application_partners', (table) => {
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('partner_id').references('id').inTable('partners').onDelete('CASCADE');
    table.string('role', 100);
    table.primary(['application_id', 'partner_id']);
  });

  // ============================================================================
  // NOTIFICATIONS & AUDIT
  // ============================================================================

  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('notification_type', 50).notNullable();
    table.string('title', 255).notNullable();
    table.text('message');
    table.string('related_entity_type', 50);
    table.uuid('related_entity_id');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('sent_at');
    table.timestamp('read_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id']);
    table.index(['is_read']);
  });

  await knex.schema.createTable('audit_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users');
    table.string('action', 50).notNullable();
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id').notNullable();
    table.jsonb('changes');
    table.specificType('ip_address', 'inet');
    table.text('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id']);
    table.index(['entity_type', 'entity_id']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('audit_log');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('application_partners');
  await knex.schema.dropTableIfExists('partners');
  await knex.schema.dropTableIfExists('deliverables');
  await knex.schema.dropTableIfExists('reporting_deadlines');
  await knex.schema.dropTableIfExists('awards');
  await knex.schema.dropTableIfExists('scorecard_templates');
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('document_checklist_items');
  await knex.schema.dropTableIfExists('task_templates');
  await knex.schema.dropTableIfExists('task_dependencies');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('budget_versions');
  await knex.schema.dropTableIfExists('budgets');
  await knex.schema.dropTableIfExists('stage_history');
  await knex.schema.dropTableIfExists('applications');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('opportunities');
  await knex.schema.dropTableIfExists('programs');
  await knex.schema.dropTableIfExists('funding_sources');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('organizations');
}
