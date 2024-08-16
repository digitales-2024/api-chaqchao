import { Module } from '@nestjs/common';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [RolController],
  providers: [RolService],
  imports: [PrismaModule],
  exports: [RolService]
})
export class RolModule {}
