import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/database/database.service';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  permissions: string[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private rolesService: RolesService,
    private db: DatabaseService,
  ) {}

  async validateGoogleUser(profile: any): Promise<any> {
    const { email, name, picture } = profile;

    // Find or create user
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Check if email domain matches organization
      const domain = email.split('@')[1];
      const organization = await this.db
        .db('organizations')
        .where({ domain })
        .first();

      if (!organization) {
        throw new UnauthorizedException(
          'Your email domain is not authorized for this application',
        );
      }

      // Create new user
      user = await this.usersService.create({
        organization_id: organization.id,
        email,
        full_name: name,
        avatar_url: picture,
        is_active: true,
      });

      // Assign default role (Grant Writer)
      const writerRole = await this.rolesService.findByName('Grant Writer');
      if (writerRole) {
        await this.rolesService.assignRole(user.id, writerRole.id);
      }
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return user;
  }

  async login(user: any): Promise<AuthTokens> {
    const permissions = await this.rolesService.getUserPermissions(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organization_id,
      permissions,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRATION') || '7d',
    });

    return {
      access_token,
      refresh_token,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateToken(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      organization_id: user.organization_id,
      permissions: payload.permissions,
    };
  }
}
