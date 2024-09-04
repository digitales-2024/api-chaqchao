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

@Injectable()
export class ClassRegistrationService {
  private readonly logger = new Logger(ClassRegistrationService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessConfigService: BusinessConfigService
  ) {}

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
            entityType: 'classRegistration',
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

  findOne(id: number) {
    return `This action returns a #${id} classRegistration`;
  }

  update(id: number, updateClassRegistrationDto: UpdateClassRegistrationDto) {
    return `This action updates a #${id} ${updateClassRegistrationDto}classRegistration`;
  }

  remove(id: number) {
    return `This action removes a #${id} classRegistration`;
  }
}
