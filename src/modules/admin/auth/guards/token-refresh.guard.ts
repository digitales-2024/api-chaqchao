import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class TokenRefresh implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // const response = context.switchToHttp().getResponse();

    const accessToken = request.cookies.access_token;

    if (!accessToken) {
      throw new BadRequestException('No access token provided');
    }

    try {
      const payload = this.jwtService.verify(accessToken);

      request.user = payload;
      return true;
    } catch (error) {
      throw new BadRequestException('Token invalid');
    }
  }
}
