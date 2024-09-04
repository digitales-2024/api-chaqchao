import { Module } from '@nestjs/common';
import { ClassesConfigService } from './classes-config.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BusinessConfigModule } from '../business-config/business-config.module';
import { ClassesConfigController } from './classes-config.controller';

@Module({
  providers: [ClassesConfigService],
  imports: [PrismaModule, BusinessConfigModule],
  controllers: [ClassesConfigController]
})
export class ClassesConfigModule {}
