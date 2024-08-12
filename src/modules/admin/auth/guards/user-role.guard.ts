import { Reflector } from '@nestjs/core';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { META_ROLES } from '../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[] = this.reflector.get<string[]>(META_ROLES, context.getHandler());

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!validRoles) return true;
    if (validRoles.length === 0) return true;

    for (const role of validRoles) {
      if (user.role === role) return true;
    }

    if (!user) throw new BadRequestException('User not found');

    throw new ForbiddenException('You do not have permission to access this resource');
  }
}
