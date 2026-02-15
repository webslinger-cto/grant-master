import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class RolesService {
  constructor(private db: DatabaseService) {}

  async findAll() {
    return this.db.db('roles').orderBy('name', 'asc');
  }

  async findById(id: string) {
    return this.db.db('roles').where({ id }).first();
  }

  async findByName(name: string) {
    return this.db.db('roles').where({ name }).first();
  }

  async getUserRoles(userId: string) {
    return this.db
      .db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .select('roles.*');
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const roles = await this.getUserRoles(userId);

    const permissionsSet = new Set<string>();

    roles.forEach((role) => {
      const permissions = role.permissions || [];
      permissions.forEach((permission: string) => {
        permissionsSet.add(permission);
      });
    });

    return Array.from(permissionsSet);
  }

  async assignRole(userId: string, roleId: string) {
    await this.db.db('user_roles').insert({ user_id: userId, role_id: roleId });
  }

  async removeRole(userId: string, roleId: string) {
    await this.db
      .db('user_roles')
      .where({ user_id: userId, role_id: roleId })
      .delete();
  }
}
