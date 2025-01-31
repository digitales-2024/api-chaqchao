import { Module } from '@nestjs/common';
import { BusinessHoursService } from './business-hours.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminGateway } from 'src/modules/admin/admin.gateway';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  providers: [BusinessHoursService, AdminGateway],
  imports: [ScheduleModule.forRoot(), PrismaModule],
  exports: [BusinessHoursService]
})
export class BusinessHoursModule {}
