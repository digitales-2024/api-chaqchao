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

  findAll() {
    return `This action returns all category`;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
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
      select: { id: true, name: true, description: true }
    });
    console.log(!categoryDB);
    if (categoryDB) {
      throw new BadRequestException('This category exists');
    }
    return categoryDB;
  }
}
