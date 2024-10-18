import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './utils/google-strategy.utils';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientJwtStrategy } from './utils/client-jwt.utils';
import { ClientModule } from '../client/client.module';
import { PassportModule } from '@nestjs/passport';
import { ClientRefreshTokenStrategy } from './utils/client-refresh-token.utils';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, ClientJwtStrategy, ClientRefreshTokenStrategy],
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'client-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') }
      })
    }),
    ClientModule
  ]
})
export class AuthModule {}
