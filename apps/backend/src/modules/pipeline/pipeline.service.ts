import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class PipelineService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const rows = await this.db.db('applications')
      .select(
        'applications.*',
        'opportunities.title as opportunity_title',
      )
      .leftJoin('opportunities', 'applications.opportunity_id', 'opportunities.id')
      .orderBy('applications.submission_deadline', 'asc');
    return rows;
  }

  async findById(id: string) {
    return this.db.db('applications')
      .where('applications.id', id)
      .select(
        'applications.*',
        'opportunities.title as opportunity_title',
        'opportunities.description as opportunity_description',
      )
      .leftJoin('opportunities', 'applications.opportunity_id', 'opportunities.id')
      .first();
  }

  async create(data: {
    internal_name: string;
    amount_requested?: number;
    submission_deadline?: string | null;
    current_stage?: string;
    probability?: number;
    outcome_notes?: string | null;
  }) {
    const [row] = await this.db.db('applications')
      .insert({
        internal_name: data.internal_name,
        amount_requested: data.amount_requested ?? 0,
        submission_deadline: data.submission_deadline ?? null,
        current_stage: data.current_stage ?? 'qualification',
        probability: data.probability ?? 20,
        outcome_notes: data.outcome_notes ?? null,
        // Use existing seed user so FK constraint is satisfied
        created_by: '20000001-0000-0000-0000-000000000002',
      })
      .returning('id');
    return this.findById(row.id);
  }

  async update(id: string, data: Record<string, any>) {
    const allowed = [
      'internal_name',
      'amount_requested',
      'submission_deadline',
      'internal_deadline',
      'current_stage',
      'probability',
      'outcome_notes',
      'metadata',
    ];
    const updateData: Record<string, any> = { updated_at: new Date() };
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    await this.db.db('applications').where('id', id).update(updateData);
    return this.findById(id);
  }
}
