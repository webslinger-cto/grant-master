import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Public()
  @Get()
  async findAll() {
    return this.projectsService.findAll();
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Public()
  @Post()
  async create(@Body() body: { name: string; description?: string; context?: Record<string, any> }) {
    return this.projectsService.create(body);
  }

  @Public()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; context?: Record<string, any> },
  ) {
    return this.projectsService.update(id, body);
  }

  @Public()
  @Post(':id/clone')
  @HttpCode(HttpStatus.OK)
  async clone(
    @Param('id') id: string,
    @Body() body: { name: string; context?: Record<string, any> },
  ) {
    return this.projectsService.clone(id, body);
  }

  @Public()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
