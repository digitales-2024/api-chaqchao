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
    const { startTime, businessId, typeClass } = createClassScheduleDto;
    this.validateTimeFormat(startTime);
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validate if businessId exists
        const businessConfigDB = await this.businessConfigService.findOne(businessId);
        if (!businessConfigDB) {
          throw new NotFoundException('Business config not found');
        }

        // Validate if startTime already exists
        const existingSchedule = await prisma.classSchedule.findUnique({
          where: {
            typeClass_startTime: {
              typeClass,
              startTime
            }
          }
        });
        if (existingSchedule) {
          throw new BadRequestException('Start time already exists');
        }

        // Create the class schedule record
        const newClassSchedule = await prisma.classSchedule.create({
          data: {
            startTime,
            typeClass,
            businessId
          }
        });

        // Log the creation audit
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
            startTime: newClassSchedule.startTime,
            typeClass: newClassSchedule.typeClass
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
  async findAll(): Promise<any> {
    try {
      const classesSchedule = await this.prisma.classSchedule.findMany({
        select: {
          id: true,
          startTime: true,
          typeClass: true
        }
      });

      // Agrupar los resultados typeClass
      const groupedClassesSchedule = classesSchedule.reduce((acc, classSchedule) => {
        const typeClass = classSchedule.typeClass;
        if (!acc[typeClass]) {
          acc[typeClass] = [];
        }
        acc[typeClass].push(classSchedule);
        return acc;
      }, {});
      return groupedClassesSchedule;
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
        startTime: true,
        typeClass: true
      }
    });

    // Verificar si el class schedule existe y está activo
    if (!classScheduleDB) {
      throw new BadRequestException('This class schedule does not exist');
    }

    // Mapeo al tipo ClassScheduleData
    return {
      id: classScheduleDB.id,
      startTime: classScheduleDB.startTime,
      typeClass: classScheduleDB.typeClass
    };
  }

  /**
   * Actualizar un class schedule
   * @param id Id del class schedule
   * @param updateClassScheduleDto Data para actualizar un class schedule
   * @param user Usuario que actualiza el class schedule
   * @returns Class schedule actualizado
   */
  async update(
    id: string,
    updateClassScheduleDto: UpdateClassScheduleDto,
    user: UserData
  ): Promise<HttpResponse<ClassScheduleData>> {
    const { startTime, typeClass } = updateClassScheduleDto;
    if (startTime) {
      this.validateTimeFormat(startTime);
    }
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingClassSchedule = await this.findById(id);

        // Verificar si hay cambios
        if (
          (existingClassSchedule.startTime === startTime &&
            existingClassSchedule.typeClass === typeClass) ||
          !startTime
        ) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Class Schedule updated',
            data: {
              id: existingClassSchedule.id,
              startTime: existingClassSchedule.startTime,
              typeClass: existingClassSchedule.typeClass
            }
          };
        }

        // Validar si el startTime ya existe
        const existingSchedule = await prisma.classSchedule.findUnique({
          where: {
            typeClass_startTime: {
              typeClass,
              startTime
            }
          }
        });
        if (existingSchedule) {
          throw new BadRequestException('Start time already exists');
        }
        console.log(
          '🚀 ~ ClassScheduleService ~ returnawaitthis.prisma.$transaction ~ id:',
          id,
          startTime
        );

        // Actualizar el class schedule
        const updatedClassSchedule = await prisma.classSchedule.update({
          where: { id },
          data: {
            startTime
          }
        });

        // Registrar la auditoría de la actualización
        await prisma.audit.create({
          data: {
            action: AuditActionType.UPDATE,
            entityId: updatedClassSchedule.id,
            entityType: 'classSchedule',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Class Schedule updated',
          data: {
            id: updatedClassSchedule.id,
            startTime: updatedClassSchedule.startTime,
            typeClass: updatedClassSchedule.typeClass
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error updating class schedule: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error updating class schedule');
    }
  }

  /**
   * Eliminar un class schedule
   * @param id Id del class schedule
   * @param user Usuario que elimina el class schedule
   * @returns Class schedule eliminado
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<ClassScheduleData>> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const classSchedule = await this.findById(id);

        // Eliminar el class schedule
        await prisma.classSchedule.delete({
          where: { id }
        });

        // Registrar la auditoría de la eliminación
        await prisma.audit.create({
          data: {
            action: AuditActionType.DELETE,
            entityId: classSchedule.id,
            entityType: 'classSchedule',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Class Schedule deleted',
          data: {
            id: classSchedule.id,
            startTime: classSchedule.startTime,
            typeClass: classSchedule.typeClass
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error deleting class schedule: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error deleting class schedule');
    }
  }

  /**
   * Mostrar un class schedule por su hora de inicio
   * @param startTime Inicio de la clase
   * @returns Horario de la clase
   */
  async findStartTime(startTime: string): Promise<ClassScheduleData> {
    const classScheduleDB = await this.prisma.classSchedule.findFirst({
      where: { startTime },
      select: {
        id: true,
        startTime: true,
        typeClass: true
      }
    });

    // Verificar si el class schedule existe y está activo
    if (!classScheduleDB) {
      throw new BadRequestException('This class schedule does not exist');
    }

    // Mapeo al tipo ClassScheduleData
    return {
      id: classScheduleDB.id,
      startTime: classScheduleDB.startTime,
      typeClass: classScheduleDB.typeClass
    };
  }
}
