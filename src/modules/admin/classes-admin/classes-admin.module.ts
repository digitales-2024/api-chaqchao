import { Module } from '@nestjs/common';
import { ClassesAdminService } from './classes-admin.service';
import { ClassesAdminController } from './classes-admin.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ClassesAdminController],
  providers: [ClassesAdminService],
  imports: [PrismaModule]
})
export class ClassesAdminModule {}
