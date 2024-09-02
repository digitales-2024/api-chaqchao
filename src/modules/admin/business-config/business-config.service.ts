import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateBusinessConfigDto } from './dto/create-business-config.dto';
import { BusinessConfigData, HttpResponse, UserData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditActionType } from '@prisma/client';
import { handleException } from 'src/utils';
import { UpdateBusinessConfigDto } from './dto/update-business-config.dto';

@Injectable()
export class BusinessConfigService {
  private readonly logger = new Logger(BusinessConfigService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un BusinessConfig
   * @param createBusinessConfigDto Data del BusinessConfig a crear
   * @param user Usuario que realiza la creación
   * @returns BusinessConfig creado
   */
  async create(
    createBusinessConfigDto: CreateBusinessConfigDto,
    user: UserData
  ): Promise<HttpResponse<BusinessConfigData>> {
    const { businessName, contactNumber, email, address } = createBusinessConfigDto;

    try {
      // Verificar si ya existe un registro en la tabla BusinessConfig
      const existingConfig = await this.prisma.businessConfig.findFirst();

      if (existingConfig) {
        throw new HttpException(
          {
            message: 'A business config already exists',
            error: 'Bad Request',
            statusCode: HttpStatus.BAD_REQUEST
          },
          HttpStatus.BAD_REQUEST
        );
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
          statusCode: HttpStatus.CREATED,
          message: 'Business config created successfully',
          data: {
            id: newConfig.id,
            businessName: newConfig.businessName,
            contactNumber: newConfig.contactNumber,
            email: newConfig.email,
            address: newConfig.address
          }
        };
      }
    } catch (error) {
      this.logger.error(`Error creating business config: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          message: 'Internal Server Error',
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Actualiza un BusinessConfig por id
   * @param id Id del BusinessConfig
   * @param updateBusinessConfigDto Data del BusinessConfig a actualizar
   * @param user Usuario que realiza la actualización
   * @returns BusinessConfig actualizado
   */
  async update(
    id: string,
    updateBusinessConfigDto: UpdateBusinessConfigDto,
    user: UserData
  ): Promise<HttpResponse<BusinessConfigData>> {
    const { businessName, contactNumber, email, address } = updateBusinessConfigDto;

    try {
      // Verificar si ya existe un registro en la tabla BusinessConfig con el id proporcionado
      const existingConfig = await this.prisma.businessConfig.findUnique({
        where: { id }
      });

      if (!existingConfig) {
        throw new NotFoundException('Business config not found');
      }

      // Verificar si hay cambios en los datos
      const hasChanges =
        (businessName !== undefined && businessName !== existingConfig.businessName) ||
        (contactNumber !== undefined && contactNumber !== existingConfig.contactNumber) ||
        (email !== undefined && email !== existingConfig.email) ||
        (address !== undefined && address !== existingConfig.address);

      if (!hasChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Business config updated successfully',
          data: {
            id: existingConfig.id,
            businessName: existingConfig.businessName,
            contactNumber: existingConfig.contactNumber,
            email: existingConfig.email,
            address: existingConfig.address
          }
        };
      }

      // Realizar una actualización
      const updatedConfig = await this.prisma.businessConfig.update({
        where: { id },
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
        statusCode: HttpStatus.OK,
        message: 'Business config updated successfully',
        data: {
          id: updatedConfig.id,
          businessName: updatedConfig.businessName,
          contactNumber: updatedConfig.contactNumber,
          email: updatedConfig.email,
          address: updatedConfig.address
        }
      };
    } catch (error) {
      this.logger.error(`Error updating business config: ${error.message}`, error.stack);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error updating business config');
    }
  }

  /**
   * Mostrar BusinessConfig por id
   * @param id Id del bsinessConfig
   * @returns BusinessConfig encontrado
   */
  async findOne(id: string): Promise<BusinessConfigData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get businessConfig');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get businessConfig');
    }
  }

  /**
   * Mostrar BusinessConfig por id
   * @param id Id del businessConfig
   * @returns Data del businessConfig
   */
  async findById(id: string): Promise<BusinessConfigData> {
    const businessConfigDB = await this.prisma.businessConfig.findFirst({
      where: { id },
      select: {
        id: true,
        businessName: true,
        contactNumber: true,
        email: true,
        address: true
      }
    });

    // Verificar si el businessConfig existe y está activo
    if (!businessConfigDB) {
      throw new BadRequestException('This business does not exist');
    }

    // Mapeo al tipo BusinessConfigData
    return {
      id: businessConfigDB.id,
      businessName: businessConfigDB.businessName,
      contactNumber: businessConfigDB.contactNumber,
      email: businessConfigDB.email,
      address: businessConfigDB.address
    };
  }

  remove(id: number) {
    return `This action removes a #${id} businessConfig`;
  }
}
