import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryData, HttpResponse, UserData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { AuditActionType } from '@prisma/client';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly product: ProductsService
  ) {}

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

  /**
   * Actualizar una categoria en la base de datos
   * @param id Id de la categoria
   * @param updateCategoryDto Data de Categoria
   * @param user Usuario que actualiza la categoria
   * @returns Categoria actualizada
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    try {
      // Obtener la categoría actual desde la base de datos
      const categoryDB = await this.findById(id);

      const { name } = updateCategoryDto;

      if (!!name) {
        const hasChanges: boolean = name === categoryDB.name;
        if (!hasChanges) {
          const updateCategory = await this.prisma.$transaction(async (prisma) => {
            // Proceder a actualizar los datos si ha habido cambios
            const updatedCategory = await prisma.category.update({
              where: { id },
              data: updateCategoryDto,
              select: {
                id: true,
                name: true,
                description: true
              }
            });
            // Registrar la auditoría de la actualización
            await this.prisma.audit.create({
              data: {
                entityId: updatedCategory.id,
                action: AuditActionType.UPDATE,
                performedById: user.id,
                entityType: 'category'
              }
            });
            return updatedCategory;
          });
          return {
            statusCode: HttpStatus.OK,
            message: 'Category updated successfully',
            data: {
              id: updateCategory.id,
              name: updateCategory.name,
              description: updateCategory.description
            }
          };
        }
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Category updated successfully',
        data: categoryDB
      };
    } catch (error) {
      this.logger.error(`Error updating a category for id: ${id}`, error.stack);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error updating a category');
    }
  }

  /**
   * Eliminar categoria por id
   * @param id Id de la categoria
   * @param user Usuario que elimina la categoria
   * @returns Categoria eliminada
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<CategoryData>> {
    try {
      await this.findById(id);
      const productsDB = await this.product.findProductsByIdCategory(id);
      const isAllProductsActive = productsDB.every((product) => product.isActive);
      if (productsDB.length > 0 && isAllProductsActive) {
        throw new BadRequestException('Category asigned to product');
      }
      const isAllProductsInactive = productsDB.every((product) => !product.isActive);
      let categoryDelete: CategoryData;
      if (isAllProductsInactive) {
        categoryDelete = await this.prisma.category.update({
          where: { id },
          data: { isActive: false },
          select: { id: true, name: true, description: true }
        });
      } else {
        categoryDelete = await this.prisma.category.delete({
          where: { id },
          select: { id: true, name: true, description: true }
        });
      }

      await this.prisma.audit.create({
        data: {
          entityId: id,
          action: AuditActionType.DELETE,
          performedById: user.id,
          entityType: 'category'
        }
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Category deleted',
        data: categoryDelete
      };
    } catch (error) {
      this.logger.error(`Error delete category by id ${id}`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error delete category');
    }
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

    if (categoryDB) {
      throw new BadRequestException('This category exists');
    }

    if (!!categoryDB && !categoryDB.isActive) {
      throw new BadRequestException('This category exist, but is inactive');
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
    if (!!categoryDB && !categoryDB.isActive) {
      throw new BadRequestException('This category exist, but is inactive');
    }

    return categoryDB;
  }

  /**
   * Reactivar categoria
   * @param id Id de la categoria
   * @param user Usuario que reactiva la categoria
   * @returns Categoria activada
   */
  async reactivate(id: string, user: UserData): Promise<HttpResponse<CategoryData>> {
    try {
      const categoryReactivate = await this.prisma.$transaction(async (prisma) => {
        const categoryDB = await prisma.category.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        });

        if (!categoryDB) {
          throw new NotFoundException('Category not found');
        }

        if (categoryDB.isActive) {
          throw new BadRequestException('Category is already active');
        }

        await prisma.category.update({
          where: { id },
          data: {
            isActive: true
          }
        });

        // Crear un registro de auditoria
        await this.prisma.audit.create({
          data: {
            entityId: categoryDB.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'category'
          }
        });

        return {
          id: categoryDB.id,
          name: categoryDB.name,
          description: categoryDB.description
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Category reactivated',
        data: categoryReactivate
      };
    } catch (error) {
      this.logger.error(`Error reactivating a category for id: ${id}`, error.stack);
      handleException(error, 'Error reactivating a category');
    }
  }

  /**
   * Desactivar categoria
   * @param id Id de la categoria
   * @param user Usuario que desactiva la categoria
   * @returns Categoria desactivada
   */
  async desactivate(id: string, user: UserData): Promise<HttpResponse<CategoryData>> {
    try {
      const categoryDesactivate = await this.prisma.$transaction(async (prisma) => {
        const categoryDB = await prisma.category.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        });

        if (!categoryDB) {
          throw new NotFoundException('Category not found');
        }

        if (!categoryDB.isActive) {
          throw new BadRequestException('Category is already desactive');
        }

        await prisma.category.update({
          where: { id },
          data: {
            isActive: false
          }
        });

        // Crear un registro de auditoria
        await this.prisma.audit.create({
          data: {
            entityId: categoryDB.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'category'
          }
        });

        return {
          id: categoryDB.id,
          name: categoryDB.name,
          description: categoryDB.description
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Category desactivated',
        data: categoryDesactivate
      };
    } catch (error) {
      this.logger.error(`Error desactivating a category for id: ${id}`, error.stack);
      handleException(error, 'Error desactivating a category');
    }
  }
}
