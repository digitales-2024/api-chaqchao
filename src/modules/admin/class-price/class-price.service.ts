import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateClassPriceDto } from './dto/create-class-price.dto';
import { UpdateClassPriceDto } from './dto/update-class-price.dto';
import { ClassPriceConfigData, HttpResponse, UserData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { BusinessConfigService } from '../business-config/business-config.service';
import { AuditActionType, ClassTypeUser, TypeCurrency } from '@prisma/client';
import { handleException } from 'src/utils';

@Injectable()
export class ClassPriceService {
  private readonly logger = new Logger(ClassPriceService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessConfigService: BusinessConfigService
  ) {}

  /**
   * Validar el tipo de usuario
   * @param classTypeUser Tipo de usuario
   */
  private validateClassTypeUser(classTypeUser: string): void {
    if (!Object.values(ClassTypeUser).includes(classTypeUser as ClassTypeUser)) {
      throw new BadRequestException(
        `Invalid classTypeUser value. Use one of: ${Object.values(ClassTypeUser).join(', ')}`
      );
    }
  }

  /**
   * Validar el tipo de moneda
   * @param typeCurrency Tipo de moneda
   */
  public validateTypeCurrency(typeCurrency: string): void {
    if (!Object.values(TypeCurrency).includes(typeCurrency as TypeCurrency)) {
      throw new BadRequestException(
        `Invalid typeCurrency value. Use one of: ${Object.values(TypeCurrency).join(', ')}`
      );
    }
  }

  /**
   * Crear un class price
   * @param createClassPriceDto Data para crear un class price
   * @param user Usuario que crea el class price
   * @returns ClassPrice creado
   */
  async create(
    createClassPriceDto: CreateClassPriceDto,
    user: UserData
  ): Promise<HttpResponse<ClassPriceConfigData>> {
    const { businessId, classTypeUser, price, typeCurrency, typeClass } = createClassPriceDto;
    this.validateClassTypeUser(classTypeUser);
    this.validateTypeCurrency(typeCurrency);
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el businessId
        const businessConfigDB = await this.businessConfigService.findOne(businessId);
        if (!businessConfigDB) {
          throw new NotFoundException('Business config not found');
        }

        // Validar que solo haya dos precios para adulto y dos para child
        const existingPrices = await prisma.classPriceConfig.findMany({
          where: {
            businessId,
            classTypeUser,
            typeClass
          }
        });

        const priceCount = existingPrices.filter(
          (price) => price.typeCurrency === typeCurrency
        ).length;

        if (priceCount >= 1) {
          throw new BadRequestException(
            `Only one price in ${typeCurrency} is allowed for ${classTypeUser}`
          );
        }

        const priceFloat = parseFloat(price.toString());

        // Crear el registro de class price config
        const newClassPrice = await prisma.classPriceConfig.create({
          data: {
            classTypeUser,
            price: priceFloat,
            typeCurrency,
            businessId,
            typeClass
          }
        });

        // Registrar la auditoría de la creación
        await prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: newClassPrice.id,
            entityType: 'classPriceConfig',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.CREATED,
          message: 'Class price created',
          data: {
            id: newClassPrice.id,
            classTypeUser: newClassPrice.classTypeUser,
            price: newClassPrice.price,
            typeCurrency: newClassPrice.typeCurrency,
            typeClass: newClassPrice.typeClass
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error creating class price: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error creating class price');
    }
  }
  /**
   * Obtener todos los class prices
   * @returns Todos los class prices
   */
  async findAll(): Promise<any> {
    try {
      const classPrices = await this.prisma.classPriceConfig.findMany({
        select: {
          id: true,
          classTypeUser: true,
          price: true,
          typeCurrency: true,
          typeClass: true
        },
        orderBy: {
          typeCurrency: 'asc'
        }
      });
      // Agrupar los resultados typeClass
      const groupedClassesSchedule = classPrices.reduce((acc, classSchedule) => {
        const typeClass = classSchedule.typeClass;
        if (!acc[typeClass]) {
          acc[typeClass] = [];
        }
        acc[typeClass].push(classSchedule);
        return acc;
      }, {});

      return groupedClassesSchedule;
    } catch (error) {
      this.logger.error(`Error fetching class prices: ${error.message}`, error.stack);
      throw new BadRequestException('Error fetching class prices');
    }
  }

  /**
   * Obtener un class price por su id
   * @param id Id del class price
   * @returns Class price
   */
  async findOne(id: string): Promise<ClassPriceConfigData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get class price');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get class price');
    }
  }

  /**
   * Buscar un class price por su id
   * @param id Id del class price
   * @returns Class price
   */
  async findById(id: string) {
    const classPrice = await this.prisma.classPriceConfig.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        classTypeUser: true,
        price: true,
        typeCurrency: true,
        typeClass: true
      }
    });

    // Validar si existe el class price
    if (!classPrice) {
      throw new BadRequestException('Class price not found');
    }

    return {
      id: classPrice.id,
      classTypeUser: classPrice.classTypeUser,
      price: classPrice.price,
      typeCurrency: classPrice.typeCurrency,
      typeClass: classPrice.typeClass
    };
  }
  /**
   * Actualizar un class price
   * @param id Id del class price
   * @param updateClassPriceDto Data para actualizar un class price
   * @param user Usuario que actualiza el class price
   * @returns Class price actualizado
   */
  async update(
    id: string,
    updateClassPriceDto: UpdateClassPriceDto,
    user: UserData
  ): Promise<HttpResponse<ClassPriceConfigData>> {
    const { classTypeUser, price, typeCurrency, typeClass } = updateClassPriceDto;

    // Validar si los datos están presentes
    if (classTypeUser) {
      this.validateClassTypeUser(classTypeUser);
    }
    if (typeCurrency) {
      this.validateTypeCurrency(typeCurrency);
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el class price
        const classPriceDB = await this.findById(id);

        // Convertir el price a flotante solo si está presente
        const priceFloat = price ? parseFloat(price.toString()) : classPriceDB.price;

        // Verificar si hay cambios
        const hasChanges =
          (classTypeUser && classPriceDB.classTypeUser !== classTypeUser) ||
          (price && classPriceDB.price !== priceFloat) ||
          (typeCurrency && classPriceDB.typeCurrency !== typeCurrency) ||
          (typeClass && classPriceDB.typeClass !== typeClass);

        if (!hasChanges) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Class price updated',
            data: {
              id: classPriceDB.id,
              classTypeUser: classPriceDB.classTypeUser,
              price: classPriceDB.price,
              typeCurrency: classPriceDB.typeCurrency,
              typeClass: classPriceDB.typeClass
            }
          };
        }

        // Validar que solo haya dos precios para adulto y dos para child
        const existingPrices = await prisma.classPriceConfig.findMany({
          where: {
            typeClass: classPriceDB.typeClass,
            classTypeUser: classTypeUser || classPriceDB.classTypeUser,
            typeCurrency: typeCurrency || classPriceDB.typeCurrency,
            NOT: { id, typeClass } // Excluir el registro actual
          }
        });
        const priceCount = existingPrices.length;

        if (priceCount >= 1) {
          throw new BadRequestException(
            `Only one price in ${typeCurrency || classPriceDB.typeCurrency} is allowed for ${classTypeUser || classPriceDB.classTypeUser}`
          );
        }

        // Actualizar el registro de class price
        const updatedClassPrice = await prisma.classPriceConfig.update({
          where: {
            id,
            typeClass
          },
          data: {
            ...(classTypeUser && { classTypeUser }),
            ...(price && { price: priceFloat }),
            ...(typeCurrency && { typeCurrency })
          }
        });

        // Registrar la auditoría de la actualización
        await prisma.audit.create({
          data: {
            action: AuditActionType.UPDATE,
            entityId: updatedClassPrice.id,
            entityType: 'classPriceConfig',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Class price updated',
          data: {
            id: updatedClassPrice.id,
            classTypeUser: updatedClassPrice.classTypeUser,
            price: updatedClassPrice.price,
            typeCurrency: updatedClassPrice.typeCurrency,
            typeClass: updatedClassPrice.typeClass
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error updating class price: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error updating class price');
    }
  }

  /**
   * Eliminar un class price
   * @param id Id del class price
   * @param user Usuario que elimina el class price
   * @returns Class price eliminado
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<ClassPriceConfigData>> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const classPrice = await this.findById(id);

        // Eliminar el class price
        await prisma.classPriceConfig.delete({
          where: { id }
        });

        // Registrar la auditoría de la eliminación
        await prisma.audit.create({
          data: {
            action: AuditActionType.DELETE,
            entityId: classPrice.id,
            entityType: 'classPriceConfig',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Class price deleted',
          data: {
            id: classPrice.id,
            classTypeUser: classPrice.classTypeUser,
            price: classPrice.price,
            typeCurrency: classPrice.typeCurrency,
            typeClass: classPrice.typeClass
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error deleting class price: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error deleting class price');
    }
  }

  /**
   * Encontrar precio de las clases por el tipo de moneda
   * @param typeCurrency Tipo de moneda
   * @returns Precios de las clases
   */
  async findClassPriceByTypeCurrency(typeCurrency: TypeCurrency): Promise<ClassPriceConfigData[]> {
    try {
      const classPrices = await this.prisma.classPriceConfig.findMany({
        where: {
          typeCurrency
        },
        select: {
          id: true,
          classTypeUser: true,
          price: true,
          typeCurrency: true,
          typeClass: true
        }
      });

      return classPrices.map((classPrice) => ({
        id: classPrice.id,
        classTypeUser: classPrice.classTypeUser,
        price: classPrice.price,
        typeCurrency: classPrice.typeCurrency,
        typeClass: classPrice.typeClass
      })) as ClassPriceConfigData[];
    } catch (error) {
      this.logger.error(`Error fetching class prices: ${error.message}`, error.stack);
      throw new BadRequestException('Error fetching class prices');
    }
  }
}
