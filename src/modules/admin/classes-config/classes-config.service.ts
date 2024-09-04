import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { CreateClassesConfigDto } from './dto/create-classes-config.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClassConfigData, HttpResponse, UserData } from 'src/interfaces';
import { BusinessConfigService } from '../business-config/business-config.service';
import { AuditActionType } from '@prisma/client';
import { validateOrReject, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateClassesConfigDto } from './dto/update-classes-config.dto';
import { CreateClassesRegistrationConfigDto } from './dto/create-classes-registration-config.dto';
import { CreateClassesLanguageDto } from './dto/create-classes-language.dto';
import { CreateClassesPriceConfigDto } from './dto/create-classes-price-config.dto';

@Injectable()
export class ClassesConfigService {
  private readonly logger = new Logger(ClassesConfigService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessConfigService: BusinessConfigService
  ) {}

  async create(
    createClassesConfigDto: CreateClassesConfigDto,
    user: UserData
  ): Promise<HttpResponse<ClassConfigData>> {
    const { price, language, registration, businessId } = createClassesConfigDto;
    let newConfigs;

    try {
      // Validar si existe el businessId
      const businessConfigDB = await this.businessConfigService.findOne(businessId);
      if (!businessConfigDB) {
        throw new NotFoundException('Business config not found');
      }

      // Validar los DTOs
      await Promise.all([
        ...price.map((dto) => validateOrReject(plainToClass(CreateClassesPriceConfigDto, dto))),
        ...language.map((dto) => validateOrReject(plainToClass(CreateClassesLanguageDto, dto))),
        ...registration.map((dto) =>
          validateOrReject(plainToClass(CreateClassesRegistrationConfigDto, dto))
        )
      ]);

      // Crear las configuraciones en una transacción
      newConfigs = await this.prisma.$transaction(async (prisma) => {
        const priceConfigs = await Promise.all(
          price.map(async (priceConfigDto) => {
            const priceConfig = await prisma.classPriceConfig.create({
              data: {
                businessId,
                classTypeUser: priceConfigDto.classTypeUser,
                price: priceConfigDto.price,
                typeCurrency: priceConfigDto.typeCurrency
              }
            });

            await prisma.audit.create({
              data: {
                action: AuditActionType.CREATE,
                entityId: priceConfig.id,
                entityType: 'classPriceConfig',
                performedById: user.id
              }
            });

            return priceConfig;
          })
        );

        const languageConfigs = await Promise.all(
          language.map(async (languageConfigDto) => {
            const languageConfig = await prisma.classLanguage.create({
              data: {
                businessId,
                languageName: languageConfigDto.languageName
              }
            });

            await prisma.audit.create({
              data: {
                action: AuditActionType.CREATE,
                entityId: languageConfig.id,
                entityType: 'classLanguage',
                performedById: user.id
              }
            });

            return languageConfig;
          })
        );

        const registrationConfigs = await Promise.all(
          registration.map(async (registrationConfigDto) => {
            const registrationConfig = await prisma.classRegistrationConfig.create({
              data: {
                businessId,
                closeBeforeStartInterval: registrationConfigDto.closeRegistration,
                finalRegistrationCloseInterval: registrationConfigDto.finalRegistration
              }
            });

            await prisma.audit.create({
              data: {
                action: AuditActionType.CREATE,
                entityId: registrationConfig.id,
                entityType: 'classRegistrationConfig',
                performedById: user.id
              }
            });

            return registrationConfig;
          })
        );

        return {
          priceConfigs,
          languageConfigs,
          registrationConfigs
        };
      });

      // Formatear la respuesta para que coincida con ClassConfigData
      const formattedResponse: ClassConfigData = {
        priceConfig: newConfigs.priceConfigs.map((config) => ({
          id: config.id,
          classTypeUser: config.classTypeUser,
          price: config.price,
          typeCurrency: config.typeCurrency
        })),
        languageConfig: newConfigs.languageConfigs.map((config) => ({
          id: config.id,
          languageName: config.languageName
        })),
        registrationConfig: newConfigs.registrationConfigs.map((config) => ({
          id: config.id,
          closeBeforeStartInterval: config.closeBeforeStartInterval,
          finalRegistrationCloseInterval: config.finalRegistrationCloseInterval
        }))
      };

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Classes configuration created successfully',
        data: formattedResponse
      };
    } catch (error) {
      this.logger.error(`Error creating classes configuration: ${error.message}`, error.stack);

      if (newConfigs) {
        // Eliminar configuraciones creadas en caso de error
        await this.prisma.classPriceConfig.deleteMany({
          where: { businessId }
        });
        await this.prisma.classLanguage.deleteMany({ where: { businessId } });
        await this.prisma.classRegistrationConfig.deleteMany({
          where: { businessId }
        });
        this.logger.error(
          `Configurations for businessId ${businessId} have been deleted due to error in creation.`
        );
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      if (Array.isArray(error) && error[0] instanceof ValidationError) {
        const validationErrors = error
          .map((err) => Object.values(err.constraints).join(', '))
          .join('; ');
        throw new BadRequestException(`${validationErrors}`);
      }

      throw new BadRequestException('Error creating classes configuration');
    }
  }

  findAll() {
    return `This action returns all classesConfig`;
  }

  findOne(id: number) {
    return `This action returns a #${id} classesConfig`;
  }

  update(id: number, updateClassesConfigDto: UpdateClassesConfigDto) {
    return `This action updates a #${id} ${updateClassesConfigDto}classesConfig`;
  }

  remove(id: number) {
    return `This action removes a #${id} classesConfig`;
  }
}
