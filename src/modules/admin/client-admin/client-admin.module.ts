import { Module } from '@nestjs/common';
import { ClientAdminService } from './client-admin.service';
import { ClientAdminController } from './client-admin.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ClientAdminController],
  providers: [ClientAdminService],
  imports: [PrismaModule]
})
export class ClientAdminModule {}
