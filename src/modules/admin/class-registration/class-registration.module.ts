import { Module } from '@nestjs/common';
import { ClassRegistrationService } from './class-registration.service';
import { ClassRegistrationController } from './class-registration.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BusinessConfigModule } from '../business-config/business-config.module';

@Module({
  controllers: [ClassRegistrationController],
  providers: [ClassRegistrationService],
  imports: [PrismaModule, BusinessConfigModule]
})
export class ClassRegistrationModule {}
