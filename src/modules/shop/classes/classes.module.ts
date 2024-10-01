import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClassScheduleModule } from 'src/modules/admin/class-schedule/class-schedule.module';
import { ClassRegistrationModule } from 'src/modules/admin/class-registration/class-registration.module';
import { ClassLanguageModule } from 'src/modules/admin/class-language/class-language.module';

@Module({
  controllers: [ClassesController],
  providers: [ClassesService],
  imports: [PrismaModule, ClassScheduleModule, ClassRegistrationModule, ClassLanguageModule]
})
export class ClassesModule {}
