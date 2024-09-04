import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import { ClassScheduleData, HttpResponse, UserData } from 'src/interfaces';
import { AuditActionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BusinessConfigService } from '../business-config/business-config.service';
import { handleException } from 'src/utils';

@Injectable()
export class ClassScheduleService {
  private readonly logger = new Logger(ClassScheduleService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessConfigService: BusinessConfigService
  ) {}
  /**
   * Validar el formato de la hora
   * @param time Hora a validar
   */
  private validateTimeFormat(time: string): void {
    const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeFormat.test(time)) {
      throw new BadRequestException('Invalid time format. Use HH:mm.');
    }
  }

  /**
   * Crear un class schedule
   * @param createClassScheduleDto Data para crear un class schedule
   * @param user Usuario que crea el class schedule
   * @returns ClassSchedule creado
   */
  async create(
    createClassScheduleDto: CreateClassScheduleDto,
    user: UserData
  ): Promise<HttpResponse<ClassScheduleData>> {
    const { startTime, businessId } = createClassScheduleDto;
    this.validateTimeFormat(startTime);
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el businessId
        const businessConfigDB = await this.businessConfigService.findOne(businessId);
        if (!businessConfigDB) {
          throw new NotFoundException('Business config not found');
        }

        // Crear el registro de class schedule
        const newClassSchedule = await prisma.classSchedule.create({
          data: {
            startTime,
            businessId
          }
        });

        // Registrar la auditoría de la creación
        await prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: newClassSchedule.id,
            entityType: 'classSchedule',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.CREATED,
          message: 'Class Schedule created',
          data: {
            id: newClassSchedule.id,
            startTime: newClassSchedule.startTime
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error creating class schedule: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error creating class schedule');
    }
  }

  /**
   * Obtener todos los class schedule
   * @returns Todos los class schedule
   */
  async findAll(): Promise<ClassScheduleData[]> {
    try {
      const classesSchedule = await this.prisma.classSchedule.findMany({
        select: {
          id: true,
          startTime: true
        }
      });

      // Mapea los resultados al tipo ClassScheduleData
      return classesSchedule.map((classSchedule) => ({
        id: classSchedule.id,
        startTime: classSchedule.startTime
      })) as ClassScheduleData[];
    } catch (error) {
      this.logger.error('Error getting all class schedules', error.stack);
      handleException(error, 'Error getting all class schedules');
    }
  }

  /**
   * Obtener un class schedule por su id
   * @param id Id del class schedule
   * @returns Class schedule encontrado
   */
  async findOne(id: string): Promise<ClassScheduleData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get class schedule');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get class schedule');
    }
  }

  /**
   * Actualizar un class schedule
   * @param id Id del class schedule
   * @param updateClassScheduleDto Data para actualizar un class schedule
   */
  async findById(id: string): Promise<ClassScheduleData> {
    const classScheduleDB = await this.prisma.classSchedule.findFirst({
      where: { id },
      select: {
        id: true,
        startTime: true
      }
    });

    // Verificar si el class schedule existe y está activo
    if (!classScheduleDB) {
      throw new BadRequestException('This class schedule does not exist');
    }

    // Mapeo al tipo ClassScheduleData
    return {
      id: classScheduleDB.id,
      startTime: classScheduleDB.startTime
    };
  }

  update(id: number, updateClassScheduleDto: UpdateClassScheduleDto) {
    return `This action updates a #${id} ${updateClassScheduleDto} classSchedule`;
  }

  remove(id: number) {
    return `This action removes a #${id} classSchedule`;
  }
}
