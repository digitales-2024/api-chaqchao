import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClassCapacityModule } from '../class-capacity/class-capacity.module';
import { ClassPriceModule } from '../class-price/class-price.module';
import { ClassesAdminController } from './classes-admin.controller';
import { ClassesAdminService } from './classes-admin.service';

@Module({
  controllers: [ClassesAdminController],
  providers: [ClassesAdminService],
  imports: [PrismaModule, ClassCapacityModule, ClassPriceModule]
})
export class ClassesAdminModule {}
