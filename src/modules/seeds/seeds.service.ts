import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { rolSuperAdminSeed, superAdminSeed } from './data/superadmin.seed';
import { handleException } from 'src/utils';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateSuperAdmin() {
    try {
      await this.prisma.$transaction(async (prisma) => {
        const { password } = superAdminSeed;

        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdminExists = await prisma.user.findFirst({
          where: {
            email: superAdminSeed.email
          }
        });

        if (superAdminExists) {
          throw new BadRequestException('Super admin already exists');
        }

        const superAdmin = await prisma.user.create({
          data: {
            ...superAdminSeed,
            password: hashedPassword
          }
        });

        await prisma.user.update({
          where: { id: superAdmin.id },
          data: {
            createdBy: superAdmin.id,
            updatedBy: superAdmin.id
          }
        });

        const rolSuperAdmin = await prisma.rol.create({
          data: { ...rolSuperAdminSeed, createdBy: superAdmin.id, updatedBy: superAdmin.id }
        });

        await prisma.userRol.create({
          data: {
            userId: superAdmin.id,
            rolId: rolSuperAdmin.id,
            createdBy: superAdmin.id,
            updatedBy: superAdmin.id
          }
        });
      });
      return {
        message: 'Super admin created successfully',
        statusCode: HttpStatus.CREATED,
        data: { email: superAdminSeed.email }
      };
    } catch (error) {
      this.logger.error(`Error generating super admin ${superAdminSeed.email}`, error.stack);
      handleException(error, 'Error generating super admin');
    }
  }
}
