import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from '../../admin/claims/claims.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService, PrismaService]
})
export class ClaimsModule {}
