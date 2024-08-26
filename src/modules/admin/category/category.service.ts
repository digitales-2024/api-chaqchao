import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryData, HttpResponse, UserData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { AuditActionType } from '@prisma/client';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creacion de una nueva categoria
   * @param createCategoryDto Data de la categoria
   * @param user Usuario que crea la categoria
   * @returns Categoria creada
   */
  async create(
    createCategoryDto: CreateCategoryDto,
    user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    try {
      const { name } = createCategoryDto;

      await this.findByName(name);

      const newCategory = await this.prisma.category.create({
        data: createCategoryDto,
        select: { id: true, name: true, description: true }
      });

      await this.prisma.audit.create({
        data: {
          entityId: newCategory.id,
          action: AuditActionType.CREATE,
          performedById: user.id,
          entityType: 'category'
        }
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Category created',
        data: newCategory
      };
    } catch (error) {
      this.logger.error('Error create category');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error create category');
    }
  }

  /**
   * Mostrar un listado de todas las categorias activas
   * @returns Todas las categorias activas
   */
  async findAll(): Promise<CategoryData[]> {
    try {
      return await this.prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, description: true }
      });
    } catch (error) {
      this.logger.error('Error get all categories');
      handleException(error, 'Error get all categories');
    }
  }

  /**
   * Mostrar categoria por id
   * @param id Id de la categoria
   * @returns Categoria buscada
   */
  async findOne(id: string): Promise<CategoryData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get category');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get category');
    }
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category ${updateCategoryDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }

  /**
   * Valida si es que existe la categoria por nombre
   * @param name Nombre de la categoria
   * @returns Si existe la categoria te retorna el mensaje de error si no te retorna la categoria
   */
  async findByName(name: string): Promise<CategoryData> {
    const categoryDB = await this.prisma.category.findFirst({
      where: { name },
      select: { id: true, name: true, description: true, isActive: true }
    });
    if (!categoryDB.isActive) {
      throw new BadRequestException('This category exist, but is inactive');
    }
    if (categoryDB) {
      throw new BadRequestException('This category exists');
    }
    return categoryDB;
  }

  /**
   * Valida si es que existe la categoria por id
   * @param id Id de la categoria
   * @returns Si existe la categoria te retorna el mensaje de error si no te retorna la categoria
   */
  async findById(id: string): Promise<CategoryData> {
    const categoryDB = await this.prisma.category.findFirst({
      where: { id },
      select: { id: true, name: true, description: true, isActive: true }
    });
    if (!categoryDB) {
      throw new BadRequestException('This category doesnt exist');
    }
    if (!categoryDB.isActive) {
      throw new BadRequestException('This category exist, but is inactive');
    }

    return categoryDB;
  }
}
