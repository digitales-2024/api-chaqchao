import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CartModule } from '../cart/cart.module';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [PrismaModule, CartModule],
  exports: [OrderService]
})
export class OrderModule {}
