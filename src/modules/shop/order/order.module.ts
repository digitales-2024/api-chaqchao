import { forwardRef, Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CartModule } from '../cart/cart.module';
import { OrdersService } from 'src/modules/admin/orders/orders.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrdersService],
  imports: [PrismaModule, forwardRef(() => CartModule)],
  exports: [OrderService]
})
export class OrderModule {}
