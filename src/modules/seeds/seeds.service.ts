import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { rolSuperAdminSeed, superAdminSeed } from './data/superadmin.seed';
import { handleException } from 'src/utils';

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateSuperAdmin() {
    try {
      await this.prisma.$transaction(async (prisma) => {
        const superAdmin = await prisma.user.create({
          data: {
            ...superAdminSeed,
            createdBy: 'system',
            updatedBy: 'system'
          }
        });
        const rolSuperAdmin = await prisma.rol.create({
          data: rolSuperAdminSeed
        });

        await prisma.userRol.create({
          data: {
            userId: superAdmin.id,
            rolId: rolSuperAdmin.id
          }
        });
      });
      return {
        message: 'Super admin created successfully',
        statusCode: HttpStatus.CREATED,
        data: { email: superAdminSeed.email }
      };
    } catch (error) {
      this.logger.error('Error generating super admin', error.stack);
      handleException(error, 'Error generating super admin');
    }
  }
}
