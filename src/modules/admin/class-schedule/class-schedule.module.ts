import { Module } from '@nestjs/common';
import { ClassScheduleService } from './class-schedule.service';
import { ClassScheduleController } from './class-schedule.controller';
import { BusinessConfigModule } from '../business-config/business-config.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ClassScheduleController],
  providers: [ClassScheduleService],
  imports: [PrismaModule, BusinessConfigModule],
  exports: [ClassScheduleService]
})
export class ClassScheduleModule {}
