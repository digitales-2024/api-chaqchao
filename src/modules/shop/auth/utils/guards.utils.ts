import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = (await super.canActivate(context)) as boolean;

    const request = context.switchToHttp().getRequest();
    console.log('User from GoogleAuthGuard:', request.user);

    return canActivate;
  }
}
