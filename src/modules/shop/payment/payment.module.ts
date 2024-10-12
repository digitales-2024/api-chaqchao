import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  imports: [PrismaModule, HttpModule, ConfigModule],
  exports: [PaymentService]
})
export class PaymentModule {}
