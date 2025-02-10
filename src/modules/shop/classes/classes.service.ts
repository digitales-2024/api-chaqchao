import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClassStatus, TypeClass, TypeCurrency } from '@prisma/client';
import { format, isEqual } from 'date-fns';
import * as moment from 'moment-timezone';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';
import {
  ClassesData,
  ClassesDataAdmin,
  ClassRegisterData,
  ClientData,
  HttpResponse
} from 'src/interfaces';
import { AdminGateway } from 'src/modules/admin/admin.gateway';
import { ClassLanguageService } from 'src/modules/admin/class-language/class-language.service';
import { ClassPriceService } from 'src/modules/admin/class-price/class-price.service';
import { ClassRegistrationService } from 'src/modules/admin/class-registration/class-registration.service';
import { ClassScheduleService } from 'src/modules/admin/class-schedule/class-schedule.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name, {
    timestamp: true
  });

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
    typeClass: TypeClass,
    totalAdults: number,
    totalChildren: number
  ): Promise<{ totalPriceAdults: number; totalPriceChildren: number; totalPrice: number }> {
    const pricesClassDB = await this.classPriceService.findClassPriceByTypeCurrencyAndTypeClass(
      typeCurrency as TypeCurrency,
      typeClass
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
    classesScheduleCreated: ClassesDataAdmin,
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
    const {
      scheduleClass,
      dateClass,
      languageClass,
      totalAdults,
      totalChildren,
      typeCurrency,
      typeClass
    } = createClassDto;

    await Promise.all([
      this.classScheduleService.findStartTime(scheduleClass),
      this.classLanguageService.findLanguageByName(languageClass),
      this.validateRegistrationDateClass(dateClass),
      this.classPriceService.validateTypeCurrency(typeCurrency)
    ]);

    const intervalsClassRegistration = await this.classRegistrationService.findAll();
    const classPrices = await this.classPriceService.findClassPriceByTypeCurrencyAndTypeClass(
      typeCurrency,
      typeClass
    );

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

    const currentTime = moment().tz('America/Lima-5').format('HH:mm');
    try {
      const classesScheduleCreated = await this.findClassesByscheduleClass(
        scheduleClass,
        dateClass,
        typeClass
      );

      const totalParticipantsInSchedule = classesScheduleCreated.registers.reduce(
        (sum, classItem) => {
          if (
            classItem.status === ClassStatus.PENDING ||
            classItem.status === ClassStatus.CONFIRMED
          ) {
            return sum + classItem.totalParticipants;
          }
          return sum; // Retornar sum sin cambios si no cumple la condición
        },
        0
      );
      const noClassesYet = classesScheduleCreated.registers.length === 0;

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
          totalParticipants
        },
        include: {
          ClassRegister: true
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
  async findByClient(client: ClientData): Promise<ClassRegisterData[]> {
    try {
      const classesDB = await this.prisma.classRegister.findMany({
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
          typeCurrency: true,
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
  async findClassesByscheduleClass(
    scheduleClass: string,
    dateClass: Date,
    typeClass: TypeClass
  ): Promise<ClassesDataAdmin> {
    try {
      // Configurar el rango de búsqueda en UTC
      const searchDate = new Date(format(dateClass, 'dd-MM-yyyy'));

      // Inicio del día en Lima (UTC+5)
      const startOfDay = new Date(searchDate);
      startOfDay.setUTCHours(5, 0, 0, 0);

      // Fin del día en Lima (UTC+5)
      const endOfDay = new Date(searchDate);
      endOfDay.setUTCHours(28, 59, 59, 999);

      const startOfDayDate = startOfDay;
      const endOfDayDate = endOfDay;

      const claseDB = await this.prisma.classes.findFirst({
        where: {
          scheduleClass,
          dateClass: {
            gte: startOfDayDate,
            lte: endOfDayDate
          },
          typeClass,
          isClosed: false
        },
        select: {
          id: true,
          totalParticipants: true,
          languageClass: true,
          dateClass: true,
          scheduleClass: true,
          typeClass: true,
          isClosed: true,
          ClassRegister: {
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
              typeCurrency: true,
              comments: true,
              status: true
            }
          }
        },
        orderBy: {
          dateClass: 'asc' as const
        }
      });

      this.logger.debug('Resultado de la consulta:', claseDB);

      // Añadir verificación para cuando no se encuentra ninguna clase
      if (!claseDB) {
        throw new NotFoundException('No classes found');
      }

      return {
        totalParticipants: claseDB.totalParticipants,
        languageClass: claseDB.languageClass,
        dateClass: claseDB.dateClass,
        scheduleClass: claseDB.scheduleClass,
        typeClass: claseDB.typeClass,
        isClosed: claseDB.isClosed,
        registers: claseDB.ClassRegister.map((registro) => ({
          id: registro.id,
          userName: registro.userName,
          userEmail: registro.userEmail,
          userPhone: registro.userPhone,
          totalParticipants: registro.totalParticipants,
          totalAdults: registro.totalAdults,
          totalChildren: registro.totalChildren,
          totalPrice: registro.totalPrice,
          totalPriceAdults: registro.totalPriceAdults,
          totalPriceChildren: registro.totalPriceChildren,
          typeCurrency: registro.typeCurrency,
          comments: registro.comments,
          status: registro.status
        }))
      };
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
    const expiredRegistrations = await this.prisma.classRegister.findMany({
      where: {
        expiresAt: { lte: now },
        status: ClassStatus.PENDING
      }
    });

    for (const registration of expiredRegistrations) {
      const registeCanceled = await this.prisma.classRegister.update({
        where: { id: registration.id },
        data: { status: ClassStatus.CANCELLED }
      });

      await this.prisma.classes.update({
        where: {
          id: registeCanceled.classesId
        },
        data: {
          totalParticipants: {
            decrement: registeCanceled.totalParticipants
          }
        }
      });
    }
  }

  /**
   * Confirmar la inscripción de una clase despues de realizado el pago
   * @param classId ID de la clase
   * @param class Data de la clase
   * @returns Clase confirmada
   */
  async confirmClass(classId: string, classData: UpdateClassDto): Promise<HttpResponse<void>> {
    const existingClass = await this.prisma.classRegister.findUnique({
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

    const registerConfirm = await this.prisma.classRegister.update({
      where: { id: classId },
      data: {
        status: ClassStatus.CONFIRMED,
        ...classData
      }
    });

    const classConfirm = await this.prisma.classes.findFirst({
      where: {
        dateClass: classData.dateClass,
        scheduleClass: classData.scheduleClass
      }
    });

    if (classConfirm) {
      await this.eventEmitter.emitAsync('class.new-class', {
        dateClass: format(classConfirm.dateClass, 'yyyy-MM-dd'),
        scheduleClass: classConfirm.scheduleClass,
        languageClass: classConfirm.languageClass,
        name: registerConfirm.userName,
        email: registerConfirm.userEmail,
        totalParticipants: registerConfirm.totalParticipants,
        totalPrice: registerConfirm.totalPrice,
        typeCurrency: registerConfirm.typeCurrency
      });
    }

    this.adminGateway.sendNewClassRegister(classConfirm.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Class confirmed successfully',
      data: null
    };
  }

  /**
   * Verificar si hay una clase en una fecha y hora específica
   * @param scheduleClass Horario de inicio
   * @param dateClass Fecha de la clase
   * @returns Retorna si hay una clase en la fecha y hora especificada
   */
  async checkClass(
    scheduleClass: string,
    dateClass: string,
    typeClass: TypeClass
  ): Promise<ClassesDataAdmin> {
    const parsedDate = new Date(dateClass);
    const classDB = await this.findClassesByscheduleClass(scheduleClass, parsedDate, typeClass);
    const { totalParticipants, languageClass, registers } = classDB;
    // Verificamos si el total de participantes es igual al total de asistentes

    const totalParticipantsInSchedule = registers.reduce((sum, classItem) => {
      if (classItem.status === ClassStatus.PENDING || classItem.status === ClassStatus.CONFIRMED) {
        return sum + classItem.totalParticipants;
      }
    }, 0);

    if (totalParticipants !== totalParticipantsInSchedule) {
      throw new BadRequestException('Invalid number of participants');
    }

    return {
      dateClass: parsedDate,
      typeClass: typeClass,
      scheduleClass: scheduleClass,
      totalParticipants: totalParticipants,
      languageClass: languageClass,
      isClosed: classDB.isClosed,
      registers: classDB.registers
    };
  }
}
