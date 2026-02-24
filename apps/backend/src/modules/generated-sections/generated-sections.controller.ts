import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GeneratedSectionsService } from './generated-sections.service';
import { UpdateSectionDto } from './dto/update-section.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('generated-sections')
@UseGuards(JwtAuthGuard)
export class GeneratedSectionsController {
  constructor(private readonly sectionsService: GeneratedSectionsService) {}

  /**
   * Get all generated sections for an application
   * GET /generated-sections?applicationId=xxx
   */
  @Public() // Temporarily public for testing
  @Get()
  async getByApplication(@Query('applicationId') applicationId: string) {
    return this.sectionsService.getByApplicationId(applicationId);
  }

  /**
   * Get a specific section by ID
   * GET /generated-sections/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.sectionsService.getById(id);
  }

  /**
   * Get version history for a section
   * GET /generated-sections/:applicationId/history/:sectionName
   */
  @Get(':applicationId/history/:sectionName')
  async getVersionHistory(
    @Param('applicationId') applicationId: string,
    @Param('sectionName') sectionName: string,
  ) {
    return this.sectionsService.getVersionHistory(applicationId, sectionName);
  }

  /**
   * Update a section (content, status, review notes)
   * PUT /generated-sections/:id
   */
  @Put(':id')
  async update(@Param('id') id: string, @Request() req, @Body() dto: UpdateSectionDto) {
    const userId = req.user.id;
    return this.sectionsService.update(id, userId, dto);
  }

  /**
   * Delete a section
   * DELETE /generated-sections/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.sectionsService.delete(id);
  }

  /**
   * Set a specific version as current
   * PUT /generated-sections/:id/set-current
   */
  @Put(':id/set-current')
  async setCurrentVersion(@Param('id') id: string) {
    return this.sectionsService.setCurrentVersion(id);
  }

  /**
   * Get available section templates
   * GET /generated-sections/templates?grantType=NIH_R01
   */
  @Public() // Temporarily public for testing
  @Get('meta/templates')
  async getTemplates(@Query('grantType') grantType?: string) {
    return this.sectionsService.getTemplates(grantType);
  }

  /**
   * Export all sections as a single document
   * GET /generated-sections/:applicationId/export
   */
  @Get(':applicationId/export')
  async exportApplication(@Param('applicationId') applicationId: string) {
    const document = await this.sectionsService.exportApplication(applicationId);
    return { document };
  }
}
