import { Module } from '@nestjs/common';
import { BusinessHoursService } from './business-hours.service';
import { BusinessHoursController } from './business-hours.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BusinessConfigModule } from '../business-config/business-config.module';

@Module({
  controllers: [BusinessHoursController],
  providers: [BusinessHoursService],
  imports: [PrismaModule, BusinessConfigModule]
})
export class BusinessHoursModule {}
