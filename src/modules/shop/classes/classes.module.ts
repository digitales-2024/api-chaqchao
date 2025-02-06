import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClassScheduleModule } from 'src/modules/admin/class-schedule/class-schedule.module';
import { ClassRegistrationModule } from 'src/modules/admin/class-registration/class-registration.module';
import { ClassLanguageModule } from 'src/modules/admin/class-language/class-language.module';
import { ClassPriceModule } from 'src/modules/admin/class-price/class-price.module';
import { AdminGateway } from 'src/modules/admin/admin.gateway';
import { ClassesAdminModule } from 'src/modules/admin/classes-admin/classes-admin.module';
import { ClassesAdminService } from 'src/modules/admin/classes-admin/classes-admin.service';

@Module({
  controllers: [ClassesController],
  providers: [ClassesService, ClassesAdminService, AdminGateway],
  imports: [
    PrismaModule,
    ClassScheduleModule,
    ClassRegistrationModule,
    ClassLanguageModule,
    ClassPriceModule,
    ClassesAdminModule
  ]
})
export class ClassesModule {}
