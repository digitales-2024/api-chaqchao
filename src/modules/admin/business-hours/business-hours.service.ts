import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateBusinessHourDto } from './dto/create-business-hour.dto';
import { UpdateBusinessHourDto } from './dto/update-business-hour.dto';
import { AllBusinessHoursData, BusinessHoursData, HttpResponse, UserData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { BusinessConfigService } from '../business-config/business-config.service';
import { AuditActionType, DayOfWeek } from '@prisma/client';
import { handleException } from 'src/utils';

@Injectable()
export class BusinessHoursService {
  private readonly logger = new Logger(BusinessHoursService.name);
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
   * Validar el día de la semana
   * @param dayOfWeek Día de la semana a validar
   */
  private validateDayOfWeek(dayOfWeek: string): void {
    if (!Object.values(DayOfWeek).includes(dayOfWeek as DayOfWeek)) {
      throw new BadRequestException(
        `Invalid dayOfWeek value. Use one of: ${Object.values(DayOfWeek).join(', ')}`
      );
    }
  }

  /**
   * Crea un BusinessHour
   * @param createBusinessHourDto Data del BusinessHour a crear
   * @param user Usuario que realiza la creación
   * @returns BusinessHour creado
   */
  async create(
    createBusinessHourDto: CreateBusinessHourDto,
    user: UserData
  ): Promise<HttpResponse<BusinessHoursData>> {
    const { dayOfWeek, openingTime, closingTime, businessId } = createBusinessHourDto;

    // Validar el valor de dayOfWeek
    this.validateDayOfWeek(dayOfWeek);
    // Validar el formato de las horas
    this.validateTimeFormat(openingTime);
    this.validateTimeFormat(closingTime);

    // Validar que openingTime no sea mayor que closingTime
    if (openingTime >= closingTime) {
      throw new BadRequestException('Opening time must be earlier than closing time.');
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el businessId
        const businessConfigDB = await this.businessConfigService.findOne(businessId);
        if (!businessConfigDB) {
          throw new NotFoundException('Business config not found');
        }

        // Verificar si ya existe un registro con el mismo dayOfWeek y businessId
        const existingBusinessHour = await prisma.businessHours.findFirst({
          where: {
            dayOfWeek,
            businessId
          }
        });

        if (existingBusinessHour) {
          throw new BadRequestException(`Business hours for ${dayOfWeek} already exist`);
        }

        // Crear el registro de horas de negocio
        const newBusinessHour = await prisma.businessHours.create({
          data: {
            dayOfWeek,
            openingTime,
            closingTime,
            businessId
          }
        });

        // Registrar la auditoría de la creación
        await prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: newBusinessHour.id,
            entityType: 'businessHours',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.CREATED,
          message: 'Business hours created successfully',
          data: {
            id: newBusinessHour.id,
            dayOfWeek: newBusinessHour.dayOfWeek,
            openingTime: newBusinessHour.openingTime,
            closingTime: newBusinessHour.closingTime,
            isOpen: newBusinessHour.isOpen
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error creating business hours: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error creating business hours');
    }
  }

  /**
   * Obtener todos los BusinessHours
   * @returns Todos los BusinessHours
   */
  async findAll(): Promise<AllBusinessHoursData> {
    try {
      const businessHoursDB = await this.prisma.businessHours.findMany({
        select: {
          id: true,
          dayOfWeek: true,
          openingTime: true,
          closingTime: true,
          isOpen: true,
          business: {
            select: {
              id: true,
              businessName: true,
              contactNumber: true,
              email: true,
              address: true
            }
          }
        }
      });

      // Extraer la información del negocio
      const businessInfo =
        businessHoursDB.length > 0
          ? {
              id: businessHoursDB[0].business.id,
              businessName: businessHoursDB[0].business.businessName,
              contactNumber: businessHoursDB[0].business.contactNumber,
              email: businessHoursDB[0].business.email,
              address: businessHoursDB[0].business.address
            }
          : null;

      // Transformar los datos de los horarios
      const businessHoursData: BusinessHoursData[] = businessHoursDB.map((businessHour) => ({
        id: businessHour.id,
        dayOfWeek: businessHour.dayOfWeek,
        openingTime: businessHour.openingTime,
        closingTime: businessHour.closingTime,
        isOpen: businessHour.isOpen
      }));

      // Devolver los horarios y la información del negocio al final
      return {
        businessHours: businessHoursData,
        businessInfo: businessInfo
      };
    } catch (error) {
      this.logger.error('Error getting all business hours');
      handleException(error, 'Error getting all business hours');
      throw error;
    }
  }

  /**
   * Obtener un BusinessHour por id
   * @param id Id del BusinessHour
   * @returns BusinessHour encontrado
   */
  async findOne(id: string): Promise<BusinessHoursData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get business hours');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'business hours');
    }
  }

  /**
   * Mostrar BusinessHour por id
   * @param id Id del businessHour
   * @returns Datos del BusinessHour encontrado
   */
  async findById(id: string): Promise<BusinessHoursData> {
    const businessHoursDB = await this.prisma.businessHours.findFirst({
      where: { id },
      select: {
        id: true,
        dayOfWeek: true,
        openingTime: true,
        closingTime: true,
        isOpen: true
      }
    });

    // Verificar si el producto existe y está activo
    if (!businessHoursDB) {
      throw new BadRequestException('This product does not exist');
    }
    if (!!businessHoursDB && !businessHoursDB.isOpen) {
      throw new BadRequestException('This product exists, but is inactive');
    }

    // Mapeo al tipo ProductData
    return {
      id: businessHoursDB.id,
      dayOfWeek: businessHoursDB.dayOfWeek,
      openingTime: businessHoursDB.openingTime,
      closingTime: businessHoursDB.closingTime,
      isOpen: businessHoursDB.isOpen
    };
  }

  /**
   * Actualizar un BusinessHour
   * @param id Id del BusinessHour
   * @param updateBusinessHourDto Data del BusinessHour a actualizar
   * @param user Usuario que realiza la actualización
   * @returns BusinessHour actualizado
   */
  async update(
    id: string,
    updateBusinessHourDto: UpdateBusinessHourDto,
    user: UserData
  ): Promise<HttpResponse<BusinessHoursData>> {
    const { openingTime, closingTime } = updateBusinessHourDto;

    if (openingTime) {
      this.validateTimeFormat(openingTime);
    }

    if (closingTime) {
      this.validateTimeFormat(closingTime);
    }

    if (openingTime && closingTime && openingTime >= closingTime) {
      throw new BadRequestException('Opening time must be earlier than closing time.');
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingBusinessHour = await prisma.businessHours.findUnique({
          where: { id }
        });

        if (!existingBusinessHour) {
          throw new NotFoundException('Business hour not found');
        }

        if (openingTime && !closingTime && openingTime > existingBusinessHour.closingTime) {
          throw new BadRequestException('Opening time must be earlier than closing time.');
        }

        if (closingTime && !openingTime && existingBusinessHour.openingTime > closingTime) {
          throw new BadRequestException('Opening time must be earlier than closing time.');
        }

        // Verificar si hay cambios
        const isOpeningTimeChanged =
          openingTime && openingTime !== existingBusinessHour.openingTime;
        const isClosingTimeChanged =
          closingTime && closingTime !== existingBusinessHour.closingTime;

        if (!isOpeningTimeChanged && !isClosingTimeChanged) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Business hours updated successfully',
            data: {
              id: existingBusinessHour.id,
              dayOfWeek: existingBusinessHour.dayOfWeek,
              openingTime: existingBusinessHour.openingTime,
              closingTime: existingBusinessHour.closingTime,
              isOpen: existingBusinessHour.isOpen
            }
          };
        }

        const updatedBusinessHour = await prisma.businessHours.update({
          where: { id },
          data: {
            openingTime: openingTime ?? existingBusinessHour.openingTime,
            closingTime: closingTime ?? existingBusinessHour.closingTime
          }
        });

        await prisma.audit.create({
          data: {
            action: AuditActionType.UPDATE,
            entityId: updatedBusinessHour.id,
            entityType: 'businessHours',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Business hours updated successfully',
          data: {
            id: updatedBusinessHour.id,
            dayOfWeek: updatedBusinessHour.dayOfWeek,
            openingTime: updatedBusinessHour.openingTime,
            closingTime: updatedBusinessHour.closingTime,
            isOpen: updatedBusinessHour.isOpen
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error updating business hours: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error updating business hours');
    }
  }

  /*   remove(id: number) {
    return `This action removes a #${id} businessHour`;
  } */
}
