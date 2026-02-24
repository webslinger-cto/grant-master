import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CitationsService } from './citations.service';
import { CreateCitationDto } from './dto/create-citation.dto';
import { UpdateCitationDto } from './dto/update-citation.dto';
import { BatchImportDto } from './dto/batch-import.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('citations')
@UseGuards(JwtAuthGuard)
export class CitationsController {
  constructor(private readonly citationsService: CitationsService) {}

  /**
   * Create a new citation
   * POST /citations
   */
  @Public() // Temporarily public for testing
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateCitationDto) {
    const userId = req.user?.id || '20000001-0000-0000-0000-000000000001';
    return this.citationsService.create(userId, dto);
  }

  /**
   * Get all citations for an application
   * GET /citations?applicationId=xxx
   */
  @Public() // Temporarily public for testing
  @Get()
  async getByApplication(@Query('applicationId') applicationId: string) {
    return this.citationsService.getByApplicationId(applicationId);
  }

  /**
   * Search citations
   * GET /citations/search?applicationId=xxx&q=query
   */
  @Public() // Temporarily public for testing
  @Get('search')
  async search(
    @Query('applicationId') applicationId: string,
    @Query('q') query: string,
  ) {
    return this.citationsService.search(applicationId, query);
  }

  /**
   * Generate bibliography for an application
   * GET /citations/bibliography?applicationId=xxx&format=nih
   */
  @Public() // Temporarily public for testing
  @Get('bibliography')
  async generateBibliography(
    @Query('applicationId') applicationId: string,
    @Query('format') format: 'nih' | 'apa' | 'mla' | 'chicago' = 'nih',
  ) {
    return this.citationsService.generateBibliography(applicationId, format);
  }

  /**
   * Get a specific citation by ID
   * GET /citations/:id
   */
  @Public() // Temporarily public for testing
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.citationsService.getById(id);
  }

  /**
   * Update a citation
   * PUT /citations/:id
   */
  @Public() // Temporarily public for testing
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateCitationDto,
  ) {
    const userId = req.user?.id || '20000001-0000-0000-0000-000000000001';
    return this.citationsService.update(id, userId, dto);
  }

  /**
   * Delete a citation
   * DELETE /citations/:id
   */
  @Public() // Temporarily public for testing
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.citationsService.delete(id);
  }

  /**
   * Batch import citations
   * POST /citations/batch-import
   */
  @Public() // Temporarily public for testing
  @Post('batch-import')
  async batchImport(@Request() req, @Body() dto: BatchImportDto) {
    const userId = req.user?.id || '20000001-0000-0000-0000-000000000001';
    return this.citationsService.batchImport(userId, dto);
  }

  /**
   * Track citation usage
   * POST /citations/:id/track-usage
   */
  @Public() // Temporarily public for testing
  @Post(':id/track-usage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackUsage(@Param('id') id: string) {
    await this.citationsService.trackUsage(id);
  }
}
