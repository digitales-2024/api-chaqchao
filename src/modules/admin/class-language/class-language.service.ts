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
import { handleException } from 'src/utils';

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

        // Validar si el languageName ya existe
        const existingLanguage = await prisma.classLanguage.findUnique({
          where: { languageName }
        });
        if (existingLanguage) {
          throw new BadRequestException(`Language name already exists`);
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
            entityType: 'classLanguage',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.CREATED,
          message: 'Class language created',
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

  /**
   * Obtener un class language por id
   * @param id Id del class language
   * @returns Class language
   */
  async findOne(id: string): Promise<ClassLanguageData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get class language');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get class language');
    }
  }

  /**
   * Obtener un class language por id
   * @param id Id del class language
   * @returns Class language
   */
  async findById(id: string) {
    const classLanguage = await this.prisma.classLanguage.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        languageName: true
      }
    });

    // Validar si existe el class language
    if (!classLanguage) {
      throw new BadRequestException('Class language not found');
    }

    return {
      id: classLanguage.id,
      languageName: classLanguage.languageName
    };
  }

  /**
   * Actualizar un class language
   * @param id Id del class language
   * @param updateClassLanguageDto Data para actualizar el class language
   * @param user Usuario que actualiza el class language
   * @returns Class language actualizado
   */
  async update(
    id: string,
    updateClassLanguageDto: UpdateClassLanguageDto,
    user: UserData
  ): Promise<HttpResponse<ClassLanguageData>> {
    const { languageName } = updateClassLanguageDto;
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el class language
        const classLanguage = await this.findById(id);

        // Verificar si hay cambios
        const hasChanges = classLanguage.languageName !== languageName;

        if (!hasChanges || !languageName) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Class language updated',
            data: {
              id: classLanguage.id,
              languageName: classLanguage.languageName
            }
          };
        }

        // Validar si el languageName ya existe
        const existingLanguage = await prisma.classLanguage.findUnique({
          where: { languageName }
        });
        if (existingLanguage) {
          throw new BadRequestException(`Language name already exists`);
        }

        // Actualizar el class language
        const updatedClassLanguage = await prisma.classLanguage.update({
          where: {
            id
          },
          data: {
            languageName
          }
        });

        // Registrar la auditoría de la actualización
        await prisma.audit.create({
          data: {
            action: AuditActionType.UPDATE,
            entityId: updatedClassLanguage.id,
            entityType: 'classLanguage',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Class language updated',
          data: {
            id: updatedClassLanguage.id,
            languageName: updatedClassLanguage.languageName
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error updating class language: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error updating class language');
    }
  }

  /**
   * Eliminar un class language
   * @param id Id del class language
   * @param user Usuario que elimina el class language
   * @returns Class language eliminado
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<ClassLanguageData>> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validar si existe el class language
        const classLanguage = await this.findById(id);

        // Eliminar el class language
        await prisma.classLanguage.delete({
          where: {
            id
          }
        });

        // Registrar la auditoría de la eliminación
        await prisma.audit.create({
          data: {
            action: AuditActionType.DELETE,
            entityId: classLanguage.id,
            entityType: 'classLanguage',
            performedById: user.id
          }
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Class language deleted',
          data: {
            id: classLanguage.id,
            languageName: classLanguage.languageName
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error deleting class language: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error deleting class language');
    }
  }

  async findLanguageByName(languageName: string): Promise<ClassLanguageData> {
    const classLanguage = await this.prisma.classLanguage.findUnique({
      where: {
        languageName
      },
      select: {
        id: true,
        languageName: true
      }
    });

    // Validar si existe el class language
    if (!classLanguage) {
      throw new BadRequestException('Class language not found');
    }

    return {
      id: classLanguage.id,
      languageName: classLanguage.languageName
    };
  }
}
