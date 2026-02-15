import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:read')
  async findAll(@Query() filters: any, @CurrentUser() user: any) {
    // Filter by user's organization
    return this.usersService.findAll({
      ...filters,
      organization_id: user.organization_id,
    });
  }

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('me/notification-preferences')
  async updateNotificationPreferences(
    @CurrentUser('id') userId: string,
    @Body() preferences: any,
  ) {
    return this.usersService.updateNotificationPreferences(userId, preferences);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @RequirePermissions('users:write')
  async update(@Param('id') id: string, @Body() userData: any) {
    return this.usersService.update(id, userData);
  }
}
