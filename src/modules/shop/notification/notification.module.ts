import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { forwardRef, Module } from '@nestjs/common';
import { ClientModule } from '../client/client.module';
import { OrderModule } from '../order/order.module';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  imports: [PrismaModule, forwardRef(() => ClientModule), forwardRef(() => OrderModule)],
  exports: [NotificationService]
})
export class NotificationModule {}
