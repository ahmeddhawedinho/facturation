
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const { user } = context.switchToHttp().getRequest();

        // Si l'utilisateur est ADMIN (le boss), il a toutes les permissions par défaut
        if (user?.role === Role.ADMIN) {
            return true;
        }

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        if (!user || !user.permissions) {
            return false;
        }

        // Vérifier si l'utilisateur a au moins une des permissions requises (OR logic)
        // Ou toutes les permissions (AND logic) - Utilisons OR pour plus de flexibilité par route
        return requiredPermissions.some((permission) => user.permissions?.includes(permission));
    }
}
