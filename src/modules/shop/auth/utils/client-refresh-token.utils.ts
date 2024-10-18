import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ClientService } from '../../client/client.service';
import { ClientJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class ClientRefreshTokenStrategy extends PassportStrategy(Strategy, 'client-jwt-refresh') {
  constructor(
    private readonly clientService: ClientService,
    configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies?.client_refresh_token; // Extraer el refresh token de la cookie HttpOnly
        }
      ]),
      secretOrKey: configService.get('JWT_REFRESH_SECRET'), // Secreto para validar el refresh token
      passReqToCallback: true // Permite acceder al request en el método validate
    });
  }

  async validate(req: Request, payload: ClientJwtPayload) {
    const refreshToken = req.cookies?.client_refresh_token; // Extraer el refresh token de la cookie
    // 1. Verificación: El refresh token existe
    if (!refreshToken) {
      throw new UnauthorizedException('Client Refresh token is missing');
    }

    console.log('payload', payload);

    // 2. Verificar que el usuario existe
    await this.clientService.findById(payload.id);

    // Devolvemos los datos del usuario y el token para que puedan ser utilizados en el servicio de autenticación
    return { ...payload, refreshToken };
  }
}
