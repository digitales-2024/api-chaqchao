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
  private validateTypeCurrency(typeCurrency: string): void {
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
    const { businessId, classTypeUser, price, typeCurrency } = createClassPriceDto;
    this.validateClassTypeUser(classTypeUser);
    this.validateTypeCurrency(typeCurrency);
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el businessId
        const businessConfigDB = await this.businessConfigService.findOne(businessId);
        if (!businessConfigDB) {
          throw new NotFoundException('Business config not found');
        }

        const priceFloat = parseFloat(price.toString());

        // Crear el registro de class price config
        const newClassPrice = await prisma.classPriceConfig.create({
          data: {
            classTypeUser,
            price: priceFloat,
            typeCurrency,
            businessId
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
            typeCurrency: newClassPrice.typeCurrency
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
  async findAll(): Promise<ClassPriceConfigData[]> {
    try {
      const classPrices = await this.prisma.classPriceConfig.findMany({
        select: {
          id: true,
          classTypeUser: true,
          price: true,
          typeCurrency: true
        }
      });

      return classPrices.map((classPrice) => ({
        id: classPrice.id,
        classTypeUser: classPrice.classTypeUser,
        price: classPrice.price,
        typeCurrency: classPrice.typeCurrency
      })) as ClassPriceConfigData[];
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
        typeCurrency: true
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
      typeCurrency: classPrice.typeCurrency
    };
  }

  update(id: number, updateClassPriceDto: UpdateClassPriceDto) {
    return `This action updates a #${id} ${updateClassPriceDto} classPrice`;
  }

  remove(id: number) {
    return `This action removes a #${id} classPrice`;
  }
}
