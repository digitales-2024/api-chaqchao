// client-jwt.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ClientService } from '../../client/client.service';

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(Strategy, 'client-jwt') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    });
  }

  /**
   * Valida el token del cliente
   * @param payload Información del token
   * @returns Cliente autenticado
   */
  async validate(payload: { id: string }): Promise<ClientData> {
    const { id } = payload;
    const client = await this.clientService.findById(id);

    if (!client) {
      throw new UnauthorizedException('Client is not active or does not exist');
    }

    const { id: clientId, name, email } = client;
    return { id: clientId, name, email };
  }
}
