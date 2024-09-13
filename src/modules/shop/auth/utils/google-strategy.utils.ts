import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { ClientGoogleData } from 'src/interfaces/client.interface';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_REDIRECT_URI'),
      scope: ['openid', 'email', 'profile'],
      passReqToCallback: true
    });
  }

  /**
   * Valida la información del usuario recibida de Google
   * @param req Objeto de solicitud
   * @param accessToken Token de acceso
   * @param refreshToken Token de refresco
   * @param profile Información del usuario
   * @returns Cliente autenticado
   */
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile
  ): Promise<any> {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const token = refreshToken;

    // Crear la data del cliente incluyendo el refreshToken
    const clientData: ClientGoogleData = { name, email, token };

    // Validar el usuario usando AuthService y retornar el cliente
    return await this.authService.validateUserGoogle(clientData, req.res);
  }
}
