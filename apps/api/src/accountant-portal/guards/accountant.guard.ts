import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AccountantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Utilisateur non authentifié');
        }

        if (user.role !== 'ACCOUNTANT') {
            throw new ForbiddenException('Accès réservé aux experts comptables');
        }

        return true;
    }
}
