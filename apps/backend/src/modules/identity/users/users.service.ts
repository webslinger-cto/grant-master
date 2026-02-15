import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    return this.db.db('users').where({ id }).first();
  }

  async findByEmail(email: string) {
    return this.db.db('users').where({ email }).first();
  }

  async create(userData: any) {
    const [user] = await this.db.db('users').insert(userData).returning('*');
    return user;
  }

  async update(id: string, userData: any) {
    const [user] = await this.db
      .db('users')
      .where({ id })
      .update({ ...userData, updated_at: new Date() })
      .returning('*');
    return user;
  }

  async updateLastLogin(id: string) {
    await this.db
      .db('users')
      .where({ id })
      .update({ last_login_at: new Date() });
  }

  async findAll(filters: any = {}) {
    let query = this.db.db('users');

    if (filters.organization_id) {
      query = query.where({ organization_id: filters.organization_id });
    }

    if (filters.is_active !== undefined) {
      query = query.where({ is_active: filters.is_active });
    }

    return query.orderBy('full_name', 'asc');
  }

  async updateNotificationPreferences(id: string, preferences: any) {
    return this.update(id, { notification_preferences: preferences });
  }
}
