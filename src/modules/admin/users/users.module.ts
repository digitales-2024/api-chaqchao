import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule, RoleModule],
  exports: [UsersService]
})
export class UsersModule {}
