import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateBusinessHourDto } from './dto/create-business-hour.dto';
import { UpdateBusinessHourDto } from './dto/update-business-hour.dto';
import { BusinessHoursData, HttpResponse, UserData } from 'src/interfaces';
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
   * Convertir la hora en formato HH:mm a Date
   * @param time Hora a convertir
   * @returns Horas y minutos en formato Date
   */
  private convertToDateTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    return date;
  }

  // Formatear la fecha a ISOString
  private formatDateTime(date: Date): string {
    return date.toISOString();
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

    // Convertir las horas a instancias de Date
    const openingTimeDate = this.convertToDateTime(openingTime);
    const closingTimeDate = this.convertToDateTime(closingTime);

    // Validar que openingTime no sea mayor que closingTime
    if (openingTimeDate >= closingTimeDate) {
      throw new BadRequestException('Opening time must be earlier than closing time.');
    }

    const formattedOpeningTime = this.formatDateTime(openingTimeDate);
    const formattedClosingTime = this.formatDateTime(closingTimeDate);

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
            openingTime: formattedOpeningTime,
            closingTime: formattedClosingTime,
            businessId
          },
          include: {
            business: true
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
            isOpen: newBusinessHour.isOpen,
            businessConfig: {
              id: newBusinessHour.business.id,
              businessName: newBusinessHour.business.businessName,
              contactNumber: newBusinessHour.business.contactNumber,
              email: newBusinessHour.business.email,
              address: newBusinessHour.business.address
            }
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
  async findAll(): Promise<BusinessHoursData[]> {
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

      const businessHoursData = businessHoursDB.map((businessHoursDB) => ({
        id: businessHoursDB.id,
        dayOfWeek: businessHoursDB.dayOfWeek,
        openingTime: businessHoursDB.openingTime,
        closingTime: businessHoursDB.closingTime,
        isOpen: businessHoursDB.isOpen,
        businessConfig: {
          id: businessHoursDB.business.id,
          businessName: businessHoursDB.business.businessName,
          contactNumber: businessHoursDB.business.contactNumber,
          email: businessHoursDB.business.email,
          address: businessHoursDB.business.address
        }
      })) as BusinessHoursData[];

      return businessHoursData;
    } catch (error) {
      this.logger.error('Error getting all business hours');
      handleException(error, 'Error getting all business hours');
    }
  }

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

  async findById(id: string): Promise<BusinessHoursData> {
    const businessHoursDB = await this.prisma.businessHours.findFirst({
      where: { id },
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
      isOpen: businessHoursDB.isOpen,
      businessConfig: {
        id: businessHoursDB.business.id,
        businessName: businessHoursDB.business.businessName,
        contactNumber: businessHoursDB.business.contactNumber,
        email: businessHoursDB.business.email,
        address: businessHoursDB.business.address
      }
    };
  }

  update(id: string, updateBusinessHourDto: UpdateBusinessHourDto) {
    return `This action updates a #${id} ${updateBusinessHourDto} businessHour`;
  }

  remove(id: number) {
    return `This action removes a #${id} businessHour`;
  }
}
