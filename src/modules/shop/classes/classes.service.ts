import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { ClassScheduleService } from 'src/modules/admin/class-schedule/class-schedule.service';
import { ClassRegistrationService } from 'src/modules/admin/class-registration/class-registration.service';
import { ClassLanguageService } from 'src/modules/admin/class-language/class-language.service';
import * as moment from 'moment-timezone';
import { ClassesData, ClassesDataAdmin, ClientData, HttpResponse } from 'src/interfaces';
import { ClassPriceService } from 'src/modules/admin/class-price/class-price.service';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';
import { AdminGateway } from 'src/modules/admin/admin.gateway';
import { ClassStatus, TypeCurrency } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import { UpdateClassDto } from './dto/update-class.dto';
import { isEqual } from 'date-fns';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly classScheduleService: ClassScheduleService,
    private readonly classRegistrationService: ClassRegistrationService,
    private readonly classLanguageService: ClassLanguageService,
    private readonly classPriceService: ClassPriceService,
    private readonly eventEmitter: TypedEventEmitter,
    private readonly adminGateway: AdminGateway
  ) {}

  /**
   * Validar la fecha de la clase para que no sea menor a la fecha actual
   * @param dateClass Fecha de la clase
   */
  private validateRegistrationDateClass(dateClass: Date) {
    const normalizedDateClass = moment.utc(dateClass).tz('America/Lima-5').format('YYYY-MM-DD');
    const normalizedCurrentDate = moment().tz('America/Lima-5').format('YYYY-MM-DD');

    if (normalizedDateClass < normalizedCurrentDate) {
      throw new BadRequestException('Invalid class date');
    }
  }

  /**
   * Obtener los horarios de cierre de inscripciones y de finalización de inscripciones
   * @param scheduleClass Horario de inicio de la clase
   * @param closeBeforeStartInterval Cantidad de minutos antes de la clase en que se cierran las inscripciones
   * @param finalRegistrationCloseInterval Rango de tiempo en minutos en que se cierran las inscripciones
   * @returns Horario de cierre de inscripciones y horario final de inscripciones
   */
  private calculateIntervals(
    scheduleClass: string,
    closeBeforeStartInterval: number,
    finalRegistrationCloseInterval: number
  ): { closeBeforeDate: string; finalRegistrationDate: string } {
    const [hours, minutes] = scheduleClass.split(':').map(Number);
    const scheduleClassDate = moment().hours(hours).minutes(minutes).seconds(0).milliseconds(0);

    const closeBeforeDate = scheduleClassDate.clone().subtract(closeBeforeStartInterval, 'minutes');
    const finalRegistrationDate = scheduleClassDate
      .clone()
      .subtract(finalRegistrationCloseInterval, 'minutes');

    return {
      closeBeforeDate: closeBeforeDate.format('HH:mm'),
      finalRegistrationDate: finalRegistrationDate.format('HH:mm')
    };
  }

  /**
   * Calcular los precios de la clase
   * @param typeCurrency Tipo de moneda
   * @param totalAdults Total de adultos
   * @param totalChildren Total de niños
   * @returns Retorna los precios calculados
   */
  private async calculatePrices(
    typeCurrency: string,
    totalAdults: number,
    totalChildren: number
  ): Promise<{ totalPriceAdults: number; totalPriceChildren: number; totalPrice: number }> {
    const pricesClassDB = await this.classPriceService.findClassPriceByTypeCurrency(
      typeCurrency as TypeCurrency
    );

    let priceAdults = 0;
    let priceChildren = 0;

    // Iterar sobre los precios y asignar los valores correspondientes
    pricesClassDB.forEach((priceEntry) => {
      if (priceEntry.classTypeUser === 'ADULT') {
        if (priceEntry.price !== undefined) {
          priceAdults = priceEntry.price;
        }
      } else if (priceEntry.classTypeUser === 'CHILD') {
        if (priceEntry.price !== undefined) {
          priceChildren = priceEntry.price;
        }
      }
    });

    // Verificar si los precios han sido definidos
    if (totalAdults > 0 && priceAdults === 0) {
      throw new NotFoundException('The price for adults is not defined');
    }
    if (totalChildren > 0 && priceChildren === 0) {
      throw new NotFoundException('The price for children is not defined');
    }

    // Calcular los precios totales
    const totalPriceAdults = priceAdults * totalAdults;
    const totalPriceChildren = priceChildren * totalChildren;
    const totalPrice = totalPriceAdults + totalPriceChildren;

    // Retornar los precios calculados
    return {
      totalPriceAdults: totalPriceAdults,
      totalPriceChildren: totalPriceChildren,
      totalPrice: totalPrice
    };
  }

  /**
   * Verificar reglas y condiciones antes de la creación de la clase
   */
  private validateClassCreation(
    dateClass: Date,
    currentTime: string,
    closeBeforeDate: string,
    finalRegistrationDate: string,
    totalParticipants: number,
    totalParticipantsInSchedule: number,
    noClassesYet: boolean
  ) {
    if (totalParticipantsInSchedule + totalParticipants > 8) {
      throw new BadRequestException('There are no more spots available.');
    }

    if (noClassesYet) {
      // Si no hay clases, verificar si el total de participantes es al menos 2
      if (totalParticipants < 2 || totalParticipants > 8) {
        throw new BadRequestException('Invalid number of participants');
      }
      if (currentTime >= closeBeforeDate && isEqual(new Date(dateClass), new Date())) {
        throw new BadRequestException('Class is close');
      }
    } else {
      // Si ya hay clases, el mínimo es 1 participante
      if (totalParticipants < 1 || totalParticipants > 8) {
        throw new BadRequestException('Invalid number of participants');
      }
    }

    if (currentTime >= finalRegistrationDate && isEqual(new Date(dateClass), new Date())) {
      throw new BadRequestException('Registration is close');
    }
  }

  // Validar que el idioma de la primera clase sea el mismo que el idioma de la clase a crear
  private validateFirstRegistrationLanguageClass(
    classesScheduleCreated: ClassesData[],
    languageClass: string,
    noClassesYet: boolean
  ) {
    if (!noClassesYet && languageClass !== classesScheduleCreated[0].languageClass) {
      throw new BadRequestException(
        'The language of the class is different from the first registration class'
      );
    }
  }

  /**
   * Crear una clase
   * @param createClassDto Data para crear una clase
   */
  async create(createClassDto: CreateClassDto): Promise<HttpResponse<ClassesData>> {
    const { scheduleClass, dateClass, languageClass, totalAdults, totalChildren, typeCurrency } =
      createClassDto;

    await Promise.all([
      this.classScheduleService.findStartTime(scheduleClass),
      this.classLanguageService.findLanguageByName(languageClass),
      this.validateRegistrationDateClass(dateClass),
      this.classPriceService.validateTypeCurrency(typeCurrency)
    ]);

    const intervalsClassRegistration = await this.classRegistrationService.findAll();
    const classPrices = await this.classPriceService.findClassPriceByTypeCurrency(typeCurrency);

    if (!classPrices.length) {
      throw new NotFoundException('No prices found for type currency');
    }

    if (!intervalsClassRegistration.length) {
      throw new NotFoundException('No intervals found');
    }

    const { closeBeforeStartInterval, finalRegistrationCloseInterval } =
      intervalsClassRegistration[0];

    const { closeBeforeDate, finalRegistrationDate } = this.calculateIntervals(
      scheduleClass,
      closeBeforeStartInterval,
      finalRegistrationCloseInterval
    );

    const { totalPriceAdults, totalPriceChildren, totalPrice } = await this.calculatePrices(
      typeCurrency,
      totalAdults,
      totalChildren
    );
    const currentTime = moment().tz('America/Lima-5').format('HH:mm');
    try {
      const classesScheduleCreated = await this.findClassesByscheduleClass(
        scheduleClass,
        dateClass
      );
      const totalParticipantsInSchedule = classesScheduleCreated.reduce((sum, classItem) => {
        if (
          classItem.status === ClassStatus.PENDING ||
          classItem.status === ClassStatus.CONFIRMED
        ) {
          return sum + classItem.totalParticipants;
        }
      }, 0);
      const noClassesYet = classesScheduleCreated.length === 0;

      this.validateFirstRegistrationLanguageClass(
        classesScheduleCreated,
        languageClass,
        noClassesYet
      );

      const totalParticipants = totalAdults + totalChildren;

      this.validateClassCreation(
        dateClass,
        currentTime,
        closeBeforeDate,
        finalRegistrationDate,
        totalParticipants,
        totalParticipantsInSchedule,
        noClassesYet
      );

      const classCreated = await this.prisma.classes.create({
        data: {
          ...createClassDto,
          totalPrice,
          totalPriceAdults,
          totalPriceChildren,
          totalParticipants,
          status: ClassStatus.PENDING,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        },
        select: {
          id: true,
          userName: true,
          userEmail: true,
          userPhone: true,
          totalParticipants: true,
          totalAdults: true,
          totalChildren: true,
          totalPrice: true,
          totalPriceAdults: true,
          totalPriceChildren: true,
          languageClass: true,
          typeCurrency: true,
          scheduleClass: true,
          dateClass: true,
          comments: true,
          status: true
        }
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Class created successfully',
        data: classCreated
      };
    } catch (error) {
      this.logger.error(`Error creating classes: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error creating a class');
    }
  }

  /**
   * Mostrar todas las clases del cliente
   * @param client Data del cliente
   * @returns Clases encontradas
   */
  async findByClient(client: ClientData): Promise<ClassesData[]> {
    try {
      const classesDB = await this.prisma.classes.findMany({
        where: { userEmail: client.email },
        select: {
          id: true,
          userName: true,
          userEmail: true,
          userPhone: true,
          totalParticipants: true,
          totalAdults: true,
          totalChildren: true,
          totalPrice: true,
          totalPriceAdults: true,
          totalPriceChildren: true,
          languageClass: true,
          typeCurrency: true,
          dateClass: true,
          scheduleClass: true,
          comments: true,
          status: true,
          expiresAt: true
        }
      });

      return classesDB;
    } catch (error) {
      this.logger.error(`Error finding classes by client: ${error.message}`, error.stack);
      handleException(error, 'Error finding classes by client');
    }
  }

  /**
   * Encontrar clases por el horario de inicio
   * @param scheduleClass Horario de inicio
   * @returns Clases encontradas
   */
  async findClassesByscheduleClass(scheduleClass: string, dateClass: Date): Promise<ClassesData[]> {
    const startOfDay = new Date(dateClass);
    startOfDay.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC
    const endOfDay = new Date(dateClass);
    endOfDay.setUTCHours(23, 59, 59, 999); // Fin del día en UTC
    try {
      const classesDB = await this.prisma.classes.findMany({
        where: {
          scheduleClass,
          dateClass: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: ClassStatus.CONFIRMED
        },
        select: {
          id: true,
          userName: true,
          userEmail: true,
          userPhone: true,
          totalParticipants: true,
          totalAdults: true,
          totalChildren: true,
          totalPrice: true,
          totalPriceAdults: true,
          totalPriceChildren: true,
          languageClass: true,
          typeCurrency: true,
          dateClass: true,
          scheduleClass: true,
          comments: true,
          status: true
        }
      });

      return classesDB;
    } catch (error) {
      this.logger.error(`Error finding classes by start time: ${error.message}`, error.stack);
      handleException(error, 'Error finding classes by start time');
    }
  }

  /**
   * Tarea programada para cambiar el estado de las clases
   */
  @Cron('*/1 * * * *')
  async cancelExpiredRegistrations() {
    const now = new Date();
    const expiredRegistrations = await this.prisma.classes.findMany({
      where: {
        expiresAt: { lte: now },
        status: ClassStatus.PENDING
      }
    });

    for (const registration of expiredRegistrations) {
      await this.prisma.classes.update({
        where: { id: registration.id },
        data: { status: ClassStatus.CANCELLED }
      });
    }
  }

  /**
   * Confirmar la inscripción de una clase despues de realizado el pago
   * @param classId ID de la clase
   * @param class Data de la clase
   * @returns Clase confirmada
   */
  async confirmClass(
    classId: string,
    classData: UpdateClassDto
  ): Promise<HttpResponse<ClassesData>> {
    const existingClass = await this.prisma.classes.findUnique({
      where: { id: classId }
    });

    if (!existingClass) {
      throw new NotFoundException('Class not found');
    }

    if (existingClass.status === ClassStatus.CONFIRMED) {
      throw new BadRequestException('Class is already confirmed');
    }
    if (existingClass.status === ClassStatus.CANCELLED) {
      throw new BadRequestException('Class is already cancelled');
    }

    const classConfirm = await this.prisma.classes.update({
      where: { id: classId },
      data: {
        status: ClassStatus.CONFIRMED,
        ...classData
      }
    });

    if (classConfirm) {
      const normalizedDateClass = moment
        .utc(classConfirm.dateClass)
        .tz('America/Lima-5')
        .format('Do [of] MMMM, dddd');
      await this.eventEmitter.emitAsync('class.new-class', {
        name: classConfirm.userName.toUpperCase(),
        email: classConfirm.userEmail,
        dateClass: normalizedDateClass,
        scheduleClass: classConfirm.scheduleClass,
        languageClass: classConfirm.languageClass,
        totalParticipants: classConfirm.totalParticipants,
        totalPrice: classConfirm.totalPrice,
        typeCurrency: classConfirm.typeCurrency
      });
    }

    this.adminGateway.sendNewClassRegister(classConfirm.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Class confirmed successfully',
      data: classConfirm
    };
  }

  /**
   * Verificar si hay una clase en una fecha y hora específica
   * @param scheduleClass Horario de inicio
   * @param dateClass Fecha de la clase
   * @returns Retorna si hay una clase en la fecha y hora especificada
   */
  async checkClass(scheduleClass: string, dateClass: string): Promise<ClassesDataAdmin> {
    const parsedDate = new Date(dateClass);
    const classesDB = await this.findClassesByscheduleClass(scheduleClass, parsedDate);

    // Agrupamos el total de participantes
    const totalParticipants = classesDB.reduce(
      (sum, classItem) => sum + classItem.totalParticipants,
      0
    );

    // Sacamos el idioma de la primera clase
    const languageClass = classesDB.length ? classesDB[0].languageClass : '';

    return {
      dateClass: dateClass,
      scheduleClass: scheduleClass,
      totalParticipants: totalParticipants,
      languageClass: languageClass,
      classes: classesDB
    };
  }
}
