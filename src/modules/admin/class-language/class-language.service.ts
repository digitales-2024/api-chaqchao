import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateClassLanguageDto } from './dto/create-class-language.dto';
import { UpdateClassLanguageDto } from './dto/update-class-language.dto';
import { ClassLanguageData, HttpResponse, UserData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditActionType } from '@prisma/client';
import { BusinessConfigService } from '../business-config/business-config.service';

@Injectable()
export class ClassLanguageService {
  private readonly logger = new Logger(ClassLanguageService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessConfigService: BusinessConfigService
  ) {}

  /**
   * Crear un class language
   * @param createClassLanguageDto Data para crear un class language
   * @param user Usuario que crea el class language
   * @returns ClassLanguage creado
   */
  async create(
    createClassLanguageDto: CreateClassLanguageDto,
    user: UserData
  ): Promise<HttpResponse<ClassLanguageData>> {
    const { businessId, languageName } = createClassLanguageDto;
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el businessId
        const businessConfigDB = await this.businessConfigService.findOne(businessId);
        if (!businessConfigDB) {
          throw new NotFoundException('Business config not found');
        }

        // Crear el registro de class language
        const newClassLanguage = await prisma.classLanguage.create({
          data: {
            languageName,
            businessId
          }
        });

        // Registrar la auditoría de la creación
        await prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: newClassLanguage.id,
            entityType: 'classPriceConfig',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.CREATED,
          message: 'Class price created',
          data: {
            id: newClassLanguage.id,
            languageName: newClassLanguage.languageName
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error creating class language: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error creating class language');
    }
  }

  /**
   * Obtener todos los class language
   * @returns Lista de class language
   */
  async findAll(): Promise<ClassLanguageData[]> {
    try {
      const classLanguages = await this.prisma.classLanguage.findMany({
        select: {
          id: true,
          languageName: true
        }
      });

      return classLanguages.map((classLanguage) => ({
        id: classLanguage.id,
        languageName: classLanguage.languageName
      })) as ClassLanguageData[];
    } catch (error) {
      this.logger.error(`Error fetching class language: ${error.message}`, error.stack);
      throw new BadRequestException('Error fetching class language');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} classLanguage`;
  }

  update(id: number, updateClassLanguageDto: UpdateClassLanguageDto) {
    return `This action updates a #${id} ${updateClassLanguageDto} classLanguage`;
  }

  remove(id: number) {
    return `This action removes a #${id} classLanguage`;
  }
}
