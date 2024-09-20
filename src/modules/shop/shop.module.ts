import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClientModule } from './client/client.module';
import { CartModule } from './cart/cart.module';
import { CartItemModule } from './cart-item/cart-item.module';

@Module({
  imports: [AuthModule, PrismaModule, ClientModule, CartModule, CartItemModule]
})
export class ShopModule {}
