import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Citations table - store all citations
  await knex.schema.createTable('citations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Citation identifiers
    table.string('doi', 500).nullable().index();
    table.string('pmid', 50).nullable().index();
    table.string('pmcid', 50).nullable();

    // Core citation data
    table.text('title').notNullable();
    table.text('authors').notNullable(); // JSON array of author objects
    table.string('journal', 500).nullable();
    table.string('publisher', 500).nullable();
    table.integer('year').nullable();
    table.string('volume', 50).nullable();
    table.string('issue', 50).nullable();
    table.string('pages', 100).nullable();
    table.date('publication_date').nullable();

    // Additional metadata
    table.string('citation_type', 50).notNullable().defaultTo('journal_article'); // journal_article, book, conference, website, etc.
    table.text('abstract').nullable();
    table.text('url').nullable();
    table.jsonb('metadata').nullable(); // Store extra fields (ISBN, edition, etc.)

    // Formatted citations (cached)
    table.text('formatted_nih').nullable(); // NIH format
    table.text('formatted_apa').nullable(); // APA format
    table.text('formatted_mla').nullable(); // MLA format
    table.text('formatted_chicago').nullable(); // Chicago format

    // Usage tracking
    table.integer('usage_count').defaultTo(0);
    table.timestamp('last_used_at').nullable();

    table.timestamps(true, true);

    // Indexes
    table.index(['application_id', 'created_at']);
    table.index('created_by');
  });

  // Citation links - track where citations are used in sections
  await knex.schema.createTable('citation_links', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('citation_id').notNullable().references('id').inTable('citations').onDelete('CASCADE');
    table.uuid('section_id').nullable().references('id').inTable('generated_sections').onDelete('CASCADE');

    // In-text citation info
    table.text('context').nullable(); // Surrounding text where citation appears
    table.integer('position').nullable(); // Position in document
    table.string('citation_label', 50).nullable(); // e.g., "[1]", "(Smith, 2020)"

    table.timestamps(true, true);

    table.index(['citation_id', 'section_id']);
    table.index('section_id');
  });

  // Citation import jobs - track batch imports
  await knex.schema.createTable('citation_import_jobs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');

    table.string('source', 50).notNullable(); // 'pubmed', 'crossref', 'doi', 'manual', 'bibtex'
    table.text('input_data').notNullable(); // Original input (DOI list, BibTeX file, etc.)
    table.string('status', 50).notNullable().defaultTo('pending'); // pending, processing, completed, failed

    table.integer('total_count').defaultTo(0);
    table.integer('success_count').defaultTo(0);
    table.integer('failed_count').defaultTo(0);
    table.jsonb('errors').nullable(); // Store error messages for failed imports

    table.timestamps(true, true);

    table.index(['application_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('citation_import_jobs');
  await knex.schema.dropTableIfExists('citation_links');
  await knex.schema.dropTableIfExists('citations');
}
