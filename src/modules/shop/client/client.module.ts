import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ClientController],
  providers: [ClientService],
  imports: [PrismaModule],
  exports: [ClientService]
})
export class ClientModule {}
