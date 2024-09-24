import { forwardRef, Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClientModule } from '../client/client.module';

@Module({
  controllers: [CartController],
  providers: [CartService],
  imports: [PrismaModule, forwardRef(() => ClientModule)],
  exports: [CartService]
})
export class CartModule {}
