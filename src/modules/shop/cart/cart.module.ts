import { forwardRef, Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClientModule } from '../client/client.module';
import { PickupCodeService } from './pickup-code/pickup-code.service';

@Module({
  controllers: [CartController],
  providers: [CartService, PickupCodeService],
  imports: [PrismaModule, forwardRef(() => ClientModule)],
  exports: [CartService]
})
export class CartModule {}
