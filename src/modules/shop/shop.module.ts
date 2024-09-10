import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [AuthModule, PrismaModule, ClientModule]
})
export class ShopModule {}
