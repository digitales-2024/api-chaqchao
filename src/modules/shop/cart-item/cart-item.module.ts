import { Module } from '@nestjs/common';
import { CartItemController } from './cart-item-controller';
import { CartItemService } from './cart-item.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductsModule } from 'src/modules/admin/products/products.module';
import { CartModule } from '../cart/cart.module';

@Module({
  controllers: [CartItemController],
  providers: [CartItemService],
  imports: [PrismaModule, ProductsModule, CartModule],
  exports: [CartItemService]
})
export class CartItemModule {}
