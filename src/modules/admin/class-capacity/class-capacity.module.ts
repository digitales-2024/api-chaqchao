import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClassCapacityController } from './class-capacity.controller';
import { ClassCapacityService } from './class-capacity.service';

@Module({
  controllers: [ClassCapacityController],
  providers: [ClassCapacityService],
  imports: [PrismaModule],
  exports: [ClassCapacityService]
})
export class ClassCapacityModule {}
