import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clean tables (in order)
  await knex('audit_log').del();
  await knex('notifications').del();
  await knex('application_partners').del();
  await knex('partners').del();
  await knex('deliverables').del();
  await knex('reporting_deadlines').del();
  await knex('awards').del();
  await knex('reviews').del();
  await knex('document_checklist_items').del();
  await knex('task_dependencies').del();
  await knex('tasks').del();
  await knex('budget_versions').del();
  await knex('budgets').del();
  await knex('stage_history').del();
  await knex('applications').del();
  await knex('projects').del();
  await knex('opportunities').del();
  await knex('programs').del();
  await knex('funding_sources').del();
  await knex('user_roles').del();
  await knex('roles').del();
  await knex('users').del();
  await knex('organizations').del();

  // ============================================================================
  // ORGANIZATIONS
  // ============================================================================

  const orgId = 'b1234567-89ab-cdef-0123-456789abcdef';
  await knex('organizations').insert({
    id: orgId,
    name: 'WebSlingerAI',
    domain: 'webslinger.ai',
    settings: JSON.stringify({}),
  });

  // ============================================================================
  // ROLES
  // ============================================================================

  const roleIds = {
    founder: '10000001-0000-0000-0000-000000000001',
    writer: '10000001-0000-0000-0000-000000000002',
    clinician: '10000001-0000-0000-0000-000000000003',
    finance: '10000001-0000-0000-0000-000000000004',
    reviewer: '10000001-0000-0000-0000-000000000005',
  };

  const roles = [
    {
      id: roleIds.founder,
      name: 'Founder/BD',
      description: 'Full access to all features',
      permissions: JSON.stringify(['*']),
    },
    {
      id: roleIds.writer,
      name: 'Grant Writer',
      description: 'Can manage applications, tasks, budgets, documents',
      permissions: JSON.stringify([
        'applications:*',
        'tasks:*',
        'budgets:*',
        'documents:*',
        'forecasts:view',
      ]),
    },
    {
      id: roleIds.clinician,
      name: 'Clinician Liaison',
      description: 'Can view applications and update assigned tasks',
      permissions: JSON.stringify([
        'applications:read',
        'tasks:read',
        'tasks:update',
      ]),
    },
    {
      id: roleIds.finance,
      name: 'Finance/Ops',
      description: 'Can manage budgets, awards, and view forecasts',
      permissions: JSON.stringify([
        'budgets:*',
        'awards:*',
        'forecasts:view',
        'applications:read',
      ]),
    },
    {
      id: roleIds.reviewer,
      name: 'Reviewer',
      description: 'Can view applications and conduct reviews',
      permissions: JSON.stringify([
        'applications:read',
        'reviews:*',
      ]),
    },
  ];
  await knex('roles').insert(roles);

  // ============================================================================
  // USERS
  // ============================================================================

  const userIds = {
    founder: '20000001-0000-0000-0000-000000000001',
    writer: '20000001-0000-0000-0000-000000000002',
    clinician: '20000001-0000-0000-0000-000000000003',
    finance: '20000001-0000-0000-0000-000000000004',
    reviewer: '20000001-0000-0000-0000-000000000005',
  };

  const users = [
    {
      id: userIds.founder,
      organization_id: orgId,
      email: 'founder@webslinger.ai',
      full_name: 'Alex Founder',
      is_active: true,
    },
    {
      id: userIds.writer,
      organization_id: orgId,
      email: 'writer@webslinger.ai',
      full_name: 'Sam Writer',
      is_active: true,
    },
    {
      id: userIds.clinician,
      organization_id: orgId,
      email: 'clinician@webslinger.ai',
      full_name: 'Dr. Jordan Clinician',
      is_active: true,
    },
    {
      id: userIds.finance,
      organization_id: orgId,
      email: 'finance@webslinger.ai',
      full_name: 'Taylor Finance',
      is_active: true,
    },
    {
      id: userIds.reviewer,
      organization_id: orgId,
      email: 'reviewer@webslinger.ai',
      full_name: 'Morgan Reviewer',
      is_active: true,
    },
  ];
  await knex('users').insert(users);

  // ============================================================================
  // USER ROLES
  // ============================================================================

  await knex('user_roles').insert([
    { user_id: userIds.founder, role_id: roleIds.founder },
    { user_id: userIds.writer, role_id: roleIds.writer },
    { user_id: userIds.clinician, role_id: roleIds.clinician },
    { user_id: userIds.finance, role_id: roleIds.finance },
    { user_id: userIds.reviewer, role_id: roleIds.reviewer },
  ]);

  // ============================================================================
  // FUNDING SOURCES
  // ============================================================================

  const fundingSourceIds = {
    nih: '30000001-0000-0000-0000-000000000001',
    nsf: '30000001-0000-0000-0000-000000000002',
    arpaH: '30000001-0000-0000-0000-000000000003',
    barda: '30000001-0000-0000-0000-000000000004',
    gates: '30000001-0000-0000-0000-000000000005',
  };

  const fundingSources = [
    {
      id: fundingSourceIds.nih,
      name: 'National Institutes of Health (NIH)',
      type: 'federal',
      website_url: 'https://www.nih.gov',
      default_probability: 15.00,
    },
    {
      id: fundingSourceIds.nsf,
      name: 'National Science Foundation (NSF)',
      type: 'federal',
      website_url: 'https://www.nsf.gov',
      default_probability: 12.00,
    },
    {
      id: fundingSourceIds.arpaH,
      name: 'Advanced Research Projects Agency for Health (ARPA-H)',
      type: 'federal',
      website_url: 'https://arpa-h.gov',
      default_probability: 8.00,
    },
    {
      id: fundingSourceIds.barda,
      name: 'Biomedical Advanced Research and Development Authority (BARDA)',
      type: 'federal',
      website_url: 'https://www.medicalcountermeasures.gov',
      default_probability: 10.00,
    },
    {
      id: fundingSourceIds.gates,
      name: 'Bill & Melinda Gates Foundation',
      type: 'foundation',
      website_url: 'https://www.gatesfoundation.org',
      default_probability: 10.00,
    },
  ];
  await knex('funding_sources').insert(fundingSources);

  // ============================================================================
  // PROGRAMS
  // ============================================================================

  const programIds = {
    r01: '40000001-0000-0000-0000-000000000001',
    sbir: '40000001-0000-0000-0000-000000000002',
    nsfCareer: '40000001-0000-0000-0000-000000000003',
  };

  const programs = [
    {
      id: programIds.r01,
      funding_source_id: fundingSourceIds.nih,
      name: 'R01 Research Project Grant',
      description: 'Support for discrete, specified, circumscribed research projects',
      typical_award_range_min: 250000,
      typical_award_range_max: 500000,
      typical_duration_months: 36,
    },
    {
      id: programIds.sbir,
      funding_source_id: fundingSourceIds.nih,
      name: 'SBIR Phase I',
      description: 'Small Business Innovation Research Phase I',
      typical_award_range_min: 50000,
      typical_award_range_max: 300000,
      typical_duration_months: 12,
    },
    {
      id: programIds.nsfCareer,
      funding_source_id: fundingSourceIds.nsf,
      name: 'NSF CAREER',
      description: 'Faculty Early Career Development Program',
      typical_award_range_min: 400000,
      typical_award_range_max: 600000,
      typical_duration_months: 60,
    },
  ];
  await knex('programs').insert(programs);

  // ============================================================================
  // OPPORTUNITIES
  // ============================================================================

  const opportunityIds = {
    opp1: '50000001-0000-0000-0000-000000000001',
    opp2: '50000001-0000-0000-0000-000000000002',
  };

  const opportunities = [
    {
      id: opportunityIds.opp1,
      program_id: programIds.r01,
      title: 'AI for Cardiovascular Disease Prediction',
      foa_number: 'RFA-HL-26-001',
      description: 'Research to develop AI/ML tools for early detection of cardiovascular disease',
      total_funding_available: 5000000,
      max_award_amount: 500000,
      full_proposal_deadline: '2026-06-15',
      posted_date: '2026-01-15',
      announcement_url: 'https://grants.nih.gov/grants/guide/rfa-files/RFA-HL-26-001.html',
      status: 'open',
      created_by: userIds.founder,
    },
    {
      id: opportunityIds.opp2,
      program_id: programIds.sbir,
      title: 'SBIR: Digital Health Tools for Remote Patient Monitoring',
      foa_number: 'PAR-26-100',
      description: 'Development of innovative digital health technologies',
      max_award_amount: 300000,
      full_proposal_deadline: '2026-05-01',
      posted_date: '2026-02-01',
      status: 'open',
      created_by: userIds.founder,
    },
  ];
  await knex('opportunities').insert(opportunities);

  // ============================================================================
  // PROJECTS
  // ============================================================================

  const projectIds = {
    cardioAI: '60000001-0000-0000-0000-000000000001',
    remoteMonitoring: '60000001-0000-0000-0000-000000000002',
  };

  const projects = [
    {
      id: projectIds.cardioAI,
      organization_id: orgId,
      name: 'CardioAI Platform',
      description: 'AI-powered cardiovascular disease prediction and monitoring platform',
      clinical_area: 'Cardiology',
      status: 'active',
      lead_user_id: userIds.writer,
    },
    {
      id: projectIds.remoteMonitoring,
      organization_id: orgId,
      name: 'Remote Patient Monitoring System',
      description: 'IoT-enabled remote patient monitoring for chronic conditions',
      clinical_area: 'General Medicine',
      status: 'active',
      lead_user_id: userIds.writer,
    },
  ];
  await knex('projects').insert(projects);

  // ============================================================================
  // APPLICATIONS
  // ============================================================================

  const applicationIds = {
    app1: '70000001-0000-0000-0000-000000000001',
    app2: '70000001-0000-0000-0000-000000000002',
  };

  const applications = [
    {
      id: applicationIds.app1,
      project_id: projectIds.cardioAI,
      opportunity_id: opportunityIds.opp1,
      internal_name: 'NIH R01 - CardioAI - Summer 2026',
      amount_requested: 450000,
      submission_deadline: '2026-06-15',
      internal_deadline: '2026-06-08',
      current_stage: 'drafting',
      probability: 20.00,
      created_by: userIds.writer,
    },
    {
      id: applicationIds.app2,
      project_id: projectIds.remoteMonitoring,
      opportunity_id: opportunityIds.opp2,
      internal_name: 'NIH SBIR - Remote Monitoring - Spring 2026',
      amount_requested: 250000,
      submission_deadline: '2026-05-01',
      internal_deadline: '2026-04-24',
      current_stage: 'planning',
      probability: 25.00,
      created_by: userIds.writer,
    },
  ];
  await knex('applications').insert(applications);

  // ============================================================================
  // STAGE HISTORY
  // ============================================================================

  await knex('stage_history').insert([
    {
      id: '80000001-0000-0000-0000-000000000001',
      application_id: applicationIds.app1,
      from_stage: null,
      to_stage: 'qualification',
      changed_by: userIds.writer,
      probability_at_change: 15.00,
    },
    {
      id: '80000001-0000-0000-0000-000000000002',
      application_id: applicationIds.app1,
      from_stage: 'qualification',
      to_stage: 'planning',
      changed_by: userIds.writer,
      probability_at_change: 18.00,
    },
    {
      id: '80000001-0000-0000-0000-000000000003',
      application_id: applicationIds.app1,
      from_stage: 'planning',
      to_stage: 'drafting',
      changed_by: userIds.writer,
      probability_at_change: 20.00,
    },
  ]);

  // ============================================================================
  // TASKS
  // ============================================================================

  const taskIds = {
    task1: '90000001-0000-0000-0000-000000000001',
    task2: '90000001-0000-0000-0000-000000000002',
    task3: '90000001-0000-0000-0000-000000000003',
    task4: '90000001-0000-0000-0000-000000000004',
  };

  const tasks = [
    {
      id: taskIds.task1,
      application_id: applicationIds.app1,
      title: 'Draft Specific Aims (1 page)',
      description: 'Write the Specific Aims section outlining research objectives',
      assigned_to: userIds.writer,
      due_date: '2026-03-15',
      estimated_hours: 8,
      status: 'in_progress',
      priority: 'high',
      task_type: 'writing',
      created_by: userIds.writer,
    },
    {
      id: taskIds.task2,
      application_id: applicationIds.app1,
      title: 'Literature Review - AI in Cardiology',
      description: 'Comprehensive review of existing AI methods for cardiovascular disease',
      assigned_to: userIds.writer,
      due_date: '2026-03-20',
      estimated_hours: 16,
      status: 'not_started',
      priority: 'medium',
      task_type: 'research',
      created_by: userIds.writer,
    },
    {
      id: taskIds.task3,
      application_id: applicationIds.app1,
      title: 'Gather clinical data requirements',
      description: 'Work with clinicians to define data needs and validation approach',
      assigned_to: userIds.clinician,
      due_date: '2026-03-25',
      estimated_hours: 6,
      status: 'not_started',
      priority: 'high',
      task_type: 'research',
      created_by: userIds.writer,
    },
    {
      id: taskIds.task4,
      application_id: applicationIds.app1,
      title: 'Budget development',
      description: 'Create detailed budget with justification',
      assigned_to: userIds.finance,
      due_date: '2026-04-01',
      estimated_hours: 8,
      status: 'not_started',
      priority: 'high',
      task_type: 'admin',
      created_by: userIds.writer,
    },
  ];
  await knex('tasks').insert(tasks);

  // ============================================================================
  // TASK DEPENDENCIES
  // ============================================================================

  await knex('task_dependencies').insert([
    {
      id: 'a0000001-0000-0000-0000-000000000001',
      task_id: taskIds.task1,
      blocks_task_id: taskIds.task2,
    },
  ]);

  console.log('✅ Seed data inserted successfully');
}
