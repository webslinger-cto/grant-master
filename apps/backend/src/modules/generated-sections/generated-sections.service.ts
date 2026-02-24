import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class GeneratedSectionsService {
  private readonly logger = new Logger(GeneratedSectionsService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get all generated sections for an application
   */
  async getByApplicationId(applicationId: string): Promise<any[]> {
    return this.db.db('generated_sections')
      .select(
        'generated_sections.*',
        'section_templates.section_name',
        'section_templates.section_key',
        'section_templates.page_limit',
        'section_templates.word_limit',
        'users.full_name as generated_by_name',
      )
      .leftJoin('section_templates', 'generated_sections.section_template_id', 'section_templates.id')
      .leftJoin('users', 'generated_sections.generated_by', 'users.id')
      .where('generated_sections.application_id', applicationId)
      .where('generated_sections.is_current_version', true)
      .orderBy('section_templates.sort_order', 'asc');
  }

  /**
   * Get a specific generated section by ID
   */
  async getById(id: string): Promise<any> {
    const section = await this.db.db('generated_sections')
      .select(
        'generated_sections.*',
        'section_templates.section_name',
        'section_templates.section_key',
        'section_templates.page_limit',
        'section_templates.word_limit',
        'users.full_name as generated_by_name',
        'reviewer.full_name as reviewed_by_name',
      )
      .leftJoin('section_templates', 'generated_sections.section_template_id', 'section_templates.id')
      .leftJoin('users', 'generated_sections.generated_by', 'users.id')
      .leftJoin('users as reviewer', 'generated_sections.reviewed_by', 'reviewer.id')
      .where('generated_sections.id', id)
      .first();

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return section;
  }

  /**
   * Get version history for a section
   */
  async getVersionHistory(applicationId: string, sectionName: string): Promise<any[]> {
    return this.db.db('generated_sections')
      .select('*')
      .where('application_id', applicationId)
      .where('section_name', sectionName)
      .orderBy('version_number', 'desc');
  }

  /**
   * Update a generated section
   */
  async update(id: string, userId: string, dto: UpdateSectionDto): Promise<any> {
    const section = await this.getById(id);

    const updateData: any = {};

    if (dto.content !== undefined) {
      updateData.content = dto.content;
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;

      // If status is being changed to approved/rejected, record reviewer
      if (dto.status === 'approved' || dto.status === 'rejected') {
        updateData.reviewed_by = userId;
        updateData.reviewed_at = this.db.db.fn.now();
      }

      // If status is being set to under_review, create a task
      if (dto.status === 'under_review') {
        await this.createReviewTask(section.application_id, section.section_name, userId);
      }
    }

    if (dto.reviewNotes !== undefined) {
      updateData.review_notes = dto.reviewNotes;
    }

    if (Object.keys(updateData).length === 0) {
      return section;
    }

    updateData.updated_at = this.db.db.fn.now();

    await this.db.db('generated_sections').where('id', id).update(updateData);

    this.logger.log(`Section ${id} updated by user ${userId}`);

    return this.getById(id);
  }

  /**
   * Delete a generated section
   */
  async delete(id: string): Promise<void> {
    const section = await this.getById(id);

    await this.db.db('generated_sections').where('id', id).del();

    this.logger.log(`Section ${id} deleted`);
  }

  /**
   * Set a specific version as current
   */
  async setCurrentVersion(id: string): Promise<any> {
    const section = await this.getById(id);

    // Unset current version for this section
    await this.db.db('generated_sections')
      .where('application_id', section.application_id)
      .where('section_name', section.section_name)
      .update({ is_current_version: false });

    // Set this version as current
    await this.db.db('generated_sections')
      .where('id', id)
      .update({ is_current_version: true });

    this.logger.log(`Section ${id} set as current version`);

    return this.getById(id);
  }

  /**
   * Create a review task when section is marked for review
   */
  private async createReviewTask(applicationId: string, sectionName: string, createdBy: string): Promise<void> {
    // Check if a review task already exists
    const existingTask = await this.db.db('tasks')
      .where('application_id', applicationId)
      .where('title', `Review: ${sectionName}`)
      .where('status', '!=', 'completed')
      .first();

    if (existingTask) {
      this.logger.log(`Review task already exists for ${sectionName}`);
      return;
    }

    // Get the application to set appropriate due date
    const application = await this.db.db('applications').where('id', applicationId).first();

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    // Set due date to 3 days before submission deadline (if exists)
    let dueDate: Date | null = null;
    if (application.submission_deadline) {
      const deadline = new Date(application.submission_deadline);
      deadline.setDate(deadline.getDate() - 3);
      dueDate = deadline;
    }

    // Create the task
    await this.db.db('tasks').insert({
      application_id: applicationId,
      title: `Review: ${sectionName}`,
      description: `Review the AI-generated ${sectionName} section and provide feedback or approval.`,
      status: 'not_started',
      priority: 'high',
      task_type: 'review',
      due_date: dueDate,
      created_by: createdBy,
    });

    this.logger.log(`Created review task for ${sectionName}`);

    // Also update application status if it's in early stages
    if (application.current_stage === 'qualification' || application.current_stage === 'planning') {
      await this.db.db('applications')
        .where('id', applicationId)
        .update({ current_stage: 'drafting' });

      this.logger.log(`Updated application ${applicationId} status to 'drafting'`);
    }
  }

  /**
   * Get available section templates
   */
  async getTemplates(grantType: string = 'NIH_R01'): Promise<any[]> {
    return this.db.db('section_templates')
      .where('grant_type', grantType)
      .where('is_active', true)
      .orderBy('sort_order', 'asc');
  }

  /**
   * Export all sections as a single document (for future Google Docs integration)
   */
  async exportApplication(applicationId: string): Promise<string> {
    const sections = await this.getByApplicationId(applicationId);

    if (sections.length === 0) {
      throw new NotFoundException('No sections found for this application');
    }

    // Combine all sections into one document
    let document = '';

    for (const section of sections) {
      document += `# ${section.section_name}\n\n`;
      document += `${section.content}\n\n`;
      document += `---\n\n`;
    }

    return document;
  }
}
