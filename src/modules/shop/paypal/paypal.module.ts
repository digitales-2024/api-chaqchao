import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService],
  imports: [PrismaModule, HttpModule, ConfigModule]
})
export class PaypalModule {}
