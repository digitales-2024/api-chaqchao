import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BusinessConfigModule } from '../business-config/business-config.module';

@Module({
  providers: [ClassesService],
  imports: [PrismaModule, BusinessConfigModule]
})
export class ClassesModule {}
