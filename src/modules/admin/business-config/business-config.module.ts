import { Module } from '@nestjs/common';
import { BusinessConfigService } from './business-config.service';
import { BusinessConfigController } from './business-config.controller';

@Module({
  controllers: [BusinessConfigController],
  providers: [BusinessConfigService]
})
export class BusinessConfigModule {}
