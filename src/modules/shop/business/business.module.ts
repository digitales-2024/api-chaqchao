import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { BusinessHoursModule } from 'src/modules/admin/business-hours/business-hours.module';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService],
  imports: [BusinessHoursModule]
})
export class BusinessModule {}
