import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('section_templates').where('grant_type', 'NIH_R01').del();

  // NIH R01 Section Templates
  // Based on PHS 398 Research Plan requirements
  await knex('section_templates').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Specific Aims',
      section_key: 'specific_aims',
      description: 'State the specific objectives and hypotheses of the proposed research (1 page max)',
      prompt_template: `You are an expert NIH grant writer. Generate a "Specific Aims" section for an NIH R01 grant application.

The Specific Aims page should:
1. Start with a compelling opening paragraph that establishes the significance and impact
2. Clearly state 2-3 specific aims with testable hypotheses
3. Briefly describe the approach for each aim
4. Conclude with the expected outcomes and impact
5. Be exactly 1 page (approximately 500-600 words)

Application Context:
{application_context}

Generate a professionally written Specific Aims section:`,
      page_limit: 1,
      word_limit: 600,
      sort_order: 1,
      metadata: {
        formatting_notes: 'Single-spaced, 0.5-inch margins, Arial 11pt or Helvetica 12pt',
        typical_structure: ['Opening paragraph', 'Aim 1', 'Aim 2', 'Aim 3', 'Impact statement']
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Research Strategy - Significance',
      section_key: 'significance',
      description: 'Explain the importance of the problem or critical barrier to progress',
      prompt_template: `You are an expert NIH grant writer. Generate the "Significance" subsection of the Research Strategy for an NIH R01 grant application.

The Significance section should:
1. Explain the importance of the problem or critical barrier
2. Describe how the proposed project addresses this problem
3. Explain how the concepts, methods, or interventions improve scientific knowledge or practice
4. Describe how the results will change the field or clinical practice
5. Be approximately 2-3 pages

Application Context:
{application_context}

Generate a compelling Significance section:`,
      page_limit: 3,
      word_limit: 1500,
      sort_order: 2,
      metadata: {
        key_questions: [
          'What is the problem and why is it important?',
          'What is the critical barrier?',
          'How will this research address the barrier?',
          'What is the expected impact?'
        ]
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Research Strategy - Innovation',
      section_key: 'innovation',
      description: 'Explain how the application challenges existing paradigms or develops novel concepts',
      prompt_template: `You are an expert NIH grant writer. Generate the "Innovation" subsection of the Research Strategy for an NIH R01 grant application.

The Innovation section should:
1. Explain how the application challenges and seeks to shift current research or clinical practice paradigms
2. Describe novel theoretical concepts, approaches, methodologies, instrumentation, or interventions
3. Explain advantages over existing approaches
4. Describe refinements, improvements, or new applications of theoretical concepts
5. Be approximately 1-2 pages

Application Context:
{application_context}

Generate an Innovation section highlighting the novel aspects:`,
      page_limit: 2,
      word_limit: 1000,
      sort_order: 3,
      metadata: {
        key_questions: [
          'What is novel about this research?',
          'How does it challenge existing paradigms?',
          'What are the advantages over existing approaches?'
        ]
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Research Strategy - Approach',
      section_key: 'approach',
      description: 'Describe the overall strategy, methodology, and analyses',
      prompt_template: `You are an expert NIH grant writer. Generate the "Approach" subsection of the Research Strategy for an NIH R01 grant application.

The Approach section should:
1. Describe the overall research strategy and design
2. For each specific aim, provide detailed methods and analyses
3. Discuss preliminary data that supports feasibility
4. Address potential problems and alternative strategies
5. Describe the timeline and milestones
6. Be approximately 6-8 pages (the largest section)

Application Context:
{application_context}

Generate a detailed Approach section:`,
      page_limit: 8,
      word_limit: 4000,
      sort_order: 4,
      metadata: {
        key_subsections: [
          'Overall Strategy',
          'Preliminary Studies/Progress Report',
          'Research Design and Methods (by Aim)',
          'Potential Problems and Alternative Strategies',
          'Timeline'
        ]
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Project Summary/Abstract',
      section_key: 'project_summary',
      description: 'Brief overview of the entire application (30 lines max)',
      prompt_template: `You are an expert NIH grant writer. Generate a "Project Summary/Abstract" for an NIH R01 grant application.

The Project Summary should:
1. Provide a brief overview of the entire application
2. Be concise and self-contained
3. Follow this structure: background, gap/problem, objectives, methods, expected outcomes, impact
4. Be exactly 30 lines of text (approximately 300-400 words)
5. Avoid proprietary or confidential information

Application Context:
{application_context}

Generate a Project Summary/Abstract:`,
      page_limit: 1,
      word_limit: 400,
      sort_order: 0, // Comes before Specific Aims
      metadata: {
        max_lines: 30,
        note: 'Must be suitable for public dissemination'
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Project Narrative',
      section_key: 'project_narrative',
      description: 'Describe the relevance of the research to public health (2-3 sentences)',
      prompt_template: `You are an expert NIH grant writer. Generate a "Project Narrative" for an NIH R01 grant application.

The Project Narrative should:
1. Be 2-3 sentences maximum
2. Describe the relevance of this research to public health
3. Use clear, plain language understandable by non-scientists
4. Focus on the health impact and benefits to society

Application Context:
{application_context}

Generate a Project Narrative:`,
      page_limit: 1,
      word_limit: 100,
      sort_order: 0,
      metadata: {
        max_sentences: 3,
        audience: 'General public, non-scientists'
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Budget Justification',
      section_key: 'budget_justification',
      description: 'Justify the budget for personnel, equipment, supplies, travel, etc.',
      prompt_template: `You are an expert NIH grant writer. Generate a "Budget Justification" for an NIH R01 grant application.

The Budget Justification should:
1. Justify each budget category (personnel, equipment, supplies, travel, etc.)
2. Explain why each cost is necessary for the research
3. Provide sufficient detail for reviewers to assess appropriateness
4. Align with the research plan and timeline
5. Be approximately 2-4 pages

Application Context:
{application_context}

Budget Information:
{budget_data}

Generate a detailed Budget Justification:`,
      page_limit: 4,
      word_limit: 2000,
      sort_order: 10,
      metadata: {
        typical_categories: [
          'Personnel (salaries and fringe)',
          'Equipment',
          'Supplies',
          'Travel',
          'Patient Care Costs',
          'Consortium/Contractual',
          'Other Direct Costs'
        ]
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Biographical Sketch',
      section_key: 'biosketch',
      description: 'NIH Biographical Sketch for key personnel (5 pages max per person)',
      prompt_template: `You are an expert NIH grant writer. Generate a "Biographical Sketch" for an NIH R01 grant application using the NIH biosketch format.

The Biographical Sketch should follow NIH format:
A. Personal Statement (brief narrative)
B. Positions, Scientific Appointments, and Honors
C. Contributions to Science (up to 5 contributions, 4 publications each)
D. Additional Information: Research Support and/or Scholastic Performance

Researcher Information:
{researcher_info}

Generate a properly formatted NIH Biographical Sketch:`,
      page_limit: 5,
      word_limit: 2500,
      sort_order: 11,
      metadata: {
        format: 'NIH Biosketch format (OMB No. 0925-0001)',
        sections: ['Personal Statement', 'Positions and Honors', 'Contributions to Science', 'Research Support']
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Facilities & Other Resources',
      section_key: 'facilities_resources',
      description: 'Describe institutional facilities and resources available for the project',
      prompt_template: `You are an expert NIH grant writer. Generate a "Facilities & Other Resources" section for an NIH R01 grant application.

This section should describe:
1. Laboratory facilities and capabilities
2. Clinical facilities (if applicable)
3. Animal facilities (if applicable)
4. Computer resources and bioinformatics support
5. Office and other space
6. Major equipment available
7. Collaborative arrangements and resources

Institution Information:
{institution_info}

Generate a comprehensive Facilities & Resources description:`,
      page_limit: 2,
      word_limit: 1000,
      sort_order: 12,
      metadata: {
        typical_sections: [
          'Laboratory',
          'Clinical',
          'Animal',
          'Computer',
          'Office',
          'Equipment'
        ]
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Equipment',
      section_key: 'equipment',
      description: 'List major equipment items already available',
      prompt_template: `You are an expert NIH grant writer. Generate an "Equipment" section for an NIH R01 grant application.

This section should:
1. List major items of equipment already available for the project
2. Include equipment purchased with prior NIH funding
3. Note equipment shared with other projects
4. Be concise (typically 1 page or less)

Available Equipment:
{equipment_list}

Generate an Equipment section:`,
      page_limit: 1,
      word_limit: 500,
      sort_order: 13,
      metadata: {
        note: 'Only list major equipment, not standard lab supplies'
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Data Management & Sharing Plan',
      section_key: 'data_management_plan',
      description: 'Describe how data will be managed and shared (new NIH requirement)',
      prompt_template: `You are an expert NIH grant writer. Generate a "Data Management & Sharing Plan" for an NIH R01 grant application.

The Data Management and Sharing Plan should address:
1. Data Type (what data will be generated)
2. Related Tools, Software, and/or Code
3. Standards (metadata, format, etc.)
4. Data Preservation, Access, and Associated Timelines
5. Access, Distribution, or Reuse Considerations
6. Oversight of Data Management and Sharing

This is a new NIH requirement as of January 2023.

Application Context:
{application_context}

Generate a comprehensive Data Management & Sharing Plan:`,
      page_limit: 2,
      word_limit: 1000,
      sort_order: 14,
      metadata: {
        required_since: '2023-01-25',
        key_elements: [
          'Data Type',
          'Tools/Software/Code',
          'Standards',
          'Preservation and Access',
          'Access Considerations',
          'Oversight'
        ]
      },
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      grant_type: 'NIH_R01',
      section_name: 'Authentication of Key Resources',
      section_key: 'authentication_resources',
      description: 'Describe how key biological/chemical resources will be authenticated',
      prompt_template: `You are an expert NIH grant writer. Generate an "Authentication of Key Biological and/or Chemical Resources" section for an NIH R01 grant application.

This section should:
1. Identify key biological and/or chemical resources (cell lines, antibodies, reagents)
2. Describe authentication methods for each resource
3. Provide source/vendor information
4. Describe quality control measures
5. Be typically 1-2 pages

Key Resources:
{key_resources}

Generate an Authentication of Key Resources section:`,
      page_limit: 2,
      word_limit: 1000,
      sort_order: 15,
      metadata: {
        typical_resources: [
          'Cell lines',
          'Antibodies',
          'Model organisms',
          'Chemical compounds',
          'Other reagents'
        ]
      },
      is_active: true
    }
  ]);

  console.log('✅ NIH R01 section templates seeded successfully');
}
