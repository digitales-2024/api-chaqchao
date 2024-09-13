import { Module } from '@nestjs/common';
import { BusinessConfigService } from './business-config.service';
import { BusinessConfigController } from './business-config.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [BusinessConfigController],
  providers: [BusinessConfigService],
  imports: [PrismaModule],
  exports: [BusinessConfigService]
})
export class BusinessConfigModule {}
