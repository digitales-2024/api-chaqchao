import { Module } from '@nestjs/common';
import { AdminGateway } from 'src/modules/admin/admin.gateway';
import { ClassCapacityModule } from 'src/modules/admin/class-capacity/class-capacity.module';
import { ClassLanguageModule } from 'src/modules/admin/class-language/class-language.module';
import { ClassPriceModule } from 'src/modules/admin/class-price/class-price.module';
import { ClassRegistrationModule } from 'src/modules/admin/class-registration/class-registration.module';
import { ClassScheduleModule } from 'src/modules/admin/class-schedule/class-schedule.module';
import { ClassesAdminModule } from 'src/modules/admin/classes-admin/classes-admin.module';
import { ClassesAdminService } from 'src/modules/admin/classes-admin/classes-admin.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

@Module({
  controllers: [ClassesController],
  providers: [ClassesService, ClassesAdminService, AdminGateway],
  imports: [
    PrismaModule,
    ClassScheduleModule,
    ClassRegistrationModule,
    ClassLanguageModule,
    ClassPriceModule,
    ClassesAdminModule,
    ClassCapacityModule
  ]
})
export class ClassesModule {}
