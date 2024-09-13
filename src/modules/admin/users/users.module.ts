import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RolModule } from '../rol/rol.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule, RolModule, AuditModule],
  exports: [UsersService]
})
export class UsersModule {}
