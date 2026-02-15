import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const userPermissions: string[] = user.permissions;

    // Check if user has wildcard permission
    if (userPermissions.includes('*')) {
      return true;
    }

    // Check if user has required permissions
    const hasPermission = requiredPermissions.every((permission) => {
      // Check exact match
      if (userPermissions.includes(permission)) {
        return true;
      }

      // Check wildcard match (e.g., 'applications:*' matches 'applications:read')
      const [resource, action] = permission.split(':');
      return userPermissions.includes(`${resource}:*`);
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
