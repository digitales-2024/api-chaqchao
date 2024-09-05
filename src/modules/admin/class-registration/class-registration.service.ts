import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateClassRegistrationDto } from './dto/create-class-registration.dto';
import { UpdateClassRegistrationDto } from './dto/update-class-registration.dto';
import { ClassRegistrationData, HttpResponse, UserData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { BusinessConfigService } from '../business-config/business-config.service';
import { AuditActionType } from '@prisma/client';
import { handleException } from 'src/utils';

@Injectable()
export class ClassRegistrationService {
  private readonly logger = new Logger(ClassRegistrationService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessConfigService: BusinessConfigService
  ) {}

  private validateIntervals(
    closeBeforeStartInterval?: number,
    finalRegistrationCloseInterval?: number
  ): void {
    if (closeBeforeStartInterval && closeBeforeStartInterval > 300) {
      throw new BadRequestException('closeBeforeStartInterval cannot be greater than 300');
    }
    if (finalRegistrationCloseInterval && finalRegistrationCloseInterval > 300) {
      throw new BadRequestException('finalRegistrationCloseInterval cannot be greater than 300');
    }
  }

  /**
   * Crear un class registration
   * @param createClassRegistrationDto Data para crear un class registration
   * @param user Usuario que crea el class registration
   * @returns ClassRegistration creado
   */
  async create(
    createClassRegistrationDto: CreateClassRegistrationDto,
    user: UserData
  ): Promise<HttpResponse<ClassRegistrationData>> {
    const { businessId, closeBeforeStartInterval, finalRegistrationCloseInterval } =
      createClassRegistrationDto;
    // Validar los intervalos
    this.validateIntervals(closeBeforeStartInterval, finalRegistrationCloseInterval);
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el businessId
        const businessConfigDB = await this.businessConfigService.findOne(businessId);
        if (!businessConfigDB) {
          throw new NotFoundException('Business config not found');
        }

        // Crear el registro de class registration
        const newClassRegistration = await prisma.classRegistrationConfig.create({
          data: {
            closeBeforeStartInterval,
            finalRegistrationCloseInterval,
            businessId
          }
        });

        // Registrar la auditoría de la creación
        await prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: newClassRegistration.id,
            entityType: 'classRegistrationConfig',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.CREATED,
          message: 'Class registration created',
          data: {
            id: newClassRegistration.id,
            closeBeforeStartInterval: newClassRegistration.closeBeforeStartInterval,
            finalRegistrationCloseInterval: newClassRegistration.finalRegistrationCloseInterval
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error creating class registration: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error creating class registration');
    }
  }

  /**
   * Mostar todos los class registration
   * @returns Todos los class registration
   */
  async findAll(): Promise<ClassRegistrationData[]> {
    try {
      const classRegistrations = await this.prisma.classRegistrationConfig.findMany({
        select: {
          id: true,
          closeBeforeStartInterval: true,
          finalRegistrationCloseInterval: true
        }
      });

      return classRegistrations.map((classRegistration) => ({
        id: classRegistration.id,
        closeBeforeStartInterval: classRegistration.closeBeforeStartInterval,
        finalRegistrationCloseInterval: classRegistration.finalRegistrationCloseInterval
      })) as ClassRegistrationData[];
    } catch (error) {
      this.logger.error(`Error fetching class language: ${error.message}`, error.stack);
      throw new BadRequestException('Error fetching class language');
    }
  }

  /**
   * Obtener un class registration por Id
   * @param id Id del class registration
   * @returns Class registration
   */
  async findOne(id: string): Promise<ClassRegistrationData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get class registration');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get class registration');
    }
  }

  /**
   * Obtener un class registration por Id
   * @param id Id del class registration
   * @returns Class registration
   */
  async findById(id: string) {
    const classRegistration = await this.prisma.classRegistrationConfig.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        closeBeforeStartInterval: true,
        finalRegistrationCloseInterval: true
      }
    });

    // Validar si existe el class registration
    if (!classRegistration) {
      throw new BadRequestException('Class registration not found');
    }

    return {
      id: classRegistration.id,
      closeBeforeStartInterval: classRegistration.closeBeforeStartInterval,
      finalRegistrationCloseInterval: classRegistration.finalRegistrationCloseInterval
    };
  }

  /**
   * Actualizar un class registration
   * @param id Id del class registration
   * @param updateClassRegistrationDto Data para actualizar el class registration
   * @param user Usuario que actualiza el class registration
   * @returns Class registration actualizado
   */
  async update(
    id: string,
    updateClassRegistrationDto: UpdateClassRegistrationDto,
    user: UserData
  ): Promise<HttpResponse<ClassRegistrationData>> {
    const { closeBeforeStartInterval, finalRegistrationCloseInterval } = updateClassRegistrationDto;

    // Validar los intervalos
    this.validateIntervals(closeBeforeStartInterval, finalRegistrationCloseInterval);

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el class registration
        const classRegistrationDB = await this.findById(id);

        // Verificar si hay cambios
        const hasChanges =
          (closeBeforeStartInterval !== undefined &&
            classRegistrationDB.closeBeforeStartInterval !== closeBeforeStartInterval) ||
          (finalRegistrationCloseInterval !== undefined &&
            classRegistrationDB.finalRegistrationCloseInterval !== finalRegistrationCloseInterval);

        if (
          !hasChanges ||
          (closeBeforeStartInterval === undefined && finalRegistrationCloseInterval === undefined)
        ) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Class registration updated',
            data: {
              id: classRegistrationDB.id,
              closeBeforeStartInterval: classRegistrationDB.closeBeforeStartInterval,
              finalRegistrationCloseInterval: classRegistrationDB.finalRegistrationCloseInterval
            }
          };
        }

        // Actualizar el class registration
        const updatedClassRegistration = await prisma.classRegistrationConfig.update({
          where: {
            id
          },
          data: {
            ...(closeBeforeStartInterval !== undefined && { closeBeforeStartInterval }),
            ...(finalRegistrationCloseInterval !== undefined && { finalRegistrationCloseInterval })
          }
        });

        // Registrar la auditoría de la actualización
        await prisma.audit.create({
          data: {
            action: AuditActionType.UPDATE,
            entityId: updatedClassRegistration.id,
            entityType: 'classRegistrationConfig',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Class registration updated',
          data: {
            id: updatedClassRegistration.id,
            closeBeforeStartInterval: updatedClassRegistration.closeBeforeStartInterval,
            finalRegistrationCloseInterval: updatedClassRegistration.finalRegistrationCloseInterval
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error updating class registration: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error updating class registration');
    }
  }

  remove(id: number) {
    return `This action removes a #${id} classRegistration`;
  }
}
