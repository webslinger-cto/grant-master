import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // AI CHATBOT & SECTION GENERATION
  // ============================================================================

  // Section templates for different grant types (NIH R01, NSF, etc.)
  await knex.schema.createTable('section_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('grant_type', 100).notNullable(); // e.g., 'NIH_R01', 'NSF_CAREER'
    table.string('section_name', 255).notNullable(); // e.g., 'Specific Aims', 'Research Strategy'
    table.string('section_key', 100).notNullable(); // slug version for code reference
    table.text('description'); // What this section is about
    table.text('prompt_template'); // Base prompt for AI generation
    table.integer('page_limit'); // Page limit for this section (if any)
    table.integer('word_limit'); // Word limit (if any)
    table.integer('sort_order').defaultTo(0); // Display order
    table.jsonb('metadata').defaultTo('{}'); // Additional metadata (formatting rules, etc.)
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.index(['grant_type']);
    table.index(['section_key']);
    table.unique(['grant_type', 'section_key']);
  });

  // Generated sections with version tracking
  await knex.schema.createTable('generated_sections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('section_template_id').references('id').inTable('section_templates').onDelete('SET NULL');
    table.string('section_name', 255).notNullable();
    table.integer('version_number').notNullable().defaultTo(1);
    table.text('content').notNullable(); // The AI-generated content
    table.text('prompt_used'); // The actual prompt sent to AI
    table.jsonb('generation_metadata').defaultTo('{}'); // model, tokens, temperature, etc.
    table.string('status', 50).defaultTo('draft'); // draft, under_review, approved, rejected
    table.uuid('generated_by').references('id').inTable('users');
    table.uuid('reviewed_by').references('id').inTable('users');
    table.timestamp('reviewed_at');
    table.text('review_notes');
    table.boolean('is_current_version').defaultTo(true); // Only one version should be current
    table.timestamps(true, true);

    table.index(['application_id']);
    table.index(['section_template_id']);
    table.index(['application_id', 'section_name']); // Quick lookup for app sections
    table.index(['is_current_version']);
  });

  // Chat messages for conversational AI interface
  await knex.schema.createTable('chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('role', 20).notNullable(); // 'user' or 'assistant'
    table.text('content').notNullable(); // The message text
    table.jsonb('metadata').defaultTo('{}'); // tokens, model, context, etc.
    table.uuid('parent_message_id').references('id').inTable('chat_messages').onDelete('SET NULL'); // For threading
    table.uuid('generated_section_id').references('id').inTable('generated_sections').onDelete('SET NULL'); // Link if message resulted in section generation
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['application_id', 'created_at']); // Efficient chat history retrieval
    table.index(['user_id']);
  });

  // Rate limiting tracking
  await knex.schema.createTable('ai_usage_tracking', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.string('action_type', 50).notNullable(); // 'chat_message', 'section_generation'
    table.integer('tokens_used').notNullable();
    table.decimal('cost_usd', 10, 6); // Track costs
    table.string('model', 100); // Which model was used
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id', 'created_at']); // For rate limiting checks
    table.index(['application_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_usage_tracking');
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('generated_sections');
  await knex.schema.dropTableIfExists('section_templates');
}
