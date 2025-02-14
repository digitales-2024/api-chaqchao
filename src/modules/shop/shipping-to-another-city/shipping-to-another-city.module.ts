import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShippingController } from './shipping-to-another-city.controller';
import { ShippingService } from './shipping-to-another-city.service';

@Module({
  imports: [],
  providers: [ShippingService, PrismaService],
  controllers: [ShippingController]
})
export class ShippingToAnotherCityModule {}
