import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('client-jwt') {
  canActivate(context: ExecutionContext) {
    // Llama al método canActivate de AuthGuard
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalid or expired');
    }
    const request = context.switchToHttp().getRequest<Request>();
    request.user = user;
    return user;
  }
}
