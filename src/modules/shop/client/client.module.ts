import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrderModule } from '../order/order.module';

@Module({
  controllers: [ClientController],
  providers: [ClientService],
  imports: [PrismaModule, OrderModule],
  exports: [ClientService]
})
export class ClientModule {}
