import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('pipeline')
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  /** GET /pipeline/applications */
  @Public()
  @Get('applications')
  async findAll() {
    return this.pipelineService.findAll();
  }

  /** POST /pipeline/applications */
  @Public()
  @Post('applications')
  async create(@Body() dto: Record<string, any>) {
    return this.pipelineService.create(dto as any);
  }

  /** GET /pipeline/applications/:id */
  @Public()
  @Get('applications/:id')
  async findById(@Param('id') id: string) {
    return this.pipelineService.findById(id);
  }

  /** PUT /pipeline/applications/:id */
  @Public()
  @Put('applications/:id')
  async update(@Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.pipelineService.update(id, dto);
  }
}
