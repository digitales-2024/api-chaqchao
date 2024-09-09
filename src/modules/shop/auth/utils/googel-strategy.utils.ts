import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { ClientGoogleData } from 'src/interfaces/client.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: '356142009565-ulu3ffrsmocaib7uiuerqr2ulk6kbb65.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'http://localhost:3000/api/v1/auth/client/google/redirect',
      scope: ['openid', 'email', 'profile']
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<any> {
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('Profile:', profile);

    const email = profile.emails[0].value;
    const name = profile.displayName;
    const token = refreshToken; // Usar el refreshToken recibido de Google

    // Crear la data del cliente incluyendo el refreshToken
    const clientData: ClientGoogleData = { name, email, token };

    // Validar el usuario usando AuthService y retornar el cliente
    return await this.authService.validateUser(clientData);
  }
}
