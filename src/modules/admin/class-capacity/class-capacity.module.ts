import { Module } from '@nestjs/common';
import { ClassCapacityService } from './class-capacity.service';
import { ClassCapacityController } from './class-capacity.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ClassCapacityController],
  providers: [ClassCapacityService],
  imports: [PrismaModule]
})
export class ClassCapacityModule {}
