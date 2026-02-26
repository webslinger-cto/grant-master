import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const rows = await this.db.db('projects')
      .select(
        'projects.*',
        this.db.db.raw('COUNT(applications.id)::int as grant_count'),
        'parent.name as parent_project_name',
      )
      .leftJoin('applications', 'applications.project_id', 'projects.id')
      .leftJoin('projects as parent', 'projects.parent_project_id', 'parent.id')
      .groupBy('projects.id', 'parent.name')
      .orderBy('projects.created_at', 'asc');
    return rows;
  }

  async findById(id: string) {
    const project = await this.db.db('projects')
      .select('projects.*', 'parent.name as parent_project_name')
      .leftJoin('projects as parent', 'projects.parent_project_id', 'parent.id')
      .where('projects.id', id)
      .first();

    if (!project) throw new NotFoundException('Project not found');

    const grants = await this.db.db('applications')
      .select('applications.*', 'opportunities.title as opportunity_title')
      .leftJoin('opportunities', 'applications.opportunity_id', 'opportunities.id')
      .where('applications.project_id', id)
      .orderBy('applications.submission_deadline', 'asc');

    return { ...project, grants };
  }

  async create(data: { name: string; description?: string; context?: Record<string, any> }) {
    const [row] = await this.db.db('projects')
      .insert({
        name: data.name,
        description: data.description ?? null,
        context: data.context ?? {},
        status: 'active',
        // Use seed user so FK is satisfied
        lead_user_id: '20000001-0000-0000-0000-000000000002',
      })
      .returning('id');
    return this.findById(row.id);
  }

  async update(id: string, data: { name?: string; description?: string; context?: Record<string, any> }) {
    const updateData: Record<string, any> = { updated_at: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.context !== undefined) updateData.context = data.context;
    await this.db.db('projects').where('id', id).update(updateData);
    return this.findById(id);
  }

  async clone(id: string, overrides: { name: string; context?: Record<string, any> }) {
    const original = await this.db.db('projects').where('id', id).first();
    if (!original) throw new NotFoundException('Project not found');

    const [row] = await this.db.db('projects')
      .insert({
        name: overrides.name,
        description: original.description,
        context: overrides.context ?? original.context ?? {},
        parent_project_id: id,
        status: 'active',
        lead_user_id: original.lead_user_id ?? '20000001-0000-0000-0000-000000000002',
      })
      .returning('id');
    return this.findById(row.id);
  }

  async remove(id: string) {
    // Detach associated grants instead of cascading delete
    await this.db.db('applications').where('project_id', id).update({ project_id: null });
    await this.db.db('projects').where('id', id).delete();
    return { success: true };
  }
}
