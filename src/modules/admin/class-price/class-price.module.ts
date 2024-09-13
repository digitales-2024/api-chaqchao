import { Module } from '@nestjs/common';
import { ClassPriceService } from './class-price.service';
import { ClassPriceController } from './class-price.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BusinessConfigModule } from '../business-config/business-config.module';

@Module({
  controllers: [ClassPriceController],
  providers: [ClassPriceService],
  imports: [PrismaModule, BusinessConfigModule]
})
export class ClassPriceModule {}
