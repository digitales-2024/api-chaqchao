import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClassScheduleModule } from 'src/modules/admin/class-schedule/class-schedule.module';

@Module({
  controllers: [ClassesController],
  providers: [ClassesService],
  imports: [PrismaModule, ClassScheduleModule]
})
export class ClassesModule {}
