import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PickupCodeService } from './pickup-code/pickup-code.service';
import { AdminGateway } from 'src/modules/admin/admin.gateway';

@Module({
  controllers: [CartController],
  providers: [CartService, PickupCodeService, AdminGateway],
  imports: [PrismaModule],
  exports: [CartService]
})
export class CartModule {}
