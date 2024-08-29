import { Injectable, Logger } from '@nestjs/common';
import { CreateBusinessConfigDto } from './dto/create-business-config.dto';
import { UpdateBusinessConfigDto } from './dto/update-business-config.dto';
import { BusinessConfigData, UserData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditActionType } from '@prisma/client';

@Injectable()
export class BusinessConfigService {
  private readonly logger = new Logger(BusinessConfigService.name);
  constructor(private readonly prisma: PrismaService) {}

  async createUpdate(
    createBusinessConfigDto: CreateBusinessConfigDto,
    user: UserData
  ): Promise<BusinessConfigData> {
    const { businessName, contactNumber, email, address } = createBusinessConfigDto;

    // Verificar si ya existe un registro en la tabla BusinessConfig
    const existingConfig = await this.prisma.businessConfig.findFirst();

    if (existingConfig) {
      // Si existe, realizar una actualización
      const updatedConfig = await this.prisma.businessConfig.update({
        where: { id: existingConfig.id },
        data: {
          businessName,
          contactNumber,
          email,
          address
        }
      });

      // Registrar la auditoría de la actualización
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.UPDATE,
          entityId: updatedConfig.id,
          entityType: 'businessConfig',
          performedById: user.id
        }
      });

      return {
        id: updatedConfig.id,
        businessName: updatedConfig.businessName,
        contactNumber: updatedConfig.contactNumber,
        email: updatedConfig.email,
        address: updatedConfig.address
      };
    } else {
      // Si no existe, crear un nuevo registro
      const newConfig = await this.prisma.businessConfig.create({
        data: {
          businessName,
          contactNumber,
          email,
          address
        }
      });

      // Registrar la auditoría de la creación
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.CREATE,
          entityId: newConfig.id,
          entityType: 'businessConfig',
          performedById: user.id
        }
      });

      return {
        id: newConfig.id,
        businessName: newConfig.businessName,
        contactNumber: newConfig.contactNumber,
        email: newConfig.email,
        address: newConfig.address
      };
    }
  }

  async update(id: string, updateBusinessConfigDto: UpdateBusinessConfigDto) {
    return `This action updates a #${id} ${updateBusinessConfigDto} businessConfig`;
  }
  findAll() {
    return `This action returns all businessConfig`;
  }

  findOne(id: number) {
    return `This action returns a #${id} businessConfig`;
  }

  remove(id: number) {
    return `This action removes a #${id} businessConfig`;
  }
}
